import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Eye,
  FileText,
  Plus,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { DonutProgress } from "@/components/common/donut-progress";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminAssessments,
  adminCoordinators,
  adminMetrics,
  adminSections,
  adminStudents,
  adminTasks,
  coordinatorRoles,
} from "@/data/admin";
import { listPermissions, listRoles, syncOrganizationRoles, updateRole } from "@/services/roles.service";
import { createAssessment as createAssessmentRecord, listAssessments, validateAssessment } from "@/services/assessments.service";
import { assignStudentToSection, createSection as createSectionRecord, listSections, updateSection } from "@/services/sections.service";
import { createUser, listUsers } from "@/services/users.service";
import type { ApiAssessment, ApiAssessmentQuestion, ApiRole, ApiSection, ApiUser } from "@/types/api";
import type {
  AdminAssessment,
  AdminNavLabel,
  AdminStudentRow,
  AdminTask,
  CoordinatorRole,
  CoordinatorRow,
  SectionRow,
} from "@/types/admin";
import type { SessionUser } from "@/types/auth";

export function AdminSection({
  activeNav,
  currentUser,
  onAction,
}: {
  activeNav: AdminNavLabel;
  currentUser: SessionUser | null;
  onAction: (message: string) => void;
}) {
  const [sections, setSections] = useState<SectionRow[]>(adminSections);
  const [students, setStudents] = useState<AdminStudentRow[]>(adminStudents);
  const [coordinators, setCoordinators] = useState<CoordinatorRow[]>(adminCoordinators);
  const [organizationUsers, setOrganizationUsers] = useState<ApiUser[]>([]);
  const [apiRoles, setApiRoles] = useState<ApiRole[]>([]);
  const [apiPermissions, setApiPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<CoordinatorRole[]>(coordinatorRoles);
  const [tasks, setTasks] = useState<AdminTask[]>(adminTasks);
  const [assessments, setAssessments] = useState<AdminAssessment[]>(adminAssessments);
  const [apiSections, setApiSections] = useState<ApiSection[]>([]);
  const [apiAssessments, setApiAssessments] = useState<ApiAssessment[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState(sections[2]?.id ?? sections[0]?.id);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0];
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];

  const refreshOrganizationUsers = useCallback(async () => {
    const organizationId = getOrganizationId(currentUser?.organization);
    try {
      const [users, roleRows, permissionRows] = await Promise.all([
        listUsers(organizationId),
        listRoles(organizationId),
        listPermissions(),
      ]);
      setOrganizationUsers(users);
      const studentRows = users.filter((user) => user.role === "student").map(mapStudentUser);
      if (studentRows.length) setStudents(studentRows);
      setApiRoles(roleRows);
      setApiPermissions(permissionRows);
    } catch {
      setOrganizationUsers([]);
      setApiRoles([]);
      setApiPermissions([]);
    }
  }, [currentUser?.organization]);

  useEffect(() => {
    refreshOrganizationUsers();
  }, [refreshOrganizationUsers]);

  const refreshOrganizationWork = useCallback(async () => {
    const organizationId = getOrganizationId(currentUser?.organization);
    if (!organizationId) return;

    try {
      const [sectionRows, assessmentRows] = await Promise.all([
        listSections(organizationId),
        listAssessments(organizationId),
      ]);
      setApiSections(sectionRows);
      if (sectionRows.length) setSections(sectionRows.map(mapSection));
      setApiAssessments(assessmentRows);
      if (assessmentRows.length) setAssessments(assessmentRows.map(mapAssessment));
    } catch {
      setApiSections([]);
      setApiAssessments([]);
    }
  }, [currentUser?.organization]);

  useEffect(() => {
    refreshOrganizationWork();
  }, [refreshOrganizationWork]);

  async function createSection(section: SectionRow) {
    const organizationId = getOrganizationId(currentUser?.organization);
    try {
      const response = await createSectionRecord({
        organization: organizationId,
        name: section.name,
        code: section.code,
        department: section.department,
        batch: section.batch,
        academicYear: section.academicYear,
        description: section.description,
        status: "active",
      });
      await refreshOrganizationWork();
      setSelectedSectionId(response.section._id);
      onAction(response.message || "Section created.");
    } catch (error) {
      setSections((items) => [section, ...items]);
      setSelectedSectionId(section.id);
      onAction(error instanceof Error ? error.message : "Section created locally only.");
    }
  }

  async function moveStudent(studentId: string, sectionName: string) {
    const apiSection = apiSections.find((section) => section.name === sectionName);
    try {
      if (apiSection) {
        await assignStudentToSection(apiSection._id, studentId);
        await refreshOrganizationUsers();
      }
      setStudents((items) => items.map((student) => (student.id === studentId ? { ...student, section: sectionName } : student)));
      onAction("Student moved to another section.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Student move failed.");
    }
  }

  async function addCoordinator(coordinator: CoordinatorRow, teacherId?: string) {
    const apiSectionIds = apiSections.filter((section) => coordinator.sections.includes(section.name)).map((section) => section._id);
    const teacher = teacherId ? { id: teacherId } : organizationUsers.find((user) => user.email === coordinator.email);
    setCoordinators((items) => [coordinator, ...items]);

    if (teacher && apiSectionIds.length) {
      await Promise.all(apiSectionIds.map((sectionId) => {
        const section = apiSections.find((item) => item._id === sectionId);
        const assignedTeachers = new Set(section?.assignedTeachers.map((item) => item.id) ?? []);
        assignedTeachers.add(teacher.id);
        return updateSection(sectionId, { assignedTeachers: Array.from(assignedTeachers) });
      }));
      await refreshOrganizationWork();
    }

    onAction("Coordinator added.");
  }

  async function createOrganizationUser(user: {
    name: string;
    email: string;
    phoneNumber: string;
    roleName: "teacher" | "student" | "admin";
    password?: string;
  }) {
    try {
      const response = await createUser({ ...user, organization: getOrganizationId(currentUser?.organization) });
      await refreshOrganizationUsers();
      onAction(response.temporaryPassword ? `User created. Temporary password: ${response.temporaryPassword}` : response.message || "User created.");
      return response.user;
    } catch (error) {
      onAction(error instanceof Error ? error.message : "User creation failed.");
      return undefined;
    }
  }

  async function createStudent(user: {
    name: string;
    email: string;
    phoneNumber: string;
    registrationNumber: string;
    department: string;
    batch: string;
    section?: string;
    password?: string;
  }) {
    try {
      const response = await createUser({
        ...user,
        organization: getOrganizationId(currentUser?.organization),
        roleName: "student",
      });
      await refreshOrganizationUsers();
      onAction(response.temporaryPassword ? `Student created. Temporary password: ${response.temporaryPassword}` : response.message || "Student created.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Student creation failed.");
    }
  }

  function addRole(role: CoordinatorRole) {
    setRoles((items) => [role, ...items]);
    onAction("Coordinator role created.");
  }

  async function syncRoles() {
    const organizationId = getOrganizationId(currentUser?.organization);
    if (!organizationId) {
      onAction("Organization not available for this user.");
      return;
    }

    try {
      await syncOrganizationRoles(organizationId);
      await refreshOrganizationUsers();
      onAction("Organization roles are ready.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role sync failed.");
    }
  }

  async function updateApiRolePermissions(roleId: string, permissions: string[]) {
    try {
      await updateRole(roleId, { permissions });
      await refreshOrganizationUsers();
      onAction("Role permissions updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role update failed.");
    }
  }

  function addTask(task: AdminTask) {
    setTasks((items) => [task, ...items]);
    onAction("Task created and preview updated.");
  }

  function addAssessment(assessment: AdminAssessment) {
    setAssessments((items) => [assessment, ...items]);
    onAction("Assessment created. Preview is ready.");
  }

  async function createValidatedAssessment(payload: AdminAssessment & { questions?: Array<{ id: string; type: string; text: string; options: string[]; marks: string; correctAnswer?: string }> }) {
    const organizationId = getOrganizationId(currentUser?.organization);
    const assignedSection = apiSections.find((section) => section.name === payload.assignedTo);
    const questions: ApiAssessmentQuestion[] = (payload.questions ?? []).map((question) => ({
      type: question.type === "MCQ" ? "single-choice" : question.type === "Short Answer" ? "short-answer" : question.type === "Code Question" ? "coding" : "long-answer",
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer || question.options[0] || null,
      marks: Number(question.marks),
      negativeMarks: 0,
    }));
    const totalMarks = questions.reduce((total, question) => total + question.marks, 0);
    const apiPayload = {
      organization: organizationId,
      title: payload.title,
      description: payload.type,
      category: payload.type,
      difficulty: "intermediate" as const,
      instructions: payload.instructions,
      durationMinutes: Number.parseInt(payload.duration, 10) || 60,
      totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.4),
      attemptsAllowed: 1,
      negativeMarking: false,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultImmediately: true,
      allowAnswerReview: true,
      assignedSections: assignedSection ? [assignedSection._id] : [],
      assignedTeachers: [],
      questions,
      status: "draft" as const,
    };

    try {
      const validation = await validateAssessment(apiPayload);
      if (!validation.valid) {
        onAction(validation.errors.join("; "));
        return;
      }
      const response = await createAssessmentRecord(apiPayload);
      await refreshOrganizationWork();
      onAction(response.message || "Assessment created and validated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Assessment validation failed.");
    }
  }

  if (activeNav === "Students") {
    return (
      <StudentsAdmin
        sections={sections}
        students={students}
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudentId}
        onCreateStudent={createStudent}
        onMoveStudent={moveStudent}
      />
    );
  }

  if (activeNav === "Sections") {
    return (
      <SectionsAdmin
        sections={sections}
        students={students}
        selectedSection={selectedSection}
        selectedStudent={selectedStudent}
        onCreateSection={createSection}
        onSelectSection={setSelectedSectionId}
        onSelectStudent={setSelectedStudentId}
        onMoveStudent={moveStudent}
      />
    );
  }

  if (activeNav === "Coordinators" || activeNav === "Roles and Permissions") {
    return (
      <CoordinatorsAdmin
        coordinators={coordinators}
        organizationUsers={organizationUsers}
        apiRoles={apiRoles}
        apiPermissions={apiPermissions}
        roles={roles}
        sections={sections}
        onAddCoordinator={addCoordinator}
        onAddRole={addRole}
        onCreateOrganizationUser={createOrganizationUser}
        onSyncRoles={syncRoles}
        onUpdateApiRolePermissions={updateApiRolePermissions}
      />
    );
  }

  if (activeNav === "Tasks") {
    return <TasksAdmin tasks={tasks} sections={sections} onAddTask={addTask} />;
  }

  if (activeNav === "Assessments") {
    return <AssessmentsAdmin assessments={assessments} sections={sections} onAddAssessment={addAssessment} onCreateValidatedAssessment={createValidatedAssessment} />;
  }

  if (activeNav === "Announcements") return <AnnouncementsAdmin onAction={onAction} sections={sections} />;
  if (activeNav === "Reports") return <ReportsAdmin sections={sections} students={students} />;
  if (activeNav === "Settings") return <SettingsAdmin onAction={onAction} />;
  if (activeNav === "Groups") return <GroupsAdmin onAction={onAction} />;

  return <AdminDashboard sections={sections} students={students} coordinators={coordinators} tasks={tasks} assessments={assessments} onAction={onAction} />;
}

function getOrganizationId(organization: SessionUser["organization"] | undefined) {
  if (!organization) return undefined;
  return typeof organization === "string" ? organization : organization._id;
}

function mapSection(section: ApiSection): SectionRow {
  return {
    id: section._id,
    name: section.name,
    code: section.code,
    department: section.department,
    batch: section.batch,
    academicYear: section.academicYear,
    students: 0,
    coordinator: section.assignedTeachers.map((teacher) => teacher.name).join(", ") || "Unassigned",
    readiness: 0,
    status: section.status === "active" ? "Active" : "Inactive",
    description: section.description,
  };
}

function mapStudentUser(user: ApiUser): AdminStudentRow {
  const sectionName = typeof user.section === "object" && user.section ? user.section.name : "Unassigned";

  return {
    id: user.id,
    name: user.name,
    rollNo: user.registrationNumber || user.id.slice(-6),
    email: user.email,
    phone: user.phoneNumber || "",
    section: sectionName,
    groups: user.groups?.join(", ") || "General",
    aptitude: user.preparationScore || 0,
    coding: user.preparationScore || 0,
    communication: user.preparationScore || 0,
    interview: user.preparationScore || 0,
    readiness: user.preparationScore || 0,
    pending: 0,
    status: user.status === "active" ? "Active" : "Inactive",
    placementStatus: "In process",
  };
}

function mapAssessment(assessment: ApiAssessment): AdminAssessment {
  return {
    id: assessment._id,
    title: assessment.title,
    type: assessment.category,
    assignedTo: assessment.assignedSections.map((section) => section.name).join(", ") || "Unassigned",
    duration: `${assessment.durationMinutes} min`,
    instructions: assessment.instructions,
    rubric: `${assessment.passingMarks}/${assessment.totalMarks} passing`,
    status: `${assessment.status} · ${assessment.questions.length} questions`,
  };
}

function AdminDashboard({
  sections,
  students,
  coordinators,
  tasks,
  assessments,
  onAction,
}: {
  sections: SectionRow[];
  students: AdminStudentRow[];
  coordinators: CoordinatorRow[];
  tasks: AdminTask[];
  assessments: AdminAssessment[];
  onAction: (message: string) => void;
}) {
  return (
    <>
      <SectionIntro
        eyebrow="Organization Admin"
        title="Institution placement operations dashboard."
        description="Manage students through sections, assign coordinators, publish work, create assessments, and monitor readiness."
        action={
          <Button onClick={() => onAction("Quick create opened.")}>
            <Plus className="h-4 w-4" />
            Quick Create
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className={`mb-4 inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${metric.tone}`}>{metric.label}</div>
              <p className="text-3xl font-bold">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Section Health</CardTitle>
            <CardDescription>Students are managed through their assigned sections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sections.map((section) => (
              <div key={section.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{section.name}</p>
                    <Badge variant={section.status === "Active" ? "secondary" : "warning"}>{section.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {students.filter((student) => student.section === section.name).length} students · {section.coordinator}
                  </p>
                </div>
                <DonutProgress value={section.readiness} size="sm" className="justify-self-start sm:justify-self-end" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operations Queue</CardTitle>
            <CardDescription>Current admin workload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Coordinators", value: coordinators.length, icon: ShieldCheck },
              { label: "Active tasks", value: tasks.length, icon: ClipboardList },
              { label: "Assessments", value: assessments.length, icon: FileText },
              { label: "Students needing attention", value: students.filter((student) => student.status !== "Active").length, icon: Users },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function StudentDetail({
  student,
  sections,
  onMoveStudent,
}: {
  student: AdminStudentRow;
  sections: SectionRow[];
  onMoveStudent: (studentId: string, sectionName: string) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Detail</CardTitle>
        <CardDescription>Personal details, section, groups, progress, and pending work.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-background p-4">
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
        </div>
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Move to section</label>
          <select
            className="h-10 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
            value={student.section}
            onChange={(event) => onMoveStudent(student.id, event.target.value)}
          >
            {sections.map((section) => (
              <option key={section.id}>{section.name}</option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentsAdmin({
  sections,
  students,
  selectedStudent,
  onSelectStudent,
  onCreateStudent,
  onMoveStudent,
}: {
  sections: SectionRow[];
  students: AdminStudentRow[];
  selectedStudent: AdminStudentRow;
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
}) {
  const [sectionFilter, setSectionFilter] = useState(sections[0]?.name ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const filteredStudents = students.filter((student) => student.section === sectionFilter);

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
              className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm md:w-72"
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
            >
              {sections.map((section) => (
                <option key={section.id}>{section.name}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                className={`grid w-full gap-3 rounded-lg border p-3 text-left md:grid-cols-[minmax(0,1fr)_180px_120px] md:items-center ${
                  selectedStudent.id === student.id ? "border-primary bg-primary/5" : "bg-white"
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
            ))}
          </CardContent>
        </Card>
        <StudentDetail student={selectedStudent} sections={sections} onMoveStudent={onMoveStudent} />
      </section>
    </>
  );
}

function CreateStudentForm({
  sections,
  onCreateStudent,
}: {
  sections: SectionRow[];
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
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    registrationNumber: "",
    department: sections[0]?.department ?? "Computer Science",
    batch: sections[0]?.batch ?? "2027",
    section: sections[0]?.id ?? "",
    password: "",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Student</CardTitle>
        <CardDescription>Create a student account and assign an initial section.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateStudent({
              ...form,
              section: form.section || undefined,
              password: form.password.trim() || undefined,
            });
            setForm((current) => ({ ...current, name: "", email: "", phoneNumber: "", registrationNumber: "", password: "" }));
          }}
        >
          <Input required placeholder="Student name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Input required type="email" placeholder="student@gmail.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <Input placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
          <Input required placeholder="Registration number" value={form.registrationNumber} onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))} />
          <Input required placeholder="Department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
          <Input required placeholder="Batch" value={form.batch} onChange={(event) => setForm((current) => ({ ...current, batch: event.target.value }))} />
          <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}>
            <option value="">No section</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
          </select>
          <Input placeholder="Password optional" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <Button className="md:col-span-4" type="submit">Create Student</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SectionsAdmin({
  sections,
  students,
  selectedSection,
  selectedStudent,
  onCreateSection,
  onSelectSection,
  onSelectStudent,
  onMoveStudent,
}: {
  sections: SectionRow[];
  students: AdminStudentRow[];
  selectedSection: SectionRow;
  selectedStudent: AdminStudentRow;
  onCreateSection: (section: SectionRow) => Promise<void>;
  onSelectSection: (sectionId: string) => void;
  onSelectStudent: (studentId: string) => void;
  onMoveStudent: (studentId: string, sectionName: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const sectionStudents = students.filter((student) => student.section === selectedSection.name);

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
            {sections.map((section) => (
              <button
                key={section.id}
                className={`w-full rounded-lg border p-3 text-left ${selectedSection.id === section.id ? "border-primary bg-primary/5" : "bg-white"}`}
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
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{selectedSection.name}</CardTitle>
            <CardDescription>{selectedSection.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile label="Department" value={selectedSection.department} />
              <InfoTile label="Batch" value={selectedSection.batch} />
              <InfoTile label="Students" value={String(sectionStudents.length)} />
            </div>
            {sectionStudents.length > 0 ? sectionStudents.map((student) => (
              <button
                key={student.id}
                className={`grid w-full gap-3 rounded-lg border p-3 text-left md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-center ${
                  selectedStudent.id === student.id ? "border-primary bg-primary/5" : "bg-white"
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
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No students in this section yet. Move students here from the student detail panel.
              </div>
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

function CreateSectionForm({ onCreateSection }: { onCreateSection: (section: SectionRow) => Promise<void> }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [batch, setBatch] = useState("2027");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Section</CardTitle>
        <CardDescription>Define department, batch, academic year, code, and coordinator ownership.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const sectionName = name.trim() || "New Section";
            onCreateSection({
              id: crypto.randomUUID(),
              name: sectionName,
              code: code.trim() || sectionName.toUpperCase().replace(/\s+/g, "-"),
              department,
              batch,
              academicYear: "2026-2027",
              students: 0,
              coordinator: "Unassigned",
              readiness: 0,
              status: "Active",
              description: "Newly created organization section.",
            });
            setName("");
            setCode("");
          }}
        >
          <Input placeholder="Section name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="Section code" value={code} onChange={(event) => setCode(event.target.value)} />
          <Input placeholder="Department" value={department} onChange={(event) => setDepartment(event.target.value)} />
          <Input placeholder="Batch" value={batch} onChange={(event) => setBatch(event.target.value)} />
          <Button className="md:col-span-4" type="submit">Create Section</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CoordinatorsAdmin({
  coordinators,
  organizationUsers,
  apiRoles,
  apiPermissions,
  roles,
  sections,
  onAddCoordinator,
  onAddRole,
  onCreateOrganizationUser,
  onSyncRoles,
  onUpdateApiRolePermissions,
}: {
  coordinators: CoordinatorRow[];
  organizationUsers: ApiUser[];
  apiRoles: ApiRole[];
  apiPermissions: string[];
  roles: CoordinatorRole[];
  sections: SectionRow[];
  onAddCoordinator: (coordinator: CoordinatorRow, teacherId?: string) => Promise<void>;
  onAddRole: (role: CoordinatorRole) => void;
  onCreateOrganizationUser: (user: {
    name: string;
    email: string;
    phoneNumber: string;
    roleName: "teacher" | "student" | "admin";
    password?: string;
  }) => Promise<ApiUser | undefined>;
  onSyncRoles: () => Promise<void>;
  onUpdateApiRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0]?.name ?? "");
  const [section, setSection] = useState(sections[0]?.name ?? "");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState("Manage students, Create tasks");

  return (
    <>
      <SectionIntro
        eyebrow="Coordinators"
        title="Add coordinators and create permission roles."
        description="Coordinator access is role-based, and coordinators can be assigned to sections and workflows."
        action={<Button onClick={onSyncRoles}><ShieldCheck className="h-4 w-4" />Sync Roles</Button>}
      />
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card>
          <CardHeader>
            <CardTitle>Add Coordinator</CardTitle>
            <CardDescription>Form for creating a placement coordinator account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const coordinator = {
                  id: crypto.randomUUID(),
                  name: name || "New Coordinator",
                  email: email || "coordinator@example.edu",
                  phone: phoneNumber || "+91 90000 00000",
                  role,
                  sections: [section],
                  status: "Active",
                };
                const createdUser = await onCreateOrganizationUser({
                  name: name || "New Coordinator",
                  email: email || "coordinator@example.edu",
                  phoneNumber: phoneNumber || "+91 90000 00000",
                  roleName: "teacher",
                  password: password.trim() || undefined,
                });
                await onAddCoordinator(coordinator, createdUser?.id);
                setName("");
                setEmail("");
                setPhoneNumber("");
                setPassword("");
              }}
            >
              <Input placeholder="Coordinator name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Input placeholder="Phone number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
              <Input placeholder="Password optional" value={password} onChange={(event) => setPassword(event.target.value)} />
              <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={role} onChange={(event) => setRole(event.target.value)}>
                {roles.map((item) => <option key={item.id}>{item.name}</option>)}
              </select>
              <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={section} onChange={(event) => setSection(event.target.value)}>
                {sections.map((item) => <option key={item.id}>{item.name}</option>)}
              </select>
              <Button type="submit">
                <UserPlus className="h-4 w-4" />
                Add Coordinator
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create Role</CardTitle>
            <CardDescription>Define coordinator permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Role name" value={roleName} onChange={(event) => setRoleName(event.target.value)} />
            <textarea className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={permissions} onChange={(event) => setPermissions(event.target.value)} />
            <Button
              className="w-full"
              onClick={() => {
                onAddRole({
                  id: crypto.randomUUID(),
                  name: roleName || "Custom Coordinator Role",
                  permissions: permissions.split(",").map((item) => item.trim()).filter(Boolean),
                });
                setRoleName("");
              }}
            >
              Create Role
            </Button>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coordinator List</CardTitle>
            <CardDescription>Assigned sections and roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {coordinators.map((coordinator) => (
              <div key={coordinator.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{coordinator.name}</p>
                  <Badge variant="secondary">{coordinator.role}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{coordinator.email} · {coordinator.sections.join(", ")}</p>
              </div>
            ))}
            {organizationUsers.filter((user) => user.role === "teacher").map((user) => (
              <div key={user.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{user.name}</p>
                  <Badge variant="secondary">Teacher</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{user.email} · API user</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Coordinator role-based access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {apiRoles.length ? apiRoles.map((item) => (
              <div key={item._id} className="rounded-lg border p-3">
                <p className="font-semibold">{item.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.name}</p>
                <div className="mt-3 grid gap-2">
                  {apiPermissions.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 text-sm">
                      <input
                        className="h-4 w-4 accent-primary"
                        type="checkbox"
                        disabled={!item.isEditable}
                        checked={item.permissions.includes(permission)}
                        onChange={(event) => {
                          const nextPermissions = event.target.checked
                            ? [...item.permissions, permission]
                            : item.permissions.filter((current) => current !== permission);
                          onUpdateApiRolePermissions(item._id, nextPermissions);
                        }}
                      />
                      {permission}
                    </label>
                  ))}
                </div>
              </div>
            )) : roles.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <p className="font-semibold">{item.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.permissions.map((permission) => <Badge key={permission} variant="outline">{permission}</Badge>)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function TasksAdmin({ tasks, sections, onAddTask }: { tasks: AdminTask[]; sections: SectionRow[]; onAddTask: (task: AdminTask) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Daily Task");
  const [assignedTo, setAssignedTo] = useState(sections[0]?.name ?? "");
  const previewTitle = title || "Untitled placement task";

  return (
    <>
      <SectionIntro
        eyebrow="Tasks"
        title="Create tasks and preview how students will receive them."
        description="Assign daily tasks, homework, reflections, or coding work to sections, groups, or selected students."
      />
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
            <CardDescription>Task setup and assignment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={type} onChange={(event) => setType(event.target.value)}>
                <option>Daily Task</option>
                <option>Placement Homework</option>
                <option>Coding Practice</option>
                <option>Resume Review</option>
              </select>
              <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                {sections.map((section) => <option key={section.id}>{section.name}</option>)}
              </select>
            </div>
            <textarea className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Instructions, attachments, expected outcome, evaluation notes" />
            <Button className="w-full" onClick={() => onAddTask({ id: crypto.randomUUID(), title: previewTitle, type, assignedTo, due: "Tomorrow, 5:00 PM", status: "Draft", submissions: 0 })}>
              Create Task
            </Button>
          </CardContent>
        </Card>
        <StudentTaskPreview title={previewTitle} type={type} assignedTo={assignedTo} />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Task Board</CardTitle>
          <CardDescription>Created tasks and submission progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_140px_120px] md:items-center">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-muted-foreground">{task.type} · {task.assignedTo} · {task.due}</p>
              </div>
              <Badge variant="outline">{task.status}</Badge>
              <p className="text-sm text-muted-foreground">{task.submissions} submissions</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function StudentTaskPreview({ title, type, assignedTo }: { title: string; type: string; assignedTo: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Preview</CardTitle>
        <CardDescription>How this task appears to assigned students.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-primary/5 p-4">
          <Badge>{type}</Badge>
          <h3 className="mt-3 text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">Assigned to {assignedTo}. Due tomorrow at 5:00 PM.</p>
        </div>
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          Students will see instructions, attachments, comments, upload controls, and coordinator feedback after review.
        </div>
        <Button className="w-full" variant="outline">Open Student View Preview</Button>
      </CardContent>
    </Card>
  );
}

function AssessmentsAdmin({
  assessments,
  sections,
  onAddAssessment,
  onCreateValidatedAssessment,
}: {
  assessments: AdminAssessment[];
  sections: SectionRow[];
  onAddAssessment: (assessment: AdminAssessment) => void;
  onCreateValidatedAssessment: (assessment: AdminAssessment & { questions: Array<{ id: string; type: string; text: string; options: string[]; marks: string; correctAnswer?: string }> }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Written Test");
  const [assignedTo, setAssignedTo] = useState(sections[0]?.name ?? "");
  const [instructions, setInstructions] = useState("Answer all sections. Follow timing and submission rules.");
  const [rubric, setRubric] = useState("Aptitude 40%, Technical 40%, Communication 20%");
  const [questionType, setQuestionType] = useState("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [questionOptions, setQuestionOptions] = useState("Option A, Option B, Option C, Option D");
  const [questionMarks, setQuestionMarks] = useState("5");
  const [questions, setQuestions] = useState([
    {
      id: "question-1",
      type: "MCQ",
      text: "Choose the most efficient data structure for balanced parentheses.",
      options: ["Queue", "Stack", "Hash Map", "Tree"],
      marks: "5",
    },
  ]);

  const previewTitle = title || "Untitled assessment";

  function addQuestion() {
    const text = questionText.trim();
    if (!text) return;
    setQuestions((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        type: questionType,
        text,
        options: questionOptions.split(",").map((option) => option.trim()).filter(Boolean),
        marks: questionMarks,
      },
    ]);
    setQuestionText("");
  }

  return (
    <>
      <SectionIntro
        eyebrow="Assessments"
        title="Create assessments and preview the student experience before publishing."
        description="Build written tests, mock interviews, group discussions, coding rounds, and company-specific assessments."
      />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Create Assessment</CardTitle>
            <CardDescription>Type, target audience, rules, duration, and rubric.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Assessment title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <div className="grid gap-3 sm:grid-cols-3">
              <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={type} onChange={(event) => setType(event.target.value)}>
                <option>Written Test</option>
                <option>Mock Interview</option>
                <option>Group Discussion</option>
                <option>Coding Round</option>
              </select>
              <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                {sections.map((section) => <option key={section.id}>{section.name}</option>)}
                <option>Aptitude Group</option>
                <option>Interview Group</option>
              </select>
              <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
                <option>60 min</option>
                <option>30 min</option>
                <option>45 min</option>
                <option>Panel slot</option>
              </select>
            </div>
            <textarea className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
            <Input value={rubric} onChange={(event) => setRubric(event.target.value)} />
            <div className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">Question Builder</p>
                <Badge variant="outline">{questions.length} questions</Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[160px_120px_minmax(0,1fr)]">
                <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={questionType} onChange={(event) => setQuestionType(event.target.value)}>
                  <option>MCQ</option>
                  <option>Short Answer</option>
                  <option>Code Question</option>
                  <option>Interview Prompt</option>
                  <option>Group Discussion Topic</option>
                </select>
                <Input placeholder="Marks" value={questionMarks} onChange={(event) => setQuestionMarks(event.target.value)} />
                <Input placeholder="Question text" value={questionText} onChange={(event) => setQuestionText(event.target.value)} />
              </div>
              {questionType === "MCQ" ? (
                <Input className="mt-3" placeholder="Comma-separated options" value={questionOptions} onChange={(event) => setQuestionOptions(event.target.value)} />
              ) : null}
              <Button className="mt-3 w-full" variant="outline" onClick={addQuestion}>
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
              <div className="mt-3 space-y-2">
                {questions.map((question, index) => (
                  <div key={question.id} className="rounded-md border bg-white p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge variant="warning">{question.type}</Badge>
                      <span className="text-muted-foreground">{question.marks} marks</span>
                    </div>
                    <p className="mt-2 font-medium">{question.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                const assessment = { id: crypto.randomUUID(), title: previewTitle, type, assignedTo, duration: "60 min", instructions, rubric, status: `Draft · ${questions.length} questions`, questions };
                onAddAssessment(assessment);
                onCreateValidatedAssessment(assessment);
              }}
            >
              Validate & Create Assessment
            </Button>
          </CardContent>
        </Card>
        <AssessmentPreview title={previewTitle} type={type} assignedTo={assignedTo} instructions={instructions} rubric={rubric} questions={questions} />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Assessment Board</CardTitle>
          <CardDescription>Created assessments and publish state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{assessment.title}</p>
                <Badge variant="outline">{assessment.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{assessment.type} · {assessment.assignedTo} · {assessment.duration}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function AssessmentPreview({
  title,
  type,
  assignedTo,
  instructions,
  rubric,
  questions,
}: {
  title: string;
  type: string;
  assignedTo: string;
  instructions: string;
  rubric: string;
  questions: Array<{ id: string; type: string; text: string; options: string[]; marks: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Experience Preview</CardTitle>
        <CardDescription>Review before students see it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-primary/5 p-4">
          <Badge>{type}</Badge>
          <h3 className="mt-3 text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{assignedTo} · 60 min · Starts after publish</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-semibold">Instructions</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{instructions}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-semibold">Rubric</p>
          <p className="mt-2 text-sm text-muted-foreground">{rubric}</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Question Preview</p>
            <Badge variant="outline">{questions.length} total</Badge>
          </div>
          <div className="mt-3 space-y-3">
            {questions.slice(0, 2).map((question, index) => (
              <div key={question.id} className="rounded-md bg-background p-3">
                <p className="text-sm font-medium">Q{index + 1}. {question.text}</p>
                {question.options.length ? (
                  <div className="mt-2 grid gap-2">
                    {question.options.slice(0, 4).map((option) => (
                      <div key={option} className="rounded border bg-white px-3 py-2 text-sm text-muted-foreground">{option}</div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 rounded border bg-white px-3 py-5 text-sm text-muted-foreground">Student response area</div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline">Preview Student Start Screen</Button>
          <Button>Publish Assessment</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementsAdmin({ onAction, sections }: { onAction: (message: string) => void; sections: SectionRow[] }) {
  return (
    <>
      <SectionIntro
        eyebrow="Announcements"
        title="Publish placement updates to sections and groups."
        description="Send drive updates, schedule changes, preparation instructions, and deadline reminders."
        action={
          <Button onClick={() => onAction("Announcement published.")}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <Input placeholder="Announcement title" />
          <textarea className="min-h-36 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Write announcement content" />
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
              {sections.map((section) => <option key={section.id}>{section.name}</option>)}
              <option>All Students</option>
              <option>Coding Group</option>
            </select>
            <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
              <option>Normal</option>
              <option>Important</option>
              <option>Urgent</option>
            </select>
            <Button onClick={() => onAction("Announcement preview opened.")}>Preview</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ReportsAdmin({ sections, students }: { sections: SectionRow[]; students: AdminStudentRow[] }) {
  const placedStudents = students.filter((student) => student.placementStatus === "Placed");
  const inProcessStudents = students.filter((student) => student.placementStatus === "In process");
  const notPlacedStudents = students.filter((student) => student.placementStatus === "Not placed");
  const placementRate = Math.round((placedStudents.length / Math.max(students.length, 1)) * 100);
  const averagePackage =
    placedStudents.length > 0
      ? (placedStudents.reduce((total, student) => total + (student.packageLpa ?? 0), 0) / placedStudents.length).toFixed(1)
      : "0";
  const companyStats = placedStudents.reduce<Record<string, { company: string; count: number; bestPackage: number }>>((acc, student) => {
    const company = student.company ?? "Unknown";
    acc[company] = acc[company] ?? { company, count: 0, bestPackage: 0 };
    acc[company].count += 1;
    acc[company].bestPackage = Math.max(acc[company].bestPackage, student.packageLpa ?? 0);
    return acc;
  }, {});

  return (
    <>
      <SectionIntro
        eyebrow="Reports"
        title="Placement statistics and student outcome tracking."
        description="Track who is placed, who is still in process, who is not placed, and how outcomes vary by section and company."
        action={
          <Button variant="outline">
            <BarChart3 className="h-4 w-4" />
            Export Placement Report
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Placed", value: placedStudents.length, detail: `${placementRate}% placement rate`, tone: "bg-secondary/10 text-secondary" },
          { label: "In process", value: inProcessStudents.length, detail: "Interview or offer pipeline", tone: "bg-primary/10 text-primary" },
          { label: "Not placed", value: notPlacedStudents.length, detail: "Needs focused support", tone: "bg-destructive/10 text-destructive" },
          { label: "Avg package", value: `${averagePackage} LPA`, detail: "Across placed students", tone: "bg-muted text-foreground" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className={`inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${item.tone}`}>{item.label}</div>
              <p className="mt-4 text-3xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Section Placement View</CardTitle>
            <CardDescription>Placed and pending students by section.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {sections.map((section) => {
              const sectionStudents = students.filter((student) => student.section === section.name);
              const sectionPlaced = sectionStudents.filter((student) => student.placementStatus === "Placed").length;
              const sectionRate = Math.round((sectionPlaced / Math.max(sectionStudents.length, 1)) * 100);

              return (
                <div key={section.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{section.name}</p>
                    <Badge variant={sectionRate >= 60 ? "secondary" : "warning"}>{sectionRate}% placed</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sectionPlaced} placed · {sectionStudents.length - sectionPlaced} pending/not placed
                  </p>
                  <div className="mt-3">
                    <DonutProgress value={sectionRate} label="Placement rate" size="sm" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Outcomes</CardTitle>
            <CardDescription>Offers received by company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(companyStats).map((item) => (
              <div key={item.company} className="rounded-lg border p-3">
                <p className="font-semibold">{item.company}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.count} offer{item.count > 1 ? "s" : ""} · Best {item.bestPackage} LPA
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <PlacementStudentList title="Placed Students" description="Offer details and package." students={placedStudents} tone="placed" />
        <PlacementStudentList title="In Process" description="Current interview pipeline." students={inProcessStudents} tone="process" />
        <PlacementStudentList title="Not Placed" description="Students needing coordinator action." students={notPlacedStudents} tone="risk" />
      </section>
    </>
  );
}

function PlacementStudentList({
  title,
  description,
  students,
  tone,
}: {
  title: string;
  description: string;
  students: AdminStudentRow[];
  tone: "placed" | "process" | "risk";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {students.map((student) => (
          <div key={student.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-muted-foreground">
                  {student.rollNo} · {student.section}
                </p>
              </div>
              <Badge variant={tone === "placed" ? "secondary" : tone === "risk" ? "danger" : "outline"}>{student.placementStatus}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {student.placementStatus === "Placed"
                ? `${student.company} · ${student.packageLpa} LPA · ${student.offerDate}`
                : student.placementRound}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function GroupsAdmin({ onAction }: { onAction: (message: string) => void }) {
  return (
    <>
      <SectionIntro
        eyebrow="Groups"
        title="Create cross-section preparation groups."
        description="Groups can include students from multiple sections for aptitude, coding, interview, or company-specific support."
        action={<Button onClick={() => onAction("Group created.")}><Plus className="h-4 w-4" />New Group</Button>}
      />
      <section className="grid gap-4 md:grid-cols-3">
        {["Advanced Coding Group", "Aptitude Improvement Group", "Interview Preparation Group"].map((group) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle>{group}</CardTitle>
              <CardDescription>Cross-section student group</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Active</Badge>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}

function SettingsAdmin({ onAction }: { onAction: (message: string) => void }) {
  const [orgName, setOrgName] = useState("ABC Institute of Technology");
  const [shortName, setShortName] = useState("ABC Institute");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [contactEmail, setContactEmail] = useState("admin@abc.edu");
  const [defaultDepartment, setDefaultDepartment] = useState("Placement Department");
  const [studentPortalTitle, setStudentPortalTitle] = useState("ABC Placement Readiness Portal");
  const [supportContact, setSupportContact] = useState("placements@abc.edu");
  const [brandColor, setBrandColor] = useState("#153E9F");

  return (
    <>
      <SectionIntro
        eyebrow="Settings"
        title="Organization profile and student portal defaults."
        description="The uploaded organization profile becomes the default branding, contact, academic year, and support information shown to students."
      />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>These values become defaults for student accounts under this organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={orgName} onChange={(event) => setOrgName(event.target.value)} />
              <Input value={shortName} onChange={(event) => setShortName(event.target.value)} />
              <Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
              <Input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              <Input value={defaultDepartment} onChange={(event) => setDefaultDepartment(event.target.value)} />
              <Input value={supportContact} onChange={(event) => setSupportContact(event.target.value)} />
              <Input className="md:col-span-2" value={studentPortalTitle} onChange={(event) => setStudentPortalTitle(event.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
              <div className="rounded-lg border bg-background p-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg text-xl font-black text-white" style={{ backgroundColor: brandColor }}>
                  {shortName.slice(0, 2).toUpperCase()}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Logo preview</p>
              </div>
              <div className="space-y-3">
                <Input placeholder="Logo file name or URL" />
                <Input value={brandColor} onChange={(event) => setBrandColor(event.target.value)} />
                <Button variant="outline" onClick={() => onAction("Organization logo upload selected.")}>
                  Upload Organization Logo
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={() => onAction("Organization profile saved and applied as student defaults.")}>
              Save Organization Defaults
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Default Preview</CardTitle>
            <CardDescription>What new students will inherit after login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-black text-white" style={{ backgroundColor: brandColor }}>
                  {shortName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{studentPortalTitle}</p>
                  <p className="text-sm text-muted-foreground">{shortName} · {academicYear}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              <InfoTile label="Default organization" value={orgName} />
              <InfoTile label="Default department owner" value={defaultDepartment} />
              <InfoTile label="Student support" value={supportContact} />
              <InfoTile label="Admin contact" value={contactEmail} />
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function ReadinessPill({ value }: { value: number }) {
  const tone = value >= 85 ? "bg-secondary/15 text-secondary" : value >= 70 ? "bg-accent/20 text-foreground" : "bg-destructive/10 text-destructive";

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${tone}`}>{value >= 85 ? "High" : value >= 70 ? "Medium" : "Low"}</span>;
}
