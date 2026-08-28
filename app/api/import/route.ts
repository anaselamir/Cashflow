import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";

type SeedRecord = {
  DATE: string;
  WEEK?: string;
  TEXT: string;
  BANK: string;
  AMOUNT: number;
};

const SEED_PATH = path.join(process.cwd(), "data", "cash_flow_seed_data.json");

export async function POST() {
  const existingCount = await prisma.transaction.count();
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Import already ran — transactions already exist." },
      { status: 409 }
    );
  }

  let raw: string;
  try {
    raw = await readFile(SEED_PATH, "utf-8");
  } catch {
    return NextResponse.json(
      {
        error:
          "Seed file not found at data/cash_flow_seed_data.json. Add it to the project and try again.",
      },
      { status: 404 }
    );
  }

  const records: SeedRecord[] = JSON.parse(raw);

  const result = await prisma.transaction.createMany({
    data: records.map((r) => ({
      date: new Date(r.DATE),
      bank: r.BANK,
      text: r.TEXT,
      amount: r.AMOUNT,
    })),
  });

  return NextResponse.json({ imported: result.count });
}
