import { Bell } from "lucide-react";
import { adminNavItems } from "@/data/admin";
import type { AdminNavLabel } from "@/types/admin";
import { ManagementShell, type ManagementShellProps } from "./management-shell";

const navigationGroups = [
  { heading: "Overview", labels: ["Dashboard", "Readiness"] },
  { heading: "Student management", labels: ["Students", "Cohorts", "Groups"] },
  { heading: "Learning", labels: ["Tasks", "Assessments"] },
  { heading: "Administration", labels: ["Coordinators", "Settings"] },
].map(({ heading, labels }) => ({
  heading,
  items: labels.flatMap(label => adminNavItems.filter(item => item.label === label)),
}));

export function AdminShell({ role = "admin", ...props }: ManagementShellProps<AdminNavLabel> & { role?: string }) {
  const coordinator = role === "teacher";
  const groups = coordinator ? navigationGroups.filter(group => group.heading !== "Administration") : navigationGroups;
  return <ManagementShell {...props}
    subtitle={coordinator ? "Coordinator" : "Organization admin"}
    groups={groups}
    home="Dashboard"
    wide={["Readiness", "Students", "Assessments", "Cohorts"].includes(props.activeNav)}
    shortcut={{ title: "Announcements", target: "Tasks", icon: Bell }}
  />;
}
