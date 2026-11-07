import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

/**
 * Meta WhatsApp Cloud API & Gmail Nodemailer Digital Delivery Service
 * Configured specifically for SmartAgro / Anjaneya Agro Agencies
 * Sender Email: harshavardhanjunji@gmail.com
 * Sender WhatsApp: +91 8660548244
 */

export const SHOP_SENDER_EMAIL = process.env.SMTP_USER || "harshavardhanjunji@gmail.com";
export const SHOP_SENDER_WHATSAPP = process.env.WHATSAPP_SENDER_NUMBER || "+918660548244";
export const SHOP_NAME = process.env.SHOP_NAME || "Anjaneya Agro Agencies";

// Helper to clean and format Indian phone number to E.164
export function formatWhatsAppNumber(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

/**
 * Factory for Nodemailer Gmail SMTP transporter
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || "harshavardhanjunji@gmail.com";
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "";

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    }),
    isConfigured: Boolean(user && pass && pass.trim().length > 0),
    user,
    host,
    port
  };
}

/**
 * Verifies live SMTP credentials with Gmail / mail server
 */
export async function verifySmtpConnection() {
  const { transporter, isConfigured, user, host, port } = getMailTransporter();
  if (!isConfigured) {
    return {
      ok: false,
      configured: false,
      message: "Gmail App Password not provided in SMTP_PASSWORD / SMTP_PASS in .env"
    };
  }

  try {
    await transporter.verify();
    return {
      ok: true,
      configured: true,
      host,
      port,
      user,
      message: `SMTP handshake successful! Authenticated as ${user}`
    };
  } catch (err) {
    console.warn("[SMTP VERIFY ERROR]", err.message);
    return {
      ok: false,
      configured: true,
      error: err.message,
      message: `Failed to authenticate with ${host}:${port} as ${user}: ${err.message}`
    };
  }
}

/**
 * Sends a real test email to verify end-to-end SMTP dispatch
 */
export async function sendTestEmail(targetEmail) {
  const recipient = targetEmail || SHOP_SENDER_EMAIL;
  const { transporter, isConfigured, user } = getMailTransporter();

  if (!isConfigured) {
    return {
      ok: false,
      simulated: true,
      recipient,
      message: "SMTP running in simulation mode. Set SMTP_PASSWORD in .env for live Gmail dispatch."
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Anjaneya Agro Agencies" <${user}>`,
      to: recipient,
      subject: `SmartAgro SMTP Verification Test – ${new Date().toLocaleTimeString("en-IN")}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
          <h2 style="color: #004D25;">✓ SmartAgro Email Service Connected</h2>
          <p>This is a verification test email sent from <strong>Anjaneya Agro Agencies</strong> system.</p>
          <p><strong>Sender:</strong> ${user}</p>
          <p><strong>Recipient:</strong> ${recipient}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString("en-IN")}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
          <p style="font-size: 12px; color: #64748b;">SmartAgro ERP • Automatic Bill Delivery & Expiry Alert System</p>
        </div>
      `
    });

    return {
      ok: true,
      messageId: info.messageId,
      recipient,
      message: `Verification email successfully dispatched to ${recipient}`
    };
  } catch (err) {
    console.error("[TEST EMAIL DISPATCH FAILED]", err);
    return {
      ok: false,
      error: err.message,
      message: `Email dispatch failed: ${err.message}`
    };
  }
}

/**
 * Sends Customer Purchase Bill via Nodemailer Gmail SMTP
 */
export async function sendEmailInvoice({ sale, pdfPath, recipientEmail }) {
  const targetEmail = recipientEmail || sale.customer_email || sale.email;
  const customerName = sale.customer_name || "Valued Customer";
  const invNo = sale.invoice_number || `SAG-${sale.id}`;
  const totalAmt = Number(sale.grand_total || 0).toFixed(2);
  const paidAmt = Number(sale.amount_paid || 0).toFixed(2);
  const pendingAmt = Number(sale.balance_due || 0).toFixed(2);
  const billDate = sale.date || new Date().toISOString().slice(0, 10);

  const subject = `Your Purchase Bill – ${invNo} – Anjaneya Agro Agencies`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #004D25; padding: 24px; color: #ffffff; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .summary-row:last-child { margin-bottom: 0; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 8px; }
    .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Anjaneya Agro Agencies</h1>
      <p>Agricultural Inputs • Quality Fertilizers & Seeds • Davangere</p>
    </div>
    <div class="content">
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Thank you for shopping at Anjaneya Agro Agencies. Your purchase bill has been generated successfully.</p>
      
      <div class="summary-box">
        <div class="summary-row"><span>Bill Number:</span> <strong>${invNo}</strong></div>
        <div class="summary-row"><span>Bill Date:</span> <span>${billDate}</span></div>
        <div class="summary-row"><span>Payment Method:</span> <span>${(sale.payment_method || "Cash").toUpperCase()}</span></div>
        <div class="summary-row"><span>Total Amount:</span> <span style="color: #004D25;">₹${totalAmt}</span></div>
        <div class="summary-row"><span>Paid Amount:</span> <span style="color: #16a34a;">₹${paidAmt}</span></div>
        <div class="summary-row"><span>Pending Balance:</span> <span style="color: ${Number(pendingAmt) > 0 ? '#dc2626' : '#16a34a'};">₹${pendingAmt}</span></div>
      </div>

      <p>Please find your official tax bill attached as a PDF to this email.</p>
      <p>Thank you for choosing us!</p>
    </div>
    <div class="footer">
      <p>Anjaneya Agro Agencies, Main Road, Davangere, Karnataka</p>
      <p>GSTIN: 29ANHPM1365Q1ZA | Phone: +91 8660548244 | Email: ${SHOP_SENDER_EMAIL}</p>
    </div>
  </div>
</body>
</html>`;

  const { transporter, isConfigured, user } = getMailTransporter();

  const attachments = [];
  if (pdfPath && fs.existsSync(pdfPath)) {
    attachments.push({
      filename: `${invNo.replace(/\//g, "-")}.pdf`,
      path: pdfPath,
      contentType: "application/pdf"
    });
  }

  // Live SMTP dispatch
  if (isConfigured && targetEmail) {
    try {
      const info = await transporter.sendMail({
        from: `"Anjaneya Agro Agencies" <${user}>`,
        to: targetEmail,
        subject,
        html: htmlContent,
        attachments
      });

      return {
        channel: "email",
        recipient: targetEmail,
        status: "DELIVERED",
        message_id: info.messageId,
        sent_at: new Date().toISOString(),
        details: `Dispatched to ${targetEmail} via Gmail SMTP`
      };
    } catch (err) {
      console.warn("[EMAIL BILL DISPATCH ERROR]", err.message);
      return {
        channel: "email",
        recipient: targetEmail,
        status: "FAILED",
        error: err.message,
        sent_at: new Date().toISOString()
      };
    }
  }

  // Simulated Email Dispatch
  console.log(`[EMAIL SIMULATION] Sent bill ${invNo} to ${targetEmail || "customer@example.com"}`);
  return {
    channel: "email",
    recipient: targetEmail || "customer@example.com",
    status: targetEmail ? "SIMULATED_SENT" : "NOT_CONFIGURED",
    message_id: `sim_em_${Date.now()}`,
    sent_at: new Date().toISOString(),
    details: isConfigured ? "Dispatched" : "Simulated dispatch (Set SMTP_PASSWORD in .env for live email server)"
  };
}

/**
 * Sends Customer Purchase Bill via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppInvoice({ sale, pdfPath, publicPdfUrl, recipientMobile }) {
  const rawMobile = recipientMobile || sale.mobile;
  const recipient = formatWhatsAppNumber(rawMobile);
  const customerName = sale.customer_name || "Customer";
  const invNo = sale.invoice_number || `SAG-${sale.id}`;
  const totalAmt = Number(sale.grand_total || 0).toFixed(2);
  const paidAmt = Number(sale.amount_paid || 0).toFixed(2);
  const pendingAmt = Number(sale.balance_due || 0).toFixed(2);
  const billDate = sale.date || new Date().toISOString().slice(0, 10);

  const messageText = 
`Hello ${customerName},
Thank you for shopping at Anjaneya Agro Agencies.
Your bill has been generated successfully.
Bill Number: ${invNo}
Total Amount: ₹${totalAmt}
Paid Amount: ₹${paidAmt}
Pending Balance: ₹${pendingAmt}
Bill Date: ${billDate}
Please find your bill attached.
Thank you! 🌾`;

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || "v19.0";

  if (phoneId && token && recipient) {
    try {
      const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
      let payload;
      if (publicPdfUrl) {
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "document",
          document: {
            link: publicPdfUrl,
            caption: messageText,
            filename: `${invNo.replace(/\//g, "-")}.pdf`
          }
        };
      } else {
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { preview_url: true, body: messageText }
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "WhatsApp API Error");

      return {
        channel: "whatsapp",
        recipient,
        status: "DELIVERED",
        message_id: data.messages?.[0]?.id || `wa_${Date.now()}`,
        sent_at: new Date().toISOString(),
        details: "Dispatched via Meta WhatsApp Cloud API"
      };
    } catch (err) {
      console.warn("[WHATSAPP DELIVERY WARNING]", err.message);
      return {
        channel: "whatsapp",
        recipient,
        status: "FAILED",
        error: err.message,
        sent_at: new Date().toISOString()
      };
    }
  }

  // Fallback: Simulated Delivery Mode
  console.log(`[WHATSAPP SIMULATION] Message to ${recipient}:\n${messageText}`);
  return {
    channel: "whatsapp",
    recipient: recipient || "918660548244",
    status: recipient ? "SIMULATED_SENT" : "NOT_CONFIGURED",
    message_id: `sim_wa_${Date.now()}`,
    sent_at: new Date().toISOString(),
    details: token ? "Dispatched" : "Simulated dispatch (Meta WhatsApp Cloud API credentials not configured in .env - running in demo mode)"
  };
}

/**
 * Sends Product Expiry Alert Email to Shop Owner (harshavardhanjunji@gmail.com)
 */
export async function sendExpiryAlertEmail({ batch, daysRemaining, recipientEmail }) {
  const targetEmail = recipientEmail || SHOP_SENDER_EMAIL;
  const isExpired = daysRemaining <= 0;
  const subject = `${isExpired ? 'URGENT: Product EXPIRED' : 'URGENT: Product Expiry Alert'} – ${batch.product_name}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f8fafc; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px; }
    .alert-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; color: #ffffff; background: ${isExpired ? '#dc2626' : daysRemaining <= 30 ? '#ea580c' : '#d97706'}; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="alert-badge">${isExpired ? 'PRODUCT EXPIRED' : `EXPIRING IN ${daysRemaining} DAYS`}</span>
    <h2 style="color: #004D25; margin-top: 12px;">Product Expiry Notification</h2>
    <p>Hello Admin,</p>
    <p>The following product batch is approaching its expiry date.</p>
    
    <table class="info-table">
      <tr><td><strong>Product:</strong></td><td>${batch.product_name}</td></tr>
      <tr><td><strong>Batch Number:</strong></td><td>${batch.batch_number}</td></tr>
      <tr><td><strong>Available Stock:</strong></td><td>${batch.current_stock} ${batch.unit || 'Units'}</td></tr>
      <tr><td><strong>Expiry Date:</strong></td><td style="color: red; font-weight: bold;">${batch.expiry_date}</td></tr>
      <tr><td><strong>Days Remaining:</strong></td><td>${isExpired ? 'Expired (' + Math.abs(daysRemaining) + ' days ago)' : daysRemaining + ' Days'}</td></tr>
      <tr><td><strong>Supplier:</strong></td><td>${batch.supplier_name || 'Agro Wholesale Depot'}</td></tr>
    </table>

    <p style="color: #dc2626; font-weight: bold;">
      ${isExpired ? '⚠ Immediate Action: This batch has expired and must be quarantined from sales.' : 'Please review the inventory and take necessary clearance action.'}
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="font-size: 12px; color: #64748b;">
      Anjaneya Agro Agencies<br>
      SmartAgro Inventory Management System
    </p>
  </div>
</body>
</html>`;

  const { transporter, isConfigured, user } = getMailTransporter();

  if (isConfigured) {
    try {
      const info = await transporter.sendMail({
        from: `"SmartAgro Expiry Alert" <${user}>`,
        to: targetEmail,
        subject,
        html: htmlContent
      });
      return { ok: true, status: "DELIVERED", messageId: info.messageId };
    } catch (err) {
      console.warn("[EXPIRY EMAIL ERROR]", err.message);
      return { ok: false, status: "FAILED", error: err.message };
    }
  }

  console.log(`[EXPIRY EMAIL SIMULATION] To: ${targetEmail}\nSubject: ${subject}`);
  return { ok: true, status: "SIMULATED_SENT", details: "Simulated expiry alert email sent" };
}

/**
 * Sends Product Expiry Alert WhatsApp to Shop Owner (+91 8660548244)
 */
export async function sendExpiryAlertWhatsApp({ batch, daysRemaining, recipientPhone }) {
  const recipient = formatWhatsAppNumber(recipientPhone || SHOP_SENDER_WHATSAPP);
  const isExpired = daysRemaining <= 0;

  const messageText = 
`🚨 *URGENT: Product Expiry Alert*
Product: *${batch.product_name}*
Batch Number: *${batch.batch_number}*
Available Stock: *${batch.current_stock} ${batch.unit || 'Units'}*
Expiry Date: *${batch.expiry_date}*
Days Remaining: *${isExpired ? `EXPIRED (${Math.abs(daysRemaining)} days ago)` : `${daysRemaining} Days`}*

Please review the inventory and take necessary action.
Anjaneya Agro Agencies
SmartAgro Inventory Management System`;

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || "v19.0";

  if (phoneId && token && recipient) {
    try {
      const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { body: messageText }
        })
      });
      const data = await response.json();
      return { ok: true, status: "DELIVERED", messageId: data.messages?.[0]?.id };
    } catch (err) {
      return { ok: false, status: "FAILED", error: err.message };
    }
  }

  console.log(`[EXPIRY WHATSAPP SIMULATION] To: ${recipient}\n${messageText}`);
  return { ok: true, status: "SIMULATED_SENT", details: "Simulated expiry alert whatsapp sent" };
}

/**
 * Sends WhatsApp payment reminder for credit balances
 */
export async function sendWhatsAppReminder({ customer, overdueDays, principalAmount, accruedInterest, totalDue, invoiceNo }) {
  const recipient = formatWhatsAppNumber(customer.mobile);
  const shopName = SHOP_NAME;
  const farmerName = customer.name || "Valued Farmer";

  const messageText = 
`Namaskara ${farmerName} avare,

This is a gentle payment reminder from *${shopName}*.

📋 *Account Summary:*
• *Invoice Ref:* ${invoiceNo || "Credit Purchase"}
• *Principal Outstanding:* ₹${Number(principalAmount).toFixed(2)}
• *Accrued Interest:* ₹${Number(accruedInterest || 0).toFixed(2)}
• *Total Due:* ₹${Number(totalDue).toFixed(2)}
• *Overdue Status:* ${overdueDays > 0 ? `${overdueDays} Days Past Due Date` : "Payment Due Soon"}

💡 *Payment Options:*
• Direct UPI: *9900389992@sbi*
• Or visit our shop counter at Main Road, Davangere.

Thank you for your business and cooperation! 🌾
Helpline: ${process.env.SHOP_PHONE || "9900389992"}`;

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || "v19.0";

  if (phoneId && token && recipient) {
    try {
      const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { body: messageText }
        })
      });
      const data = await response.json();
      return {
        channel: "whatsapp_reminder",
        recipient,
        status: "DELIVERED",
        message_id: data.messages?.[0]?.id || `war_${Date.now()}`,
        sent_at: new Date().toISOString()
      };
    } catch (err) {
      return { channel: "whatsapp_reminder", recipient, status: "FAILED", error: err.message };
    }
  }

  console.log(`[WHATSAPP REMINDER SIMULATION] To ${recipient}:\n${messageText}`);
  return {
    channel: "whatsapp_reminder",
    recipient: recipient || "918660548244",
    status: recipient ? "SIMULATED_SENT" : "NOT_CONFIGURED",
    message_id: `sim_rem_${Date.now()}`,
    sent_at: new Date().toISOString()
  };
}

/**
 * Sends Email payment reminder for credit balances
 */
export async function sendEmailReminder({ customer, overdueDays, principalAmount, accruedInterest, totalDue, invoiceNo, recipientEmail }) {
  const targetEmail = recipientEmail || customer.email || customer.customer_email;
  const shopName = SHOP_NAME;
  const farmerName = customer.name || "Valued Farmer";
  const subject = `Payment Reminder – Outstanding Dues – ${shopName}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #004D25; padding: 20px; color: #ffffff; text-align: center; }
    .header h2 { margin: 0; font-size: 20px; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; background: #fee2e2; color: #dc2626; }
    .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>${shopName}</h2>
      <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Customer Credit Payment Reminder</p>
    </div>
    <div class="content">
      <p>Namaskara <strong>${farmerName}</strong>,</p>
      <p>This is a friendly reminder regarding your outstanding credit account with <strong>${shopName}</strong>.</p>
      
      <table class="table">
        <tr><td><strong>Reference Bill / Account:</strong></td><td>${invoiceNo || "Credit Purchase"}</td></tr>
        <tr><td><strong>Principal Outstanding:</strong></td><td>₹${Number(principalAmount || 0).toFixed(2)}</td></tr>
        <tr><td><strong>Accrued Interest:</strong></td><td>₹${Number(accruedInterest || 0).toFixed(2)}</td></tr>
        <tr style="font-weight: bold; font-size: 15px; color: #004D25;">
          <td>Total Due Payable:</td><td>₹${Number(totalDue || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Status:</td>
          <td><span class="badge">${overdueDays > 0 ? `${overdueDays} Days Overdue` : "Payment Due"}</span></td>
        </tr>
      </table>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-top: 16px;">
        <p style="margin: 0; font-weight: bold; color: #166534;">Payment Options:</p>
        <p style="margin: 4px 0 0; font-size: 13px;">UPI ID: <strong>9900389992@sbi</strong><br>Or pay in cash/card at our shop counter.</p>
      </div>

      <p style="margin-top: 20px;">Thank you for your valued business!</p>
    </div>
    <div class="footer">
      <p>${shopName} • Main Road, Davangere, Karnataka</p>
      <p>Phone: +91 8660548244 | Email: ${SHOP_SENDER_EMAIL}</p>
    </div>
  </div>
</body>
</html>`;

  const { transporter, isConfigured, user } = getMailTransporter();

  if (isConfigured && targetEmail) {
    try {
      const info = await transporter.sendMail({
        from: `"${shopName}" <${user}>`,
        to: targetEmail,
        subject,
        html: htmlContent
      });
      return {
        channel: "email_reminder",
        recipient: targetEmail,
        status: "DELIVERED",
        message_id: info.messageId,
        sent_at: new Date().toISOString()
      };
    } catch (err) {
      return { channel: "email_reminder", recipient: targetEmail, status: "FAILED", error: err.message };
    }
  }

  console.log(`[EMAIL REMINDER SIMULATION] To ${targetEmail || "customer@example.com"}:\nSubject: ${subject}`);
  return {
    channel: "email_reminder",
    recipient: targetEmail || "customer@example.com",
    status: targetEmail ? "SIMULATED_SENT" : "NOT_CONFIGURED",
    message_id: `sim_rem_em_${Date.now()}`,
    sent_at: new Date().toISOString()
  };
}
