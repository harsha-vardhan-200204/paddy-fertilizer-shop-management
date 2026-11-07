import cron from "node-cron";
import { sendExpiryAlertEmail, sendExpiryAlertWhatsApp, SHOP_SENDER_EMAIL, SHOP_SENDER_WHATSAPP } from "./digitalDelivery.js";

/**
 * Product Expiry Monitoring Engine & Background Daily Scheduler
 * Tracks batch-level expiry dates and dispatches alerts at configured intervals:
 * - 90 Days before expiry
 * - 60 Days before expiry
 * - 30 Days before expiry
 * - 15 Days before expiry
 * - 7 Days before expiry
 * - On / After Expiry (Quarantined)
 *
 * Daily Cron in Asia/Kolkata timezone (8:00 AM)
 * Duplicate alert prevention via expiry_alert_history ledger
 */

export async function checkProductExpiryAlerts(store, options = {}) {
  const force = Boolean(options.force);
  const now = options.date ? new Date(options.date) : new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const settings = typeof store.getCreditSettings === "function"
    ? await store.getCreditSettings()
    : {
        expiry_alerts_enabled: true,
        alert_periods: "90,60,30,15,7,0",
        admin_notification_email: SHOP_SENDER_EMAIL,
        admin_notification_whatsapp: SHOP_SENDER_WHATSAPP,
        admin_expiry_email_enabled: true,
        admin_expiry_whatsapp_enabled: true
      };

  if (settings.expiry_alerts_enabled === false && !force) {
    return {
      success: true,
      alerts_dispatched: 0,
      message: "Product expiry alerts are currently disabled in shop settings."
    };
  }

  const configuredIntervals = String(settings.alert_periods || "90,60,30,15,7,0")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a); // e.g. [90, 60, 30, 15, 7, 0]

  const ownerEmail = settings.admin_notification_email || SHOP_SENDER_EMAIL;
  const ownerWhatsApp = settings.admin_notification_whatsapp || SHOP_SENDER_WHATSAPP;

  // Retrieve batches
  let batches = [];
  if (typeof store.listBatches === "function") {
    batches = await store.listBatches();
  } else if (store.db?.product_batches) {
    batches = store.db.product_batches;
  }

  // Fallback: If no batch table rows exist, inspect products table for batch numbers & expiry
  if (batches.length === 0 && store.db?.products) {
    batches = store.db.products
      .filter((p) => p.expiry_date && p.batch_number)
      .map((p) => ({
        id: p.id,
        product_id: p.id,
        product_name: p.name,
        batch_number: p.batch_number,
        expiry_date: p.expiry_date,
        current_stock: Number(p.current_stock || 0),
        unit: p.unit || "Bag",
        supplier_name: p.supplier_name || "Agro Wholesale Depot"
      }));
  }

  // Existing alert history
  let alertHistory = [];
  if (typeof store.listExpiryAlertHistory === "function") {
    alertHistory = await store.listExpiryAlertHistory();
  } else if (store.db?.expiry_alert_history) {
    alertHistory = store.db.expiry_alert_history;
  }

  const alerts = [];

  for (const batch of batches) {
    // Only check batches that have active stock remaining
    const stock = Number(batch.current_stock || 0);
    if (stock <= 0) continue;

    if (!batch.expiry_date) continue;

    const expDate = new Date(batch.expiry_date);
    const msDiff = expDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    // Determine matching alert interval
    let matchedInterval = null;
    for (const interval of configuredIntervals) {
      if (daysRemaining <= interval) {
        matchedInterval = interval;
        break;
      }
    }

    if (matchedInterval === null) continue; // Not within any alert threshold yet (>90 days)

    // Check duplicate prevention: has this batch already triggered an alert for this interval?
    const alreadyAlerted = alertHistory.some(
      (a) => String(a.batch_id) === String(batch.id || batch.batch_number) && Number(a.alert_period) === matchedInterval
    );

    if (alreadyAlerted && !force) {
      continue;
    }

    // Dispatch Email Alert to shop owner
    let emailStatus = "SKIPPED";
    if (settings.admin_expiry_email_enabled !== false) {
      const emailRes = await sendExpiryAlertEmail({
        batch,
        daysRemaining,
        recipientEmail: ownerEmail
      });
      emailStatus = emailRes.status;
    }

    // Dispatch WhatsApp Alert to shop owner
    let waStatus = "SKIPPED";
    if (settings.admin_expiry_whatsapp_enabled !== false) {
      const waRes = await sendExpiryAlertWhatsApp({
        batch,
        daysRemaining,
        recipientPhone: ownerWhatsApp
      });
      waStatus = waRes.status;
    }

    // Record alert in history ledger
    const alertRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      batch_id: String(batch.id || batch.batch_number),
      product_name: batch.product_name,
      batch_number: batch.batch_number,
      alert_period: matchedInterval,
      recipient_email: ownerEmail,
      recipient_whatsapp: ownerWhatsApp,
      email_status: emailStatus,
      whatsapp_status: waStatus,
      days_remaining: daysRemaining,
      expiry_date: batch.expiry_date,
      sent_at: new Date().toISOString()
    };

    if (typeof store.recordExpiryAlert === "function") {
      await store.recordExpiryAlert(alertRecord);
    } else if (store.db) {
      store.db.expiry_alert_history = store.db.expiry_alert_history || [];
      store.db.expiry_alert_history.push(alertRecord);
      if (typeof store.persist === "function") await store.persist();
    }

    alerts.push({
      batch_id: batch.id,
      product: batch.product_name,
      batch_number: batch.batch_number,
      days_remaining: daysRemaining,
      alert_period: matchedInterval,
      email_status: emailStatus,
      whatsapp_status: waStatus
    });
  }

  return {
    success: true,
    alerts_dispatched: alerts.length,
    date: todayStr,
    details: alerts
  };
}

/**
 * Initializes and starts the background daily node-cron scheduler for expiry monitoring
 */
export function startExpiryScheduler(store) {
  // Run daily at 8:00 AM Indian Standard Time (Asia/Kolkata)
  const cronExpression = process.env.EXPIRY_CRON_EXPRESSION || "0 8 * * *";

  console.log(`[Expiry Scheduler] Registered daily cron task '${cronExpression}' (Timezone: Asia/Kolkata)`);

  const task = cron.schedule(
    cronExpression,
    async () => {
      console.log(`[Expiry Scheduler] Scanning inventory for expiring/expired product batches...`);
      try {
        const result = await checkProductExpiryAlerts(store);
        console.log(`[Expiry Scheduler] Scan completed: ${result.alerts_dispatched} alert(s) dispatched to owner.`);
      } catch (err) {
        console.error("[Expiry Scheduler Error]", err);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata"
    }
  );

  return task;
}
