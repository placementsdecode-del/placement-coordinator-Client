import type { ApiAssessment, ApiSection, ApiUser } from "@/types/api";
import type { AdminAssessment, AdminStudentRow, SectionRow } from "@/types/admin";
import type { SessionUser } from "@/types/auth";

export function getOrganizationId(organization: SessionUser["organization"] | undefined) {
  if (!organization) return undefined;
  return typeof organization === "string" ? organization : organization._id;
}

export function mapSection(section: ApiSection): SectionRow {
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

export function mapStudentUser(user: ApiUser, sections: ApiSection[] = []): AdminStudentRow {
  const sectionName =
    typeof user.section === "object" && user.section
      ? user.section.name
      : sections.find((section) => section._id === user.section)?.name ?? "Unassigned";

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

export function mapAssessment(assessment: ApiAssessment): AdminAssessment {
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
