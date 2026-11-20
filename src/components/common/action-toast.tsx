import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notice, type NoticeTone } from '@/components/common/notice';

const VISIBLE_MS = 3500;
const FADE_MS = 300;

export function ActionToast({ message, onClose, tone = 'info' }: { message: string; onClose: () => void; tone?: NoticeTone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!message) return;
    setLeaving(false);
    const fade = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const close = setTimeout(onClose, VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(close);
    };
    // onClose is recreated each render; the message is what should restart the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;

  return (
    <Notice
      tone={tone}
      className={cn(
        "fixed bottom-24 left-3 right-3 z-50 mx-auto max-w-md shadow-soft sm:bottom-5 sm:left-auto sm:right-5",
        leaving
          ? "duration-300 ease-in animate-out fade-out-0 slide-out-to-bottom-2"
          : "duration-200 ease-out animate-in fade-in-0 slide-in-from-bottom-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-6">{message}</p>
        <button className="mt-1 shrink-0 text-current opacity-70 hover:opacity-100" onClick={onClose} aria-label="Dismiss message">
          <X className="h-4 w-4" />
        </button>
      </div>
    </Notice>
  );
}
