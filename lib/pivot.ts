import type { TransactionDTO } from "@/lib/types";
import { ALL_WEEKS } from "@/lib/week";

export function distinctBanks(transactions: TransactionDTO[]): string[] {
  return Array.from(new Set(transactions.map((t) => t.bank))).sort();
}

export function balancesByBank(
  transactions: TransactionDTO[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const t of transactions) {
    balances[t.bank] = (balances[t.bank] ?? 0) + t.amount;
  }
  return balances;
}

export function weeklyPivot(
  transactions: TransactionDTO[],
  banks: string[]
): { week: string; byBank: Record<string, number>; total: number }[] {
  return ALL_WEEKS.map((week) => {
    const byBank: Record<string, number> = Object.fromEntries(
      banks.map((b) => [b, 0])
    );
    for (const t of transactions) {
      if (t.week === week) byBank[t.bank] = (byBank[t.bank] ?? 0) + t.amount;
    }
    const total = Object.values(byBank).reduce((a, b) => a + b, 0);
    return { week, byBank, total };
  });
}
