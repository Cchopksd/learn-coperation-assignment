/**
 * Renders a credit delta with sign + colour (green for +, red for -),
 * or a plain balance number when `signed` is false.
 */
export function CreditAmount({
  value,
  signed = true,
}: {
  value: number;
  signed?: boolean;
}) {
  if (!signed) {
    return <span className="font-medium text-slate-900">{value}</span>;
  }
  const tone =
    value > 0 ? "text-green-700" : value < 0 ? "text-red-700" : "text-slate-600";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`font-medium tabular-nums ${tone}`}>
      {sign}
      {value}
    </span>
  );
}
