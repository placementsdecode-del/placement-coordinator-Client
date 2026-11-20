import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCohortReadiness, getReadiness, recordAcademics, recordShortlistDecision } from '@/services/readiness.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { PageSkeleton, LoadError, SkeletonRows } from '@/components/common/loading-state';
import { SectionIntro } from '@/components/common/section-intro';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CohortLeaderboard } from '@/components/common/cohort-leaderboard';
import { CandidateFilterPanel, ReadinessOverview } from './candidate-filters';
import { CandidateResults } from './candidate-results';
import type { CandidateFilters, ReadinessQuery, ReadinessReport } from '@/types/readiness';
import { FilterBar, ReadinessView, selectClass } from './readiness-view';
import { EvidenceForm } from './evidence-form';
import { PolicyEditor } from './policy-editor';
const emptyCandidateFilters: CandidateFilters = {
  search: '', readiness: '', department: '', batch: '', eligibility: '', skill: '', minimum: '',
};
const initialQuery: ReadinessQuery = { months: '3' };
const tabs = ['Overview', 'Record evaluation', 'Scoring policies'] as const;

export function CoordinatorReadiness() {
  const [selected, setSelected] = useState(() => new URLSearchParams(window.location.search).get('student') || '');
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const [filters, setFilters] = useState(emptyCandidateFilters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const nextSearch = filters.search.trim();
    if (nextSearch === search) return;
    const timer = window.setTimeout(() => {
      setSearch(nextSearch);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.search, search]);

  const minimum = filters.minimum && Number(filters.minimum) >= 0 && Number(filters.minimum) <= 10 ? filters.minimum : '';
  const scope = useMemo(() => ({
    ...query, search, department: filters.department,
    batch: filters.batch, eligibility: filters.eligibility, skill: filters.skill, minimum,
  }), [query, search, filters.department, filters.batch, filters.eligibility, filters.skill, minimum]);
  const request = useMemo(() => ({
    ...scope, page: String(page), readiness: filters.readiness,
  }), [scope, page, filters.readiness]);
  const load = useCallback(async (signal: AbortSignal) => ({
    ...await getCohortReadiness(request, signal), request, scope,
  }), [request, scope]);
  const { data, loading, error, refresh } = useCommunityData(load, !selected);

  function changeFilter(key: keyof CandidateFilters, value: string) {
    setFilters(current => ({ ...current, [key]: value, ...(key === 'skill' ? { minimum: '' } : {}) }));
    if (key !== 'search') setPage(1);
  }

  function changeQuery(next: ReadinessQuery) {
    if (next.policy !== query.policy) setFilters(current => ({ ...current, skill: '', minimum: '' }));
    setQuery(next);
    setPage(1);
  }

  if (selected) return <StudentDrilldown studentId={selected} query={query} onBack={() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('student')) {
      url.searchParams.delete('student');
      window.history.replaceState(window.history.state, '', url);
    }
    setSelected('');
  }} />;

  const waitingForSearch = search !== filters.search.trim();
  const currentData = data?.request === request && !waitingForSearch ? data : undefined;
  const updating = loading || waitingForSearch || (!currentData && !error);
  const recording = tab === 'Record evaluation';
  return <>
    <SectionIntro eyebrow="Readiness" title="Readiness" description="Compare student readiness, review evidence, and record placement decisions."
      action={<Button className="!w-fit" variant="outline" disabled={loading} onClick={refresh}>Refresh</Button>} />
    <div className="flex flex-wrap gap-1.5 sm:gap-2" role="group" aria-label="Readiness workspace">
      {tabs.map(label => <Button key={label} size="sm" className="px-2 sm:px-3" aria-pressed={tab === label} variant={tab === label ? 'default' : 'outline'} onClick={() => setTab(label)}>{label}</Button>)}
    </div>
    <FilterBar policies={data?.policies ?? []} query={query} onChange={changeQuery} />
    {tab === 'Overview' && <ReadinessOverview counts={data?.scope === scope && !waitingForSearch ? data.counts : undefined} readiness={filters.readiness} onSelect={value => changeFilter('readiness', value)} />}
    {tab !== 'Scoring policies' && <CandidateFilterPanel filters={filters} data={data} recording={recording} onChange={changeFilter} onReset={() => {
      setFilters(emptyCandidateFilters);
      setSearch('');
      setPage(1);
    }} />}
    {error && <LoadError message={error} onRetry={refresh} />}
    {tab === 'Scoring policies' ? (
      data && data.request.policy === query.policy ? <PolicyEditor key={data.policy._id} initial={data.policy} onSaved={policy => changeQuery({ ...query, policy: policy._id })} /> :
        !error && <SkeletonRows rows={2} />
    ) : <section aria-label={recording ? 'Evaluation roster' : 'Candidate results'} aria-busy={updating} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{recording ? 'Record evaluation' : 'Shortlist candidates'}</h2>
          <p className="text-sm text-muted-foreground" role="status">{updating ? 'Updating students…' : currentData ? `${currentData.total} matching ${currentData.total === 1 ? 'student' : 'students'} · Page ${currentData.page} of ${Math.max(1, currentData.pages)}` : ''}</p>
        </div>
        {currentData && <div className="flex gap-2" role="group" aria-label="Candidate pages">
          <Button variant="outline" size="sm" disabled={updating || currentData.page <= 1} onClick={() => setPage(currentData.page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={updating || currentData.page >= currentData.pages} onClick={() => setPage(currentData.page + 1)}>Next</Button>
        </div>}
      </div>
      {currentData ? recording && currentData.students.length ? (
        <EvidenceForm key={currentData.policy._id} policy={currentData.policy} students={currentData.students.map(row => row.student)} onSaved={refresh} />
      ) : <CandidateResults rows={currentData.students} policy={currentData.policy} onSelect={setSelected} />
        : !error && <SkeletonRows rows={4} />}
    </section>}
    {tab === 'Overview' && <CohortLeaderboard />}
  </>;
}

function StudentDrilldown({ studentId, query, onBack }: { studentId: string; query: ReadinessQuery; onBack: () => void }) {
  const load = useCallback((signal: AbortSignal) => getReadiness(query, studentId, signal), [query, studentId]);
  const { data, loading, error, refresh } = useCommunityData(load);
  const back = <Button variant="outline" onClick={onBack}>Back to candidates</Button>;
  if (!data && loading) return <div className="space-y-4">{back}<PageSkeleton label="Loading student evidence" /></div>;
  if (!data) return <div className="space-y-4">{back}<LoadError message={error || 'Unable to load student'} onRetry={refresh} /></div>;
  return <div className="space-y-4">{back}{error && <LoadError message={error} onRetry={refresh} />}<h1 className="text-2xl font-semibold">{data.student.name}</h1><ReadinessView report={data} /><DecisionForms report={data} query={query} onSaved={refresh} />
    <Card><CardHeader><CardTitle>Decision history</CardTitle></CardHeader><CardContent className="space-y-3">{data.decisions.length ? data.decisions.map(decision => <div key={decision._id} className="rounded-md border p-3"><p className="font-semibold">{decision.decision}</p><p>{decision.reason}</p><p className="text-xs text-muted-foreground">{decision.recordedBy?.name || 'Coordinator'} · {new Date(decision.createdAt).toLocaleString()}</p></div>) : <p className="text-sm text-muted-foreground">No coordinator decision recorded for this policy version.</p>}</CardContent></Card>
  </div>;
}
function DecisionForms({ report, query, onSaved }: { report: ReadinessReport; query: ReadinessQuery; onSaved: () => void }) {
  const [decision, setDecision] = useState('Hold'); const [reason, setReason] = useState(''); const [cgpa, setCgpa] = useState(String(report.academics?.cgpa ?? '')); const [backlogs, setBacklogs] = useState(String(report.academics?.backlogs ?? '')); const [year, setYear] = useState(String(report.academics?.graduationYear ?? '')); const [academicReason, setAcademicReason] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  async function save(action: () => Promise<unknown>) { setPending(true); setError(''); setMessage(''); try { await action(); setMessage('Record saved.'); onSaved(); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to save record'); } finally { setPending(false); } }
  return <Card><CardHeader><CardTitle>Coordinator decision & academic verification</CardTitle></CardHeader><CardContent className="space-y-5"><form className="space-y-3" onSubmit={event => { event.preventDefault(); void save(() => recordShortlistDecision(report.student.id, { ...query, policy: report.policy._id }, decision, reason)); }}><fieldset disabled={pending} className="space-y-3"><label className="block text-sm font-medium">Coordinator decision<select aria-label="Coordinator decision" className={selectClass} value={decision} onChange={event => setDecision(event.target.value)}>{['Shortlisted', 'Hold', 'Needs Training', 'Not Eligible'].map(value => <option key={value}>{value}</option>)}</select></label><label className="block text-sm font-medium">Decision / override reason<Input required maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} /></label><Button type="submit" disabled={pending}>Record decision</Button><p className="text-xs text-muted-foreground">System recommendation: {report.eligibility.status}. This decision records the policy, evidence IDs, score, window, and your reason for audit.</p></fieldset></form>
    <form className="space-y-3 border-t pt-4" onSubmit={event => { event.preventDefault(); void save(() => recordAcademics(report.student.id, { cgpa: Number(cgpa), backlogs: Number(backlogs), graduationYear: Number(year), reason: academicReason })); }}><fieldset disabled={pending} className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-medium">Verified CGPA<Input type="number" required min="0" max="10" step="0.1" value={cgpa} onChange={event => setCgpa(event.target.value)} /></label><label className="text-sm font-medium">Active backlogs<Input type="number" required min="0" max="100" value={backlogs} onChange={event => setBacklogs(event.target.value)} /></label><label className="text-sm font-medium">Graduation year<Input type="number" required min="2000" max="2100" value={year} onChange={event => setYear(event.target.value)} /></label><label className="text-sm font-medium sm:col-span-3">Verification source / reason<Input required maxLength={2000} value={academicReason} onChange={event => setAcademicReason(event.target.value)} /></label><Button type="submit" disabled={pending}>Record academics</Button></fieldset></form>
    {error && <p role="alert" className="text-destructive">{error}</p>}{message && <p role="status" className="text-primary">{message}</p>}
  </CardContent></Card>;
}
