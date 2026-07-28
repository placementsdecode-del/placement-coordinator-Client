import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { RegisterOrg } from "@/types/api";

export type OrganizationRegistrationPayload = {
  id: string;
  orgName: string;
  orgEmail: string;
  address: string;
  phoneNumber: string;
  requestedFeatures: string[];
};

export function createOrganizationRegistration(payload: OrganizationRegistrationPayload) {
  return apiFetch<{ message: string; registration: RegisterOrg }>(API_ENDPOINTS.organizationRegistrations.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listOrganizationRegistrations(status?: "pending" | "accepted" | "rejected") {
  return apiFetch<RegisterOrg[]>(API_ENDPOINTS.organizationRegistrations.list(status));
}

export function approveOrganizationRegistration(
  registrationId: string,
  payload: { features: string[]; adminName: string; discussionNotes: string },
) {
  return apiFetch(API_ENDPOINTS.organizationRegistrations.approve(registrationId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function rejectOrganizationRegistration(registrationId: string, payload: { discussionNotes: string }) {
  return apiFetch(API_ENDPOINTS.organizationRegistrations.reject(registrationId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
