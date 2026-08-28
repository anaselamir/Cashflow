import { formatMoney, moneyClass } from "@/lib/format";
import { weeklyPivot } from "@/lib/pivot";
import type { TransactionDTO } from "@/lib/types";

export function WeeklyPivot({
  transactions,
  banks,
  visibleWeeks,
}: {
  transactions: TransactionDTO[];
  banks: string[];
  visibleWeeks: string[];
}) {
  const rows = weeklyPivot(transactions, banks);
  const displayRows =
    visibleWeeks.length === 0
      ? rows
      : rows.filter((r) => visibleWeeks.includes(r.week));

  const grandTotals = Object.fromEntries(banks.map((b) => [b, 0]));
  let grandTotal = 0;
  for (const row of displayRows) {
    banks.forEach((b) => (grandTotals[b] += row.byBank[b] ?? 0));
    grandTotal += row.total;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-rule bg-paper-raised">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule-strong">
            <th className="p-3 text-left font-mono text-xs uppercase tracking-wide text-ink-soft">
              Week
            </th>
            {banks.map((bank) => (
              <th
                key={bank}
                className="p-3 text-right font-mono text-xs uppercase tracking-wide text-ink-soft"
              >
                {bank}
              </th>
            ))}
            <th className="p-3 text-right font-mono text-xs uppercase tracking-wide text-ink-soft">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.week} className="border-b border-rule">
              <td className="p-3 font-mono text-ink-soft">{row.week}</td>
              {banks.map((bank) => (
                <td
                  key={bank}
                  className={`money p-3 ${moneyClass(row.byBank[bank] ?? 0)}`}
                >
                  {formatMoney(row.byBank[bank] ?? 0)}
                </td>
              ))}
              <td className={`money p-3 font-semibold ${moneyClass(row.total)}`}>
                {formatMoney(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-brass">
            <td className="p-3 font-mono font-semibold text-brass-deep">
              Grand Total
            </td>
            {banks.map((bank) => (
              <td
                key={bank}
                className={`money p-3 font-semibold ${moneyClass(grandTotals[bank])}`}
              >
                {formatMoney(grandTotals[bank])}
              </td>
            ))}
            <td className={`money p-3 font-semibold ${moneyClass(grandTotal)}`}>
              {formatMoney(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
