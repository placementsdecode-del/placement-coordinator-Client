import type { AcceptedOrganization, ApiUser, Feature, RegisterOrg } from "@/types/api";
import type { OrganizationRequest, OrganizationRow } from "@/types/super-admin";

export function mapRegistration(registration: RegisterOrg): OrganizationRequest {
  return {
    id: registration._id,
    name: registration.orgName,
    contact: registration.orgEmail,
    phoneNumber: registration.phoneNumber,
    address: registration.address,
    country: registration.location?.country,
    state: registration.location?.state,
    city: registration.location?.city,
    postalCode: registration.location?.postalCode,
    featureIds: registration.requestedFeatures.map((feature) => (typeof feature === "string" ? feature : feature._id)),
    requestedPlan: featureNames(registration.requestedFeatures),
    status: registration.status === "pending" ? "New" : registration.status,
    submitted: registration.externalId ?? "Submitted",
    notes: registration.discussionNotes,
  };
}

export function mapOrganization(organization: AcceptedOrganization): OrganizationRow {
  return {
    id: organization._id,
    name: organization.orgName,
    plan: featureNames(organization.features) || "Custom",
    status: organization.status === "active" ? "Active" : "Suspended",
    students: 0,
    coordinators: organization.adminUser ? 1 : 0,
    usage: organization.status === "active" ? 72 : 28,
    region: organization.address,
  };
}

export function featureNames(features: string[] | Feature[]) {
  return features.map((feature) => (typeof feature === "string" ? feature : feature.name)).filter(Boolean).join(", ");
}

export function organizationLabel(organization: ApiUser["organization"]) {
  if (!organization) return "No organization";
  return typeof organization === "string" ? organization : organization.orgName || organization._id;
}
