import { useCallback, useEffect, useRef, useState } from 'react';

export type ResourceStatus = {
  loading: boolean;
  initialized: boolean;
  error: string;
  refresh: () => Promise<void>;
};

// Each request owns its data and status. A late response cannot replace a newer one.
export function useApiResource<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const mounted = useRef(false);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    if (!mounted.current) return;
    setLoading(true);
    setError('');
    try {
      const result = await load();
      if (mounted.current && sequence.current === request) {
        setData(result);
        setInitialized(true);
      }
    } catch (reason) {
      if (mounted.current && sequence.current === request) setError(reason instanceof Error ? reason.message : 'Unable to load data.');
    } finally {
      if (mounted.current && sequence.current === request) setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; };
  }, [refresh]);
  return { data, setData, loading, initialized, error, refresh };
}
