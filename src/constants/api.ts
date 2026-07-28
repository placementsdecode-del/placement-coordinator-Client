export const API_BASE_URL = "https://server-qx2zb1ac5-sleep-16dd15c4.vercel.app";

export const ACCESS_TOKEN_KEY = "accessToken";

export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    me: "/api/auth/me",
  },
  features: {
    list: "/api/features",
    create: "/api/features",
    update: (featureId: string) => `/api/features/${featureId}`,
  },
  organizations: {
    list: "/api/organizations",
    detail: (organizationId: string) => `/api/organizations/${organizationId}`,
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
  },
} as const;
