import { useEffect, useState } from 'react';
import { getCodingProblems, getCodingResult, submitCode, type CodingResult } from '@/services/coding.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function CodingPracticeSection({ studentId }: { studentId: string }) {
  const { data, loading, error, refresh } = useCommunityData(getCodingProblems);
  const [problemId, setProblemId] = useState('sum-of-readings');
  const [languageId, setLanguageId] = useState(71);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem(`placement-decode.code.${studentId}`) || '{}'); return saved && typeof saved === 'object' && !Array.isArray(saved) ? Object.fromEntries(Object.entries(saved).filter(([, value]) => typeof value === 'string')) : {}; }
    catch { return {}; }
  });
  const [result, setResult] = useState<CodingResult | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [request, setRequest] = useState<{ id: string; mode: 'run' | 'submit' } | null>(null);
  const key = `${problemId}:${languageId}`;
  const problem = data?.problems.find(item => item.id === problemId);
  const language = data?.languages.find(item => item.id === languageId);
  const source = drafts[key] ?? language?.starter ?? '';

  useEffect(() => {
    try { localStorage.setItem(`placement-decode.code.${studentId}`, JSON.stringify(drafts)); }
    catch { setStorageError(true); }
  }, [drafts, studentId]);
  useEffect(() => {
    if (!result) setResult(data?.recent.find(item => item.active) || null);
  }, [data, result]);
  useEffect(() => {
    if (!result?.active) return;
    let alive = true;
    let timer: number;
    const poll = async () => {
      if (document.hidden) { timer = window.setTimeout(poll, 2000); return; }
      try {
        const response = await getCodingResult(result.id);
        if (alive) { setResult(response.submission); setActionError(''); }
      } catch (reason) {
        if (alive) setActionError(reason instanceof Error ? reason.message : 'Unable to load execution result');
      } finally {
        if (alive) timer = window.setTimeout(poll, 3000);
      }
    };
    timer = window.setTimeout(poll, 1500);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [result]);

  async function execute(mode: 'run' | 'submit') {
    if (!problem) return;
    setPending(true); setActionError('');
    const id = request?.mode === mode ? request.id : crypto.randomUUID();
    setRequest({ id, mode });
    try {
      const response = await submitCode({ problemId, languageId, source, mode, requestId: id });
      setResult(response.submission); setRequest(null);
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to execute code'); }
    finally { setPending(false); }
  }
  if (!data && loading) return <PageSkeleton label="Loading coding practice" />;
  if (!data) return <LoadError message={error} onRetry={refresh} />;
  const busy = pending || !!result?.active;
  return <section className="space-y-5">
    <div><h1 className="text-2xl font-semibold">Coding practice</h1><p className="mt-2 text-sm text-muted-foreground">Solve a problem, check the sample, and submit your solution.</p></div>
    {!data.configured && <p role="status" className="rounded-lg border bg-white p-4 text-sm">Code execution is awaiting administrator setup. You can read problems and save code drafts.</p>}
    {storageError && <p role="status" className="text-sm text-muted-foreground">This browser couldn’t save your code drafts.</p>}
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <div className="space-y-4">
        <label className="block text-sm font-medium">Problem<select className="mt-2 h-11 w-full rounded-lg border bg-white px-3" value={problemId} disabled={busy} onChange={event => { setProblemId(event.target.value); setRequest(null); setResult(null); }}>{data.problems.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        {problem && <Card><CardHeader><CardTitle>{problem.title}</CardTitle><p className="text-sm text-muted-foreground">{problem.topic} · {problem.difficulty}</p></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6">{problem.description}</p><div><h3 className="text-sm font-semibold">Sample input</h3><pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">{problem.sample.input}</pre></div><div><h3 className="text-sm font-semibold">Expected output</h3><pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">{problem.sample.output}</pre></div></CardContent></Card>}
      </div>
      <div className="min-w-0 space-y-3">
        <label className="block text-sm font-medium">Language<select aria-label="Language" className="mt-2 h-11 w-full rounded-lg border bg-white px-3" value={languageId} disabled={busy} onChange={event => { setLanguageId(Number(event.target.value)); setRequest(null); }}>{data.languages.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block text-sm font-medium">Solution<textarea aria-label="Solution" spellCheck={false} maxLength={30000} disabled={pending} value={source} onChange={event => { setDrafts(previous => ({ ...previous, [key]: event.target.value })); setRequest(null); }} className="mt-2 min-h-80 w-full rounded-xl border bg-slate-950 p-4 font-mono text-sm text-slate-100" /></label>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || !data.configured || !source.trim()} onClick={() => void execute('run')}>Run sample</Button><Button disabled={busy || !data.configured || !source.trim()} onClick={() => void execute('submit')}>{busy ? 'Executing…' : 'Submit solution'}</Button></div>
        {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
        {result && <div role="status" className="space-y-2 rounded-xl border bg-white p-4"><p className="font-medium">{data.problems.find(item => item.id === result.problemId)?.title} · {result.mode === 'run' ? 'Sample run' : 'Submission'}</p><p className="text-sm">{result.status}{!result.active && ` · ${result.passed}/${result.total} tests passed`}</p>{result.output && <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words text-sm">{result.output}</pre>}</div>}
      </div>
    </div>
  </section>;
}
