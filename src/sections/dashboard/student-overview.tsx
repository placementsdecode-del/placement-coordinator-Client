import { getAssessmentCatalog, getReadiness } from '@/services/readiness.api.service';
import { listGroups } from '@/services/groups.api.service';
import { listNotifications } from '@/services/notifications.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { LoadError, PageSkeleton } from '@/components/common/loading-state';
import { SectionIntro } from '@/components/common/section-intro';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { NavLabel } from '@/types/student';
const load = async () => { const [catalog, groups, notifications, readiness] = await Promise.all([getAssessmentCatalog(), listGroups(), listNotifications(), getReadiness({})]); return { catalog, groups, notifications, readiness }; };
export function StudentOverview({ onNavigate }: { onNavigate: (nav: NavLabel) => void }) {
  const { data, loading, error, refresh } = useCommunityData(load);
  if (!data && loading) return <PageSkeleton label="Loading your overview" />;
  if (error || !data) return <LoadError message={error} onRetry={refresh} />;
  const available = data.catalog.assessments.filter(a => a.status === 'active' && (a.attempts.length < a.attemptsAllowed || a.attempts.some(t => t.status === 'in-progress')));
  return <><SectionIntro eyebrow="Today" title="Your learning overview" description="Assessments, conversations, and recent activity." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
    { label: 'Available assessments', value: available.length, nav: 'Assessments' as NavLabel },
    { label: 'Unread group messages', value: data.groups.groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0), nav: 'My Groups' as NavLabel },
    { label: 'Unread notifications', value: data.notifications.unreadCount, nav: 'Tasks & Activities' as NavLabel },
    { label: 'Assessments completed', value: data.readiness.activity.assessmentsCompleted, nav: 'Progress' as NavLabel },
  ].map(item => <button key={item.label} onClick={() => onNavigate(item.nav)} className="rounded-xl border bg-white p-5 text-left hover:border-primary"><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-3xl font-semibold">{item.value}</p></button>)}</div><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Released assessments</CardTitle></CardHeader><CardContent className="space-y-3">{available.length ? available.slice(0, 5).map(a => <button key={a._id} onClick={() => onNavigate('Assessments')} className="w-full rounded-lg border p-3 text-left"><p className="font-medium">{a.title}</p><p className="text-sm text-muted-foreground">{a.category} · {a.durationMinutes} minutes</p></button>) : <p>No assessments waiting for you.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Recent learning activity</CardTitle></CardHeader><CardContent>{data.readiness.daily.some(day => day.minutes > 0) ? <div className="flex h-40 items-end gap-1" role="img" aria-label="Learning minutes over the last 14 days">{data.readiness.daily.slice(-14).map(day => <div key={day.day} className="flex h-full flex-1 items-end" title={`${day.day}: ${day.minutes} minutes`}><div className="w-full rounded-t bg-primary" style={{ height: `${Math.max(2, day.minutes / Math.max(...data.readiness.daily.slice(-14).map(d => d.minutes), 1) * 100)}%` }} /></div>)}</div> : <p className="text-sm text-muted-foreground">Your activity graph will appear as you study.</p>}<Button variant="outline" className="mt-4" onClick={() => onNavigate('Progress')}>View progress</Button></CardContent></Card></div><Card><CardHeader><CardTitle>Latest updates</CardTitle></CardHeader><CardContent className="space-y-3">{data.notifications.notifications.slice(0, 5).map(n => <button key={n._id} className="block w-full rounded-lg border p-3 text-left" onClick={() => onNavigate(n.kind === 'assessment' ? 'Assessments' : n.kind === 'invitation' ? 'My Groups' : 'Tasks & Activities')}><span className="font-medium">{!n.read && '• '}{n.title}</span><p className="text-sm text-muted-foreground">{n.message}</p></button>)}{!data.notifications.notifications.length && <p>No new updates.</p>}</CardContent></Card></>;
}
