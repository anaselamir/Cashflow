"use client";

import { useRef, useState } from "react";
import { weekLabelForDate } from "@/lib/week";

export function AddTransactionForm({
  banks,
  onAdd,
}: {
  banks: string[];
  onAdd: (input: {
    date: string;
    bank: string;
    text: string;
    amount: number;
  }) => Promise<boolean>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [bank, setBank] = useState("");
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const weekPreview = date ? weekLabelForDate(date) : "";

  async function submit() {
    setError(null);
    const parsedAmount = Number(amount);
    if (!date || !bank.trim() || !text.trim() || !Number.isFinite(parsedAmount)) {
      setError("Fill in date, bank, description, and a valid amount.");
      return;
    }

    const ok = await onAdd({ date, bank: bank.trim(), text: text.trim(), amount: parsedAmount });
    if (!ok) {
      setError("Could not add entry.");
      return;
    }

    setText("");
    setAmount("");
    dateRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="no-print rounded-lg border border-rule bg-paper-raised p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
        Add entry
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
        <div>
          <label className="block text-xs text-ink-soft">Date</label>
          <input
            ref={dateRef}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={onKeyDown}
            className="mt-1 w-full rounded border border-rule px-2 py-1.5"
          />
          {weekPreview ? (
            <p className="mt-1 font-mono text-xs text-ink-soft">{weekPreview}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs text-ink-soft">Bank</label>
          <input
            list="bank-suggestions"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            onKeyDown={onKeyDown}
            className="mt-1 w-full rounded border border-rule px-2 py-1.5"
          />
          <datalist id="bank-suggestions">
            {banks.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-soft">Description</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            className="mt-1 w-full rounded border border-rule px-2 py-1.5"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-soft">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={onKeyDown}
            className="mt-1 w-full rounded border border-rule px-2 py-1.5 text-right"
          />
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-rust">{error}</p> : null}

      <button
        onClick={submit}
        className="mt-3 rounded bg-ink px-4 py-2 font-mono text-sm uppercase tracking-wide text-paper transition hover:bg-brass-deep"
      >
        Add entry
      </button>
    </div>
  );
}
