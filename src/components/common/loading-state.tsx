import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return <div role="status" aria-label="Loading content" className={cn("space-y-3", className)}>
    {Array.from({ length: rows }, (_, index) => <div key={index} aria-hidden="true" className="flex items-center gap-4 rounded-lg border p-4">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-slate-200" />
      <div className="flex-1 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" /><div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" /></div>
    </div>)}
  </div>;
}

export function PageSkeleton({ label = "Loading page" }: { label?: string }) {
  return <section aria-busy="true" aria-label={label} className="space-y-6">
    <span role="status" className="sr-only">{label}</span>
    <div aria-hidden="true" className="space-y-3 border-b pb-5"><div className="h-3 w-24 animate-pulse rounded bg-slate-200" /><div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-slate-200" /><div className="h-4 w-3/4 max-w-xl animate-pulse rounded bg-slate-200" /></div>
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Card key={index}><CardContent className="space-y-4 p-5"><div className="h-3 w-24 animate-pulse rounded bg-slate-200" /><div className="h-8 w-16 animate-pulse rounded bg-slate-200" /></CardContent></Card>)}</div>
    <Card><CardContent className="p-5"><SkeletonRows /></CardContent></Card>
  </section>;
}

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
  return <PageSkeleton label={label} />;
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Card><CardContent className="space-y-3 p-6"><h2 className="text-lg font-semibold">Unable to load this page</h2><p role="alert" className="text-sm text-destructive">{message}</p><Button variant="outline" onClick={onRetry}>Try again</Button></CardContent></Card>;
}
