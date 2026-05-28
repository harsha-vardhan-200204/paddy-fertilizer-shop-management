import * as XLSX from "xlsx";

export async function calculateInvoice(items, store) {
  const enriched = [];
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;

  for (const item of items) {
    const product = await store.getById("products", item.product_id);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 400 });
    const qty = Number(item.qty || 0);
    const rate = Number(item.rate ?? product.selling_price ?? 0);
    const discount = Number(item.discount || 0);
    const taxable = Math.max(0, qty * rate - discount);
    const gst = Number(item.gst_percent ?? product.gst_percent ?? 0);
    const taxAmount = taxable * (gst / 100);
    const lineCgst = taxAmount / 2;
    const lineSgst = taxAmount / 2;
    const total = taxable + taxAmount;
    subtotal += taxable;
    cgst += lineCgst;
    sgst += lineSgst;
    enriched.push({
      ...item,
      product_name: product.name,
      hsn_code: product.hsn_code,
      rate,
      discount,
      gst_percent: gst,
      cgst: round(lineCgst),
      sgst: round(lineSgst),
      total: round(total)
    });
  }

  const grand_total = round(subtotal + cgst + sgst);
  return {
    items: enriched,
    subtotal: round(subtotal),
    cgst: round(cgst),
    sgst: round(sgst),
    grand_total,
    balance_due: round(grand_total - Number(items.amount_paid || 0))
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
