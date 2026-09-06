import { useId, useState, type SyntheticEvent } from 'react';
import { Info } from 'lucide-react';
export function InfoTip({ text }: { text: string }) {
  const id = useId();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  function show(event: SyntheticEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 272)), top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 180)) });
  }
  return <span className="inline-flex align-middle"><button type="button" aria-label="More information" aria-describedby={position ? id : undefined} onMouseEnter={show} onFocus={show} onClick={show} onMouseLeave={() => setPosition(null)} onBlur={() => setPosition(null)} onKeyDown={event => { if (event.key === 'Escape') setPosition(null); }} className="rounded-full p-1 text-muted-foreground focus:outline-primary"><Info className="h-4 w-4" /></button>{position && <span id={id} role="tooltip" style={position} className="pointer-events-none fixed z-50 w-64 max-w-[calc(100vw-1rem)] rounded-md border bg-white p-3 text-left text-xs font-normal normal-case leading-5 tracking-normal shadow-lg">{text}</span>}</span>;
}
