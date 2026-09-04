export function ApiNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      API data unavailable: {message}
    </div>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-semibold">{value}</p>
    </div>
  );
}

export function ReadinessPill({ value }: { value: number }) {
  const tone = value >= 85 ? "bg-secondary/15 text-secondary" : value >= 70 ? "bg-accent/20 text-foreground" : "bg-destructive/10 text-destructive";

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${tone}`}>{value >= 85 ? "High" : value >= 70 ? "Medium" : "Low"}</span>;
}
