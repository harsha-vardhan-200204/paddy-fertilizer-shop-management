import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  KeyRound,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Database,
  Lock,
  RefreshCw,
  ArrowRight,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  Building2,
  FileSpreadsheet
} from "lucide-react";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export default function BusinessReset({ api, notify, setScreen, user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Reset Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState("all");
  const [preserveCatalog, setPreserveCatalog] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Change Password Form State
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdError, setPwdError] = useState("");

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/system/stats");
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load system statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const openResetModal = (scope) => {
    setSelectedScope(scope);
    setPassword("");
    setConfirmPhrase("");
    setModalError("");
    setModalOpen(true);
  };

  const handleExecuteReset = async (e) => {
    e.preventDefault();
    if (!password) {
      setModalError("Please enter your Master Security Password or Admin Password.");
      return;
    }
    if (confirmPhrase.trim().toUpperCase() !== "RESET") {
      setModalError("Please type 'RESET' in the confirmation box to verify intent.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      
      let res;
      if (selectedScope === "seed") {
        res = await api.post("/system/seed-demo", { password });
      } else {
        res = await api.post("/system/reset", {
          password,
          scope: selectedScope,
          preserveCatalog
        });
      }

      setModalOpen(false);
      notify(res.message || "Business reset completed successfully.");
      await loadStats();
    } catch (err) {
      setModalError(err.message || "Reset execution failed. Please verify password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdSuccess("");
    setPwdError("");

    if (!pwdForm.currentPassword) {
      setPwdError("Please enter your current password.");
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters long.");
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError("New password and confirm password do not match.");
      return;
    }

    try {
      setPwdLoading(true);
      const res = await api.post("/system/master-password", {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setPwdSuccess(res.message || "Master reset password updated successfully.");
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      loadStats();
    } catch (err) {
      setPwdError(err.message || "Failed to update master password.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900 via-slate-900 to-amber-950 p-6 text-white shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300 border border-red-500/30">
              <ShieldAlert className="h-4 w-4" /> Owner Security & Business Reset Module
            </div>
            <h1 className="text-2xl font-bold tracking-tight">System Reset & Ledger Zero Control</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Safely reset operational sales, clear inventory stock counts to zero, adjust past purchases,
              or restore demo data. Protected by Master Security Password verification.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadStats}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all border border-white/15"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Counts
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Database Snapshot Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Sales</span>
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{stats ? stats.salesCount : "..."}</p>
          <p className="text-xs text-slate-500 mt-1">{stats ? currency.format(stats.salesRevenue) : "..."} Total</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Purchases</span>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{stats ? stats.purchasesCount : "..."}</p>
          <p className="text-xs text-slate-500 mt-1">{stats ? currency.format(stats.purchasesAmount) : "..."} Total</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Stock Units</span>
            <Database className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{stats ? stats.totalStockQty : "..."}</p>
          <p className="text-xs text-slate-500 mt-1">{stats ? currency.format(stats.totalStockValue) : "..."} Val</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Products</span>
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{stats ? stats.productsCount : "..."}</p>
          <p className="text-xs text-slate-500 mt-1">Catalog Items</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Farmer Dues</span>
            <Users className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{stats ? currency.format(stats.pendingDues) : "..."}</p>
          <p className="text-xs text-slate-500 mt-1">{stats ? `${stats.customersCount} Farmers` : "..."}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Master Key</span>
            <KeyRound className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {stats?.isCustomPassword ? "Custom Key" : "Default Key"}
          </p>
          <p className="text-xs text-slate-500 mt-1">{stats?.isCustomPassword ? "Active" : "RESET@AGRO2026"}</p>
        </div>
      </div>

      {/* Main Grid: Reset Actions & Security Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reset Actions (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-red-100 text-red-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Reset Business Operations</h2>
                <p className="text-xs text-slate-500">Choose a reset scope. All actions require the Master Security Password.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Option 1: Complete Reset to Zero */}
              <div className="rounded-xl border-2 border-red-100 bg-red-50/40 p-5 hover:border-red-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-950 text-base">Complete Business Reset to Zero</span>
                    <span className="rounded bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Clean Slate</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Wipes all sales, purchases, customer ledger dues, supplier balances, payments, and stock audit logs.
                    Zeroes out all current stock counts to 0. (Product catalog and farmer contacts remain intact for immediate fresh billing).
                  </p>
                </div>
                <button
                  onClick={() => openResetModal("all")}
                  className="shrink-0 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-all"
                >
                  <RotateCcw className="h-4 w-4" /> Reset All to Zero
                </button>
              </div>

              {/* Option 2: Purchases & Stock Reset */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 hover:border-amber-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-950 text-base">Reset Purchases & Inventory Stock Only</span>
                    <span className="rounded bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Stock Zero</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clears all past supplier purchases, inward records, supplier dues, and resets all product stock to 0.
                    Customer sales and customer ledger dues are preserved.
                  </p>
                </div>
                <button
                  onClick={() => openResetModal("purchases")}
                  className="shrink-0 flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-all"
                >
                  <RotateCcw className="h-4 w-4" /> Reset Purchases Only
                </button>
              </div>

              {/* Option 3: Sales & Ledger Reset */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-base">Reset Sales & Customer Ledgers Only</span>
                    <span className="rounded bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Sales Zero</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Wipes all customer sales invoices, payment history, and clears all farmer pending credit dues to 0.
                    Purchase records and stock counts remain untouched.
                  </p>
                </div>
                <button
                  onClick={() => openResetModal("sales")}
                  className="shrink-0 flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 transition-all"
                >
                  <RotateCcw className="h-4 w-4" /> Reset Sales Only
                </button>
              </div>

              {/* Option 4: Re-seed Demo Data */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-950 text-base">Re-seed Realistic Demo Data</span>
                    <span className="rounded bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Demo Restore</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Restores the initial standard agro-agency demo dataset including sample paddy fertilizers,
                    suppliers, farmer records, and sample sales for demonstrations and testing.
                  </p>
                </div>
                <button
                  onClick={() => openResetModal("seed")}
                  className="shrink-0 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  <RefreshCw className="h-4 w-4" /> Restore Demo Data
                </button>
              </div>
            </div>

            {/* Owner Purchase Edit Notice */}
            <div className="mt-6 rounded-lg bg-paddy-50 border border-paddy-200 p-4 text-xs text-paddy-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-paddy-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-sm">Purchase Modification Privilege:</span>
                <p className="mt-0.5 text-paddy-800">
                  As the shop owner/admin, you can also modify or delete past purchase records individually with automatic
                  stock balance recalibration. Visit the{" "}
                  <button onClick={() => setScreen("purchases")} className="font-bold underline text-paddy-900 hover:text-black">
                    Purchases Screen
                  </button>{" "}
                  to edit existing supplier invoices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Master Password Management (1 Column) */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Master Password</h2>
                <p className="text-xs text-slate-500">Security key for reset operations</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3.5 border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Default Master Password:</span>
                <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">RESET@AGRO2026</code>
              </div>
              <p className="text-[11px] text-slate-500">
                (Note: Your Admin account password also works as a valid verification fallback).
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Change Master Password</h3>
              
              {pwdSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{pwdSuccess}</span>
                </div>
              )}
              {pwdError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{pwdError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600">Current Security / Admin Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-paddy-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">New Master Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-paddy-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-type new password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-paddy-500"
                />
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {pwdLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Update Master Password
              </button>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Navigation</h3>
            <button
              onClick={() => setScreen("purchases")}
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-paddy-600" />
                <span className="text-xs font-semibold text-slate-800">Edit / Add Purchases</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => setScreen("billing")}
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4 text-paddy-600" />
                <span className="text-xs font-semibold text-slate-800">Sales Counter (Billing)</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => setScreen("dashboard")}
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-paddy-600" />
                <span className="text-xs font-semibold text-slate-800">Return to Dashboard</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="rounded-full bg-red-100 p-2.5 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedScope === "seed" ? "Restore Demo Data Confirmation" : "Security Reset Verification"}
                </h3>
                <p className="text-xs text-slate-500">
                  Scope: <span className="font-semibold uppercase text-red-600">{selectedScope}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-800 leading-relaxed">
                {selectedScope === "all" && (
                  <p>
                    <strong>Warning:</strong> This will erase all sales invoices, purchases, payments, and stock audit logs.
                    Current stock counts will be reset to 0. Farmer credit balances and supplier dues will be cleared.
                  </p>
                )}
                {selectedScope === "purchases" && (
                  <p>
                    <strong>Warning:</strong> This will delete all purchase records, supplier inward logs, and reset all product current stock to 0.
                  </p>
                )}
                {selectedScope === "sales" && (
                  <p>
                    <strong>Warning:</strong> This will delete all sales invoices, payments, and reset farmer credit balances to 0.
                  </p>
                )}
                {selectedScope === "seed" && (
                  <p>
                    <strong>Notice:</strong> This will replace the database with initial standard paddy fertilizers, suppliers, customers, and sample invoices.
                  </p>
                )}
              </div>

              {selectedScope === "all" && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveCatalog}
                    onChange={(e) => setPreserveCatalog(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>Preserve product catalog names & customer directories (only zero out stock & balances)</span>
                </label>
              )}

              {modalError && (
                <div className="rounded-lg bg-red-100 p-2.5 text-xs text-red-800 font-medium">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleExecuteReset} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Master Security Password / Admin Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter RESET@AGRO2026 or your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Type <span className="text-red-600 font-mono font-bold">RESET</span> to confirm <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RESET"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-all"
                  >
                    {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                    Confirm & Execute
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
