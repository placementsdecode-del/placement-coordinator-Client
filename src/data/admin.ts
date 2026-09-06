import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
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
  { label: "Readiness", icon: BarChart3 },
  { label: "Students", icon: Users },
  { label: "Coordinators", icon: ShieldCheck },
  { label: "Cohorts", icon: BookOpenCheck },
  { label: "Groups", icon: ClipboardList },
  { label: "Tasks", icon: CalendarDays },
  { label: "Assessments", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

export const adminMetrics: AdminMetric[] = [];
export const adminSections: SectionRow[] = [];
export const adminStudents: AdminStudentRow[] = [];
export const adminCoordinators: CoordinatorRow[] = [];
export const coordinatorRoles: CoordinatorRole[] = [];
export const adminTasks: AdminTask[] = [];
export const adminAssessments: AdminAssessment[] = [];
