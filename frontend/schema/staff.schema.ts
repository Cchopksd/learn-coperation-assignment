import { z } from "zod";

export const STAFF_ROLES = ["HQ_STAFF", "BRANCH_STAFF", "TEACHER"] as const;

export const staffSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    role: z.enum(STAFF_ROLES),
    branchId: z.string().optional(),
  })
  .refine((d) => d.role === "HQ_STAFF" || Boolean(d.branchId), {
    message: "Branch staff and teachers require a branch.",
    path: ["branchId"],
  });

export type StaffFormValues = z.infer<typeof staffSchema>;
