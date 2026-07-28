import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { ApiUser, CreateUserResponse } from "@/types/api";

export type CreateUserPayload = {
  organization?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  roleName: "admin" | "teacher" | "student";
  password?: string;
};

export function listUsers(organizationId?: string | null) {
  return apiFetch<ApiUser[]>(API_ENDPOINTS.users.list(organizationId));
}

export function createUser(payload: CreateUserPayload) {
  return apiFetch<CreateUserResponse>(API_ENDPOINTS.users.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
