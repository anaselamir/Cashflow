import { weekLabelForDate } from "@/lib/week";

export type TransactionDTO = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  bank: string;
  text: string;
  amount: number;
  week: string;
};

export type SettingsDTO = {
  visibleWeeks: string[];
};

export type PrismaTransactionLike = {
  id: string;
  date: Date;
  bank: string;
  text: string;
  amount: { toNumber(): number };
};

export function toTransactionDTO(t: PrismaTransactionLike): TransactionDTO {
  return {
    id: t.id,
    date: t.date.toISOString().slice(0, 10),
    bank: t.bank,
    text: t.text,
    amount: t.amount.toNumber(),
    week: weekLabelForDate(t.date),
  };
}
