import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { ApiSection } from "@/types/api";

export type SectionPayload = {
  organization?: string;
  name: string;
  code: string;
  department: string;
  batch: string;
  academicYear: string;
  assignedTeachers?: string[];
  status?: "active" | "inactive";
  description?: string;
};

export function listSections(organizationId?: string | null) {
  return apiFetch<{ sections: ApiSection[] }>(API_ENDPOINTS.sections.list(organizationId)).then((response) => response.sections);
}

export function createSection(payload: SectionPayload) {
  return apiFetch<{ message: string; section: ApiSection }>(API_ENDPOINTS.sections.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSection(sectionId: string, payload: Partial<SectionPayload>) {
  return apiFetch<{ message: string; section: ApiSection }>(API_ENDPOINTS.sections.update(sectionId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function assignStudentToSection(sectionId: string, studentId: string) {
  return apiFetch<{ message: string }>(API_ENDPOINTS.sections.assignStudent(sectionId, studentId), {
    method: "POST",
  });
}

export function removeStudentFromSection(sectionId: string, studentId: string) {
  return apiFetch<{ message: string }>(API_ENDPOINTS.sections.assignStudent(sectionId, studentId), { method: "DELETE" });
}
export const addCohortMember = (cohort: string, student: string) => apiFetch(`/api/sections/${cohort}/members/${student}`, { method: 'POST' });
export const removeCohortMember = (cohort: string, student: string) => apiFetch(`/api/sections/${cohort}/members/${student}`, { method: 'DELETE' });
