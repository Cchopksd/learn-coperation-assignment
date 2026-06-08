import { z } from "zod";

export const bookingSchema = z.object({
  studentId: z.string().min(1, "Please select a student."),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
