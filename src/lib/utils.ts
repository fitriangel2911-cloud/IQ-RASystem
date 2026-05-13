/**
 * Combines multiple Tailwind classes safely using native string filtering
 * Bypasses external library dependency constraints for immediate runtime.
 */
export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Formats number into Indonesian Rupiah currency standard format.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
