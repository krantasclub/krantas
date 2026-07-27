// Cents → display string, e.g. 3200 → "€32.00" (or "€32" when whole).
export function formatPrice(cents: number, currency = "EUR") {
  const amount = cents / 100;
  const formatted = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
  return formatted;
}
