import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsInput } from "@/lib/validation";

export async function GET() {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  return NextResponse.json({ visibleWeeks: settings?.visibleWeeks ?? [] });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = settingsInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { visibleWeeks: parsed.data.visibleWeeks },
    create: { id: "singleton", visibleWeeks: parsed.data.visibleWeeks },
  });

  return NextResponse.json({ visibleWeeks: settings.visibleWeeks });
}
