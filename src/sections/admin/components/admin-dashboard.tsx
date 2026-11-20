import { ResourcePanel } from '@/components/common/resource-panel';
import type { ResourceStatus } from '@/hooks/use-api-resource';
import { DashboardMetric } from '@/components/common/dashboard-metric';
import { EmptyState } from '@/components/common/empty-state';
import { SectionIntro } from '@/components/common/section-intro';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { AdminAssessment, AdminStudentRow, AdminTask, CoordinatorRow, SectionRow } from '@/types/admin';
export function AdminDashboard({ sections, students, assessments, resources }: {
  resources: { students: ResourceStatus; cohorts: ResourceStatus; assessments: ResourceStatus };
  sections: SectionRow[]; students: AdminStudentRow[]; coordinators: CoordinatorRow[]; tasks: AdminTask[]; assessments: AdminAssessment[]; loading: boolean; loadError: string; onAction: (message: string) => void;
}) {
  const base = window.location.pathname.startsWith('/teacher') ? '/teacher' : '/admin';
  const metrics = [
    { label: 'Students', value: students.length, path: 'students', resource: resources.students },
    { label: 'Active cohorts', value: sections.filter(s => s.status === 'Active').length, path: 'cohorts', resource: resources.cohorts },
    { label: 'Released assessments', value: assessments.filter(a => a.status.startsWith('active') || a.status.startsWith('scheduled')).length, path: 'assessments', resource: resources.assessments },
    { label: 'Draft assessments', value: assessments.filter(a => a.status.startsWith('draft')).length, path: 'assessments', resource: resources.assessments },
  ];
  return <><SectionIntro eyebrow="Organization workspace" title="Learning overview" description="Manage cohorts, publish assessments, and review student performance." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => (
    <DashboardMetric key={metric.label} label={metric.label}
      value={<ResourcePanel resource={metric.resource} label={metric.label}>
        <a className="hover:text-primary hover:underline" aria-label={`View ${metric.label.toLowerCase()}`} href={`${base}/${metric.path}`}>{metric.value}</a>
      </ResourcePanel>} />
  ))}</div><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Your cohorts</CardTitle></CardHeader><CardContent><ResourcePanel resource={resources.cohorts} label="Cohorts"><div className="grid gap-3 sm:grid-cols-2">{sections.map(s => <a key={s.id} href={`${base}/cohorts`} className="rounded-lg border p-4 hover:border-primary"><h3 className="font-semibold">{s.name}</h3><p className="mt-2 text-sm text-muted-foreground">{resources.students.initialized ? students.filter(u => u.sectionId === s.id || u.cohortIds?.includes(s.id)).length : "…"} participants</p><p className="mt-1 text-sm">{s.coordinator}</p></a>)}{!sections.length && <div className="sm:col-span-2"><EmptyState title="No cohorts yet" description="Cohorts appear here once they are created." /></div>}</div></ResourcePanel></CardContent></Card><Card><CardHeader><CardTitle>Assessment activity</CardTitle></CardHeader><CardContent className="space-y-3"><ResourcePanel resource={resources.assessments} label="Assessment activity">{assessments.slice(0, 6).map(a => <a key={a.id} href={`${base}/assessments`} className="block rounded-lg border p-4 hover:border-primary"><h3 className="font-semibold">{a.title}</h3><p className="mt-1 text-sm text-muted-foreground">{a.status} · {a.assignedTo}</p></a>)}{!assessments.length && <EmptyState title="No assessments yet" description="Draft and released assessments appear here." />}</ResourcePanel><a className="block text-sm text-primary underline" href={`${base}/readiness`}>View progress and leaderboard</a></CardContent></Card></div></>;
}
