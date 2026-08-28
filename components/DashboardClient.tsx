"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { BalanceCards } from "@/components/BalanceCards";
import { WeeklyPivot } from "@/components/WeeklyPivot";
import { WeekChips } from "@/components/WeekChips";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { LedgerTable } from "@/components/LedgerTable";
import { ExportButtons } from "@/components/ExportButtons";
import { ImportBanner } from "@/components/ImportBanner";
import { BankCsvImport } from "@/components/BankCsvImport";
import { distinctBanks, balancesByBank } from "@/lib/pivot";
import type { TransactionDTO } from "@/lib/types";

type SyncStatus = "idle" | "saving" | "saved" | "error";

export function DashboardClient({ userEmail }: { userEmail: string }) {
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [visibleWeeks, setVisibleWeeks] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const loadAll = useCallback(async () => {
    const [txRes, settingsRes] = await Promise.all([
      fetch("/api/transactions"),
      fetch("/api/settings"),
    ]);
    const tx = await txRes.json();
    const settings = await settingsRes.json();
    setTransactions(tx);
    setVisibleWeeks(settings.visibleWeeks ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load, not a render-cascade
    loadAll();
  }, [loadAll]);

  async function addTransaction(input: {
    date: string;
    bank: string;
    text: string;
    amount: number;
  }) {
    setSyncStatus("saving");
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      setSyncStatus("error");
      return false;
    }
    await loadAll();
    setSyncStatus("saved");
    return true;
  }

  async function updateTransaction(
    id: string,
    patch: { date: string; bank: string; text: string; amount: number }
  ) {
    setSyncStatus("saving");
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setSyncStatus("error");
      return false;
    }
    await loadAll();
    setSyncStatus("saved");
    return true;
  }

  async function deleteTransaction(id: string) {
    setSyncStatus("saving");
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setSyncStatus("error");
      return false;
    }
    await loadAll();
    setSyncStatus("saved");
    return true;
  }

  async function changeVisibleWeeks(weeks: string[]) {
    setVisibleWeeks(weeks);
    setSyncStatus("saving");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibleWeeks: weeks }),
    });
    setSyncStatus(res.ok ? "saved" : "error");
  }

  async function runImport(): Promise<string | null> {
    const res = await fetch("/api/import", { method: "POST" });
    const body = await res.json();
    if (!res.ok) return body.error ?? "Import failed";
    await loadAll();
    return null;
  }

  const banks = distinctBanks(transactions);
  const balances = balancesByBank(transactions);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-mono text-sm text-ink-soft">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Header banks={banks} syncStatus={syncStatus} />

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {transactions.length === 0 ? (
          <ImportBanner onImport={runImport} />
        ) : null}

        <BalanceCards balances={balances} />

        <BankCsvImport onImported={loadAll} />

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-ink">Weekly Summary</h2>
            <WeekChips visibleWeeks={visibleWeeks} onChange={changeVisibleWeeks} />
          </div>
          <WeeklyPivot
            transactions={transactions}
            banks={banks}
            visibleWeeks={visibleWeeks}
          />
        </section>

        <AddTransactionForm banks={banks} onAdd={addTransaction} />

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-ink">Ledger</h2>
            <ExportButtons transactions={transactions} />
          </div>
          <LedgerTable
            transactions={transactions}
            banks={banks}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
          />
        </section>

        <p className="no-print text-center font-mono text-xs text-ink-soft">
          Signed in as {userEmail}
        </p>
      </main>
    </div>
  );
}
