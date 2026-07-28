export type ApiRoleName = "superadmin" | "admin" | "teacher" | "student";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: ApiRoleName;
  permissions?: string[];
  organization?: string | null;
  mustChangePassword: boolean;
  status: "active" | "inactive";
};

export type Feature = {
  _id: string;
  key: string;
  name: string;
  description: string;
  enabledByDefault: boolean;
  isActive: boolean;
};

export type RegisterOrg = {
  _id: string;
  externalId?: string;
  orgName: string;
  orgEmail: string;
  address: string;
  phoneNumber: string;
  requestedFeatures: string[] | Feature[];
  status: "pending" | "accepted" | "rejected";
  discussionNotes?: string;
};

export type AcceptedOrganization = {
  _id: string;
  registrationRequest: string;
  orgName: string;
  orgEmail: string;
  address: string;
  phoneNumber: string;
  features: string[] | Feature[];
  adminUser?: string | ApiUser | null;
  status: "active" | "suspended";
};

export type LoginResponse = {
  token: string;
  user: ApiUser;
};

export type CreateUserResponse = {
  message: string;
  user: ApiUser;
  temporaryPassword?: string;
};
