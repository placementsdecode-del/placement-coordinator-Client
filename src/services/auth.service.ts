import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { ApiUser, LoginResponse } from "@/types/api";

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  const response = await apiFetch<{ user: ApiUser } | ApiUser>(API_ENDPOINTS.auth.me);
  return "user" in response ? response.user : response;
}
