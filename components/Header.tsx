"use client";

import { signOut } from "next-auth/react";

export function Header({
  banks,
  syncStatus,
}: {
  banks: string[];
  syncStatus: "idle" | "saving" | "saved" | "error";
}) {
  return (
    <header className="no-print border-b border-rule bg-paper-raised">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
            Treasury
          </p>
          <h1 className="font-display text-2xl text-ink">
            Cash Flow Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {banks.length > 0
              ? `Tracking ${banks.join(" · ")}`
              : "No accounts tracked yet"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">
            {syncStatus === "saving" && "Saving…"}
            {syncStatus === "saved" && "Saved"}
            {syncStatus === "error" && (
              <span className="text-rust">Save failed</span>
            )}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded border border-rule-strong px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink transition hover:border-brass hover:text-brass-deep"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
