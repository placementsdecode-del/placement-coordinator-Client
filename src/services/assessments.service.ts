import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { ApiAssessment } from "@/types/api";

export type AssessmentPayload = Omit<ApiAssessment, "_id" | "organization" | "assignedSections" | "assignedTeachers"> & {
  organization?: string;
  assignedSections?: string[];
  assignedTeachers?: string[];
};

export function listAssessments(organizationId?: string | null) {
  return apiFetch<{ assessments: ApiAssessment[] }>(API_ENDPOINTS.assessments.list(organizationId)).then(
    (response) => response.assessments,
  );
}

export function createAssessment(payload: AssessmentPayload) {
  return apiFetch<{ message: string; assessment: ApiAssessment }>(API_ENDPOINTS.assessments.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function validateAssessment(payload: AssessmentPayload) {
  return apiFetch<{ valid: boolean; errors: string[] }>(API_ENDPOINTS.assessments.validate, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAssessment(assessmentId: string, payload: Partial<AssessmentPayload>) {
  return apiFetch<{ message: string; assessment: ApiAssessment }>(API_ENDPOINTS.assessments.update(assessmentId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function validateExistingAssessment(assessmentId: string) {
  return apiFetch<{ valid: boolean; errors: string[] }>(API_ENDPOINTS.assessments.validateExisting(assessmentId), {
    method: "POST",
  });
}
