import { z } from "zod";

export const branchSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters.")
    .max(32, "Code must be at most 32 characters."),
  name: z.string().trim().min(1, "Name is required."),
  address: z.string().trim().optional(),
});

export type BranchFormValues = z.infer<typeof branchSchema>;
