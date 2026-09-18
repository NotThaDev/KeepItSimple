export function SummaryCard({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}
