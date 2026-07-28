import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const VISIBLE_MS = 3500;
const FADE_MS = 300;

export function ActionToast({ message, onClose }: { message: string; onClose: () => void }) {
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
    <div
      role="status"
      className={cn(
        "fixed bottom-24 left-3 right-3 z-50 mx-auto max-w-md rounded-lg border bg-white p-3 shadow-soft sm:bottom-5 sm:left-auto sm:right-5",
        leaving
          ? "duration-300 ease-in animate-out fade-out-0 slide-out-to-bottom-2"
          : "duration-200 ease-out animate-in fade-in-0 slide-in-from-bottom-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Check className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium leading-6">{message}</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Dismiss message">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
