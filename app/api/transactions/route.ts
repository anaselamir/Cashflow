import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transactionInput } from "@/lib/validation";
import { toTransactionDTO } from "@/lib/types";

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "asc" },
  });

  return NextResponse.json(transactions.map(toTransactionDTO));
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = transactionInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { date, bank, text, amount } = parsed.data;

  const created = await prisma.transaction.create({
    data: { date: new Date(date), bank, text, amount },
  });

  return NextResponse.json(toTransactionDTO(created), { status: 201 });
}
