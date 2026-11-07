import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
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
  Bell,
  Send,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Eye,
  Settings,
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
  ["monthly-executive", "Executive Monthly Report (Stock, Revenue, Credit)"],
  ["hsn", "HSN-wise Report"],
  ["date-wise-invoices", "Date-wise Invoices"]
];


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-white p-6 shadow-soft my-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Something went wrong rendering this screen</h3>
            <p className="text-sm text-slate-500 mt-1">{this.state.error?.message || "An unexpected error occurred."}</p>
          </div>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="btn py-2 px-4 text-xs font-bold"
          >
            Reload Screen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
          <ErrorBoundary>
            {screen === "dashboard" && <Dashboard api={api} setScreen={setScreen} notify={setToast} />}
            {screen === "billing" && <Billing api={api} notify={setToast} />}
            {screen === "products" && <Products api={api} notify={setToast} />}
            {screen === "purchases" && <Purchases api={api} notify={setToast} user={session.user} />}
            {screen === "customers" && <Customers api={api} notify={setToast} />}
            {screen === "suppliers" && <Suppliers api={api} notify={setToast} />}
            {screen === "farmer_payments" && <FarmerPayments api={api} notify={setToast} />}
            {screen === "stock" && <Stock api={api} notify={setToast} />}
            {screen === "reports" && <Reports api={api} notify={setToast} />}
            {screen === "insights" && <BusinessInsights api={api} notify={setToast} setScreen={setScreen} />}
            {screen === "settings" && <SystemSettings api={api} notify={setToast} user={session.user} />}
            {screen === "reset" && <BusinessReset api={api} notify={setToast} setScreen={setScreen} user={session.user} />}
          </ErrorBoundary>
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
    ["stock", AlertTriangle, "Stock & Expiry"],
    ["reports", FileSpreadsheet, "GST Reports"],
    ["insights", TrendingUp, "Business Insights"],
    ...(isAdmin ? [["settings", Settings, "System Settings"]] : []),
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
    billing: "Sales Billing",
    products: "Product Management",
    purchases: "Purchase Management",
    customers: "Farmer Records",
    suppliers: "Supplier Management",
    farmer_payments: "Payment Records",
    stock: "Stock & Product Expiry Safety Hub",
    reports: "GST Reports",
    insights: "Business Insights & Decision Support",
    settings: "System Settings & Automated Schedulers",
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


// ==========================================
// FEATURE A: REGULATORY BATCH EXPIRY ALERT MODAL
// ==========================================
function ExpiryAlertModal({ isOpen, onClose, api, notify }) {
  const [data, setData] = useState({ summary: {}, items: [] });
  const [threshold, setThreshold] = useState(90);
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState({ phone: "8660548244", email: "manager@anjanagro.com", name: "Distributor / Store Manager" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get(`/alerts/expiry?threshold=${threshold}`)
        .then(res => setData(res))
        .catch(err => notify(err.message || "Failed to load expiry data."))
        .finally(() => setLoading(false));
    }
  }, [isOpen, threshold]);

  if (!isOpen) return null;

  const handleSendWhatsApp = async () => {
    try {
      setSending(true);
      const res = await api.post("/alerts/send-expiry", {
        recipientPhone: recipient.phone,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        targetItems: data.items
      });
      notify("WhatsApp alert message generated!");
      if (res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank");
      }
    } catch (err) {
      notify(err.message || "Failed to prepare alert.");
    } finally {
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSending(true);
      const res = await api.post("/alerts/send-expiry", {
        recipientPhone: recipient.phone,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        targetItems: data.items
      });
      notify("Email alert notice dispatched!");
      if (res.mailtoUrl) {
        window.location.href = res.mailtoUrl;
      }
    } catch (err) {
      notify(err.message || "Failed to dispatch email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden border border-orange-200">
        <div className="p-4 bg-gradient-to-r from-orange-700 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-amber-200" />
            <div>
              <h2 className="text-lg font-bold">Regulatory Batch Expiry Alert Center</h2>
              <p className="text-xs text-orange-100">Sree Anjaneya Agro Agencies, Davanagere • Insecticides Act & FCO Compliance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-900">Alert Window:</span>
              <button
                type="button"
                onClick={() => setThreshold(30)}
                className={`px-3 py-1 rounded text-xs font-semibold ${threshold === 30 ? "bg-red-600 text-white" : "bg-white border text-slate-700 hover:bg-slate-50"}`}
              >
                Critical (≤ 30 Days)
              </button>
              <button
                type="button"
                onClick={() => setThreshold(60)}
                className={`px-3 py-1 rounded text-xs font-semibold ${threshold === 60 ? "bg-amber-600 text-white" : "bg-white border text-slate-700 hover:bg-slate-50"}`}
              >
                ≤ 60 Days
              </button>
              <button
                type="button"
                onClick={() => setThreshold(90)}
                className={`px-3 py-1 rounded text-xs font-semibold ${threshold === 90 ? "bg-orange-600 text-white" : "bg-white border text-slate-700 hover:bg-slate-50"}`}
              >
                Standard (≤ 90 Days)
              </button>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-600 block">Total Loss Risk Valuation:</span>
              <span className="text-base font-extrabold text-red-700">{currency.format(data.summary?.total_stock_value_at_risk || 0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <span className="text-xs text-red-700 font-medium block">Critical Batches (≤30d / Expired)</span>
              <span className="text-xl font-bold text-red-800">{data.summary?.critical_count || 0}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <span className="text-xs text-amber-700 font-medium block">Watchlist Batches (≤90d)</span>
              <span className="text-xl font-bold text-amber-800">{data.summary?.warning_count || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-xs text-slate-600 font-medium block">Total At-Risk SKUs</span>
              <span className="text-xl font-bold text-slate-800">{data.summary?.total_items_at_risk || 0}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                <tr>
                  <th className="p-2 text-left">Product Name</th>
                  <th className="p-2 text-left">Batch No</th>
                  <th className="p-2 text-center">Stock</th>
                  <th className="p-2 text-center">Expiry Date</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-right">Value at Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items?.length ? (
                  data.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-900">{item.name}</td>
                      <td className="p-2 font-mono text-slate-600">{item.batch_number}</td>
                      <td className="p-2 text-center">{item.current_stock} {item.unit}</td>
                      <td className="p-2 text-center font-medium">{item.expiry_date}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.days_remaining <= 0 ? "bg-red-100 text-red-800" : (item.days_remaining <= 30 ? "bg-orange-100 text-orange-800" : "bg-amber-100 text-amber-800")
                        }`}>
                          {item.days_remaining <= 0 ? "EXPIRED" : `${item.days_remaining}d left`}
                        </span>
                      </td>
                      <td className="p-2 text-right font-bold text-slate-800">{currency.format(item.value_at_risk)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-slate-400">No products expiring within {threshold} days. Godown stock is healthy!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Dispatch Expiry Alert to Distributor / Owner</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Recipient Name</label>
                <input
                  className="h-9 w-full rounded border border-slate-200 px-2.5 text-xs outline-none focus:border-orange-500"
                  value={recipient.name}
                  onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-0.5">WhatsApp Mobile</label>
                <input
                  className="h-9 w-full rounded border border-slate-200 px-2.5 text-xs outline-none focus:border-orange-500"
                  value={recipient.phone}
                  onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Email Address</label>
                <input
                  className="h-9 w-full rounded border border-slate-200 px-2.5 text-xs outline-none focus:border-orange-500"
                  value={recipient.email}
                  onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                disabled={sending || !data.items?.length}
                onClick={handleSendWhatsApp}
                className="btn-secondary flex-1 py-2 text-xs bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-1.5 font-bold disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Send Expiry Alert via WhatsApp
              </button>
              <button
                type="button"
                disabled={sending || !data.items?.length}
                onClick={handleSendEmail}
                className="btn-secondary flex-1 py-2 text-xs bg-blue-700 text-white hover:bg-blue-800 flex items-center justify-center gap-1.5 font-bold disabled:opacity-50"
              >
                <ReceiptText className="h-4 w-4" /> Dispatch Regulatory Email Notice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function Dashboard({ api, setScreen, notify = () => {} }) {
  const [data, setData] = useState(null);
  const [biSummary, setBiSummary] = useState(null);
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);

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
                onClick={() => setExpiryModalOpen(true)}
                className="btn-secondary py-2 px-3 text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Bell className="h-4 w-4" /> Expiry Alert Center
              </button>
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
      <ExpiryAlertModal isOpen={expiryModalOpen} onClose={() => setExpiryModalOpen(false)} api={api} notify={notify} />
    </div>
  );
}

// ==========================================
// PRODUCTS MANAGEMENT COMPONENT
// Manages stock inventory, HSN codes, GST rates, batch numbers, and chemical expiry dates
// ==========================================
function Products({ api, notify }) {
  const [formErrors, setFormErrors] = useState({});
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
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
  function validateProduct() {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = "Product name is required (min 2 chars).";
    if (!form.category || form.category.trim().length === 0) errs.category = "Category is required.";
    if (!form.hsn_code || !/^\d{2,8}$/.test(String(form.hsn_code).trim())) errs.hsn_code = "HSN code must be 2 to 8 numeric digits.";
    const pCost = Number(form.purchase_price);
    const sRate = Number(form.selling_price);
    if (isNaN(pCost) || pCost <= 0) errs.purchase_price = "Purchase rate must be > 0.";
    if (isNaN(sRate) || sRate <= 0) errs.selling_price = "Selling rate must be > 0.";
    else if (!isNaN(pCost) && sRate < pCost) errs.selling_price = `Selling rate (₹${sRate}) cannot be lower than cost (₹${pCost}).`;
    if (!form.batch_number || form.batch_number.trim().length === 0) errs.batch_number = "Batch number is required.";
    if (!form.expiry_date) errs.expiry_date = "Expiry date is required for chemical shelf-life.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validateProduct()) {
      notify("Please resolve highlighted validation errors before saving product.");
      setTimeout(() => notify(""), 3000);
      return;
    }
    try {
      editing ? await api.put(`/products/${editing}`, form) : await api.post("/products", form);
      setForm(blank);
      setEditing(null);
      setFormErrors({});
      notify("Product saved successfully!");
      setTimeout(() => notify(""), 2200);
      load();
    } catch (err) {
      notify(err.message || "Failed to save product.");
    }
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
          <Input label="Product Name" required error={formErrors.name} value={form.name} onChange={(name) => { setForm({ ...form, name }); if (formErrors.name) setFormErrors({ ...formErrors, name: null }); }} />
          <Input label="Brand" value={form.brand} onChange={(brand) => setForm({ ...form, brand })} />
          <Input label="Category" required error={formErrors.category} value={form.category} onChange={(category) => { setForm({ ...form, category }); if (formErrors.category) setFormErrors({ ...formErrors, category: null }); }} />
          <Select label="Type" value={form.product_type} options={productTypes} onChange={(product_type) => setForm({ ...form, product_type })} />
          <Input label="HSN Code" required error={formErrors.hsn_code} value={form.hsn_code} onChange={(hsn_code) => { setForm({ ...form, hsn_code }); if (formErrors.hsn_code) setFormErrors({ ...formErrors, hsn_code: null }); }} />
          <Input label="GST %" type="number" value={form.gst_percent} onChange={(gst_percent) => setForm({ ...form, gst_percent })} />
          <Input label="Batch Number" required error={formErrors.batch_number} value={form.batch_number} onChange={(batch_number) => { setForm({ ...form, batch_number }); if (formErrors.batch_number) setFormErrors({ ...formErrors, batch_number: null }); }} />
          <Select label="Unit" value={form.unit} options={units} onChange={(unit) => setForm({ ...form, unit })} />
          <Input label="Manufacture Date" type="date" value={form.manufacture_date} onChange={(manufacture_date) => setForm({ ...form, manufacture_date })} />
          <Input label="Expiry Date" required error={formErrors.expiry_date} type="date" value={form.expiry_date} onChange={(expiry_date) => { setForm({ ...form, expiry_date }); if (formErrors.expiry_date) setFormErrors({ ...formErrors, expiry_date: null }); }} />
          <Input label="Purchase Price" required error={formErrors.purchase_price} type="number" value={form.purchase_price} onChange={(purchase_price) => { setForm({ ...form, purchase_price }); if (formErrors.purchase_price) setFormErrors({ ...formErrors, purchase_price: null }); }} />
          <Input label="MRP" type="number" value={form.mrp} onChange={(mrp) => setForm({ ...form, mrp })} />
          <Input label="Selling Price" required error={formErrors.selling_price} type="number" value={form.selling_price} onChange={(selling_price) => { setForm({ ...form, selling_price }); if (formErrors.selling_price) setFormErrors({ ...formErrors, selling_price: null }); }} />
          <Input label="Current Stock" type="number" value={form.current_stock} onChange={(current_stock) => setForm({ ...form, current_stock })} />
          <Input label="Minimum Alert" type="number" value={form.minimum_stock_alert} onChange={(minimum_stock_alert) => setForm({ ...form, minimum_stock_alert })} />
          <Input label="Supplier Name" value={form.supplier_name} onChange={(supplier_name) => setForm({ ...form, supplier_name })} />
        </div>
        <button onClick={save} className="btn mt-5 w-full"><Save className="h-5 w-5" /> Save Product</button>
      </Panel>
      <Panel title="Product List" actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpiryModalOpen(true)}
            className="btn-secondary text-xs py-1.5 px-3 bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100 flex items-center gap-1.5 font-bold transition-all shadow-sm"
          >
            <Bell className="h-4 w-4 text-orange-600" /> Expiry Alerts Center
          </button>
          <SearchBox value={search} setValue={setSearch} />
        </div>
      }>
        <DataTable
          rows={rows}
          columns={["name", "brand", "product_type", "hsn_code", "gst_percent", "batch_number", "selling_price", "current_stock", "unit"]}
          actions={(row) => (
            <button className="link" onClick={() => { setEditing(row.id); setForm(row); }}>Edit</button>
          )}
        />
      </Panel>
      <ExpiryAlertModal isOpen={expiryModalOpen} onClose={() => setExpiryModalOpen(false)} api={api} notify={notify} />
    </div>
  );
}

function Billing({ api, notify }) {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [deliveryChannel, setDeliveryChannel] = useState("both"); // both | whatsapp | email | none
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
    api.get("/inventory/batches").then(setBatches).catch(() => setBatches([]));
    api.get("/customers").then(setCustomers);
    api.get("/shop").then(setShop);
  }, [api]);

  const isProductExpired = (prod) => {
    if (!prod) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (prod.expiry_date) {
      const exp = new Date(prod.expiry_date);
      exp.setHours(0, 0, 0, 0);
      if (exp < today) return true;
    }
    const matchingBatches = batches.filter(b => b.product_id === prod.id);
    if (matchingBatches.length > 0 && matchingBatches.every(b => b.expiry_date && new Date(b.expiry_date) < today)) {
      return true;
    }
    return false;
  };

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
    if (!lines || lines.length === 0) {
      notify("Cart is empty! Please add at least one product item to create an invoice.");
      return;
    }
    const expiredLine = lines.find(l => isProductExpired(l.product));
    if (expiredLine) {
      notify(`BLOCKED: '${expiredLine.product?.name}' has EXPIRED (${expiredLine.product?.expiry_date || "Past safety date"}). Selling expired stock is strictly prohibited by law.`);
      return;
    }
    for (const line of lines) {
      const q = Number(line.qty);
      if (isNaN(q) || q <= 0) {
        notify(`Quantity for '${line.product?.name || "product"}' must be greater than zero.`);
        return;
      }
      const availableStock = Number(line.product?.current_stock ?? 9999);
      if (q > availableStock) {
        notify(`Stock Limit Error: Only ${availableStock} ${line.product?.unit || "units"} available for '${line.product?.name}'. Requested: ${q}.`);
        return;
      }
    }
    if (form.customer_mobile && form.customer_mobile.trim()) {
      const cleanMobile = form.customer_mobile.trim().replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        notify("Invalid customer mobile number. Must be a 10-digit Indian number starting with 6-9.");
        return;
      }
    }
    if (form.customer_aadhaar && form.customer_aadhaar.trim()) {
      const cleanedAadhaar = form.customer_aadhaar.replace(/\D/g, "");
      if (cleanedAadhaar.length !== 12) {
        notify("Customer Aadhaar Number must be exactly 12 numeric digits if provided.");
        return;
      }
    }
    const creditPortion = form.payment_method === "Credit" ? grand : (form.payment_method === "Mixed" ? Number(mixedAmounts.Credit || 0) : 0);
    if (creditPortion > 0) {
      if (!form.customer_id) {
        notify("Farmer / Customer selection is required when issuing credit (Udhaari).");
        return;
      }
      const selectedCust = customers.find(c => c.id === form.customer_id);
      if (selectedCust) {
        const creditLimit = Number(selectedCust.credit_amount || selectedCust.credit_limit || 0);
        const currentBalance = Number(selectedCust.pending_balance || 0);
        if (creditLimit > 0 && (currentBalance + creditPortion) > creditLimit) {
          notify(`Credit ceiling exceeded! Assigned Limit: ₹${creditLimit.toFixed(2)}, Current Balance: ₹${currentBalance.toFixed(2)}, Remaining Allowance: ₹${Math.max(0, creditLimit - currentBalance).toFixed(2)}.`);
          return;
        }
      }
    }
    if (form.payment_method === "Mixed") {
      const mixedSum = Number(mixedAmounts.Cash || 0) + Number(mixedAmounts.UPI || 0) + Number(mixedAmounts.Card || 0) + Number(mixedAmounts.Credit || 0);
      if (Math.abs(mixedSum - grand) > 0.5) {
        notify(`Split tenders total (₹${mixedSum.toFixed(2)}) must exactly equal Invoice Grand Total (₹${grand.toFixed(2)}).`);
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
      finalPaymentMethod = `Credit (${form.credit_days || 30} Days @ ${form.interest_rate || 2}%)`;
      finalAmountPaid = 0;
    } else if (form.payment_method === "Mixed") {
      finalPaymentMethod = `MIXED (Credit: ₹${Number(mixedAmounts.Credit||0)} @ ${form.interest_rate || 2}%)`;
      finalAmountPaid = Number(mixedAmounts.Cash||0) + Number(mixedAmounts.UPI||0) + Number(mixedAmounts.Card||0);
    } else {
      finalPaymentMethod = "Cash";
    }

    const payload = { 
      ...form,
      delivery_channel: deliveryChannel,
      credit_days: Number(form.credit_days || 30),
      interest_rate: Number(form.interest_rate || 2),
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
             customer_id: form.customer_id,
             farmer_name: form.customer_name,
             invoice_id: saved.invoice_number,
             payment_date: saved.date || new Date().toISOString().slice(0, 10),
             total_invoice_amount: grand,
             amount_paid: Number(amount),
             amount: Number(amount),
             payment_method: method.toUpperCase(),
             payment_status: "PAID"
           });
        }
      }
    }

    // Record credit in farmer_credit_ledger for Pure Credit and Mixed modes
    if (creditPortion > 0 && form.customer_id) {
      try {
        await api.post("/farmer_credit_ledger", {
          customer_id: form.customer_id,
          farmer_id: form.customer_id,
          farmer_name: form.customer_name,
          mobile: form.mobile,
          village: form.village,
          invoice_id: saved.invoice_number,
          sale_id: saved.id,
          purchase_date: saved.date || new Date().toISOString().slice(0, 10),
          due_date: new Date(Date.now() + Number(form.credit_days || 30) * 86400000).toISOString().slice(0, 10),
          credit_amount: creditPortion,
          principal_amount: creditPortion,
          outstanding_principal: creditPortion,
          interest_rate: Number(form.interest_rate || 2),
          credit_due_days: Number(form.credit_days || 30),
          status: "PENDING"
        });
      } catch (err) {
        console.warn("Credit ledger write fallback:", err);
      }
    }

    if (saved.balance_due > 0) {
      notify(`Receipt generated! Leftover product balance of ${currency.format(saved.balance_due)} recorded in Customer Credit Outstanding.`);
    } else {
      notify("Payment Successful! Receipt generated.");
    }
    setTimeout(() => notify(""), 2200);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
      <Panel title="New GST Invoice">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Select label="Existing Farmer" value={form.customer_id} options={["", ...customers.map((c) => c.id)]} labels={{ "": "Walk-in customer", ...Object.fromEntries(customers.map((c) => [c.id, `${c.name} - ${c.mobile}`])) }} onChange={(customer_id) => {
            const c = customers.find((customer) => customer.id === customer_id);
            setForm({ ...form, customer_id, customer_name: c?.name || "", mobile: c?.mobile || "", customer_email: c?.email || "", village: c?.village || "", billing_address: c?.address || "", customer_aadhaar: c?.aadhaar_number || c?.aadhaar || "" });
          }} />
          <Input label="Farmer Name" value={form.customer_name} onChange={(customer_name) => setForm({ ...form, customer_name })} />
          <Input label="Mobile" value={form.mobile} onChange={(mobile) => setForm({ ...form, mobile })} />
          <Input label="Email (for PDF invoice)" value={form.customer_email || ""} onChange={(customer_email) => setForm({ ...form, customer_email })} placeholder="farmer@example.com" />
          <Input label="Village" value={form.village} onChange={(village) => setForm({ ...form, village })} />
          <Input label="Billing Address" value={form.billing_address} onChange={(billing_address) => setForm({ ...form, billing_address })} />
          <Input label="DBT / GSTIN / ID" value={form.gstin} onChange={(gstin) => setForm({ ...form, gstin })} />
          <div className="flex items-center gap-2 mt-6 sm:mt-7">
            <input type="checkbox" id="interstate_sale" checked={Boolean(form.is_interstate)} onChange={e => setForm({ ...form, is_interstate: e.target.checked })} className="h-4 w-4 rounded text-paddy-600 focus:ring-paddy-500 cursor-pointer" />
            <label htmlFor="interstate_sale" className="text-xs font-semibold text-slate-700 cursor-pointer">Inter-State Sale (IGST)</label>
          </div>
        </div>
        {/* Expired Item Blocking Banner */}
        {lines.some(l => isProductExpired(l.product)) && (
          <div className="mt-4 p-3.5 bg-red-100 border-2 border-red-500 rounded-lg text-red-950 font-bold text-xs flex items-center gap-2.5 shadow-sm animate-pulse">
            <AlertTriangle className="h-5 w-5 text-red-700 shrink-0" />
            <div>
              <p className="text-sm font-black text-red-900">EXPIRED PRODUCT IN CART: Sale of expired chemical stock is prohibited!</p>
              <p className="text-xs text-red-800 mt-0.5">Under fertilizer and pesticide safety regulations, checkout is blocked until expired item(s) are removed.</p>
            </div>
          </div>
        )}

        {/* Automatic Digital Bill Delivery Selector */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Automatic Digital Bill Delivery</span>
              <span className="text-[11px] text-slate-500 font-medium">
                Official Gmail: <span className="font-semibold text-slate-700">harshavardhanjunji@gmail.com</span> | WhatsApp: <span className="font-semibold text-slate-700">+91 8660548244</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                ["both", "Both (WhatsApp + Email)"],
                ["whatsapp", "WhatsApp Only"],
                ["email", "Email Only"],
                ["none", "None (Print Only)"]
              ].map(([ch, label]) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setDeliveryChannel(ch)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${deliveryChannel === ch ? "bg-paddy-700 text-white border-paddy-700 shadow-sm" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
                {Number(mixedAmounts.Credit || 0) > 0 && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Credit Portion Terms (₹{Number(mixedAmounts.Credit).toFixed(2)})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Credit Due Days" type="number" value={form.credit_days} onChange={v => setForm({...form, credit_days: v})} />
                      <Input label="Interest Rate % (monthly)" type="number" value={form.interest_rate} onChange={v => setForm({...form, interest_rate: v})} />
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Udhaari of <strong>₹{Number(mixedAmounts.Credit).toFixed(2)}</strong> will be booked. Interest @ <strong>{form.interest_rate || 2}%/month</strong> starts accruing from purchase date (<strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>).
                    </p>
                  </div>
                )}
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
                {Number(form.amount_paid || 0) < grand && form.amount_paid !== "" && (
                  <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-300 text-xs text-amber-950 space-y-2 shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Leftover Product Balance: ₹{(grand - Number(form.amount_paid || 0)).toFixed(2)}</span>
                    </div>
                    <p className="text-amber-900 leading-relaxed">
                      This unpaid product balance will be stored in <strong>Credit Outstanding</strong> for <strong>{form.customer_name || "farmer"}</strong>. Interest @ <strong>{form.interest_rate || 2}%/month</strong> will accrue from today ({new Date().toLocaleDateString('en-IN')}).
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Input label="Credit Due Days" type="number" value={form.credit_days} onChange={v => setForm({...form, credit_days: v})} />
                      <Input label="Interest Rate % (monthly)" type="number" value={form.interest_rate} onChange={v => setForm({...form, interest_rate: v})} />
                    </div>
                  </div>
                )}
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
                  <Input label="Interest Rate % (monthly)" type="number" value={form.interest_rate} onChange={v => setForm({...form, interest_rate: v})} />
                </div>
                <div className="bg-amber-50 p-3.5 border border-amber-300 rounded-lg text-sm text-amber-950 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Credit Billing Terms & Accrual</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Credit amount: <strong>₹{grand.toFixed(2)}</strong>. Simple interest @ <strong>{form.interest_rate || 2}% per month</strong> will accrue from purchase date (<strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>).
                  </p>
                  {(() => {
                    const sel = customers.find(c => c.id === form.customer_id);
                    const pending = Number(sel?.pending_balance || 0);
                    if (pending > 0) {
                      return <p className="text-xs text-red-700 font-semibold pt-1 border-t border-amber-200">⚠ Farmer has existing balance of ₹{pending.toFixed(2)}. Total principal dues will become ₹{(pending + grand).toFixed(2)}.</p>;
                    }
                    return <p className="text-xs text-slate-600">Farmer record: <strong>{form.customer_name || "Walk-in Farmer"}</strong></p>;
                  })()}
                </div>
                <button onClick={saveInvoice} className="btn w-full text-base py-3 mt-4 bg-amber-600 hover:bg-amber-700 text-white">Approve Credit Billing</button>
              </div>
            )}
          </div>
        </div>
      </Panel>
      <InvoicePreview shop={shop} invoice={invoice || { ...form, items: lines, subtotal, cgst, sgst, grand_total: grand, balance_due: grand - Number(form.amount_paid || 0), invoice_number: "Draft", date: new Date().toISOString().slice(0, 10) }} api={api} notify={notify} />
    </div>
  );
  function updateLine(index, patch) {
    setForm({ ...form, items: form.items.map((line, i) => i === index ? { ...line, ...patch } : line) });
  }
}

function InvoicePreview({ shop, invoice, api, notify }) {
  const [sending, setSending] = useState(false);

  const downloadPdf = () => {
    if (!invoice?.id) {
      notify("Please generate/save the invoice first before downloading official PDF.");
      return;
    }
    const safeInv = (invoice.invoice_number || `INV-${invoice.id}`).replace(/[\/\\?%*:|"<>]/g, "-");
    const link = document.createElement("a");
    link.href = `/api/invoices/${invoice.id}/pdf`;
    link.download = `${safeInv}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Downloading official A4 GST Tax Invoice PDF...");
  };

  const sendWhatsApp = async () => {
    const mobile = invoice.mobile?.replace(/\D/g, "") || "";
    const farmerName = invoice.customer_name || "Valued Farmer";
    const invNo = invoice.invoice_number || "Draft";
    const invDate = invoice.date || new Date().toISOString().slice(0, 10);
    const shopName = shop.name || "SRI ANJANEYA AGRO AGENCIES";

    if (invoice?.id && api) {
      setSending(true);
      try {
        await api.post(`/invoices/${invoice.id}/retry-delivery`, { channel: "whatsapp" });
        notify("WhatsApp Digital Invoice dispatched successfully!");
      } catch (err) {
        console.warn("Backend WhatsApp retry:", err);
      } finally {
        setSending(false);
      }
    }

    const itemsList = (invoice.items || [])
      .map((it, idx) => `${idx + 1}. ${it.product_name || it.product?.name || "Agro Item"} (Qty: ${it.qty}) - ₹${Number(it.total || 0).toFixed(2)}`)
      .join("\n");
    const text = `🌾 *${shopName}*\n*OFFICIAL GST TAX INVOICE*\n----------------------------------------\n*Invoice No:* ${invNo}\n*Date:* ${invDate}\n*Customer:* ${farmerName}\n*Mobile:* ${mobile || "-"}\n*Payment Mode:* ${invoice.payment_method || "Cash"}\n----------------------------------------\n*Items Purchased:*\n${itemsList}\n----------------------------------------\n*Taxable Subtotal:* ₹${Number(invoice.subtotal || 0).toFixed(2)}\n*CGST:* ₹${Number(invoice.cgst || 0).toFixed(2)}\n*SGST:* ₹${Number(invoice.sgst || 0).toFixed(2)}\n*Grand Total: ₹${Number(invoice.grand_total || 0).toFixed(2)}*\n*Amount Paid:* ₹${Number(invoice.amount_paid || 0).toFixed(2)}\n*Balance Due:* ₹${Number(invoice.balance_due || 0).toFixed(2)}\n----------------------------------------\nThank you for choosing ${shopName}! Helpline: ${shop.phone || "9900389992"}.`;
    const phone = mobile ? (mobile.length === 10 ? `91${mobile}` : mobile) : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const sendEmail = async () => {
    if (!invoice?.id) {
      notify("Please save the invoice before sending email.");
      return;
    }
    const targetEmail = invoice.customer_email || invoice.email || prompt("Enter farmer / customer email address:", "farmer@example.com");
    if (!targetEmail) return;
    setSending(true);
    try {
      await api.post(`/invoices/${invoice.id}/retry-delivery`, { channel: "email", email: targetEmail });
      notify(`GST Invoice PDF emailed to ${targetEmail}!`);
    } catch (err) {
      notify("Email delivery failed: " + (err.message || "Error"));
    } finally {
      setSending(false);
    }
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
          <span>Aadhaar: <b>{invoice.customer_aadhaar ? `XXXX XXXX ${String(invoice.customer_aadhaar).replace(/\D/g, "").slice(-4)}` : "-"}</b></span>
          <span className="text-right">Supply: <b>{invoice.is_interstate ? "Inter-State (IGST)" : "Intra-State (Karnataka)"}</b></span>
        </div>
        <table className="mt-3 w-full text-xs">
          <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Total</th></tr></thead>
          <tbody>{(invoice.items || []).map((item, i) => <tr key={i}><td>{item.product_name || item.product?.name}</td><td>{item.qty}</td><td>{currency.format(item.rate)}</td><td>{item.gst_percent || item.gst}%</td><td>{currency.format(item.total)}</td></tr>)}</tbody>
        </table>
        <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
          <Row label="Subtotal" value={currency.format(invoice.subtotal || 0)} />
          {invoice.is_interstate ? (
            <Row label="IGST" value={currency.format(invoice.igst || invoice.total_tax || 0)} />
          ) : (
            <>
              <Row label="CGST" value={currency.format(invoice.cgst || 0)} />
              <Row label="SGST" value={currency.format(invoice.sgst || 0)} />
            </>
          )}
          <Row label="Grand Total" value={currency.format(invoice.grand_total || 0)} strong />
          <Row label="Paid" value={currency.format(invoice.amount_paid || 0)} />
          <Row label="Balance" value={currency.format(invoice.balance_due || 0)} strong />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <button onClick={downloadPdf} className="btn w-full bg-paddy-700 hover:bg-paddy-800 text-white flex items-center justify-center gap-2">
          <Download className="h-5 w-5" /> Download Official A4 GST PDF
        </button>
        <button onClick={() => window.print()} className="btn-secondary w-full flex items-center justify-center gap-2">
          <Printer className="h-5 w-5" /> Print / Thermal Preview
        </button>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={sendWhatsApp} disabled={sending} className="btn-secondary bg-emerald-600 hover:bg-emerald-700 text-white border-none font-semibold flex items-center justify-center gap-1.5 py-2 text-xs">
            <MessageSquare className="h-4 w-4" /> WhatsApp
          </button>
          <button onClick={sendEmail} disabled={sending} className="btn-secondary bg-sky-600 hover:bg-sky-700 text-white border-none font-semibold flex items-center justify-center gap-1.5 py-2 text-xs">
            <Mail className="h-4 w-4" /> Email PDF
          </button>
        </div>
      </div>
    </Panel>
  );
}

function SystemSettings({ api, notify, user }) {
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const [activeTab, setActiveTab] = useState("credit"); // credit | expiry | senders | deliveries
  const [creditSettings, setCreditSettings] = useState({
    monthly_interest_rate: 2,
    calculation_type: "simple",
    grace_period_days: 30,
    calculation_day: 1,
    payment_allocation_policy: "principal_first"
  });
  const [savingCredit, setSavingCredit] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);
  const [deliveries, setDeliveries] = useState([]);

  const loadSettings = () => {
    api.get("/credit/settings").then(setCreditSettings).catch(console.error);
    api.get("/invoices/deliveries").then(setDeliveries).catch(() => setDeliveries([]));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveCreditSettings = async () => {
    setSavingCredit(true);
    try {
      await api.put("/credit/settings", creditSettings);
      notify("Credit and Monthly Interest settings updated successfully!");
    } catch (err) {
      notify("Failed to save settings: " + err.message);
    } finally {
      setSavingCredit(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const res = await api.post("/settings/test-email", { recipient: "harshavardhanjunji@gmail.com" });
      setTestEmailResult(res);
      notify(res.message || "Test email dispatched to harshavardhanjunji@gmail.com!");
    } catch (err) {
      setTestEmailResult({ success: false, message: err.message });
      notify("Test email failed: " + err.message);
    } finally {
      setTestEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={() => setActiveTab("credit")}
            className={`px-4 py-2 font-bold transition-all ${activeTab === "credit" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Credit and Interest Policy
          </button>
          <button
            onClick={() => setActiveTab("expiry")}
            className={`px-4 py-2 font-bold transition-all ${activeTab === "expiry" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Expiry Alert Intervals
          </button>
          <button
            onClick={() => setActiveTab("senders")}
            className={`px-4 py-2 font-bold transition-all ${activeTab === "senders" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Official Senders and SMTP
          </button>
          <button
            onClick={() => setActiveTab("deliveries")}
            className={`px-4 py-2 font-bold transition-all ${activeTab === "deliveries" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Digital Delivery Logs ({deliveries.length})
          </button>
        </div>
      </div>

      {activeTab === "credit" && (
        <Panel title="Customer Credit and Monthly Interest Policy">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure how Udhaari interest calculates on outstanding balances. The background scheduler runs automatically on the 1st of every month in Asia/Kolkata timezone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Monthly Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full h-10 px-3 rounded-md border border-slate-300 font-semibold text-slate-800"
                  value={creditSettings.monthly_interest_rate}
                  onChange={e => setCreditSettings({ ...creditSettings, monthly_interest_rate: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-[11px] text-slate-500">Admin configurable (not hardcoded to 2%)</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Interest Calculation Formula</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-slate-300 font-semibold bg-white text-slate-800"
                  value={creditSettings.calculation_type}
                  onChange={e => setCreditSettings({ ...creditSettings, calculation_type: e.target.value })}
                >
                  <option value="simple">Simple Interest (Principal x Rate %)</option>
                  <option value="compound">Monthly Compound Interest (Principal + Accrued x Rate %)</option>
                </select>
                <span className="text-[11px] text-slate-500">Simple interest or monthly compounded</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full h-10 px-3 rounded-md border border-slate-300 font-semibold text-slate-800"
                  value={creditSettings.grace_period_days}
                  onChange={e => setCreditSettings({ ...creditSettings, grace_period_days: parseInt(e.target.value, 10) || 0 })}
                />
                <span className="text-[11px] text-slate-500">Bills within grace period incur 0 interest</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Calculation Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  className="w-full h-10 px-3 rounded-md border border-slate-300 font-semibold text-slate-800"
                  value={creditSettings.calculation_day}
                  onChange={e => setCreditSettings({ ...creditSettings, calculation_day: parseInt(e.target.value, 10) || 1 })}
                />
                <span className="text-[11px] text-slate-500">Day 1 runs on the 1st of every month</span>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Allocation Policy</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-slate-300 font-semibold bg-white text-slate-800"
                  value={creditSettings.payment_allocation_policy}
                  onChange={e => setCreditSettings({ ...creditSettings, payment_allocation_policy: e.target.value })}
                >
                  <option value="principal_first">Principal First (Reduces interest-bearing principal immediately)</option>
                  <option value="interest_first">Interest First (Clears accumulated interest before reducing principal)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                disabled={savingCredit}
                onClick={handleSaveCreditSettings}
                className="btn bg-paddy-700 hover:bg-paddy-800 text-white font-bold flex items-center gap-2 py-2.5 px-6 shadow-sm"
              >
                <Save className="h-4 w-4" /> {savingCredit ? "Saving..." : "Save Credit Settings"}
              </button>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "expiry" && (
        <Panel title="Product Expiry Alert Intervals and Background Scheduler">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              The automated daily background scanner runs every day at 8:00 AM (Asia/Kolkata) using node-cron. It checks all product batches and sends alerts to the shop owner at the designated milestone intervals.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Configured Notification Thresholds</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block">90 Days Alert</span>
                  <span className="text-[11px] text-slate-500">Early watchlist notice</span>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs font-bold text-amber-700 block">60 Days Alert</span>
                  <span className="text-[11px] text-slate-500">Discount/Push notice</span>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs font-bold text-orange-700 block">30 Days Alert</span>
                  <span className="text-[11px] text-slate-500">High priority warning</span>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs font-bold text-red-600 block">15 Days Alert</span>
                  <span className="text-[11px] text-slate-500">Urgent liquidation</span>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs font-bold text-red-700 block">7 Days Alert</span>
                  <span className="text-[11px] text-slate-500">Final sale clearance</span>
                </div>
                <div className="p-3 bg-white rounded border border-red-300 bg-red-50">
                  <span className="text-xs font-bold text-red-800 block">0 Days (Expired)</span>
                  <span className="text-[11px] text-red-700 font-semibold">Strict billing block</span>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-amber-700" /> Statutory Chemical Compliance</p>
              <p>Products reaching 0 days (past expiry date) are automatically flagged in the database and strictly blocked from counter checkout in Sales Billing.</p>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "senders" && (
        <Panel title="Shop Owner Sender Configuration and SMTP Verification">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              SmartAgro uses official shop owner credentials for dispatching bills, monthly interest statements, payment reminders, and expiry alerts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Official WhatsApp Sender</span>
                <p className="text-lg font-black text-emerald-950">+91 8660548244</p>
                <p className="text-xs text-emerald-700">Meta WhatsApp Cloud API / Sandbox gateway configured</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Official Gmail Sender</span>
                <p className="text-lg font-black text-blue-950">harshavardhanjunji@gmail.com</p>
                <p className="text-xs text-blue-700">Nodemailer SMTP with TLS port 587 configured</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Verify SMTP Email Connection</h4>
                  <p className="text-xs text-slate-500">Send an automated test email to harshavardhanjunji@gmail.com to verify outgoing mail server</p>
                </div>
                <button
                  disabled={testEmailLoading}
                  onClick={handleTestEmail}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 py-2 px-4 text-xs"
                >
                  <Mail className="h-4 w-4" /> {testEmailLoading ? "Verifying..." : "Send Test Email"}
                </button>
              </div>

              {testEmailResult && (
                <div className={`p-3.5 rounded-lg border text-xs font-semibold ${testEmailResult.success ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
                  <p className="font-bold">{testEmailResult.success ? "✓ SMTP Connection Successful" : "⚠ SMTP Verification Notice"}</p>
                  <p className="mt-0.5">{testEmailResult.message || JSON.stringify(testEmailResult)}</p>
                  {testEmailResult.simulation && (
                    <p className="mt-1 text-[11px] opacity-80">Simulation mode active: To send live emails, supply GMAIL_APP_PASSWORD in backend/.env</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "deliveries" && (
        <Panel title="Digital Delivery Audit Ledger" actions={
          <button onClick={loadSettings} className="btn-secondary text-xs flex items-center gap-1 py-1 px-3">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        }>
          {!deliveries.length ? (
            <p className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">No digital bills dispatched yet. Bills generated with WhatsApp or Email enabled will appear here.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-paddy-50 text-left font-bold">
                  <tr>
                    <th className="p-2.5">Date and Time</th>
                    <th className="p-2.5">Invoice / Ref</th>
                    <th className="p-2.5">Channel</th>
                    <th className="p-2.5">Recipient</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Message ID / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {deliveries.slice().reverse().map((d, i) => (
                    <tr key={d.id || i} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-600">{d.sent_at || d.created_at || "Recent"}</td>
                      <td className="p-2.5 font-mono font-bold text-paddy-800">{d.invoice_number || d.sale_id || "INV"}</td>
                      <td className="p-2.5 uppercase font-semibold text-slate-700">{d.channel}</td>
                      <td className="p-2.5 font-mono text-slate-800">{d.recipient}</td>
                      <td className="p-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === "sent" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {d.status || "SENT"}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-500 truncate max-w-xs">{d.message_id || d.error || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
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
    if (!form.supplier_id && !form.supplier_name) {
      notify("Supplier selection is required for inward vouchers.");
      return;
    }
    if (!form.invoice_number?.trim()) {
      notify("Please enter a supplier invoice number.");
      return;
    }
    if (!form.items?.length) {
      notify("Please add at least one product item to the purchase.");
      return;
    }
    for (const item of form.items) {
      const q = Number(item.qty);
      const rate = Number(item.purchase_rate || item.unit_cost || 0);
      if (isNaN(q) || q <= 0) {
        notify("Inward quantity for each item must be greater than zero.");
        return;
      }
      if (isNaN(rate) || rate <= 0) {
        notify("Purchase rate for each item must be greater than zero.");
        return;
      }
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
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [historyFarmer, setHistoryFarmer] = useState(null);
  const [historySales, setHistorySales] = useState([]);

  const load = () => api.get(`/customers?search=${encodeURIComponent(search)}`).then(setRows);
  useEffect(() => void load(), [search]);

  function validateCustomer() {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = "Farmer name is required (minimum 2 characters).";
    if (form.mobile) {
      const cleanMobile = form.mobile.trim().replace(/\D/g, "");
      if (cleanMobile.length > 0 && !/^[6-9]\d{9}$/.test(cleanMobile)) {
        errs.mobile = "Mobile must be a valid 10-digit Indian number starting with 6-9.";
      }
    }
    if (form.credit_amount !== undefined && Number(form.credit_amount) < 0) {
      errs.credit_amount = "Credit limit cannot be a negative amount.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validateCustomer()) {
      notify("Please resolve highlighted validation errors before saving farmer record.");
      return;
    }
    try {
      editing ? await api.put(`/customers/${editing}`, form) : await api.post("/customers", form);
      setEditing(null);
      setFormErrors({});
      setForm({ name: "", mobile: "", village: "", address: "", credit_amount: 20000, pending_balance: 0 });
      notify("Farmer record saved successfully!");
      setTimeout(() => notify(""), 2200);
      load();
    } catch (err) {
      notify(err.message || "Failed to save farmer record.");
    }
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
          <Input label="Farmer Name" required error={formErrors.name} value={form.name} onChange={(name) => { setForm({ ...form, name }); if (formErrors.name) setFormErrors({ ...formErrors, name: null }); }} />
          <Input label="Mobile Number" error={formErrors.mobile} value={form.mobile} onChange={(mobile) => { setForm({ ...form, mobile }); if (formErrors.mobile) setFormErrors({ ...formErrors, mobile: null }); }} />
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
                <button className="link font-bold text-amber-700 hover:text-amber-800" onClick={() => notify("Tip: Switch to Payment Records -> Credit Outstanding to view or manage credit for " + row.name)}>Credit Dues</button>
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
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  function validateSupplier() {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = "Supplier / Company name is required.";
    if (form.gstin) {
      const cleanGST = form.gstin.trim().toUpperCase();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGST)) {
        errs.gstin = "Invalid 15-char statutory GSTIN format (e.g., 29ABCDE1234F1Z5).";
      }
    }
    if (form.mobile) {
      const cleanMobile = form.mobile.trim().replace(/\D/g, "");
      if (cleanMobile.length > 0 && !/^[6-9]\d{9}$/.test(cleanMobile)) {
        errs.mobile = "Contact number must be a valid 10-digit mobile number.";
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

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
    if (!validateSupplier()) {
      notify("Please resolve highlighted supplier errors before saving.");
      return;
    }
    try {
      editing ? await api.put(`/suppliers/${editing}`, form) : await api.post("/suppliers", form);
      setEditing(null);
      setFormErrors({});
      setForm({ name: "", contact_person: "", mobile: "", address: "", gstin: "", outstanding_amount: 0 });
      notify("Supplier saved successfully");
      setTimeout(() => notify(""), 2200);
      load();
    } catch (err) {
      notify(err.message || "Failed to save supplier.");
    }
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

        <Input label="Company Name" required error={formErrors.name} value={form.name} onChange={(name) => { setForm({ ...form, name }); if (formErrors.name) setFormErrors({ ...formErrors, name: null }); }} />
        <Input label="Contact Person" value={form.contact_person} onChange={(contact_person) => setForm({ ...form, contact_person })} />
        <Input label="Mobile Number" error={formErrors.mobile} value={form.mobile} onChange={(mobile) => { setForm({ ...form, mobile }); if (formErrors.mobile) setFormErrors({ ...formErrors, mobile: null }); }} />
        <Input label="GSTIN" error={formErrors.gstin} value={form.gstin} onChange={(gstin) => { setForm({ ...form, gstin }); if (formErrors.gstin) setFormErrors({ ...formErrors, gstin: null }); }} />
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


function getCustomerCreditSummary(customer, creditLedger = [], sales = []) {
  if (!customer) return { principal: 0, accruedInterest: 0, totalOutstanding: 0, breakdown: [] };
  const custId = customer.id;
  const custName = (customer.name || "").trim().toLowerCase();
  const profilePending = Math.round(Number(customer.pending_balance || 0) * 100) / 100;

  // If customer has 0 or cleared balance, return 0 dues immediately
  if (profilePending <= 0) {
    return {
      principal: 0,
      accruedInterest: 0,
      totalOutstanding: 0,
      breakdown: []
    };
  }

  // Find active credit ledger entries for this farmer
  let entries = (creditLedger || []).filter(l => 
    ((l.customer_id && l.customer_id === custId) || 
     (l.farmer_id && l.farmer_id === custId) || 
     (l.farmer_name && custName && l.farmer_name.trim().toLowerCase() === custName)) &&
    Number(l.outstanding_principal || l.credit_amount || 0) > 0 &&
    l.status !== "CLEARED"
  );

  // If no ledger entries, fallback to sales with balance_due > 0
  if (!entries.length && (sales || []).length) {
    const creditSales = sales.filter(s => 
      ((s.customer_id && s.customer_id === custId) || (s.customer_name && custName && s.customer_name.trim().toLowerCase() === custName)) &&
      Number(s.balance_due || 0) > 0
    );
    entries = creditSales.map(s => {
      const match = String(s.payment_method || "").match(/@\s*([0-9.]+)%/);
      const rate = match ? Number(match[1]) : 2;
      const daysMatch = String(s.payment_method || "").match(/([0-9]+)\s*Days/i);
      const dueDays = daysMatch ? Number(daysMatch[1]) : 30;
      return {
        id: s.id,
        invoice_id: s.invoice_number,
        purchase_date: s.date || (s.created_at ? s.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        credit_amount: Number(s.balance_due),
        principal_amount: Number(s.balance_due),
        outstanding_principal: Number(s.balance_due),
        interest_rate: rate,
        credit_due_days: dueDays,
        status: "PENDING"
      };
    });
  }

  // Sort descending by purchase_date (most recent bills first)
  entries.sort((a, b) => String(b.purchase_date || b.created_at).localeCompare(String(a.purchase_date || a.created_at)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let remainingToAllocate = profilePending;
  let totalInterest = 0;
  const breakdown = [];

  for (const entry of entries) {
    if (remainingToAllocate <= 0) break;
    const entryOriginal = Number(entry.outstanding_principal ?? entry.principal_amount ?? entry.credit_amount ?? 0);
    const principalForThisBill = Math.min(entryOriginal, remainingToAllocate);
    if (principalForThisBill <= 0) continue;

    const rate = Number(entry.interest_rate || 2);
    const pDateStr = entry.purchase_date || entry.credit_date || (entry.created_at ? entry.created_at.slice(0, 10) : "");
    const pDate = pDateStr ? new Date(pDateStr) : new Date();
    pDate.setHours(0, 0, 0, 0);

    const diffMs = Math.max(0, today.getTime() - pDate.getTime());
    const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Monthly simple interest: Principal * (Rate% / 100) * (daysElapsed / 30)
    const accruedInterest = Math.round(principalForThisBill * (rate / 100) * (daysElapsed / 30) * 100) / 100;
    
    totalInterest += accruedInterest;
    remainingToAllocate = Math.round((remainingToAllocate - principalForThisBill) * 100) / 100;

    breakdown.push({
      ...entry,
      invoice_id: entry.invoice_id || "CREDIT-BILL",
      purchase_date: pDateStr || new Date().toISOString().slice(0, 10),
      daysElapsed,
      rate,
      principal: principalForThisBill,
      accruedInterest,
      totalDue: Math.round((principalForThisBill + accruedInterest) * 100) / 100
    });
  }

  // If there is still unallocated balance from earlier purchases or opening credit
  if (remainingToAllocate > 0) {
    const legacyDays = 30;
    const legacyRate = 2;
    const legacyInterest = Math.round(remainingToAllocate * (legacyRate / 100) * (legacyDays / 30) * 100) / 100;
    totalInterest += legacyInterest;
    breakdown.push({
      id: "legacy",
      invoice_id: "CREDIT-BALANCE",
      purchase_date: "Previous Dues",
      daysElapsed: legacyDays,
      rate: legacyRate,
      principal: remainingToAllocate,
      accruedInterest: legacyInterest,
      totalDue: Math.round((remainingToAllocate + legacyInterest) * 100) / 100
    });
  }

  return {
    principal: profilePending,
    accruedInterest: Math.round(totalInterest * 100) / 100,
    totalOutstanding: Math.round((profilePending + totalInterest) * 100) / 100,
    breakdown
  };
}

function generateReminderText(customer, summary) {
  const shopName = "SRI ANJANEYA AGRO AGENCIES";
  const upiId = "harshavardhanjunji-2@okhdfcbank";
  const phone = "9900389992";
  
  let billLines = "";
  if (summary.breakdown && summary.breakdown.length > 0) {
    billLines = summary.breakdown.map(b => 
      `• Bill ${b.invoice_id}: ₹${b.principal.toFixed(2)} on ${b.purchase_date} (${b.daysElapsed} days ago, Interest: ₹${b.accruedInterest.toFixed(2)})`
    ).join("\n");
  } else {
    billLines = `• Outstanding Credit Balance: ₹${summary.principal.toFixed(2)}`;
  }

  const payLink = `upi://pay?pa=${upiId}&pn=Sri%20Anjaneya%20Agro&am=${summary.totalOutstanding.toFixed(2)}&cu=INR`;

  return `🌾 *${shopName}* 🌾
Shri Shiva nilaya, Hale kunduvada, Davanagere - 577566
Phone: ${phone}

Namaskara ${customer.name} avare,
This is a gentle payment reminder regarding your agro inputs credit (Udhaari) dues:

📋 *Bill Breakdown & Accrued Interest:*
${billLines}

💰 *Principal Credit:* ₹${summary.principal.toFixed(2)}
📈 *Accrued Interest (from Purchase Date):* ₹${summary.accruedInterest.toFixed(2)}
👉 *Total Amount Due:* ₹${summary.totalOutstanding.toFixed(2)}

💳 *Pay Online via UPI:*
UPI ID: *${upiId}*
UPI Pay Link: ${payLink}

Kindly clear the balance at your earliest convenience or visit the shop counter.
Thank you for your continued farming partnership!`;
}

function FarmerPayments({ api, notify }) {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [creditLedger, setCreditLedger] = useState([]);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tab, setTab] = useState("records"); 
  const [payModalCustomer, setPayModalCustomer] = useState(null);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [reminderCustomer, setReminderCustomer] = useState(null);
  const [reminderCopied, setReminderCopied] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({
    customer_id: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    credit_days: 30,
    interest_rate: 2,
    notes: ""
  });
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "CASH",
    date: new Date().toISOString().slice(0, 10),
    notes: ""
  });
  const [reminderSending, setReminderSending] = useState(false);
  const [resendingBillId, setResendingBillId] = useState(null);
  const [interestLoading, setInterestLoading] = useState(false);
  const [historyModalCustomer, setHistoryModalCustomer] = useState(null);
  const [customerInterestHistory, setCustomerInterestHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleCalculateInterest = async () => {
    setInterestLoading(true);
    try {
      const res = await api.post("/credit/calculate-interest", {});
      notify(res.message || `Monthly interest calculation completed: ${res.records_processed || 0} customer(s) processed.`);
      load();
    } catch (err) {
      notify("Interest calculation error: " + err.message);
    } finally {
      setInterestLoading(false);
    }
  };

  const openInterestHistory = async (cust) => {
    setHistoryModalCustomer(cust);
    setHistoryLoading(true);
    try {
      const list = await api.get(`/credit/interest-history/${cust.id}`);
      setCustomerInterestHistory(list || []);
    } catch (err) {
      notify("Failed to load interest history: " + err.message);
      setCustomerInterestHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendReminderViaSystem = async (channel) => {
    if (!reminderCustomer) return;
    setReminderSending(true);
    try {
      const payload = {
        customer: reminderCustomer,
        overdueDays: reminderCustomer.summary?.breakdown?.[0]?.daysElapsed || 0,
        principalAmount: reminderCustomer.summary?.principal || 0,
        accruedInterest: reminderCustomer.summary?.accruedInterest || 0,
        totalDue: reminderCustomer.summary?.totalOutstanding || 0,
        invoiceNo: reminderCustomer.summary?.breakdown?.[0]?.invoice_id || "UDHAARI-DUE",
        channel: channel,
        email: reminderCustomer.email || ""
      };
      const res = await api.post("/credit/send-reminder", payload);
      notify(`Reminder dispatched! WhatsApp: ${res.whatsapp?.status || "sent"}, Email: ${res.email?.status || "sent"}`);
    } catch (err) {
      notify("Failed to dispatch reminder: " + err.message);
    } finally {
      setReminderSending(false);
    }
  };

  const handleResendBill = async (sale, channel = "both") => {
    if (!sale) return;
    setResendingBillId(sale.id);
    try {
      const res = await api.post(`/sales/${sale.id}/resend-bill`, { channel });
      notify(`Bill #${sale.invoice_number || sale.id} sent via ${channel.toUpperCase()}! WA: ${res.results?.whatsapp?.status || "sent"}, Email: ${res.results?.email?.status || "sent"}`);
    } catch (err) {
      notify("Failed to resend bill: " + err.message);
    } finally {
      setResendingBillId(null);
    }
  };

  const load = () => {
    api.get("/payments").then(setPayments);
    api.get("/customers").then(setCustomers);
    api.get("/sales").then(setSales);
    api.get("/farmer_credit_ledger").then(setCreditLedger).catch(() => setCreditLedger([]));
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

  const creditStats = useMemo(() => {
    let principal = 0;
    let interest = 0;
    for (const c of customers) {
      const s = getCustomerCreditSummary(c, creditLedger, sales);
      principal += s.principal;
      interest += s.accruedInterest;
    }
    return {
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      total: Math.round((principal + interest) * 100) / 100
    };
  }, [customers, creditLedger, sales]);

  const openPayModal = (customer, customSummary) => {
    const summary = customSummary || getCustomerCreditSummary(customer, creditLedger, sales);
    setPayModalCustomer({
      ...customer,
      pendingPrincipal: summary.principal,
      estInterest: summary.accruedInterest,
      totalOutstanding: summary.totalOutstanding,
      breakdown: summary.breakdown
    });
    setPayForm({
      amount: summary.totalOutstanding > 0 ? String(summary.totalOutstanding) : (summary.principal > 0 ? String(summary.principal) : "0"),
      method: "CASH",
      date: new Date().toISOString().slice(0, 10),
      notes: `Settlement of credit dues (Principal: ₹${summary.principal}, Accrued Interest: ₹${summary.accruedInterest})`
    });
  };

  const openReminderModal = (customer, customSummary) => {
    const summary = customSummary || getCustomerCreditSummary(customer, creditLedger, sales);
    const msg = generateReminderText(customer, summary);
    setReminderCustomer({
      ...customer,
      summary,
      message: msg
    });
    setReminderCopied(false);
  };

  const openAddCreditForCustomer = (cust) => {
    setCreditForm({
      customer_id: cust ? cust.id : "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      credit_days: 30,
      interest_rate: 2,
      notes: ""
    });
    setCreditModalOpen(true);
  };

  const handleAddCreditSubmit = async () => {
    if (!creditForm.customer_id) {
      notify("Please select a farmer account.");
      return;
    }
    const amt = Number(creditForm.amount);
    if (isNaN(amt) || amt <= 0) {
      notify("Please enter a valid credit amount.");
      return;
    }

    const selectedCust = customers.find(c => c.id === creditForm.customer_id);
    if (!selectedCust) return;

    try {
      const creditDays = Number(creditForm.credit_days || 30);
      const interestRate = Number(creditForm.interest_rate || 2);
      const pDate = creditForm.date || new Date().toISOString().slice(0, 10);
      const dueDate = new Date(new Date(pDate).getTime() + creditDays * 86400000).toISOString().slice(0, 10);
      const billRef = creditForm.notes ? `CR-${creditForm.notes.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}` : `CR-${Date.now().toString().slice(-6)}`;

      await api.post("/farmer_credit_ledger", {
        customer_id: selectedCust.id,
        farmer_id: selectedCust.id,
        farmer_name: selectedCust.name,
        mobile: selectedCust.mobile,
        village: selectedCust.village,
        invoice_id: billRef,
        purchase_date: pDate,
        due_date: dueDate,
        credit_amount: amt,
        principal_amount: amt,
        outstanding_principal: amt,
        amount_paid: 0,
        interest_rate: interestRate,
        credit_due_days: creditDays,
        status: "PENDING",
        notes: creditForm.notes || "Customer credit added",
        update_customer_balance: true
      });

      const updatedBal = Math.round((Number(selectedCust.pending_balance || 0) + amt) * 100) / 100;
      await api.put(`/customers/${selectedCust.id}`, {
        pending_balance: updatedBal,
        credit_amount: updatedBal
      });

      notify(`Credit of ${currency.format(amt)} added for ${selectedCust.name}! Monthly interest starts from ${pDate}.`);
      setCreditModalOpen(false);
      setCreditForm({ customer_id: "", amount: "", date: new Date().toISOString().slice(0, 10), credit_days: 30, interest_rate: 2, notes: "" });
      load();
    } catch (err) {
      notify(err.message || "Failed to add customer credit.");
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (!payModalCustomer) return;
    const amt = Number(payForm.amount);
    const maxAllowed = Number(payModalCustomer.totalOutstanding || payModalCustomer.pending_balance || 0);

    if (isNaN(amt) || amt <= 0) {
      notify("Please enter a valid payment amount greater than zero.");
      return;
    }
    if (maxAllowed > 0 && amt > maxAllowed + 0.01) {
      notify("Payment amount cannot exceed the total outstanding dues.");
      return;
    }

    try {
      await api.post("/payments", {
        customer_id: payModalCustomer.id,
        customer_name: payModalCustomer.name,
        farmer_id: payModalCustomer.id,
        farmer_name: payModalCustomer.name,
        amount: amt,
        amount_paid: amt,
        payment_method: payForm.method,
        payment_date: payForm.date,
        notes: payForm.notes,
        previous_outstanding: payModalCustomer.totalOutstanding || payModalCustomer.pending_balance
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
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button 
            onClick={handleCalculateInterest}
            disabled={interestLoading}
            className="btn bg-indigo-700 hover:bg-indigo-800 text-white font-bold flex items-center gap-1.5 shadow-sm text-xs sm:text-sm py-2 px-3"
            title="Calculate monthly interest for active credit balances"
          >
            <Clock className="h-4 w-4" /> {interestLoading ? "Calculating..." : "Run Monthly Interest"}
          </button>
          <button 
            onClick={() => openAddCreditForCustomer(customers[0])}
            className="btn bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm text-xs sm:text-sm py-2 px-3"
          >
            <Plus className="h-4 w-4" /> Add Customer Credit
          </button>
          <button 
            onClick={() => {
              if (customers.length > 0) openPayModal(customers.find(c => Number(c.pending_balance) > 0) || customers[0]);
              else notify("Please add a farmer record first.");
            }} 
            className="btn bg-paddy-700 text-white font-bold flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-5 w-5" /> Record Payment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <Mini label="Total Collected" value={currency.format(totalCollected)} />
        <Mini label="UPI Payments" value={currency.format(upiCollected)} />
        <Mini label="Card Payments" value={currency.format(cardCollected)} />
        <Mini label="Cash Payments" value={currency.format(cashCollected)} />
        <Mini label="Principal Pending" value={currency.format(creditStats.principal)} />
        <Mini label="Accrued Interest" value={currency.format(creditStats.interest)} />
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
                          <div className="flex items-center gap-2">
                            {cust && (
                              <button className="link text-xs font-bold" onClick={() => setLedgerCustomer(cust)}>View Ledger</button>
                            )}
                            {(() => {
                              const refNo = p.bill_number || p.invoice_id;
                              const matchingSale = sales.find(s => s.invoice_number === refNo || s.id === (p.sale_id || refNo));
                              if (!matchingSale) return null;
                              return (
                                <button
                                  disabled={resendingBillId === matchingSale.id}
                                  onClick={() => handleResendBill(matchingSale)}
                                  className="btn-secondary text-[11px] py-0.5 px-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold flex items-center gap-1 shadow-xs"
                                  title="Resend official GST Bill via WhatsApp and Email"
                                >
                                  <Send className="h-2.5 w-2.5" /> {resendingBillId === matchingSale.id ? "Sending..." : "Resend Bill"}
                                </button>
                              );
                            })()}
                          </div>
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
          <div className="overflow-x-auto rounded-md border border-slate-200 custom-scrollbar">
            <table className="w-full text-sm min-w-[920px]">
              <thead className="bg-paddy-50 text-left">
                <tr>
                  <th className="py-3 px-3">Farmer Name</th>
                  <th className="py-3 px-3">Mobile / Village</th>
                  <th className="py-3 px-3">Credit Limit</th>
                  <th className="py-3 px-3">Principal Dues</th>
                  <th className="py-3 px-3">Accrued Interest (from Purchase Date)</th>
                  <th className="py-3 px-3">Total Outstanding</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customers
                  .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.village?.toLowerCase().includes(search.toLowerCase()) || c.mobile?.includes(search))
                  .map(c => {
                    const summary = getCustomerCreditSummary(c, creditLedger, sales);
                    const isCleared = summary.principal <= 0 && summary.totalOutstanding <= 0;
                    const oldestBill = summary.breakdown.length > 0 ? summary.breakdown[0] : null;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800">{c.name}</td>
                        <td className="py-3 px-3 text-xs text-slate-600">{c.mobile || "-"} | {c.village || "-"}</td>
                        <td className="py-3 px-3 text-xs text-slate-600">{currency.format(c.credit_amount || 20000)}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {currency.format(summary.principal)}
                        </td>
                        <td className="py-3 px-3">
                          {summary.accruedInterest > 0 ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-amber-700">+{currency.format(summary.accruedInterest)}</span>
                              {oldestBill && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {oldestBill.daysElapsed}d @ {oldestBill.rate}%/mo (from {oldestBill.purchase_date})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">₹0.00</span>
                          )}
                        </td>
                        <td className={`py-3 px-3 font-black text-base ${isCleared ? "text-emerald-600" : "text-red-600"}`}>
                          {currency.format(summary.totalOutstanding)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCleared ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {isCleared ? "✓ CLEARED" : "Outstanding Dues"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex gap-1.5 items-center justify-end flex-wrap">
                            {!isCleared ? (
                              <>
                                <button 
                                  onClick={() => openPayModal(c, summary)} 
                                  className="btn-secondary text-xs py-1 px-2.5 bg-paddy-700 text-white font-bold hover:bg-paddy-800 shadow-sm"
                                >
                                  + Pay Dues
                                </button>
                                <button 
                                  onClick={() => openReminderModal(c, summary)} 
                                  className="btn-secondary text-xs py-1 px-2.5 bg-emerald-700 text-white font-bold hover:bg-emerald-800 flex items-center gap-1 shadow-sm"
                                  title="Send payment reminder on WhatsApp and Email"
                                >
                                  <Bell className="h-3 w-3" /> Remind
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => openAddCreditForCustomer(c)} 
                                className="btn-secondary text-xs py-1 px-2.5 bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-sm"
                              >
                                + Give Credit
                              </button>
                            )}
                            <button 
                              onClick={() => window.open(`/api/credit/statements/${c.id}`, "_blank")}
                              className="btn-secondary text-xs py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 border border-slate-300 shadow-xs"
                              title="Download Official Account Statement PDF"
                            >
                              <FileText className="h-3 w-3 text-slate-500" /> Statement
                            </button>
                            <button 
                              onClick={() => openInterestHistory(c)}
                              className="btn-secondary text-xs py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-1 shadow-xs"
                              title="View Monthly Interest Accrual History"
                            >
                              <Clock className="h-3 w-3" /> Interest
                            </button>
                            <button className="link text-xs font-bold" onClick={() => setLedgerCustomer({ ...c, creditSummary: summary })}>
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

      {/* Add Customer Credit Modal */}
      {creditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Add Customer Credit (Udhaari)</h2>
                  <p className="text-xs text-slate-500">Record unpaid product balance or farmer credit</p>
                </div>
              </div>
              <button onClick={() => setCreditModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              <Select
                label="Select Farmer / Customer"
                value={creditForm.customer_id}
                options={["", ...customers.map(c => c.id)]}
                labels={{ "": "-- Select Farmer --", ...Object.fromEntries(customers.map(c => [
                  c.id, 
                  `${c.name} (${c.mobile || "No mob"}${c.village ? " - " + c.village : ""}) - Balance: ₹${Number(c.pending_balance || 0).toFixed(2)}`
                ]))}}
                onChange={(customer_id) => setCreditForm({ ...creditForm, customer_id })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Credit Amount (₹)" 
                  type="number" 
                  value={creditForm.amount} 
                  onChange={amount => setCreditForm({ ...creditForm, amount })} 
                />
                <Input 
                  label="Credit / Purchase Date" 
                  type="date" 
                  value={creditForm.date} 
                  onChange={date => setCreditForm({ ...creditForm, date })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Credit Due Days" 
                  type="number" 
                  value={creditForm.credit_days} 
                  onChange={credit_days => setCreditForm({ ...creditForm, credit_days })} 
                />
                <Input 
                  label="Monthly Interest Rate %" 
                  type="number" 
                  value={creditForm.interest_rate} 
                  onChange={interest_rate => setCreditForm({ ...creditForm, interest_rate })} 
                />
              </div>

              <Input 
                label="Reference Bill / Purpose" 
                placeholder="e.g. Fertilizer purchase balance, Seeds credit, Monsoon Udhaari" 
                value={creditForm.notes} 
                onChange={notes => setCreditForm({ ...creditForm, notes })} 
              />

              {/* Dynamic Calculation Preview */}
              {Number(creditForm.amount) > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 text-xs text-amber-950 space-y-1.5 shadow-sm">
                  <div className="flex justify-between font-bold">
                    <span>Credit Principal:</span>
                    <span>{currency.format(Number(creditForm.amount))}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Monthly Interest Rate:</span>
                    <span>{creditForm.interest_rate || 2}% per month</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Monthly Interest Accrual:</span>
                    <span className="font-bold text-amber-800">+{currency.format(Number(creditForm.amount) * Number(creditForm.interest_rate || 2) / 100)} / month</span>
                  </div>
                  <div className="pt-1.5 border-t border-amber-200 text-amber-900">
                    Interest starts calculating from purchase date <strong>{creditForm.date}</strong> and accumulates month by month until paid.
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleAddCreditSubmit}
                disabled={!creditForm.customer_id || Number(creditForm.amount) <= 0}
                className="btn flex-1 py-3 text-base bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold"
              >
                Save & Add Credit
              </button>
              <button
                type="button"
                onClick={() => setCreditModalOpen(false)}
                className="btn-secondary flex-1 py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-800">Record Farmer Payment</h2>
              <button onClick={() => setPayModalCustomer(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <Select
              label="Select Farmer Account"
              value={payModalCustomer.id}
              options={customers.map(c => c.id)}
              labels={Object.fromEntries(customers.map(c => [
                c.id, 
                `${c.name} (${c.mobile || "No mob"}${c.village ? " - " + c.village : ""}) - Balance: ₹${Number(c.pending_balance || 0).toFixed(2)}`
              ]))}
              onChange={(cid) => {
                const selected = customers.find(c => c.id === cid);
                if (selected) openPayModal(selected);
              }}
            />

            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
              <Row label="Principal Outstanding" value={currency.format(payModalCustomer.pendingPrincipal ?? payModalCustomer.pending_balance)} />
              <Row label="Accrued Interest (from Purchase Date)" value={`+ ${currency.format(payModalCustomer.estInterest || 0)}`} />
              <Row label="Total Outstanding Payable" value={currency.format(payModalCustomer.totalOutstanding ?? payModalCustomer.pending_balance)} strong />
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setPayForm({ ...payForm, amount: String(payModalCustomer.totalOutstanding) })}
                className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 hover:bg-emerald-100"
              >
                Full Total (₹{Number(payModalCustomer.totalOutstanding).toFixed(2)})
              </button>
              <button 
                type="button" 
                onClick={() => setPayForm({ ...payForm, amount: String(payModalCustomer.pendingPrincipal) })}
                className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-800 rounded border border-slate-300 hover:bg-slate-200"
              >
                Principal Only (₹{Number(payModalCustomer.pendingPrincipal).toFixed(2)})
              </button>
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
                placeholder="e.g. Partial cash payment against fertilizer dues" 
                value={payForm.notes} 
                onChange={v => setPayForm({ ...payForm, notes: v })} 
              />
            </div>

            {(() => {
              const amt = Number(payForm.amount || 0);
              const totalDue = Number(payModalCustomer.totalOutstanding || payModalCustomer.pending_balance || 0);
              const remaining = Math.max(0, Math.round((totalDue - amt) * 100) / 100);
              const isOverpaid = amt > totalDue;

              return (
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <div className="bg-slate-100 p-3 rounded text-xs space-y-1">
                    <Row label="Total Outstanding Due" value={currency.format(totalDue)} />
                    <Row label="Payment Being Recorded" value={`- ${currency.format(amt)}`} />
                    <Row label="Remaining Dues After Payment" value={currency.format(remaining)} strong />
                  </div>

                  {isOverpaid && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-bold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      Payment amount cannot exceed total outstanding dues.
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

      {/* Customer Payment Reminder Modal */}
      {reminderCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Customer Payment Reminder</h2>
                  <p className="text-xs text-slate-500">Sri Anjaneya Agro Agencies Counter Notice</p>
                </div>
              </div>
              <button onClick={() => setReminderCustomer(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              {/* Customer & Dues Summary */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Farmer Account</p>
                    <h3 className="text-base font-bold text-slate-900">{reminderCustomer.name}</h3>
                    <p className="text-xs text-slate-600">📱 {reminderCustomer.mobile || "No mobile"} {reminderCustomer.village ? `| 📍 ${reminderCustomer.village}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Total Payable</span>
                    <span className="text-xl font-black text-emerald-800">{currency.format(reminderCustomer.summary.totalOutstanding)}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-2 text-xs">
                  <div>Principal: <span className="font-bold text-slate-800">{currency.format(reminderCustomer.summary.principal)}</span></div>
                  <div className="text-right">Accrued Interest: <span className="font-bold text-amber-800">+{currency.format(reminderCustomer.summary.accruedInterest)}</span></div>
                </div>
              </div>

              {/* Bill Breakdown if available */}
              {reminderCustomer.summary.breakdown.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                  <p className="text-xs font-bold text-slate-700">Credit Bills & Accrued Interest Breakdown</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {reminderCustomer.summary.breakdown.map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-slate-200">
                        <div>
                          <span className="font-mono font-bold text-paddy-800">{b.invoice_id}</span>
                          <span className="text-slate-500 ml-1.5 font-normal">({b.purchase_date} • {b.daysElapsed}d ago)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-700">{currency.format(b.principal)}</span>
                          {b.accruedInterest > 0 && (
                            <span className="text-amber-700 ml-1 text-[11px]">(+{currency.format(b.accruedInterest)})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Message Preview */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp / SMS Message Content</label>
                <textarea
                  readOnly
                  rows={7}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 bg-slate-100 text-slate-800 leading-relaxed resize-none focus:outline-none"
                  value={reminderCustomer.message}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  disabled={reminderSending}
                  onClick={() => handleSendReminderViaSystem("both")}
                  className="btn bg-paddy-700 hover:bg-paddy-800 text-white font-bold flex items-center justify-center gap-1 py-2 text-xs disabled:opacity-50"
                  title="Auto-dispatch via WhatsApp and Gmail"
                >
                  <Send className="h-3.5 w-3.5" /> {reminderSending ? "Sending..." : "Send Both (WA + Email)"}
                </button>
                <button
                  disabled={reminderSending}
                  onClick={() => handleSendReminderViaSystem("whatsapp")}
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 py-2 text-xs disabled:opacity-50"
                  title="Send via official WhatsApp (+91 8660548244)"
                >
                  <Send className="h-3.5 w-3.5" /> WhatsApp Only
                </button>
                <button
                  disabled={reminderSending}
                  onClick={() => handleSendReminderViaSystem("email")}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1 py-2 text-xs disabled:opacity-50"
                  title="Send via harshavardhanjunji@gmail.com"
                >
                  <Mail className="h-3.5 w-3.5" /> Email Only
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const cleanPhone = String(reminderCustomer.mobile || "").replace(/\D/g, "");
                    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(reminderCustomer.message)}`, "_blank");
                  }}
                  className="btn-secondary flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center justify-center gap-1.5 py-2 text-xs"
                >
                  <Send className="h-3.5 w-3.5" /> Open WhatsApp Web
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(reminderCustomer.message);
                    setReminderCopied(true);
                    setTimeout(() => setReminderCopied(false), 2000);
                  }}
                  className="btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                >
                  {reminderCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {reminderCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detailed Payment Ledger Modal */}
      {ledgerCustomer && (() => {
        const custCredit = getCustomerCreditSummary(ledgerCustomer, creditLedger, sales);
        return (
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
                <div className="flex items-center gap-2">
                  {custCredit.totalOutstanding > 0 && (
                    <button 
                      onClick={() => openReminderModal(ledgerCustomer, custCredit)}
                      className="btn-secondary text-xs py-1.5 px-3 bg-emerald-700 text-white font-bold hover:bg-emerald-800 flex items-center gap-1"
                    >
                      <Bell className="h-3.5 w-3.5" /> Send Reminder
                    </button>
                  )}
                  <button onClick={() => setLedgerCustomer(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto space-y-6">
                {/* Ledger Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <Mini 
                    label="Total Paid To Date" 
                    value={currency.format(
                      payments
                        .filter(p => p.customer_id === ledgerCustomer.id || p.customer_name === ledgerCustomer.name)
                        .reduce((sum, p) => sum + Number(p.amount_paid || p.amount || 0), 0)
                    )} 
                  />
                  <Mini label="Principal Dues" value={currency.format(custCredit.principal)} />
                  <Mini label="Accrued Interest" value={currency.format(custCredit.accruedInterest)} />
                  <Mini label="Total Payable" value={currency.format(custCredit.totalOutstanding)} />
                </div>

                {/* Active Credit Invoices with Purchase Date & Accrued Interest */}
                {custCredit.breakdown.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-2.5">Credit Bills & Accrued Interest Breakdown</h3>
                    <div className="overflow-x-auto rounded border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-amber-50/60 text-left font-bold text-amber-950">
                          <tr>
                            <th className="p-2">Invoice No</th>
                            <th className="p-2">Purchase Date</th>
                            <th className="p-2">Days Elapsed</th>
                            <th className="p-2">Principal</th>
                            <th className="p-2">Interest Rate</th>
                            <th className="p-2">Accrued Interest</th>
                            <th className="p-2">Bill Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {custCredit.breakdown.map((b, idx) => (
                            <tr key={b.id || idx} className="hover:bg-slate-50">
                              <td className="p-2 font-mono font-bold text-paddy-800">{b.invoice_id}</td>
                              <td className="p-2">{b.purchase_date}</td>
                              <td className="p-2 font-semibold text-slate-600">{b.daysElapsed} days</td>
                              <td className="p-2 font-semibold">{currency.format(b.principal)}</td>
                              <td className="p-2">{b.rate}%/mo</td>
                              <td className="p-2 font-bold text-amber-700">+{currency.format(b.accruedInterest)}</td>
                              <td className="p-2 font-black text-slate-800">{currency.format(b.totalDue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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
        );
      })()}

      {/* Monthly Interest History Modal */}
      {historyModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Monthly Interest Ledger</h2>
                  <p className="text-xs text-slate-500">
                    Farmer: <span className="font-semibold text-slate-800">{historyModalCustomer.name}</span> (Mobile: {historyModalCustomer.mobile || "-"})
                  </p>
                </div>
              </div>
              <button onClick={() => setHistoryModalCustomer(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-3">
              {historyLoading ? (
                <p className="p-8 text-center text-sm text-slate-500">Loading interest calculation history...</p>
              ) : !customerInterestHistory.length ? (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                  <Clock className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Monthly Interest Records Found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Monthly interest calculates on the 1st of each month via background scheduler or by clicking "Run Monthly Interest".
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-indigo-50/70 text-left font-bold text-indigo-950">
                      <tr>
                        <th className="p-2.5">Cycle</th>
                        <th className="p-2.5">Calculation Date</th>
                        <th className="p-2.5">Principal</th>
                        <th className="p-2.5">Rate %</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Interest Charged</th>
                        <th className="p-2.5">New Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {customerInterestHistory.map(h => (
                        <tr key={h.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-indigo-900">{h.cycle_month}</td>
                          <td className="p-2.5 text-slate-600">{h.calculation_date || h.created_at?.slice(0, 10)}</td>
                          <td className="p-2.5 font-semibold">{currency.format(Number(h.principal_amount || 0))}</td>
                          <td className="p-2.5">{h.interest_rate}%</td>
                          <td className="p-2.5 capitalize">{h.calculation_type || "Simple"}</td>
                          <td className="p-2.5 font-bold text-amber-800">+{currency.format(Number(h.interest_amount || 0))}</td>
                          <td className="p-2.5 font-black text-slate-800">{currency.format(Number(h.new_balance || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                onClick={() => window.open(`/api/credit/statements/${historyModalCustomer.id}`, "_blank")}
                className="btn-secondary text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5"
              >
                <FileText className="h-4 w-4 text-slate-500" /> Download Full Statement (PDF)
              </button>
              <button
                onClick={() => setHistoryModalCustomer(null)}
                className="btn bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function Stock({ api, notify }) {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("batches"); // batches | adjust | logs
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    product_id: "",
    product_name: "",
    batch_number: "",
    purchase_date: new Date().toISOString().slice(0, 10),
    mfg_date: "",
    expiry_date: "",
    current_stock: "",
    unit: "Bag",
    purchase_price: "",
    selling_price: "",
    supplier_name: ""
  });
  const [adjust, setAdjust] = useState({ product_id: "", qty: 0, type: "adjustment", note: "" });

  const loadData = () => {
    api.get("/products").then(setProducts).catch(console.error);
    api.get("/inventory/batches").then(setBatches).catch(console.error);
    api.get("/stock/logs").then(setLogs).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStock = async () => {
    if (!adjust.product_id) return notify("Please select a product");
    await api.post(`/products/${adjust.product_id}/adjust-stock`, adjust);
    notify("Stock adjusted successfully");
    setAdjust({ product_id: "", qty: 0, type: "adjustment", note: "" });
    loadData();
  };

  const handleRunExpiryScan = async () => {
    setScanning(true);
    try {
      const res = await api.post("/inventory/check-expiry", { force: true });
      notify(`Expiry Scan Complete: ${res.alerts_dispatched || 0} alert(s) dispatched to harshavardhanjunji@gmail.com and +91 8660548244.`);
      loadData();
    } catch (err) {
      notify("Scan failed: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  const openAddBatch = () => {
    setEditingBatch(null);
    setBatchForm({
      product_id: products[0]?.id || "",
      product_name: products[0]?.name || "",
      batch_number: `BCH-${Date.now().toString().slice(-6)}`,
      purchase_date: new Date().toISOString().slice(0, 10),
      mfg_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      current_stock: "50",
      unit: products[0]?.unit || "Bag",
      purchase_price: products[0]?.purchase_price || "",
      selling_price: products[0]?.selling_price || "",
      supplier_name: products[0]?.supplier_name || "IFFCO Agro"
    });
    setBatchModalOpen(true);
  };

  const openEditBatch = (b) => {
    setEditingBatch(b);
    setBatchForm({
      product_id: b.product_id,
      product_name: b.product_name,
      batch_number: b.batch_number,
      purchase_date: b.purchase_date || "",
      mfg_date: b.mfg_date || "",
      expiry_date: b.expiry_date || "",
      current_stock: String(b.current_stock ?? 0),
      unit: b.unit || "Bag",
      purchase_price: String(b.purchase_price ?? ""),
      selling_price: String(b.selling_price ?? ""),
      supplier_name: b.supplier_name || ""
    });
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async () => {
    if (!batchForm.product_id || !batchForm.batch_number || !batchForm.expiry_date) {
      notify("Please fill all required fields (Product, Batch No, Expiry Date).");
      return;
    }
    try {
      const selectedProd = products.find(p => p.id === batchForm.product_id);
      const payload = {
        ...batchForm,
        product_name: selectedProd?.name || batchForm.product_name,
        current_stock: Number(batchForm.current_stock || 0),
        purchase_price: Number(batchForm.purchase_price || 0),
        selling_price: Number(batchForm.selling_price || 0)
      };
      if (editingBatch) {
        await api.put(`/inventory/batches/${editingBatch.id}`, payload);
        notify("Batch details updated successfully.");
      } else {
        await api.post("/inventory/batches", payload);
        notify("New product batch registered into inventory.");
      }
      setBatchModalOpen(false);
      loadData();
    } catch (err) {
      notify("Failed to save batch: " + err.message);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Are you sure you want to remove this batch record?")) return;
    try {
      await api.delete(`/inventory/batches/${batchId}`);
      notify("Batch deleted from inventory.");
      loadData();
    } catch (err) {
      notify("Failed to delete batch: " + err.message);
    }
  };

  // Shelf-life calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let safe = 0;
    let exp60_90 = 0;
    let exp30_60 = 0;
    let expUnder30 = 0;
    let expired = 0;

    batches.forEach(b => {
      if (!b.expiry_date) return;
      const exp = new Date(b.expiry_date);
      exp.setHours(0, 0, 0, 0);
      const days = Math.round((exp - today) / 86400000);
      if (days < 0) expired++;
      else if (days <= 30) expUnder30++;
      else if (days <= 60) exp30_60++;
      else if (days <= 90) exp60_90++;
      else safe++;
    });

    return { total: batches.length, safe, exp60_90, exp30_60, expUnder30, expired };
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return batches.filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (b.product_name && b.product_name.toLowerCase().includes(q)) ||
        (b.batch_number && b.batch_number.toLowerCase().includes(q)) ||
        (b.supplier_name && b.supplier_name.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (!b.expiry_date) return statusFilter === "ALL";
      const exp = new Date(b.expiry_date);
      exp.setHours(0, 0, 0, 0);
      const days = Math.round((exp - today) / 86400000);

      if (statusFilter === "EXPIRED") return days < 0;
      if (statusFilter === "CRITICAL") return days >= 0 && days <= 30;
      if (statusFilter === "ORANGE") return days > 30 && days <= 60;
      if (statusFilter === "YELLOW") return days > 60 && days <= 90;
      if (statusFilter === "SAFE") return days > 90;
      return true;
    });
  }, [batches, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <Mini label="Total Batches" value={stats.total} />
        <Mini label="Safe (>90d)" value={stats.safe} />
        <Mini label="Watchlist (60-90d)" value={stats.exp60_90} />
        <Mini label="Action Req (30-60d)" value={stats.exp30_60} />
        <Mini label="Critical (<=30d)" value={stats.expUnder30} />
        <Mini label="Expired (BLOCKED)" value={stats.expired} />
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("batches")}
            className={`px-4 py-2 font-bold transition-all ${activeTab === "batches" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Batch Expiry Safety Hub
          </button>
          <button
            onClick={() => setActiveTab("adjust")}
            className={`px-4 py-2 font-bold transition-all ${activeTab === "adjust" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Stock Adjustment
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 font-bold transition-all ${activeTab === "logs" ? "text-paddy-700 border-b-2 border-paddy-700 bg-paddy-50/50" : "text-slate-500 hover:text-slate-800"}`}
          >
            Movement Logs ({logs.length})
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            disabled={scanning}
            onClick={handleRunExpiryScan}
            className="btn bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm text-xs sm:text-sm py-2 px-3"
            title="Scan batches now and dispatch alerts to shop owner"
          >
            <Bell className="h-4 w-4" /> {scanning ? "Scanning..." : "Run Expiry Scan Now"}
          </button>
          <button
            onClick={openAddBatch}
            className="btn bg-paddy-700 hover:bg-paddy-800 text-white font-bold flex items-center gap-1.5 shadow-sm text-xs sm:text-sm py-2 px-3"
          >
            <Plus className="h-4 w-4" /> Add Product Batch
          </button>
        </div>
      </div>

      {activeTab === "batches" && (
        <Panel
          title="Product Batches and Shelf-Life Safety"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <SearchBox value={search} setValue={setSearch} />
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-bold">
                {[
                  ["ALL", "All"],
                  ["SAFE", ">90d Safe"],
                  ["YELLOW", "60-90d"],
                  ["ORANGE", "30-60d"],
                  ["CRITICAL", "<=30d"],
                  ["EXPIRED", "Expired"]
                ].map(([f, lbl]) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-2.5 py-1 rounded transition-colors ${statusFilter === f ? "bg-white text-paddy-800 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {!filteredBatches.length ? (
            <p className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">No product batches matching filter.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-paddy-50 text-left font-bold">
                  <tr>
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5">Batch Number</th>
                    <th className="p-2.5">Mfg Date</th>
                    <th className="p-2.5">Expiry Date</th>
                    <th className="p-2.5">Shelf Life Status</th>
                    <th className="p-2.5">Stock</th>
                    <th className="p-2.5">Selling Price</th>
                    <th className="p-2.5">Supplier</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBatches.map(b => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const exp = b.expiry_date ? new Date(b.expiry_date) : null;
                    if (exp) exp.setHours(0, 0, 0, 0);
                    const days = exp ? Math.round((exp - today) / 86400000) : 999;
                    const isExpired = days < 0;

                    let badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
                    let badgeText = `${days} days left (Safe)`;
                    if (isExpired) {
                      badgeClass = "bg-red-800 text-white font-black animate-pulse";
                      badgeText = `EXPIRED (${Math.abs(days)}d ago) - BLOCKED`;
                    } else if (days <= 30) {
                      badgeClass = "bg-red-100 text-red-800 border-red-300 font-bold";
                      badgeText = `CRITICAL: ${days} days left`;
                    } else if (days <= 60) {
                      badgeClass = "bg-orange-100 text-orange-800 border-orange-300 font-bold";
                      badgeText = `Warning: ${days} days left`;
                    } else if (days <= 90) {
                      badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
                      badgeText = `Watchlist: ${days} days left`;
                    }

                    return (
                      <tr key={b.id} className={`hover:bg-slate-50 ${isExpired ? "bg-red-50/40" : ""}`}>
                        <td className="p-2.5 font-bold text-slate-900">{b.product_name}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-700">{b.batch_number}</td>
                        <td className="p-2.5 text-slate-600">{b.mfg_date || "-"}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{b.expiry_date}</td>
                        <td className="p-2.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {b.current_stock} {b.unit || "Bag"}
                        </td>
                        <td className="p-2.5 font-semibold">{currency.format(Number(b.selling_price || 0))}</td>
                        <td className="p-2.5 text-slate-600">{b.supplier_name || "-"}</td>
                        <td className="p-2.5 text-right">
                          <div className="flex gap-2 items-center justify-end">
                            <button
                              onClick={() => openEditBatch(b)}
                              className="text-paddy-700 hover:text-paddy-900 font-bold text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBatch(b.id)}
                              className="text-red-600 hover:text-red-800 font-bold text-xs"
                            >
                              Delete
                            </button>
                          </div>
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

      {activeTab === "adjust" && (
        <Panel title="Stock Adjustment">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              label="Product"
              value={adjust.product_id}
              options={["", ...products.map((p) => p.id)]}
              labels={{ "": "Select product", ...Object.fromEntries(products.map((p) => [p.id, p.name])) }}
              onChange={(product_id) => setAdjust({ ...adjust, product_id })}
            />
            <Input
              label="Qty (+ inward / - outward)"
              type="number"
              value={adjust.qty}
              onChange={(qty) => setAdjust({ ...adjust, qty })}
            />
            <Select
              label="Type"
              value={adjust.type}
              options={["adjustment", "damage", "return", "opening"]}
              onChange={(type) => setAdjust({ ...adjust, type })}
            />
            <Input
              label="Note"
              value={adjust.note}
              onChange={(note) => setAdjust({ ...adjust, note })}
            />
          </div>
          <button onClick={handleAdjustStock} className="btn mt-4 flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Adjustment
          </button>
        </Panel>
      )}

      {activeTab === "logs" && (
        <Panel title="Stock Movement Logs">
          <DataTable
            rows={logs}
            columns={["product_name", "type", "qty", "note", "created_by", "created_at"]}
          />
        </Panel>
      )}

      {/* Add / Edit Batch Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-paddy-100 flex items-center justify-center text-paddy-800">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{editingBatch ? "Edit Product Batch" : "Add Product Batch"}</h2>
                  <p className="text-xs text-slate-500">Track shelf-life and chemical expiry safeguards</p>
                </div>
              </div>
              <button onClick={() => setBatchModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1">
              <Select
                label="Product"
                value={batchForm.product_id}
                options={products.map(p => p.id)}
                labels={Object.fromEntries(products.map(p => [p.id, `${p.name} (${p.unit || "Bag"})`]))}
                onChange={product_id => {
                  const sel = products.find(p => p.id === product_id);
                  setBatchForm({
                    ...batchForm,
                    product_id,
                    product_name: sel?.name || "",
                    unit: sel?.unit || "Bag",
                    purchase_price: sel?.purchase_price || "",
                    selling_price: sel?.selling_price || ""
                  });
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Batch Number"
                  value={batchForm.batch_number}
                  onChange={batch_number => setBatchForm({ ...batchForm, batch_number })}
                />
                <Input
                  label="Current Stock Quantity"
                  type="number"
                  value={batchForm.current_stock}
                  onChange={current_stock => setBatchForm({ ...batchForm, current_stock })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Purchase Date"
                  type="date"
                  value={batchForm.purchase_date}
                  onChange={purchase_date => setBatchForm({ ...batchForm, purchase_date })}
                />
                <Input
                  label="Mfg Date"
                  type="date"
                  value={batchForm.mfg_date}
                  onChange={mfg_date => setBatchForm({ ...batchForm, mfg_date })}
                />
                <Input
                  label="Expiry Date *"
                  type="date"
                  value={batchForm.expiry_date}
                  onChange={expiry_date => setBatchForm({ ...batchForm, expiry_date })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Purchase Price (₹)"
                  type="number"
                  value={batchForm.purchase_price}
                  onChange={purchase_price => setBatchForm({ ...batchForm, purchase_price })}
                />
                <Input
                  label="Selling Price (₹)"
                  type="number"
                  value={batchForm.selling_price}
                  onChange={selling_price => setBatchForm({ ...batchForm, selling_price })}
                />
              </div>

              <Input
                label="Supplier Name"
                value={batchForm.supplier_name}
                onChange={supplier_name => setBatchForm({ ...batchForm, supplier_name })}
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={handleSaveBatch}
                className="btn flex-1 py-2.5 bg-paddy-700 hover:bg-paddy-800 text-white font-bold"
              >
                {editingBatch ? "Update Batch" : "Save Product Batch"}
              </button>
              <button
                onClick={() => setBatchModalOpen(false)}
                className="btn-secondary flex-1 py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Reports({ api, notify }) {
  const [type, setType] = useState("sales-register");
  const [rows, setRows] = useState([]);
  const [dates, setDates] = useState({ from: new Date().toISOString().slice(0, 8) + "01", to: new Date().toISOString().slice(0, 10) });
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyData, setMonthlyData] = useState(null);

  const load = () => {
    if (type === "monthly-executive") {
      api.get(`/reports/monthly-executive?month=${targetMonth}`).then((data) => {
        setMonthlyData(data);
        setRows(data.rows || []);
      }).catch(err => notify(err.message || "Failed to load monthly executive report."));
    } else {
      api.get(`/reports/${type}?from=${dates.from}&to=${dates.to}`).then((data) => setRows(data.rows));
    }
  };

  useEffect(() => void load(), [type, targetMonth]);

  function downloadCsv() {
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
    download(`${type}_${targetMonth || "report"}.csv`, csv, "text/csv");
    notify("CSV exported successfully");
    setTimeout(() => notify(""), 2200);
  }

  function downloadExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Report");
    XLSX.writeFile(wb, `${type}_${targetMonth || "report"}.xlsx`);
    notify("Excel spreadsheet generated");
    setTimeout(() => notify(""), 2200);
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <Panel title="Report Filters & Configuration">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-end gap-3">
          <Select label="Report Type" value={type} options={reportTypes.map(([key]) => key)} labels={Object.fromEntries(reportTypes)} onChange={setType} />
          {type === "monthly-executive" ? (
            <div className="col-span-2">
              <label className="mt-3 block text-sm font-medium text-slate-600">
                Select Month for Executive Audit
                <input
                  type="month"
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-slate-900 outline-none focus:border-paddy-500 font-semibold"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                />
              </label>
            </div>
          ) : (
            <>
              <Input label="From" type="date" value={dates.from} onChange={(from) => setDates({ ...dates, from })} />
              <Input label="To" type="date" value={dates.to} onChange={(to) => setDates({ ...dates, to })} />
            </>
          )}
          <button onClick={load} className="btn"><Search className="h-5 w-5" /> Load</button>
          <button onClick={downloadCsv} className="btn-secondary"><Download className="h-5 w-5" /> CSV</button>
          <button onClick={downloadExcel} className="btn-secondary"><FileSpreadsheet className="h-5 w-5" /> Excel</button>
        </div>
      </Panel>

      {type === "monthly-executive" && monthlyData && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-paddy-800 to-paddy-900 text-white p-5 rounded-lg shadow-soft">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-paddy-200">Executive Statutory Business Audit</span>
              <h2 className="text-xl font-black mt-0.5">Monthly Business Report: {targetMonth}</h2>
              <p className="text-xs text-paddy-100">Sree Anjaneya Agro Agencies • APMC Yard Davanagere</p>
            </div>
            <button
              onClick={printReport}
              className="btn bg-white text-paddy-900 hover:bg-paddy-50 font-bold text-xs py-2 px-4 shadow flex items-center gap-2 self-start sm:self-auto"
            >
              <Printer className="h-4 w-4 text-paddy-700" /> Print Monthly Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Current Stock */}
            <div className="rounded-xl border border-paddy-200 bg-white p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-paddy-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded bg-paddy-100 text-paddy-800">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Current Stock Valuation</h3>
                    <p className="text-[11px] text-slate-500">Live godown inventory valuation</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-paddy-50 text-paddy-800 border border-paddy-200">
                  {monthlyData.current_stock.total_skus} SKUs
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Inventory Value (at Purchase Cost)</span>
                <span className="text-2xl font-black text-paddy-900">{currency.format(monthlyData.current_stock.valuation_cost)}</span>
                <span className="text-xs text-slate-500 block mt-0.5">Selling Value: {currency.format(monthlyData.current_stock.valuation_selling)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                <div className="p-2 rounded bg-amber-50 border border-amber-100">
                  <span className="text-amber-800 block text-[11px] font-medium">Low Stock Items</span>
                  <span className="text-base font-bold text-amber-900">{monthlyData.current_stock.low_stock_count} Products</span>
                </div>
                <div className="p-2 rounded bg-orange-50 border border-orange-100">
                  <span className="text-orange-800 block text-[11px] font-medium">Near-Expiry (90d)</span>
                  <span className="text-base font-bold text-orange-900">{monthlyData.current_stock.expiring_count} Batches</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-semibold block text-slate-700 mb-1">Expiring Stock Risk Valuation:</span>
                <span className="font-bold text-red-700 text-sm">{currency.format(monthlyData.current_stock.expiring_valuation)}</span>
              </div>
            </div>

            {/* Card 2: Total Revenue */}
            <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded bg-blue-100 text-blue-800">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Total Revenue</h3>
                    <p className="text-[11px] text-slate-500">Sales turnover & GST breakdown</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  {monthlyData.total_revenue.total_invoices} Bills
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Gross Invoiced Sales</span>
                <span className="text-2xl font-black text-blue-900">{currency.format(monthlyData.total_revenue.gross_sales)}</span>
                <span className="text-xs text-slate-500 block mt-0.5">Net Taxable: {currency.format(monthlyData.total_revenue.net_taxable)}</span>
              </div>

              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">CGST (50%):</span>
                  <span className="font-semibold text-slate-800">{currency.format(monthlyData.total_revenue.cgst_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SGST (50%):</span>
                  <span className="font-semibold text-slate-800">{currency.format(monthlyData.total_revenue.sgst_total)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-blue-800">
                  <span>Total Statutory Tax:</span>
                  <span>{currency.format(monthlyData.total_revenue.cgst_total + monthlyData.total_revenue.sgst_total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">Cash:</span>
                  <span className="font-bold text-slate-800">{currency.format(monthlyData.total_revenue.tender_breakdown.cash)}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">UPI QR:</span>
                  <span className="font-bold text-emerald-700">{currency.format(monthlyData.total_revenue.tender_breakdown.upi)}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">Card:</span>
                  <span className="font-bold text-slate-800">{currency.format(monthlyData.total_revenue.tender_breakdown.card)}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block">Credit (Udhaari):</span>
                  <span className="font-bold text-amber-700">{currency.format(monthlyData.total_revenue.tender_breakdown.credit)}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Pending Payments */}
            <div className="rounded-xl border border-red-200 bg-white p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-red-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded bg-red-100 text-red-800">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pending Payments</h3>
                    <p className="text-[11px] text-slate-500">Farmer credit & debt aging</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                  Active Khata
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Total Khata Receivable (Principal + Interest)</span>
                <span className="text-2xl font-black text-red-900">{currency.format(monthlyData.pending_payments.total_receivable)}</span>
                <span className="text-xs text-slate-500 block mt-0.5">Principal: {currency.format(monthlyData.pending_payments.principal_outstanding)} | Accrued Int: +{currency.format(monthlyData.pending_payments.accrued_interest)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Month Credit Issued</span>
                  <span className="text-sm font-bold text-amber-700">{currency.format(monthlyData.pending_payments.month_credit_issued)}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Month Collections</span>
                  <span className="text-sm font-bold text-emerald-700">{currency.format(monthlyData.pending_payments.month_credit_collected)}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs pt-1 border-t border-slate-100">
                <span className="font-semibold block text-[11px] text-slate-700">Debt Aging Analysis:</span>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Current (0-30 Days):</span>
                  <span className="font-semibold text-emerald-700">{currency.format(monthlyData.pending_payments.aging_analysis.current_0_30d)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Watchlist (31-60 Days):</span>
                  <span className="font-semibold text-amber-700">{currency.format(monthlyData.pending_payments.aging_analysis.watchlist_31_60d)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Severe Overdue (&gt;60 Days):</span>
                  <span className="font-bold text-red-700">{currency.format(monthlyData.pending_payments.aging_analysis.severe_over_60d)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Panel title={type === "monthly-executive" ? "Itemized Monthly Statutory Ledger Metrics" : reportTypes.find(([key]) => key === type)?.[1]}>
        <DataTable rows={rows} columns={Object.keys(rows[0] || {})} />
      </Panel>
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

function Input({ label, value, onChange, type = "text", error, required, placeholder, disabled, min, max }) {
  return (
    <label className="mt-3 block text-sm font-medium text-slate-600">
      <span className="flex items-center justify-between">
        <span>{label} {required && <span className="text-red-500 font-bold">*</span>}</span>
      </span>
      <input
        className={`mt-1 h-11 w-full rounded-md border px-3 text-slate-900 outline-none transition-colors ${
          error ? "border-red-500 bg-red-50/40 focus:border-red-600" : "border-slate-200 focus:border-paddy-500"
        } ${disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">⚠ {error}</p>}
    </label>
  );
}

function Select({ label, value, options, labels = {}, onChange, error, required }) {
  return (
    <label className="mt-3 block text-sm font-medium text-slate-600">
      <span className="flex items-center justify-between">
        <span>{label} {required && <span className="text-red-500 font-bold">*</span>}</span>
      </span>
      <select
        className={`mt-1 h-11 w-full rounded-md border px-3 text-slate-900 outline-none transition-colors ${
          error ? "border-red-500 bg-red-50/40 focus:border-red-600" : "border-slate-200 focus:border-paddy-500"
        }`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] || option}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">⚠ {error}</p>}
    </label>
  );
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
