import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bankCsvImportInput } from "@/lib/validation";
import { parseAnyBankCsv } from "@/lib/csvImport";

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
  let rows;
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

  const result = await prisma.transaction.createMany({
    data: rows.map((r) => ({
      date: new Date(r.date),
      bank,
      text: r.text,
      amount: r.amount,
    })),
  });

  return NextResponse.json({ bank, imported: result.count });
}
