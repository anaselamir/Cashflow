import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { toTransactionDTO } from "@/lib/types";
import { ALL_WEEKS } from "@/lib/week";

export async function GET() {
  const transactions = (
    await prisma.transaction.findMany({ orderBy: { date: "asc" } })
  ).map(toTransactionDTO);

  const banks = Array.from(new Set(transactions.map((t) => t.bank))).sort();

  const pivot: Record<string, Record<string, number>> = {};
  for (const week of ALL_WEEKS) {
    pivot[week] = Object.fromEntries(banks.map((b) => [b, 0]));
  }
  for (const t of transactions) {
    pivot[t.week][t.bank] = (pivot[t.week][t.bank] ?? 0) + t.amount;
  }

  const workbook = new ExcelJS.Workbook();

  const cashFlowSheet = workbook.addWorksheet("CASH FLOW");
  cashFlowSheet.addRow(["WEEK", ...banks, "TOTAL"]);
  const grandTotals = Object.fromEntries(banks.map((b) => [b, 0]));
  let grandTotal = 0;
  for (const week of ALL_WEEKS) {
    const rowValues = banks.map((b) => pivot[week][b] ?? 0);
    const rowTotal = rowValues.reduce((a, b) => a + b, 0);
    banks.forEach((b, i) => (grandTotals[b] += rowValues[i]));
    grandTotal += rowTotal;
    cashFlowSheet.addRow([week, ...rowValues, rowTotal]);
  }
  cashFlowSheet.addRow([
    "GRAND TOTAL",
    ...banks.map((b) => grandTotals[b]),
    grandTotal,
  ]);

  const txSheet = workbook.addWorksheet("TRANSACTIONS");
  txSheet.addRow(["DATE", "WEEK", "BANK", "DESCRIPTION", "AMOUNT"]);
  for (const t of transactions) {
    txSheet.addRow([t.date, t.week, t.bank, t.text, t.amount]);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="cash-flow.xlsx"',
    },
  });
}
