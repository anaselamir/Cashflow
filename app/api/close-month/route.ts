import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const transactions = await prisma.transaction.findMany({
    select: { bank: true, amount: true, date: true },
  });

  if (transactions.length === 0) {
    return NextResponse.json(
      { error: "No transactions to close out." },
      { status: 400 }
    );
  }

  const balances = new Map<string, number>();
  let latestDate = transactions[0].date;
  for (const t of transactions) {
    balances.set(t.bank, (balances.get(t.bank) ?? 0) + t.amount.toNumber());
    if (t.date > latestDate) latestDate = t.date;
  }

  const nextMonthStart = new Date(
    Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth() + 1, 1)
  );

  await prisma.$transaction([
    prisma.transaction.deleteMany({}),
    prisma.transaction.createMany({
      data: Array.from(balances.entries()).map(([bank, amount]) => ({
        date: nextMonthStart,
        bank,
        text: "OPENING BALANCE",
        amount,
      })),
    }),
  ]);

  return NextResponse.json({
    newMonthStart: nextMonthStart.toISOString().slice(0, 10),
    balances: Object.fromEntries(balances),
  });
}
