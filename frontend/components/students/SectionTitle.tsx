export function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
      {title}
    </h2>
  );
}
