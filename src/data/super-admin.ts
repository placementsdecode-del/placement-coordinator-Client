import { BarChart3, Building2, ClipboardCheck, CreditCard, FileClock, GitCommitHorizontal, LayoutDashboard, LifeBuoy, Settings, SlidersHorizontal, Users } from "lucide-react";
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

export const platformMetrics = [
  { label: "Organizations", value: "42", detail: "38 active" },
  { label: "Total users", value: "28,640", detail: "+11% this month" },
  { label: "Students", value: "24,980", detail: "Across all tenants" },
  { label: "MRR", value: "₹12.4L", detail: "Subscription revenue" },
];

export const organizations: OrganizationRow[] = [
  { id: "org-abc", name: "ABC Institute of Technology", plan: "Enterprise", status: "Active", students: 1248, coordinators: 18, usage: 82, region: "South" },
  { id: "org-sri", name: "Sri Valley College", plan: "Growth", status: "Active", students: 842, coordinators: 11, usage: 68, region: "West" },
  { id: "org-north", name: "North City University", plan: "Trial", status: "Pending", students: 260, coordinators: 4, usage: 34, region: "North" },
  { id: "org-lotus", name: "Lotus Engineering College", plan: "Starter", status: "Suspended", students: 512, coordinators: 7, usage: 41, region: "East" },
];

export const organizationRequests: OrganizationRequest[] = [
  { id: "req-1", name: "Greenfield Institute", contact: "admin@greenfield.edu", requestedPlan: "Growth", status: "New", submitted: "Today" },
  { id: "req-2", name: "Metro Tech College", contact: "placements@metro.edu", requestedPlan: "Enterprise", status: "Reviewing", submitted: "Yesterday" },
];

export const platformUsers: PlatformUser[] = [
  { id: "user-1", name: "Naveen Rao", email: "naveen@abc.edu", role: "Organization Admin", organization: "ABC Institute", status: "Active" },
  { id: "user-2", name: "Priya Raman", email: "priya@abc.edu", role: "Coordinator", organization: "ABC Institute", status: "Active" },
  { id: "user-3", name: "Asha Menon", email: "asha@sri.edu", role: "Organization Admin", organization: "Sri Valley", status: "Active" },
  { id: "user-4", name: "Trial Admin", email: "trial@north.edu", role: "Organization Admin", organization: "North City", status: "Pending" },
];

export const supportTickets: SupportTicket[] = [
  { id: "SUP-1042", title: "Bulk import failed for CSE batch", organization: "ABC Institute", priority: "High", status: "Open" },
  { id: "SUP-1041", title: "Subscription invoice correction", organization: "Sri Valley", priority: "Medium", status: "Waiting" },
  { id: "SUP-1039", title: "Assessment timer issue", organization: "Lotus Engineering", priority: "Critical", status: "Escalated" },
];

export const auditLogs = [
  "ABC Institute created assessment Cognizant Mock Test",
  "Super Admin approved Sri Valley College plan upgrade",
  "Lotus Engineering account was suspended for billing review",
  "Greenfield Institute submitted organization registration",
];
