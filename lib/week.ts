export function weekLabelForDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dayOfMonth = d.getUTCDate();
  const weekNumber = Math.min(5, Math.ceil(dayOfMonth / 7));
  return `W${weekNumber}`;
}

export const ALL_WEEKS = ["W1", "W2", "W3", "W4", "W5"] as const;
