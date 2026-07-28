import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { AcceptedOrganization } from "@/types/api";

export function listOrganizations() {
  return apiFetch<AcceptedOrganization[]>(API_ENDPOINTS.organizations.list);
}
