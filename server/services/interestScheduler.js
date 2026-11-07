import cron from "node-cron";

/**
 * Monthly Interest Calculation Engine & Background Scheduler
 * Supports:
 * - Simple Interest: Pending Principal * (Monthly Rate / 100)
 * - Monthly Compound Interest: (Pending Principal + Accumulated Interest) * (Monthly Rate / 100)
 * - Configurable monthly interest rate (%)
 * - Grace period support
 * - Node-cron scheduled monthly execution in Asia/Kolkata timezone
 * - Idempotency per billing cycle (customer_id + year_month)
 */

export async function calculateMonthlyInterest(store, options = {}) {
  const force = Boolean(options.force);
  const cycleDate = options.date ? new Date(options.date) : new Date();
  const yearMonth = `${cycleDate.getFullYear()}-${String(cycleDate.getMonth() + 1).padStart(2, "0")}`;
  const todayStr = cycleDate.toISOString().slice(0, 10);

  const settings = typeof store.getCreditSettings === "function" 
    ? await store.getCreditSettings()
    : { interest_enabled: true, monthly_interest_rate: 2.0, calculation_type: "simple", grace_period_days: 0 };

  if (!settings.interest_enabled && !force) {
    return {
      success: true,
      applied_count: 0,
      total_interest_applied: 0,
      message: "Monthly interest calculation is currently disabled in shop settings."
    };
  }

  const rate = Number(settings.monthly_interest_rate || 2.0);
  const calcType = (settings.calculation_type || "simple").toLowerCase();
  const graceDays = Number(settings.grace_period_days || 0);

  const customers = typeof store.list === "function" ? await store.list("customers") : (store.db?.customers || []);
  const existingHistory = typeof store.listCustomerInterestHistory === "function"
    ? await store.listCustomerInterestHistory()
    : (store.db?.interest_history || []);

  const results = [];
  let totalInterest = 0;

  for (const customer of customers) {
    const pendingBalance = Number(customer.pending_balance || customer.credit_amount || 0);
    if (pendingBalance <= 0) continue;

    // Idempotency check: Don't charge twice in the same billing cycle for the same customer
    const alreadyApplied = existingHistory.some(
      (h) => h.customer_id === customer.id && h.year_month === yearMonth
    );
    if (alreadyApplied && !force) {
      continue;
    }

    // Grace period check: verify if the oldest open credit purchase exceeds grace period
    if (graceDays > 0 && typeof store.getCustomerOldestPendingSaleDate === "function") {
      const oldestDate = await store.getCustomerOldestPendingSaleDate(customer.id);
      if (oldestDate) {
        const daysOld = Math.floor((cycleDate.getTime() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOld < graceDays) {
          continue; // within grace period
        }
      }
    }

    // Calculate accumulated previous interest from ledger
    const customerPriorHistory = existingHistory.filter((h) => h.customer_id === customer.id);
    const accumulatedInterest = customerPriorHistory.reduce(
      (sum, h) => sum + Number(h.interest_amount || 0),
      0
    );

    const principal = Math.max(0, pendingBalance - (calcType === "simple" ? accumulatedInterest : 0));
    let interestAmount = 0;

    if (calcType === "compound") {
      // Compound on entire outstanding balance (principal + accumulated interest)
      interestAmount = Math.round((pendingBalance * (rate / 100)) * 100) / 100;
    } else {
      // Simple on principal only
      const basePrincipal = principal > 0 ? principal : pendingBalance;
      interestAmount = Math.round((basePrincipal * (rate / 100)) * 100) / 100;
    }

    if (interestAmount <= 0) continue;

    const newTotalBalance = Math.round((pendingBalance + interestAmount) * 100) / 100;

    const record = {
      customer_id: customer.id,
      customer_name: customer.name,
      year_month: yearMonth,
      calculation_date: todayStr,
      principal_balance: principal > 0 ? principal : pendingBalance,
      monthly_interest_rate: rate,
      calculation_type: calcType,
      interest_amount: interestAmount,
      accumulated_interest: Math.round((accumulatedInterest + interestAmount) * 100) / 100,
      total_balance_after: newTotalBalance,
      status: "APPLIED",
      note: `Monthly interest (${rate}% ${calcType}) for ${yearMonth}`
    };

    if (typeof store.recordInterestEntry === "function") {
      await store.recordInterestEntry(record);
    } else if (store.db) {
      store.db.interest_history = store.db.interest_history || [];
      const entryId = crypto.randomUUID ? crypto.randomUUID() : `int_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      store.db.interest_history.push({ id: entryId, ...record, created_at: new Date().toISOString() });
      customer.pending_balance = newTotalBalance;
      customer.credit_amount = newTotalBalance;
      if (typeof store.persist === "function") await store.persist();
    }

    totalInterest = Math.round((totalInterest + interestAmount) * 100) / 100;
    results.push({
      customer_id: customer.id,
      customer_name: customer.name,
      interest_amount: interestAmount,
      new_total: newTotalBalance
    });
  }

  return {
    success: true,
    billing_cycle: yearMonth,
    applied_count: results.length,
    total_interest_applied: totalInterest,
    rate_percent: rate,
    calculation_type: calcType,
    details: results
  };
}

/**
 * Initializes and starts the background node-cron scheduler for monthly interest
 */
export function startInterestScheduler(store) {
  // Midnight on the 1st of every month in Asia/Kolkata (Indian Standard Time)
  const cronExpression = process.env.INTEREST_CRON_EXPRESSION || "0 0 1 * *";

  console.log(`[Interest Scheduler] Registered monthly cron task '${cronExpression}' (Timezone: Asia/Kolkata)`);

  const task = cron.schedule(
    cronExpression,
    async () => {
      console.log(`[Interest Scheduler] Triggering automatic monthly interest calculation for ${new Date().toISOString()}`);
      try {
        const result = await calculateMonthlyInterest(store);
        console.log(`[Interest Scheduler] Monthly calculation complete: ${result.applied_count} accounts charged, Total Interest: ₹${result.total_interest_applied}`);
      } catch (err) {
        console.error("[Interest Scheduler Error]", err);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata"
    }
  );

  return task;
}
