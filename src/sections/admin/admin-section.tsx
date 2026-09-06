import { GroupsAdmin } from "@/sections/community/groups-admin";
import { WorkAdmin } from "@/sections/community/work-admin";
import { useCallback, useEffect, useState } from "react";

import { PageSkeleton, LoadError } from "@/components/common/loading-state";

import { adminAssessments, adminCoordinators, adminTasks, coordinatorRoles } from "@/data/admin";
import { listPermissions, listRoles, syncOrganizationRoles, updateRole } from "@/services/roles.api.service";
import { createAssessment as createAssessmentRecord, listAssessments, validateAssessment, updateAssessment } from "@/services/assessments.api.service";
import { assignStudentToSection, removeStudentFromSection, createSection as createSectionRecord, listSections, updateSection } from "@/services/sections.api.service";
import { createUser, listUsers } from "@/services/users.api.service";
import { getOrganizationId, mapAssessment, mapSection, mapStudentUser } from "@/sections/admin/admin-mappers";
import { AdminDashboard } from "@/sections/admin/components/admin-dashboard";
import { CoordinatorsAdmin } from "@/sections/admin/components/coordinators-page";
import { ReportsAdmin, SettingsAdmin } from "@/sections/admin/components/misc-pages";
import { AssessmentsAdmin } from "@/sections/admin/components/tasks-assessments";
import { SectionsAdmin, StudentsAdmin } from "@/sections/admin/components/students-sections";
import type { ApiAssessmentQuestion, ApiRole, ApiSection, ApiUser } from "@/types/api";
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
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorRow[]>(adminCoordinators);
  const [organizationUsers, setOrganizationUsers] = useState<ApiUser[]>([]);
  const [apiRoles, setApiRoles] = useState<ApiRole[]>([]);
  const [apiPermissions, setApiPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<CoordinatorRole[]>(coordinatorRoles);
  const [tasks] = useState<AdminTask[]>(adminTasks);
  const [assessments, setAssessments] = useState<AdminAssessment[]>(adminAssessments);
  const [apiSections, setApiSections] = useState<ApiSection[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [workLoading, setWorkLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [workError, setWorkError] = useState("");
  const loadError = [usersError, workError].filter(Boolean).join(" ");
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
        currentUser?.role === "teacher" ? Promise.resolve([]) : listRoles(organizationId),
        currentUser?.role === "teacher" ? Promise.resolve([]) : listPermissions(),
      ]);
      setOrganizationUsers(users);
      setApiRoles(roleRows);
      setApiPermissions(permissionRows);
      setUsersError("");
    } catch {
      setOrganizationUsers([]);
      setStudents([]);
      setApiRoles([]);
      setApiPermissions([]);
      setUsersError("Unable to load organization users.");
    } finally {
      setUsersLoading(false);
    }
  }, [currentUser?.organization, currentUser?.role]);

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
      setAssessments(assessmentRows.map(mapAssessment));
      setWorkError("");
    } catch {
      setApiSections([]);
      setSections([]);
      setAssessments([]);
      setWorkError("Unable to load sections or assessments.");
    } finally {
      setWorkLoading(false);
    }
  }, [currentUser?.organization]);

  useEffect(() => {
    refreshOrganizationWork();
  }, [refreshOrganizationWork]);

  async function createSection(section: SectionRow) {
    const organizationId = getOrganizationId(currentUser?.organization);
    const response = await createSectionRecord({
      organization: organizationId,
      name: section.name,
      code: section.code,
      department: section.department,
      batch: section.batch,
      academicYear: section.academicYear,
      description: section.description,
      status: section.status === "Active" ? "active" : "inactive",
    });
    await refreshOrganizationWork();
    setSelectedSectionId(response.section._id);
    onAction(response.message || "Section created.");
  }


  async function moveStudent(studentId: string, sectionId: string) {
    const student = students.find((item) => item.id === studentId);
    if (!student) throw new Error("Student not found. Refresh and try again.");
    if (sectionId) {
      await assignStudentToSection(sectionId, studentId);
    } else if (student.sectionId) {
      await removeStudentFromSection(student.sectionId, studentId);
    } else {
      return;
    }
    const section = apiSections.find((item) => item._id === sectionId);
    setOrganizationUsers((items) => items.map((item) => item.id === studentId ? { ...item, section: sectionId || null } : item));
    setStudents((items) => items.map((item) => item.id === studentId ? { ...item, sectionId, section: section?.name || "Unassigned" } : item));
    onAction(sectionId ? "Student assigned to section." : "Student removed from section.");
  }

  async function editSection(section: SectionRow) {
    const response = await updateSection(section.id, {
      name: section.name, code: section.code, department: section.department,
      batch: section.batch, academicYear: section.academicYear,
      description: section.description, status: section.status === "Active" ? "active" : "inactive",
    });
    setApiSections((items) => items.map((item) => item._id === section.id ? response.section : item));
    setSections((items) => items.map((item) => item.id === section.id ? mapSection(response.section) : item));
    onAction("Section updated.");
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
    const response = await createUser({
      ...user,
      organization: getOrganizationId(currentUser?.organization),
      roleName: "student",
    });
    await refreshOrganizationUsers();
    setSelectedStudentId(response.user.id || response.user._id || "");
    onAction(response.temporaryPassword ? `Student created. Temporary password: ${response.temporaryPassword}` : response.message || "Student created.");
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

  async function createValidatedAssessment(payload: AdminAssessment & { difficulty?: string; attemptsAllowed?: number; questions?: Array<{ id: string; type: string; text: string; options: string[]; marks: string; correctAnswer?: string }> }) {
    const organizationId = getOrganizationId(currentUser?.organization);
    const assignedSection = apiSections.find((section) => section._id === payload.assignedTo);
    const questions: ApiAssessmentQuestion[] = (payload.questions ?? []).map((question) => ({
      type: question.type === "MCQ" ? "single-choice" : question.type === "Short Answer" ? "short-answer" : question.type === "Code Question" ? "coding" : "long-answer",
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer || null,
      marks: Number(question.marks),
      negativeMarks: 0,
    }));
    const totalMarks = questions.reduce((total, question) => total + question.marks, 0);
    const apiPayload = {
      organization: organizationId,
      title: payload.title,
      description: payload.type,
      category: payload.type,
      difficulty: (payload.difficulty || "intermediate") as "beginner" | "intermediate" | "advanced",
      instructions: payload.instructions,
      durationMinutes: Number.parseInt(payload.duration, 10) || 60,
      totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.4),
      attemptsAllowed: payload.attemptsAllowed || 1,
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

    {
      const validation = await validateAssessment(apiPayload);
      if (!validation.valid) {
        throw new Error(validation.errors.join("; "));
      }
      const response = await createAssessmentRecord(apiPayload);
      await refreshOrganizationWork();
      onAction(response.message || "Assessment created and validated.");
    }
  }

  if (usersLoading || workLoading) return <PageSkeleton label={`Loading ${activeNav.toLowerCase()}`} />;
  if (loadError) return <LoadError message={loadError} onRetry={() => { void refreshOrganizationUsers(); void refreshOrganizationWork(); }} />;

  if (activeNav === "Students") {
    return (
      <StudentsAdmin
        canManage={currentUser?.role !== "teacher"}
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
        canManage={currentUser?.role !== "teacher"}
        sections={sections}
        students={students}
        selectedSection={selectedSection}
        selectedStudent={selectedStudent}
        onCreateSection={createSection}
        onUpdateSection={editSection}
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
    return <WorkAdmin sections={sections} />;
  }

  if (activeNav === "Assessments") {
    return <AssessmentsAdmin assessments={assessments} sections={sections} onCreateValidatedAssessment={createValidatedAssessment} loading={workLoading} onPublish={async id => { await updateAssessment(id, { status: "active" }); await refreshOrganizationWork(); onAction("Assessment published. Students will receive a notification."); }} />;
  }

  if (activeNav === "Announcements") return <WorkAdmin key="announcements" sections={sections} initialKind="announcement" />;
  if (activeNav === "Reports") return <ReportsAdmin sections={sections} students={students} />;
  if (activeNav === "Settings") return <SettingsAdmin onAction={onAction} />;
  if (activeNav === "Groups") return <GroupsAdmin students={students} />;

  return <AdminDashboard sections={sections} students={students} coordinators={coordinators} tasks={tasks} assessments={assessments} loading={usersLoading || workLoading} loadError={loadError} onAction={onAction} />;
}
