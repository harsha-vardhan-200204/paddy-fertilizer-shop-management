import * as XLSX from "xlsx";

/**
 * Calculates itemized GST tax breakdowns for intra-state (CGST+SGST) and inter-state (IGST) sales
 */
export async function calculateInvoice(items, store, options = {}) {
  const enriched = [];
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  // Shop state is Karnataka (GST State Code 29)
  // If destination state is explicitly specified and not 29, or options.is_interstate is true
  const isInterstate = Boolean(
    options.is_interstate || 
    (options.customer_state_code && String(options.customer_state_code).trim() !== "29") ||
    (options.gstin && options.gstin.length >= 2 && !options.gstin.startsWith("29"))
  );

  for (const item of items) {
    const product = item.product_id ? await store.getById("products", item.product_id) : null;
    const qty = Number(item.qty || 0);
    const rate = Number(item.rate ?? product?.selling_price ?? 0);
    const discount = Number(item.discount || 0);
    const taxable = Math.max(0, qty * rate - discount);
    const gst = Number(item.gst_percent ?? product?.gst_percent ?? 0);
    const taxAmount = taxable * (gst / 100);

    let lineCgst = 0;
    let lineSgst = 0;
    let lineIgst = 0;

    if (isInterstate) {
      lineIgst = taxAmount;
      igst += lineIgst;
    } else {
      lineCgst = taxAmount / 2;
      lineSgst = taxAmount / 2;
      cgst += lineCgst;
      sgst += lineSgst;
    }

    const total = taxable + taxAmount;
    subtotal += taxable;

    enriched.push({
      ...item,
      product_name: item.product_name || item.name || product?.name || "Agro Product",
      hsn_code: item.hsn_code || product?.hsn_code || "3105",
      unit: item.unit || product?.unit || "Unit",
      rate,
      discount,
      taxable_amount: round(taxable),
      gst_percent: gst,
      cgst: round(lineCgst),
      sgst: round(lineSgst),
      igst: round(lineIgst),
      total: round(total)
    });
  }

  const exactTotal = subtotal + cgst + sgst + igst;
  const grand_total = round(exactTotal);
  const round_off = round(grand_total - exactTotal);
  const amountPaid = Number(options.amount_paid ?? items.amount_paid ?? 0);

  return {
    items: enriched,
    subtotal: round(subtotal),
    cgst: round(cgst),
    sgst: round(sgst),
    igst: round(igst),
    total_tax: round(cgst + sgst + igst),
    round_off,
    grand_total,
    is_interstate: isInterstate,
    state_of_supply: isInterstate ? (options.state_name || "Inter-State") : "29 - Karnataka",
    balance_due: round(Math.max(0, grand_total - amountPaid))
  };
}

export function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function exportCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

export function exportExcelBase64(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  return XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
}
