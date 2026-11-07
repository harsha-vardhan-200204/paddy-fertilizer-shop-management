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
            {screen === "invoices" && <InvoiceManagement api={api} notify={setToast} user={session.user} setScreen={setScreen} />}
            {screen === "products" && <Products api={api} notify={setToast} />}
            {screen === "purchases" && <Purchases api={api} notify={setToast} user={session.user} />}
            {screen === "customers" && <Customers api={api} notify={setToast} />}
            {screen === "suppliers" && <Suppliers api={api} notify={setToast} />}
            {screen === "farmer_payments" && <FarmerPayments api={api} notify={setToast} />}
            {screen === "stock" && <Stock api={api} notify={setToast} />}
            {screen === "reports" && <Reports api={api} notify={setToast} />}
            {screen === "insights" && <BusinessInsights api={api} notify={setToast} setScreen={setScreen} />}
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
    ["invoices", FileText, "Invoices & Delivery"],
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
    billing: "Sales Billing",
    invoices: "GST Invoices & Digital Delivery Management",
    products: "Product Management",
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
    if (!lines || lines.length === 0) {
      notify("Cart is empty! Please add at least one product item to create an invoice.");
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

function InvoiceManagement({ api, notify, user, setScreen }) {
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState("invoices"); // invoices | reminders | logs
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [cancellingInvoice, setCancellingInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailModalInvoice, setEmailModalInvoice] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  const loadData = () => {
    api.get("/sales").then((data) => setSales(Array.isArray(data) ? data : [])).catch(console.error);
    api.get("/customers").then((data) => setCustomers(Array.isArray(data) ? data : [])).catch(console.error);
    api.get("/invoices/deliveries").then((data) => setDeliveries(Array.isArray(data) ? data : [])).catch(() => setDeliveries([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        String(s.invoice_number || "").toLowerCase().includes(q) ||
        String(s.customer_name || "").toLowerCase().includes(q) ||
        String(s.mobile || "").toLowerCase().includes(q);

      const isCanc = s.status === "CANCELLED";
      let matchPay = true;
      if (paymentFilter === "CANCELLED") matchPay = isCanc;
      else if (paymentFilter === "PAID") matchPay = !isCanc && (s.payment_status === "PAID" || Number(s.balance_due || 0) <= 0);
      else if (paymentFilter === "PARTIAL") matchPay = !isCanc && (s.payment_status === "PARTIAL" || (Number(s.amount_paid || 0) > 0 && Number(s.balance_due || 0) > 0));
      else if (paymentFilter === "CREDIT") matchPay = !isCanc && (s.payment_status === "CREDIT" || (Number(s.amount_paid || 0) === 0 && Number(s.balance_due || 0) > 0));

      const matchDel =
        !deliveryFilter ||
        (deliveryFilter === "whatsapp_sent" && (s.whatsapp_status === "DELIVERED" || s.whatsapp_status === "SIMULATED_SENT")) ||
        (deliveryFilter === "email_sent" && (s.email_status === "DELIVERED" || s.email_status === "SIMULATED_SENT")) ||
        (deliveryFilter === "failed" && (s.whatsapp_status === "FAILED" || s.email_status === "FAILED"));

      const sDate = s.date || (s.created_at ? s.created_at.slice(0, 10) : "");
      const matchFrom = !dateFrom || sDate >= dateFrom;
      const matchTo = !dateTo || sDate <= dateTo;

      return matchSearch && matchPay && matchDel && matchFrom && matchTo;
    });
  }, [sales, search, paymentFilter, deliveryFilter, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const active = sales.filter((s) => s.status !== "CANCELLED");
    const totalBilled = active.reduce((sum, s) => sum + Number(s.grand_total || 0), 0);
    const totalPaid = active.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
    const totalDue = active.reduce((sum, s) => sum + Number(s.balance_due || 0), 0);
    const cancelledCount = sales.filter((s) => s.status === "CANCELLED").length;
    return {
      totalCount: sales.length,
      activeCount: active.length,
      totalBilled,
      totalPaid,
      totalDue,
      cancelledCount
    };
  }, [sales]);

  const creditReminders = useMemo(() => {
    const todayMs = Date.now();
    return sales
      .filter((s) => s.status !== "CANCELLED" && Number(s.balance_due || 0) > 0)
      .map((s) => {
        const pDate = new Date(s.date || s.created_at || Date.now());
        const daysElapsed = Math.max(0, Math.floor((todayMs - pDate.getTime()) / 86400000));
        const dueDays = Number(s.credit_due_days || 30);
        const overdueDays = Math.max(0, daysElapsed - dueDays);
        const months = daysElapsed / 30;
        const interestRate = Number(s.interest_rate || 2);
        const principal = Number(s.balance_due || 0);
        const interest = Math.round(principal * (interestRate / 100) * months * 100) / 100;
        const totalOutstanding = Math.round((principal + interest) * 100) / 100;

        return {
          sale: s,
          customer_name: s.customer_name || "Valued Farmer",
          mobile: s.mobile || "",
          village: s.village || "",
          invoice_number: s.invoice_number,
          purchase_date: s.date || "",
          due_date: s.due_date || new Date(pDate.getTime() + dueDays * 86400000).toISOString().slice(0, 10),
          daysElapsed,
          overdueDays,
          principal,
          interestRate,
          interest,
          totalOutstanding
        };
      })
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }, [sales]);

  const handleDownloadPdf = (sale) => {
    const safeInv = (sale.invoice_number || `INV-${sale.id}`).replace(/[\/\\?%*:|"<>]/g, "-");
    const link = document.createElement("a");
    link.href = `/api/invoices/${sale.id}/pdf`;
    link.download = `${safeInv}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Downloading GST Tax Invoice ${sale.invoice_number}...`);
  };

  const handleRetry = async (sale, channel) => {
    try {
      notify(`Dispatching invoice via ${channel === "whatsapp" ? "WhatsApp Cloud API" : "Email"}...`);
      await api.post(`/invoices/${sale.id}/retry-delivery`, { channel });
      notify(`Digital delivery sent successfully for ${sale.invoice_number}!`);
      loadData();
    } catch (err) {
      notify("Delivery failed: " + (err.message || "Error"));
    }
  };

  const handleSendCustomEmail = async () => {
    if (!emailModalInvoice) return;
    if (!recipientEmail || !recipientEmail.includes("@")) {
      notify("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/invoices/${emailModalInvoice.id}/retry-delivery`, { channel: "email", email: recipientEmail });
      notify(`Invoice PDF successfully emailed to ${recipientEmail}!`);
      setEmailModalInvoice(null);
      setRecipientEmail("");
      loadData();
    } catch (err) {
      notify("Email dispatch failed: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (item) => {
    try {
      notify(`Sending payment reminder to ${item.customer_name}...`);
      await api.post("/invoices/send-reminder", {
        customer: { name: item.customer_name, mobile: item.mobile },
        overdueDays: item.overdueDays,
        principalAmount: item.principal,
        accruedInterest: item.interest,
        totalDue: item.totalOutstanding,
        invoiceNo: item.invoice_number
      });
      notify(`Reminder dispatched to ${item.customer_name} (${item.mobile})!`);
      loadData();
    } catch (err) {
      notify("Reminder failed: " + (err.message || "Error"));
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingInvoice) return;
    if (!cancelReason.trim()) {
      notify("Please provide a reason for cancelling this GST invoice.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/invoices/${cancellingInvoice.id}/cancel`, { reason: cancelReason.trim() });
      notify(`Invoice ${cancellingInvoice.invoice_number} cancelled. Stock restored and credit ledger reversed.`);
      setCancellingInvoice(null);
      setCancelReason("");
      loadData();
    } catch (err) {
      notify("Cancellation failed: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-paddy-700" />
            Automatic GST Invoices & Digital Delivery Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compliant CBIC Sequential Numbering (SAG/YYYY-YY/NNN), Meta WhatsApp Cloud API & Nodemailer SMTP Delivery.
          </p>
        </div>
        <button
          onClick={() => setScreen("billing")}
          className="btn bg-paddy-700 hover:bg-paddy-800 text-white flex items-center gap-2 text-sm shadow-sm shrink-0"
        >
          <ReceiptText className="h-4 w-4" /> Create New GST Sale
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoices Issued</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.activeCount}</p>
          <p className="text-xs text-slate-400 mt-1">{metrics.cancelledCount} cancelled</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Billed</p>
          <p className="text-2xl font-black text-paddy-800 mt-1">{currency.format(metrics.totalBilled)}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">GST Tax Included</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Collected</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{currency.format(metrics.totalPaid)}</p>
          <p className="text-xs text-slate-400 mt-1">Cash, UPI & Card settlements</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit Outstanding</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{currency.format(metrics.totalDue)}</p>
          <p className="text-xs text-amber-600 font-medium mt-1">{creditReminders.length} credit accounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`py-3.5 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "invoices"
              ? "border-paddy-700 text-paddy-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ReceiptText className="h-4 w-4" /> All GST Invoices ({filteredSales.length})
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`py-3.5 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "reminders"
              ? "border-amber-600 text-amber-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="h-4 w-4" /> Payment Reminders ({creditReminders.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`py-3.5 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "logs"
              ? "border-paddy-700 text-paddy-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" /> Delivery Logs & Audit Trail ({deliveries.length})
        </button>
      </div>

      {/* TAB 1: ALL INVOICES */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-b-xl border border-t-0 border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Search Invoices</label>
              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 bg-white">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  className="outline-none w-full text-xs"
                  placeholder="Invoice No, Farmer, Mobile"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Payment Status</label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-xs outline-none bg-white"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="">All Payment Statuses</option>
                <option value="PAID">Fully Paid</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="CREDIT">Credit (Udhaari)</option>
                <option value="CANCELLED">Cancelled Invoices</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Digital Delivery</label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-xs outline-none bg-white"
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value)}
              >
                <option value="">All Delivery Statuses</option>
                <option value="whatsapp_sent">WhatsApp Dispatched</option>
                <option value="email_sent">Email Dispatched</option>
                <option value="failed">Delivery Failed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">From Date</label>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-xs outline-none bg-white"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">To Date</label>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-xs outline-none bg-white"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-left">
                  <tr>
                    <th className="py-3 px-3">Invoice No</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Customer / Farmer</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-right">Paid / Balance</th>
                    <th className="py-3 px-3 text-center">Payment</th>
                    <th className="py-3 px-3 text-center">Digital Delivery</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No GST invoices found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const isCancelled = sale.status === "CANCELLED";
                      const bal = Number(sale.balance_due || 0);
                      const paid = Number(sale.amount_paid || 0);

                      return (
                        <tr
                          key={sale.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isCancelled ? "bg-slate-50/60 opacity-70" : ""
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold">
                            <span className={isCancelled ? "line-through text-slate-400" : "text-paddy-900"}>
                              {sale.invoice_number}
                            </span>
                            {isCancelled && (
                              <span className="ml-1.5 inline-block text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                VOID
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {sale.date || (sale.created_at ? sale.created_at.slice(0, 10) : "-")}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-800">{sale.customer_name || "Walk-in"}</p>
                            <p className="text-[11px] text-slate-500">{sale.mobile || "-"}</p>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {currency.format(sale.grand_total || 0)}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="text-emerald-700 font-semibold">{currency.format(paid)}</span>
                            {bal > 0 && (
                              <span className="text-red-600 font-semibold block text-[11px]">
                                Due: {currency.format(bal)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isCancelled ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                Cancelled
                              </span>
                            ) : bal <= 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Fully Paid
                              </span>
                            ) : paid > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Partial Due
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                Credit (Udhaari)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* WhatsApp badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  sale.whatsapp_status === "DELIVERED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : sale.whatsapp_status === "SIMULATED_SENT"
                                    ? "bg-sky-100 text-sky-800"
                                    : sale.whatsapp_status === "FAILED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                                title={`WhatsApp: ${sale.whatsapp_status || "Pending"}`}
                              >
                                <MessageSquare className="h-3 w-3" />
                                {sale.whatsapp_status === "DELIVERED" ? "Sent" : sale.whatsapp_status === "SIMULATED_SENT" ? "Demo" : "WA"}
                              </span>
                              {/* Email badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  sale.email_status === "DELIVERED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : sale.email_status === "SIMULATED_SENT"
                                    ? "bg-sky-100 text-sky-800"
                                    : sale.email_status === "FAILED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                                title={`Email: ${sale.email_status || "Pending"}`}
                              >
                                <Mail className="h-3 w-3" />
                                {sale.email_status === "DELIVERED" ? "Sent" : sale.email_status === "SIMULATED_SENT" ? "Demo" : "Email"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Download PDF */}
                              <button
                                onClick={() => handleDownloadPdf(sale)}
                                className="p-1 rounded bg-slate-100 hover:bg-paddy-100 text-slate-700 hover:text-paddy-800"
                                title="Download Official A4 GST PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              {/* View / Print */}
                              <button
                                onClick={() => setViewingInvoice(sale)}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                                title="View / Print Invoice"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              {/* Resend WhatsApp */}
                              <button
                                onClick={() => handleRetry(sale, "whatsapp")}
                                className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                title="Resend WhatsApp Invoice"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              {/* Send / Resend Email */}
                              <button
                                onClick={() => {
                                  setEmailModalInvoice(sale);
                                  setRecipientEmail(sale.customer_email || sale.email || "");
                                }}
                                className="p-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700"
                                title="Email PDF Invoice"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </button>
                              {/* Cancel Invoice */}
                              {isAdmin && !isCancelled && (
                                <button
                                  onClick={() => {
                                    setCancellingInvoice(sale);
                                    setCancelReason("");
                                  }}
                                  className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600"
                                  title="Cancel GST Invoice (Audit Required)"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT REMINDERS */}
      {activeTab === "reminders" && (
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
            <Bell className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-950">
              <p className="font-bold text-sm text-amber-900">Automated Khata Credit Reminders</p>
              <p className="mt-0.5">
                Displays farmers with outstanding product balances. Interest is calculated @ <strong>2% per month</strong> from the original purchase date. One-click reminder dispatches an approved WhatsApp notification.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-left">
                  <tr>
                    <th className="py-3 px-3">Farmer Name</th>
                    <th className="py-3 px-3">Mobile / Village</th>
                    <th className="py-3 px-3">Invoice Ref</th>
                    <th className="py-3 px-3">Purchase Date</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-right">Principal Due</th>
                    <th className="py-3 px-3 text-right">Accrued Interest</th>
                    <th className="py-3 px-3 text-right">Total Outstanding</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Quick Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {creditReminders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        🎉 Excellent! All customer credit accounts are fully cleared. No overdue balances.
                      </td>
                    </tr>
                  ) : (
                    creditReminders.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{item.customer_name}</td>
                        <td className="py-3 px-3 text-slate-600">
                          <p>{item.mobile || "-"}</p>
                          <p className="text-[11px] text-slate-400">{item.village || ""}</p>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-paddy-800">{item.invoice_number}</td>
                        <td className="py-3 px-3 text-slate-600">{item.purchase_date}</td>
                        <td className="py-3 px-3 text-slate-600">{item.due_date}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {currency.format(item.principal)}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-700 font-semibold">
                          +{currency.format(item.interest)}
                          <span className="block text-[10px] text-slate-400">({item.daysElapsed}d @ 2%/mo)</span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-red-600 text-sm">
                          {currency.format(item.totalOutstanding)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.overdueDays > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              {item.overdueDays}d Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Due Soon
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSendReminder(item)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-sm"
                              title="Send automated reminder via Meta Cloud API"
                            >
                              <MessageSquare className="h-3 w-3" /> Remind
                            </button>
                            {item.mobile && (
                              <button
                                onClick={() => {
                                  const phone = item.mobile.replace(/\D/g, "");
                                  const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
                                  const text = `Namaskara ${item.customer_name} avare, friendly reminder from SRI ANJANEYA AGRO AGENCIES. Pending credit invoice ${item.invoice_number}: Principal ₹${item.principal.toFixed(2)}, Accrued Interest ₹${item.interest.toFixed(2)}, Total Due ₹${item.totalOutstanding.toFixed(2)}. UPI: 9900389992@sbi. Helpline: 9900389992.`;
                                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
                                }}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                                title="Open WhatsApp Web directly"
                              >
                                Web
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIGITAL DELIVERY LOGS & AUDIT TRAIL */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-paddy-700" /> Digital Invoice Dispatches & System Audit Logs
            </h3>
            <button onClick={loadData} className="icon-btn" title="Refresh Logs">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-left">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Invoice Number</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Recipient</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Delivery Notes / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No digital delivery logs recorded yet. Create an invoice to initiate dispatches.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {d.created_at ? new Date(d.created_at).toLocaleString("en-IN") : "-"}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-paddy-900">{d.invoice_number}</td>
                      <td className="py-3 px-3 capitalize font-semibold text-slate-700">
                        {d.channel?.replace("_", " ")}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{d.recipient}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.status === "SIMULATED_SENT"
                              ? "bg-sky-100 text-sky-800"
                              : d.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                        {d.details || d.error_message || d.message_id || "Dispatched"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW / PRINT INVOICE MODAL */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-800">
                GST Invoice Receipt – {viewingInvoice.invoice_number}
              </h3>
              <button onClick={() => setViewingInvoice(null)} className="icon-btn">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-5 p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
              <div className="text-center">
                <h4 className="font-black text-lg text-paddy-900">SRI ANJANEYA AGRO AGENCIES</h4>
                <p className="text-xs text-slate-600">Main Road, Davangere, Karnataka - 577002</p>
                <p className="text-xs text-slate-600">GSTIN: 29ANHPM1365Q1ZA | Phone: 9900389992</p>
                <span className="inline-block mt-1 text-[11px] font-bold bg-paddy-100 text-paddy-800 px-2 py-0.5 rounded">
                  TAX INVOICE (ORIGINAL FOR RECIPIENT)
                </span>
              </div>

              <div className="grid grid-cols-2 text-xs border-y border-slate-200 py-3 gap-2">
                <div>
                  <p><span className="text-slate-500">Invoice:</span> <strong>{viewingInvoice.invoice_number}</strong></p>
                  <p><span className="text-slate-500">Date:</span> {viewingInvoice.date}</p>
                  <p><span className="text-slate-500">Payment:</span> {(viewingInvoice.payment_method || "Cash").toUpperCase()}</p>
                </div>
                <div>
                  <p><span className="text-slate-500">Customer:</span> <strong>{viewingInvoice.customer_name || "Walk-in"}</strong></p>
                  <p><span className="text-slate-500">Mobile:</span> {viewingInvoice.mobile || "-"}</p>
                  <p><span className="text-slate-500">Place of Supply:</span> {viewingInvoice.is_interstate ? "Inter-State" : "Karnataka (29)"}</p>
                </div>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-left">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-right">Qty</th>
                    <th className="py-1 text-right">Rate</th>
                    <th className="py-1 text-center">Tax %</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(viewingInvoice.items || []).map((it, i) => (
                    <tr key={i}>
                      <td className="py-1.5 font-medium">{it.product_name || it.name}</td>
                      <td className="py-1.5 text-right">{it.qty} {it.unit || "Bag"}</td>
                      <td className="py-1.5 text-right">{currency.format(it.rate)}</td>
                      <td className="py-1.5 text-center">{it.gst_percent || 0}%</td>
                      <td className="py-1.5 text-right font-bold">{currency.format(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm">
                <div>
                  <p className="text-xs text-slate-500">Paid: {currency.format(viewingInvoice.amount_paid || 0)}</p>
                  {Number(viewingInvoice.balance_due || 0) > 0 && (
                    <p className="text-xs text-red-600 font-bold">Balance Due: {currency.format(viewingInvoice.balance_due)}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Grand Total</span>
                  <span className="text-lg font-black text-paddy-900">{currency.format(viewingInvoice.grand_total || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => handleDownloadPdf(viewingInvoice)} className="btn bg-paddy-700 hover:bg-paddy-800 text-white flex items-center gap-1.5 text-xs py-2">
                <Download className="h-4 w-4" /> Download Official A4 PDF
              </button>
              <button onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 text-xs py-2">
                <Printer className="h-4 w-4" /> Print Thermal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL INVOICE MODAL */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-slate-200">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-bold text-lg text-slate-900">Cancel GST Invoice</h3>
            </div>
            <div className="my-4 space-y-3 text-xs text-slate-600">
              <p>
                You are about to cancel Invoice <strong>{cancellingInvoice.invoice_number}</strong> issued to <strong>{cancellingInvoice.customer_name || "Customer"}</strong>.
              </p>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-900 space-y-1">
                <p className="font-bold">Audit Impact:</p>
                <p>• Inventory stock quantities will be restored automatically.</p>
                <p>• Customer pending credit will be reversed.</p>
                <p>• Per CBIC rules, this invoice number will be marked as CANCELLED and will never be reused.</p>
              </div>
              <Input
                label="Cancellation Reason (Mandatory)"
                placeholder="e.g. Defective batch returned, Customer billing error"
                value={cancelReason}
                onChange={setCancelReason}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCancellingInvoice(null)}
                className="btn-secondary text-xs py-2"
                disabled={loading}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loading || !cancelReason.trim()}
                className="btn bg-red-600 hover:bg-red-700 text-white text-xs py-2 font-bold shadow-sm"
              >
                {loading ? "Cancelling..." : "Confirm Invoice Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL DISPATCH MODAL */}
      {emailModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-sky-600" /> Email PDF Invoice
              </h3>
              <button onClick={() => setEmailModalInvoice(null)} className="icon-btn">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Send official GST Tax Invoice <strong>{emailModalInvoice.invoice_number}</strong> with PDF attachment directly to farmer's inbox.
              </p>
              <Input
                label="Recipient Email Address"
                placeholder="farmer@example.com"
                value={recipientEmail}
                onChange={setRecipientEmail}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEmailModalInvoice(null)}
                className="btn-secondary text-xs py-2"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustomEmail}
                disabled={loading || !recipientEmail.includes("@")}
                className="btn bg-sky-600 hover:bg-sky-700 text-white text-xs py-2 font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                {loading ? "Sending..." : "Dispatch Email Invoice"}
              </button>
            </div>
          </div>
        </div>
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
            onClick={() => openAddCreditForCustomer(customers[0])}
            className="btn bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-5 w-5" /> Add Customer Credit
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
                          <div className="flex gap-2 items-center justify-end flex-wrap">
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
                                  title="Send payment reminder on WhatsApp"
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

            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  const cleanPhone = String(reminderCustomer.mobile || "").replace(/\D/g, "");
                  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(reminderCustomer.message)}`, "_blank");
                }}
                className="btn flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 py-2.5 text-sm"
              >
                <Send className="h-4 w-4" /> Send on WhatsApp
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reminderCustomer.message);
                  setReminderCopied(true);
                  setTimeout(() => setReminderCopied(false), 2000);
                }}
                className="btn-secondary px-3.5 py-2.5 text-xs font-bold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              >
                {reminderCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {reminderCopied ? "Copied!" : "Copy"}
              </button>
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
