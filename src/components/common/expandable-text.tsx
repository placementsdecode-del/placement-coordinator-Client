import { useId, useState } from 'react';

export function ExpandableText({ text, label = 'text', limit = 400 }: { text: string; label?: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const shortened = text.length > limit;
  return <div className="min-w-0">
    <p id={id} className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{shortened && !expanded ? `${text.slice(0, limit).trimEnd()}…` : text}</p>
    {shortened && <button type="button" aria-controls={id} aria-expanded={expanded} className="mt-1 min-h-11 text-sm font-medium text-primary underline underline-offset-4" onClick={() => setExpanded(value => !value)}>{expanded ? `Show less ${label}` : `Read full ${label}`}</button>}
  </div>;
}
