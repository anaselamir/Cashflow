"use client";

import { useMemo, useState } from "react";
import { formatMoney, moneyClass } from "@/lib/format";
import { weekLabelForDate, ALL_WEEKS } from "@/lib/week";
import type { TransactionDTO } from "@/lib/types";

type EditState = {
  date: string;
  bank: string;
  text: string;
  amount: string;
};

type SortKey = "date" | "amount";
type Sort = { key: SortKey; dir: "asc" | "desc" };

export function LedgerTable({
  transactions,
  banks,
  onUpdate,
  onDelete,
}: {
  transactions: TransactionDTO[];
  banks: string[];
  onUpdate: (
    id: string,
    patch: { date: string; bank: string; text: string; amount: number }
  ) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [bankFilter, setBankFilter] = useState("");
  const [weekFilter, setWeekFilter] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditState | null>(null);
  const [sort, setSort] = useState<Sort | null>(null);

  const filtered = useMemo(() => {
    const rows = transactions.filter((t) => {
      if (bankFilter && t.bank !== bankFilter) return false;
      if (weekFilter && t.week !== weekFilter) return false;
      if (query && !t.text.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });

    if (!sort) return rows;

    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === "amount") return (a.amount - b.amount) * factor;
      return a.date.localeCompare(b.date) * factor;
    });
  }, [transactions, bankFilter, weekFilter, query, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev?.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function sortIndicator(key: SortKey) {
    if (sort?.key !== key) return null;
    return <span className="ml-1">{sort.dir === "asc" ? "▲" : "▼"}</span>;
  }

  function startEdit(t: TransactionDTO) {
    setEditingId(t.id);
    setDraft({ date: t.date, bank: t.bank, text: t.text, amount: String(t.amount) });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    const amount = Number(draft.amount);
    if (!draft.date || !draft.bank.trim() || !draft.text.trim() || !Number.isFinite(amount)) {
      return;
    }
    const ok = await onUpdate(id, {
      date: draft.date,
      bank: draft.bank.trim(),
      text: draft.text.trim(),
      amount,
    });
    if (ok) {
      setEditingId(null);
      setDraft(null);
    }
  }

  return (
    <div className="rounded-lg border border-rule bg-paper-raised">
      <div className="no-print flex flex-wrap items-center gap-3 border-b border-rule p-4">
        <select
          value={bankFilter}
          onChange={(e) => setBankFilter(e.target.value)}
          className="rounded border border-rule px-2 py-1.5 text-sm"
        >
          <option value="">All banks</option>
          {banks.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={weekFilter}
          onChange={(e) => setWeekFilter(e.target.value)}
          className="rounded border border-rule px-2 py-1.5 text-sm"
        >
          <option value="">All weeks</option>
          {ALL_WEEKS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[160px] rounded border border-rule px-2 py-1.5 text-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule-strong">
              <th
                className="cursor-pointer select-none p-3 text-left font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-brass-deep"
                onClick={() => toggleSort("date")}
              >
                Date{sortIndicator("date")}
              </th>
              <th className="p-3 text-left font-mono text-xs uppercase tracking-wide text-ink-soft">Week</th>
              <th className="p-3 text-left font-mono text-xs uppercase tracking-wide text-ink-soft">Bank</th>
              <th className="p-3 text-left font-mono text-xs uppercase tracking-wide text-ink-soft">Description</th>
              <th
                className="cursor-pointer select-none p-3 text-right font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-brass-deep"
                onClick={() => toggleSort("amount")}
              >
                Amount{sortIndicator("amount")}
              </th>
              <th className="no-print p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const isEditing = editingId === t.id;
              return (
                <tr
                  key={t.id}
                  className={`border-b border-rule ${isEditing ? "bg-green-bg" : ""}`}
                >
                  {isEditing && draft ? (
                    <>
                      <td className="p-2">
                        <input
                          type="date"
                          value={draft.date}
                          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                          className="w-full rounded border border-rule px-2 py-1"
                        />
                      </td>
                      <td className="p-2 font-mono text-ink-soft">
                        {weekLabelForDate(draft.date)}
                      </td>
                      <td className="p-2">
                        <input
                          value={draft.bank}
                          onChange={(e) => setDraft({ ...draft, bank: e.target.value })}
                          className="w-full rounded border border-rule px-2 py-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          value={draft.text}
                          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                          className="w-full rounded border border-rule px-2 py-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={draft.amount}
                          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                          className="w-full rounded border border-rule px-2 py-1 text-right"
                        />
                      </td>
                      <td className="no-print p-2 whitespace-nowrap">
                        <button
                          onClick={() => saveEdit(t.id)}
                          className="mr-2 rounded bg-green px-2 py-1 text-xs text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded border border-rule-strong px-2 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="cursor-pointer p-3" onClick={() => startEdit(t)}>
                        {t.date}
                      </td>
                      <td className="cursor-pointer p-3 font-mono text-ink-soft" onClick={() => startEdit(t)}>
                        {t.week}
                      </td>
                      <td className="cursor-pointer p-3" onClick={() => startEdit(t)}>
                        {t.bank}
                      </td>
                      <td className="cursor-pointer p-3" onClick={() => startEdit(t)}>
                        {t.text}
                      </td>
                      <td
                        className={`money cursor-pointer p-3 ${moneyClass(t.amount)}`}
                        onClick={() => startEdit(t)}
                      >
                        {formatMoney(t.amount)}
                      </td>
                      <td className="no-print p-3">
                        <button
                          onClick={() => onDelete(t.id)}
                          className="rounded border border-rust px-2 py-1 text-xs text-rust transition hover:bg-rust hover:text-white"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink-soft">
                  No transactions match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
