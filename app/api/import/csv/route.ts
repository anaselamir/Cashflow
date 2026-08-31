import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bankCsvImportInput } from "@/lib/validation";
import { parseAnyBankCsv, type ParsedRow } from "@/lib/csvImport";

function dateRange(rows: ParsedRow[]): { min: string; max: string } {
  const dates = rows.map((r) => r.date).sort();
  return { min: dates[0], max: dates[dates.length - 1] };
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

  // The statement is authoritative for the date range it covers — replace
  // whatever is already on the books for this bank in that window (including
  // provisional/estimated entries) with what the statement actually says.
  // Opening-balance anchors are exempt: they represent the balance carried
  // in before tracking started, not a movement the statement would show, so
  // a statement starting on the same date must not wipe them out.
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

  return NextResponse.json({ bank, imported: created.count, replaced });
}
