/**
 * Indian Financial Year & Sequential GST Invoice Number Generator
 * Standard CBIC Format: SAG/2026-27/001
 */

/**
 * Returns the Indian Financial Year string for a given date
 * e.g. Date in Nov 2026 -> "2026-27"
 *      Date in Feb 2027 -> "2026-27"
 *      Date in Apr 2027 -> "2027-28"
 */
export function getFinancialYear(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const month = validDate.getMonth(); // 0-11 (April is 3)
  const fullYear = validDate.getFullYear();

  let startYear;
  let endYear;

  if (month >= 3) {
    // April (3) to December (11)
    startYear = fullYear;
    endYear = (fullYear + 1) % 100;
  } else {
    // January (0) to March (2)
    startYear = fullYear - 1;
    endYear = fullYear % 100;
  }

  return `${startYear}-${String(endYear).padStart(2, "0")}`;
}

/**
 * Formats an invoice number string given sequence and financial year
 */
export function formatInvoiceNumber(seqNumber, fy = getFinancialYear(), prefix = "SAG") {
  const num = Math.max(1, parseInt(seqNumber, 10) || 1);
  const padded = String(num).padStart(3, "0");
  return `${prefix}/${fy}/${padded}`;
}

/**
 * Extracts sequence number and FY from an existing invoice number
 */
export function parseInvoiceNumber(invoiceNumber = "") {
  if (!invoiceNumber) return null;
  const match = String(invoiceNumber).match(/^([A-Z0-9]+)\/(\d{4}-\d{2})\/(\d+)$/i);
  if (!match) return null;
  return {
    prefix: match[1],
    fy: match[2],
    seq: parseInt(match[3], 10)
  };
}
