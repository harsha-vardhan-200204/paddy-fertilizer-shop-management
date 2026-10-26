import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const securityPath = path.resolve(__dirname, "../data/system_security.json");
const mlStorePath = path.resolve(__dirname, "../data/ml_store.json");

const DEFAULT_MASTER_PASSWORD = "RESET@AGRO2026";

export class SystemSecurityService {
  constructor() {
    this.cachedState = null;
  }

  async loadSecurityState() {
    if (this.cachedState) return this.cachedState;
    try {
      await fs.mkdir(path.dirname(securityPath), { recursive: true });
      const raw = await fs.readFile(securityPath, "utf8");
      this.cachedState = JSON.parse(raw);
    } catch (_err) {
      const defaultHash = await bcrypt.hash(DEFAULT_MASTER_PASSWORD, 10);
      this.cachedState = {
        master_password_hash: defaultHash,
        updated_at: new Date().toISOString(),
        is_custom_password: false
      };
      await this.saveSecurityState(this.cachedState);
    }
    return this.cachedState;
  }

  async saveSecurityState(state) {
    this.cachedState = state;
    try {
      await fs.writeFile(securityPath, JSON.stringify(state, null, 2), "utf8");
    } catch (err) {
      console.error("[SystemSecurity] Error saving security state:", err);
    }
    return this.cachedState;
  }

  /**
   * Verify password against Master Reset Password OR Admin account password
   * GUIDE EXPLANATION: Authenticates security reset requests using master key "RESET@AGRO2026" or Admin password.
   */
  async verifyMasterPassword(submittedPassword, adminUser, store) {
    if (!submittedPassword) return false;
    const state = await this.loadSecurityState();

    // Step 1: Check submitted password against encrypted Master Reset Password hash
    const matchMaster = await bcrypt.compare(submittedPassword, state.master_password_hash);
    if (matchMaster) return true; // Authorized via Master Password

    // Step 2: Fallback — Check against Admin user account login password
    if (adminUser?.password_hash && store?.verifyPassword) {
      const matchAdmin = await store.verifyPassword(submittedPassword, adminUser.password_hash);
      if (matchAdmin) return true; // Authorized via Admin Password
    }

    return false; // Authentication failed
  }

  /**
   * Update Master Reset Password
   */
  async updateMasterPassword(currentPassword, newPassword, adminUser, store) {
    const isCurrentValid = await this.verifyMasterPassword(currentPassword, adminUser, store);
    if (!isCurrentValid) {
      throw new Error("Current master password or admin password is invalid.");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = {
      master_password_hash: newHash,
      updated_at: new Date().toISOString(),
      is_custom_password: true
    };
    await this.saveSecurityState(updated);
    return { success: true, message: "Master security password updated successfully." };
  }

  /**
   * Fetch current system summary stats for reset dashboard
   */
  async getSystemStats(store) {
    const [sales, purchases, products, customers, suppliers, payments] = await Promise.all([
      store.list("sales"),
      store.list("purchases"),
      store.list("products"),
      store.list("customers"),
      store.list("suppliers"),
      store.list("payments")
    ]);

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.grand_total || 0), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
    const totalStockQty = products.reduce((sum, p) => sum + Number(p.current_stock || 0), 0);
    const totalStockValue = products.reduce((sum, p) => sum + (Number(p.current_stock || 0) * Number(p.purchase_price || 0)), 0);
    const totalPendingDues = customers.reduce((sum, c) => sum + Number(c.pending_balance || 0), 0);

    const state = await this.loadSecurityState();

    return {
      salesCount: sales.length,
      salesRevenue: Math.round(totalRevenue),
      purchasesCount: purchases.length,
      purchasesAmount: Math.round(totalPurchases),
      productsCount: products.length,
      totalStockQty: Math.round(totalStockQty),
      totalStockValue: Math.round(totalStockValue),
      customersCount: customers.length,
      pendingDues: Math.round(totalPendingDues),
      suppliersCount: suppliers.length,
      paymentsCount: payments.length,
      isCustomPassword: state.is_custom_password,
      lastPasswordUpdate: state.updated_at
    };
  }

  /**
   * Reset business operations to zero
   * GUIDE EXPLANATION: Safely resets store transaction data to zero while preserving master catalog definitions.
   */
  async resetBusiness(store, scope = "all", preserveCatalog = true) {
    console.log(`[SystemSecurity] Initiating reset with scope: "${scope}", preserveCatalog: ${preserveCatalog}`);

    // Step 1: Execute transactional database purge depending on scope (all, purchases, sales)
    if (scope === "all") {
      if (typeof store.resetAll === "function") {
        await store.resetAll(preserveCatalog);
      } else {
        await this.fallbackFileReset(store, "all", preserveCatalog);
      }
    } else if (scope === "purchases") {
      if (typeof store.resetPurchases === "function") {
        await store.resetPurchases();
      } else {
        await this.fallbackFileReset(store, "purchases");
      }
    } else if (scope === "sales") {
      if (typeof store.resetSales === "function") {
        await store.resetSales();
      } else {
        await this.fallbackFileReset(store, "sales");
      }
    }

    // Reset ML Predictions store to clean state
    try {
      const cleanPredictions = {
        config: {
          retrainIntervalHours: 24,
          minNewTransactionsToRetrain: 5,
          riskDelayThresholdDays: 15,
          lastRetrained: new Date().toISOString(),
          totalSalesCountAtTraining: 0
        },
        predictions: {
          sales30Days: 0,
          revenueForecast: { daily: 0, weekly: 0, monthly: 0, profit: 0 },
          productDemand: [],
          creditRisks: [],
          insights: ["System has been reset to zero. Record new sales and purchases to generate predictive insights."],
          metrics: { salesMAE: 0, demandMAE: 0, riskAccuracy: 1.0 }
        }
      };
      await fs.writeFile(mlStorePath, JSON.stringify(cleanPredictions, null, 2), "utf8");
    } catch (err) {
      console.error("[SystemSecurity] Error resetting ML store:", err);
    }

    return {
      success: true,
      scope,
      message: `Business data for scope '${scope}' has been successfully reset to zero.`
    };
  }

  async fallbackFileReset(store, scope, preserveCatalog = true) {
    if (store.kind !== "local-file") return;

    if (scope === "all") {
      store.db.sales = [];
      store.db.sale_items = [];
      store.db.purchases = [];
      store.db.purchase_items = [];
      store.db.payments = [];
      store.db.stock_logs = [];

      // Reset customer dues
      for (const cust of store.db.customers || []) {
        cust.pending_balance = 0;
        cust.credit_amount = 0;
      }

      // Reset supplier balances
      for (const sup of store.db.suppliers || []) {
        sup.outstanding_amount = 0;
      }

      // Reset products stock to 0 or clear
      if (preserveCatalog) {
        for (const prod of store.db.products || []) {
          prod.current_stock = 0;
        }
      } else {
        store.db.products = [];
      }
    } else if (scope === "purchases") {
      store.db.purchases = [];
      store.db.purchase_items = [];
      for (const prod of store.db.products || []) {
        prod.current_stock = 0;
      }
      for (const sup of store.db.suppliers || []) {
        sup.outstanding_amount = 0;
      }
    } else if (scope === "sales") {
      store.db.sales = [];
      store.db.sale_items = [];
      store.db.payments = [];
      for (const cust of store.db.customers || []) {
        cust.pending_balance = 0;
        cust.credit_amount = 0;
      }
    }

    await store.persist();
  }
}

export const systemSecurity = new SystemSecurityService();
