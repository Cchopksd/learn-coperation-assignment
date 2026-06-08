import { fetchAPI } from "@/lib/api-client";
import type {
  Booking,
  CreateBookingInput,
  FinalAttendanceStatus,
} from "@/lib/types";

export const bookingService = {
  create: (input: CreateBookingInput) =>
    fetchAPI<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  markAttendance: (
    bookingId: string,
    status: FinalAttendanceStatus,
    note?: string,
  ) =>
    fetchAPI<Booking>(`/bookings/${bookingId}/attendance`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }),
};
