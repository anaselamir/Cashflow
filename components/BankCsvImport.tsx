"use client";

import { useRef, useState } from "react";

type FileResult = {
  name: string;
  status: "loading" | "done" | "error";
  message: string;
};

export function BankCsvImport({ onImported }: { onImported: () => Promise<void> }) {
  const [results, setResults] = useState<FileResult[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(files: FileList) {
    const list = Array.from(files);
    setResults(list.map((f) => ({ name: f.name, status: "loading", message: "" })));

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      try {
        const content = await file.text();
        const res = await fetch("/api/import/csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const body = await res.json();
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? res.ok
                ? {
                    ...r,
                    status: "done",
                    message:
                      `${body.bank}: ${body.imported} entries` +
                      (body.replaced ? ` (replaced ${body.replaced} existing)` : "") +
                      (body.outsideMonth
                        ? ` — ${body.outsideMonth} rows outside the current month skipped`
                        : ""),
                  }
                : { ...r, status: "error", message: body.error }
              : r
          )
        );
        if (res.ok) await onImported();
      } catch {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "error", message: "Could not read that file." } : r
          )
        );
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="no-print rounded-lg border border-rule bg-paper-raised p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
        Update bank data
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Select one or more bank statement CSVs — the bank and account are detected
        automatically from each file. Each statement replaces whatever is already
        on the books for that bank in the dates it covers, so provisional entries
        get swapped for the real transaction once the statement arrives.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="mt-3 rounded bg-ink px-4 py-2 font-mono text-sm uppercase tracking-wide text-paper transition hover:bg-brass-deep"
      >
        Choose CSV files
      </button>

      {results.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {results.map((r) => (
            <li key={r.name} className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-soft">{r.name}</span>
              <span
                className={
                  r.status === "error"
                    ? "text-rust"
                    : r.status === "done"
                      ? "text-green"
                      : "text-ink-soft"
                }
              >
                {r.status === "loading" ? "Importing…" : r.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
