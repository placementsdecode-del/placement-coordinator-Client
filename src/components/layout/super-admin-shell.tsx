import { LifeBuoy } from "lucide-react";
import { superAdminNavItems } from "@/data/super-admin";
import type { SuperAdminNavLabel } from "@/types/super-admin";
import { ManagementShell, type ManagementShellProps } from "./management-shell";

const navigationGroups = [
  { heading: "Overview", labels: ["Dashboard", "Analytics"] },
  { heading: "Organization management", labels: ["Organizations", "Requests", "Users"] },
  { heading: "Platform", labels: ["Features", "Plans", "Support", "Audit Logs", "Changelog", "Settings"] },
].map(({ heading, labels }) => ({
  heading,
  items: labels.flatMap(label => superAdminNavItems.filter(item => item.label === label)),
}));

export function SuperAdminShell(props: ManagementShellProps<SuperAdminNavLabel>) {
  return <ManagementShell {...props}
    subtitle="Super admin"
    groups={navigationGroups}
    home="Dashboard"
    wide={["Organizations", "Users", "Changelog"].includes(props.activeNav)}
    shortcut={{ title: "Support", target: "Support", icon: LifeBuoy }}
  />;
}
