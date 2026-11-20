import { ResourcePanel } from '@/components/common/resource-panel';
import type { ResourceStatus } from '@/hooks/use-api-resource';
import { getReadiness } from '@/services/readiness.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { scoreText } from '@/lib/utils';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { InfoTip } from '@/components/common/info-tip';
import type { ApiUser } from '@/types/api';
import { addCohortMember, removeCohortMember } from '@/services/sections.api.service';
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ExternalLink, GraduationCap, Plus, UserPlus, Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateSectionForm, CreateStudentForm } from "@/sections/admin/components/student-section-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminStudentRow, SectionRow } from "@/types/admin";

export function StudentDetail({
  student,
  sections,
  onMoveStudent,
}: {
  student: AdminStudentRow | null;
  sections: SectionRow[];
  onMoveStudent: (studentId: string, sectionId: string) => Promise<void>;
}) {
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");

  return (
    <Card id="student-detail" className="w-full max-w-sm scroll-mt-24 self-start 2xl:sticky 2xl:top-24">
      <CardHeader>
        <CardTitle>Student Detail</CardTitle>
        <CardDescription>Contact details and a preparation snapshot.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-background p-4">
          {student ? (
            <>
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="break-words text-lg font-bold">{student.name}</p>
                  <p className="break-words text-sm text-muted-foreground">{student.rollNo} · {student.section}</p>
                </div>
                <Badge variant={student.status === "Active" ? "secondary" : "danger"}>{student.status}</Badge>
              </div>
              <div className="mt-4 grid gap-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                <p>Email: {student.email}</p>
                <p>Phone: {student.phone}</p>
                {!!student.skills?.length && <p>Skills · {student.skills.join(', ')}</p>}
                {student.resumeUrl && <a className="text-primary underline" href={student.resumeUrl} target="_blank" rel="noreferrer">View resume</a>}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No student selected.</p>
          )}
        </div>
        {student && <StudentProgress key={student.id} id={student.id} />}
        {student ? <div className="space-y-2">
          <label className="text-sm font-medium">Primary cohort</label>
          <select
            className="compact-select"
            aria-label="Primary cohort"
            value={student.sectionId || ""}
            disabled={moving}
            onChange={async (event) => {
              setMoving(true);
              setError("");
              try {
                await onMoveStudent(student.id, event.target.value);
              } catch (error) {
                setError(error instanceof Error ? error.message : "Unable to change section.");
              } finally {
                setMoving(false);
              }
            }}
          >
            <option value="">Unassigned — remove from section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id} disabled={section.status !== "Active"}>{section.name} · {section.code}</option>
            ))}
          </select>
          {moving ? <p role="status" className="text-sm text-primary">Saving assignment…</p> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div> : null}
      </CardContent>
    </Card>
  );
}

function StudentProgress({ id }: { id: string }) {
  const load = useCallback(() => getReadiness({}, id), [id]);
  const { data, error, refresh, loading } = useCommunityData(load);
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (loading || hasScrolled.current) return;
    hasScrolled.current = true;
    if (window.innerWidth >= 1536) return;
    // Wait for the snapshot's final height so the page can scroll far enough.
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('student-detail')?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading]);
  const base = window.location.pathname.startsWith('/teacher') ? '/teacher' : '/admin';
  if (error) return <div className="rounded-lg border p-3 text-sm"><p role="alert">{error}</p><button className="mt-2 text-primary underline" onClick={refresh}>Retry progress</button></div>;
  if (!data) return <SkeletonRows rows={2} />;
  return <section aria-label="Preparation snapshot" className="space-y-3">
    <div className="rounded-xl bg-slate-900 p-4 text-white">
      <p className="text-sm text-slate-300">Placement readiness</p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <p className="text-3xl font-semibold tabular-nums">{data.overall === null ? 'Awaiting results' : scoreText(data.overall)}</p>
        {data.overall !== null && <span className="pb-1 text-sm text-slate-400">/ 10</span>}
      </div>
      <p className="mt-2 text-sm text-slate-300">{data.overall === null ? 'Graded assessments will build this score.' : data.status}</p>
    </div>
    <dl className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border p-3"><dt className="text-sm text-muted-foreground">Assessments</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{data.activity.assessmentsCompleted}</dd></div>
      <div className="rounded-lg border p-3"><dt className="text-sm text-muted-foreground">Awaiting review</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{data.activity.pendingReview}</dd></div>
    </dl>
    <a className="flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5" href={`${base}/readiness?student=${encodeURIComponent(id)}`} target="_blank" rel="noopener noreferrer">Open full report<ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" /></a>
  </section>;
}

export function StudentsAdmin({
  tools,
  canManage = true,
  sections,
  students,
  selectedStudent,
  onSelectStudent,
  onCreateStudent,
  onMoveStudent,
  loading,
}: {
  tools?: ReactNode;
  sections: SectionRow[];
  students: AdminStudentRow[];
  selectedStudent: AdminStudentRow | null;
  onSelectStudent: (studentId: string) => void;
  onCreateStudent: (user: {
    name: string;
    email: string;
    phoneNumber: string;
    registrationNumber: string;
    department: string;
    batch: string;
    section?: string;
    password?: string;
  }) => Promise<void>;
  onMoveStudent: (studentId: string, sectionId: string) => Promise<void>;
  loading: boolean;
  canManage?: boolean;
}) {
  const [sectionFilter, setSectionFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const filteredStudents = students.filter((student) =>
    (sectionFilter === "all" || (student.sectionId || "unassigned") === sectionFilter || student.cohortIds?.includes(sectionFilter)) &&
    `${student.name} ${student.email} ${student.rollNo}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <SectionIntro
        eyebrow="Students"
        title="Students"
        description="Filter by cohort, open a student profile, review progress, and move students between sections."
        action={
          canManage ? <Button onClick={() => setShowCreate((value) => !value)}>
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button> : null
        }
      />
      {tools}
      {showCreate ? <CreateStudentForm sections={sections} onCreateStudent={onCreateStudent} /> : null}
      <section className="grid min-w-0 items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Student directory</CardTitle>
            <CardDescription>{filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}{sectionFilter !== 'all' ? ' in this cohort' : ' in your directory'}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,22rem)_minmax(0,13rem)]" role="group" aria-label="Student filters">
              <Input aria-label="Search students" placeholder="Search name, email or registration number" value={search} onChange={event => { setSearch(event.target.value); setVisibleCount(50); }} />
              <select className="compact-select" aria-label="Filter by cohort" value={sectionFilter} onChange={event => { setSectionFilter(event.target.value); setVisibleCount(50); }}>
                <option value="all">All students</option>
                <option value="unassigned">Unassigned</option>
                {sections.map(section => <option key={section.id} value={section.id}>{section.name} · {section.code}</option>)}
              </select>
            </div>
            {loading ? <SkeletonRows rows={4} /> : filteredStudents.length ? (
              <div className="workspace-card-grid" role="group" aria-label="Student cards">
                {filteredStudents.slice(0, visibleCount).map(student => (
                  <button key={student.id} type="button" aria-pressed={selectedStudent?.id === student.id} aria-controls="student-detail"
                    className="workspace-directory-item grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2"
                    onClick={() => onSelectStudent(student.id)}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><GraduationCap className="size-4" /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold" title={student.name}>{student.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{student.rollNo} · {student.section}</span>
                      </span>
                    </span>
                    <Badge variant={student.status === 'Active' ? 'secondary' : 'muted'}>{student.status}</Badge>
                    <span className="col-span-2 mt-1 block truncate text-xs text-muted-foreground" title={student.email}>{student.email}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title={students.length ? "No matching students" : "No students yet"} description={students.length ? "Try a different search or section filter." : "Add your first student and assign a section when ready."} />
            )}
            {filteredStudents.length > visibleCount && <Button variant="outline" onClick={() => setVisibleCount(count => count + 50)}>Show more students</Button>}
          </CardContent>
        </Card>
        <StudentDetail student={selectedStudent} sections={sections} onMoveStudent={onMoveStudent} />
      </section>
    </div>
  );
}


export function SectionsAdmin({ sections, students, onCreateSection, onUpdateSection, onCreateStudent, onMoveStudent, canManage = true, studentsStatus, facultyStatus, faculty, assignments, onAssignCoordinators, onRefresh }: {
  sections: SectionRow[]; students: AdminStudentRow[]; selectedSection: SectionRow | null; selectedStudent: AdminStudentRow | null;
  onCreateSection: (section: SectionRow) => Promise<void>; onUpdateSection: (section: SectionRow) => Promise<void>;
  onSelectSection: (id: string) => void; onSelectStudent: (id: string) => void;
  onCreateStudent: Parameters<typeof StudentsAdmin>[0]['onCreateStudent']; onMoveStudent: (id: string, sectionId: string) => Promise<void>;
  loading: boolean; canManage?: boolean; studentsStatus: ResourceStatus; facultyStatus: ResourceStatus; faculty: ApiUser[]; assignments: Record<string, string[]>;
  onAssignCoordinators: (id: string, teachers: string[]) => Promise<void>; onRefresh: () => Promise<void>;
}) {
  const [opened, setOpened] = useState(''); const [studentId, setStudentId] = useState(''); const [creating, setCreating] = useState(false); const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false); const [assignId, setAssignId] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const cohort = sections.find(s => s.id === opened); const student = students.find(s => s.id === studentId);
  const belongs = (s: AdminStudentRow) => s.sectionId === opened || s.cohortIds?.includes(opened);
  const members = students.filter(belongs);
  async function run(action: () => Promise<void>) { setPending(true); setError(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save'); } finally { setPending(false); } }
  return <><SectionIntro eyebrow="Learning community" title={cohort?.name || 'Cohorts'} description="Organize students by learning purpose and assign faculty to guide each cohort." action={canManage && !opened ? <Button onClick={() => setCreating(v => !v)}><Plus className="h-4 w-4" />Create cohort</Button> : undefined} />
    {cohort && <Breadcrumbs items={[{ label: 'Cohorts', onClick: opened ? () => { setOpened(''); setStudentId(''); setEditing(false); setAdding(false); } : undefined }, ...(cohort ? [{ label: cohort.name, onClick: student ? () => setStudentId('') : undefined }] : []), ...(student ? [{ label: student.name }] : [])]} />}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {creating && !opened && <CreateSectionForm onCreateSection={async s => { await onCreateSection(s); setCreating(false); }} />}
    {student && cohort ? <StudentDetail student={student} sections={sections} onMoveStudent={onMoveStudent} /> : cohort ? <>
      <Card><CardHeader><CardTitle>Coordinators <InfoTip text="Select faculty to monitor this cohort. Assigned coordinators can see its students, publish assessments, and review progress." /></CardTitle><CardDescription>{cohort.description}</CardDescription></CardHeader><CardContent className="space-y-3"><p>{cohort.coordinator}</p>{canManage && <ResourcePanel resource={facultyStatus} label="Coordinators"><div className="grid gap-2 sm:grid-cols-3">{faculty.map(t => { const id = t.id || t._id || ''; const assigned = assignments[cohort.id] || []; return <label key={id} className="flex gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={assigned.includes(id)} disabled={pending} onChange={e => void run(() => onAssignCoordinators(cohort.id, e.target.checked ? [...assigned, id] : assigned.filter(a => a !== id)))} />{t.name}</label>; })}{!faculty.length && <p>Create a faculty account in Coordinators first.</p>}</div></ResourcePanel>}</CardContent></Card>
      <div className="flex flex-wrap gap-2">{canManage && <Button variant="outline" onClick={() => setEditing(v => !v)}>Edit cohort</Button>}<Button variant="outline" onClick={() => setAdding(v => !v)}>Add participants</Button></div>
      {editing && <CreateSectionForm initialSection={cohort} onCreateSection={async s => { await onUpdateSection(s); setEditing(false); }} />}
      {adding && <ResourcePanel resource={studentsStatus} label="Available students"><Card className="workspace-form-panel"><CardContent className="space-y-4 p-5"><form className="flex flex-wrap items-center gap-2" onSubmit={e => { e.preventDefault(); void run(async () => { await addCohortMember(cohort.id, assignId); await onRefresh(); setAssignId(''); }); }}><select aria-label="Student to add" className="compact-select sm:basis-60" value={assignId} onChange={e => setAssignId(e.target.value)}><option value="">Select a student</option>{students.filter(s => !belongs(s)).map(s => <option key={s.id} value={s.id}>{s.name} · {s.rollNo}</option>)}</select><Button disabled={pending || !assignId}>Add to cohort</Button><InfoTip text="Students can join multiple cohorts. Adding a student here keeps their existing memberships." /></form>{canManage && <CreateStudentForm sections={sections} initialSectionId={cohort.id} embedded onCreateStudent={onCreateStudent} />}</CardContent></Card></ResourcePanel>}
      <ResourcePanel resource={studentsStatus} label="Participants"><h2 className="font-semibold">Participants ({members.length})</h2><div className="workspace-card-grid">{members.map(s => <Card key={s.id}><CardContent className="p-4"><button className="w-full text-left" onClick={() => setStudentId(s.id)}><p className="font-semibold">{s.name}</p><p className="text-sm text-muted-foreground">{s.rollNo}</p></button><Button variant="ghost" disabled={pending} className="mt-2" onClick={() => void run(async () => { await removeCohortMember(cohort.id, s.id); await onRefresh(); })}>Remove from cohort</Button></CardContent></Card>)}</div>{!members.length && <p className="text-muted-foreground">No participants yet. Add students to this cohort.</p>}</ResourcePanel>
    </> : sections.length ? <div className="workspace-card-grid">{sections.map(s => <button key={s.id} onClick={() => setOpened(s.id)} className="rounded-xl border bg-white p-5 text-left hover:border-primary"><h2 className="font-semibold">{s.name}</h2><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p><p className="mt-3 text-sm">{studentsStatus.initialized ? students.filter(u => u.sectionId === s.id || u.cohortIds?.includes(s.id)).length : "…"} participants · {s.status}</p><p className="mt-1 text-xs text-muted-foreground">{s.coordinator}</p></button>)}</div> : <EmptyState title="No cohorts yet" description="Created cohorts will appear here with their participants and coordinators." />}
  </>;
}
