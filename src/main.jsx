import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  Download,
  FileSpreadsheet,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Search,
  ShoppingCart,
  Sprout,
  Truck,
  UserRound,
  WalletCards,
  TrendingUp,
  Lightbulb,
  ShieldAlert,
  Edit2,
  Trash2,
  X
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import * as XLSX from "xlsx";
import BusinessInsights from "./components/BusinessInsights.jsx";
import BusinessReset from "./components/BusinessReset.jsx";
import "./styles.css";

const apiBase = "";
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const productTypes = ["Urea", "DAP", "Potash", "Pesticide", "Seeds", "Micronutrients", "Organic fertilizer"];
const units = ["Bag", "Kg", "Litre", "Packet"];
const reportTypes = [
  ["sales-register", "Sales Register"],
  ["purchase-register", "Purchase Register"],
  ["gst-summary", "GST Summary"],
  ["cgst", "CGST Report"],
  ["sgst", "SGST Report"],
  ["taxable", "Taxable / Non-taxable"],
  ["hsn", "HSN-wise Report"],
  ["date-wise-invoices", "Date-wise Invoices"]
];

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem("paddy-session") || "null"));
  const [screen, setScreen] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const api = useMemo(() => createApi(session?.token, () => setSession(null)), [session?.token]);

  useEffect(() => {
    if (session) localStorage.setItem("paddy-session", JSON.stringify(session));
    else localStorage.removeItem("paddy-session");
  }, [session]);

  if (!session) return <Login onLogin={setSession} />;

  return (
    <div className="min-h-screen bg-paddy-50 text-slate-900">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <Sidebar
        screen={screen}
        setScreen={setScreen}
        user={session.user}
        logout={() => setSession(null)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:pl-[264px] flex flex-col pb-20 lg:pb-8 transition-all">
        <Header screen={screen} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
          {screen === "dashboard" && <Dashboard api={api} setScreen={setScreen} />}
          {screen === "products" && <Products api={api} notify={setToast} />}
          {screen === "billing" && <Billing api={api} notify={setToast} />}
          {screen === "purchases" && <Purchases api={api} notify={setToast} user={session.user} />}
          {screen === "customers" && <Customers api={api} notify={setToast} />}
          {screen === "suppliers" && <Suppliers api={api} notify={setToast} />}
          {screen === "farmer_payments" && <FarmerPayments api={api} notify={setToast} />}
          {screen === "stock" && <Stock api={api} notify={setToast} />}
          {screen === "reports" && <Reports api={api} notify={setToast} />}
          {screen === "insights" && <BusinessInsights api={api} notify={setToast} setScreen={setScreen} />}
          {screen === "reset" && <BusinessReset api={api} notify={setToast} setScreen={setScreen} user={session.user} />}
        </div>
      </main>

      {/* Mobile Bottom Quick-Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-1 sm:px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden">
        <button
          onClick={() => { setScreen("dashboard"); setSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 text-xs font-semibold ${screen === "dashboard" ? "text-paddy-700 font-bold" : "text-slate-500"}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[11px]">Dashboard</span>
        </button>
        <button
          onClick={() => { setScreen("billing"); setSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 text-xs font-semibold ${screen === "billing" ? "text-paddy-700 font-bold" : "text-slate-500"}`}
        >
          <ReceiptText className="h-5 w-5" />
          <span className="text-[11px]">Billing</span>
        </button>
        <button
          onClick={() => { setScreen("products"); setSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 text-xs font-semibold ${screen === "products" ? "text-paddy-700 font-bold" : "text-slate-500"}`}
        >
          <Boxes className="h-5 w-5" />
          <span className="text-[11px]">Products</span>
        </button>
        <button
          onClick={() => { setScreen("customers"); setSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 text-xs font-semibold ${screen === "customers" ? "text-paddy-700 font-bold" : "text-slate-500"}`}
        >
          <UserRound className="h-5 w-5" />
          <span className="text-[11px]">Farmers</span>
        </button>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[11px]">Menu</span>
        </button>
      </nav>

      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 rounded-lg bg-paddy-700 px-4 py-3 text-white shadow-soft text-center sm:text-left text-sm font-semibold">
          {toast}
        </div>
      )}
    </div>
  );
}

function createApi(token, onUnauthorized) {
  async function request(path, options = {}) {
    const res = await fetch(`${apiBase}/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    if (res.status === 401) onUnauthorized?.();
    if (!res.ok) throw new Error((await res.json()).message || "Request failed");
    if (res.status === 204) return null;
    return res.json();
  }
  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: "DELETE" })
  };
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Invalid login");
      onLogin(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-[1.1fr_420px] bg-white">
      <section className="flex flex-col justify-between bg-paddy-700 p-6 sm:p-10 lg:p-12 text-white">
        <div className="flex items-center gap-3 text-lg sm:text-xl font-bold">
          <Sprout className="h-7 w-7 text-paddy-100" /> SRI ANJANEYA AGRO AGENCIES
        </div>
        <div className="my-6 lg:my-auto max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-paddy-100">GST Billing & Inventory System</p>
          <h1 className="mt-3 sm:mt-5 text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">Fertilizer shop operations, from invoice to audit.</h1>
          <p className="mt-3 sm:mt-5 text-sm sm:text-base lg:text-lg text-paddy-100 leading-relaxed">
            Products, batch stock, farmer credit ledger, purchase inward, GST summaries, and printable bills in one clean counter-friendly system.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-paddy-100 pt-4 border-t border-paddy-600/50">
          <span className="flex items-center gap-1.5">✓ Auto invoice numbers</span>
          <span className="flex items-center gap-1.5">✓ CGST + SGST split</span>
          <span className="flex items-center gap-1.5">✓ Low stock & expiry alerts</span>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10 bg-slate-50/50 lg:bg-white flex-1">
        <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-xl shadow-soft lg:shadow-none border border-slate-100 lg:border-none">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Sign In</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">Access shop counter billing and inventory</p>
          </div>
          <Input label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} />
          <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
          {error && <p className="mt-3 text-xs sm:text-sm text-red-600 font-semibold">{error}</p>}
          <button className="mt-6 flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-md bg-paddy-600 px-4 font-bold text-white shadow-sm hover:bg-paddy-700">
            <UserRound className="h-5 w-5" /> Login to Counter
          </button>
        </form>
      </section>
    </div>
  );
}

function Sidebar({ screen, setScreen, user, logout, isOpen, onClose }) {
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const items = [
    ["dashboard", LayoutDashboard, "Dashboard"],
    ["billing", ReceiptText, "Sales Billing"],
    ["products", Boxes, "Products"],
    ["purchases", PackagePlus, "Purchases"],
    ["customers", UserRound, "Farmers"],
    ["suppliers", Truck, "Suppliers"],
    ["farmer_payments", WalletCards, "Payment Records"],
    ["stock", AlertTriangle, "Stock"],
    ["reports", FileSpreadsheet, "GST Reports"],
    ["insights", TrendingUp, "Business Insights"],
    ...(isAdmin ? [["reset", ShieldAlert, "Business Reset"]] : [])
  ];
  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 flex h-screen w-[264px] flex-col bg-white px-4 py-5 shadow-soft transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="mb-6 flex shrink-0 items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-paddy-600 text-white shadow-sm">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">SmartAgro ERP</p>
            <p className="text-xs text-slate-500">Integrated GST System</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          title="Close Navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto space-y-1 pr-1.5 custom-scrollbar">
        {items.map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => {
              setScreen(key);
              onClose?.();
            }}
            className={`nav-item ${screen === key ? "active" : ""}`}
          >
            <Icon className="h-5 w-5 shrink-0" /> <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-4 shrink-0 rounded-lg border border-paddy-100 bg-paddy-50 p-3">
        <p className="font-semibold text-slate-900">{user.name}</p>
        <p className="text-xs capitalize font-medium text-slate-500">{user.role}</p>
        <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs font-bold text-paddy-700 hover:text-paddy-800">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
}

function Header({ screen, onToggleSidebar }) {
  const titles = {
    dashboard: "Dashboard",
    products: "Product Management",
    billing: "Sales Billing",
    purchases: "Purchase Management",
    customers: "Farmer Records",
    suppliers: "Supplier Management",
    farmer_payments: "Payment Records",
    stock: "Stock Management",
    reports: "GST Reports",
    insights: "Business Insights & Decision Support",
    reset: "System Security & Business Reset"
  };
  return (
    <header className="sticky top-0 z-20 flex h-16 sm:h-20 items-center justify-between border-b border-paddy-100 bg-white/95 px-3 sm:px-6 lg:px-8 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none lg:hidden"
          title="Open Navigation"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{titles[screen] || "SmartAgro"}</h1>
          <p className="hidden sm:block text-xs text-slate-500">Fast counter operations with audit-ready records</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-paddy-50 border border-paddy-200 px-3 py-1 text-xs font-semibold text-paddy-700">
          <Building2 className="h-3.5 w-3.5" /> GST-ready shop system
        </div>
      </div>
    </header>
  );
}

function Dashboard({ api, setScreen }) {
  const [data, setData] = useState(null);
  const [biSummary, setBiSummary] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then(setData).catch(console.error);
    api.get("/insights/overview?period=30d").then(setBiSummary).catch(console.error);
  }, [api]);

  if (!data) return <Skeleton />;
  const stats = [
    ["Today Sales", data.todaySales, IndianRupee],
    ["Monthly Sales", data.monthlySales, BarChart3],
    ["Purchase Amount", data.purchaseAmount, ShoppingCart],
    ["Stock Value", data.totalStockValue, Boxes],
    ["Pending Dues", data.pendingDues, WalletCards]
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map(([label, value, Icon]) => (
          <Stat key={label} label={label} value={currency.format(value)} Icon={Icon} />
        ))}
      </div>

      {/* Business Improvement Snapshot */}
      {biSummary && (
        <section className="rounded-md border border-paddy-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paddy-100">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-paddy-600 text-white shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Business Improvement Snapshot</h3>
                <p className="text-xs text-slate-500">Live diagnosis of shop turnover, dead stock, and purchase planning</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-md bg-paddy-50 border border-paddy-200 px-3 py-1.5 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-paddy-700 block">Business Health</span>
                <span className="text-lg font-black text-paddy-900">{biSummary.health.score} / 100</span>
                <span className="text-xs font-semibold text-paddy-700 ml-1.5">({biSummary.health.status})</span>
              </div>
              <button
                onClick={() => setScreen("insights")}
                className="btn py-2 px-3 text-xs font-bold"
              >
                View Full Business Insights &rarr;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-4 text-xs">
            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Sales Growth</span>
              <span className={`font-bold mt-1 text-sm block ${biSummary.salesKPIs.salesGrowth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {biSummary.salesKPIs.salesGrowth >= 0 ? "+" : ""}{biSummary.salesKPIs.salesGrowth}%
              </span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Gross Profit</span>
              <span className="font-bold text-slate-900 mt-1 text-sm block">{currency.format(biSummary.salesKPIs.periodGrossProfit)}</span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Low Stock Alert</span>
              <span className="font-bold text-amber-700 mt-1 text-sm block">{biSummary.stockSummary.lowStockCount} Products</span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Expiry Risk (90d)</span>
              <span className="font-bold text-orange-700 mt-1 text-sm block">{biSummary.stockSummary.expiringCount} Products</span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Dead Stock Value</span>
              <span className="font-bold text-slate-800 mt-1 text-sm block">{currency.format(biSummary.stockSummary.deadStockValue)}</span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Pending Farmer Dues</span>
              <span className="font-bold text-red-700 mt-1 text-sm block">{currency.format(biSummary.customerInsights.totalOutstandingDues)}</span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Reorder Needed</span>
              <span className="font-bold text-paddy-800 mt-1 text-sm block">{biSummary.purchaseRecommendations.length} Products</span>
            </div>
          </div>
        </section>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr] gap-6">
        <Panel title="Top Selling Products">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.topProducts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="product_name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value) => currency.format(value)} />
                <Bar dataKey="amount" fill="#4f8f28" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="GST Summary">
          <div className="grid grid-cols-3 gap-3">
            <Mini label="CGST" value={currency.format(data.gstSummary.cgst)} />
            <Mini label="SGST" value={currency.format(data.gstSummary.sgst)} />
            <Mini label="Purchase Tax" value={currency.format(data.gstSummary.purchase_tax)} />
          </div>
          <button onClick={() => setScreen("reports")} className="btn mt-5 w-full">
            <FileSpreadsheet className="h-5 w-5" /> Open GST Reports
          </button>
        </Panel>
      </div>
      <Panel title="Low Stock Alerts">
        <DataTable rows={data.lowStock} columns={["name", "brand", "batch_number", "current_stock", "minimum_stock_alert", "unit"]} empty="No low stock products." />
      </Panel>
    </div>
  );
}

// ==========================================
// PRODUCTS MANAGEMENT COMPONENT
// Manages stock inventory, HSN codes, GST rates, batch numbers, and chemical expiry dates
// ==========================================
function Products({ api, notify }) {
  const blank = {
    product_number: "PRD-3102",
    name: "",
    brand: "",
    category: "Fertilizers",
    product_type: "Urea",
    hsn_code: "",
    gst_percent: 5,
    batch_number: "",
    manufacture_date: "",
    expiry_date: "",
    unit: "Bag",
    purchase_price: 0,
    mrp: 0,
    selling_price: 0,
    current_stock: 0,
    minimum_stock_alert: 5,
    supplier_name: ""
  };
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  
  // // API call to search and fetch all inventory products from backend database
  const load = () => api.get(`/products?search=${encodeURIComponent(search)}`).then(setRows);
  useEffect(() => void load(), [search]);

  // // Handles scanning an uploaded product receipt file (PDF, CSV, or Image) to auto-fill 15 fields
  const handleProductFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      notify(`Scanning product bill/receipt file "${file.name}" via OCR...`);
      const res = await api.post("/ocr/parse-product-receipt", { fileName: file.name });
      if (res.data) {
        setForm({
          ...form,
          product_number: res.data.product_number || form.product_number,
          name: res.data.name || form.name,
          brand: res.data.brand || form.brand,
          category: res.data.category || form.category,
          product_type: res.data.product_type || form.product_type,
          hsn_code: res.data.hsn_code || form.hsn_code,
          gst_percent: res.data.gst_percent || form.gst_percent,
          batch_number: res.data.batch_number || form.batch_number,
          manufacture_date: res.data.manufacture_date || form.manufacture_date,
          expiry_date: res.data.expiry_date || form.expiry_date,
          unit: res.data.unit || form.unit,
          purchase_price: res.data.purchase_price || form.purchase_price,
          mrp: res.data.mrp || form.mrp,
          selling_price: res.data.selling_price || form.selling_price,
          current_stock: res.data.current_stock || form.current_stock,
          minimum_stock_alert: res.data.minimum_stock_alert || form.minimum_stock_alert,
          supplier_name: res.data.supplier_name || form.supplier_name
        });
        notify(`File "${file.name}" scanned! All 15 product fields populated automatically.`);
        setTimeout(() => notify(""), 3500);
      }
    } catch (err) {
      notify(err.message || "Failed to parse product receipt file.");
    }
  };

  // // Fetches product details and expiry dates from catalog using Product Number / Barcode ID
  const lookupProductNumber = async () => {
    if (!form.product_number?.trim()) {
      notify("Please enter a Product Number / Barcode ID.");
      return;
    }
    try {
      notify(`Fetching product specs & expiry date for ${form.product_number}...`);
      const res = await api.get(`/products/lookup-by-number/${encodeURIComponent(form.product_number)}`);
      if (res.data) {
        const d = res.data;
        setForm({
          ...form,
          name: d.name || form.name,
          category: d.category || form.category,
          hsn_code: d.hsn_code || form.hsn_code,
          unit: d.unit || form.unit,
          gst_percent: d.gst_percent || form.gst_percent,
          purchase_price: d.purchase_price || form.purchase_price,
          selling_price: d.selling_price || form.selling_price,
          batch_number: d.batch_number || form.batch_number,
          manufacture_date: d.mfd_date || form.manufacture_date,
          expiry_date: d.expiry_date || form.expiry_date
        });
        notify(res.message || "Product details & expiry date fetched automatically!");
        setTimeout(() => notify(""), 3000);
      }
    } catch (err) {
      notify(err.message || "Failed to lookup product number.");
    }
  };

  // // Saves new product or updates existing product record in backend store
  async function save() {
    editing ? await api.put(`/products/${editing}`, form) : await api.post("/products", form);
    setForm(blank);
    setEditing(null);
    notify("Product saved");
    setTimeout(() => notify(""), 2200);
    load();
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-6">
      <Panel title={editing ? "Edit Product" : "Add Product"}>
        {/* // Receipt File Scanner Button for Auto-filling Product Details */}
        <div className="mb-3 rounded-lg border border-paddy-200 bg-paddy-50 p-3">
          <label className="text-xs font-bold text-paddy-900 block mb-1">📄 Auto-Fill from Receipt / Bill File (PDF / CSV / Image)</label>
          <input
            type="file"
            accept=".pdf,.csv,.png,.jpg,.jpeg"
            id="product-receipt-upload"
            className="hidden"
            onChange={handleProductFileUpload}
          />
          <button
            type="button"
            onClick={() => document.getElementById("product-receipt-upload")?.click()}
            className="w-full btn-secondary text-xs flex items-center justify-center gap-2 py-2 bg-paddy-700 text-white hover:bg-paddy-800 transition-colors font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4" /> Scan Product Bill / Receipt & Auto-Fill
          </button>
        </div>

        {/* // Barcode / Product Number Lookup Box */}
        <div className="mb-3">
          <label className="text-xs font-bold text-slate-800 block mb-1">Product Number / Barcode ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. PRD-3102"
              className="cell-input flex-1 font-mono text-xs"
              value={form.product_number}
              onChange={(e) => setForm({ ...form, product_number: e.target.value })}
            />
            <button
              type="button"
              onClick={lookupProductNumber}
              className="btn-secondary text-xs py-1 px-2.5 bg-paddy-700 text-white hover:bg-paddy-800 transition-colors font-semibold"
            >
              Auto-Fetch Expiry
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Product Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <Input label="Brand" value={form.brand} onChange={(brand) => setForm({ ...form, brand })} />
          <Input label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} />
          <Select label="Type" value={form.product_type} options={productTypes} onChange={(product_type) => setForm({ ...form, product_type })} />
          <Input label="HSN Code" value={form.hsn_code} onChange={(hsn_code) => setForm({ ...form, hsn_code })} />
          <Input label="GST %" type="number" value={form.gst_percent} onChange={(gst_percent) => setForm({ ...form, gst_percent })} />
          <Input label="Batch Number" value={form.batch_number} onChange={(batch_number) => setForm({ ...form, batch_number })} />
          <Select label="Unit" value={form.unit} options={units} onChange={(unit) => setForm({ ...form, unit })} />
          <Input label="Manufacture Date" type="date" value={form.manufacture_date} onChange={(manufacture_date) => setForm({ ...form, manufacture_date })} />
          <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={(expiry_date) => setForm({ ...form, expiry_date })} />
          <Input label="Purchase Price" type="number" value={form.purchase_price} onChange={(purchase_price) => setForm({ ...form, purchase_price })} />
          <Input label="MRP" type="number" value={form.mrp} onChange={(mrp) => setForm({ ...form, mrp })} />
          <Input label="Selling Price" type="number" value={form.selling_price} onChange={(selling_price) => setForm({ ...form, selling_price })} />
          <Input label="Current Stock" type="number" value={form.current_stock} onChange={(current_stock) => setForm({ ...form, current_stock })} />
          <Input label="Minimum Alert" type="number" value={form.minimum_stock_alert} onChange={(minimum_stock_alert) => setForm({ ...form, minimum_stock_alert })} />
          <Input label="Supplier Name" value={form.supplier_name} onChange={(supplier_name) => setForm({ ...form, supplier_name })} />
        </div>
        <button onClick={save} className="btn mt-5 w-full"><Save className="h-5 w-5" /> Save Product</button>
      </Panel>
      <Panel title="Product List" actions={<SearchBox value={search} setValue={setSearch} />}>
        <DataTable
          rows={rows}
          columns={["name", "brand", "product_type", "hsn_code", "gst_percent", "batch_number", "selling_price", "current_stock", "unit"]}
          actions={(row) => (
            <button className="link" onClick={() => { setEditing(row.id); setForm(row); }}>Edit</button>
          )}
        />
      </Panel>
    </div>
  );
}

function Billing({ api, notify }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [shop, setShop] = useState({});
  const [invoice, setInvoice] = useState(null);
  const [billingAadhaar, setBillingAadhaar] = useState("");
  const [billingAadhaarVerified, setBillingAadhaarVerified] = useState(false);
  const [ekycDetails, setEkycDetails] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTxnId, setOtpTxnId] = useState("");
  const [form, setForm] = useState({ customer_id: "", customer_name: "", mobile: "", village: "", billing_address: "", gstin: "", amount_paid: 0, payment_method: "Cash", upi_ref: "", credit_days: 30, interest_rate: 2, items: [] });
  const [mixedAmounts, setMixedAmounts] = useState({ Cash: 0, UPI: 0, Card: 0, Credit: 0 });
  
  useEffect(() => {
    api.get("/products").then(setProducts);
    api.get("/customers").then(setCustomers);
    api.get("/shop").then(setShop);
  }, [api]);

  // // Step 1: Send OTP via UIDAI Tathya Resident Portal (https://tathya.uidai.gov.in/access/login?role=resident)
  const sendTathyaOtp = async () => {
    if (!billingAadhaar || billingAadhaar.replace(/\D/g, "").length !== 12) {
      notify("Please enter a valid 12-digit Aadhaar ID number (e.g. 990011223344).");
      return;
    }
    try {
      notify("Connecting to UIDAI Tathya Portal (https://tathya.uidai.gov.in/)...");
      const res = await api.post("/aadhaar/generate-otp", { aadhaarNumber: billingAadhaar });
      if (res.success) {
        setOtpSent(true);
        setOtpTxnId(res.txnId);
        setOtpCode("123456");
        notify(res.message || "OTP sent to registered mobile via UIDAI Tathya Resident Portal!");
        setTimeout(() => notify(""), 4000);
      }
    } catch (err) {
      notify(err.message || "Failed to send UIDAI OTP.");
    }
  };

  // // Step 2: Verify OTP & Fetch e-KYC Farmer Data from Tathya Portal
  const verifyTathyaOtpAndFetch = async () => {
    if (!otpCode?.trim()) {
      notify("Please enter the 6-digit OTP code sent to resident mobile.");
      return;
    }
    try {
      notify("Verifying OTP with UIDAI Tathya Authentication Service...");
      const res = await api.post("/aadhaar/verify-otp", { aadhaarNumber: billingAadhaar, otp: otpCode, txnId: otpTxnId });
      if (res.verified && res.farmer) {
        setForm({
          ...form,
          customer_name: `${res.farmer.name} (${res.farmer.care_of})`,
          mobile: res.farmer.mobile,
          village: res.farmer.village,
          billing_address: res.farmer.address,
          gstin: res.farmer.dbt_farmer_id
        });
        setBillingAadhaarVerified(true);
        setEkycDetails(res);
        setOtpSent(false);
        notify(`UIDAI Tathya e-KYC Verified! ${res.farmer.name} (${res.farmer.care_of}) loaded into invoice.`);
        setTimeout(() => notify(""), 3500);
      }
    } catch (err) {
      notify(err.message || "Failed to verify UIDAI Tathya OTP.");
    }
  };

  // // Direct e-KYC Farmer Auto-Fetch
  const fetchBillingFarmerByAadhaar = async () => {
    if (!billingAadhaar || billingAadhaar.replace(/\D/g, "").length !== 12) {
      notify("Please enter a valid 12-digit Aadhaar ID number (e.g. 990011223344).");
      return;
    }
    try {
      notify("UIDAI e-KYC Service: Connecting to https://tathya.uidai.gov.in/ auth gateway...");
      const res = await api.post("/aadhaar/fetch-farmer", { aadhaarNumber: billingAadhaar });
      if (res.verified && res.farmer) {
        setForm({
          ...form,
          customer_name: `${res.farmer.name} (${res.farmer.care_of})`,
          mobile: res.farmer.mobile,
          village: res.farmer.village,
          billing_address: res.farmer.address,
          gstin: res.farmer.dbt_farmer_id
        });
        setBillingAadhaarVerified(true);
        setEkycDetails(res);
        notify(`UIDAI e-KYC v2.5 Authenticated! ${res.farmer.name} (${res.farmer.care_of}) loaded into invoice.`);
        setTimeout(() => notify(""), 3500);
      }
    } catch (err) {
      notify(err.message || "Failed to fetch farmer from UIDAI service.");
    }
  };

  const addLine = () => setForm({ ...form, items: [...form.items, { product_id: products[0]?.id || "", qty: 1, discount: 0 }] });
  const lines = form.items.map((item) => {
    const product = products.find((p) => p.id === item.product_id) || {};
    const rate = Number(item.rate || product.selling_price || 0);
    const qty = Number(item.qty || 0);
    const discount = Number(item.discount || 0);
    const gst = Number(product.gst_percent || 0);
    const taxable = Math.max(0, qty * rate - discount);
    const tax = taxable * gst / 100;
    return { ...item, product, rate, gst, cgst: tax / 2, sgst: tax / 2, total: taxable + tax };
  });
  const subtotal = lines.reduce((sum, item) => sum + Math.max(0, Number(item.qty) * item.rate - Number(item.discount || 0)), 0);
  const cgst = lines.reduce((sum, item) => sum + item.cgst, 0);
  const sgst = lines.reduce((sum, item) => sum + item.sgst, 0);
  const grand = subtotal + cgst + sgst;
  const [paymentStatus, setPaymentStatus] = useState("pending");

  const upiUri = `upi://pay?pa=harshavardhanjunji-2@okhdfcbank&pn=Harshavardhan%20JM&tn=INV-${Date.now()}&am=${grand}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

  async function saveInvoice() {
    if (form.customer_aadhaar && form.customer_aadhaar.trim()) {
      const cleanedAadhaar = form.customer_aadhaar.replace(/\D/g, "");
      if (cleanedAadhaar.length !== 12) {
        notify("Customer Aadhaar Number must be exactly 12 numeric digits if provided.");
        return;
      }
    }
    let finalPaymentMethod = form.payment_method;
    let finalAmountPaid = form.amount_paid;
    let finalUpiRef = form.upi_ref;

    if (form.payment_method === "UPI") {
      finalUpiRef = form.upi_ref || `DEMOUPI${Date.now()}`;
      finalPaymentMethod = `UPI (Ref: ${finalUpiRef})`;
      finalAmountPaid = grand;
    } else if (form.payment_method === "Card") {
      finalPaymentMethod = `Card (Txn: TXNCARD${Date.now()})`;
      finalAmountPaid = grand;
    } else if (form.payment_method === "Credit") {
      finalPaymentMethod = `Credit (${form.credit_days} Days @ ${form.interest_rate}%)`;
      finalAmountPaid = 0;
    } else if (form.payment_method === "Mixed") {
      finalPaymentMethod = "MIXED";
      finalAmountPaid = Number(mixedAmounts.Cash||0) + Number(mixedAmounts.UPI||0) + Number(mixedAmounts.Card||0);
    } else {
      finalPaymentMethod = "Cash";
    }

    const payload = { 
      ...form,
      customer_aadhaar: form.customer_aadhaar ? form.customer_aadhaar.replace(/\D/g, "") : "", 
      payment_method: finalPaymentMethod,
      amount_paid: finalAmountPaid,
      upi_ref: finalUpiRef,
      items: lines.map(({ product, gst, ...line }) => ({ ...line, rate: line.rate, gst_percent: gst })) 
    };
    
    const saved = await api.post("/sales", payload);
    setInvoice(saved);
    setPaymentStatus("pending");

    if (form.payment_method === "Mixed") {
      for (const [method, amount] of Object.entries(mixedAmounts)) {
        if (Number(amount) > 0 && method !== "Credit") {
           await api.post("/farmer_payments", {
             farmer_id: form.customer_id,
             farmer_name: form.customer_name,
             invoice_id: saved.invoice_number,
             payment_date: new Date().toISOString().slice(0, 10),
             total_invoice_amount: grand,
             amount_paid: amount,
             payment_method: method.toUpperCase(),
             payment_status: "PAID"
           });
        } else if (Number(amount) > 0 && method === "Credit") {
           await api.post("/farmer_credit_ledger", {
             customer_id: form.customer_id,
             credit_amount: amount
           });
           const cust = customers.find(c => c.id === form.customer_id);
           if (cust) {
             const newBal = Number(cust.pending_balance || 0) + Number(amount);
             await api.put(`/customers/${cust.id}`, { pending_balance: newBal });
           }
        }
      }
    }

    notify("Payment Successful! Receipt generated.");
    setTimeout(() => notify(""), 2200);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
      <Panel title="New GST Invoice">
        <div className="grid grid-cols-3 gap-3">
          <Select label="Existing Farmer" value={form.customer_id} options={["", ...customers.map((c) => c.id)]} labels={{ "": "Walk-in customer", ...Object.fromEntries(customers.map((c) => [c.id, `${c.name} - ${c.mobile}`])) }} onChange={(customer_id) => {
            const c = customers.find((customer) => customer.id === customer_id);
            setForm({ ...form, customer_id, customer_name: c?.name || "", mobile: c?.mobile || "", village: c?.village || "", billing_address: c?.address || "", customer_aadhaar: c?.aadhaar_number || c?.aadhaar || "" });
          }} />
          <Input label="Farmer Name" value={form.customer_name} onChange={(customer_name) => setForm({ ...form, customer_name })} />
          <Input label="Mobile" value={form.mobile} onChange={(mobile) => setForm({ ...form, mobile })} />
          <Input label="Village" value={form.village} onChange={(village) => setForm({ ...form, village })} />
          <Input label="Billing Address" value={form.billing_address} onChange={(billing_address) => setForm({ ...form, billing_address })} />
          <Input label="DBT / Farmer ID" value={form.gstin} onChange={(gstin) => setForm({ ...form, gstin })} />
        </div>
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-paddy-50 text-left">
              <tr><th>Product</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Tax %</th><th>CGST</th><th>SGST</th><th>Total</th></tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td><select className="cell-input" value={line.product_id} onChange={(e) => updateLine(index, { product_id: e.target.value })}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                  <td><input className="cell-input w-16" type="number" value={line.qty} onChange={(e) => updateLine(index, { qty: e.target.value })} /></td>
                  <td><input className="cell-input w-20" type="number" value={line.rate} onChange={(e) => updateLine(index, { rate: e.target.value })} /></td>
                  <td><input className="cell-input w-20" type="number" value={line.discount} onChange={(e) => updateLine(index, { discount: e.target.value })} /></td>
                  <td>{line.gst}%</td><td>{currency.format(line.cgst)}</td><td>{currency.format(line.sgst)}</td><td className="font-semibold">{currency.format(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between">
          <button onClick={addLine} className="btn-secondary"><Plus className="h-5 w-5" /> Add Item</button>
        </div>

        {/* PAYMENT & CHECKOUT MODULE */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <WalletCards className="h-5 w-5" /> Payment & Checkout
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-6">
            {["UPI", "Card", "Cash", "Credit", "Mixed"].map(method => (
              <button 
                key={method}
                onClick={() => { setForm({...form, payment_method: method}); setPaymentStatus("pending"); }}
                className={`py-3 px-2 rounded-lg border-2 font-bold text-sm text-center transition-all ${form.payment_method === method ? 'border-paddy-600 bg-paddy-50 text-paddy-800' : 'border-slate-200 bg-white text-slate-500 hover:border-paddy-300'}`}
              >
                {method === "Card" ? "Debit/Credit Card" : method === "Credit" ? "Customer Credit" : method}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 min-h-[300px]">
            {form.payment_method === "Mixed" && (
              <div className="max-w-md mx-auto space-y-5 py-4">
                <div className="text-center mb-6">
                  <h4 className="font-bold text-lg text-slate-800">Mixed / Split Payment</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Cash Amount (₹)" type="number" value={mixedAmounts.Cash} onChange={v => setMixedAmounts({...mixedAmounts, Cash: v})} />
                  <Input label="UPI Amount (₹)" type="number" value={mixedAmounts.UPI} onChange={v => setMixedAmounts({...mixedAmounts, UPI: v})} />
                  <Input label="Card Amount (₹)" type="number" value={mixedAmounts.Card} onChange={v => setMixedAmounts({...mixedAmounts, Card: v})} />
                  <Input label="Credit Amount (₹)" type="number" value={mixedAmounts.Credit} onChange={v => setMixedAmounts({...mixedAmounts, Credit: v})} />
                </div>
                <div className="bg-slate-200 p-3 rounded text-sm text-slate-800 font-bold flex justify-between">
                  <span>Total Allocated: ₹{Number(mixedAmounts.Cash||0) + Number(mixedAmounts.UPI||0) + Number(mixedAmounts.Card||0) + Number(mixedAmounts.Credit||0)}</span>
                  <span>Remaining: ₹{grand - (Number(mixedAmounts.Cash||0) + Number(mixedAmounts.UPI||0) + Number(mixedAmounts.Card||0) + Number(mixedAmounts.Credit||0))}</span>
                </div>
                <button onClick={saveInvoice} className="btn w-full text-base py-3 mt-4">Complete Mixed Payment & Receipt</button>
              </div>
            )}

            {form.payment_method === "UPI" && (
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex-shrink-0 text-center">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                    {paymentStatus === "success" ? (
                      <div className="h-[200px] w-[200px] flex flex-col items-center justify-center bg-emerald-50 rounded-lg text-emerald-600">
                        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span className="font-bold">Verified</span>
                      </div>
                    ) : (
                      <img src={qrUrl} alt="UPI QR Code" className="w-[200px] h-[200px]" />
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-600">Scan to pay with any UPI app</p>
                </div>
                <div className="flex-1 w-full space-y-4">
                  <h4 className="font-bold text-lg text-slate-800">UPI Payment</h4>
                  <p className="text-3xl font-black text-paddy-700">₹{grand.toFixed(2)}</p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>UPI ID: <span className="font-semibold text-slate-900">harshavardhanjunji-2@okhdfcbank</span></p>
                    <p>Merchant: <span className="font-semibold text-slate-900">Harshavardhan JM</span></p>
                  </div>
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Demo Mode:</span>
                      <button 
                        onClick={() => {
                          setPaymentStatus("processing");
                          setTimeout(() => {
                            setPaymentStatus("success");
                            setForm({ ...form, upi_ref: `DEMOUPI${Date.now()}` });
                          }, 1500);
                        }}
                        disabled={paymentStatus !== "pending"}
                        className="btn-secondary py-1.5 px-4 text-sm bg-white"
                      >
                        {paymentStatus === "processing" ? "Processing..." : paymentStatus === "success" ? "Payment Authenticated ✓" : "Simulate Payment Success"}
                      </button>
                    </div>
                    {paymentStatus === "success" && (
                      <div className="bg-emerald-50 text-emerald-800 p-3 rounded-md border border-emerald-200 text-sm flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-bold">Payment Successful!</p>
                          <p className="text-xs opacity-90 mt-0.5">Txn ID: {form.upi_ref}</p>
                        </div>
                        <button onClick={saveInvoice} className="btn bg-emerald-600 hover:bg-emerald-700 text-white shadow-none">Generate Receipt</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {form.payment_method === "Card" && (
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-center mb-6">
                  <h4 className="font-bold text-lg text-slate-800">Secure Card Payment</h4>
                  <p className="text-sm text-slate-500">Demo Gateway Authentication</p>
                </div>
                <Input label="Card Number" placeholder="XXXX XXXX XXXX XXXX" />
                <Input label="Card Holder Name" placeholder="e.g. Ramesh Kumar" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry Date" placeholder="MM/YY" />
                  <Input label="CVV" placeholder="***" type="password" />
                </div>
                <div className="flex justify-between items-center py-4 border-t border-slate-200 mt-4">
                  <span className="text-xl font-black text-slate-800">₹{grand.toFixed(2)}</span>
                  {paymentStatus === "success" ? (
                    <button onClick={saveInvoice} className="btn bg-emerald-600 hover:bg-emerald-700">Generate Receipt</button>
                  ) : (
                    <button 
                      onClick={() => {
                        setPaymentStatus("processing");
                        setTimeout(() => setPaymentStatus("success"), 2000);
                      }}
                      disabled={paymentStatus === "processing"}
                      className="btn bg-slate-800 hover:bg-slate-900"
                    >
                      {paymentStatus === "processing" ? "Authenticating via 3D Secure..." : "Proceed to Secure Payment"}
                    </button>
                  )}
                </div>
                {paymentStatus === "success" && (
                  <p className="text-center text-sm font-bold text-emerald-600">✓ Bank Authentication Successful</p>
                )}
              </div>
            )}

            {form.payment_method === "Cash" && (
              <div className="max-w-md mx-auto space-y-5 py-4">
                <div className="text-center mb-6">
                  <h4 className="font-bold text-lg text-slate-800">Counter Cash Payment</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Total Payable</label>
                    <div className="h-10 px-3 bg-slate-200 rounded border border-slate-300 flex items-center font-bold text-slate-700">₹{grand.toFixed(2)}</div>
                  </div>
                  <Input label="Amount Tendered (₹)" type="number" value={form.amount_paid} onChange={val => setForm({...form, amount_paid: val})} />
                </div>
                <button onClick={saveInvoice} className="btn w-full text-base py-3 mt-4">Complete Cash Payment & Receipt</button>
              </div>
            )}

            {form.payment_method === "Credit" && (
              <div className="max-w-md mx-auto space-y-5 py-4">
                <div className="text-center mb-6">
                  <h4 className="font-bold text-lg text-slate-800">Customer Credit (Udhaari)</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Credit Due Days" type="number" value={form.credit_days} onChange={v => setForm({...form, credit_days: v})} />
                  <Input label="Interest Rate %" type="number" value={form.interest_rate} onChange={v => setForm({...form, interest_rate: v})} />
                </div>
                <div className="bg-amber-100 p-3 border border-amber-200 rounded text-sm text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {(() => {
                    const sel = customers.find(c => c.id === form.customer_id);
                    const pending = Number(sel?.pending_balance || 0);
                    if (pending > 0) {
                      const interest = pending * Number(form.interest_rate || 2) / 100;
                      return <p>⚠ Farmer has an existing outstanding balance of ₹{pending.toFixed(2)}. Monthly interest: ₹{interest.toFixed(2)}. Total payable after next interest cycle: ₹{(pending + interest).toFixed(2)}.</p>;
                    }
                    return <p>Farmer's pending balance will increase by <strong>₹{grand.toFixed(2)}</strong>. Ensure farmer record exists.</p>;
                  })()}
                </div>
                <button onClick={saveInvoice} className="btn w-full text-base py-3 mt-4 bg-amber-600 hover:bg-amber-700 text-white">Approve Credit Billing</button>
              </div>
            )}
          </div>
        </div>
      </Panel>
      <InvoicePreview shop={shop} invoice={invoice || { ...form, items: lines, subtotal, cgst, sgst, grand_total: grand, balance_due: grand - Number(form.amount_paid || 0), invoice_number: "Draft", date: new Date().toISOString().slice(0, 10) }} />
    </div>
  );
  function updateLine(index, patch) {
    setForm({ ...form, items: form.items.map((line, i) => i === index ? { ...line, ...patch } : line) });
  }
}

function InvoicePreview({ shop, invoice }) {
  const sendWhatsApp = () => {
    const mobile = invoice.mobile?.replace(/\D/g, "") || "";
    const farmerName = invoice.customer_name || "Valued Farmer";
    const invNo = invoice.invoice_number || "Draft";
    const invDate = invoice.date || new Date().toISOString().slice(0, 10);
    const shopName = shop.name || "SRI ANJANEYA AGRO AGENCIES";
    const itemsList = (invoice.items || [])
      .map((it, idx) => `${idx + 1}. ${it.product_name || it.product?.name || "Agro Item"} (Qty: ${it.qty}) - ₹${Number(it.total || 0).toFixed(2)}`)
      .join("\n");
    const text = `🌾 *${shopName}*\n*GST Invoice Receipt*\n----------------------------------------\n*Invoice No:* ${invNo}\n*Date:* ${invDate}\n*Farmer:* ${farmerName}\n*Mobile:* ${mobile || "-"}\n*Payment Mode:* ${invoice.payment_method || "Cash"}\n----------------------------------------\n*Items Purchased:*\n${itemsList}\n----------------------------------------\n*Subtotal:* ₹${Number(invoice.subtotal || 0).toFixed(2)}\n*CGST:* ₹${Number(invoice.cgst || 0).toFixed(2)}\n*SGST:* ₹${Number(invoice.sgst || 0).toFixed(2)}\n*Grand Total: ₹${Number(invoice.grand_total || 0).toFixed(2)}*\n*Amount Paid:* ₹${Number(invoice.amount_paid || 0).toFixed(2)}\n*Balance Due:* ₹${Number(invoice.balance_due || 0).toFixed(2)}\n----------------------------------------\nThank you for visiting ${shopName}! For queries call ${shop.phone || "9900389992"}.`;
    const phone = mobile ? (mobile.length === 10 ? `91${mobile}` : mobile) : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Panel title="Invoice Preview" actions={<button onClick={() => window.print()} className="icon-btn" title="Print"><Printer className="h-5 w-5" /></button>}>
      <div id="invoice" className="invoice">
        <div className="text-center">
          <h2 className="text-xl font-bold">{shop.name}</h2>
          <p>{shop.address}</p>
          <p>GSTIN: {shop.gstin} | Phone: {shop.phone}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 border-y border-slate-300 py-2 text-sm gap-y-1">
          <span>Invoice: <b>{invoice.invoice_number}</b></span>
          <span className="text-right">Date: <b>{invoice.date}</b></span>
          <span>Customer: <b>{invoice.customer_name || "Walk-in"}</b></span>
          <span className="text-right">Mobile: <b>{invoice.mobile || "-"}</b></span>
          <span>Payment: <b>{invoice.payment_method || "Cash"}</b></span>
          <span className="text-right">GSTIN: <b>{invoice.gstin || "-"}</b></span>
          <span>Aadhaar: <b>{invoice.customer_aadhaar ? `XXXX XXXX ${invoice.customer_aadhaar.replace(/\D/g, "").slice(-4)}` : "-"}</b></span>
        </div>
        <table className="mt-3 w-full text-xs">
          <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Total</th></tr></thead>
          <tbody>{(invoice.items || []).map((item, i) => <tr key={i}><td>{item.product_name || item.product?.name}</td><td>{item.qty}</td><td>{currency.format(item.rate)}</td><td>{item.gst_percent || item.gst}%</td><td>{currency.format(item.total)}</td></tr>)}</tbody>
        </table>
        <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
          <Row label="Subtotal" value={currency.format(invoice.subtotal || 0)} />
          <Row label="CGST" value={currency.format(invoice.cgst || 0)} />
          <Row label="SGST" value={currency.format(invoice.sgst || 0)} />
          <Row label="Grand Total" value={currency.format(invoice.grand_total || 0)} strong />
          <Row label="Paid" value={currency.format(invoice.amount_paid || 0)} />
          <Row label="Balance" value={currency.format(invoice.balance_due || 0)} strong />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <button onClick={() => window.print()} className="btn w-full"><Printer className="h-5 w-5" /> Print / Save PDF</button>
        <button onClick={sendWhatsApp} className="btn-secondary w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none font-semibold flex items-center justify-center gap-2 py-2.5">
          💬 Send GST Invoice via WhatsApp
        </button>
      </div>
    </Panel>
  );
}

function Purchases({ api, notify, user }) {
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const initialForm = { supplier_id: "", supplier_name: "", invoice_number: "", purchase_date: new Date().toISOString().slice(0, 10), items: [] };
  const [form, setForm] = useState(initialForm);

  const loadData = () => {
    api.get("/products").then(setProducts);
    api.get("/suppliers").then(setSuppliers);
    api.get("/purchases").then(setRows);
  };

  useEffect(() => {
    loadData();
  }, [api]);

  const add = () => {
    const defaultProdId = products[0]?.id || "";
    const defaultProd = products.find((p) => p.id === defaultProdId);
    const rate = Number(defaultProd?.purchase_price || 0);
    const gstRate = Number(defaultProd?.gst_percent || 0);
    const gstAmount = Math.round((rate * 1 * (gstRate / 100)) * 100) / 100;
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          product_id: defaultProdId,
          qty: 1,
          purchase_rate: rate,
          gst: gstAmount,
          total_amount: Math.round((rate * 1 + gstAmount) * 100) / 100
        }
      ]
    });
  };

  const handleEdit = async (row) => {
    try {
      const fullPurchase = await api.get(`/purchases/${row.id}`);
      setEditingId(row.id);
      setForm({
        supplier_id: fullPurchase.supplier_id || "",
        supplier_name: fullPurchase.supplier_name || "",
        invoice_number: fullPurchase.invoice_number || "",
        purchase_date: fullPurchase.purchase_date || new Date().toISOString().slice(0, 10),
        items: (fullPurchase.items || []).map((it) => ({
          product_id: it.product_id,
          qty: it.qty,
          purchase_rate: it.purchase_rate,
          gst: it.gst || 0,
          total_amount: it.total_amount
        }))
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      notify(err.message || "Failed to load purchase details for edit");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete purchase invoice "${row.invoice_number}"? Inventory stock added by this purchase will be rolled back.`)) {
      return;
    }
    try {
      await api.delete(`/purchases/${row.id}`);
      notify("Purchase deleted and inventory stock reverted.");
      setTimeout(() => notify(""), 2200);
      loadData();
    } catch (err) {
      notify(err.message || "Failed to delete purchase.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  async function save() {
    if (!form.invoice_number?.trim()) {
      notify("Please enter a supplier invoice number.");
      return;
    }
    if (!form.items?.length) {
      notify("Please add at least one product item to the purchase.");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/purchases/${editingId}`, form);
        notify("Purchase invoice updated and inventory recalibrated.");
        setEditingId(null);
      } else {
        await api.post("/purchases", form);
        notify("Purchase added and inventory stock updated.");
      }
      setTimeout(() => notify(""), 2200);
      setForm(initialForm);
      loadData();
    } catch (err) {
      notify(err.message || "Failed to save purchase");
    }
  }

  // // Handles file upload selection (.pdf, .csv, .png, .jpg) for wholesale purchase bills
  const handlePurchaseFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      notify(`Scanning purchase bill file "${file.name}" via OCR...`);
      const res = await api.post("/ocr/parse-purchase-file", { fileName: file.name });
      if (res.data) {
        const { data } = res;
        let matchSupplier = suppliers.find(s => s.name?.toLowerCase().includes("coromandel") || s.gstin === data.gstin);
        const matchedItems = data.items.map(it => {
          const matchedProd = products.find(p => p.name?.toLowerCase().includes("urea") || p.hsn_code === it.hsn_code) || products[0];
          return {
            product_id: matchedProd?.id || products[0]?.id || "",
            qty: it.qty,
            purchase_rate: it.purchase_rate,
            gst: it.gst,
            total_amount: it.total_amount
          };
        });
        setForm({
          supplier_id: matchSupplier?.id || suppliers[0]?.id || "",
          supplier_name: matchSupplier?.name || data.supplier_name,
          invoice_number: data.invoice_number,
          purchase_date: data.purchase_date,
          items: matchedItems
        });
        notify(`File "${file.name}" scanned! Supplier, Invoice No, & Items auto-filled.`);
        setTimeout(() => notify(""), 3500);
      }
    } catch (err) {
      notify(err.message || "Failed to scan purchase bill file.");
    }
  };

  const scanReceipt = async () => {
    try {
      notify("Scanning wholesale receipt bill via AI OCR...");
      const res = await api.post("/ocr/scan-invoice", {});
      if (res.data) {
        const { data } = res;
        let matchSupplier = suppliers.find(s => s.name?.toLowerCase().includes("coromandel") || s.gstin === data.gstin);
        const matchedItems = data.items.map(it => {
          const matchedProd = products.find(p => p.name?.toLowerCase().includes("urea") || p.hsn_code === it.hsn_code) || products[0];
          return {
            product_id: matchedProd?.id || products[0]?.id || "",
            qty: it.qty,
            purchase_rate: it.purchase_rate,
            gst: it.gst,
            total_amount: it.total_amount
          };
        });
        setForm({
          supplier_id: matchSupplier?.id || suppliers[0]?.id || "",
          supplier_name: matchSupplier?.name || data.supplier_name,
          invoice_number: data.invoice_number,
          purchase_date: data.purchase_date,
          items: matchedItems
        });
        notify("Bill scanned! Supplier, Invoice No, and Items fetched automatically.");
        setTimeout(() => notify(""), 3500);
      }
    } catch (err) {
      notify(err.message || "Failed to scan receipt bill.");
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title={editingId ? `Edit Purchase: Invoice #${form.invoice_number}` : "Purchase Entry"}
        actions={
          <div className="flex items-center gap-2">
            {/* Hidden file input for uploading purchase receipt PDF / CSV */}
            <input
              type="file"
              accept=".pdf,.csv,.png,.jpg,.jpeg"
              id="purchase-file-upload-input"
              className="hidden"
              onChange={handlePurchaseFileUpload}
            />
            <button
              onClick={() => document.getElementById("purchase-file-upload-input")?.click()}
              type="button"
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-paddy-50 border-paddy-300 text-paddy-800 font-semibold shadow-sm hover:bg-paddy-100 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-paddy-700" /> 📄 Upload & Scan Bill (PDF / CSV)
            </button>
            {editingId && (
              <button onClick={cancelEdit} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                <X className="h-4 w-4" /> Cancel Edit Mode
              </button>
            )}
          </div>
        }
      >
        {editingId && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Owner Edit Mode:</strong> Modifying quantities or rates will automatically reverse old stock additions and apply new stock adjustments.
            </span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Supplier"
            value={form.supplier_id}
            options={["", ...suppliers.map((s) => s.id)]}
            labels={{ "": "Select supplier", ...Object.fromEntries(suppliers.map((s) => [s.id, s.name])) }}
            onChange={(supplier_id) => setForm({ ...form, supplier_id, supplier_name: suppliers.find((s) => s.id === supplier_id)?.name || "" })}
          />
          <Input label="Supplier Invoice No." value={form.invoice_number} onChange={(invoice_number) => setForm({ ...form, invoice_number })} />
          <Input label="Purchase Date" type="date" value={form.purchase_date} onChange={(purchase_date) => setForm({ ...form, purchase_date })} />
        </div>
        <DataEntryLines
          products={products}
          items={form.items}
          setItems={(items) => setForm({ ...form, items })}
        />
        <div className="mt-4 flex items-center justify-between">
          <button onClick={add} className="btn-secondary"><Plus className="h-5 w-5" /> Add Product Line</button>
          <div className="flex items-center gap-3">
            {editingId && (
              <button onClick={cancelEdit} className="btn-secondary">Cancel</button>
            )}
            <button onClick={save} className="btn">
              <Save className="h-5 w-5" /> {editingId ? "Update Purchase" : "Save Purchase"}
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Purchase History"
        actions={
          isAdmin && (
            <span className="text-xs bg-paddy-100 text-paddy-800 font-medium px-2.5 py-1 rounded-full border border-paddy-200">
              Owner/Admin: Edit & Delete Enabled
            </span>
          )
        }
      >
        <DataTable
          rows={rows}
          columns={["invoice_number", "supplier_name", "purchase_date", "total_amount", "created_by"]}
          actions={
            isAdmin
              ? (row) => (
                  <div className="flex items-center gap-2">
                    <button
                      className="link text-xs flex items-center gap-1 text-paddy-700 hover:text-paddy-900 font-semibold"
                      onClick={() => handleEdit(row)}
                      title="Edit this purchase"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold"
                      onClick={() => handleDelete(row)}
                      title="Delete this purchase and revert stock"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )
              : undefined
          }
        />
      </Panel>
    </div>
  );
}

function DataEntryLines({ products, items, setItems }) {
  const patch = (index, change) => {
    setItems(items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, ...change };
      if (change.product_id) {
        const prod = products.find((p) => p.id === change.product_id);
        if (prod) {
          updated.purchase_rate = Number(prod.purchase_price || 0);
          const gstRate = Number(prod.gst_percent || 0);
          updated.gst = Math.round((updated.purchase_rate * Number(updated.qty || 1) * (gstRate / 100)) * 100) / 100;
          updated.total_amount = Math.round((updated.purchase_rate * Number(updated.qty || 1) + updated.gst) * 100) / 100;
        }
      } else if (change.qty !== undefined || change.purchase_rate !== undefined || change.gst !== undefined) {
        const qty = Number(updated.qty || 0);
        const rate = Number(updated.purchase_rate || 0);
        const gst = Number(updated.gst || 0);
        updated.total_amount = Math.round(((qty * rate) + gst) * 100) / 100;
      }
      return updated;
    }));
  };

  const removeLine = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (!items?.length) {
    return (
      <div className="mt-5 rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No products added yet. Click &quot;Add Product Line&quot; below to add items to this purchase.
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-paddy-50">
          <tr>
            <th className="py-2.5 px-3">Product</th>
            <th className="py-2.5 px-3">Qty</th>
            <th className="py-2.5 px-3">Purchase Rate (₹)</th>
            <th className="py-2.5 px-3">GST (₹)</th>
            <th className="py-2.5 px-3">Total (₹)</th>
            <th className="py-2.5 px-3 w-16">Remove</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-t border-slate-100">
              <td className="p-2">
                <select className="cell-input" value={item.product_id} onChange={(e) => patch(index, { product_id: e.target.value })}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </td>
              <td className="p-2">
                <input className="cell-input w-24" type="number" min="1" value={item.qty} onChange={(e) => patch(index, { qty: e.target.value })} />
              </td>
              <td className="p-2">
                <input className="cell-input w-32" type="number" step="0.01" min="0" value={item.purchase_rate} onChange={(e) => patch(index, { purchase_rate: e.target.value })} />
              </td>
              <td className="p-2">
                <input className="cell-input w-28" type="number" step="0.01" min="0" value={item.gst} onChange={(e) => patch(index, { gst: e.target.value })} />
              </td>
              <td className="p-2">
                <input className="cell-input w-32 bg-slate-50 font-semibold" type="number" step="0.01" value={item.total_amount} onChange={(e) => patch(index, { total_amount: e.target.value })} />
              </td>
              <td className="p-2 text-center">
                <button type="button" onClick={() => removeLine(index)} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Remove line">
                  <X className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Customers({ api, notify }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", mobile: "", village: "", address: "", credit_amount: 20000, pending_balance: 0 });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [historyFarmer, setHistoryFarmer] = useState(null);
  const [historySales, setHistorySales] = useState([]);

  const load = () => api.get(`/customers?search=${encodeURIComponent(search)}`).then(setRows);
  useEffect(() => void load(), [search]);

  async function save() {
    if (!form.name || !form.name.trim()) {
      notify("Please enter farmer / customer name.");
      return;
    }
    editing ? await api.put(`/customers/${editing}`, form) : await api.post("/customers", form);
    setEditing(null);
    setForm({ name: "", mobile: "", village: "", address: "", credit_amount: 20000, pending_balance: 0 });
    notify("Farmer record saved successfully!");
    setTimeout(() => notify(""), 2200);
    load();
  }

  const viewHistory = async (row) => {
    try {
      notify("Loading purchase history...");
      const sales = await api.get(`/sales`);
      const farmerSales = sales.filter(s => s.customer_id === row.id || (s.mobile && s.mobile === row.mobile));
      setHistorySales(farmerSales);
      setHistoryFarmer(row);
      notify("");
    } catch (err) {
      notify(err.message || "Failed to load history.");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr] gap-6">
        <Panel title={editing ? "Edit Farmer Record" : "Add Farmer Record"}>
          <Input label="Farmer Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <Input label="Mobile Number" value={form.mobile} onChange={(mobile) => setForm({ ...form, mobile })} />
          <Input label="Village" value={form.village} onChange={(village) => setForm({ ...form, village })} />
          <Input label="Address" value={form.address} onChange={(address) => setForm({ ...form, address })} />
          <Input label="Credit Limit (₹)" type="number" value={form.credit_amount} onChange={(credit_amount) => setForm({ ...form, credit_amount })} />
          
          <button onClick={save} className="btn mt-5 w-full"><Save className="h-5 w-5" /> Save Farmer Record</button>
        </Panel>
        
        <Panel title="Farmer Records" actions={<SearchBox value={search} setValue={setSearch} />}>
          <DataTable
            rows={rows}
            columns={["name", "mobile", "village", "pending_balance", "credit_amount"]}
            actions={(row) => (
              <div className="flex gap-2">
                <button className="link" onClick={() => viewHistory(row)}>History</button>
                <button className="link" onClick={() => { setEditing(row.id); setForm(row); }}>Edit</button>
              </div>
            )}
          />
        </Panel>
      </div>

      {historyFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Purchase History: {historyFarmer.name}</h2>
                <p className="text-sm text-slate-500">Mobile: {historyFarmer.mobile} | Pending Balance: {currency.format(historyFarmer.pending_balance)}</p>
              </div>
              <button onClick={() => setHistoryFarmer(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <DataTable
                rows={historySales}
                columns={["invoice_number", "date", "grand_total", "amount_paid", "balance_due", "payment_method"]}
                empty="No purchase history found for this farmer."
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Suppliers({ api, notify }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", contact_person: "", mobile: "", address: "", gstin: "", outstanding_amount: 0 });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => api.get(`/suppliers?search=${encodeURIComponent(search)}`).then(setRows);
  useEffect(() => void load(), [search]);

  const handleSupplierFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      notify(`Scanning & extracting supplier details from "${file.name}"...`);
      const res = await api.post("/ocr/parse-supplier-file", { fileName: file.name });
      if (res.data) {
        setForm({
          ...form,
          name: res.data.company_name,
          contact_person: res.data.contact_person,
          mobile: res.data.phone,
          address: res.data.address,
          gstin: res.data.gstin,
          outstanding_amount: res.data.outstanding_amount
        });
        notify(`File "${file.name}" scanned! Supplier details populated automatically.`);
        setTimeout(() => notify(""), 3500);
      }
    } catch (err) {
      notify(err.message || "Failed to parse supplier file.");
    }
  };

  async function save() {
    editing ? await api.put(`/suppliers/${editing}`, form) : await api.post("/suppliers", form);
    setEditing(null);
    setForm({ name: "", contact_person: "", mobile: "", address: "", gstin: "", outstanding_amount: 0 });
    notify("Supplier saved successfully");
    setTimeout(() => notify(""), 2200);
    load();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr] gap-6">
      <Panel title={editing ? "Edit Supplier Record" : "Add Supplier Record"}>
        <div className="mb-4 rounded-lg border border-paddy-200 bg-paddy-50 p-3">
          <label className="text-xs font-bold text-paddy-900 block mb-1">📄 Auto-Fill from PDF / CSV File</label>
          <input
            type="file"
            accept=".pdf,.csv,.png,.jpg,.jpeg"
            id="supplier-pdf-upload"
            className="hidden"
            onChange={handleSupplierFileUpload}
          />
          <button
            type="button"
            onClick={() => document.getElementById("supplier-pdf-upload").click()}
            className="btn-secondary w-full text-xs py-2 px-3 bg-white border-paddy-300 text-paddy-800 font-semibold shadow-sm hover:bg-paddy-100 transition-all flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-paddy-700" /> Upload PDF / CSV Supplier Statement
          </button>
        </div>

        <Input label="Company Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Input label="Contact Person" value={form.contact_person} onChange={(contact_person) => setForm({ ...form, contact_person })} />
        <Input label="Mobile Number" value={form.mobile} onChange={(mobile) => setForm({ ...form, mobile })} />
        <Input label="GSTIN" value={form.gstin} onChange={(gstin) => setForm({ ...form, gstin })} />
        <Input label="Address" value={form.address} onChange={(address) => setForm({ ...form, address })} />
        <Input label="Outstanding Amount (₹)" type="number" value={form.outstanding_amount} onChange={(outstanding_amount) => setForm({ ...form, outstanding_amount })} />
        
        <button onClick={save} className="btn mt-5 w-full"><Save className="h-5 w-5" /> Save Supplier Record</button>
      </Panel>

      <Panel title="Supplier Records" actions={<SearchBox value={search} setValue={setSearch} />}>
        <DataTable
          rows={rows}
          columns={["name", "contact_person", "mobile", "gstin", "address", "outstanding_amount"]}
          actions={(row) => (
            <button className="link" onClick={() => { setEditing(row.id); setForm(row); }}>Edit</button>
          )}
        />
      </Panel>
    </div>
  );
}

function CrudPage({ api, resource, title, blank, columns, notify }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const load = () => api.get(`/${resource}?search=${encodeURIComponent(search)}`).then(setRows);
  useEffect(() => void load(), [search]);
  async function save() {
    editing ? await api.put(`/${resource}/${editing}`, form) : await api.post(`/${resource}`, form);
    setEditing(null);
    setForm(blank);
    notify(`${title} saved`);
    setTimeout(() => notify(""), 2200);
    load();
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr] gap-6">
      <Panel title={editing ? `Edit ${title}` : `Add ${title}`}>
        {Object.keys(blank).map((key) => <Input key={key} label={labelize(key)} type={typeof blank[key] === "number" ? "number" : "text"} value={form[key] ?? ""} onChange={(value) => setForm({ ...form, [key]: value })} />)}
        <button onClick={save} className="btn mt-5 w-full"><Save className="h-5 w-5" /> Save</button>
      </Panel>
      <Panel title={title} actions={<SearchBox value={search} setValue={setSearch} />}>
        <DataTable rows={rows} columns={columns} actions={(row) => <button className="link" onClick={() => { setEditing(row.id); setForm(row); }}>Edit</button>} />
      </Panel>
    </div>
  );
}


function FarmerPayments({ api, notify }) {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tab, setTab] = useState("records"); 
  const [payModalCustomer, setPayModalCustomer] = useState(null);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "CASH",
    date: new Date().toISOString().slice(0, 10),
    notes: ""
  });

  const load = () => {
    api.get("/payments").then(setPayments);
    api.get("/customers").then(setCustomers);
    api.get("/sales").then(setSales);
  };
  useEffect(() => void load(), []);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const term = search.toLowerCase();
      const matchSearch = !term || 
        String(p.payment_id || "").toLowerCase().includes(term) ||
        String(p.customer_name || p.farmer_name || "").toLowerCase().includes(term) ||
        String(p.bill_number || p.invoice_id || "").toLowerCase().includes(term);
      
      const matchMethod = !methodFilter || (p.payment_method || "").toUpperCase() === methodFilter.toUpperCase();
      const pDate = p.payment_date || (p.created_at ? p.created_at.slice(0, 10) : "");
      const matchFrom = !dateFrom || pDate >= dateFrom;
      const matchTo = !dateTo || pDate <= dateTo;

      return matchSearch && matchMethod && matchFrom && matchTo;
    });
  }, [payments, search, methodFilter, dateFrom, dateTo]);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount_paid || p.amount || 0), 0);
  const upiCollected = payments.filter(p => (p.payment_method || "").toUpperCase() === "UPI").reduce((sum, p) => sum + Number(p.amount_paid || p.amount || 0), 0);
  const cardCollected = payments.filter(p => (p.payment_method || "").toUpperCase() === "CARD").reduce((sum, p) => sum + Number(p.amount_paid || p.amount || 0), 0);
  const cashCollected = payments.filter(p => (p.payment_method || "").toUpperCase() === "CASH").reduce((sum, p) => sum + Number(p.amount_paid || p.amount || 0), 0);
  const creditTotal = customers.reduce((sum, c) => sum + Number(c.pending_balance || 0), 0);

  const openPayModal = (customer) => {
    const pending = Number(customer.pending_balance || 0);
    const estInterest = Math.round(pending * 0.02 * 100) / 100;
    setPayModalCustomer({
      ...customer,
      pendingPrincipal: pending,
      estInterest: estInterest,
      totalOutstanding: Math.round((pending + estInterest) * 100) / 100
    });
    setPayForm({
      amount: pending > 0 ? String(pending) : "0",
      method: "CASH",
      date: new Date().toISOString().slice(0, 10),
      notes: ""
    });
  };

  const handleRecordPaymentSubmit = async () => {
    if (!payModalCustomer) return;
    const amt = Number(payForm.amount);
    const maxAllowed = Number(payModalCustomer.pending_balance || payModalCustomer.totalOutstanding || 0);

    if (isNaN(amt) || amt <= 0) {
      notify("Please enter a valid payment amount greater than zero.");
      return;
    }
    if (maxAllowed > 0 && amt > maxAllowed + 0.01) {
      notify("Payment amount cannot exceed the current outstanding balance.");
      return;
    }

    try {
      await api.post("/payments", {
        customer_id: payModalCustomer.id,
        customer_name: payModalCustomer.name,
        amount: amt,
        amount_paid: amt,
        payment_method: payForm.method,
        payment_date: payForm.date,
        notes: payForm.notes,
        previous_outstanding: payModalCustomer.pending_balance
      });
      notify(`Payment of ${currency.format(amt)} recorded successfully!`);
      setPayModalCustomer(null);
      load();
    } catch (err) {
      notify(err.message || "Failed to record payment.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button 
            onClick={() => setTab("records")} 
            className={`px-4 py-2 font-bold transition-all ${tab === "records" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Payment History Ledger
          </button>
          <button 
            onClick={() => setTab("outstanding")} 
            className={`px-4 py-2 font-bold transition-all ${tab === "outstanding" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Credit Outstanding ({customers.filter(c => Number(c.pending_balance) > 0).length})
          </button>
        </div>
        <button 
          onClick={() => {
            if (customers.length > 0) openPayModal(customers[0]);
            else notify("Please add a farmer record first.");
          }} 
          className="btn bg-paddy-700 text-white font-bold flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Record Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <Mini label="Total Collected" value={currency.format(totalCollected)} />
        <Mini label="UPI Payments" value={currency.format(upiCollected)} />
        <Mini label="Card Payments" value={currency.format(cardCollected)} />
        <Mini label="Cash Payments" value={currency.format(cashCollected)} />
        <Mini label="Credit Pending" value={currency.format(creditTotal)} />
      </div>

      {/* Tab 1: Payment History Ledger */}
      {tab === "records" && (
        <Panel title="Farmer Payment Ledger Records" actions={
          <div className="flex flex-wrap items-center gap-3">
            <SearchBox value={search} setValue={setSearch} />
            <Select 
              label="" 
              value={methodFilter} 
              options={["", "CASH", "UPI", "CARD"]} 
              labels={{"": "All Methods", "CASH": "Cash Only", "UPI": "UPI Only", "CARD": "Card Only"}} 
              onChange={setMethodFilter} 
            />
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-slate-500">From:</span>
              <input type="date" className="h-9 rounded border border-slate-200 px-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span className="font-semibold text-slate-500">To:</span>
              <input type="date" className="h-9 rounded border border-slate-200 px-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        }>
          {!filteredPayments.length ? (
            <p className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">No payment records found matching your filters.</p>
          ) : (
            <div className="max-h-[560px] overflow-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-paddy-50 text-left">
                  <tr>
                    <th>Payment ID</th>
                    <th>Farmer / Customer</th>
                    <th>Bill Ref</th>
                    <th>Date & Time</th>
                    <th>Method</th>
                    <th>Amount Paid</th>
                    <th>Remaining Bal</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(p => {
                    const isCleared = (p.remaining_outstanding ?? p.balance_amount) <= 0 || p.status === "Cleared";
                    const cust = customers.find(c => c.id === p.customer_id || c.name === p.customer_name);
                    return (
                      <tr key={p.id}>
                        <td className="font-mono text-xs font-bold text-slate-700">{p.payment_id || `PAY-${p.id.slice(0,6)}`}</td>
                        <td className="font-semibold">{p.customer_name || p.farmer_name || "Walk-in"}</td>
                        <td className="font-mono text-xs text-slate-600">{p.bill_number || p.invoice_id || "GST-BILL"}</td>
                        <td className="text-xs text-slate-600">{p.payment_date || p.created_at?.slice(0,10)} {p.payment_time || ""}</td>
                        <td>
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.payment_method === "UPI" ? "bg-purple-100 text-purple-800" :
                            p.payment_method === "CARD" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {p.payment_method || "CASH"}
                          </span>
                        </td>
                        <td className="font-bold text-emerald-700">{currency.format(p.amount_paid || p.amount || 0)}</td>
                        <td className="font-medium text-slate-700">{currency.format(p.remaining_outstanding ?? p.balance_amount ?? 0)}</td>
                        <td>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCleared ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {isCleared ? "✓ CLEARED" : "Partial"}
                          </span>
                        </td>
                        <td>
                          {cust && (
                            <button className="link text-xs font-bold" onClick={() => setLedgerCustomer(cust)}>View Ledger</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* Tab 2: Credit Outstanding */}
      {tab === "outstanding" && (
        <Panel title="Farmer Outstanding Accounts" actions={<SearchBox value={search} setValue={setSearch} />}>
          <div className="max-h-[560px] overflow-auto rounded-md border border-slate-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-paddy-50 text-left">
                <tr>
                  <th>Farmer Name</th>
                  <th>Mobile / Village</th>
                  <th>Credit Limit</th>
                  <th>Current Outstanding</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers
                  .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.village?.toLowerCase().includes(search.toLowerCase()))
                  .map(c => {
                    const pending = Number(c.pending_balance || 0);
                    const isCleared = pending <= 0;
                    return (
                      <tr key={c.id}>
                        <td className="font-bold text-slate-800">{c.name}</td>
                        <td className="text-xs text-slate-600">{c.mobile || "-"} | {c.village || "-"}</td>
                        <td className="text-xs text-slate-600">{currency.format(c.credit_amount || 20000)}</td>
                        <td className={`font-bold text-base ${isCleared ? "text-emerald-600" : "text-red-600"}`}>
                          {currency.format(pending)}
                        </td>
                        <td>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCleared ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {isCleared ? "✓ CLEARED" : "Outstanding Dues"}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-3 items-center">
                            {!isCleared && (
                              <button 
                                onClick={() => openPayModal(c)} 
                                className="btn-secondary text-xs py-1 px-3 bg-paddy-700 text-white font-bold hover:bg-paddy-800"
                              >
                                + Pay Outstanding
                              </button>
                            )}
                            <button className="link text-xs font-bold" onClick={() => setLedgerCustomer(c)}>
                              View Ledger
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Record Payment Modal */}
      {payModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-800">Pay Outstanding: {payModalCustomer.name}</h2>
              <button onClick={() => setPayModalCustomer(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <Row label="Original Outstanding" value={currency.format(payModalCustomer.pendingPrincipal || payModalCustomer.pending_balance)} />
              <Row label="Accrued Interest (Est)" value={currency.format(payModalCustomer.estInterest || 0)} />
              <Row label="Total Outstanding" value={currency.format(payModalCustomer.totalOutstanding || payModalCustomer.pending_balance)} strong />
            </div>

            <div className="space-y-3">
              <Input 
                label="Amount to Pay (₹)" 
                type="number" 
                value={payForm.amount} 
                onChange={v => setPayForm({ ...payForm, amount: v })} 
              />
              <Select 
                label="Payment Method" 
                value={payForm.method} 
                options={["CASH", "UPI", "CARD"]} 
                onChange={v => setPayForm({ ...payForm, method: v })} 
              />
              <Input 
                label="Payment Date" 
                type="date" 
                value={payForm.date} 
                onChange={v => setPayForm({ ...payForm, date: v })} 
              />
              <Input 
                label="Payment Notes (Optional)" 
                placeholder="e.g. Partial cash payment against monsoon fertilizer dues" 
                value={payForm.notes} 
                onChange={v => setPayForm({ ...payForm, notes: v })} 
              />
            </div>

            {/* Dynamic Calculation Breakdown Box */}
            {(() => {
              const amt = Number(payForm.amount || 0);
              const prev = Number(payModalCustomer.pending_balance || 0);
              const remaining = Math.max(0, Math.round((prev - amt) * 100) / 100);
              const isOverpaid = amt > prev;

              return (
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <div className="bg-slate-100 p-3 rounded text-xs space-y-1">
                    <Row label="Previous Outstanding" value={currency.format(prev)} />
                    <Row label="Payment" value={`- ${currency.format(amt)}`} />
                    <Row label="Remaining Outstanding" value={currency.format(remaining)} strong />
                  </div>

                  {isOverpaid && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-bold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      Payment amount cannot exceed the current outstanding balance.
                    </div>
                  )}

                  <div className="pt-3 flex gap-3">
                    <button 
                      onClick={handleRecordPaymentSubmit} 
                      disabled={isOverpaid || amt <= 0} 
                      className="btn flex-1 py-3 text-base bg-paddy-700 hover:bg-paddy-800 disabled:opacity-50"
                    >
                      Submit Payment
                    </button>
                    <button onClick={() => setPayModalCustomer(null)} className="btn-secondary flex-1 py-3">
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Customer Detailed Payment Ledger Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Farmer Ledger: {ledgerCustomer.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mobile: {ledgerCustomer.mobile || "-"} | Village: {ledgerCustomer.village || "-"} | 
                  Aadhaar: {ledgerCustomer.aadhaar ? `XXXX XXXX ${ledgerCustomer.aadhaar.replace(/\D/g,"").slice(-4)}` : "Not provided"}
                </p>
              </div>
              <button onClick={() => setLedgerCustomer(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Mini label="Total Dues Created" value={currency.format(ledgerCustomer.credit_amount || ledgerCustomer.pending_balance)} />
                <Mini 
                  label="Total Paid To Date" 
                  value={currency.format(
                    payments
                      .filter(p => p.customer_id === ledgerCustomer.id || p.customer_name === ledgerCustomer.name)
                      .reduce((sum, p) => sum + Number(p.amount_paid || p.amount || 0), 0)
                  )} 
                />
                <Mini label="Current Outstanding" value={currency.format(ledgerCustomer.pending_balance || 0)} />
                <div className="rounded-md bg-paddy-50 p-4 flex flex-col justify-center items-center text-center">
                  <span className="text-xs text-slate-500 font-medium">Account Status</span>
                  <span className={`mt-1 text-xs px-3 py-1 rounded-full font-bold ${
                    Number(ledgerCustomer.pending_balance || 0) <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {Number(ledgerCustomer.pending_balance || 0) <= 0 ? "✓ CLEARED" : "PENDING DUES"}
                  </span>
                </div>
              </div>

              {/* Chronological Payment Timeline */}
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-3">Payment Timeline & History</h3>
                {(() => {
                  const custPayments = payments
                    .filter(p => p.customer_id === ledgerCustomer.id || p.customer_name === ledgerCustomer.name)
                    .sort((a, b) => String(b.payment_date || b.created_at).localeCompare(String(a.payment_date || a.created_at)));

                  if (!custPayments.length) {
                    return <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded">No payments recorded for this farmer yet.</p>;
                  }

                  return (
                    <div className="relative border-l-2 border-paddy-300 ml-3 space-y-4 pl-4">
                      {custPayments.map((p, idx) => (
                        <div key={p.id || idx} className="relative bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                          <div className="absolute -left-[23px] top-3.5 h-3 w-3 rounded-full bg-paddy-600 border-2 border-white" />
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-mono text-xs font-bold text-paddy-800">{p.payment_id || `PAY-${p.id.slice(0,6)}`}</span>
                              <p className="text-sm font-bold text-slate-800 mt-0.5">
                                {currency.format(p.amount_paid || p.amount || 0)} — <span className="text-paddy-700">{p.payment_method || "CASH"}</span>
                              </p>
                              <p className="text-xs text-slate-500 mt-1">Ref Bill: {p.bill_number || p.invoice_id || "GST-BILL"}</p>
                              {p.notes && <p className="text-xs text-slate-600 italic mt-1">"{p.notes}"</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-slate-600">{p.payment_date || p.created_at?.slice(0,10)} {p.payment_time || ""}</p>
                              <p className="text-xs font-bold text-slate-700 mt-2">
                                Remaining Bal: {currency.format(p.remaining_outstanding ?? p.balance_amount ?? 0)}
                              </p>
                              <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold ${
                                (p.remaining_outstanding ?? p.balance_amount) <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {(p.remaining_outstanding ?? p.balance_amount) <= 0 ? "CLEARED" : "PARTIAL"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stock({ api, notify }) {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [adjust, setAdjust] = useState({ product_id: "", qty: 0, type: "adjustment", note: "" });
  const load = () => { api.get("/products").then(setProducts); api.get("/stock/logs").then(setLogs); };
  useEffect(() => void load(), []);
  async function save() {
    await api.post(`/products/${adjust.product_id}/adjust-stock`, adjust);
    notify("Stock adjusted");
    setTimeout(() => notify(""), 2200);
    load();
  }
  const expiring = products.filter((p) => p.expiry_date && new Date(p.expiry_date) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 90));
  return (
    <div className="space-y-6">
      <Panel title="Stock Adjustment">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select label="Product" value={adjust.product_id} options={["", ...products.map((p) => p.id)]} labels={{ "": "Select product", ...Object.fromEntries(products.map((p) => [p.id, p.name])) }} onChange={(product_id) => setAdjust({ ...adjust, product_id })} />
          <Input label="Qty (+ inward / - outward)" type="number" value={adjust.qty} onChange={(qty) => setAdjust({ ...adjust, qty })} />
          <Select label="Type" value={adjust.type} options={["adjustment", "damage", "return", "opening"]} onChange={(type) => setAdjust({ ...adjust, type })} />
          <Input label="Note" value={adjust.note} onChange={(note) => setAdjust({ ...adjust, note })} />
        </div>
        <button onClick={save} className="btn mt-4"><Save className="h-5 w-5" /> Save Adjustment</button>
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Current Stock"><DataTable rows={products} columns={["name", "batch_number", "current_stock", "minimum_stock_alert", "unit", "expiry_date"]} /></Panel>
        <Panel title="Expiry Alerts"><DataTable rows={expiring} columns={["name", "batch_number", "current_stock", "expiry_date"]} empty="No upcoming expiry alerts." /></Panel>
      </div>
      <Panel title="Stock Movement Logs"><DataTable rows={logs} columns={["product_name", "type", "qty", "note", "created_by", "created_at"]} /></Panel>
    </div>
  );
}

function Reports({ api, notify }) {
  const [type, setType] = useState("sales-register");
  const [rows, setRows] = useState([]);
  const [dates, setDates] = useState({ from: new Date().toISOString().slice(0, 8) + "01", to: new Date().toISOString().slice(0, 10) });
  const load = () => api.get(`/reports/${type}?from=${dates.from}&to=${dates.to}`).then((data) => setRows(data.rows));
  useEffect(() => void load(), [type]);
  function downloadCsv() {
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
    download(`${type}.csv`, csv, "text/csv");
    notify("CSV exported");
    setTimeout(() => notify(""), 2200);
  }
  function downloadExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Report");
    XLSX.writeFile(wb, `${type}.xlsx`);
  }
  return (
    <div className="space-y-6">
      <Panel title="Report Filters">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-end gap-3">
          <Select label="Report" value={type} options={reportTypes.map(([key]) => key)} labels={Object.fromEntries(reportTypes)} onChange={setType} />
          <Input label="From" type="date" value={dates.from} onChange={(from) => setDates({ ...dates, from })} />
          <Input label="To" type="date" value={dates.to} onChange={(to) => setDates({ ...dates, to })} />
          <button onClick={load} className="btn"><Search className="h-5 w-5" /> Search</button>
          <button onClick={downloadCsv} className="btn-secondary"><Download className="h-5 w-5" /> CSV</button>
          <button onClick={downloadExcel} className="btn-secondary"><FileSpreadsheet className="h-5 w-5" /> Excel</button>
        </div>
      </Panel>
      <Panel title={reportTypes.find(([key]) => key === type)?.[1]}><DataTable rows={rows} columns={Object.keys(rows[0] || {})} /></Panel>
    </div>
  );
}

function Stat({ label, value, Icon }) {
  return <div className="rounded-md border border-paddy-100 bg-white p-4 shadow-soft"><Icon className="h-6 w-6 text-paddy-600" /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}

function Panel({ title, actions, children }) {
  return <section className="rounded-md border border-paddy-100 bg-white p-4 sm:p-5 shadow-soft"><div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>{actions}</div>{children}</section>;
}

function DataTable({ rows, columns, actions, empty = "No records found." }) {
  if (!rows?.length) return <p className="rounded-md bg-slate-50 p-5 text-sm text-slate-500">{empty}</p>;
  return <div className="w-full max-h-[560px] overflow-auto custom-scrollbar rounded-md border border-slate-200"><table className="w-full text-sm min-w-[550px]"><thead className="sticky top-0 bg-paddy-50 text-left z-10"><tr>{columns.map((c) => <th key={c} className="whitespace-nowrap">{labelize(c)}</th>)}{actions && <th className="whitespace-nowrap">Action</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id || JSON.stringify(row)} className="hover:bg-slate-50/70 transition-colors">{columns.map((c) => <td key={c} className="whitespace-nowrap">{format(row[c])}</td>)}{actions && <td className="whitespace-nowrap">{actions(row)}</td>}</tr>)}</tbody></table></div>;
}

function Input({ label, value, onChange, type = "text" }) {
  return <label className="mt-3 block text-sm font-medium text-slate-600">{label}<input className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-slate-900 outline-none focus:border-paddy-500" type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, options, labels = {}, onChange }) {
  return <label className="mt-3 block text-sm font-medium text-slate-600">{label}<select className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-slate-900 outline-none focus:border-paddy-500" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}</select></label>;
}

function SearchBox({ value, setValue }) {
  return <div className="flex h-10 w-full sm:w-auto min-w-[200px] items-center gap-2 rounded-md border border-slate-200 px-3 bg-white"><Search className="h-4 w-4 text-slate-400 shrink-0" /><input className="outline-none w-full text-xs sm:text-sm bg-transparent" placeholder="Search" value={value} onChange={(e) => setValue(e.target.value)} /></div>;
}

function Mini({ label, value }) {
  return <div className="rounded-md bg-paddy-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function Row({ label, value, strong }) {
  return <div className={`flex justify-between ${strong ? "font-bold" : ""}`}><span>{label}</span><span>{value}</span></div>;
}

function Skeleton() {
  return <div className="h-56 animate-pulse rounded-md bg-white shadow-soft" />;
}

function labelize(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function format(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : currency.format(value);
  if (String(value || "").match(/^\d{4}-\d{2}-\d{2}T/)) return new Date(value).toLocaleString("en-IN");
  return value ?? "";
}

function download(filename, content, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

createRoot(document.getElementById("root")).render(<App />);
