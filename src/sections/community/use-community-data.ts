import { useCallback, useEffect, useState } from 'react';
// Keep stale content during explicit refreshes; guard updates after unmount.
export function useCommunityData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => { window.addEventListener("community-changed", refresh); return () => window.removeEventListener("community-changed", refresh); }, [refresh]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    load().then(value => { if (active) { setData(value); setError(''); } }).catch(error => { if (active) setError(error instanceof Error ? error.message : 'Unable to load this page.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, version]);
  return { data, error, loading, refresh };
}
