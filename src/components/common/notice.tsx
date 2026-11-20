import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

const styles = {
  info: { icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-900' },
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  warning: { icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-950' },
  error: { icon: AlertCircle, className: 'border-red-200 bg-red-50 text-red-900' },
};

export function Notice({ tone = 'info', children, className }: { tone?: NoticeTone; children: ReactNode; className?: string }) {
  const { icon: Icon, className: toneClass } = styles[tone];
  return <div role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'} className={cn('flex min-w-0 items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm', toneClass, className)}>
    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="min-w-0 break-words [overflow-wrap:anywhere]">{children}</div>
  </div>;
}
