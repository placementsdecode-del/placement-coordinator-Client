import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { ApiUser, CreateUserResponse } from "@/types/api";

export type CreateUserPayload = {
  organization?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  registrationNumber?: string;
  department?: string;
  batch?: string;
  section?: string;
  groups?: string[];
  preparationScore?: number;
  roleName: "admin" | "teacher" | "student";
  password?: string;
};

export async function listUsers(organizationId?: string | null) {
  const users: ApiUser[] = [];
  let before: string | null = null;
  do {
    const params = new URLSearchParams({ limit: '200' });
    if (organizationId) params.set('organization', organizationId);
    if (before) params.set('before', before);
    const page = await apiFetch<{ users: ApiUser[]; nextCursor?: string | null }>(`/api/users?${params}`);
    users.push(...page.users.map(user => ({ ...user, id: user.id || user._id || '' })));
    before = page.nextCursor || null;
  } while (before);
  return users;
}

export function createUser(payload: CreateUserPayload) {
  return apiFetch<CreateUserResponse>(API_ENDPOINTS.users.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: string, payload: Partial<CreateUserPayload> & { status?: "active" | "inactive" }) {
  return apiFetch<{ message: string; user: ApiUser }>(API_ENDPOINTS.users.update(userId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
export type BulkImportResult = { row: number; email: string; status: string; temporaryPassword?: string; error?: string };
export const bulkImportStudents = (students: Record<string, string>[]) => apiFetch<{ results: BulkImportResult[] }>('/api/users/bulk-students', { method: 'POST', body: JSON.stringify({ students }) });
