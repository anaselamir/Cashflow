import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bankCsvImportInput } from "@/lib/validation";
import { parseAnyBankCsv, type ParsedRow } from "@/lib/csvImport";

function dateRange(rows: ParsedRow[]): { min: string; max: string } {
  const dates = rows.map((r) => r.date).sort();
  return { min: dates[0], max: dates[dates.length - 1] };
}

// The ledger tracks one month at a time, starting from the most recent
// OPENING BALANCE row. A statement's own date range can't be trusted to
// stay inside that window — exports often cover a rolling multi-week
// period that dips into the prior (already-closed) month — so imported
// rows outside the current tracked month must be dropped, not inserted.
async function currentMonthBounds(): Promise<{ start: Date; end: Date } | null> {
  const openings = await prisma.transaction.findMany({
    where: { text: { startsWith: "OPENING BALANCE", mode: "insensitive" } },
    select: { date: true },
  });
  if (openings.length === 0) return null;

  const latest = openings.reduce((a, b) => (b.date > a.date ? b : a)).date;
  const start = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth(), 1));
  const end = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() + 1, 0));
  return { start, end };
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bankCsvImportInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  let bank: string;
  let rows: ParsedRow[];
  try {
    ({ bank, rows } = parseAnyBankCsv(parsed.data.content));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not parse CSV" },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No transactions found in that file." },
      { status: 400 }
    );
  }

  const bounds = await currentMonthBounds();
  let outsideMonth = 0;
  if (bounds) {
    const before = rows.length;
    rows = rows.filter((r) => {
      const d = new Date(r.date);
      return d >= bounds.start && d <= bounds.end;
    });
    outsideMonth = before - rows.length;
  }

  if (rows.length === 0) {
    return NextResponse.json(
      {
        error:
          "Every row in that file falls outside the current tracked month — nothing to import.",
      },
      { status: 400 }
    );
  }

  // The statement is authoritative for the date range it covers (within the
  // current month) — replace whatever is already on the books for this bank
  // in that window (including provisional/estimated entries) with what the
  // statement actually says. Opening-balance anchors are exempt: they
  // represent the balance carried in before tracking started, not a
  // movement the statement would show.
  const { min, max } = dateRange(rows);

  const [{ count: replaced }, created] = await prisma.$transaction([
    prisma.transaction.deleteMany({
      where: {
        bank,
        date: { gte: new Date(min), lte: new Date(max) },
        NOT: { text: { startsWith: "OPENING BALANCE", mode: "insensitive" } },
      },
    }),
    prisma.transaction.createMany({
      data: rows.map((r) => ({
        date: new Date(r.date),
        bank,
        text: r.text,
        amount: r.amount,
      })),
    }),
  ]);

  return NextResponse.json({ bank, imported: created.count, replaced, outsideMonth });
}
