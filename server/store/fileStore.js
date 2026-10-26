import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { round } from "../utils/reports.js";
import { predictionEngine } from "../services/predictionEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, "../data/store.json");
const isVercel = process.env.VERCEL === "1";

const collections = [
  "users",
  "products",
  "customers",
  "suppliers",
  "sales",
  "sale_items",
  "purchases",
  "purchase_items",
  "payments",
  "stock_logs"
];

export class FileStore {
  kind = "local-file";

  async init() {
    if (isVercel) {
      this.db = Object.fromEntries(collections.map((key) => [key, []]));
      await this.seed();
      return;
    }

    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    try {
      this.db = JSON.parse(await fs.readFile(dataPath, "utf8"));
      let updatedUsers = false;
      this.db.users = this.db.users || [];
      if (!this.db.users.some((u) => u.username === "admin")) {
        this.db.users.push({
          id: id(),
          name: "Shop Admin",
          username: "admin",
          role: "admin",
          password_hash: await bcrypt.hash("admin123", 10)
        });
        updatedUsers = true;
      }
      if (!this.db.users.some((u) => u.username === "maruthi")) {
        this.db.users.push({
          id: id(),
          name: "Junji Maruthi",
          username: "maruthi",
          role: "admin",
          password_hash: await bcrypt.hash("maruthi123", 10)
        });
        updatedUsers = true;
      }
      if (!this.db.users.some((u) => u.username === "staff")) {
        this.db.users.push({
          id: id(),
          name: "Counter Staff",
          username: "staff",
          role: "employee",
          password_hash: await bcrypt.hash("staff123", 10)
        });
        updatedUsers = true;
      }
      if (updatedUsers) {
        await this.persist();
      }
    } catch (_error) {
      this.db = Object.fromEntries(collections.map((key) => [key, []]));
      await this.seed();
      await this.persist();
    }
  }

  async health() {
    return { ok: true };
  }

  async seed() {
    this.db.users.push(
      { id: id(), name: "Junji Maruthi", username: "maruthi", role: "admin", password_hash: await bcrypt.hash("maruthi123", 10) },
      { id: id(), name: "Shop Admin", username: "admin", role: "admin", password_hash: await bcrypt.hash("admin123", 10) },
      { id: id(), name: "Counter Staff", username: "staff", role: "employee", password_hash: await bcrypt.hash("staff123", 10) }
    );
    const supplierId = id();
    this.db.suppliers.push({
      id: supplierId,
      name: "Karnataka Agro Distributors",
      contact_person: "Ramesh Gowda",
      mobile: "9876500011",
      address: "APMC Yard, Mandya",
      gstin: "29AAKCK1234P1Z2",
      outstanding_amount: 0,
      created_at: now()
    });
    this.db.customers.push({
      id: id(),
      name: "Mahadeva",
      mobile: "9900012345",
      village: "Srirangapatna",
      address: "Near Milk Dairy",
      aadhaar: "",
      credit_amount: 0,
      pending_balance: 0,
      created_at: now()
    });
    const products = [
      ["Urea 45kg", "IFFCO", "Fertilizer", "Urea", "31021000", 5, "BAG-UR-2401", "Bag", 245, 300, 285, 120, 20],
      ["DAP 50kg", "Coromandel", "Fertilizer", "DAP", "31053000", 5, "DAP-2402", "Bag", 1200, 1450, 1380, 72, 12],
      ["MOP Potash 50kg", "IPL", "Fertilizer", "Potash", "31042000", 5, "POT-2403", "Bag", 880, 1020, 985, 38, 10],
      ["Paddy Seeds MTU-1010", "Nuziveedu", "Seeds", "Seeds", "10061010", 0, "SED-2401", "Packet", 720, 850, 820, 46, 8],
      ["Zinc Sulphate 10kg", "Zuari", "Micronutrients", "Micronutrients", "28332990", 12, "MIC-2401", "Kg", 410, 520, 495, 15, 6]
    ];
    for (const [name, brand, category, type, hsn_code, gst_percent, batch_number, unit, purchase_price, mrp, selling_price, current_stock, minimum_stock_alert] of products) {
      this.db.products.push({
        id: id(),
        name,
        brand,
        category,
        product_type: type,
        hsn_code,
        gst_percent,
        batch_number,
        manufacture_date: "2026-01-01",
        expiry_date: type === "Seeds" ? "2027-01-01" : "2028-01-01",
        unit,
        purchase_price,
        mrp,
        selling_price,
        current_stock,
        minimum_stock_alert,
        supplier_id: supplierId,
        supplier_name: "Karnataka Agro Distributors",
        created_at: now()
      });
    }
  }

  async persist() {
    if (isVercel) return;
    await fs.writeFile(dataPath, JSON.stringify(this.db, null, 2));
  }

  async findUser(username) {
    return this.db.users.find((user) => user.username === username);
  }

  async list(resource, query = {}) {
    const term = String(query.search || "").toLowerCase();
    let rows = [...(this.db[resource] || [])];
    if (term) {
      rows = rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term)));
    }
    return rows.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }

  async getById(resource, itemId) {
    return this.db[resource]?.find((item) => item.id === itemId);
  }

  async create(resource, data) {
    const record = { id: id(), ...data, created_at: now(), updated_at: now() };
    this.db[resource].push(record);
    await this.persist();
    return record;
  }

  async update(resource, itemId, data) {
    const index = this.db[resource].findIndex((item) => item.id === itemId);
    if (index < 0) throw Object.assign(new Error("Record not found"), { status: 404 });
    this.db[resource][index] = { ...this.db[resource][index], ...data, updated_at: now() };
    await this.persist();
    return this.db[resource][index];
  }

  async remove(resource, itemId) {
    this.db[resource] = this.db[resource].filter((item) => item.id !== itemId);
    if (resource === "purchases") {
      this.db.purchase_items = this.db.purchase_items.filter((item) => item.purchase_id !== itemId);
    }
    await this.persist();
  }

  async adjustStock(productId, data, user) {
    const product = await this.getById("products", productId);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    const qty = Number(data.qty || 0);
    product.current_stock = round(Number(product.current_stock || 0) + qty);
    this.db.stock_logs.push({
      id: id(),
      product_id: productId,
      product_name: product.name,
      type: data.type || "adjustment",
      qty,
      note: data.note || "",
      created_by: user?.name,
      created_at: now()
    });
    await this.persist();
    return product;
  }

  async listSales(query = {}) {
    return this.filterBySearch(this.db.sales, query, ["invoice_number", "customer_name", "mobile"]);
  }

  async getSale(saleId) {
    const sale = this.db.sales.find((item) => item.id === saleId || item.invoice_number === saleId);
    if (!sale) return null;
    return { ...sale, items: this.db.sale_items.filter((item) => item.sale_id === sale.id) };
  }

  async createSale(data, user) {
    const customer = data.customer_id ? await this.getById("customers", data.customer_id) : null;
    const sale = {
      id: id(),
      invoice_number: nextNumber("GST", this.db.sales.length + 1),
      date: data.date || today(),
      customer_id: data.customer_id || customer?.id || "",
      customer_name: data.customer_name || customer?.name || "",
      mobile: data.mobile || customer?.mobile || "",
      village: data.village || customer?.village || "",
      billing_address: data.billing_address || customer?.address || "",
      gstin: data.gstin || "",
      customer_aadhaar: data.customer_aadhaar || data.aadhaar_number || customer?.aadhaar || "",
      subtotal: data.subtotal,
      cgst: data.cgst,
      sgst: data.sgst,
      grand_total: data.grand_total,
      amount_paid: Number(data.amount_paid || 0),
      balance_due: round(data.grand_total - Number(data.amount_paid || 0)),
      payment_method: data.payment_method || "Cash",
      created_by: user?.name,
      created_at: now()
    };
    this.db.sales.push(sale);
    for (const item of data.items || []) {
      this.db.sale_items.push({ id: id(), sale_id: sale.id, ...item, created_at: now() });
      await this.adjustStock(item.product_id, { qty: -Number(item.qty || 0), type: "sale", note: sale.invoice_number }, user);
    }
    if (sale.customer_id && sale.balance_due > 0) {
      const customerIndex = this.db.customers.findIndex((item) => item.id === sale.customer_id);
      if (customerIndex >= 0) {
        this.db.customers[customerIndex].pending_balance = round(Number(this.db.customers[customerIndex].pending_balance || 0) + sale.balance_due);
        this.db.customers[customerIndex].credit_amount = this.db.customers[customerIndex].pending_balance;
      }
    }
    if (sale.amount_paid > 0) {
      const paymentTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      const payCount = (this.db.payments || []).length + 1;
      this.db.payments.push({
        id: id(),
        payment_id: nextNumber("PAY", payCount),
        customer_id: sale.customer_id,
        customer_name: sale.customer_name,
        farmer_id: sale.customer_id,
        farmer_name: sale.customer_name,
        sale_id: sale.id,
        bill_number: sale.invoice_number,
        invoice_id: sale.invoice_number,
        bill_date: sale.date,
        payment_date: sale.date,
        payment_time: paymentTime,
        amount: sale.amount_paid,
        amount_paid: sale.amount_paid,
        payment_method: (sale.payment_method || "CASH").toUpperCase(),
        previous_outstanding: sale.grand_total,
        remaining_outstanding: sale.balance_due,
        balance_amount: sale.balance_due,
        status: sale.balance_due <= 0 ? "Cleared" : "Partial",
        payment_status: sale.balance_due <= 0 ? "Cleared" : "Partial",
        recorded_by: user?.name || "Shop Admin",
        notes: "Initial payment at bill creation",
        created_at: now()
      });
    }
    await this.persist();
    return this.getSale(sale.id);
  }

  async listPurchases(query = {}) {
    return this.filterBySearch(this.db.purchases, query, ["invoice_number", "supplier_name"]);
  }

  async createPurchase(data, user) {
    const supplier = data.supplier_id ? await this.getById("suppliers", data.supplier_id) : null;
    const purchase = {
      id: id(),
      supplier_id: data.supplier_id || "",
      supplier_name: data.supplier_name || supplier?.name || "",
      invoice_number: data.invoice_number,
      purchase_date: data.purchase_date || today(),
      total_amount: round((data.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0)),
      created_by: user?.name,
      created_at: now()
    };
    this.db.purchases.push(purchase);
    for (const item of data.items || []) {
      this.db.purchase_items.push({ id: id(), purchase_id: purchase.id, ...item, created_at: now() });
      await this.adjustStock(item.product_id, { qty: Number(item.qty || 0), type: "purchase", note: purchase.invoice_number }, user);
      const product = await this.getById("products", item.product_id);
      if (product) {
        product.purchase_price = Number(item.purchase_rate || product.purchase_price);
      }
    }
    await this.persist();
    return { ...purchase, items: this.db.purchase_items.filter((item) => item.purchase_id === purchase.id) };
  }

  async getPurchase(id) {
    const purchase = this.db.purchases.find((p) => p.id === id);
    if (!purchase) return null;
    return {
      ...purchase,
      items: this.db.purchase_items.filter((item) => item.purchase_id === id)
    };
  }

  async updatePurchase(purchaseId, data, user) {
    const purchaseIndex = this.db.purchases.findIndex((p) => p.id === purchaseId);
    if (purchaseIndex === -1) throw new Error("Purchase not found");
    const oldPurchase = this.db.purchases[purchaseIndex];

    // 1. Revert previous purchase items from stock
    const oldItems = this.db.purchase_items.filter((item) => item.purchase_id === purchaseId);
    for (const item of oldItems) {
      await this.adjustStock(item.product_id, { qty: -Number(item.qty || 0), type: "purchase_reversal", note: `Revert ${oldPurchase.invoice_number}` }, user);
    }
    this.db.purchase_items = this.db.purchase_items.filter((item) => item.purchase_id !== purchaseId);

    // 2. Update purchase record
    const supplier = data.supplier_id ? await this.getById("suppliers", data.supplier_id) : null;
    const updatedPurchase = {
      ...oldPurchase,
      supplier_id: data.supplier_id || oldPurchase.supplier_id,
      supplier_name: data.supplier_name || supplier?.name || oldPurchase.supplier_name,
      invoice_number: data.invoice_number || oldPurchase.invoice_number,
      purchase_date: data.purchase_date || oldPurchase.purchase_date,
      total_amount: round((data.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0)),
      updated_at: now()
    };
    this.db.purchases[purchaseIndex] = updatedPurchase;

    // 3. Add new items & adjust stock
    for (const item of data.items || []) {
      this.db.purchase_items.push({ id: id(), purchase_id: purchaseId, ...item, created_at: now() });
      await this.adjustStock(item.product_id, { qty: Number(item.qty || 0), type: "purchase", note: updatedPurchase.invoice_number }, user);
      const product = await this.getById("products", item.product_id);
      if (product && item.purchase_rate) {
        product.purchase_price = Number(item.purchase_rate);
      }
    }

    await this.persist();
    return { ...updatedPurchase, items: this.db.purchase_items.filter((item) => item.purchase_id === purchaseId) };
  }

  async deletePurchase(purchaseId, user) {
    const purchase = this.db.purchases.find((p) => p.id === purchaseId);
    if (!purchase) return false;

    // Revert stock additions
    const items = this.db.purchase_items.filter((item) => item.purchase_id === purchaseId);
    for (const item of items) {
      await this.adjustStock(item.product_id, { qty: -Number(item.qty || 0), type: "purchase_deletion", note: `Delete ${purchase.invoice_number}` }, user);
    }

    this.db.purchases = this.db.purchases.filter((p) => p.id !== purchaseId);
    this.db.purchase_items = this.db.purchase_items.filter((item) => item.purchase_id !== purchaseId);
    await this.persist();
    return true;
  }

  async resetAll(preserveCatalog = true) {
    this.db.sales = [];
    this.db.sale_items = [];
    this.db.purchases = [];
    this.db.purchase_items = [];
    this.db.payments = [];
    this.db.stock_logs = [];

    for (const cust of this.db.customers || []) {
      cust.pending_balance = 0;
      cust.credit_amount = 0;
    }
    for (const sup of this.db.suppliers || []) {
      sup.outstanding_amount = 0;
    }
    if (preserveCatalog) {
      for (const prod of this.db.products || []) {
        prod.current_stock = 0;
      }
    } else {
      this.db.products = [];
    }
    await this.persist();
    return true;
  }

  async resetPurchases() {
    this.db.purchases = [];
    this.db.purchase_items = [];
    for (const prod of this.db.products || []) {
      prod.current_stock = 0;
    }
    for (const sup of this.db.suppliers || []) {
      sup.outstanding_amount = 0;
    }
    await this.persist();
    return true;
  }

  async resetSales() {
    this.db.sales = [];
    this.db.sale_items = [];
    this.db.payments = [];
    for (const cust of this.db.customers || []) {
      cust.pending_balance = 0;
      cust.credit_amount = 0;
    }
    await this.persist();
    return true;
  }

  async createPayment(data, user) {
    const customerId = data.customer_id || data.farmer_id || "";
    const customer = customerId ? await this.getById("customers", customerId) : null;
    const customerName = data.customer_name || data.farmer_name || customer?.name || "Walk-in Customer";
    const previousOutstanding = round(Number(customer ? customer.pending_balance : (data.previous_outstanding || 0)));
    const amountPaid = round(Number(data.amount || data.amount_paid || 0));

    if (amountPaid <= 0) {
      throw Object.assign(new Error("Payment amount must be greater than zero."), { status: 400 });
    }

    if (previousOutstanding > 0 && amountPaid > previousOutstanding + 0.01) {
      throw Object.assign(new Error("Payment amount cannot exceed the current outstanding balance."), { status: 400 });
    }

    const remainingOutstanding = round(Math.max(0, previousOutstanding - amountPaid));
    const isCleared = remainingOutstanding <= 0;

    const paymentTime = data.payment_time || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const paymentDate = data.payment_date || today();

    const payCount = (this.db.payments || []).length + 1;
    const paymentId = data.payment_id || nextNumber("PAY", payCount);

    const payment = {
      id: id(),
      payment_id: paymentId,
      customer_id: customerId,
      customer_name: customerName,
      farmer_id: customerId,
      farmer_name: customerName,
      sale_id: data.sale_id || "",
      bill_number: data.bill_number || data.invoice_id || data.invoice_number || (data.sale_id ? (this.db.sales.find(s => s.id === data.sale_id)?.invoice_number || "") : "CREDIT-LEDGER"),
      invoice_id: data.bill_number || data.invoice_id || data.invoice_number || "CREDIT-LEDGER",
      bill_date: data.bill_date || paymentDate,
      payment_date: paymentDate,
      payment_time: paymentTime,
      amount: amountPaid,
      amount_paid: amountPaid,
      payment_method: (data.payment_method || data.method || "CASH").toUpperCase(),
      previous_outstanding: previousOutstanding,
      remaining_outstanding: remainingOutstanding,
      balance_amount: remainingOutstanding,
      status: isCleared ? "Cleared" : "Partial",
      payment_status: isCleared ? "Cleared" : "Partial",
      recorded_by: user?.name || "Shop Admin",
      notes: data.notes || data.note || data.remarks || "",
      created_at: now()
    };

    this.db.payments.push(payment);

    if (customer) {
      customer.pending_balance = remainingOutstanding;
      customer.credit_amount = remainingOutstanding;
    }

    if (data.sale_id || data.bill_number || data.invoice_id) {
      const sale = this.db.sales.find(s => s.id === data.sale_id || s.invoice_number === (data.bill_number || data.invoice_id));
      if (sale) {
        sale.amount_paid = round(Number(sale.amount_paid || 0) + amountPaid);
        sale.balance_due = round(Math.max(0, Number(sale.grand_total || 0) - sale.amount_paid));
      }
    }

    await this.persist();
    return payment;
  }

  async stockLogs(query = {}) {
    return this.filterBySearch(this.db.stock_logs, query, ["product_name", "type", "note"]);
  }

  async dashboard() {
    const todayDate = today();
    const month = todayDate.slice(0, 7);
    const todaySales = sum(this.db.sales.filter((sale) => sale.date === todayDate), "grand_total");
    const monthlySales = sum(this.db.sales.filter((sale) => String(sale.date).startsWith(month)), "grand_total");
    const purchaseAmount = sum(this.db.purchases.filter((purchase) => String(purchase.purchase_date).startsWith(month)), "total_amount");
    const totalStockValue = round(this.db.products.reduce((sumValue, product) => sumValue + Number(product.current_stock || 0) * Number(product.purchase_price || 0), 0));
    const lowStock = this.db.products.filter((product) => Number(product.current_stock || 0) <= Number(product.minimum_stock_alert || 0));
    const pendingDues = round(sum(this.db.customers, "pending_balance"));
    const gstSummary = {
      cgst: round(sum(this.db.sales, "cgst")),
      sgst: round(sum(this.db.sales, "sgst")),
      purchase_tax: round(this.db.purchase_items.reduce((total, item) => total + Number(item.gst || 0), 0))
    };
    const topProducts = Object.values(this.db.sale_items.reduce((acc, item) => {
      acc[item.product_id] ||= { product_name: item.product_name, qty: 0, amount: 0 };
      acc[item.product_id].qty += Number(item.qty || 0);
      acc[item.product_id].amount += Number(item.total || 0);
      return acc;
    }, {})).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const predictions = await predictionEngine.getLatestPredictions(this);
    return { todaySales, monthlySales, purchaseAmount, totalStockValue, lowStock, pendingDues, gstSummary, topProducts, predictions };
  }

  async report(type, query = {}) {
    const from = query.from || "0000-01-01";
    const to = query.to || "9999-12-31";
    const between = (date) => String(date) >= from && String(date) <= to;
    const rows = {
      "sales-register": this.db.sales.filter((sale) => between(sale.date)),
      "purchase-register": this.db.purchases.filter((purchase) => between(purchase.purchase_date)),
      "gst-summary": this.db.sales.filter((sale) => between(sale.date)).map(({ invoice_number, date, taxable = 0, subtotal, cgst, sgst, grand_total }) => ({ invoice_number, date, taxable: taxable || subtotal, cgst, sgst, grand_total })),
      "cgst": this.db.sales.filter((sale) => between(sale.date)).map(({ invoice_number, date, cgst }) => ({ invoice_number, date, cgst })),
      "sgst": this.db.sales.filter((sale) => between(sale.date)).map(({ invoice_number, date, sgst }) => ({ invoice_number, date, sgst })),
      "hsn": this.db.sale_items.map(({ hsn_code, product_name, gst_percent, total }) => ({ hsn_code, product_name, gst_percent, total })),
      "date-wise-invoices": this.db.sales.filter((sale) => between(sale.date)),
      "taxable": this.db.sale_items.map((item) => ({ product_name: item.product_name, gst_percent: item.gst_percent, taxable: Number(item.total || 0) - Number(item.cgst || 0) - Number(item.sgst || 0), total: item.total }))
    }[type] || [];
    return { type, rows };
  }

  filterBySearch(rows, query, keys) {
    const term = String(query.search || "").toLowerCase();
    return rows
      .filter((row) => !term || keys.some((key) => String(row[key] ?? "").toLowerCase().includes(term)))
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }
}

function id() {
  return randomUUID();
}

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextNumber(prefix, number) {
  return `${prefix}-${new Date().getFullYear()}-${String(number).padStart(5, "0")}`;
}

function sum(rows, key) {
  return round(rows.reduce((total, row) => total + Number(row[key] || 0), 0));
}
