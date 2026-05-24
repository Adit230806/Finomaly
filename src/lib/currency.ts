/** Indian Rupee formatting — app-wide currency display */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inrCompactFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format amount as ₹ with locale grouping (e.g. ₹1,25,000.50) */
export function formatINR(amount: number, decimals?: number): string {
  if (decimals === 0) return inrCompactFormatter.format(amount);
  if (decimals !== undefined) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }
  return inrFormatter.format(amount);
}

/** High-value fraud threshold in INR */
export const HIGH_VALUE_INR = 4_00_000;

export const CURRENCY_LABEL = "INR";
export const AMOUNT_INPUT_LABEL = "Amount (INR)";
