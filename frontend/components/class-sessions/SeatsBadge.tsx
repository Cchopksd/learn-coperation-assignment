import { StatusBadge } from "@/components/StatusBadge";

export function SeatsBadge({
  booked,
  capacity,
  available,
}: {
  booked: number;
  capacity: number;
  available: number;
}) {
  const tone = available <= 0 ? "destructive" : available <= 2 ? "warning" : "success";
  return (
    <div className="flex items-center gap-2">
      <span className="tabular-nums text-slate-700">
        {booked}/{capacity}
      </span>
      <StatusBadge
        label={available <= 0 ? "Full" : `${available} left`}
        tone={tone}
      />
    </div>
  );
}
