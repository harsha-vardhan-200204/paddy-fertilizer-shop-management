import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { numberToWordsRupees } from "../utils/numberToWords.js";

// Helper for Indian Rupee currency formatting
function formatINR(amount) {
  const val = Number(amount || 0);
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Generates a professional A4 GST Tax Invoice PDF
 * CBIC GST Compliant with intra-state / inter-state tax breakdown
 */
export async function generateInvoicePdf(sale, outputPath) {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 28,
        info: {
          Title: `GST Invoice ${sale.invoice_number}`,
          Author: "Sri Anjaneya Agro Agencies",
          Subject: "GST Tax Invoice"
        }
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const PRIMARY_COLOR = "#004D25"; // Requested Brand Green
      const SECONDARY_COLOR = "#1B5E20";
      const TEXT_MAIN = "#1E293B";
      const TEXT_MUTED = "#64748B";
      const BORDER_COLOR = "#CBD5E1";
      const BG_LIGHT = "#F8FAFC";

      const startX = 28;
      const pageWidth = 539; // 595 - 56

      let currentY = 28;

      // ----------------------------------------------------
      // 1. HEADER BANNER
      // ----------------------------------------------------
      doc.rect(startX, currentY, pageWidth, 74).fill(PRIMARY_COLOR);

      // Business Name & Title
      doc.fillColor("#FFFFFF").fontSize(17).font("Helvetica-Bold")
        .text("SRI ANJANEYA AGRO AGENCIES", startX + 16, currentY + 10);

      doc.fontSize(8.5).font("Helvetica")
        .text("Wholesale & Retail: Fertilizers, Pesticides, Bio-Products & Quality Seeds", startX + 16, currentY + 31)
        .text("Main Road, Davangere, Karnataka - 577002 | Phone: +91 9900389992", startX + 16, currentY + 43)
        .text("GSTIN: 29ANHPM1365Q1ZA | State: Karnataka (Code: 29) | Email: anjaneyaagro@gmail.com", startX + 16, currentY + 55);

      // Tax Invoice Badge on Right
      doc.rect(startX + pageWidth - 160, currentY + 12, 148, 48).fill("#FFFFFF");
      doc.fillColor(PRIMARY_COLOR).fontSize(10.5).font("Helvetica-Bold")
        .text("TAX INVOICE", startX + pageWidth - 160, currentY + 20, { width: 148, align: "center" });
      doc.fontSize(7.5).font("Helvetica")
        .fillColor("#475569")
        .text("ORIGINAL FOR RECIPIENT", startX + pageWidth - 160, currentY + 35, { width: 148, align: "center" });
      if (sale.status === "CANCELLED") {
        doc.fillColor("#DC2626").fontSize(8).font("Helvetica-Bold")
          .text("[CANCELLED VOID]", startX + pageWidth - 160, currentY + 47, { width: 148, align: "center" });
      }

      currentY += 80;

      // ----------------------------------------------------
      // 2. INVOICE META & CUSTOMER DETAILS (2-Column Box)
      // ----------------------------------------------------
      const metaBoxHeight = 82;
      const colWidth = pageWidth / 2;

      // Background Box
      doc.rect(startX, currentY, pageWidth, metaBoxHeight)
        .fillAndStroke(BG_LIGHT, BORDER_COLOR);

      // Column Divider
      doc.moveTo(startX + colWidth, currentY)
        .lineTo(startX + colWidth, currentY + metaBoxHeight)
        .stroke(BORDER_COLOR);

      // Left Column: Invoice Particulars
      doc.fillColor(PRIMARY_COLOR).fontSize(8.5).font("Helvetica-Bold")
        .text("INVOICE PARTICULARS", startX + 10, currentY + 8);

      doc.fillColor(TEXT_MUTED).fontSize(8).font("Helvetica")
        .text("Invoice Number:", startX + 10, currentY + 22)
        .text("Invoice Date & Time:", startX + 10, currentY + 36)
        .text("Place of Supply:", startX + 10, currentY + 50)
        .text("Reverse Charge (RCM):", startX + 10, currentY + 64);

      const invDateStr = sale.date || new Date().toISOString().slice(0, 10);
      const invTimeStr = sale.created_at ? new Date(sale.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "Standard Counter";

      doc.fillColor(TEXT_MAIN).font("Helvetica-Bold")
        .text(sale.invoice_number || "SAG/2026-27/---", startX + 105, currentY + 22)
        .font("Helvetica")
        .text(`${invDateStr}  (${invTimeStr})`, startX + 105, currentY + 36)
        .text(sale.is_interstate ? (sale.state_of_supply || "Inter-State") : "29 - Karnataka (Intra-State)", startX + 105, currentY + 50)
        .text("No", startX + 105, currentY + 64);

      // Right Column: Billed To (Customer Details)
      const rX = startX + colWidth + 10;
      doc.fillColor(PRIMARY_COLOR).fontSize(8.5).font("Helvetica-Bold")
        .text("BILLED TO (BUYER DETAILS)", rX, currentY + 8);

      doc.fillColor(TEXT_MUTED).fontSize(8).font("Helvetica")
        .text("Customer / Farmer:", rX, currentY + 22)
        .text("Mobile / Contact:", rX, currentY + 36)
        .text("Address / Village:", rX, currentY + 50)
        .text("GSTIN / Aadhaar:", rX, currentY + 64);

      const custAadhaarMasked = sale.customer_aadhaar
        ? `XXXX-XXXX-${String(sale.customer_aadhaar).replace(/\D/g, "").slice(-4)}`
        : "-";
      const gstOrAadhaar = sale.gstin ? `GST: ${sale.gstin}` : (sale.customer_aadhaar ? `UID: ${custAadhaarMasked}` : "Unregistered (B2C)");

      doc.fillColor(TEXT_MAIN).font("Helvetica-Bold")
        .text(sale.customer_name || "Walk-in Retail Buyer", rX + 90, currentY + 22)
        .font("Helvetica")
        .text(sale.mobile || "-", rX + 90, currentY + 36)
        .text([sale.village, sale.billing_address].filter(Boolean).join(", ") || "Davangere District", rX + 90, currentY + 50, { width: colWidth - 105, height: 12, ellipsis: true })
        .text(gstOrAadhaar, rX + 90, currentY + 64);

      currentY += metaBoxHeight + 8;

      // ----------------------------------------------------
      // 3. LINE ITEMS TABLE
      // ----------------------------------------------------
      const tableHeaders = [
        { label: "#", width: 22, align: "center" },
        { label: "Item Description", width: 140, align: "left" },
        { label: "HSN/SAC", width: 48, align: "center" },
        { label: "Qty", width: 36, align: "right" },
        { label: "Rate (₹)", width: 48, align: "right" },
        { label: "Disc", width: 34, align: "right" },
        { label: "Taxable (₹)", width: 55, align: "right" },
        { label: "GST %", width: 36, align: "center" },
        { label: sale.is_interstate ? "IGST (₹)" : "Tax (₹)", width: 52, align: "right" },
        { label: "Total (₹)", width: 68, align: "right" }
      ];

      const rowHeight = 20;

      // Draw Header Row
      doc.rect(startX, currentY, pageWidth, rowHeight).fill(PRIMARY_COLOR);
      let curX = startX;
      doc.fillColor("#FFFFFF").fontSize(7.5).font("Helvetica-Bold");

      for (const col of tableHeaders) {
        doc.text(col.label, curX + 2, currentY + 6, {
          width: col.width - 4,
          align: col.align
        });
        curX += col.width;
      }

      currentY += rowHeight;

      // Draw Items
      const items = sale.items || [];
      items.forEach((item, idx) => {
        const isEven = idx % 2 === 0;
        doc.rect(startX, currentY, pageWidth, rowHeight)
          .fillAndStroke(isEven ? "#FFFFFF" : "#F8FAFC", BORDER_COLOR);

        const taxAmt = (Number(item.cgst || 0) + Number(item.sgst || 0) + Number(item.igst || 0)) || (Number(item.total || 0) - Number(item.taxable_amount || 0));
        const taxable = Number(item.taxable_amount ?? (item.qty * item.rate - (item.discount || 0)));

        curX = startX;
        doc.fillColor(TEXT_MAIN).fontSize(7.5).font("Helvetica");

        // #
        doc.text(String(idx + 1), curX, currentY + 6, { width: 22, align: "center" });
        curX += 22;

        // Item Name
        doc.font("Helvetica-Bold").text(item.product_name || item.name || "Agro Product", curX + 2, currentY + 6, { width: 136, height: 12, ellipsis: true });
        curX += 140;

        // HSN
        doc.font("Helvetica").text(item.hsn_code || "3105", curX, currentY + 6, { width: 48, align: "center" });
        curX += 48;

        // Qty
        doc.text(`${item.qty} ${item.unit || "Bag"}`, curX, currentY + 6, { width: 36, align: "right" });
        curX += 36;

        // Rate
        doc.text(formatINR(item.rate), curX, currentY + 6, { width: 48, align: "right" });
        curX += 48;

        // Disc
        doc.text(Number(item.discount || 0) > 0 ? formatINR(item.discount) : "-", curX, currentY + 6, { width: 34, align: "right" });
        curX += 34;

        // Taxable
        doc.text(formatINR(taxable), curX, currentY + 6, { width: 55, align: "right" });
        curX += 55;

        // GST %
        doc.text(`${item.gst_percent || 0}%`, curX, currentY + 6, { width: 36, align: "center" });
        curX += 36;

        // Tax Amt
        doc.text(formatINR(taxAmt), curX, currentY + 6, { width: 52, align: "right" });
        curX += 52;

        // Total
        doc.font("Helvetica-Bold").text(formatINR(item.total), curX - 2, currentY + 6, { width: 68, align: "right" });

        currentY += rowHeight;
      });

      // ----------------------------------------------------
      // 4. TAX & PAYMENT SUMMARY BREAKDOWN (Split Box)
      // ----------------------------------------------------
      currentY += 4;
      const summaryBoxHeight = 110;
      const leftBoxWidth = 310;
      const rightBoxWidth = pageWidth - leftBoxWidth;

      // Outer Left Box: Payment Details & Bank Details
      doc.rect(startX, currentY, leftBoxWidth, summaryBoxHeight)
        .fillAndStroke(BG_LIGHT, BORDER_COLOR);

      // Outer Right Box: Total Calculations
      doc.rect(startX + leftBoxWidth, currentY, rightBoxWidth, summaryBoxHeight)
        .fillAndStroke("#FFFFFF", BORDER_COLOR);

      // LEFT BOX: Payment Tender Breakdown & Bank
      const lX = startX + 8;
      doc.fillColor(PRIMARY_COLOR).fontSize(8.5).font("Helvetica-Bold")
        .text("PAYMENT DETAILS & SETTLEMENT", lX, currentY + 8);

      doc.fillColor(TEXT_MUTED).fontSize(8).font("Helvetica")
        .text("Payment Mode:", lX, currentY + 22)
        .text("Amount Received:", lX, currentY + 36)
        .text("Balance Due (Credit):", lX, currentY + 50)
        .text("Payment Due Date:", lX, currentY + 64)
        .text("Bank & UPI Details:", lX, currentY + 80);

      const pMethod = (sale.payment_method || "CASH").toUpperCase();
      const balDue = Number(sale.balance_due ?? (sale.grand_total - Number(sale.amount_paid || 0)));
      const pDueDate = sale.due_date || (sale.date ? new Date(new Date(sale.date).getTime() + 30 * 86400000).toISOString().slice(0, 10) : "Immediate");

      doc.fillColor(TEXT_MAIN).font("Helvetica-Bold")
        .text(pMethod, lX + 105, currentY + 22)
        .text(`₹ ${formatINR(sale.amount_paid || 0)}`, lX + 105, currentY + 36);

      if (balDue > 0) {
        doc.fillColor("#DC2626").font("Helvetica-Bold")
          .text(`₹ ${formatINR(balDue)}  (Udhaari)`, lX + 105, currentY + 50);
      } else {
        doc.fillColor("#16A34A").font("Helvetica-Bold")
          .text("₹ 0.00  (Fully Paid)", lX + 105, currentY + 50);
      }

      doc.fillColor(TEXT_MAIN).font("Helvetica")
        .text(balDue > 0 ? `${pDueDate} (Interest @ 2%/mo thereafter)` : "Nil Outstanding", lX + 105, currentY + 64);

      doc.fontSize(7.5).fillColor("#475569")
        .text("SBI Davangere Main Branch | A/C: 38992019482 | IFSC: SBIN0001234 | UPI: 9900389992@sbi", lX, currentY + 93, { width: leftBoxWidth - 16 });

      // RIGHT BOX: Line Calculation Totals
      const rcX = startX + leftBoxWidth + 8;
      const rcValX = startX + pageWidth - 10;

      function drawSummaryLine(label, value, y, isBold = false, isHighlight = false) {
        doc.fillColor(isHighlight ? PRIMARY_COLOR : (isBold ? TEXT_MAIN : TEXT_MUTED))
          .fontSize(isHighlight ? 9.5 : 8)
          .font(isBold || isHighlight ? "Helvetica-Bold" : "Helvetica")
          .text(label, rcX, y);

        doc.fillColor(isHighlight ? PRIMARY_COLOR : TEXT_MAIN)
          .fontSize(isHighlight ? 9.5 : 8)
          .font(isBold || isHighlight ? "Helvetica-Bold" : "Helvetica")
          .text(`₹ ${formatINR(value)}`, rcX, y, { width: rightBoxWidth - 16, align: "right" });
      }

      let curSy = currentY + 8;
      drawSummaryLine("Taxable Subtotal:", sale.subtotal, curSy);
      curSy += 14;

      if (sale.is_interstate) {
        drawSummaryLine("IGST (Inter-State):", sale.igst || sale.total_tax, curSy);
        curSy += 14;
      } else {
        drawSummaryLine("CGST (Central Tax):", sale.cgst, curSy);
        curSy += 13;
        drawSummaryLine("SGST (State Tax):", sale.sgst, curSy);
        curSy += 14;
      }

      drawSummaryLine("Total Tax Amount:", sale.total_tax || (Number(sale.cgst || 0) + Number(sale.sgst || 0) + Number(sale.igst || 0)), curSy);
      curSy += 14;

      // Divider
      doc.moveTo(startX + leftBoxWidth, curSy + 2)
        .lineTo(startX + pageWidth, curSy + 2)
        .stroke(PRIMARY_COLOR);

      curSy += 6;
      drawSummaryLine("GRAND TOTAL:", sale.grand_total, curSy, true, true);

      currentY += summaryBoxHeight + 6;

      // ----------------------------------------------------
      // 5. AMOUNT IN WORDS BOX
      // ----------------------------------------------------
      const wordsBoxHeight = 22;
      doc.rect(startX, currentY, pageWidth, wordsBoxHeight)
        .fillAndStroke(BG_LIGHT, BORDER_COLOR);

      const wordsStr = numberToWordsRupees(sale.grand_total);
      doc.fillColor(TEXT_MUTED).fontSize(7.5).font("Helvetica")
        .text("Amount in Words:", startX + 8, currentY + 6);
      doc.fillColor(PRIMARY_COLOR).fontSize(8).font("Helvetica-Bold")
        .text(wordsStr, startX + 85, currentY + 6, { width: pageWidth - 95, ellipsis: true });

      currentY += wordsBoxHeight + 8;

      // ----------------------------------------------------
      // 6. TERMS & CONDITIONS AND AUTHORIZED SIGNATORY
      // ----------------------------------------------------
      const footerBoxHeight = 84;
      doc.rect(startX, currentY, pageWidth, footerBoxHeight)
        .stroke(BORDER_COLOR);

      // Terms on Left (width 320)
      doc.fillColor(PRIMARY_COLOR).fontSize(8).font("Helvetica-Bold")
        .text("TERMS AND CONDITIONS", startX + 8, currentY + 7);

      const terms = [
        "1. Goods once sold will not be accepted back or exchanged after bill generation.",
        "2. All fertilizers and pesticides are sold in manufacturer sealed containers / bags.",
        "3. In case of credit purchase, interest @ 2% p.m. will accrue starting from purchase date.",
        "4. Subject to Davangere Jurisdiction only. Certified that particulars are true and correct."
      ];

      let termY = currentY + 20;
      doc.fillColor("#475569").fontSize(7).font("Helvetica");
      terms.forEach((t) => {
        doc.text(t, startX + 8, termY, { width: 320 });
        termY += 12;
      });

      // Signatory on Right
      const signX = startX + 340;
      doc.fillColor(PRIMARY_COLOR).fontSize(8).font("Helvetica-Bold")
        .text("For SRI ANJANEYA AGRO AGENCIES", signX, currentY + 7, { width: pageWidth - 348, align: "center" });

      doc.fillColor(TEXT_MUTED).fontSize(7).font("Helvetica")
        .text("Authorized Signatory / Proprietor", signX, currentY + 68, { width: pageWidth - 348, align: "center" });

      // Sign line
      doc.moveTo(signX + 20, currentY + 64)
        .lineTo(startX + pageWidth - 20, currentY + 64)
        .stroke(BORDER_COLOR);

      currentY += footerBoxHeight + 6;

      // System generated notice footer
      doc.fillColor(TEXT_MUTED).fontSize(6.8).font("Helvetica")
        .text("This is an electronically generated official GST Tax Invoice compliant with CBIC rules. Generated via SmartAgro ERP.", startX, currentY, { width: pageWidth, align: "center" });

      doc.end();

      writeStream.on("finish", () => resolve(outputPath));
      writeStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}
