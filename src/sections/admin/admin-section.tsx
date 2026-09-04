import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Eye,
  FileText,
  Layers,
  LoaderCircle,
  Plus,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { DonutProgress } from "@/components/common/donut-progress";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminAssessments,
  adminCoordinators,
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
  const [usersLoading, setUsersLoading] = useState(true);
  const [workLoading, setWorkLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState(sections[2]?.id ?? sections[0]?.id);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0] ?? null;
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0] ?? null;

  const refreshOrganizationUsers = useCallback(async () => {
    const organizationId = getOrganizationId(currentUser?.organization);
    setUsersLoading(true);
    try {
      const [users, roleRows, permissionRows] = await Promise.all([
        listUsers(organizationId),
        listRoles(organizationId),
        listPermissions(),
      ]);
      setOrganizationUsers(users);
      const studentRows = users.filter((user) => user.role === "student").map(mapStudentUser);
      setStudents(studentRows);
      setApiRoles(roleRows);
      setApiPermissions(permissionRows);
      setLoadError("");
    } catch {
      setOrganizationUsers([]);
      setStudents([]);
      setApiRoles([]);
      setApiPermissions([]);
      setLoadError("Unable to load organization users.");
    } finally {
      setUsersLoading(false);
    }
  }, [currentUser?.organization]);

  useEffect(() => {
    refreshOrganizationUsers();
  }, [refreshOrganizationUsers]);

  const refreshOrganizationWork = useCallback(async () => {
    const organizationId = getOrganizationId(currentUser?.organization);
    if (!organizationId) {
      setWorkLoading(false);
      return;
    }

    setWorkLoading(true);
    try {
      const [sectionRows, assessmentRows] = await Promise.all([
        listSections(organizationId),
        listAssessments(organizationId),
      ]);
      setApiSections(sectionRows);
      setSections(sectionRows.map(mapSection));
      setApiAssessments(assessmentRows);
      setAssessments(assessmentRows.map(mapAssessment));
      setLoadError("");
    } catch {
      setApiSections([]);
      setSections([]);
      setApiAssessments([]);
      setAssessments([]);
      setLoadError("Unable to load sections or assessments.");
    } finally {
      setWorkLoading(false);
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
      setSelectedStudentId(response.user.id || response.user._id || "");
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
        loading={usersLoading}
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
        onCreateStudent={createStudent}
        loading={workLoading || usersLoading}
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
        loading={usersLoading}
      />
    );
  }

  if (activeNav === "Tasks") {
    return <TasksAdmin tasks={tasks} sections={sections} onAddTask={addTask} />;
  }

  if (activeNav === "Assessments") {
    return <AssessmentsAdmin assessments={assessments} sections={sections} onAddAssessment={addAssessment} onCreateValidatedAssessment={createValidatedAssessment} loading={workLoading} />;
  }

  if (activeNav === "Announcements") return <AnnouncementsAdmin onAction={onAction} sections={sections} />;
  if (activeNav === "Reports") return <ReportsAdmin sections={sections} students={students} />;
  if (activeNav === "Settings") return <SettingsAdmin onAction={onAction} />;
  if (activeNav === "Groups") return <GroupsAdmin onAction={onAction} />;

  return <AdminDashboard sections={sections} students={students} coordinators={coordinators} tasks={tasks} assessments={assessments} loading={usersLoading || workLoading} loadError={loadError} onAction={onAction} />;
}

function getOrganizationId(organization: SessionUser["organization"] | undefined) {
  if (!organization) return undefined;
  return typeof organization === "string" ? organization : organization._id;
}

function ApiNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      API data unavailable: {message}
    </div>
  );
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
  loading,
  loadError,
  onAction,
}: {
  sections: SectionRow[];
  students: AdminStudentRow[];
  coordinators: CoordinatorRow[];
  tasks: AdminTask[];
  assessments: AdminAssessment[];
  loading: boolean;
  loadError: string;
  onAction: (message: string) => void;
}) {
  const metrics = [
    { label: "Total students", value: students.length, detail: "Created from API data", tone: "bg-primary/10 text-primary" },
    { label: "Coordinators", value: coordinators.length, detail: "Assigned teachers", tone: "bg-green-100 text-green-800" },
    { label: "Active sections", value: sections.length, detail: "Organization sections", tone: "bg-slate-100 text-slate-700" },
    { label: "Assessments", value: assessments.length, detail: "Created assessments", tone: "bg-amber-100 text-amber-800" },
  ];

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
      {loadError ? <ApiNotice message={loadError} /> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="min-h-28 p-5">
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
            {loading ? <SkeletonRows rows={3} /> : sections.length ? sections.map((section) => (
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
            )) : (
              <EmptyState icon={Layers} title="No sections yet" description="Create a section to organize students, teachers, and assessments." />
            )}
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

function StudentsAdmin({
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

function CreateStudentForm({
  sections,
  initialSectionId,
  embedded = false,
  onCreateStudent,
}: {
  sections: SectionRow[];
  initialSectionId?: string;
  embedded?: boolean;
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
    department: sections[0]?.department ?? "",
    batch: sections[0]?.batch ?? "",
    section: initialSectionId ?? sections[0]?.id ?? "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initialSection = sections.find((section) => section.id === initialSectionId);
    setForm((current) => ({
      ...current,
      department: initialSection?.department || current.department || sections[0]?.department || "",
      batch: initialSection?.batch || current.batch || sections[0]?.batch || "",
      section: initialSectionId || current.section || sections[0]?.id || "",
    }));
  }, [initialSectionId, sections]);

  const formContent = (
    <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            try {
              await onCreateStudent({
                ...form,
                section: form.section || undefined,
                password: form.password.trim() || undefined,
              });
              setForm((current) => ({ ...current, name: "", email: "", phoneNumber: "", registrationNumber: "", password: "" }));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Input required placeholder="Student name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Input required type="email" placeholder="Student email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <Input placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
          <Input required placeholder="Registration number" value={form.registrationNumber} onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))} />
          <Input required placeholder="Department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
          <Input required placeholder="Batch" value={form.batch} onChange={(event) => setForm((current) => ({ ...current, batch: event.target.value }))} />
          <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}>
            <option value="">No section</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
          </select>
          <Input placeholder="Password optional" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <div className="flex justify-end md:col-span-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {submitting ? "Creating..." : "Create Student"}
            </Button>
          </div>
        </form>
  );

  if (embedded) {
    return (
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3">
          <p className="font-semibold">Add Student To Section</p>
          <p className="text-sm text-muted-foreground">Create a student account directly in the selected section.</p>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Student</CardTitle>
        <CardDescription>Create a student account and assign an initial section.</CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
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

function CreateSectionForm({ onCreateSection }: { onCreateSection: (section: SectionRow) => Promise<void> }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Section</CardTitle>
        <CardDescription>Define department, batch, academic year, code, and coordinator ownership.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const sectionName = name.trim();
            if (!sectionName || !code.trim() || !department.trim() || !batch.trim()) return;
            setSubmitting(true);
            try {
              await onCreateSection({
                id: crypto.randomUUID(),
                name: sectionName,
                code: code.trim(),
                department,
                batch,
                academicYear: "",
                students: 0,
                coordinator: "Unassigned",
                readiness: 0,
                status: "Active",
                description: "",
              });
              setName("");
              setCode("");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Input placeholder="Section name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="Section code" value={code} onChange={(event) => setCode(event.target.value)} />
          <Input placeholder="Department" value={department} onChange={(event) => setDepartment(event.target.value)} />
          <Input placeholder="Batch" value={batch} onChange={(event) => setBatch(event.target.value)} />
          <div className="flex justify-end md:col-span-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {submitting ? "Creating..." : "Create Section"}
            </Button>
          </div>
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
  loading,
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
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0]?.name ?? "");
  const [section, setSection] = useState(sections[0]?.name ?? "");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState("");
  const [coordinatorSubmitting, setCoordinatorSubmitting] = useState(false);
  const [syncingRoles, setSyncingRoles] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState("");

  async function handleSyncRoles() {
    setSyncingRoles(true);
    try {
      await onSyncRoles();
    } finally {
      setSyncingRoles(false);
    }
  }

  return (
    <>
      <SectionIntro
        eyebrow="Coordinators"
        title="Add coordinators and create permission roles."
        description="Coordinator access is role-based, and coordinators can be assigned to sections and workflows."
        action={
          <Button onClick={handleSyncRoles} disabled={syncingRoles}>
            {syncingRoles ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {syncingRoles ? "Syncing..." : "Sync Roles"}
          </Button>
        }
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
                if (!name.trim() || !email.trim()) return;
                const coordinator = {
                  id: crypto.randomUUID(),
                  name,
                  email,
                  phone: phoneNumber,
                  role,
                  sections: [section],
                  status: "Active",
                };
                setCoordinatorSubmitting(true);
                try {
                  const createdUser = await onCreateOrganizationUser({
                    name,
                    email,
                    phoneNumber,
                    roleName: "teacher",
                    password: password.trim() || undefined,
                  });
                  await onAddCoordinator(coordinator, createdUser?.id);
                  setName("");
                  setEmail("");
                  setPhoneNumber("");
                  setPassword("");
                } finally {
                  setCoordinatorSubmitting(false);
                }
              }}
            >
              <Input required placeholder="Coordinator name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input required placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Input placeholder="Phone number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
              <Input placeholder="Password optional" value={password} onChange={(event) => setPassword(event.target.value)} />
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={role} onChange={(event) => setRole(event.target.value)}>
                {roles.map((item) => <option key={item.id}>{item.name}</option>)}
              </select>
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={section} onChange={(event) => setSection(event.target.value)}>
                {sections.map((item) => <option key={item.id}>{item.name}</option>)}
              </select>
              <Button type="submit" disabled={coordinatorSubmitting}>
                {coordinatorSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {coordinatorSubmitting ? "Adding..." : "Add Coordinator"}
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
              onClick={() => {
                onAddRole({
                  id: crypto.randomUUID(),
                  name: roleName,
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
            {loading ? <SkeletonRows rows={3} /> : coordinators.map((coordinator) => (
              <div key={coordinator.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{coordinator.name}</p>
                  <Badge variant="secondary">{coordinator.role}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{coordinator.email} · {coordinator.sections.join(", ")}</p>
              </div>
            ))}
            {!loading ? organizationUsers.filter((user) => user.role === "teacher").map((user) => (
              <div key={user.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{user.name}</p>
                  <Badge variant="secondary">Teacher</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{user.email} · API user</p>
              </div>
            )) : null}
            {!loading && !coordinators.length && !organizationUsers.filter((user) => user.role === "teacher").length ? (
              <EmptyState icon={ShieldCheck} title="No coordinators yet" description="Create teacher accounts and assign them to sections when your organization is ready." />
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Coordinator role-based access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonRows rows={3} /> : apiRoles.length ? apiRoles.map((item) => (
              <div key={item._id} className="rounded-lg border p-3">
                <p className="font-semibold">{item.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.name}</p>
                <div className="mt-3 grid gap-2">
                  {apiPermissions.map((permission) => (
                    <label key={permission} className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        className="h-5 w-5 accent-primary"
                        type="checkbox"
                      disabled={!item.isEditable || Boolean(savingRoleId)}
                        checked={item.permissions.includes(permission)}
                        onChange={(event) => {
                          const nextPermissions = event.target.checked
                            ? [...item.permissions, permission]
                            : item.permissions.filter((current) => current !== permission);
                          setSavingRoleId(item._id);
                          onUpdateApiRolePermissions(item._id, nextPermissions).finally(() => setSavingRoleId(""));
                        }}
                      />
                      {permission}
                    </label>
                  ))}
                </div>
                {savingRoleId === item._id ? <p className="text-xs text-muted-foreground">Saving permissions...</p> : null}
              </div>
            )) : roles.length ? roles.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <p className="font-semibold">{item.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.permissions.map((permission) => <Badge key={permission} variant="outline">{permission}</Badge>)}
                </div>
              </div>
            )) : (
              <EmptyState icon={ShieldCheck} title="No roles available" description="Sync organization roles to prepare admin, teacher, and student permissions." />
            )}
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
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={type} onChange={(event) => setType(event.target.value)}>
                <option>Daily Task</option>
                <option>Placement Homework</option>
                <option>Coding Practice</option>
                <option>Resume Review</option>
              </select>
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                {sections.map((section) => <option key={section.id}>{section.name}</option>)}
              </select>
            </div>
            <textarea className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Instructions, attachments, expected outcome, evaluation notes" />
            <div className="flex justify-end">
              <Button onClick={() => onAddTask({ id: crypto.randomUUID(), title: previewTitle, type, assignedTo, due: "Tomorrow, 5:00 PM", status: "Draft", submissions: 0 })}>
                Create Task
              </Button>
            </div>
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
          {tasks.length ? tasks.map((task) => (
            <div key={task.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_140px_120px] md:items-center">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-muted-foreground">{task.type} · {task.assignedTo} · {task.due}</p>
              </div>
              <Badge variant="outline">{task.status}</Badge>
              <p className="text-sm text-muted-foreground">{task.submissions} submissions</p>
            </div>
          )) : (
            <EmptyState icon={ClipboardList} title="No tasks yet" description="Create a task to assign preparation work to students." />
          )}
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
          <p className="mt-2 text-sm text-muted-foreground">{assignedTo ? `Assigned to ${assignedTo}.` : "Audience not selected."} Due date will be set during publish.</p>
        </div>
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          Students will see instructions, attachments, comments, upload controls, and coordinator feedback after review.
        </div>
        <div className="flex justify-end">
          <Button variant="outline">Open Student View Preview</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AssessmentsAdmin({
  assessments,
  sections,
  onAddAssessment,
  onCreateValidatedAssessment,
  loading,
}: {
  assessments: AdminAssessment[];
  sections: SectionRow[];
  onAddAssessment: (assessment: AdminAssessment) => void;
  onCreateValidatedAssessment: (assessment: AdminAssessment & { questions: Array<{ id: string; type: string; text: string; options: string[]; marks: string; correctAnswer?: string }> }) => Promise<void>;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Written Test");
  const [assignedTo, setAssignedTo] = useState(sections[0]?.name ?? "");
  const [instructions, setInstructions] = useState("");
  const [rubric, setRubric] = useState("");
  const [questionType, setQuestionType] = useState("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [questionOptions, setQuestionOptions] = useState("");
  const [questionMarks, setQuestionMarks] = useState("");
  const [questions, setQuestions] = useState<Array<{ id: string; type: string; text: string; options: string[]; marks: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

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
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={type} onChange={(event) => setType(event.target.value)}>
                <option>Written Test</option>
                <option>Mock Interview</option>
                <option>Group Discussion</option>
                <option>Coding Round</option>
              </select>
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                {sections.map((section) => <option key={section.id}>{section.name}</option>)}
                <option>Aptitude Group</option>
                <option>Interview Group</option>
              </select>
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
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
                <Badge variant="outline">{questions.length} {questions.length === 1 ? "question" : "questions"}</Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[160px_120px_minmax(0,1fr)]">
                <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={questionType} onChange={(event) => setQuestionType(event.target.value)}>
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
              <Button className="mt-3" variant="outline" onClick={addQuestion}>
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
              disabled={submitting || !title.trim() || !assignedTo || !instructions.trim() || !questions.length}
              onClick={async () => {
                const assessment = { id: crypto.randomUUID(), title: previewTitle, type, assignedTo, duration: "60 min", instructions, rubric, status: `Draft · ${questions.length} ${questions.length === 1 ? "question" : "questions"}`, questions };
                setSubmitting(true);
                try {
                  onAddAssessment(assessment);
                  await onCreateValidatedAssessment(assessment);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {submitting ? "Validating..." : "Validate & Create Assessment"}
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
          {loading ? <SkeletonRows rows={3} /> : assessments.length ? assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{assessment.title}</p>
                <Badge variant="outline">{assessment.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{assessment.type} · {assessment.assignedTo} · {assessment.duration}</p>
            </div>
          )) : (
            <EmptyState icon={FileText} title="No assessments yet" description="Create and validate an assessment before publishing it to students." />
          )}
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
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{instructions || "Instructions will appear here once added."}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-semibold">Rubric</p>
          <p className="mt-2 text-sm text-muted-foreground">{rubric || "Rubric details will appear here once added."}</p>
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
            {!questions.length ? (
              <EmptyState icon={FileText} title="No questions yet" description="Add questions to validate and publish this assessment." />
            ) : null}
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
            <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
              {sections.map((section) => <option key={section.id}>{section.name}</option>)}
              <option>All Students</option>
              <option>Coding Group</option>
            </select>
            <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
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
            {sections.length ? sections.map((section) => {
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
            }) : (
              <div className="md:col-span-2">
                <EmptyState icon={Layers} title="No section reports yet" description="Create sections and add students to generate placement reports." />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Outcomes</CardTitle>
            <CardDescription>Offers received by company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(companyStats).length ? Object.values(companyStats).map((item) => (
              <div key={item.company} className="rounded-lg border p-3">
                <p className="font-semibold">{item.company}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.count} offer{item.count > 1 ? "s" : ""} · Best {item.bestPackage} LPA
                </p>
              </div>
            )) : (
              <EmptyState icon={BarChart3} title="No company outcomes yet" description="Placed student outcomes will appear here when available." />
            )}
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
        {students.length ? students.map((student) => (
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
        )) : (
          <EmptyState icon={Users} title={`No ${title.toLowerCase()}`} description="Matching students will appear here after placement status updates." />
        )}
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
        <Card className="md:col-span-3">
          <CardContent className="p-4 sm:p-5">
            <EmptyState icon={Users} title="No groups yet" description="Create groups after students and sections are ready." />
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function SettingsAdmin({ onAction }: { onAction: (message: string) => void }) {
  const [orgName, setOrgName] = useState("");
  const [shortName, setShortName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [defaultDepartment, setDefaultDepartment] = useState("");
  const [studentPortalTitle, setStudentPortalTitle] = useState("");
  const [supportContact, setSupportContact] = useState("");
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
            <div className="flex justify-end">
              <Button onClick={() => onAction("Organization profile saved and applied as student defaults.")}>
                Save Organization Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
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
        <ChangePasswordCard />
        </div>
      </section>
    </>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-semibold">{value}</p>
    </div>
  );
}

function ReadinessPill({ value }: { value: number }) {
  const tone = value >= 85 ? "bg-secondary/15 text-secondary" : value >= 70 ? "bg-accent/20 text-foreground" : "bg-destructive/10 text-destructive";

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${tone}`}>{value >= 85 ? "High" : value >= 70 ? "Medium" : "Low"}</span>;
}
