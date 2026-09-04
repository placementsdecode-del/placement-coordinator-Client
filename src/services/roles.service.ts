import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { ApiRole } from "@/types/api";

export function listRoles(organizationId?: string | null) {
  return apiFetch<{ roles: ApiRole[] }>(API_ENDPOINTS.roles.list(organizationId)).then((response) => response.roles);
}

export function listPermissions() {
  return apiFetch<{ permissions: string[] }>(API_ENDPOINTS.roles.permissions).then((response) => response.permissions);
}

export function syncOrganizationRoles(organizationId: string) {
  return apiFetch<{ message: string; roles: Record<string, ApiRole> }>(API_ENDPOINTS.roles.sync(organizationId), {
    method: "POST",
  });
}

export function updateRole(
  roleId: string,
  payload: {
    displayName?: string;
    description?: string;
    permissions?: string[];
  },
) {
  return apiFetch<{ message: string; role: ApiRole }>(API_ENDPOINTS.roles.update(roleId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
