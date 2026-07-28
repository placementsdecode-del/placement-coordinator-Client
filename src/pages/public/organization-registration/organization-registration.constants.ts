import type { Feature } from "@/types/api";

export const INITIAL_ORGANIZATION_REGISTRATION_FORM = {
  id: "",
  orgName: "",
  orgEmail: "",
  address: "",
  phoneNumber: "",
};

export const FALLBACK_REGISTRATION_FEATURES: Feature[] = [
  {
    _id: "student-workspace",
    key: "student-workspace",
    name: "Student Workspace",
    description: "Preparation dashboards and assignments.",
    enabledByDefault: true,
    isActive: true,
  },
  {
    _id: "assessments",
    key: "assessments",
    name: "Assessments",
    description: "Mock tests and scoring workflows.",
    enabledByDefault: true,
    isActive: true,
  },
  {
    _id: "analytics",
    key: "analytics",
    name: "Analytics",
    description: "Readiness reporting for admins.",
    enabledByDefault: false,
    isActive: true,
  },
];
