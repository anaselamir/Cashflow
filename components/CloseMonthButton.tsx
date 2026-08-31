"use client";

import { useState } from "react";

export function CloseMonthButton({ onClosed }: { onClosed: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/close-month", { method: "POST" });
    const body = await res.json();
    setLoading(false);
    setConfirming(false);
    if (!res.ok) {
      setError(body.error);
      return;
    }
    await onClosed();
  }

  return (
    <div className="no-print rounded-lg border border-rust p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-rust">
        Close month
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Clears every transaction and starts a new month, carrying each bank&apos;s
        current balance forward as its opening balance. Export a PDF or Excel
        copy of this month first — this cannot be undone.
      </p>

      {error ? <p className="mt-2 text-sm text-rust">{error}</p> : null}

      {confirming ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-rust">
            Delete all current transactions and start a new month?
          </span>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded bg-rust px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-white transition disabled:opacity-60"
          >
            {loading ? "Closing…" : "Yes, start new month"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded border border-rule-strong px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="mt-3 rounded border border-rust px-4 py-2 font-mono text-sm uppercase tracking-wide text-rust transition hover:bg-rust hover:text-white"
        >
          Start New Month
        </button>
      )}
    </div>
  );
}
