import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { AcceptedOrganization } from "@/types/api";

export function listOrganizations() {
  return apiFetch<{ organizations: AcceptedOrganization[] }>(API_ENDPOINTS.organizations.list).then(
    (response) => response.organizations,
  );
}

export function updateOrganization(organizationId: string, payload: Partial<AcceptedOrganization>) {
  return apiFetch<{ message: string; organization: AcceptedOrganization }>(API_ENDPOINTS.organizations.update(organizationId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
