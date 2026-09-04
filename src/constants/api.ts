export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://server-two-tau-93.vercel.app/";

export const ACCESS_TOKEN_KEY = "accessToken";

export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    me: "/api/auth/me",
    changePassword: "/api/auth/password",
  },
  features: {
    list: "/api/features",
    create: "/api/features",
    update: (featureId: string) => `/api/features/${featureId}`,
  },
  organizations: {
    list: "/api/organizations",
    detail: (organizationId: string) => `/api/organizations/${organizationId}`,
    update: (organizationId: string) => `/api/organizations/${organizationId}`,
  },
  organizationRegistrations: {
    create: "/api/org-registrations",
    list: (status?: string) => `/api/org-registrations${status ? `?status=${status}` : ""}`,
    detail: (registrationId: string) => `/api/org-registrations/${registrationId}`,
    approve: (registrationId: string) => `/api/org-registrations/${registrationId}/approve`,
    reject: (registrationId: string) => `/api/org-registrations/${registrationId}/reject`,
  },
  users: {
    list: (organizationId?: string | null) => `/api/users${organizationId ? `?organization=${organizationId}` : ""}`,
    create: "/api/users",
    update: (userId: string) => `/api/users/${userId}`,
  },
  roles: {
    list: (organizationId?: string | null) => `/api/roles${organizationId ? `?organization=${organizationId}` : ""}`,
    permissions: "/api/roles/permissions",
    sync: (organizationId: string) => `/api/roles/organizations/${organizationId}/sync`,
    update: (roleId: string) => `/api/roles/${roleId}`,
  },
  sections: {
    list: (organizationId?: string | null) => `/api/sections${organizationId ? `?organization=${organizationId}` : ""}`,
    create: "/api/sections",
    update: (sectionId: string) => `/api/sections/${sectionId}`,
    assignStudent: (sectionId: string, studentId: string) => `/api/sections/${sectionId}/students/${studentId}`,
  },
  assessments: {
    list: (organizationId?: string | null) => `/api/assessments${organizationId ? `?organization=${organizationId}` : ""}`,
    create: "/api/assessments",
    validate: "/api/assessments/validate",
    update: (assessmentId: string) => `/api/assessments/${assessmentId}`,
    validateExisting: (assessmentId: string) => `/api/assessments/${assessmentId}/validate`,
  },
} as const;
