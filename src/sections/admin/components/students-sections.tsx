import { useEffect, useState } from "react";
import { Eye, Layers, Plus, UserPlus, Users } from "lucide-react";
import { InfoTile, ReadinessPill } from "@/components/common/admin-primitives";
import { DonutProgress } from "@/components/common/donut-progress";
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
  onMoveStudent: (studentId: string, sectionName: string) => Promise<void>;
}) {
  const [moving, setMoving] = useState(false);

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
                <p>Groups: {student.groups}</p>
                <p>Pending work: {student.pending}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No student selected.</p>
          )}
        </div>
        {student ? <div className="grid grid-cols-2 gap-3">
          {[
            ["Aptitude", student.aptitude],
            ["Coding", student.coding],
            ["Communication", student.communication],
            ["Interview", student.interview],
            ["Overall readiness", student.readiness],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-white p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xl font-bold">{value}%</p>
                <ReadinessPill value={Number(value)} />
              </div>
            </div>
          ))}
        </div> : null}
        {student ? <div className="space-y-2">
          <label className="text-sm font-medium">Move to section</label>
          <select
            className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
            value={student.section}
            disabled={moving}
            onChange={async (event) => {
              setMoving(true);
              try {
                await onMoveStudent(student.id, event.target.value);
              } finally {
                setMoving(false);
              }
            }}
          >
            {sections.map((section) => (
              <option key={section.id}>{section.name}</option>
            ))}
          </select>
        </div> : null}
      </CardContent>
    </Card>
  );
}

export function StudentsAdmin({
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
  onMoveStudent: (studentId: string, sectionName: string) => Promise<void>;
  loading: boolean;
}) {
  const [sectionFilter, setSectionFilter] = useState(sections[0]?.name ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const filteredStudents = students.filter((student) => student.section === sectionFilter);

  useEffect(() => {
    setSectionFilter((current) => current || sections[0]?.name || "");
  }, [sections]);

  return (
    <>
      <SectionIntro
        eyebrow="Students"
        title="Students are managed through sections."
        description="Filter by section, open a student profile, review progress, and move students between sections."
        action={
          <Button onClick={() => setShowCreate((value) => !value)}>
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        }
      />
      {showCreate ? <CreateStudentForm sections={sections} onCreateStudent={onCreateStudent} /> : null}
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Students By Section</CardTitle>
              <CardDescription>{filteredStudents.length} students in selected section.</CardDescription>
            </div>
            <select
              className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm md:w-72"
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
            >
              {sections.map((section) => (
                <option key={section.id}>{section.name}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="space-y-3">
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
                  <p className="text-sm text-muted-foreground">{student.rollNo} · {student.groups}</p>
                </div>
                <DonutProgress value={student.readiness} label="Readiness" size="sm" />
                <Badge variant={student.pending > 4 ? "danger" : "outline"}>{student.pending} pending</Badge>
              </button>
            )) : (
              <EmptyState icon={Users} title="No students yet" description="Add students after creating or selecting a section." />
            )}
          </CardContent>
        </Card>
        <StudentDetail student={selectedStudent} sections={sections} onMoveStudent={onMoveStudent} />
      </section>
    </>
  );
}


export function SectionsAdmin({
  sections,
  students,
  selectedSection,
  selectedStudent,
  onCreateSection,
  onSelectSection,
  onSelectStudent,
  onMoveStudent,
  onCreateStudent,
  loading,
}: {
  sections: SectionRow[];
  students: AdminStudentRow[];
  selectedSection: SectionRow | null;
  selectedStudent: AdminStudentRow | null;
  onCreateSection: (section: SectionRow) => Promise<void>;
  onSelectSection: (sectionId: string) => void;
  onSelectStudent: (studentId: string) => void;
  onMoveStudent: (studentId: string, sectionName: string) => Promise<void>;
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
  loading: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const sectionStudents = selectedSection ? students.filter((student) => student.section === selectedSection.name) : [];

  return (
    <>
      <SectionIntro
        eyebrow="Sections"
        title="Create sections and manage students inside each section."
        description="Open a section to see all students belonging to it, then open student progress or move students between sections."
        action={
          <Button onClick={() => setShowForm((value) => !value)}>
            <Plus className="h-4 w-4" />
            New Section
          </Button>
        }
      />
      {showForm ? <CreateSectionForm onCreateSection={onCreateSection} /> : null}
      <section className="grid min-w-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>Purpose and student count.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonRows rows={4} /> : sections.length ? sections.map((section) => (
              <button
                key={section.id}
                className={`w-full rounded-lg border p-3 text-left ${selectedSection?.id === section.id ? "border-primary bg-primary/5" : "bg-white"}`}
                onClick={() => onSelectSection(section.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{section.name}</p>
                  <Badge variant={section.status === "Active" ? "secondary" : "warning"}>{section.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{students.filter((student) => student.section === section.name).length} students</Badge>
                  <Badge variant="outline">{section.code}</Badge>
                  <Badge variant="outline">{section.coordinator}</Badge>
                </div>
              </button>
            )) : (
              <EmptyState icon={Layers} title="No sections yet" description="Create your first section to begin adding students and assigning teachers." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{selectedSection?.name ?? "No section selected"}</CardTitle>
            <CardDescription>{selectedSection?.description ?? "Create a section to manage students."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedSection ? <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile label="Department" value={selectedSection.department} />
              <InfoTile label="Batch" value={selectedSection.batch} />
              <InfoTile label="Students" value={String(sectionStudents.length)} />
            </div> : null}
            {selectedSection ? (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowStudentForm((value) => !value)}>
                  <UserPlus className="h-4 w-4" />
                  Add Student
                </Button>
              </div>
            ) : null}
            {showStudentForm && selectedSection ? (
              <CreateStudentForm sections={sections} initialSectionId={selectedSection.id} embedded onCreateStudent={onCreateStudent} />
            ) : null}
            {sectionStudents.length > 0 ? sectionStudents.map((student) => (
              <button
                key={student.id}
                className={`grid w-full gap-3 rounded-lg border p-3 text-left md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-center ${
                  selectedStudent?.id === student.id ? "border-primary bg-primary/5" : "bg-white"
                }`}
                onClick={() => onSelectStudent(student.id)}
              >
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.rollNo} · {student.email}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">{student.readiness}% ready</p>
                  <ReadinessPill value={student.readiness} />
                </div>
                <Eye className="h-4 w-4 text-primary" />
              </button>
            )) : (
              <EmptyState icon={Users} title="No students in this section" description="Add students or move existing students into this section." />
            )}
          </CardContent>
        </Card>
        <div className="2xl:block lg:col-span-2 2xl:col-span-1">
          <StudentDetail student={selectedStudent} sections={sections} onMoveStudent={onMoveStudent} />
        </div>
      </section>
    </>
  );
}


