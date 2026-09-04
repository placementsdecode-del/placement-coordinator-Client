import {
  BarChart3,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileClock,
  GitCommitHorizontal,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { OrganizationRequest, OrganizationRow, PlatformUser, SuperAdminNavItem, SupportTicket } from "@/types/super-admin";

export const superAdminNavItems: SuperAdminNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Organizations", icon: Building2 },
  { label: "Requests", icon: ClipboardCheck },
  { label: "Users", icon: Users },
  { label: "Features", icon: SlidersHorizontal },
  { label: "Plans", icon: CreditCard },
  { label: "Analytics", icon: BarChart3 },
  { label: "Support", icon: LifeBuoy },
  { label: "Audit Logs", icon: FileClock },
  { label: "Changelog", icon: GitCommitHorizontal },
  { label: "Settings", icon: Settings },
];

export const platformMetrics: Array<{ label: string; value: string; detail: string }> = [];
export const organizations: OrganizationRow[] = [];
export const organizationRequests: OrganizationRequest[] = [];
export const platformUsers: PlatformUser[] = [];
export const supportTickets: SupportTicket[] = [];
export const auditLogs: string[] = [];
