import type { ApiRoleName, ApiUser } from "@/types/api";

export type UserRole = "student" | "teacher" | "admin" | "super-admin";

export type SessionUser = ApiUser & {
  appRole: UserRole;
};

export function toAppRole(role: ApiRoleName): UserRole {
  return role === "superadmin" ? "super-admin" : role;
}
