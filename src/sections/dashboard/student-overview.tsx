import { ArrowRight, BookOpen, ClipboardCheck, Compass, ListChecks, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonRows } from '@/components/common/loading-state';
import { useCommunityData } from '@/sections/community/use-community-data';
import { getAssessmentSummary, getReadinessSummary } from '@/services/readiness.api.service';
import { getMyWork } from '@/services/community.api.service';
import { scoreText } from '@/lib/utils';
import type { NavLabel } from '@/types/student';

const shortcuts = [
  { label: 'My Groups', description: 'Join discussions and practise with peers.', icon: Users },
] as const;

function OverviewLoadError({ onRetry }: { onRetry: () => void }) {
  return <div className="flex flex-wrap items-center gap-2 pb-3">
    <p role="alert" className="flex-1 text-sm text-destructive">We couldn’t refresh this section.</p>
    <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
  </div>;
}

function PlacementProgress({ onOpen }: { onOpen: () => void }) {
  const { data, error, refresh } = useCommunityData(getReadinessSummary);
  const next = data?.skills.find(skill => skill.mandatory && (!skill.enough || (skill.score !== null && skill.score < skill.minimum)));
  return <Card>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
      <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp aria-hidden="true" className="size-5 text-primary" />Placement preparation</CardTitle>
      <Button variant="outline" size="sm" onClick={onOpen}>View progress</Button>
    </CardHeader>
    <CardContent className="space-y-4">
      {error && <OverviewLoadError onRetry={refresh} />}
      {!data ? !error && <SkeletonRows rows={2} /> : <>
        <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Readiness</p><p className="font-semibold">{data.status}{data.overall !== null && ` · ${scoreText(data.overall)} / 10`}</p></div>
          <div><p className="text-xs text-muted-foreground">Eligibility</p><p className="font-semibold">{data.eligibility.status}</p></div>
        </div>
        <p className="text-sm text-muted-foreground">Last 3 months · {data.activity.assessmentsCompleted} assessments submitted · {data.activity.activeDays} active learning days</p>
        <div className="space-y-3">
          {data.skills.filter(skill => ['coding', 'dsa'].includes(skill.key)).map(skill => <div key={skill.key} className="space-y-1">
            <div className="flex flex-wrap justify-between gap-1 text-sm"><span className="font-medium">{skill.label}</span><span className="tabular-nums text-muted-foreground">{skill.score === null ? 'Not evaluated' : `${scoreText(skill.score)} / 10`}</span></div>
            {skill.score !== null && <progress aria-label={`${skill.label} score`} className="block h-2 w-full accent-primary" max={10} value={skill.score} />}
          </div>)}
        </div>
        {next && <p className="rounded-lg border p-3 text-sm"><strong className="font-semibold">Next step</strong><span className="block text-muted-foreground">{next.recommendation}</span></p>}
      </>}
    </CardContent>
  </Card>;
}

function AssignedWorkOverview({ onNavigate }: { onNavigate: (nav: NavLabel, itemId?: string) => void }) {
  const { data, error, refresh } = useCommunityData(getMyWork);
  const assigned = data?.work.filter(item => !['announcement', 'assessment'].includes(item.kind));
  const pending = assigned?.filter(item => !item.submission) ?? [];
  return <Card>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
      <CardTitle className="flex items-center gap-2 text-lg"><ListChecks aria-hidden="true" className="size-5 text-primary" />Assigned work</CardTitle>
      <Button variant="outline" size="sm" onClick={() => onNavigate('Tasks & Activities')}>View tasks</Button>
    </CardHeader>
    <CardContent className="space-y-2">
      {error && <OverviewLoadError onRetry={refresh} />}
      {!assigned ? !error && <SkeletonRows rows={2} /> : <>
        <p className="text-sm text-muted-foreground">{pending.length} pending · {assigned.length - pending.length} submitted</p>
        {pending.length ? pending.slice(0, 3).map(item => <button key={item._id} type="button" onClick={() => onNavigate('Tasks & Activities', item._id)} className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm font-medium hover:bg-muted">
          <span className="min-w-0 break-words">{item.title}<span className="block text-xs capitalize text-muted-foreground">{item.kind}</span></span>
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-primary" />
        </button>) : <p className="text-sm text-muted-foreground">No assignments awaiting a response.</p>}
      </>}
    </CardContent>
  </Card>;
}

export function StudentOverview({ onNavigate }: { onNavigate: (nav: NavLabel, itemId?: string) => void }) {
  const { data, loading, error, refresh } = useCommunityData(getAssessmentSummary);
  const hasActiveAttempt = (assessment: NonNullable<typeof data>['assessments'][number]) =>
    assessment.attempts.some(attempt => attempt.status === 'in-progress');
  const available = data?.assessments
    .filter(assessment => assessment.attempts.length < assessment.attemptsAllowed || hasActiveAttempt(assessment))
    .sort((a, b) => Number(hasActiveAttempt(b)) - Number(hasActiveAttempt(a))) ?? [];

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-2xl border bg-white p-5 sm:p-7" aria-labelledby="student-overview-title">
        <h1 id="student-overview-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Your learning overview</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Pick a topic you want to study, or explore the skills you’ll need for a role you’re interested in.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => onNavigate('Study Materials')}><BookOpen aria-hidden="true" className="mr-2 h-4 w-4" />Browse study guides</Button>
          <Button variant="outline" onClick={() => onNavigate('Career Roadmaps')}><Compass aria-hidden="true" className="mr-2 h-4 w-4" />Explore career paths</Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg"><ClipboardCheck aria-hidden="true" className="h-5 w-5 text-primary" />Continue learning</CardTitle>
          <Button variant="outline" size="sm" onClick={() => onNavigate('Assessments')}>All assessments</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && <OverviewLoadError onRetry={refresh} />}
          {!data && loading && <SkeletonRows rows={2} />}
          {data && (available.length > 0 ? available.slice(0, 5).map(assessment => {
            const started = hasActiveAttempt(assessment);
            return (
              <button
                key={assessment._id}
                type="button"
                onClick={() => onNavigate('Assessments', assessment._id)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
              >
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-medium">{assessment.title}</span>
                  <span className="block text-sm text-muted-foreground">{assessment.category} · {assessment.durationMinutes} min</span>
                </span>
                <span className="text-sm font-medium text-primary">{started ? 'Resume' : 'Open'}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
              </button>
            );
          }) : <p className="text-sm text-muted-foreground">No assessments available to start right now.</p>)}
          {!!data?.upcoming?.length && <section className="space-y-2 border-t pt-3" aria-label="Upcoming assessments">
            <h3 className="text-sm font-semibold">Upcoming assessments</h3>
            {data.upcoming.slice(0, 3).map(assessment => <Button key={assessment._id} variant="ghost" className="h-auto w-full justify-start whitespace-normal px-2 text-left" onClick={() => onNavigate('Assessments', assessment._id)}>
              <span className="min-w-0 break-words">{assessment.title}<span className="block text-xs font-normal text-muted-foreground">{assessment.category} · {assessment.durationMinutes} min</span></span>
            </Button>)}
          </section>}
        </CardContent>
      </Card>
      <PlacementProgress onOpen={() => onNavigate('Progress')} />
      </div>
      <AssignedWorkOverview onNavigate={onNavigate} />

      <div className="flex flex-wrap gap-3">
        {shortcuts.map(({ label, description, icon: Icon }) => (
          <button key={label} type="button" onClick={() => onNavigate(label)} className="flex items-start gap-3 rounded-xl border bg-white p-4 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block font-medium">{label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
