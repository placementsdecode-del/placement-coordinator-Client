import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type {
  AdminAssessment,
  AdminMetric,
  AdminNavItem,
  AdminStudentRow,
  AdminTask,
  CoordinatorRole,
  CoordinatorRow,
  SectionRow,
} from "@/types/admin";

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Students", icon: Users },
  { label: "Coordinators", icon: ShieldCheck },
  { label: "Roles and Permissions", icon: Settings },
  { label: "Sections", icon: BookOpenCheck },
  { label: "Groups", icon: ClipboardList },
  { label: "Tasks", icon: CalendarDays },
  { label: "Assessments", icon: BarChart3 },
  { label: "Announcements", icon: Bell },
  { label: "Reports", icon: Megaphone },
  { label: "Settings", icon: Settings },
];

export const adminMetrics: AdminMetric[] = [];
export const adminSections: SectionRow[] = [];
export const adminStudents: AdminStudentRow[] = [];
export const adminCoordinators: CoordinatorRow[] = [];
export const coordinatorRoles: CoordinatorRole[] = [];
export const adminTasks: AdminTask[] = [];
export const adminAssessments: AdminAssessment[] = [];
