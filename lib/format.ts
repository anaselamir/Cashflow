export function formatMoney(amount: number): string {
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `(${abs})` : abs;
}

export function moneyClass(amount: number): string {
  return amount < 0 ? "text-rust" : "text-green";
}
