// Indian Currency Number to Words converter (CBIC GST Invoice Standard)

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return TENS[ten] + (one ? " " + ONES[one] : "");
}

function threeDigits(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let res = "";
  if (hundred > 0) {
    res += ONES[hundred] + " Hundred";
    if (rest > 0) res += " and ";
  }
  if (rest > 0) {
    res += twoDigits(rest);
  }
  return res.trim();
}

/**
 * Converts a numeric amount to Indian Rupee Words
 * e.g. 46996.50 -> "Rupees Forty-Six Thousand Nine Hundred Ninety-Six and Fifty Paise Only"
 */
export function numberToWordsRupees(amount) {
  const num = Number(amount || 0);
  if (isNaN(num) || num <= 0) return "Rupees Zero Only";

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let words = "";

  // Split into Indian components: Crores, Lakhs, Thousands, Hundreds/Units
  const crore = Math.floor(rupees / 10000000);
  const croreRemainder = rupees % 10000000;

  const lakh = Math.floor(croreRemainder / 100000);
  const lakhRemainder = croreRemainder % 100000;

  const thousand = Math.floor(lakhRemainder / 1000);
  const remainder = lakhRemainder % 1000;

  if (crore > 0) {
    words += threeDigits(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += twoDigits(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += twoDigits(thousand) + " Thousand ";
  }
  if (remainder > 0) {
    words += threeDigits(remainder);
  }

  words = words.trim();
  let result = words ? `Rupees ${words}` : "Rupees Zero";

  if (paise > 0) {
    result += ` and ${twoDigits(paise)} Paise`;
  }

  return `${result} Only`;
}
