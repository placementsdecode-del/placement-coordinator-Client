import { getReadiness } from '@/services/readiness.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { ReadinessView } from '@/sections/readiness/readiness-view';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { InfoTip } from '@/components/common/info-tip';
import type { ApiUser } from '@/types/api';
import { addCohortMember, removeCohortMember } from '@/services/sections.api.service';
import { useCallback, useState } from "react";
import { Plus, UserPlus, Users } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle>Student Detail</CardTitle>
        <CardDescription>Personal details, section, groups, progress, and pending work.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-background p-4">
          {student ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.rollNo} · {student.section}</p>
                </div>
                <Badge variant={student.status === "Active" ? "secondary" : "danger"}>{student.status}</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p>Email: {student.email}</p>
                <p>Phone: {student.phone}</p>
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
            className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
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
  const { data, error, refresh } = useCommunityData(load);
  return data ? <ReadinessView report={data} /> : error ? <p role="alert">{error} <button onClick={refresh}>Retry</button></p> : <p>Loading progress…</p>;
}

export function StudentsAdmin({
  canManage = true,
  sections,
  students,
  selectedStudent,
  onSelectStudent,
  onCreateStudent,
  onMoveStudent,
  loading,
}: {
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
  const filteredStudents = students.filter((student) =>
    (sectionFilter === "all" || (student.sectionId || "unassigned") === sectionFilter) &&
    `${student.name} ${student.email} ${student.rollNo}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
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
      {showCreate ? <CreateStudentForm sections={sections} onCreateStudent={onCreateStudent} /> : null}
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Student directory</CardTitle>
              <CardDescription>{filteredStudents.length} students in selected section.</CardDescription>
            </div>
            <select
              className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm md:w-72"
              aria-label="Filter by cohort"
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
            >
              <option value="all">All students</option>
              <option value="unassigned">Unassigned</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{section.name} · {section.code}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input aria-label="Search students" placeholder="Search name, email or registration number" value={search} onChange={(event) => setSearch(event.target.value)} />
            {loading ? <SkeletonRows rows={4} /> : filteredStudents.length ? filteredStudents.map((student) => (
              <button
                key={student.id}
                className={`grid w-full gap-3 rounded-lg border p-3 text-left md:grid-cols-[minmax(0,1fr)_180px_120px] md:items-center ${
                  selectedStudent?.id === student.id ? "border-primary bg-primary/5" : "bg-white"
                }`}
                onClick={() => onSelectStudent(student.id)}
              >
                <div className="min-w-0">
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.rollNo} · {student.email}</p>
                </div>
                <span className="text-sm text-muted-foreground">{student.section}</span>
                <Badge variant="outline">{student.status}</Badge>
              </button>
            )) : (
              <EmptyState icon={Users} title={students.length ? "No matching students" : "No students yet"} description={students.length ? "Try a different search or section filter." : "Add your first student and assign a section when ready."} />
            )}
          </CardContent>
        </Card>
        <StudentDetail student={selectedStudent} sections={sections} onMoveStudent={onMoveStudent} />
      </section>
    </>
  );
}


export function SectionsAdmin({ sections, students, onCreateSection, onUpdateSection, onCreateStudent, onMoveStudent, canManage = true, faculty, assignments, onAssignCoordinators, onRefresh }: {
  sections: SectionRow[]; students: AdminStudentRow[]; selectedSection: SectionRow | null; selectedStudent: AdminStudentRow | null;
  onCreateSection: (section: SectionRow) => Promise<void>; onUpdateSection: (section: SectionRow) => Promise<void>;
  onSelectSection: (id: string) => void; onSelectStudent: (id: string) => void;
  onCreateStudent: Parameters<typeof StudentsAdmin>[0]['onCreateStudent']; onMoveStudent: (id: string, sectionId: string) => Promise<void>;
  loading: boolean; canManage?: boolean; faculty: ApiUser[]; assignments: Record<string, string[]>;
  onAssignCoordinators: (id: string, teachers: string[]) => Promise<void>; onRefresh: () => Promise<void>;
}) {
  const [opened, setOpened] = useState(''); const [studentId, setStudentId] = useState(''); const [creating, setCreating] = useState(false); const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false); const [assignId, setAssignId] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const cohort = sections.find(s => s.id === opened); const student = students.find(s => s.id === studentId);
  const belongs = (s: AdminStudentRow) => s.sectionId === opened || s.cohortIds?.includes(opened);
  const members = students.filter(belongs);
  async function run(action: () => Promise<void>) { setPending(true); setError(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save'); } finally { setPending(false); } }
  return <><SectionIntro eyebrow="Learning community" title={cohort?.name || 'Cohorts'} description="Organize students by learning purpose and assign faculty to guide each cohort." action={canManage && !opened ? <Button onClick={() => setCreating(v => !v)}><Plus className="h-4 w-4" />Create cohort</Button> : undefined} />
    <Breadcrumbs items={[{ label: 'Cohorts', onClick: opened ? () => { setOpened(''); setStudentId(''); setEditing(false); setAdding(false); } : undefined }, ...(cohort ? [{ label: cohort.name, onClick: student ? () => setStudentId('') : undefined }] : []), ...(student ? [{ label: student.name }] : [])]} />
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {creating && !opened && <CreateSectionForm onCreateSection={async s => { await onCreateSection(s); setCreating(false); }} />}
    {student && cohort ? <StudentDetail student={student} sections={sections} onMoveStudent={onMoveStudent} /> : cohort ? <>
      <Card><CardHeader><CardTitle>Coordinators <InfoTip text="Select faculty to monitor this cohort. Assigned coordinators can see its students, publish assessments, and review progress." /></CardTitle><CardDescription>{cohort.description}</CardDescription></CardHeader><CardContent className="space-y-3"><p>{cohort.coordinator}</p>{canManage && <div className="grid gap-2 sm:grid-cols-3">{faculty.map(t => { const id = t.id || t._id || ''; const assigned = assignments[cohort.id] || []; return <label key={id} className="flex gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={assigned.includes(id)} disabled={pending} onChange={e => void run(() => onAssignCoordinators(cohort.id, e.target.checked ? [...assigned, id] : assigned.filter(a => a !== id)))} />{t.name}</label>; })}{!faculty.length && <p>Create a faculty account in Coordinators first.</p>}</div>}</CardContent></Card>
      <div className="flex flex-wrap gap-2">{canManage && <Button variant="outline" onClick={() => setEditing(v => !v)}>Edit cohort</Button>}<Button variant="outline" onClick={() => setAdding(v => !v)}>Add participants</Button></div>
      {editing && <CreateSectionForm initialSection={cohort} onCreateSection={async s => { await onUpdateSection(s); setEditing(false); }} />}
      {adding && <Card><CardContent className="space-y-4 p-5"><form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void run(async () => { await addCohortMember(cohort.id, assignId); await onRefresh(); setAssignId(''); }); }}><select aria-label="Student to add" className="h-11 min-w-0 flex-1 rounded-md border px-3" value={assignId} onChange={e => setAssignId(e.target.value)}><option value="">Select a student</option>{students.filter(s => !belongs(s)).map(s => <option key={s.id} value={s.id}>{s.name} · {s.rollNo}</option>)}</select><Button disabled={pending || !assignId}>Add to cohort</Button><InfoTip text="Students can join multiple cohorts. Adding a student here keeps their existing memberships." /></form>{canManage && <CreateStudentForm sections={sections} initialSectionId={cohort.id} embedded onCreateStudent={onCreateStudent} />}</CardContent></Card>}
      <h2 className="font-semibold">Participants ({members.length})</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{members.map(s => <Card key={s.id}><CardContent className="p-4"><button className="w-full text-left" onClick={() => setStudentId(s.id)}><p className="font-semibold">{s.name}</p><p className="text-sm text-muted-foreground">{s.rollNo}</p></button><Button variant="ghost" disabled={pending} className="mt-2" onClick={() => void run(async () => { await removeCohortMember(cohort.id, s.id); await onRefresh(); })}>Remove from cohort</Button></CardContent></Card>)}</div>{!members.length && <p className="text-muted-foreground">No participants yet. Add students to this cohort.</p>}
    </> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{sections.map(s => <button key={s.id} onClick={() => setOpened(s.id)} className="rounded-xl border bg-white p-5 text-left hover:border-primary"><h2 className="font-semibold">{s.name}</h2><p className="mt-2 text-sm text-muted-foreground">{s.description}</p><p className="mt-3 text-sm">{students.filter(u => u.sectionId === s.id || u.cohortIds?.includes(s.id)).length} participants · {s.status}</p><p className="mt-1 text-xs text-muted-foreground">{s.coordinator}</p></button>)}</div>}
  </>;
}
