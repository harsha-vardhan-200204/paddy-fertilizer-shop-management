import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const settingsPath = path.resolve(__dirname, "../data/business_insight_settings.json");

const defaultSettings = {
  dead_stock_days: 60,
  target_stock_days: 30,
  critical_stock_days: 7,
  expiry_warning_days: 90,
  credit_warning_amount: 25000
};

export class BusinessIntelligenceService {
  constructor() {
    this.cachedSettings = null;
  }

  async getSettings() {
    if (this.cachedSettings) return this.cachedSettings;
    try {
      await fs.mkdir(path.dirname(settingsPath), { recursive: true });
      const raw = await fs.readFile(settingsPath, "utf8");
      this.cachedSettings = { ...defaultSettings, ...JSON.parse(raw) };
    } catch (_err) {
      this.cachedSettings = { ...defaultSettings };
      await this.saveSettings(this.cachedSettings);
    }
    return this.cachedSettings;
  }

  async saveSettings(settings) {
    this.cachedSettings = { ...defaultSettings, ...settings };
    try {
      await fs.writeFile(settingsPath, JSON.stringify(this.cachedSettings, null, 2), "utf8");
    } catch (err) {
      console.error("[BI Service] Error saving settings:", err);
    }
    return this.cachedSettings;
  }

  /**
   * Main analytics aggregator that returns complete Business Intelligence
   */
  async getOverview(store, query = {}) {
    const settings = await this.getSettings();

    // 1. Fetch raw data from store
    const [sales, saleItems, purchases, purchaseItems, products, customers, suppliers, payments] = await Promise.all([
      store.list("sales"),
      store.list("sale_items"),
      store.list("purchases"),
      store.list("purchase_items"),
      store.list("products"),
      store.list("customers"),
      store.list("suppliers"),
      store.list("payments")
    ]);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    // 2. Parse Period & Date Filters
    const period = query.period || "30d"; // today, 7d, 30d, 3m, 6m, 1y, fy, all
    let daysInPeriod = 30;
    let periodStartDate = new Date(todayDate);

    if (period === "today") {
      daysInPeriod = 1;
    } else if (period === "7d") {
      daysInPeriod = 7;
      periodStartDate.setDate(todayDate.getDate() - 7);
    } else if (period === "30d") {
      daysInPeriod = 30;
      periodStartDate.setDate(todayDate.getDate() - 30);
    } else if (period === "3m") {
      daysInPeriod = 90;
      periodStartDate.setDate(todayDate.getDate() - 90);
    } else if (period === "6m") {
      daysInPeriod = 180;
      periodStartDate.setDate(todayDate.getDate() - 180);
    } else if (period === "1y") {
      daysInPeriod = 365;
      periodStartDate.setDate(todayDate.getDate() - 365);
    } else if (period === "fy") {
      // Indian Financial Year: April 1 to March 31
      const currentMonth = todayDate.getMonth(); // 0-11
      const fyYear = currentMonth >= 3 ? todayDate.getFullYear() : todayDate.getFullYear() - 1;
      periodStartDate = new Date(fyYear, 3, 1);
      daysInPeriod = Math.max(1, Math.round((todayDate - periodStartDate) / (24 * 60 * 60 * 1000)));
    } else if (period === "all") {
      daysInPeriod = 365;
      periodStartDate = new Date("2000-01-01");
    }

    const periodStartStr = periodStartDate.toISOString().slice(0, 10);

    // Compute previous period for growth comparison
    const previousPeriodEnd = new Date(periodStartDate);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysInPeriod);
    const prevStartStr = previousPeriodStart.toISOString().slice(0, 10);
    const prevEndStr = previousPeriodEnd.toISOString().slice(0, 10);

    // Filter sales and purchases
    const currentPeriodSales = sales.filter(s => {
      const d = String(s.date).slice(0, 10);
      return d >= periodStartStr && d <= todayStr;
    });

    const prevPeriodSales = sales.filter(s => {
      const d = String(s.date).slice(0, 10);
      return d >= prevStartStr && d <= prevEndStr;
    });

    const currentPeriodPurchases = purchases.filter(p => {
      const d = String(p.purchase_date).slice(0, 10);
      return d >= periodStartStr && d <= todayStr;
    });

    const prevPeriodPurchases = purchases.filter(p => {
      const d = String(p.purchase_date).slice(0, 10);
      return d >= prevStartStr && d <= prevEndStr;
    });

    // 3. Sales KPIs
    const thisMonthStr = todayStr.slice(0, 7);
    const prevMonthDate = new Date(todayDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);
    const thisYearStr = todayStr.slice(0, 4);

    const todaySales = sales.filter(s => String(s.date).slice(0, 10) === todayStr)
      .reduce((sum, s) => sum + Number(s.grand_total || 0), 0);

    const sevenDaysAgoStr = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const thisWeekSales = sales.filter(s => String(s.date).slice(0, 10) >= sevenDaysAgoStr)
      .reduce((sum, s) => sum + Number(s.grand_total || 0), 0);

    const thisMonthSales = sales.filter(s => String(s.date).startsWith(thisMonthStr))
      .reduce((sum, s) => sum + Number(s.grand_total || 0), 0);

    const prevMonthSales = sales.filter(s => String(s.date).startsWith(prevMonthStr))
      .reduce((sum, s) => sum + Number(s.grand_total || 0), 0);

    const thisYearSales = sales.filter(s => String(s.date).startsWith(thisYearStr))
      .reduce((sum, s) => sum + Number(s.grand_total || 0), 0);

    const periodSalesTotal = currentPeriodSales.reduce((sum, s) => sum + Number(s.grand_total || 0), 0);
    const prevPeriodSalesTotal = prevPeriodSales.reduce((sum, s) => sum + Number(s.grand_total || 0), 0);

    const salesGrowth = prevPeriodSalesTotal > 0
      ? Math.round(((periodSalesTotal - prevPeriodSalesTotal) / prevPeriodSalesTotal) * 1000) / 10
      : (periodSalesTotal > 0 ? 100 : 0);

    const salesGrowthIndicator = salesGrowth > 1 ? "increasing" : (salesGrowth < -1 ? "decreasing" : "stable");

    const invoicesCount = currentPeriodSales.length;
    const uniqueCustomers = new Set(currentPeriodSales.map(s => s.customer_id).filter(Boolean)).size;
    const avgInvoiceValue = invoicesCount > 0 ? Math.round(periodSalesTotal / invoicesCount) : 0;
    const avgDailySales = daysInPeriod > 0 ? Math.round(periodSalesTotal / daysInPeriod) : 0;

    // 4. Products Analysis & Profitability
    const currentSaleIds = new Set(currentPeriodSales.map(s => s.id));
    const currentPeriodSaleItems = saleItems.filter(item => currentSaleIds.has(item.sale_id));

    // Aggregations per product
    const productSalesAgg = {};
    for (const item of currentPeriodSaleItems) {
      const pId = item.product_id;
      if (!pId) continue;
      if (!productSalesAgg[pId]) {
        productSalesAgg[pId] = { qty: 0, amount: 0, cost: 0 };
      }
      productSalesAgg[pId].qty += Number(item.qty || 0);
      productSalesAgg[pId].amount += Number(item.total || 0);
    }

    // Historical all-time sales per product for last-sale-date & velocity
    const productLastSaleMap = {};
    const productAllTimeQty = {};
    for (const item of saleItems) {
      const pId = item.product_id;
      if (!pId) continue;
      const sale = sales.find(s => s.id === item.sale_id);
      const saleDate = sale ? String(sale.date).slice(0, 10) : "";
      if (saleDate && (!productLastSaleMap[pId] || saleDate > productLastSaleMap[pId])) {
        productLastSaleMap[pId] = saleDate;
      }
      productAllTimeQty[pId] = (productAllTimeQty[pId] || 0) + Number(item.qty || 0);
    }

    // Latest purchase price lookup from purchases
    const productLatestBuyPriceMap = {};
    for (const pItem of purchaseItems) {
      const pId = pItem.product_id;
      if (!pId) continue;
      const rate = Number(pItem.purchase_rate || 0);
      if (rate > 0) {
        productLatestBuyPriceMap[pId] = rate;
      }
    }

    let totalInventoryValue = 0;
    let fastMovingValue = 0;
    let slowMovingValue = 0;
    let deadStockValue = 0;
    let expiryRiskValue = 0;

    let periodGrossProfit = 0;

    const analyzedProducts = products.map(prod => {
      const pId = prod.id;
      const agg = productSalesAgg[pId] || { qty: 0, amount: 0, cost: 0 };
      const currentStock = Number(prod.current_stock || 0);
      const purchasePrice = Number(prod.purchase_price || productLatestBuyPriceMap[pId] || 0);
      const sellingPrice = Number(prod.selling_price || 0);
      const mrp = Number(prod.mrp || 0);
      const minStockAlert = Number(prod.minimum_stock_alert || 0);

      const stockValue = Math.round(currentStock * purchasePrice);
      totalInventoryValue += Math.max(0, stockValue);

      const qtySold = agg.qty;
      const salesAmount = agg.amount;
      const purchaseCost = Math.round(qtySold * purchasePrice);
      const grossProfit = Math.round(salesAmount - purchaseCost);
      periodGrossProfit += grossProfit;
      const profitMargin = salesAmount > 0 ? Math.round((grossProfit / salesAmount) * 1000) / 10 : 0;

      const dailyVelocity = daysInPeriod > 0 ? (qtySold / daysInPeriod) : 0;
      const avgDailySalesFormatted = Math.round(dailyVelocity * 100) / 100;

      let estimatedDaysRemaining = 999;
      if (dailyVelocity > 0) {
        estimatedDaysRemaining = currentStock <= 0 ? 0 : Math.round(currentStock / dailyVelocity);
      } else if (currentStock <= 0) {
        estimatedDaysRemaining = 0;
      }

      // Last sale date & dead stock check
      const lastSaleDate = productLastSaleMap[pId] || "";
      let daysSinceLastSale = 999;
      if (lastSaleDate) {
        daysSinceLastSale = Math.max(0, Math.round((todayDate - new Date(lastSaleDate)) / (24 * 60 * 60 * 1000)));
      }

      // Expiry check
      let daysUntilExpiry = 999;
      let expiryStatus = "Safe";
      if (prod.expiry_date) {
        daysUntilExpiry = Math.round((new Date(prod.expiry_date) - todayDate) / (24 * 60 * 60 * 1000));
        if (daysUntilExpiry <= 30) expiryStatus = "Critical";
        else if (daysUntilExpiry <= 60) expiryStatus = "High Risk";
        else if (daysUntilExpiry <= settings.expiry_warning_days) expiryStatus = "Medium Risk";
      }

      // Stock status determination
      let status = "Healthy Stock";
      let velocity = "Normal Moving";

      const isDeadStock = (daysSinceLastSale >= settings.dead_stock_days || (!lastSaleDate && daysInPeriod >= 30)) && currentStock > 0;
      const isOverstocked = estimatedDaysRemaining > 120 && currentStock > 30;

      if (isDeadStock) {
        status = "Dead Stock";
        velocity = "Dead Stock";
        deadStockValue += Math.max(0, stockValue);
      } else if (daysUntilExpiry <= settings.expiry_warning_days && currentStock > 0) {
        status = "Expiry Risk";
        expiryRiskValue += Math.max(0, stockValue);
      } else if (estimatedDaysRemaining <= settings.critical_stock_days || currentStock <= 0) {
        status = "Critical Stock";
      } else if (currentStock <= minStockAlert) {
        status = "Low Stock";
      } else if (isOverstocked) {
        status = "Overstocked";
        slowMovingValue += Math.max(0, stockValue);
      } else {
        status = "Healthy Stock";
      }

      if (velocity !== "Dead Stock") {
        if (estimatedDaysRemaining <= 30 && qtySold > 0) {
          velocity = "Fast Moving";
          fastMovingValue += Math.max(0, stockValue);
        } else if (estimatedDaysRemaining > 90 || qtySold === 0) {
          velocity = "Slow Moving";
          slowMovingValue += Math.max(0, stockValue);
        } else {
          velocity = "Normal Moving";
        }
      }

      // Profitability Quadrant
      let profitabilityQuadrant = "Low Sales / Low Margin";
      if (salesAmount >= (periodSalesTotal * 0.05)) {
        profitabilityQuadrant = profitMargin >= 12 ? "High Profit" : "High Sales / Low Margin";
      } else {
        profitabilityQuadrant = profitMargin >= 15 ? "Low Sales / High Margin" : "Low Sales / Low Margin";
      }

      // Target Stock & Recommended Purchase
      const targetCoverageDays = settings.target_stock_days || 30;
      const targetStockLevel = Math.max(minStockAlert, Math.ceil(dailyVelocity * targetCoverageDays));
      const recommendedPurchaseQty = Math.max(0, targetStockLevel - currentStock);

      return {
        id: prod.id,
        name: prod.name,
        brand: prod.brand || "Generic",
        category: prod.category || prod.product_type || "Fertilizer",
        product_type: prod.product_type,
        batch_number: prod.batch_number || "BATCH-01",
        unit: prod.unit || "Bag",
        current_stock: currentStock,
        minimum_stock_alert: minStockAlert,
        target_stock: targetStockLevel,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        mrp: mrp,
        stock_value: stockValue,
        quantity_sold: qtySold,
        sales_amount: salesAmount,
        purchase_cost: purchaseCost,
        gross_profit: grossProfit,
        profit_margin: profitMargin,
        avg_daily_sales: avgDailySalesFormatted,
        estimated_days_remaining: estimatedDaysRemaining,
        days_since_last_sale: daysSinceLastSale,
        last_sale_date: lastSaleDate,
        expiry_date: prod.expiry_date || null,
        days_until_expiry: daysUntilExpiry,
        expiry_status: expiryStatus,
        stock_status: status,
        velocity: velocity,
        profitability_quadrant: profitabilityQuadrant,
        recommended_purchase_qty: recommendedPurchaseQty,
        supplier_id: prod.supplier_id,
        supplier_name: prod.supplier_name || "Primary Supplier"
      };
    });

    // 5. Smart Purchase Recommendations ("What Should I Purchase?")
    const purchaseRecommendations = analyzedProducts
      .filter(p => p.recommended_purchase_qty > 0 && (p.stock_status === "Critical Stock" || p.stock_status === "Low Stock" || p.estimated_days_remaining <= 15))
      .sort((a, b) => a.estimated_days_remaining - b.estimated_days_remaining)
      .map(p => {
        let reason = "";
        if (p.current_stock <= 0) {
          reason = `Stock is completely depleted (0 ${p.unit}s). High daily demand of ${p.avg_daily_sales} ${p.unit}s/day.`;
        } else if (p.estimated_days_remaining <= settings.critical_stock_days) {
          reason = `Critical stock level! At ${p.avg_daily_sales} ${p.unit}s/day, stock will run out in ~${p.estimated_days_remaining} days.`;
        } else {
          reason = `Current stock (${p.current_stock} ${p.unit}s) has dropped below minimum threshold (${p.minimum_stock_alert} ${p.unit}s).`;
        }

        return {
          product_id: p.id,
          product_name: p.name,
          brand: p.brand,
          unit: p.unit,
          current_stock: p.current_stock,
          avg_daily_sales: p.avg_daily_sales,
          estimated_days_remaining: p.estimated_days_remaining,
          minimum_stock: p.minimum_stock_alert,
          target_stock: p.target_stock,
          recommended_qty: p.recommended_purchase_qty,
          estimated_cost: Math.round(p.recommended_purchase_qty * p.purchase_price),
          supplier_name: p.supplier_name,
          purchase_price: p.purchase_price,
          selling_price: p.selling_price,
          reason
        };
      });

    // 6. Overstock Detection
    const overstockedProducts = analyzedProducts
      .filter(p => p.stock_status === "Overstocked" || (p.estimated_days_remaining > 90 && p.stock_value > 15000))
      .sort((a, b) => b.stock_value - a.stock_value)
      .map(p => {
        const monthsCoverage = p.avg_daily_sales > 0
          ? (Math.round((p.current_stock / (p.avg_daily_sales * 30)) * 10) / 10)
          : 12;

        let recommendedAction = "Stop purchasing temporarily; ";
        if (p.profit_margin > 15) {
          recommendedAction += "Offer customer promotion or volume discount to liquidate capital.";
        } else {
          recommendedAction += "Bundle with fast-moving seeds/fertilizers to clear stock.";
        }

        return {
          product_id: p.id,
          product_name: p.name,
          brand: p.brand,
          unit: p.unit,
          current_stock: p.current_stock,
          stock_value: p.stock_value,
          monthly_sales: Math.round(p.avg_daily_sales * 30),
          estimated_months_coverage: monthsCoverage,
          recommended_action: recommendedAction
        };
      });

    // 7. Expiry Intelligence (FEFO)
    const expiryRiskProducts = analyzedProducts
      .filter(p => p.expiry_status !== "Safe" && p.current_stock > 0 && p.expiry_date)
      .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
      .map(p => {
        let action = "Prioritize selling this batch before newer stock (First Expiry, First Out).";
        if (p.days_until_expiry <= 30) {
          action = "Urgent: Apply 10-15% clearance discount or return to supplier if warranty allows.";
        }

        return {
          product_id: p.id,
          product_name: p.name,
          brand: p.brand,
          batch_number: p.batch_number,
          current_stock: p.current_stock,
          unit: p.unit,
          expiry_date: p.expiry_date,
          days_until_expiry: p.days_until_expiry,
          risk_level: p.expiry_status,
          stock_value_at_risk: p.stock_value,
          recommended_action: action
        };
      });

    // 8. Customer Business Analysis & Retention
    const customerSalesMap = {};
    for (const sale of currentPeriodSales) {
      const cId = sale.customer_id;
      if (!cId) continue;
      if (!customerSalesMap[cId]) {
        customerSalesMap[cId] = { total: 0, count: 0, lastDate: "" };
      }
      customerSalesMap[cId].total += Number(sale.grand_total || 0);
      customerSalesMap[cId].count += 1;
      const sDate = String(sale.date).slice(0, 10);
      if (!customerSalesMap[cId].lastDate || sDate > customerSalesMap[cId].lastDate) {
        customerSalesMap[cId].lastDate = sDate;
      }
    }

    const analyzedCustomers = customers.map(cust => {
      const cId = cust.id;
      const agg = customerSalesMap[cId] || { total: 0, count: 0, lastDate: "" };
      const outstandingAmount = Number(cust.pending_balance || 0);

      const daysSinceLastPurchase = agg.lastDate
        ? Math.max(0, Math.round((todayDate - new Date(agg.lastDate)) / (24 * 60 * 60 * 1000)))
        : 999;

      let segment = "Active";
      if (agg.total >= (periodSalesTotal * 0.1) && agg.total > 20000) {
        segment = "High-Value";
      } else if (daysSinceLastPurchase >= 60 || (!agg.lastDate && daysInPeriod >= 30)) {
        segment = "Inactive";
      }

      const isCreditRisk = outstandingAmount >= settings.credit_warning_amount;

      return {
        id: cust.id,
        name: cust.name,
        village: cust.village || "Local",
        mobile: cust.mobile || "",
        total_purchases: agg.total,
        invoices_count: agg.count,
        avg_invoice_value: agg.count > 0 ? Math.round(agg.total / agg.count) : 0,
        outstanding_balance: outstandingAmount,
        last_purchase_date: agg.lastDate || null,
        days_since_last_purchase: daysSinceLastPurchase,
        segment,
        is_credit_risk: isCreditRisk
      };
    });

    const topCustomers = [...analyzedCustomers]
      .sort((a, b) => b.total_purchases - a.total_purchases)
      .slice(0, 8);

    const inactiveCustomers = analyzedCustomers
      .filter(c => c.segment === "Inactive")
      .slice(0, 8);

    const creditRiskCustomers = analyzedCustomers
      .filter(c => c.is_credit_risk)
      .sort((a, b) => b.outstanding_balance - a.outstanding_balance);

    const totalOutstandingDues = customers.reduce((sum, c) => sum + Number(c.pending_balance || 0), 0);

    // Customer retention counts
    const newCustomersCount = customers.filter(c => String(c.created_at || "").startsWith(thisMonthStr)).length;
    const activeCustomersCount = analyzedCustomers.filter(c => c.invoices_count > 0).length;

    // 9. Supplier Analysis & Price Comparisons
    const supplierPurchasesMap = {};
    for (const pur of currentPeriodPurchases) {
      const sId = pur.supplier_id;
      if (!sId) continue;
      if (!supplierPurchasesMap[sId]) {
        supplierPurchasesMap[sId] = { total: 0, count: 0, lastDate: "" };
      }
      supplierPurchasesMap[sId].total += Number(pur.total_amount || 0);
      supplierPurchasesMap[sId].count += 1;
      const pDate = String(pur.purchase_date).slice(0, 10);
      if (!supplierPurchasesMap[sId].lastDate || pDate > supplierPurchasesMap[sId].lastDate) {
        supplierPurchasesMap[sId].lastDate = pDate;
      }
    }

    const analyzedSuppliers = suppliers.map(sup => {
      const sId = sup.id;
      const agg = supplierPurchasesMap[sId] || { total: 0, count: 0, lastDate: "" };
      const suppliedProductsCount = products.filter(p => p.supplier_id === sId).length;

      return {
        id: sup.id,
        name: sup.name,
        contact_person: sup.contact_person,
        mobile: sup.mobile,
        gstin: sup.gstin,
        total_purchases: agg.total,
        orders_count: agg.count,
        avg_order_value: agg.count > 0 ? Math.round(agg.total / agg.count) : 0,
        last_purchase_date: agg.lastDate || null,
        products_supplied_count: suppliedProductsCount
      };
    });

    // Cross-supplier price comparison for identical products
    const productSupplierPrices = {};
    for (const pItem of purchaseItems) {
      const pId = pItem.product_id;
      const rate = Number(pItem.purchase_rate || 0);
      const pur = purchases.find(p => p.id === pItem.purchase_id);
      if (!pId || !rate || !pur) continue;

      if (!productSupplierPrices[pId]) productSupplierPrices[pId] = [];
      const existing = productSupplierPrices[pId].find(x => x.supplier_id === pur.supplier_id);
      if (!existing) {
        productSupplierPrices[pId].push({
          supplier_id: pur.supplier_id,
          supplier_name: pur.supplier_name || "Supplier",
          rate
        });
      }
    }

    const priceComparisonOpportunities = [];
    for (const [pId, quotes] of Object.entries(productSupplierPrices)) {
      if (quotes.length >= 2) {
        const prod = products.find(p => p.id === pId);
        if (!prod) continue;
        quotes.sort((a, b) => a.rate - b.rate);
        const lowest = quotes[0];
        const highest = quotes[quotes.length - 1];
        const diff = highest.rate - lowest.rate;
        if (diff > 5) {
          priceComparisonOpportunities.push({
            product_name: prod.name,
            cheaper_supplier: lowest.supplier_name,
            cheaper_rate: lowest.rate,
            expensive_supplier: highest.supplier_name,
            expensive_rate: highest.rate,
            potential_saving_per_unit: diff,
            unit: prod.unit
          });
        }
      }
    }

    // 10. GST Business Analysis
    let outputCGST = 0;
    let outputSGST = 0;
    let taxableSales = 0;
    let nonTaxableSales = 0;

    for (const sale of currentPeriodSales) {
      outputCGST += Number(sale.cgst || 0);
      outputSGST += Number(sale.sgst || 0);
      const subtotal = Number(sale.subtotal || 0);
      if (Number(sale.cgst || 0) > 0 || Number(sale.sgst || 0) > 0) {
        taxableSales += subtotal;
      } else {
        nonTaxableSales += subtotal;
      }
    }

    const currentPurchaseIds = new Set(currentPeriodPurchases.map(p => p.id));
    const currentPeriodPurchaseItems = purchaseItems.filter(p => currentPurchaseIds.has(p.purchase_id));

    let inputGST = 0;
    let taxablePurchases = 0;
    let nonTaxablePurchases = 0;

    for (const pItem of currentPeriodPurchaseItems) {
      const gst = Number(pItem.gst || 0);
      inputGST += gst;
      const base = Number(pItem.total_amount || 0) - gst;
      if (gst > 0) taxablePurchases += base;
      else nonTaxablePurchases += base;
    }

    const inputCGST = Math.round((inputGST / 2) * 100) / 100;
    const inputSGST = Math.round((inputGST / 2) * 100) / 100;
    const outputGST = Math.round((outputCGST + outputSGST) * 100) / 100;
    const estimatedGSTPayable = Math.max(0, Math.round((outputGST - inputGST) * 100) / 100);

    // 11. Timeline Trends (Monthly aggregated for Recharts)
    const monthlyTrendMap = {};
    for (const sale of sales) {
      const m = String(sale.date).slice(0, 7);
      if (!monthlyTrendMap[m]) {
        monthlyTrendMap[m] = { month: m, sales: 0, purchases: 0, profit: 0, gst: 0 };
      }
      monthlyTrendMap[m].sales += Number(sale.grand_total || 0);
      monthlyTrendMap[m].gst += Number(sale.cgst || 0) + Number(sale.sgst || 0);
    }

    for (const pur of purchases) {
      const m = String(pur.purchase_date).slice(0, 7);
      if (!monthlyTrendMap[m]) {
        monthlyTrendMap[m] = { month: m, sales: 0, purchases: 0, profit: 0, gst: 0 };
      }
      monthlyTrendMap[m].purchases += Number(pur.total_amount || 0);
    }

    const timelineTrends = Object.values(monthlyTrendMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(t => ({
        ...t,
        sales: Math.round(t.sales),
        purchases: Math.round(t.purchases),
        profit: Math.round(t.sales * 0.15), // estimated historical margin
        gst: Math.round(t.gst)
      }));

    // 12. Dynamic Business Health Score Calculation (0-100)
    // 8 Sub-components evaluated against actual performance
    let scoreSalesGrowth = 0;
    if (salesGrowth >= 10) scoreSalesGrowth = 15;
    else if (salesGrowth >= 0) scoreSalesGrowth = 10 + (salesGrowth / 10) * 5;
    else if (salesGrowth >= -15) scoreSalesGrowth = Math.max(2, 10 + (salesGrowth / 15) * 8);
    else scoreSalesGrowth = 0;

    const overallProfitMargin = periodSalesTotal > 0 ? (periodGrossProfit / periodSalesTotal) * 100 : 15;
    let scoreProfitMargin = 0;
    if (overallProfitMargin >= 18) scoreProfitMargin = 15;
    else if (overallProfitMargin >= 10) scoreProfitMargin = 10 + ((overallProfitMargin - 10) / 8) * 5;
    else scoreProfitMargin = Math.max(2, (overallProfitMargin / 10) * 10);

    const healthyStockCount = analyzedProducts.filter(p => p.stock_status === "Healthy Stock").length;
    const totalProdCount = Math.max(1, analyzedProducts.length);
    const healthyRatio = healthyStockCount / totalProdCount;
    const scoreStockHealth = Math.round(healthyRatio * 15);

    const fastMovingCount = analyzedProducts.filter(p => p.velocity === "Fast Moving").length;
    const scoreStockTurnover = Math.min(15, Math.round((fastMovingCount / totalProdCount) * 30));

    // Penalties for dead stock and expiry risk
    const deadStockRatio = totalInventoryValue > 0 ? (deadStockValue / totalInventoryValue) : 0;
    const scoreDeadStockControl = Math.max(0, Math.round((1 - deadStockRatio * 3) * 10));

    const expiryRiskRatio = totalInventoryValue > 0 ? (expiryRiskValue / totalInventoryValue) : 0;
    const scoreExpiryControl = Math.max(0, Math.round((1 - expiryRiskRatio * 4) * 10));

    // Credit health (outstanding dues vs sales)
    const creditRatio = periodSalesTotal > 0 ? (totalOutstandingDues / periodSalesTotal) : 0.2;
    let scoreCreditHealth = 10;
    if (creditRatio > 0.5) scoreCreditHealth = 3;
    else if (creditRatio > 0.3) scoreCreditHealth = 6;
    else if (creditRatio > 0.15) scoreCreditHealth = 8;
    else scoreCreditHealth = 10;

    // Purchase efficiency (price comparison opportunities utilized)
    const scorePurchaseEfficiency = priceComparisonOpportunities.length > 0 ? 8 : 10;

    const healthScore = Math.min(100, Math.max(10, Math.round(
      scoreSalesGrowth +
      scoreProfitMargin +
      scoreStockHealth +
      scoreStockTurnover +
      scoreDeadStockControl +
      scoreExpiryControl +
      scoreCreditHealth +
      scorePurchaseEfficiency
    )));

    let healthStatus = "Good";
    if (healthScore >= 80) healthStatus = "Excellent";
    else if (healthScore >= 60) healthStatus = "Good";
    else if (healthScore >= 40) healthStatus = "Needs Attention";
    else healthStatus = "Critical";

    // 13. Automated Business Recommendations (Priority Action System)
    const recommendations = [];

    // Critical: Stockout warnings
    purchaseRecommendations.slice(0, 3).forEach((item, idx) => {
      if (item.estimated_days_remaining <= 5) {
        recommendations.push({
          id: `crit-stock-${idx}`,
          priority: "Critical",
          category: "Inventory",
          impact: "Avoid direct revenue loss & customer churn",
          title: `Reorder ${item.product_name}`,
          reason: item.reason,
          suggestedAction: `Place purchase order for ${item.recommended_qty} ${item.unit}s with ${item.supplier_name}.`
        });
      }
    });

    // Critical / High: Expiry risks (FEFO)
    expiryRiskProducts.slice(0, 2).forEach((item, idx) => {
      recommendations.push({
        id: `exp-${idx}`,
        priority: item.risk_level === "Critical" ? "Critical" : "High",
        category: "Expiry",
        impact: `Save up to ₹${item.stock_value_at_risk.toLocaleString("en-IN")} in expiring inventory`,
        title: `Prioritize Batch ${item.batch_number} (${item.product_name})`,
        reason: `${item.current_stock} ${item.unit}s expire in ${item.days_until_expiry} days.`,
        suggestedAction: item.recommended_action
      });
    });

    // High: Dead stock capital recovery
    if (deadStockValue > 5000) {
      const topDead = analyzedProducts.filter(p => p.stock_status === "Dead Stock").sort((a, b) => b.stock_value - a.stock_value)[0];
      if (topDead) {
        recommendations.push({
          id: "dead-stock-rec",
          priority: "High",
          category: "Capital",
          impact: `Unlock ₹${deadStockValue.toLocaleString("en-IN")} blocked in idle inventory`,
          title: `Liquidate Inactive Stock (${topDead.name})`,
          reason: `No sales recorded in the last ${topDead.days_since_last_sale} days. Stock value: ₹${topDead.stock_value.toLocaleString("en-IN")}.`,
          suggestedAction: "Bundle with fast-moving fertilizers or provide a special seasonal discount to farmers."
        });
      }
    }

    // High: Credit debt follow-ups
    if (creditRiskCustomers.length > 0) {
      const topDebtor = creditRiskCustomers[0];
      recommendations.push({
        id: "credit-followup",
        priority: "High",
        category: "Credit Ledger",
        impact: `Recover pending dues and improve liquidity`,
        title: `Credit Recovery Follow-up (${topDebtor.name})`,
        reason: `Pending balance has reached ₹${topDebtor.outstanding_balance.toLocaleString("en-IN")} (Village: ${topDebtor.village}).`,
        suggestedAction: "Contact farmer or dispatch reminder message before issuing further credit billing."
      });
    }

    // Medium: Supplier cost savings
    priceComparisonOpportunities.slice(0, 2).forEach((item, idx) => {
      recommendations.push({
        id: `sup-saving-${idx}`,
        priority: "Medium",
        category: "Purchasing",
        impact: `Save ₹${item.potential_saving_per_unit} per ${item.unit}`,
        title: `Switch Supplier for ${item.product_name}`,
        reason: `${item.cheaper_supplier} offers this product at ₹${item.cheaper_rate} compared to ${item.expensive_supplier} at ₹${item.expensive_rate}.`,
        suggestedAction: `Procure upcoming orders from ${item.cheaper_supplier} to lower cost of goods sold.`
      });
    });

    // Medium: Promote High Margin / Low Sales Products
    const promoteProducts = analyzedProducts.filter(p => p.profitability_quadrant === "Low Sales / High Margin");
    if (promoteProducts.length > 0) {
      const item = promoteProducts[0];
      recommendations.push({
        id: "promote-high-margin",
        priority: "Medium",
        category: "Sales",
        impact: `Boost gross margins with ${item.profit_margin}% margin profile`,
        title: `Actively Promote ${item.name}`,
        reason: `This item delivers a strong ${item.profit_margin}% margin, but sales velocity is low (${item.quantity_sold} ${item.unit}s sold).`,
        suggestedAction: "Display prominently at checkout or recommend to farmers alongside DAP/Urea."
      });
    }

    // Low: Overstock management
    if (overstockedProducts.length > 0) {
      const over = overstockedProducts[0];
      recommendations.push({
        id: "overstock-reduction",
        priority: "Low",
        category: "Purchasing",
        impact: `Prevent over-concentration of working capital`,
        title: `Pause Purchases for ${over.product_name}`,
        reason: `Current inventory (${over.current_stock} ${over.unit}s) provides ~${over.estimated_months_coverage} months of coverage.`,
        suggestedAction: over.recommended_action
      });
    }

    // 14. Inventory Turnover Ratio
    const cogs = analyzedProducts.reduce((sum, p) => sum + p.purchase_cost, 0);
    const inventoryTurnover = totalInventoryValue > 0
      ? Math.round((cogs / totalInventoryValue) * 100) / 100
      : 1.0;
    const holdingPeriodDays = inventoryTurnover > 0 ? Math.round(365 / inventoryTurnover) : 90;

    return {
      period,
      periodLabel: period.toUpperCase(),
      dateRange: { start: periodStartStr, end: todayStr },
      settings,
      health: {
        score: healthScore,
        status: healthStatus,
        subScores: {
          salesGrowth: scoreSalesGrowth,
          profitMargin: scoreProfitMargin,
          stockHealth: scoreStockHealth,
          stockTurnover: scoreStockTurnover,
          deadStockControl: scoreDeadStockControl,
          expiryControl: scoreExpiryControl,
          creditHealth: scoreCreditHealth,
          purchaseEfficiency: scorePurchaseEfficiency
        }
      },
      salesKPIs: {
        todaySales: Math.round(todaySales),
        thisWeekSales: Math.round(thisWeekSales),
        thisMonthSales: Math.round(thisMonthSales),
        prevMonthSales: Math.round(prevMonthSales),
        thisYearSales: Math.round(thisYearSales),
        periodSales: Math.round(periodSalesTotal),
        prevPeriodSales: Math.round(prevPeriodSalesTotal),
        salesGrowth,
        salesGrowthIndicator,
        invoicesCount,
        uniqueCustomers,
        avgInvoiceValue,
        avgDailySales,
        periodGrossProfit: Math.round(periodGrossProfit),
        grossMarginPercent: overallProfitMargin
      },
      stockSummary: {
        totalProducts: products.length,
        totalStockQty: Math.round(products.reduce((sum, p) => sum + Number(p.current_stock || 0), 0)),
        totalStockValue: Math.round(totalInventoryValue),
        fastMovingValue: Math.round(fastMovingValue),
        slowMovingValue: Math.round(slowMovingValue),
        deadStockValue: Math.round(deadStockValue),
        expiryRiskValue: Math.round(expiryRiskValue),
        criticalStockCount: analyzedProducts.filter(p => p.stock_status === "Critical Stock").length,
        lowStockCount: analyzedProducts.filter(p => p.stock_status === "Low Stock").length,
        overstockedCount: overstockedProducts.length,
        deadStockCount: analyzedProducts.filter(p => p.stock_status === "Dead Stock").length,
        expiringCount: expiryRiskProducts.length,
        inventoryTurnover,
        holdingPeriodDays
      },
      products: analyzedProducts,
      topSellingProducts: [...analyzedProducts].sort((a, b) => b.sales_amount - a.sales_amount).slice(0, 10),
      purchaseRecommendations,
      overstockedProducts,
      expiryRiskProducts,
      customerInsights: {
        totalCustomers: customers.length,
        activeCustomersCount,
        newCustomersCount,
        totalOutstandingDues: Math.round(totalOutstandingDues),
        topCustomers,
        inactiveCustomers,
        creditRiskCustomers
      },
      supplierInsights: {
        totalSuppliers: suppliers.length,
        suppliers: analyzedSuppliers,
        priceComparisonOpportunities
      },
      gstAnalysis: {
        outputCGST,
        outputSGST,
        outputGST,
        inputCGST,
        inputSGST,
        inputGST,
        estimatedGSTPayable,
        taxableSales: Math.round(taxableSales),
        nonTaxableSales: Math.round(nonTaxableSales),
        taxablePurchases: Math.round(taxablePurchases),
        nonTaxablePurchases: Math.round(nonTaxablePurchases)
      },
      timelineTrends,
      recommendations
    };
  }
}

export const businessIntelligence = new BusinessIntelligenceService();
