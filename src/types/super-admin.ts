import type { LucideIcon } from "lucide-react";

export type SuperAdminNavLabel =
  | "Dashboard"
  | "Organizations"
  | "Requests"
  | "Users"
  | "Features"
  | "Plans"
  | "Analytics"
  | "Support"
  | "Audit Logs"
  | "Changelog"
  | "Settings";

export type SuperAdminNavItem = {
  label: SuperAdminNavLabel;
  icon: LucideIcon;
};

export type OrganizationRow = {
  id: string;
  name: string;
  plan: string;
  status: string;
  students: number;
  coordinators: number;
  usage: number;
  region: string;
};

export type OrganizationRequest = {
  id: string;
  name: string;
  contact: string;
  phoneNumber?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  featureIds?: string[];
  requestedPlan: string;
  status: string;
  submitted: string;
  notes?: string;
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  status: string;
};

export type SupportTicket = {
  id: string;
  title: string;
  organization: string;
  priority: string;
  status: string;
};

export type CommitFile = {
  path: string;
  added: number;
  removed: number;
  // Unified-diff text for this file (may be empty for large/generated files).
  patch: string;
  // True when the patch was cut off at the line cap.
  patchTruncated: boolean;
};

export type CommitEntry = {
  hash: string;
  author: string;
  date: string;
  message: string;
  area: string;
  body: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  // Top changed files (capped). `filesChanged` is the true total.
  files: CommitFile[];
};
