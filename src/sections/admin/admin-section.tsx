import { ChangePasswordCard } from '@/components/common/change-password-card';
import { useApiResource } from "@/hooks/use-api-resource";
import { ResourcePanel } from "@/components/common/resource-panel";
import { listFaculty } from "@/services/groups.api.service";
import { BulkStudents } from "./components/bulk-students";
import { GroupsAdmin } from "@/sections/community/groups-admin";
import { WorkAdmin } from "@/sections/community/work-admin";
import { useCallback, useEffect, useState } from "react";


import { adminCoordinators, adminTasks, coordinatorRoles } from "@/data/admin";
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
  const organizationId = getOrganizationId(currentUser?.organization);
  const usersResource = useApiResource(useCallback(() => listUsers(organizationId), [organizationId]), [] as ApiUser[]);
  const sectionsResource = useApiResource(useCallback(() => listSections(organizationId), [organizationId]), [] as ApiSection[]);
  const assessmentsResource = useApiResource(useCallback(() => listAssessments(organizationId), [organizationId]), [] as Awaited<ReturnType<typeof listAssessments>>);
  const facultyResource = useApiResource(listFaculty, { faculty: [] as ApiUser[] });
  const rolesResource = useApiResource(useCallback(() => currentUser?.role === 'teacher' ? Promise.resolve([]) : listRoles(organizationId), [organizationId, currentUser?.role]), [] as ApiRole[]);
  const permissionsResource = useApiResource(useCallback(() => currentUser?.role === 'teacher' ? Promise.resolve([]) : listPermissions(), [currentUser?.role]), [] as string[]);
  const { data: organizationUsers, setData: setOrganizationUsers, refresh: refreshOrganizationUsers } = usersResource;
  const { data: apiSections, setData: setApiSections, refresh: refreshSections } = sectionsResource;
  const { refresh: refreshAssessments } = assessmentsResource;
  const sections = apiSections.map(mapSection);
  const assessments = assessmentsResource.data.map(mapAssessment);
  const faculty = facultyResource.data.faculty;
  const apiRoles = rolesResource.data;
  const apiPermissions = permissionsResource.data;
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorRow[]>(adminCoordinators);
  const [roles, setRoles] = useState<CoordinatorRole[]>(coordinatorRoles);
  const [tasks] = useState<AdminTask[]>(adminTasks);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const selectedSection = sections.find(s => s.id === selectedSectionId) ?? null;
  const selectedStudent = students.find(s => s.id === selectedStudentId) ?? null;
  useEffect(() => {
    setCoordinators(organizationUsers.filter(u => u.role === 'teacher').map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phoneNumber || '', role: 'Coordinator', status: u.status === 'active' ? 'Active' : 'Inactive', sections: apiSections.filter(s => s.assignedTeachers.some(t => (t.id || t._id) === u.id)).map(s => s.name) })));
    setStudents(organizationUsers.filter(u => u.role === 'student').map(u => mapStudentUser(u, apiSections)));
  }, [organizationUsers, apiSections]);

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
    await refreshSections();
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
    onAction("Section updated.");
  }

  async function addCoordinator(coordinator: CoordinatorRow, teacherId?: string) {
    const apiSectionIds = apiSections.filter((section) => coordinator.sections.includes(section.name)).map((section) => section._id);
    const teacher = teacherId ? { id: teacherId } : organizationUsers.find((user) => user.email === coordinator.email);
    setCoordinators((items) => [coordinator, ...items]);

    if (teacher && apiSectionIds.length) {
      await Promise.all(apiSectionIds.map((sectionId) => {
        const section = apiSections.find((item) => item._id === sectionId);
        const assignedTeachers = new Set(section?.assignedTeachers.map((item) => item.id || item._id || "") ?? []);
        assignedTeachers.add(teacher.id);
        return updateSection(sectionId, { assignedTeachers: Array.from(assignedTeachers) });
      }));
      await refreshSections();
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
      void facultyResource.refresh();
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
      await rolesResource.refresh();
      onAction("Organization roles are ready.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role sync failed.");
    }
  }

  async function updateApiRolePermissions(roleId: string, permissions: string[]) {
    try {
      await updateRole(roleId, { permissions });
      await rolesResource.refresh();
      onAction("Role permissions updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role update failed.");
    }
  }

  async function createValidatedAssessment(payload: AdminAssessment & { difficulty?: string; attemptsAllowed?: number; passingPercentage?: number; questions?: Array<{ id: string; type: string; text: string; options: string[]; marks: string; correctAnswer?: string }> }) {
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
      passingMarks: Math.ceil(totalMarks * (payload.passingPercentage ?? 40) / 100),
      rubric: payload.rubric,
      attemptsAllowed: payload.attemptsAllowed || 1,
      negativeMarking: false,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultImmediately: true,
      allowAnswerReview: true,
      assignedSections: assignedSection ? [assignedSection._id] : [],
      assignedGroups: payload.assignedTo.startsWith("group:") ? [payload.assignedTo.slice(6)] : [],
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
      await refreshAssessments();
      onAction(response.message || "Assessment created and validated.");
    }
  }

  if (activeNav === "Students") {
    return (
      <><ResourcePanel resource={sectionsResource} label="Import cohorts"><BulkStudents sections={sections} onImported={refreshOrganizationUsers} /></ResourcePanel><ResourcePanel resource={usersResource} label="Students"><StudentsAdmin
        canManage={currentUser?.role !== "teacher"}
        sections={sections}
        students={students}
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudentId}
        onCreateStudent={createStudent}
        onMoveStudent={moveStudent}
        loading={false}
      /></ResourcePanel></>
    );
  }

  if (activeNav === "Cohorts") {
    return (
      <ResourcePanel resource={sectionsResource} label="Cohorts"><SectionsAdmin
        studentsStatus={usersResource}
        facultyStatus={facultyResource}
        faculty={faculty}
        assignments={Object.fromEntries(apiSections.map(s => [s._id, s.assignedTeachers.map(t => t.id || t._id || '')]))}
        onAssignCoordinators={async (id, teachers) => { await updateSection(id, { assignedTeachers: teachers }); await refreshSections(); }}
        onRefresh={refreshOrganizationUsers}
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
        loading={false}
      /></ResourcePanel>
    );
  }

  if (activeNav === "Coordinators") {
    return (
      <><ResourcePanel resource={rolesResource} label="Roles" />
      <ResourcePanel resource={permissionsResource} label="Permissions" />
      <ResourcePanel resource={sectionsResource} label="Coordinator cohorts" />
      <ResourcePanel resource={usersResource} label="Coordinators"><CoordinatorsAdmin
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
        loading={false}
      /></ResourcePanel></>
    );
  }

  if (activeNav === "Tasks") {
    return <WorkAdmin sections={sections} sectionsStatus={sectionsResource} />;
  }

  if (activeNav === "Assessments") {
    return <AssessmentsAdmin assessments={assessments} sections={sections} onCreateValidatedAssessment={createValidatedAssessment} loading={assessmentsResource.loading && !assessmentsResource.initialized} assessmentsStatus={assessmentsResource} sectionsStatus={sectionsResource} onPublish={async id => { await updateAssessment(id, { status: "active" }); await refreshAssessments(); onAction("Assessment published. Students will receive a notification."); }} />;
  }

  if (activeNav === "Announcements") return <WorkAdmin key="announcements" sections={sections} sectionsStatus={sectionsResource} initialKind="announcement" />;
  if (activeNav === "Reports") return <ReportsAdmin sections={sections} students={students} />;
  if (activeNav === "Settings") return currentUser?.role === "teacher" ? <ChangePasswordCard mustChangePassword={currentUser.mustChangePassword} /> : <SettingsAdmin />;
  if (activeNav === "Groups") return <GroupsAdmin students={students} faculty={faculty} studentsStatus={usersResource} facultyStatus={facultyResource} />;

  return <AdminDashboard sections={sections} students={students} coordinators={coordinators} tasks={tasks} assessments={assessments} loading={false} loadError="" resources={{ students: usersResource, cohorts: sectionsResource, assessments: assessmentsResource }} onAction={onAction} />;
}
