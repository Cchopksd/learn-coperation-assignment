import { z } from "zod";

export const adjustCreditSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required.")
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) !== 0,
      "Enter a non-zero whole number (use a minus sign to deduct).",
    ),
  reason: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export type AdjustCreditFormValues = z.infer<typeof adjustCreditSchema>;
