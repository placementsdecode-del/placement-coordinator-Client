import type { LucideIcon } from "lucide-react";

export type AdminNavLabel =
  | "Dashboard"
  | "Students"
  | "Coordinators"
  | "Sections"
  | "Groups"
  | "Tasks"
  | "Assessments"
  | "Announcements"
  | "Reports"
  | "Settings";

export type AdminNavItem = {
  label: AdminNavLabel;
  icon: LucideIcon;
};

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
  tone: string;
};

export type SectionRow = {
  id: string;
  name: string;
  code: string;
  department: string;
  batch: string;
  academicYear: string;
  students: number;
  coordinator: string;
  readiness: number;
  status: string;
  description: string;
};

export type AdminStudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  section: string;
  rollNo: string;
  groups: string;
  readiness: number;
  aptitude: number;
  coding: number;
  communication: number;
  interview: number;
  pending: number;
  status: string;
  placementStatus: "Placed" | "Not placed" | "In process";
  company?: string;
  packageLpa?: number;
  offerDate?: string;
  placementRound?: string;
};

export type CoordinatorRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  sections: string[];
  status: string;
};

export type CoordinatorRole = {
  id: string;
  name: string;
  permissions: string[];
};

export type AdminTask = {
  id: string;
  title: string;
  type: string;
  assignedTo: string;
  due: string;
  status: string;
  submissions: number;
};

export type AdminAssessment = {
  id: string;
  title: string;
  type: string;
  assignedTo: string;
  duration: string;
  instructions: string;
  rubric: string;
  status: string;
};
