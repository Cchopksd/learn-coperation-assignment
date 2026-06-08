import { http } from "@/lib/api-client";
import type {
  Booking,
  CreateBookingInput,
  FinalAttendanceStatus,
} from "@/lib/types";

export const bookingService = {
  create: (input: CreateBookingInput) => http.post<Booking>("/bookings", input),
  markAttendance: (
    bookingId: string,
    status: FinalAttendanceStatus,
    note?: string,
  ) => http.patch<Booking>(`/bookings/${bookingId}/attendance`, { status, note }),
};
