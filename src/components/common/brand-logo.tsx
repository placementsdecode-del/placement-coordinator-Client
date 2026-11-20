import { cn } from "@/lib/utils";

export function BrandLogo({ compact = false, subtitle = "Student" }: { compact?: boolean; subtitle?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
        <span className="text-base font-black">P</span>
        <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-accent" />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-bold", compact && "sr-only")}>Placement Decode</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      ) : null}
    </div>
  );
}
