import { z } from "zod";

export const studentSchema = z.object({
  branchId: z.string().min(1, "Please choose a branch."),
  name: z.string().trim().min(1, "Name is required."),
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]),
  phone: z.string().trim().optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
