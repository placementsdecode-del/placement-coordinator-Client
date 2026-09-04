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
import { ApiNotice, InfoTile, ReadinessPill } from "@/components/common/admin-primitives";
import { DonutProgress } from "@/components/common/donut-progress";
import { EmptyState } from "@/components/common/empty-state";
import { FieldError, isValidEmail } from "@/components/common/form-validation";
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
import { getOrganizationId, mapAssessment, mapSection, mapStudentUser } from "@/sections/admin/admin-mappers";
import { AdminDashboard } from "@/sections/admin/components/admin-dashboard";
import { CoordinatorsAdmin } from "@/sections/admin/components/coordinators-page";
import { AnnouncementsAdmin, GroupsAdmin, ReportsAdmin, SettingsAdmin } from "@/sections/admin/components/misc-pages";
import { AssessmentsAdmin, TasksAdmin } from "@/sections/admin/components/tasks-assessments";
import { SectionsAdmin, StudentsAdmin } from "@/sections/admin/components/students-sections";
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

  useEffect(() => {
    setStudents(organizationUsers.filter((user) => user.role === "student").map((user) => mapStudentUser(user, apiSections)));
  }, [organizationUsers, apiSections]);

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

  if (activeNav === "Coordinators") {
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

















