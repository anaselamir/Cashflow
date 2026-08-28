"use client";

import type { TransactionDTO } from "@/lib/types";

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ transactions }: { transactions: TransactionDTO[] }) {
  function exportCsv() {
    const header = "Date,Week,Bank,Description,Amount";
    const rows = transactions.map((t) =>
      [t.date, t.week, t.bank, `"${t.text.replace(/"/g, '""')}"`, t.amount].join(",")
    );
    downloadBlob([header, ...rows].join("\n"), "cash-flow.csv", "text/csv");
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <a
        href="/api/export/xlsx"
        className="rounded border border-rule-strong px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink transition hover:border-brass hover:text-brass-deep"
      >
        Export Excel
      </a>
      <button
        onClick={exportCsv}
        className="rounded border border-rule-strong px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink transition hover:border-brass hover:text-brass-deep"
      >
        Export CSV
      </button>
      <button
        onClick={() => window.print()}
        className="rounded border border-rule-strong px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink transition hover:border-brass hover:text-brass-deep"
      >
        Print / Save PDF
      </button>
    </div>
  );
}
