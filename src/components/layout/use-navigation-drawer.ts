import { useLayoutEffect, useRef } from 'react';

export function useNavigationDrawer(open: boolean) {
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useLayoutEffect(() => {
    const target = open ? closeButton.current : wasOpen.current ? trigger.current : null;
    const previous = open ? trigger.current : closeButton.current;
    wasOpen.current = open;
    if (!target) return;

    target.focus({ preventScroll: true });
    // A pointer click or a breakpoint change can return focus while the drawer is moving.
    const timer = window.setTimeout(() => {
      if (document.activeElement === previous || document.activeElement === document.body) {
        target.focus({ preventScroll: true });
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [open]);

  return { trigger, closeButton };
}
