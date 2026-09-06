import { SectionIntro } from '@/components/common/section-intro';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { AdminAssessment, AdminStudentRow, AdminTask, CoordinatorRow, SectionRow } from '@/types/admin';
export function AdminDashboard({ sections, students, assessments }: {
  sections: SectionRow[]; students: AdminStudentRow[]; coordinators: CoordinatorRow[]; tasks: AdminTask[]; assessments: AdminAssessment[]; loading: boolean; loadError: string; onAction: (message: string) => void;
}) {
  const base = window.location.pathname.startsWith('/teacher') ? '/teacher' : '/admin';
  const metrics = [
    { label: 'Students', value: students.length, path: 'students' },
    { label: 'Active cohorts', value: sections.filter(s => s.status === 'Active').length, path: 'cohorts' },
    { label: 'Released assessments', value: assessments.filter(a => a.status.startsWith('active') || a.status.startsWith('scheduled')).length, path: 'assessments' },
    { label: 'Draft assessments', value: assessments.filter(a => a.status.startsWith('draft')).length, path: 'assessments' },
  ];
  return <><SectionIntro eyebrow="Organization workspace" title="Learning overview" description="Manage cohorts, publish assessments, and review student performance." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(m => <a href={`${base}/${m.path}`} key={m.label} className="rounded-xl border bg-white p-5 hover:border-primary"><p className="text-sm text-muted-foreground">{m.label}</p><p className="mt-2 text-3xl font-semibold">{m.value}</p></a>)}</div><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Your cohorts</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{sections.map(s => <a key={s.id} href={`${base}/cohorts`} className="rounded-lg border p-4 hover:border-primary"><h3 className="font-semibold">{s.name}</h3><p className="mt-2 text-sm text-muted-foreground">{students.filter(u => u.sectionId === s.id || u.cohortIds?.includes(s.id)).length} participants</p><p className="mt-1 text-sm">{s.coordinator}</p></a>)}{!sections.length && <p>No cohorts yet.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Assessment activity</CardTitle></CardHeader><CardContent className="space-y-3">{assessments.slice(0, 6).map(a => <a key={a.id} href={`${base}/assessments`} className="block rounded-lg border p-4 hover:border-primary"><h3 className="font-semibold">{a.title}</h3><p className="mt-1 text-sm text-muted-foreground">{a.status} · {a.assignedTo}</p></a>)}{!assessments.length && <p>No assessments yet.</p>}<a className="block text-sm text-primary underline" href={`${base}/readiness`}>View progress and leaderboard</a></CardContent></Card></div></>;
}
