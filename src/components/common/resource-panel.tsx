import type { ReactNode } from 'react';
import type { ResourceStatus } from '@/hooks/use-api-resource';

export function ResourcePanel({ resource, label, children }: { resource: ResourceStatus; label: string; children?: ReactNode }) {
  return <div className="min-w-0 space-y-2" aria-label={label}>
    {resource.loading && <div role="status" className="flex items-center gap-2 py-2 text-sm text-muted-foreground"><span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-primary" />{resource.initialized ? `Updating ${label.toLowerCase()}…` : `Loading ${label.toLowerCase()}…`}</div>}
    {resource.error && <div role="alert" className="rounded-md border border-destructive/30 p-3 text-sm"><p className="text-destructive">Unable to load {label.toLowerCase()}: {resource.error}</p><button type="button" className="mt-2 font-medium text-primary underline" onClick={() => void resource.refresh()}>Retry {label.toLowerCase()}</button></div>}
    {resource.initialized && children}
  </div>;
}
