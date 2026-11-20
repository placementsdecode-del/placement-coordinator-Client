import { ArrowRight, BookOpen, ClipboardCheck, Compass, ListChecks, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonRows } from '@/components/common/loading-state';
import { useCommunityData } from '@/sections/community/use-community-data';
import { getAssessmentSummary } from '@/services/readiness.api.service';
import type { NavLabel } from '@/types/student';

const shortcuts = [
  { label: 'Tasks & Activities', description: 'See work and updates from your coordinators.', icon: ListChecks },
  { label: 'My Groups', description: 'Join discussions and practise with peers.', icon: Users },
  { label: 'Progress', description: 'Review your results and placement readiness.', icon: TrendingUp },
] as const;

export function StudentOverview({ onNavigate }: { onNavigate: (nav: NavLabel, itemId?: string) => void }) {
  const { data, loading, error, refresh } = useCommunityData(getAssessmentSummary);
  const available = data?.assessments.filter(assessment =>
    assessment.attempts.length < assessment.attemptsAllowed ||
    assessment.attempts.some(attempt => attempt.status === 'in-progress')
  ) || [];

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

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg"><ClipboardCheck aria-hidden="true" className="h-5 w-5 text-primary" />Assessments</CardTitle>
          <Button variant="outline" size="sm" onClick={() => onNavigate('Assessments')}>View all</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
            <p role="alert" className="flex-1 text-sm text-muted-foreground">We couldn’t refresh your assessments.</p>
            <Button variant="outline" size="sm" disabled={loading} onClick={refresh}>Try again</Button>
          </div>}
          {!data && loading && <SkeletonRows rows={2} />}
          {data && (available.length > 0 ? available.slice(0, 5).map(assessment => {
            const started = assessment.attempts.some(attempt => attempt.status === 'in-progress');
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
          }) : <p className="text-sm text-muted-foreground">You’re caught up on assigned assessments.</p>)}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
