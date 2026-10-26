import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Boxes,
  ShoppingCart,
  Truck,
  Users,
  FileSpreadsheet,
  Download,
  Printer,
  Settings as SettingsIcon,
  Search,
  Filter,
  IndianRupee,
  RefreshCw,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Calendar,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import * as XLSX from "xlsx";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const currencyDec = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

const periodOptions = [
  ["today", "Today"],
  ["7d", "Last 7 Days"],
  ["30d", "Last 30 Days"],
  ["3m", "Last 3 Months"],
  ["6m", "Last 6 Months"],
  ["1y", "Last 1 Year"],
  ["fy", "Financial Year"],
  ["all", "All Records"]
];

export default function BusinessInsights({ api, notify, setScreen }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview"); // overview, products, stock, purchases, partners, gst
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/insights/overview?period=${period}`);
      setData(res);
      if (!settingsForm && res.settings) {
        setSettingsForm(res.settings);
      }
    } catch (err) {
      console.error(err);
      notify?.("Failed to load business insights: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.post("/insights/settings", settingsForm);
      setData(prev => ({ ...prev, settings: res.settings }));
      notify?.("Insights settings updated successfully");
      setShowSettings(false);
      loadData();
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Excel Multi-sheet Export
  const handleExportExcel = () => {
    if (!data) return;
    try {
      const wb = XLSX.utils.book_new();

      // 1. Executive Summary Sheet
      const execSummary = [
        { "Metric": "Business Health Score", "Value": `${data.health.score} / 100 (${data.health.status})` },
        { "Metric": "Analysis Period", "Value": data.periodLabel },
        { "Metric": "Date Range", "Value": `${data.dateRange.start} to ${data.dateRange.end}` },
        { "Metric": "Period Sales Total", "Value": data.salesKPIs.periodSales },
        { "Metric": "Sales Growth %", "Value": `${data.salesKPIs.salesGrowth}% (${data.salesKPIs.salesGrowthIndicator})` },
        { "Metric": "Period Gross Profit", "Value": data.salesKPIs.periodGrossProfit },
        { "Metric": "Gross Profit Margin %", "Value": `${data.salesKPIs.grossMarginPercent.toFixed(1)}%` },
        { "Metric": "Total Invoices", "Value": data.salesKPIs.invoicesCount },
        { "Metric": "Average Daily Sales", "Value": data.salesKPIs.avgDailySales },
        { "Metric": "Total Inventory Value", "Value": data.stockSummary.totalStockValue },
        { "Metric": "Dead Stock Value", "Value": data.stockSummary.deadStockValue },
        { "Metric": "Total Outstanding Dues", "Value": data.customerInsights.totalOutstandingDues },
        { "Metric": "Estimated GST Payable", "Value": data.gstAnalysis.estimatedGSTPayable }
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(execSummary), "Executive Summary");

      // 2. Top Selling Products
      const topProds = data.topSellingProducts.map(p => ({
        "Product Name": p.name,
        "Brand": p.brand,
        "Category": p.category,
        "Quantity Sold": p.quantity_sold,
        "Unit": p.unit,
        "Sales Revenue (₹)": p.sales_amount,
        "Purchase Cost (₹)": p.purchase_cost,
        "Gross Profit (₹)": p.gross_profit,
        "Margin (%)": `${p.profit_margin}%`,
        "Current Stock": p.current_stock,
        "Avg Daily Sales": p.avg_daily_sales,
        "Est. Days Remaining": p.estimated_days_remaining,
        "Stock Status": p.stock_status
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topProds), "Top Selling Products");

      // 3. Stock Intelligence Sheet
      const stockSheet = data.products.map(p => ({
        "Product Name": p.name,
        "Brand": p.brand,
        "Category": p.category,
        "Batch": p.batch_number,
        "Current Stock": p.current_stock,
        "Unit": p.unit,
        "Min Alert": p.minimum_stock_alert,
        "Target Stock (30d)": p.target_stock,
        "Purchase Rate (₹)": p.purchase_price,
        "Selling Rate (₹)": p.selling_price,
        "Stock Value (₹)": p.stock_value,
        "Sold In Period": p.quantity_sold,
        "Avg Daily Sales": p.avg_daily_sales,
        "Est. Days Left": p.estimated_days_remaining === 999 ? "High / None" : p.estimated_days_remaining,
        "Expiry Date": p.expiry_date || "N/A",
        "Days To Expiry": p.days_until_expiry === 999 ? "N/A" : p.days_until_expiry,
        "Stock Status": p.stock_status,
        "Movement Velocity": p.velocity
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockSheet), "Stock Intelligence");

      // 4. Purchase Recommendations
      const purchRecs = data.purchaseRecommendations.map(p => ({
        "Product": p.product_name,
        "Brand": p.brand,
        "Current Stock": p.current_stock,
        "Unit": p.unit,
        "Avg Daily Sales": p.avg_daily_sales,
        "Days Remaining": p.estimated_days_remaining,
        "Recommended Qty": p.recommended_qty,
        "Est. Purchase Cost (₹)": p.estimated_cost,
        "Supplier": p.supplier_name,
        "Purchase Rate (₹)": p.purchase_price,
        "Reason": p.reason
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchRecs), "Purchase Reorders");

      // 5. Expiry Risk FEFO Sheet
      const expSheet = data.expiryRiskProducts.map(p => ({
        "Product": p.product_name,
        "Batch": p.batch_number,
        "Stock": p.current_stock,
        "Unit": p.unit,
        "Expiry Date": p.expiry_date,
        "Days Remaining": p.days_until_expiry,
        "Risk Tier": p.risk_level,
        "Stock Value At Risk (₹)": p.stock_value_at_risk,
        "FEFO Action": p.recommended_action
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expSheet), "Expiry Intelligence FEFO");

      // 6. Customer Credit & Retention
      const custSheet = data.customerInsights.topCustomers.map(c => ({
        "Farmer Name": c.name,
        "Village": c.village,
        "Mobile": c.mobile,
        "Total Purchases (₹)": c.total_purchases,
        "Invoices Count": c.invoices_count,
        "Avg Invoice Value (₹)": c.avg_invoice_value,
        "Pending Balance (₹)": c.outstanding_balance,
        "Last Purchase Date": c.last_purchase_date || "N/A",
        "Segment": c.segment,
        "Credit Risk Alert": c.is_credit_risk ? "HIGH DUES" : "Normal"
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(custSheet), "Customer Insights");

      // 7. Actions & Recommendations
      const actSheet = data.recommendations.map(r => ({
        "Priority": r.priority,
        "Category": r.category,
        "Action Title": r.title,
        "Business Impact": r.impact,
        "Explainable Reason": r.reason,
        "Suggested Action": r.suggestedAction
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actSheet), "Action Center");

      XLSX.writeFile(wb, `SmartAgro_Business_Intelligence_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      notify?.("Business Intelligence report exported to Excel!");
    } catch (err) {
      console.error(err);
      alert("Export failed: " + err.message);
    }
  };

  const handleExportCsv = () => {
    if (!data) return;
    const topProds = data.topSellingProducts.map(p => ({
      "Product Name": p.name,
      "Category": p.category,
      "Quantity Sold": p.quantity_sold,
      "Sales Revenue": p.sales_amount,
      "Profit Margin": `${p.profit_margin}%`,
      "Current Stock": p.current_stock,
      "Days Remaining": p.estimated_days_remaining,
      "Stock Status": p.stock_status
    }));
    const ws = XLSX.utils.json_to_sheet(topProds);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SmartAgro_Product_Intelligence_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.("CSV report exported!");
  };

  const categories = useMemo(() => {
    if (!data?.products) return [];
    return ["all", ...new Set(data.products.map(p => p.category || p.product_type).filter(Boolean))];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    return data.products.filter(p => {
      const matchSearch = (p.name + " " + p.brand + " " + p.batch_number).toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || (p.category === categoryFilter || p.product_type === categoryFilter);
      return matchSearch && matchCat;
    });
  }, [data, search, categoryFilter]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-md bg-white shadow-soft" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 animate-pulse rounded-md bg-white shadow-soft" />)}
        </div>
        <div className="h-80 animate-pulse rounded-md bg-white shadow-soft" />
      </div>
    );
  }

  const { health, salesKPIs, stockSummary, customerInsights, supplierInsights, gstAnalysis, recommendations } = data;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-300";
    if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-300";
    if (score >= 40) return "text-amber-700 bg-amber-50 border-amber-300";
    return "text-red-700 bg-red-50 border-red-300";
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800 border-red-200";
      case "High": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  const getStockStatusBadge = (status) => {
    switch (status) {
      case "Critical Stock": return "bg-red-100 text-red-800 font-bold";
      case "Low Stock": return "bg-amber-100 text-amber-800 font-semibold";
      case "Expiry Risk": return "bg-orange-100 text-orange-800 font-semibold";
      case "Dead Stock": return "bg-slate-800 text-white font-semibold";
      case "Overstocked": return "bg-blue-100 text-blue-800 font-semibold";
      default: return "bg-emerald-100 text-emerald-800 font-medium";
    }
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Filter & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-paddy-100 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-5 w-5 text-paddy-600" />
          <span className="text-sm font-semibold text-slate-700">Analysis Period:</span>
          <div className="flex flex-wrap gap-1">
            {periodOptions.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                  period === key
                    ? "bg-paddy-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button onClick={loadData} title="Refresh Analytics" className="btn-secondary px-3 py-1.5 text-xs">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={handleExportExcel} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 text-emerald-800 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </button>
          <button onClick={handleExportCsv} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => window.print()} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button onClick={() => setShowSettings(true)} className="icon-btn p-2" title="Insights Settings">
            <SettingsIcon className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* 1. Business Health Score Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6">
        <div className={`rounded-md border p-6 shadow-soft flex flex-col justify-between ${getScoreColor(health.score)}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Overall Business Health</span>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold shadow-sm">
                Status: {health.status}
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-6xl font-black">{health.score}</span>
              <span className="text-xl font-bold opacity-70">/ 100</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed opacity-90">
              {health.score >= 80
                ? "Your agribusiness is operating at peak efficiency with healthy turnover, strong margins, and low dead stock."
                : health.score >= 60
                ? "Solid financial performance, with clear opportunities to reduce dead stock and accelerate farmer credit recovery."
                : health.score >= 40
                ? "Action needed: stockouts, slow-moving items, or delayed receivables are restricting working capital."
                : "Critical condition: working capital is locked in dead stock or delayed farmer dues. Immediate corrective action required."}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-current/20 flex items-center justify-between text-xs">
            <span>Period Evaluated: <strong>{data.dateRange.start}</strong> to <strong>{data.dateRange.end}</strong></span>
            <span>Target Score: <strong>85+</strong></span>
          </div>
        </div>

        {/* Health Score Sub-component Progress Bars */}
        <div className="rounded-md border border-paddy-100 bg-white p-6 shadow-soft">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center justify-between">
            <span>Health Drivers & Diagnostic Breakdown</span>
            <span className="text-xs text-slate-400 font-normal">Real-time DB Analysis</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Sales Growth</span>
                <span>{health.subScores.salesGrowth} / 15</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(health.subScores.salesGrowth / 15) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Profit Margins</span>
                <span>{health.subScores.profitMargin} / 15</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(health.subScores.profitMargin / 15) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Stock Balance (Low/Normal)</span>
                <span>{health.subScores.stockHealth} / 15</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(health.subScores.stockHealth / 15) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Stock Turnover Speed</span>
                <span>{health.subScores.stockTurnover} / 15</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(health.subScores.stockTurnover / 15) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Dead Stock Control</span>
                <span>{health.subScores.deadStockControl} / 10</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(health.subScores.deadStockControl / 10) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>FEFO Expiry Risk Control</span>
                <span>{health.subScores.expiryControl} / 10</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(health.subScores.expiryControl / 10) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Farmer Credit Health</span>
                <span>{health.subScores.creditHealth} / 10</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(health.subScores.creditHealth / 10) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Purchase Price Savings</span>
                <span>{health.subScores.purchaseEfficiency} / 10</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(health.subScores.purchaseEfficiency / 10) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive KPIs Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-slate-500">Period Sales</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{currency.format(salesKPIs.periodSales)}</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {salesKPIs.salesGrowthIndicator === "increasing" ? (
              <span className="flex items-center text-emerald-600 font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" /> +{salesKPIs.salesGrowth}%
              </span>
            ) : salesKPIs.salesGrowthIndicator === "decreasing" ? (
              <span className="flex items-center text-red-600 font-semibold">
                <ArrowDownRight className="h-3.5 w-3.5" /> {salesKPIs.salesGrowth}%
              </span>
            ) : (
              <span className="flex items-center text-slate-500 font-medium">
                <Minus className="h-3.5 w-3.5" /> 0% (Stable)
              </span>
            )}
            <span className="text-slate-400">vs prev</span>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-slate-500">Gross Profit (Est.)</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{currency.format(salesKPIs.periodGrossProfit)}</p>
          <p className="mt-2 text-xs text-slate-500">Margin: <strong className="text-emerald-600">{salesKPIs.grossMarginPercent.toFixed(1)}%</strong></p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-slate-500">Total Stock Value</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{currency.format(stockSummary.totalStockValue)}</p>
          <p className="mt-2 text-xs text-slate-500">{stockSummary.totalProducts} items ({stockSummary.totalStockQty} units)</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-slate-500">Dead Stock Value</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{currency.format(stockSummary.deadStockValue)}</p>
          <p className="mt-2 text-xs text-slate-500">{stockSummary.deadStockCount} items idle &gt; {data.settings.dead_stock_days}d</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-slate-500">Pending Farmer Dues</p>
          <p className="mt-1 text-xl font-bold text-red-700">{currency.format(customerInsights.totalOutstandingDues)}</p>
          <p className="mt-2 text-xs text-slate-500">{customerInsights.creditRiskCustomers.length} high-balance debtors</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-slate-500">Invoices & Customers</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{salesKPIs.invoicesCount} <span className="text-sm font-normal text-slate-500">inv</span></p>
          <p className="mt-2 text-xs text-slate-500">Avg Inv: {currency.format(salesKPIs.avgInvoiceValue)}</p>
        </div>
      </div>

      {/* 3. Action Center: Prioritized Business Improvement Actions */}
      {recommendations.length > 0 && (
        <section className="rounded-md border border-paddy-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-paddy-600" /> Business Improvement Action Center
              </h2>
              <p className="text-xs text-slate-500">Automated, explainable recommendations ranked by financial and operational impact</p>
            </div>
            <span className="rounded-full bg-paddy-50 border border-paddy-200 px-3 py-1 text-xs font-bold text-paddy-700">
              {recommendations.length} Actions Identified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map(rec => (
              <div key={rec.id} className="rounded-md border border-slate-200 bg-slate-50/50 p-4 hover:bg-white hover:shadow-soft transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-extrabold border ${getPriorityBadge(rec.priority)}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase">{rec.category}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{rec.title}</h3>
                  <p className="text-xs text-emerald-800 font-semibold mt-1">Impact: {rec.impact}</p>
                  
                  <div className="mt-2 rounded bg-white p-2.5 border border-slate-200/80 text-xs">
                    <p className="text-slate-600"><strong>Why:</strong> {rec.reason}</p>
                    <p className="mt-1 text-paddy-800 font-medium"><strong>Action:</strong> {rec.suggestedAction}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Sub-Navigation Tabs for Deep Analysis */}
      <div className="flex border-b border-slate-200 bg-white rounded-md shadow-soft p-1 overflow-x-auto">
        {[
          ["overview", BarChart3, "Executive Overview & Growth"],
          ["products", Layers, "Product Profitability Matrix"],
          ["stock", Boxes, "Stock & FEFO Expiry"],
          ["purchases", ShoppingCart, "Smart Purchase Reorders"],
          ["partners", Users, "Customers & Suppliers"],
          ["gst", FileSpreadsheet, "GST & Tax Liability"]
        ].map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 min-w-[150px] py-2.5 px-4 text-center rounded-md font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === key
                ? "bg-paddy-600 text-white shadow-sm font-bold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW & GROWTH */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            {/* Sales vs Purchases Monthly Trend */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1">
                Sales vs Purchases Monthly Trend
              </h3>
              <p className="text-xs text-slate-500 mb-4">Historical cash flow comparison of outgoing purchases vs incoming revenue</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timelineTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip formatter={(val) => currency.format(val)} />
                    <Legend />
                    <Bar dataKey="sales" name="Sales Revenue" fill="#3f741f" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" name="Purchases" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inventory Value Distribution */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Inventory Capital Distribution
                </h3>
                <p className="text-xs text-slate-500 mb-3">Breakdown of total {currency.format(stockSummary.totalStockValue)} locked in stock</p>
                
                <div className="space-y-3 mt-4 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded bg-emerald-50 border border-emerald-100">
                    <span className="font-semibold text-emerald-800">Fast-Moving Inventory:</span>
                    <span className="font-bold text-emerald-900">{currency.format(stockSummary.fastMovingValue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded bg-blue-50 border border-blue-100">
                    <span className="font-semibold text-blue-800">Normal / Slow-Moving:</span>
                    <span className="font-bold text-blue-900">{currency.format(stockSummary.slowMovingValue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded bg-amber-50 border border-amber-100">
                    <span className="font-semibold text-amber-800">Dead Stock (&gt; {data.settings.dead_stock_days} days):</span>
                    <span className="font-bold text-amber-900">{currency.format(stockSummary.deadStockValue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded bg-red-50 border border-red-100">
                    <span className="font-semibold text-red-800">Expiry Risk (within 90 days):</span>
                    <span className="font-bold text-red-900">{currency.format(stockSummary.expiryRiskValue)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Inventory Turnover Ratio: <strong>{stockSummary.inventoryTurnover}x / year</strong></span>
                <span>Avg Holding Days: <strong>{stockSummary.holdingPeriodDays} days</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Business Growth Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
              <span className="text-xs font-bold text-slate-500 uppercase">Today's Trading Performance</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{currency.format(salesKPIs.todaySales)}</p>
              <p className="text-xs text-slate-500 mt-1">Average Daily Sales: <strong>{currency.format(salesKPIs.avgDailySales)}</strong></p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
              <span className="text-xs font-bold text-slate-500 uppercase">This Month vs Previous</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{currency.format(salesKPIs.thisMonthSales)}</p>
              <p className="text-xs text-slate-500 mt-1">Previous Month: {currency.format(salesKPIs.prevMonthSales)}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
              <span className="text-xs font-bold text-slate-500 uppercase">Annualized Performance</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{currency.format(salesKPIs.thisYearSales)}</p>
              <p className="text-xs text-slate-500 mt-1">Total active customer accounts: {customerInsights.activeCustomersCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT PROFITABILITY & PERFORMANCE */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            {/* Top Selling Products Table */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Top Revenue Generating Products</h3>
                  <p className="text-xs text-slate-500">Products contributing highest revenue and volume in period</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[360px] border border-slate-200 rounded-md">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-700 text-left font-bold">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-right">Sold Qty</th>
                      <th className="p-3 text-right">Sales Amount</th>
                      <th className="p-3 text-right">Gross Profit</th>
                      <th className="p-3 text-center">Margin %</th>
                      <th className="p-3 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSellingProducts.map((p, idx) => (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">
                          <span className="mr-1.5 text-slate-400 font-bold">#{idx + 1}</span> {p.name}
                          <p className="text-[11px] font-normal text-slate-500">{p.brand} • {p.category}</p>
                        </td>
                        <td className="p-3 text-right font-medium">{p.quantity_sold} {p.unit}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{currency.format(p.sales_amount)}</td>
                        <td className="p-3 text-right font-semibold text-emerald-700">{currency.format(p.gross_profit)}</td>
                        <td className="p-3 text-center">
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                            {p.profit_margin}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-700">{p.current_stock} {p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Profitability Quadrants Matrix */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Product Profitability Quadrants
                </h3>
                <p className="text-xs text-slate-500 mb-4">Strategic positioning: Volume vs Gross Margin %</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200">
                    <p className="font-bold text-emerald-900">🌟 High Profit Stars</p>
                    <p className="text-[11px] text-emerald-700 mt-1">High sales volume + High margin (&gt;15%)</p>
                    <p className="mt-2 text-lg font-black text-emerald-800">
                      {data.products.filter(p => p.profitability_quadrant === "High Profit").length} Products
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Maintain healthy safety stock at all times.</p>
                  </div>

                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                    <p className="font-bold text-blue-900">🚜 Volume Drivers</p>
                    <p className="text-[11px] text-blue-700 mt-1">High sales volume + Low margin (&lt;12%)</p>
                    <p className="mt-2 text-lg font-black text-blue-800">
                      {data.products.filter(p => p.profitability_quadrant === "High Sales / Low Margin").length} Products
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Negotiate bulk supplier discounts.</p>
                  </div>

                  <div className="p-3 rounded-md bg-amber-50 border border-amber-200">
                    <p className="font-bold text-amber-900">💡 High Margin Niches</p>
                    <p className="text-[11px] text-amber-700 mt-1">Low sales volume + High margin (&gt;15%)</p>
                    <p className="mt-2 text-lg font-black text-amber-800">
                      {data.products.filter(p => p.profitability_quadrant === "Low Sales / High Margin").length} Products
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Promote & bundle with primary fertilizers.</p>
                  </div>

                  <div className="p-3 rounded-md bg-slate-100 border border-slate-200">
                    <p className="font-bold text-slate-800">⚠️ Low Performers</p>
                    <p className="text-[11px] text-slate-600 mt-1">Low sales volume + Low margin</p>
                    <p className="mt-2 text-lg font-black text-slate-800">
                      {data.products.filter(p => p.profitability_quadrant === "Low Sales / Low Margin").length} Products
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Reconsider reordering; clear stock.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded bg-paddy-50 border border-paddy-200 text-xs text-paddy-900">
                <strong>Recommended Product Mix Action:</strong> Shift counter recommendations towards High Margin Niches to increase gross profit by an estimated 10-15%.
              </div>
            </div>
          </div>

          {/* Slow-Moving & Dead Stock Breakdown */}
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-1">
              Slow-Moving & Dead Stock Analysis
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Products with no transactions recorded for &ge; {data.settings.dead_stock_days} days or very low sales velocity
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 text-left font-bold">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Current Stock</th>
                    <th className="p-3 text-right">Stock Value Locked</th>
                    <th className="p-3 text-right">Sold in Period</th>
                    <th className="p-3 text-center">Days Idle</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products
                    .filter(p => p.velocity === "Dead Stock" || p.velocity === "Slow Moving")
                    .map(p => (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="p-3 text-slate-600">{p.category}</td>
                        <td className="p-3 text-right font-medium">{p.current_stock} {p.unit}</td>
                        <td className="p-3 text-right font-bold text-amber-800">{currency.format(p.stock_value)}</td>
                        <td className="p-3 text-right text-slate-600">{p.quantity_sold} {p.unit}</td>
                        <td className="p-3 text-center font-semibold text-slate-700">
                          {p.days_since_last_sale === 999 ? "Never Sold" : `${p.days_since_last_sale} days`}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`rounded px-2 py-0.5 text-xs ${getStockStatusBadge(p.stock_status)}`}>
                            {p.stock_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK INTELLIGENCE & FEFO EXPIRY */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          {/* Expiry Risk Alerts & Overstock Warning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FEFO Expiry Risk */}
            <div className="rounded-md border border-orange-200 bg-orange-50/50 p-5 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-950 flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" /> FEFO Expiry Intelligence (Next 90 Days)
              </h3>
              <p className="text-xs text-orange-800 mb-4">First Expiry, First Out batch priority to prevent inventory write-offs</p>

              {data.expiryRiskProducts.length === 0 ? (
                <p className="text-xs text-emerald-800 bg-emerald-50 p-4 rounded border border-emerald-200">
                  ✓ All active product batches have safe expiry dates beyond {data.settings.expiry_warning_days} days.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-auto">
                  {data.expiryRiskProducts.map(p => (
                    <div key={p.product_id} className="p-3 rounded bg-white border border-orange-200 shadow-sm text-xs">
                      <div className="flex justify-between items-start font-semibold">
                        <span className="text-slate-900">{p.product_name} (Batch: {p.batch_number})</span>
                        <span className="rounded bg-red-100 text-red-800 px-2 py-0.5 font-bold">
                          {p.days_until_expiry} days left
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-slate-600">
                        <span>Stock: {p.current_stock} {p.unit}</span>
                        <span>Value at Risk: <strong>{currency.format(p.stock_value_at_risk)}</strong></span>
                      </div>
                      <p className="mt-2 text-orange-900 font-medium"><strong>FEFO Action:</strong> {p.recommended_action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overstock Capital Warning */}
            <div className="rounded-md border border-blue-200 bg-blue-50/50 p-5 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-950 flex items-center gap-2 mb-1">
                <Boxes className="h-4 w-4 text-blue-600" /> Overstocked Capital Warnings
              </h3>
              <p className="text-xs text-blue-800 mb-4">Excess inventory where current stock exceeds 3-4 months of sales demand</p>

              {data.overstockedProducts.length === 0 ? (
                <p className="text-xs text-blue-800 bg-white p-4 rounded border border-blue-100">
                  ✓ No severe overstock detected. Stock levels align well with sales velocity.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-auto">
                  {data.overstockedProducts.map(p => (
                    <div key={p.product_id} className="p-3 rounded bg-white border border-blue-200 shadow-sm text-xs">
                      <div className="flex justify-between items-start font-semibold">
                        <span className="text-slate-900">{p.product_name}</span>
                        <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 font-bold">
                          ~{p.estimated_months_coverage} mo coverage
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-slate-600">
                        <span>Stock: {p.current_stock} {p.unit}</span>
                        <span>Locked Value: <strong>{currency.format(p.stock_value)}</strong></span>
                      </div>
                      <p className="mt-2 text-slate-700"><strong>Recommendation:</strong> {p.recommended_action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Master Stock Intelligence Table */}
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Master Stock Intelligence</h3>
                <p className="text-xs text-slate-500">Days of stock remaining, sales velocity, batch expiry & stock status</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product / brand..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 outline-none focus:border-paddy-500 w-52"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs rounded border border-slate-200 outline-none focus:border-paddy-500 text-slate-700 font-medium"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[460px] border border-slate-200 rounded-md">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-700 text-left font-bold">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch & Expiry</th>
                    <th className="p-3 text-right">Current Stock</th>
                    <th className="p-3 text-right">Purchase Rate</th>
                    <th className="p-3 text-right">Stock Value</th>
                    <th className="p-3 text-right">Avg Daily Sales</th>
                    <th className="p-3 text-center">Days Remaining</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500">{p.brand} • {p.category}</p>
                      </td>
                      <td className="p-3 text-slate-600">
                        <p>{p.batch_number}</p>
                        <p className="text-[11px] text-slate-400">{p.expiry_date || "No date"}</p>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-900">
                        {p.current_stock} {p.unit}
                      </td>
                      <td className="p-3 text-right text-slate-600">{currency.format(p.purchase_price)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{currency.format(p.stock_value)}</td>
                      <td className="p-3 text-right text-slate-700">{p.avg_daily_sales} {p.unit}/d</td>
                      <td className="p-3 text-center font-bold">
                        {p.estimated_days_remaining === 999 ? (
                          <span className="text-slate-400 font-normal">Insufficient sales</span>
                        ) : p.estimated_days_remaining <= 7 ? (
                          <span className="text-red-700 font-black">{p.estimated_days_remaining} days</span>
                        ) : (
                          <span className="text-slate-800">{p.estimated_days_remaining} days</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`rounded px-2.5 py-1 text-[11px] ${getStockStatusBadge(p.stock_status)}`}>
                          {p.stock_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SMART PURCHASE REORDERS */}
      {activeTab === "purchases" && (
        <div className="space-y-6">
          <div className="rounded-md border border-paddy-200 bg-white p-6 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-paddy-600" /> What Should I Purchase? (Smart Reorder Recommender)
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated based on average sales velocity &times; target coverage ({data.settings.target_stock_days} days) minus available inventory
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold">Total Estimated Reorder Cost:</span>
                <p className="text-lg font-black text-paddy-700">
                  {currency.format(data.purchaseRecommendations.reduce((sum, r) => sum + r.estimated_cost, 0))}
                </p>
              </div>
            </div>

            {data.purchaseRecommendations.length === 0 ? (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 p-8 text-center text-emerald-900">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold text-base">All Inventory Adequately Stocked!</p>
                <p className="text-xs text-emerald-700 mt-1">No products currently breach minimum safety alerts or target coverage thresholds.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-700 text-left font-bold">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-right">Current Stock</th>
                      <th className="p-3 text-right">Daily Sales</th>
                      <th className="p-3 text-center">Days Left</th>
                      <th className="p-3 text-right">Target (30d)</th>
                      <th className="p-3 text-right">Recommended Qty</th>
                      <th className="p-3 text-right">Est. Cost</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Explainable Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchaseRecommendations.map(r => (
                      <tr key={r.product_id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {r.product_name}
                          <p className="text-[11px] font-normal text-slate-500">{r.brand}</p>
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-800">{r.current_stock} {r.unit}</td>
                        <td className="p-3 text-right text-slate-600">{r.avg_daily_sales} {r.unit}</td>
                        <td className="p-3 text-center">
                          <span className={`rounded px-2 py-0.5 font-bold ${
                            r.estimated_days_remaining <= 5 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {r.estimated_days_remaining} days
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-600">{r.target_stock} {r.unit}</td>
                        <td className="p-3 text-right font-black text-paddy-800 text-sm">
                          +{r.recommended_qty} {r.unit}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{currency.format(r.estimated_cost)}</td>
                        <td className="p-3 text-slate-700 font-medium">{r.supplier_name}</td>
                        <td className="p-3 text-slate-600 max-w-xs">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER & SUPPLIER INTELLIGENCE */}
      {activeTab === "partners" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Revenue Customers */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-1">
                Top Revenue Contributing Farmers
              </h3>
              <p className="text-xs text-slate-500 mb-4">Farmers with highest aggregate billing value in period</p>

              <div className="overflow-x-auto max-h-[320px] border border-slate-200 rounded-md">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-700 text-left font-bold">
                    <tr>
                      <th className="p-3">Farmer Name</th>
                      <th className="p-3">Village</th>
                      <th className="p-3 text-right">Total Purchases</th>
                      <th className="p-3 text-right">Invoices</th>
                      <th className="p-3 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInsights.topCustomers.map(c => (
                      <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">
                          {c.name}
                          <p className="text-[11px] text-slate-400">{c.mobile}</p>
                        </td>
                        <td className="p-3 text-slate-600">{c.village}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{currency.format(c.total_purchases)}</td>
                        <td className="p-3 text-right text-slate-600">{c.invoices_count}</td>
                        <td className="p-3 text-right font-semibold text-red-700">{currency.format(c.outstanding_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credit Risk Debtors */}
            <div className="rounded-md border border-red-200 bg-red-50/40 p-5 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-950 flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" /> High Credit Risk Farmers (Follow-up List)
              </h3>
              <p className="text-xs text-red-800 mb-4">Outstanding balance exceeds warning limit ({currency.format(data.settings.credit_warning_amount)})</p>

              {customerInsights.creditRiskCustomers.length === 0 ? (
                <p className="text-xs text-emerald-800 bg-emerald-50 p-4 rounded border border-emerald-200">
                  ✓ No farmers currently exceed the configured credit alert threshold.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-[320px] border border-red-200 bg-white rounded-md">
                  <table className="w-full text-xs">
                    <thead className="bg-red-50 text-red-900 text-left font-bold">
                      <tr>
                        <th className="p-3">Farmer</th>
                        <th className="p-3">Village</th>
                        <th className="p-3 text-right">Outstanding Dues</th>
                        <th className="p-3">Suggested Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerInsights.creditRiskCustomers.map(c => (
                        <tr key={c.id} className="border-t border-red-100 hover:bg-red-50/50">
                          <td className="p-3 font-bold text-slate-900">
                            {c.name}
                            <p className="text-[11px] font-normal text-slate-500">{c.mobile}</p>
                          </td>
                          <td className="p-3 text-slate-600">{c.village}</td>
                          <td className="p-3 text-right font-black text-red-700 text-sm">{currency.format(c.outstanding_balance)}</td>
                          <td className="p-3 text-xs text-slate-600">Send reminder notice; restrict new credit</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Price Comparison & Savings */}
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-1">
              Cross-Supplier Price Comparison (Cost-Saving Opportunities)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Compare rates for identical products across different vendors to lower purchase expenditure</p>

            {supplierInsights.priceComparisonOpportunities.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 rounded bg-slate-50 border border-slate-200">
                Single supplier per product detected. Once you record purchase invoices from alternative suppliers, price comparison savings will appear here.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-700 text-left font-bold">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Lowest Rate Supplier</th>
                      <th className="p-3 text-right">Cheaper Price</th>
                      <th className="p-3">Alternative Supplier</th>
                      <th className="p-3 text-right">Alternative Price</th>
                      <th className="p-3 text-center">Saving Opportunity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierInsights.priceComparisonOpportunities.map((op, idx) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{op.product_name}</td>
                        <td className="p-3 font-semibold text-emerald-800">{op.cheaper_supplier}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">{currencyDec.format(op.cheaper_rate)}</td>
                        <td className="p-3 text-slate-600">{op.expensive_supplier}</td>
                        <td className="p-3 text-right text-slate-600">{currencyDec.format(op.expensive_rate)}</td>
                        <td className="p-3 text-center">
                          <span className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            Save {currencyDec.format(op.potential_saving_per_unit)} / {op.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: GST BUSINESS & TAX LIABILITY */}
      {activeTab === "gst" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Output GST Collected (Sales)</span>
              <p className="mt-2 text-2xl font-black text-slate-900">{currencyDec.format(gstAnalysis.outputGST)}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                <span>CGST: {currencyDec.format(gstAnalysis.outputCGST)}</span>
                <span>SGST: {currencyDec.format(gstAnalysis.outputSGST)}</span>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Input GST Paid (Purchases)</span>
              <p className="mt-2 text-2xl font-black text-slate-900">{currencyDec.format(gstAnalysis.inputGST)}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                <span>Input CGST: {currencyDec.format(gstAnalysis.inputCGST)}</span>
                <span>Input SGST: {currencyDec.format(gstAnalysis.inputSGST)}</span>
              </div>
            </div>

            <div className="rounded-md border border-paddy-200 bg-gradient-to-br from-paddy-50 to-white p-5 shadow-soft">
              <span className="text-xs font-bold uppercase tracking-wider text-paddy-800">Estimated Net GST Payable</span>
              <p className="mt-2 text-2xl font-black text-paddy-900">{currencyDec.format(gstAnalysis.estimatedGSTPayable)}</p>
              <p className="mt-3 text-[11px] text-paddy-700">Formula: Output GST - Eligible Input GST</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Taxable vs Non-Taxable Breakdown */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">Taxable vs Non-Taxable Turnover</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Taxable Sales (Fertilizers/Pesticides):</span>
                  <span className="font-bold text-slate-900">{currency.format(gstAnalysis.taxableSales)}</span>
                </div>
                <div className="flex justify-between p-3 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Exempt / Zero-rated Sales (Seeds):</span>
                  <span className="font-bold text-slate-900">{currency.format(gstAnalysis.nonTaxableSales)}</span>
                </div>
                <div className="flex justify-between p-3 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Taxable Purchases:</span>
                  <span className="font-bold text-slate-900">{currency.format(gstAnalysis.taxablePurchases)}</span>
                </div>
                <div className="flex justify-between p-3 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Exempt Purchases:</span>
                  <span className="font-bold text-slate-900">{currency.format(gstAnalysis.nonTaxablePurchases)}</span>
                </div>
              </div>
            </div>

            {/* Monthly GST Trends Chart */}
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">Monthly GST Collection Trend</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timelineTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip formatter={(val) => currencyDec.format(val)} />
                    <Line type="monotone" dataKey="gst" name="Output GST" stroke="#3f741f" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Threshold Configuration Modal */}
      {showSettings && settingsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-paddy-600" /> Insights & Intelligence Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Dead Stock Threshold (Days with 0 sales):
                </label>
                <input
                  type="number"
                  min="15"
                  max="365"
                  value={settingsForm.dead_stock_days}
                  onChange={e => setSettingsForm({ ...settingsForm, dead_stock_days: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 rounded text-sm outline-none focus:border-paddy-500"
                />
                <span className="text-[11px] text-slate-400">Default: 60 days</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Target Stock Coverage Days (Purchase Planning):
                </label>
                <input
                  type="number"
                  min="7"
                  max="120"
                  value={settingsForm.target_stock_days}
                  onChange={e => setSettingsForm({ ...settingsForm, target_stock_days: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 rounded text-sm outline-none focus:border-paddy-500"
                />
                <span className="text-[11px] text-slate-400">Default: 30 days of average daily demand</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Critical Stock Days (Imminent Stockout Warning):
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settingsForm.critical_stock_days}
                  onChange={e => setSettingsForm({ ...settingsForm, critical_stock_days: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 rounded text-sm outline-none focus:border-paddy-500"
                />
                <span className="text-[11px] text-slate-400">Default: 7 days</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Expiry Warning Threshold (FEFO Alerts):
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={settingsForm.expiry_warning_days}
                  onChange={e => setSettingsForm({ ...settingsForm, expiry_warning_days: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 rounded text-sm outline-none focus:border-paddy-500"
                />
                <span className="text-[11px] text-slate-400">Default: 90 days before batch expiry</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Credit Warning Limit (₹):
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={settingsForm.credit_warning_amount}
                  onChange={e => setSettingsForm({ ...settingsForm, credit_warning_amount: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-slate-200 rounded text-sm outline-none focus:border-paddy-500"
                />
                <span className="text-[11px] text-slate-400">Default: ₹25,000 pending farmer balance</span>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn flex-1 py-2 font-bold"
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
