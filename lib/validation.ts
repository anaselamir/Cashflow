import { z } from "zod";

export const transactionInput = z.object({
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "date must be a valid date",
  }),
  bank: z.string().trim().min(1, "bank is required"),
  text: z.string().trim().min(1, "description is required"),
  amount: z.number().finite("amount must be a finite number"),
});

export const transactionUpdateInput = transactionInput.partial();

export const settingsInput = z.object({
  visibleWeeks: z.array(z.string()),
});

export const bankCsvImportInput = z.object({
  content: z.string().min(1, "CSV content is required"),
});
