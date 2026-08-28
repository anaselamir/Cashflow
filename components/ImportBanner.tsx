"use client";

import { useState } from "react";

export function ImportBanner({ onImport }: { onImport: () => Promise<string | null> }) {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function runImport() {
    setStatus("loading");
    setError(null);
    const err = await onImport();
    setStatus("idle");
    if (err) setError(err);
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brass bg-green-bg px-5 py-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
          First run
        </p>
        <p className="text-sm text-ink">
          No transactions yet. Import the seed dataset to get started.
        </p>
        {error ? <p className="mt-1 text-sm text-rust">{error}</p> : null}
      </div>
      <button
        onClick={runImport}
        disabled={status === "loading"}
        className="rounded bg-brass px-4 py-2 font-mono text-sm uppercase tracking-wide text-white transition hover:bg-brass-deep disabled:opacity-60"
      >
        {status === "loading" ? "Importing…" : "Import seed data"}
      </button>
    </div>
  );
}
