import { z } from "zod";

export const classSessionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    branchId: z.string().min(1, "Please choose a branch."),
    teacherId: z.string().optional(),
    startTime: z.string().min(1, "Start time is required."),
    endTime: z.string().min(1, "End time is required."),
    capacity: z
      .string()
      .min(1, "Capacity is required.")
      .refine(
        (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
        "Capacity must be a whole number of at least 1.",
      ),
    description: z.string().trim().optional(),
  })
  .refine(
    (d) => new Date(d.endTime).getTime() > new Date(d.startTime).getTime(),
    { message: "End time must be after start time.", path: ["endTime"] },
  );

export type ClassSessionFormValues = z.infer<typeof classSessionSchema>;
