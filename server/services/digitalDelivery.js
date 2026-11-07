import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

/**
 * Meta WhatsApp Cloud API & Nodemailer Digital Delivery Service
 */

// Helper to clean and format Indian phone number to E.164 without '+'
export function formatWhatsAppNumber(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

/**
 * Sends GST Invoice PDF and personalized message via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppInvoice({ sale, pdfPath, publicPdfUrl }) {
  const recipient = formatWhatsAppNumber(sale.mobile);
  const customerName = sale.customer_name || "Valued Customer";
  const shopName = process.env.SHOP_NAME || "SRI ANJANEYA AGRO AGENCIES";
  const invNo = sale.invoice_number || "SAG/2026-27/---";
  const totalAmt = Number(sale.grand_total || 0).toFixed(2);
  const paidAmt = Number(sale.amount_paid || 0).toFixed(2);
  const pendingAmt = Number(sale.balance_due || 0).toFixed(2);
  const dueDate = sale.due_date || (sale.date ? new Date(new Date(sale.date).getTime() + 30 * 86400000).toISOString().slice(0, 10) : "-");

  const messageText = 
`Hello ${customerName},

Thank you for shopping at *${shopName}*!

Your official GST Tax Invoice has been generated successfully.

📄 *Invoice Details:*
• *Invoice Number:* ${invNo}
• *Invoice Date:* ${sale.date || new Date().toISOString().slice(0, 10)}
• *Total Amount:* ₹${totalAmt}
• *Paid Amount:* ₹${paidAmt}
• *Pending Balance:* ₹${pendingAmt}${Number(pendingAmt) > 0 ? `\n• *Payment Due Date:* ${dueDate}` : ""}

Please find your official tax invoice attached with this message.

For queries or payment assistance, contact: ${process.env.SHOP_PHONE || "9900389992"}
Thank you for choosing us! 🌾`;

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || "v19.0";

  // Check if live Meta WhatsApp Cloud credentials exist
  if (phoneId && token && recipient) {
    try {
      const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;

      // If a public PDF URL or media ID is provided, send as document with caption
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
        // Send as rich text message
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: {
            preview_url: true,
            body: messageText
          }
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
      if (!response.ok) {
        throw new Error(data.error?.message || `WhatsApp API error ${response.status}`);
      }

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

  // Graceful Fallback: Simulated Delivery Mode (Development & Local Environments)
  console.log(`[WHATSAPP SIMULATION] Message to ${recipient || "N/A"}:\n${messageText}`);
  return {
    channel: "whatsapp",
    recipient: recipient || "919945012345",
    status: recipient ? "SIMULATED_SENT" : "NOT_CONFIGURED",
    message_id: `sim_wa_${Date.now()}`,
    sent_at: new Date().toISOString(),
    details: token 
      ? "Dispatched" 
      : "Simulated dispatch (Meta WhatsApp Cloud API credentials not configured in .env - running in demo mode)"
  };
}

/**
 * Sends GST Invoice PDF via Email using Nodemailer
 */
export async function sendEmailInvoice({ sale, pdfPath, recipientEmail }) {
  const targetEmail = recipientEmail || sale.email || sale.customer_email;
  const customerName = sale.customer_name || "Valued Farmer";
  const shopName = process.env.SHOP_NAME || "SRI ANJANEYA AGRO AGENCIES";
  const invNo = sale.invoice_number || "SAG/2026-27/---";
  const totalAmt = Number(sale.grand_total || 0).toFixed(2);
  const paidAmt = Number(sale.amount_paid || 0).toFixed(2);
  const pendingAmt = Number(sale.balance_due || 0).toFixed(2);
  const dueDate = sale.due_date || (sale.date ? new Date(new Date(sale.date).getTime() + 30 * 86400000).toISOString().slice(0, 10) : "-");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background-color: #f1f5f9; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #004D25; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; }
    .body { padding: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #ecfdf5; color: #047857; margin-bottom: 16px; }
    .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    .summary-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .summary-table tr:last-child td { border-bottom: none; font-weight: bold; }
    .amount-highlight { font-size: 18px; font-weight: bold; color: #004D25; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${shopName}</h1>
      <p>Agricultural Inputs • Quality Fertilizers & Seeds • Davangere</p>
    </div>
    <div class="body">
      <div class="badge">Official GST Invoice Attached</div>
      <p>Dear <strong>${customerName}</strong>,</p>
      <p>Thank you for choosing ${shopName}. Your sales transaction has been successfully recorded and your official GST Tax Invoice is attached to this email.</p>
      
      <table class="summary-table">
        <tr>
          <td><strong>Invoice Number:</strong></td>
          <td align="right">${invNo}</td>
        </tr>
        <tr>
          <td><strong>Invoice Date:</strong></td>
          <td align="right">${sale.date || new Date().toISOString().slice(0, 10)}</td>
        </tr>
        <tr>
          <td><strong>Payment Mode:</strong></td>
          <td align="right">${(sale.payment_method || "Cash").toUpperCase()}</td>
        </tr>
        <tr>
          <td><strong>Total Invoice Amount:</strong></td>
          <td align="right" class="amount-highlight">₹${totalAmt}</td>
        </tr>
        <tr>
          <td><strong>Amount Paid:</strong></td>
          <td align="right">₹${paidAmt}</td>
        </tr>
        <tr>
          <td><strong>Outstanding Balance:</strong></td>
          <td align="right" style="color: ${Number(pendingAmt) > 0 ? '#dc2626' : '#16a34a'}">
            ₹${pendingAmt} ${Number(pendingAmt) > 0 ? '(Credit Udhaari)' : '(Cleared)'}
          </td>
        </tr>
        ${Number(pendingAmt) > 0 ? `
        <tr>
          <td><strong>Credit Due Date:</strong></td>
          <td align="right">${dueDate}</td>
        </tr>` : ''}
      </table>

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        Please find your itemized <strong>${invNo.replace(/\//g, "-")}.pdf</strong> tax invoice attached for your accounts and GST records.
      </p>
    </div>
    <div class="footer">
      <p>SRI ANJANEYA AGRO AGENCIES, Main Road, Davangere, Karnataka</p>
      <p>GSTIN: 29ANHPM1365Q1ZA | Helpline: +91 9900389992</p>
      <p style="margin-top: 8px; font-size: 11px;">This is an automated digital delivery from SmartAgro ERP.</p>
    </div>
  </div>
</body>
</html>`;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM || `"${shopName}" <invoices@smartagro.in>`;

  const attachments = [];
  if (pdfPath && fs.existsSync(pdfPath)) {
    attachments.push({
      filename: `${invNo.replace(/\//g, "-")}.pdf`,
      path: pdfPath,
      contentType: "application/pdf"
    });
  }

  // Live SMTP send
  if (host && user && pass && targetEmail) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      const info = await transporter.sendMail({
        from,
        to: targetEmail,
        subject: `GST Tax Invoice ${invNo} from ${shopName}`,
        html: htmlContent,
        attachments
      });

      return {
        channel: "email",
        recipient: targetEmail,
        status: "DELIVERED",
        message_id: info.messageId,
        sent_at: new Date().toISOString(),
        details: "Dispatched via SMTP Server"
      };
    } catch (err) {
      console.warn("[EMAIL DELIVERY WARNING]", err.message);
      return {
        channel: "email",
        recipient: targetEmail,
        status: "FAILED",
        error: err.message,
        sent_at: new Date().toISOString()
      };
    }
  }

  // Simulated Email Delivery Mode
  console.log(`[EMAIL SIMULATION] Invoice ${invNo} sent to: ${targetEmail || "customer@example.com"}`);
  return {
    channel: "email",
    recipient: targetEmail || "farmer@example.com",
    status: targetEmail ? "SIMULATED_SENT" : "NOT_CONFIGURED",
    message_id: `sim_em_${Date.now()}`,
    sent_at: new Date().toISOString(),
    details: host
      ? "Dispatched"
      : "Simulated dispatch (Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env for live email server)"
  };
}

/**
 * Sends WhatsApp payment reminder for credit balances
 */
export async function sendWhatsAppReminder({ customer, overdueDays, principalAmount, accruedInterest, totalDue, invoiceNo }) {
  const recipient = formatWhatsAppNumber(customer.mobile);
  const shopName = process.env.SHOP_NAME || "SRI ANJANEYA AGRO AGENCIES";
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
    recipient: recipient || "919945012345",
    status: recipient ? "SIMULATED_SENT" : "NOT_CONFIGURED",
    message_id: `sim_rem_${Date.now()}`,
    sent_at: new Date().toISOString()
  };
}
