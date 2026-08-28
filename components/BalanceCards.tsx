import { formatMoney, moneyClass } from "@/lib/format";

export function BalanceCards({
  balances,
}: {
  balances: Record<string, number>;
}) {
  const banks = Object.keys(balances).sort();
  const total = Object.values(balances).reduce((a, b) => a + b, 0);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {banks.map((bank) => (
        <div
          key={bank}
          className="rounded-lg border border-rule bg-paper-raised p-5 shadow-sm"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            {bank}
          </p>
          <p
            className={`money mt-2 text-2xl ${moneyClass(balances[bank])}`}
          >
            {formatMoney(balances[bank])}
          </p>
        </div>
      ))}

      <div className="rounded-lg border-2 border-brass bg-paper-raised p-5 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
          Total across accounts
        </p>
        <p className={`money mt-2 text-2xl ${moneyClass(total)}`}>
          {formatMoney(total)}
        </p>
      </div>
    </section>
  );
}
