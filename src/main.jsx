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
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Menu,
  X,
  Trash2,
  Share2,
  Search,
  ShoppingCart,
  Sprout,
  Truck,
  UserRound,
  WalletCards
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
import { createApi, login } from "./api.js";
import "./styles.css";


const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const defaultShop = {
  name: "SRI ANJANEYA AGRO AGENCIES",
  legalName: "JUNJI MARUTHI",
  address: "Shri Shiva nilaya Hale kunduvada Davangere\nHale kunduvada\nDAVANAGERE, KARNATAKA 577566\nIndia",
  gstin: "29ANHPM1365Q1ZA",
  phone: "9900389992"
};
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const api = useMemo(() => createApi(session?.token, () => setSession(null)), [session?.token]);

  useEffect(() => {
    if (session) localStorage.setItem("paddy-session", JSON.stringify(session));
    else localStorage.removeItem("paddy-session");
  }, [session]);




  if (!session) return <Login onLogin={setSession} />;

  return (
    <div className="min-h-screen bg-paddy-50 text-slate-900">
      <Sidebar screen={screen} setScreen={setScreen} user={session.user} logout={() => setSession(null)} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <main className="min-h-screen lg:pl-[264px] pl-0">
        <Header screen={screen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="px-4 sm:px-8 pb-10 pt-6">
          {screen === "dashboard" && <Dashboard api={api} setScreen={setScreen} />}
          {screen === "products" && <Products api={api} notify={setToast} />}
          {screen === "billing" && <Billing api={api} notify={setToast} />}
          {screen === "purchases" && <Purchases api={api} notify={setToast} />}
          {screen === "customers" && <Customers api={api} notify={setToast} />}
          {screen === "suppliers" && <Suppliers api={api} notify={setToast} />}
          {screen === "stock" && <Stock api={api} notify={setToast} />}
          {screen === "reports" && <Reports api={api} notify={setToast} />}
        </div>
      </main>
      {toast && <div className="fixed bottom-6 right-6 rounded-md bg-paddy-700 px-4 py-3 text-white shadow-soft">{toast}</div>}
    </div>
  );
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  
  async function submit(event) {
    event.preventDefault();
    setError("");
    const credentials = {
      username: form.username.trim(),
      password: form.password.trim()
    };
    try {
      onLogin(await login(credentials));
    } catch (err) {
      setError(err instanceof TypeError ? "Cannot reach the API server. Check backend deployment and VITE_API_URL." : err.message);
    }
  }
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_440px] bg-white">
      <section className="flex flex-col justify-between bg-paddy-700 p-6 sm:p-12 text-white">
        <div className="flex items-center gap-3 text-xl font-semibold">
          <Sprout className="h-8 w-8" /> SRI ANJANEYA AGRO AGENCIES
        </div>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-paddy-100">GST Billing and Inventory</p>
          <h1 className="mt-5 text-3xl sm:text-5xl font-semibold leading-tight">Fertilizer shop operations, from invoice to audit.</h1>
          <p className="mt-5 max-w-2xl text-lg text-paddy-100">
            Products, batch stock, farmer credit ledger, purchase inward, GST summaries, and printable bills in one clean counter-friendly system.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-paddy-100">
          <span>Auto invoice numbers</span>
          <span>CGST + SGST split</span>
          <span>Low stock and expiry alerts</span>
        </div>
      </section>
      <section className="flex items-center px-6 sm:px-10 py-12">
        <form onSubmit={submit} className="w-full">
          <h2 className="text-3xl font-semibold">Login</h2>
          
          <Input label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} autoComplete="off" />
          <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} autoComplete="new-password" />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-paddy-600 px-4 font-semibold text-white">
            <UserRound className="h-5 w-5" /> Login
          </button>
        </form>
      </section>
    </div>
  );
}

function Sidebar({ screen, setScreen, user, logout, isOpen, onClose }) {
  const items = [
    ["dashboard", LayoutDashboard, "Dashboard"],
    ["billing", ReceiptText, "Sales Billing"],
    ["products", Boxes, "Products"],
    ["purchases", PackagePlus, "Purchases"],
    ["customers", UserRound, "Farmers"],
    ["suppliers", Truck, "Suppliers"],
    ["stock", AlertTriangle, "Stock"],
    ["reports", FileSpreadsheet, "GST Reports"]
  ];
  return (
    <aside className={`fixed left-0 top-0 flex h-screen w-[264px] flex-col bg-white px-4 py-5 shadow-soft z-50 transition-all duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="lg:hidden absolute top-4 right-4 z-50">
        <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100" title="Close menu">
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-paddy-600 text-white">
          <Sprout className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold">SRI ANJANEYA AGRO AGENCIES</p>
          <p className="text-xs text-slate-500">India GST Billing</p>
        </div>
      </div>
      <nav className="space-y-1">
        {items.map(([key, Icon, label]) => (
          <button key={key} onClick={() => setScreen(key)} className={`nav-item ${screen === key ? "active" : ""}`}>
            <Icon className="h-6 w-6" /> {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-md border border-paddy-100 bg-paddy-50 p-3">
        <p className="font-medium">{user.name}</p>
        <p className="text-sm capitalize text-slate-500">{user.role}</p>
        <button onClick={logout} className="mt-3 flex items-center gap-2 text-sm font-medium text-paddy-700">
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
    purchases: "Purchase Entry",
    customers: "Customer / Farmer Records",
    suppliers: "Supplier Management",
    stock: "Stock Management",
    reports: "GST Reports"
  };
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-paddy-100 bg-white px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="lg:hidden p-1 mr-2 rounded-md hover:bg-slate-100 focus:outline-none" title="Menu">
          <Menu className="h-6 w-6 text-paddy-700" />
        </button>
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold">{titles[screen]}</h1>
          <p className="text-sm text-slate-500 hidden sm:block">Fast counter operations with audit-ready records</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 rounded-md bg-paddy-50 px-3 py-2 text-sm font-medium text-paddy-700">
        <Building2 className="h-4 w-4" /> GST-ready shop system
      </div>
    </header>
  );
}

function Dashboard({ api, setScreen }) {
  const [data, setData] = useState(null);
  useEffect(() => void api.get("/dashboard").then(setData), [api]);
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(([label, value, Icon]) => (
          <Stat key={label} label={label} value={currency.format(value)} Icon={Icon} />
        ))}
      </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

function Products({ api, notify }) {
  const blank = {
    name: "",
    brand: "",
    category: "Fertilizer",
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
  const load = () => api.get(`/products?search=${encodeURIComponent(search)}`).then(setRows);
  useEffect(() => void load(), [search]);
  async function save() {
    editing ? await api.put(`/products/${editing}`, form) : await api.post("/products", form);
    setForm(blank);
    setEditing(null);
    notify("Product saved");
    setTimeout(() => notify(""), 2200);
    load();
  }
  async function remove() {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    await api.delete(`/products/${editing}`);
    setForm(blank);
    setEditing(null);
    notify("Product deleted");
    setTimeout(() => notify(""), 2200);
    load();
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[410px_1fr] gap-6">
      <Panel title={editing ? "Edit Product" : "Add Product"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="flex gap-3 mt-5 w-full">
            <button onClick={save} className="btn flex-1"><Save className="h-5 w-5" /> Save Product</button>
            {editing && (
              <button onClick={remove} className="btn bg-red-600 hover:bg-red-700 flex-1"><Trash2 className="h-5 w-5" /> Delete Product</button>
            )}
          </div>
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
  const [shop, setShop] = useState(defaultShop);
  const [invoice, setInvoice] = useState(null);
  const [form, setForm] = useState({ customer_id: "", customer_name: "", mobile: "", village: "", billing_address: "", gstin: "", amount_paid: 0, payment_method: "Cash", items: [] });
  useEffect(() => {
    api.get("/products").then(setProducts);
    api.get("/customers").then(setCustomers);
    api.get("/shop").then((data) => setShop({ ...defaultShop, ...data }));
  }, [api]);
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
  async function saveInvoice() {
    const payload = { ...form, items: lines.map(({ product, gst, ...line }) => ({ ...line, rate: line.rate, gst_percent: gst })) };
    const saved = await api.post("/sales", payload);
    setInvoice(saved);
    setProducts(await api.get("/products"));
    notify("Invoice generated");
    setTimeout(() => notify(""), 2200);
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
      <Panel title="New GST Invoice">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Existing Farmer" value={form.customer_id} options={["", ...customers.map((c) => c.id)]} labels={{ "": "Walk-in customer", ...Object.fromEntries(customers.map((c) => [c.id, `${c.name} - ${c.mobile}`])) }} onChange={(customer_id) => {
            const c = customers.find((customer) => customer.id === customer_id);
            setForm({ ...form, customer_id, customer_name: c?.name || "", mobile: c?.mobile || "", village: c?.village || "", billing_address: c?.address || "" });
          }} />
          <Input label="Farmer Name" value={form.customer_name} onChange={(customer_name) => setForm({ ...form, customer_name })} />
          <Input label="Mobile" value={form.mobile} onChange={(mobile) => setForm({ ...form, mobile })} />
          <Input label="Village" value={form.village} onChange={(village) => setForm({ ...form, village })} />
          <Input label="Billing Address" value={form.billing_address} onChange={(billing_address) => setForm({ ...form, billing_address })} />
          <Input label="GSTIN Optional" value={form.gstin} onChange={(gstin) => setForm({ ...form, gstin })} />
          <Select label="Payment" value={form.payment_method} options={["Cash", "UPI", "Credit"]} onChange={(payment_method) => setForm({ ...form, payment_method })} />
          <Input label="Amount Paid" type="number" value={form.amount_paid} onChange={(amount_paid) => setForm({ ...form, amount_paid })} />
        </div>
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-base">
            <thead className="bg-paddy-50 text-left">
              <tr><th>Product</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Tax %</th><th>CGST</th><th>SGST</th><th>Total</th></tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td><select className="cell-input min-w-[140px] text-base" value={line.product_id} onChange={(e) => updateLine(index, { product_id: e.target.value })}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                  <td><input className="cell-input w-20 text-base" type="number" value={line.qty} onChange={(e) => updateLine(index, { qty: e.target.value })} /></td>
                  <td><input className="cell-input w-24 text-base" type="number" value={line.rate} onChange={(e) => updateLine(index, { rate: e.target.value })} /></td>
                  <td><input className="cell-input w-24 text-base" type="number" value={line.discount} onChange={(e) => updateLine(index, { discount: e.target.value })} /></td>
                  <td>{line.gst}%</td><td>{currency.format(line.cgst)}</td><td>{currency.format(line.sgst)}</td><td className="font-semibold">{currency.format(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button onClick={addLine} className="btn-secondary flex-1"><Plus className="h-5 w-5" /> Add Item</button>
          <button onClick={saveInvoice} className="btn flex-1"><ReceiptText className="h-5 w-5" /> Generate Invoice</button>
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
  const shopDetails = { ...defaultShop, ...(shop || {}) };

  function shareWhatsApp() {
    let mobile = invoice.mobile;
    if (!mobile && invoice.billing_address) {
      const match = String(invoice.billing_address).match(/\b\d{10}\b/) || String(invoice.billing_address).match(/\b\d{5}\s+\d{5}\b/);
      if (match) {
        mobile = match[0];
      }
    }

    if (!mobile) {
      alert("No customer mobile number found in the invoice or billing address!");
      return;
    }

    let phone = String(mobile).replace(/\D/g, "");
    if (phone.startsWith("0")) {
      phone = phone.slice(1);
    }
    if (phone.length === 10) {
      phone = "91" + phone;
    }

    const itemsText = (invoice.items || [])
      .map((item) => `- ${item.product_name || item.product?.name}: ${item.qty} ${item.unit || 'Bag'} x ₹${item.rate}`)
      .join("\n");

    const message = `*${shopDetails.name}*
------------------------------
*Invoice:* ${invoice.invoice_number}
*Date:* ${invoice.date}
*Customer:* ${invoice.customer_name || "Walk-in"}
------------------------------
*Items:*
${itemsText}
------------------------------
*Subtotal:* ₹${invoice.subtotal}
*CGST/SGST:* ₹${(Number(invoice.cgst || 0) + Number(invoice.sgst || 0)).toFixed(2)}
*Grand Total:* ₹${invoice.grand_total}
*Paid:* ₹${invoice.amount_paid}
*Balance Due:* ₹${invoice.balance_due}
------------------------------
Thank you for shopping with us!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }
  return (
    <Panel title="Invoice Preview" actions={<button onClick={() => window.print()} className="icon-btn" title="Print"><Printer className="h-5 w-5" /></button>}>
      <div id="invoice" className="invoice">
        <div className="invoice-shop-details">
          <p><b>Shop Name:</b> {shopDetails.name}</p>
          <p><b>Legal Name:</b> {shopDetails.legalName}</p>
          <p><b>GSTIN:</b> {shopDetails.gstin}</p>
          <p><b>Phone:</b> {shopDetails.phone}</p>
          {shopDetails.address && (
            <p>
              <b>Shop Address:</b>{" "}
              {String(shopDetails.address).split(/\r?\n/).map((line, index) => (
                <React.Fragment key={line || index}>
                  {index > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </p>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 border-y border-slate-300 py-2 text-base">
          <span>Invoice: <b>{invoice.invoice_number}</b></span>
          <span className="text-right">Date: <b>{invoice.date}</b></span>
          <span>Customer: <b>{invoice.customer_name || "Walk-in"}</b></span>
          <span className="text-right">Mobile: <b>{invoice.mobile || "-"}</b></span>
          <span>Village: <b>{invoice.village || "-"}</b></span>
          <span className="text-right">GSTIN: <b>{invoice.gstin || "-"}</b></span>
        </div>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full text-base">
            <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Total</th></tr></thead>
            <tbody>{(invoice.items || []).map((item, i) => <tr key={i}><td>{item.product_name || item.product?.name}</td><td>{item.qty}</td><td>{currency.format(item.rate)}</td><td>{item.gst_percent || item.gst}%</td><td>{currency.format(item.total)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="mt-4 ml-auto w-56 space-y-1 text-base">
          <Row label="Subtotal" value={currency.format(invoice.subtotal || 0)} />
          <Row label="CGST" value={currency.format(invoice.cgst || 0)} />
          <Row label="SGST" value={currency.format(invoice.sgst || 0)} />
          <Row label="Grand Total" value={currency.format(invoice.grand_total || 0)} strong />
          <Row label="Paid" value={currency.format(invoice.amount_paid || 0)} />
          <Row label="Balance" value={currency.format(invoice.balance_due || 0)} strong />
        </div>
      </div>
      <div className="mt-5 flex gap-3 w-full">
        <button onClick={() => window.print()} className="btn flex-1"><Printer className="h-5 w-5" /> Print / PDF</button>
        <button onClick={shareWhatsApp} className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex-1"><Share2 className="h-5 w-5" /> WhatsApp</button>
      </div>
    </Panel>
  );
}

function Purchases({ api, notify }) {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ supplier_id: "", invoice_number: "", purchase_date: new Date().toISOString().slice(0, 10), items: [] });
  useEffect(() => { api.get("/products").then(setProducts); api.get("/suppliers").then(setSuppliers); api.get("/purchases").then(setRows); }, [api]);
  const add = () => setForm({ ...form, items: [...form.items, { product_id: products[0]?.id || "", qty: 1, purchase_rate: 0, gst: 0, total_amount: 0 }] });
  async function save() {
    await api.post("/purchases", form);
    setEditing(null);
    setForm({ supplier_id: "", invoice_number: "", purchase_date: new Date().toISOString().slice(0, 10), items: [] });
    notify("Purchase added and stock updated");
    setTimeout(() => notify(""), 2200);
    api.get("/products").then(setProducts);
    api.get("/purchases").then(setRows);
  }
  async function remove() {
    if (!window.confirm("Are you sure you want to delete this purchase?")) return;
    await api.delete(`/purchases/${editing}`);
    setEditing(null);
    setForm({ supplier_id: "", invoice_number: "", purchase_date: new Date().toISOString().slice(0, 10), items: [] });
    notify("Purchase deleted");
    setTimeout(() => notify(""), 2200);
    api.get("/products").then(setProducts);
    api.get("/purchases").then(setRows);
  }
  return (
    <div className="space-y-6">
      <Panel title="Purchase Entry">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Supplier" value={form.supplier_id} options={["", ...suppliers.map((s) => s.id)]} labels={{ "": "Select supplier", ...Object.fromEntries(suppliers.map((s) => [s.id, s.name])) }} onChange={(supplier_id) => setForm({ ...form, supplier_id, supplier_name: suppliers.find((s) => s.id === supplier_id)?.name || "" })} />
          <Input label="Supplier Invoice No." value={form.invoice_number} onChange={(invoice_number) => setForm({ ...form, invoice_number })} />
          <Input label="Purchase Date" type="date" value={form.purchase_date} onChange={(purchase_date) => setForm({ ...form, purchase_date })} />
        </div>
        <DataEntryLines products={products} items={form.items} setItems={(items) => setForm({ ...form, items })} />
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button onClick={add} className="btn-secondary flex-1"><Plus className="h-5 w-5" /> Add Product</button>
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <button onClick={save} className="btn flex-1"><Save className="h-5 w-5" /> Save Purchase</button>
              {editing && (
                <button onClick={remove} className="btn bg-red-600 hover:bg-red-700 flex-1"><Trash2 className="h-5 w-5" /> Delete Purchase</button>
              )}
            </div>
          </div>
      </Panel>
      <Panel title="Purchase History">
          <DataTable
            rows={rows}
            columns={["invoice_number", "supplier_name", "purchase_date", "total_amount", "created_by"]}
            actions={(row) => (
              <button className="link" onClick={() => { setEditing(row.id); setForm({ supplier_id: row.supplier_id || "", invoice_number: row.invoice_number, purchase_date: String(row.purchase_date).slice(0, 10), items: [] }); }}>Select</button>
            )}
          />
        </Panel>
    </div>
  );
}

function DataEntryLines({ products, items, setItems }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-base">
        <thead className="bg-paddy-50"><tr><th>Product</th><th>Qty</th><th>Purchase Rate</th><th>GST Amount</th><th>Total</th></tr></thead>
        <tbody>{items.map((item, index) => <tr key={index}>
          <td><select className="cell-input min-w-[140px] text-base" value={item.product_id} onChange={(e) => patch(index, { product_id: e.target.value })}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
          {["qty", "purchase_rate", "gst", "total_amount"].map((key) => <td key={key}><input className="cell-input w-32 text-base" type="number" value={item[key]} onChange={(e) => patch(index, { [key]: e.target.value })} /></td>)}
        </tr>)}</tbody>
      </table>
    </div>
  );
  function patch(index, change) {
    setItems(items.map((item, i) => i === index ? { ...item, ...change } : item));
  }
}

function Customers({ api, notify }) {
  return <CrudPage api={api} resource="customers" title="Farmer Records" notify={notify} blank={{ name: "", mobile: "", village: "", address: "", aadhaar: "", credit_amount: 0, pending_balance: 0 }} columns={["name", "mobile", "village", "address", "pending_balance", "credit_amount"]} />;
}

function Suppliers({ api, notify }) {
  return <CrudPage api={api} resource="suppliers" title="Supplier Records" notify={notify} blank={{ name: "", contact_person: "", mobile: "", address: "", gstin: "", outstanding_amount: 0 }} columns={["name", "contact_person", "mobile", "gstin", "address", "outstanding_amount"]} />;
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
  async function remove() {
    if (!window.confirm(`Are you sure you want to delete this ${resource.slice(0, -1)}?`)) return;
    await api.delete(`/${resource}/${editing}`);
    setEditing(null);
    setForm(blank);
    notify(`${title} deleted`);
    setTimeout(() => notify(""), 2200);
    load();
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <Panel title={editing ? `Edit ${title}` : `Add ${title}`}>
        {Object.keys(blank).map((key) => <Input key={key} label={labelize(key)} type={typeof blank[key] === "number" ? "number" : "text"} value={form[key] ?? ""} onChange={(value) => setForm({ ...form, [key]: value })} />)}
        <div className="flex flex-col sm:flex-row gap-3 mt-5 w-full">
            <button onClick={save} className="btn flex-1"><Save className="h-5 w-5" /> Save</button>
            {editing && (
              <button onClick={remove} className="btn bg-red-600 hover:bg-red-700 flex-1"><Trash2 className="h-5 w-5" /> Delete</button>
            )}
          </div>
      </Panel>
      <Panel title={title} actions={<SearchBox value={search} setValue={setSearch} />}>
        <DataTable rows={rows} columns={columns} actions={(row) => <button className="link" onClick={() => { setEditing(row.id); setForm(row); }}>Edit</button>} />
      </Panel>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[260px_180px_180px_auto_auto_auto] items-end gap-3">
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
  return <div className="rounded-md border border-paddy-100 bg-white p-4 shadow-soft"><Icon className="h-6 w-6 text-paddy-600" /><p className="mt-4 text-base text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

function Panel({ title, actions, children }) {
  return <section className="rounded-md border border-paddy-100 bg-white p-5 shadow-soft"><div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">{title}</h2>{actions}</div>{children}</section>;
}

function DataTable({ rows, columns, actions, empty = "No records found." }) {
  if (!rows?.length) return <p className="rounded-md bg-slate-50 p-5 text-base text-slate-500">{empty}</p>;
  return <div className="max-h-[560px] overflow-auto rounded-md border border-slate-200"><table className="w-full text-base"><thead className="sticky top-0 bg-paddy-50 text-left"><tr>{columns.map((c) => <th key={c}>{labelize(c)}</th>)}{actions && <th>Action</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id || JSON.stringify(row)}>{columns.map((c) => <td key={c}>{format(row[c])}</td>)}{actions && <td>{actions(row)}</td>}</tr>)}</tbody></table></div>;
}

function Input({ label, value, onChange, type = "text", ...props }) {
  return <label className="mt-3 block text-sm font-medium text-slate-600">{label}<input className="mt-1 h-12 w-full rounded-md border border-slate-200 px-3 text-slate-900 outline-none focus:border-paddy-500 text-base" type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} /></label>;
}

function Select({ label, value, options, labels = {}, onChange }) {
  return <label className="mt-3 block text-sm font-medium text-slate-600">{label}<select className="mt-1 h-12 w-full rounded-md border border-slate-200 px-3 text-slate-900 outline-none focus:border-paddy-500 text-base" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}</select></label>;
}

function SearchBox({ value, setValue }) {
  return <div className="flex h-12 items-center gap-2 rounded-md border border-slate-200 px-3"><Search className="h-5 w-5 text-slate-400" /><input className="outline-none text-base" placeholder="Search" value={value} onChange={(e) => setValue(e.target.value)} /></div>;
}

function Mini({ label, value }) {
  return <div className="rounded-md bg-paddy-50 p-4"><p className="text-base text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}
