import { useEffect, useRef, useState } from 'react';
import { getAssessmentCatalog, startAssessmentAttempt, saveAssessmentAnswers, submitAssessmentAttempt, getAssessmentReviews, reviewAssessmentAttempt } from '@/services/readiness.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import { SectionIntro } from '@/components/common/section-intro';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Attempt } from '@/types/readiness';
export function AssessmentAttempts() {
  const { data, loading, error, refresh } = useCommunityData(getAssessmentCatalog);
  const [active, setActive] = useState<Attempt | null>(null); const [pending, setPending] = useState(false); const [actionError, setActionError] = useState('');
  if (active) return <AttemptRunner key={active.id} attempt={active} onClose={() => { setActive(null); refresh(); }} />;
  if (!data && loading) return <PageSkeleton label="Loading assessments" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  return <><SectionIntro eyebrow="Demonstrate your skills" title="Assessments" description="Complete assigned assessments. Objective questions are graded automatically; written and coding responses are reviewed against a rubric." action={<Button variant="outline" disabled={loading} onClick={refresh}>Refresh</Button>} />
    {actionError && <p role="alert" className="text-destructive">{actionError}</p>}
    {!data?.assessments.length && <Card><CardContent className="p-6">No assessments assigned yet.</CardContent></Card>}
    {data?.assessments.map(assessment => <Card key={assessment._id}><CardHeader><CardTitle>{assessment.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p>{assessment.instructions}</p><p className="text-sm text-muted-foreground">{assessment.category} · {assessment.difficulty} · {assessment.durationMinutes} minutes · {assessment.totalMarks} marks · {assessment.attempts.length}/{assessment.attemptsAllowed} attempts · {assessment.status}</p>
      <Button disabled={pending || assessment.status !== 'active' || assessment.attempts.length >= assessment.attemptsAllowed && !assessment.attempts.some(attempt => attempt.status === 'in-progress')} onClick={async () => { setPending(true); setActionError(''); try { const result = await startAssessmentAttempt(assessment._id); setActive(result.attempt); } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to start assessment'); } finally { setPending(false); } }}>{pending ? 'Opening…' : assessment.attempts.some(attempt => attempt.status === 'in-progress') ? 'Resume attempt' : 'Start assessment'}</Button>
      {data.attempts.filter(attempt => assessment.attempts.some(row => row.id === attempt.id)).map(attempt => <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"><span>Attempt {attempt.attemptNumber} · {attempt.status} · {attempt.score === null ? 'Not graded' : `${attempt.score}/${attempt.totalMarks}`}</span><Button variant="outline" onClick={() => setActive(attempt)}>View attempt</Button></div>)}
    </CardContent></Card>)}</>;
}
function AttemptRunner({ attempt, onClose }: { attempt: Attempt; onClose: () => void }) {
  const [current, setCurrent] = useState(attempt); const [answers, setAnswers] = useState<Attempt['answers']>(() => attempt.questions.map((_, index) => attempt.answers[index] ?? ''));
  const [now, setNow] = useState(Date.now()); const [pending, setPending] = useState(false); const [sync, setSync] = useState(''); const [error, setError] = useState('');
  const latest = useRef(answers); const dirty = useRef(false); const saving = useRef(false);
  const expired = now > +new Date(current.dueAt); const editable = current.status === 'in-progress' && !expired;
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (current.status !== 'in-progress') return;
    const timer = setInterval(async () => {
      if (!dirty.current || saving.current || Date.now() > +new Date(current.dueAt)) return;
      saving.current = true; const snapshot = latest.current;
      try { await saveAssessmentAnswers(current, snapshot); if (snapshot === latest.current) dirty.current = false; setSync('Answers saved'); setError(''); }
      catch (error) { setError(error instanceof Error ? error.message : 'Autosave failed. Keep this page open and retry.'); }
      finally { saving.current = false; }
    }, 3000);
    return () => clearInterval(timer);
  }, [current]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty.current) event.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const remaining = Math.max(0, Math.ceil((+new Date(current.dueAt) - now) / 1000));
  function update(index: number, value: string | string[]) { const next = answers.map((answer, i) => i === index ? value : answer); latest.current = next; dirty.current = true; setAnswers(next); setSync('Unsaved changes'); }
  return <><SectionIntro eyebrow={`Attempt ${current.attemptNumber}`} title={current.title} description={`${current.skill} · ${current.difficulty} · ${current.totalMarks} marks`} />
    <div className="sticky top-16 z-10 flex flex-wrap justify-between gap-2 rounded-lg border bg-white p-4"><p className="font-semibold">{current.status === 'in-progress' ? `Time remaining ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : current.status === 'graded' ? `Score ${current.score}/${current.totalMarks}` : 'Submitted — awaiting instructor review'}</p><p role="status" className="text-sm">{sync}</p></div>
    {expired && current.status === 'in-progress' && <p role="alert" className="text-amber-700">Time has ended. Submit to finalize answers saved before the deadline.</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <fieldset disabled={!editable || pending} className="space-y-4">{current.questions.map((question, index) => <Card key={question.id}><CardHeader><CardTitle>Q{index + 1}. {question.text}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-xs text-muted-foreground">{question.marks} marks · {question.type}</p>{['single-choice', 'multiple-choice', 'true-false'].includes(question.type) ? (question.type === 'true-false' ? ['true', 'false'] : question.options).map((option, optionIndex) => <label key={optionIndex} className="flex items-center gap-3 rounded-md border p-3"><input type={question.type === 'multiple-choice' ? 'checkbox' : 'radio'} name={`question-${index}`} checked={question.type === 'multiple-choice' ? Array.isArray(answers[index]) && (answers[index] as string[]).includes(option) : answers[index] === option} onChange={event => { if (question.type === 'multiple-choice') { const selected = Array.isArray(answers[index]) ? answers[index] as string[] : []; update(index, event.target.checked ? [...selected, option] : selected.filter(value => value !== option)); } else update(index, option); }} />{option}</label>) : <textarea aria-label={`Answer ${index + 1}`} className="min-h-32 w-full rounded-md border p-3" maxLength={10000} value={typeof answers[index] === 'string' ? answers[index] as string : ''} onChange={event => update(index, event.target.value)} />}</CardContent></Card>)}</fieldset>
    {current.feedback && <Card><CardContent className="space-y-2 p-5"><p className="font-semibold">Instructor feedback</p><p>{current.feedback}</p><p className="text-sm text-muted-foreground">Rubric: {current.rubric}</p></CardContent></Card>}
    <div className="flex flex-wrap gap-2">{current.status === 'in-progress' && <Button disabled={pending} onClick={async () => { setPending(true); setError(''); try { const result = await submitAssessmentAttempt(current, latest.current); setCurrent(result.attempt); setAnswers(result.attempt.answers); latest.current = result.attempt.answers; dirty.current = false; setSync('Submitted'); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to submit'); } finally { setPending(false); } }}>{pending ? 'Submitting…' : 'Submit assessment'}</Button>}<Button variant="outline" disabled={pending} onClick={async () => { if (dirty.current && editable) { setPending(true); try { await saveAssessmentAnswers(current, latest.current); dirty.current = false; onClose(); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to save'); } finally { setPending(false); } } else onClose(); }}>Back to assessments</Button></div>
  </>;
}
export function AssessmentReviewQueue() {
  const { data, loading, error, refresh } = useCommunityData(getAssessmentReviews);
  if (!data && loading) return <PageSkeleton label="Loading review queue" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Review submitted written and coding responses. Automatic marks are retained; every manual review requires a rubric and feedback.</p>{data?.attempts.length ? data.attempts.map(attempt => <ReviewForm key={attempt.id} attempt={attempt} onSaved={refresh} />) : <Card><CardContent className="p-5">No attempts waiting for review.</CardContent></Card>}</div>;
}
function ReviewForm({ attempt, onSaved }: { attempt: Attempt; onSaved: () => void }) {
  const [marks, setMarks] = useState(attempt.questions.map((_, index) => String(attempt.automaticMarks?.[index] ?? ''))); const [rubric, setRubric] = useState(''); const [feedback, setFeedback] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  return <Card><CardHeader><CardTitle>{attempt.student?.name} · {attempt.title}</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={async event => { event.preventDefault(); setPending(true); setError(''); try { await reviewAssessmentAttempt(attempt, marks.map(Number), rubric, feedback); onSaved(); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to submit review'); } finally { setPending(false); } }}><fieldset disabled={pending} className="space-y-3">{attempt.questions.map((question, index) => <div key={question.id} className="space-y-2 rounded-md border p-3"><p className="font-semibold">{question.text}</p><pre className="whitespace-pre-wrap break-words text-sm">{Array.isArray(attempt.answers[index]) ? (attempt.answers[index] as string[]).join(', ') : attempt.answers[index] || 'No answer'}</pre><label className="text-sm">Marks (maximum {question.marks})<Input type="number" required min={attempt.automaticMarks?.[index] != null ? undefined : 0} max={question.marks} step="0.1" disabled={attempt.automaticMarks?.[index] != null} value={marks[index]} onChange={event => setMarks(values => values.map((value, i) => i === index ? event.target.value : value))} /></label></div>)}<label className="block text-sm font-medium">Review rubric<textarea required maxLength={5000} className="min-h-24 w-full rounded-md border p-3" value={rubric} onChange={event => setRubric(event.target.value)} /></label><label className="block text-sm font-medium">Feedback<textarea required maxLength={5000} className="min-h-24 w-full rounded-md border p-3" value={feedback} onChange={event => setFeedback(event.target.value)} /></label><Button type="submit" disabled={pending}>{pending ? 'Recording…' : 'Record grade'}</Button></fieldset>{error && <p role="alert" className="text-destructive">{error}</p>}</form></CardContent></Card>;
}
