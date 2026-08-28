import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transactionUpdateInput } from "@/lib/validation";
import { toTransactionDTO } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = transactionUpdateInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { date, bank, text, amount } = parsed.data;

  try {
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(date !== undefined ? { date: new Date(date) } : {}),
        ...(bank !== undefined ? { bank } : {}),
        ...(text !== undefined ? { text } : {}),
        ...(amount !== undefined ? { amount } : {}),
      },
    });

    return NextResponse.json(toTransactionDTO(updated));
  } catch {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }
}
