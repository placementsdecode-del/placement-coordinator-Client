import { useEffect, useRef, useState } from 'react';
import { recordLearningPulse } from '@/services/readiness.api.service';
const learningPages = new Set(['Study Materials', 'Coding Practice', 'Self-Assessment', 'Assessments', 'Assigned Work', 'Daily Tasks', 'Placement Homework', 'Career Roadmaps']);
export function useLearningTracker(page: string) {
  const pageRef = useRef(page); pageRef.current = page;
  const [syncError, setSyncError] = useState(false);
  useEffect(() => {
    let lastInteraction = performance.now(); let seconds = 0; let sending = false; let active = true;
    const interact = () => { if (!document.hidden) lastInteraction = performance.now(); };
    const visibility = () => { lastInteraction = document.hidden ? -Infinity : performance.now(); };
    const events = ['pointerdown', 'keydown', 'scroll', 'pointermove'];
    for (const event of events) window.addEventListener(event, interact, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    const timer = window.setInterval(() => {
      if (learningPages.has(pageRef.current) && !document.hidden && document.hasFocus() && performance.now() - lastInteraction < 60000) seconds = Math.min(30, seconds + 1);
    }, 1000);
    const flush = window.setInterval(async () => {
      if (sending || !seconds) return;
      sending = true; const count = seconds; seconds = 0;
      try { await recordLearningPulse(count, pageRef.current); if (active) setSyncError(false); }
      catch { if (active) setSyncError(true); }
      finally { sending = false; }
    }, 30000);
    return () => { active = false; clearInterval(timer); clearInterval(flush); for (const event of events) window.removeEventListener(event, interact); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return syncError;
}
