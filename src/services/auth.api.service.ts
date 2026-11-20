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

export const updateProfile = (payload: { phoneNumber: string; skills: string[]; resumeUrl: string }) => apiFetch<{ user: ApiUser; message: string }>('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) });

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<{ message: string }>(API_ENDPOINTS.auth.changePassword, {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
