import { useEffect, useState } from "react";

import { PageSkeleton, LoadError } from "@/components/common/loading-state";

import { listFeatures } from "@/services/features.api.service";
import {
  approveOrganizationRegistration,
  listOrganizationRegistrations,
  rejectOrganizationRegistration,
} from "@/services/organization-registrations.api.service";
import { listOrganizations, updateOrganization } from "@/services/organizations.api.service";
import { listPermissions, listRoles } from "@/services/roles.api.service";
import { listUsers } from "@/services/users.api.service";
import { mapOrganization, mapRegistration } from "@/sections/super-admin/super-admin-mappers";
import { UsersPage, FeaturesPage, RolesSettingsPage } from "@/sections/super-admin/components/access-pages";
import { OrganizationsPage, RequestsPage } from "@/sections/super-admin/components/organization-pages";
import { AnalyticsPage, AuditPage, ChangelogPage, PlansPage, SupportPage } from "@/sections/super-admin/components/platform-pages";
import { SuperAdminDashboard } from "@/sections/super-admin/components/super-admin-dashboard";
import type { AcceptedOrganization, ApiRole, ApiUser, Feature } from "@/types/api";
import type { OrganizationRequest, OrganizationRow, SuperAdminNavLabel } from "@/types/super-admin";

export function SuperAdminSection({ activeNav, onAction }: { activeNav: SuperAdminNavLabel; onAction: (message: string) => void }) {
  const [orgRows, setOrgRows] = useState<OrganizationRow[]>([]);
  const [apiOrganizations, setApiOrganizations] = useState<AcceptedOrganization[]>([]);
  const [requests, setRequests] = useState<OrganizationRequest[]>([]);
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [approvalCredentials, setApprovalCredentials] = useState<{ email: string; password: string } | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState(orgRows[0]?.id ?? "");
  const selectedOrg = orgRows.find((org) => org.id === selectedOrgId) ?? orgRows[0] ?? null;

  async function refreshPlatformData() {
    setLoadError("");
    setPlatformLoading(true);
    try {
      const [registrations, acceptedOrganizations, users, featureRows, roleRows, permissionRows] = await Promise.all([
        listOrganizationRegistrations("pending"),
        listOrganizations(),
        listUsers(),
        listFeatures(),
        listRoles(),
        listPermissions(),
      ]);
      const mappedOrganizations = acceptedOrganizations.map(mapOrganization);
      setRequests(registrations.map(mapRegistration));
      setApiOrganizations(acceptedOrganizations);
      setOrgRows(mappedOrganizations);
      setApiUsers(users);
      setFeatures(featureRows);
      setRoles(roleRows);
      setPermissions(permissionRows);
      setSelectedOrgId((current) => mappedOrganizations.find((org) => org.id === current)?.id ?? mappedOrganizations[0]?.id ?? current);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load platform data.");
    } finally {
      setPlatformLoading(false);
    }
  }

  useEffect(() => {
    refreshPlatformData();
  }, []);

  async function updateOrgStatus(orgId: string, status: string) {
    try {
      await updateOrganization(orgId, { status: status === "Active" ? "active" : "suspended" });
      await refreshPlatformData();
      onAction(`Organization ${status.toLowerCase()}.`);
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Organization update failed.");
    }
  }

  async function updateOrgDetails(orgId: string, payload: Partial<AcceptedOrganization>) {
    try {
      await updateOrganization(orgId, payload);
      await refreshPlatformData();
      onAction("Organization details updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Organization update failed.");
    }
  }

  async function handleRequest(requestId: string, status: string) {
    try {
      if (status === "Approved") {
        const response = await approveOrganizationRegistration(requestId, {
          features: requests.find((request) => request.id === requestId)?.featureIds ?? [],
          adminName: "Organization Admin",
          discussionNotes: "Approved from frontend console.",
        });
        if (response.temporaryPassword) setApprovalCredentials({ email: response.admin.email, password: response.temporaryPassword });
        onAction(response.message);
      } else {
        await rejectOrganizationRegistration(requestId, { discussionNotes: "Rejected from frontend console." });
      }
      await refreshPlatformData();
      if (status !== 'Approved') onAction(`Organization request ${status.toLowerCase()}.`);
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Request update failed.");
    }
  }

  if (platformLoading) return <PageSkeleton label={`Loading ${activeNav.toLowerCase()}`} />;
  if (loadError) return <LoadError message={loadError} onRetry={() => void refreshPlatformData()} />;
  const credentialPanel = approvalCredentials && <div role="status" className="space-y-2 rounded-lg border bg-white p-4">
    <p className="font-semibold">Share these credentials with the organization admin</p>
    <p className="text-sm">Email delivery was unavailable. The admin will need to change this password after signing in.</p>
    <p className="break-all text-sm">{approvalCredentials.email}</p>
    <code className="block break-all select-all">{approvalCredentials.password}</code>
    <button type="button" className="text-sm font-medium text-primary underline" onClick={() => setApprovalCredentials(null)}>Dismiss credentials</button>
  </div>;

  if (activeNav === "Organizations") {
    return (
      <>{credentialPanel}<OrganizationsPage
        organizations={orgRows}
        apiOrganizations={apiOrganizations}
        selectedOrg={selectedOrg}
        loadError={loadError}
        onSelectOrg={setSelectedOrgId}
        onUpdateDetails={updateOrgDetails}
        onUpdateStatus={updateOrgStatus}
        onRecoverCredentials={async registrationId => {
          try {
            const response = await approveOrganizationRegistration(registrationId, { features: [], adminName: 'Organization Admin', discussionNotes: '' });
            if (response.temporaryPassword) setApprovalCredentials({ email: response.admin.email, password: response.temporaryPassword });
            onAction(response.message);
          } catch (reason) { onAction(reason instanceof Error ? reason.message : 'Unable to recover credentials'); }
        }}
        loading={platformLoading}
      /></>
    );
  }
  if (activeNav === "Requests") return <>
    {credentialPanel}
    <RequestsPage requests={requests} loadError={loadError} loading={platformLoading} onHandleRequest={handleRequest} />
  </>;
  if (activeNav === "Users") return <UsersPage apiUsers={apiUsers} organizations={apiOrganizations} loading={platformLoading} onUserChanged={refreshPlatformData} onAction={onAction} />;
  if (activeNav === "Settings") {
    return (
      <RolesSettingsPage
        organizations={apiOrganizations}
        permissions={permissions}
        roles={roles}
        loading={platformLoading}
        onRoleChanged={refreshPlatformData}
        onAction={onAction}
      />
    );
  }
  if (activeNav === "Features") return <FeaturesPage features={features} loading={platformLoading} onFeatureChanged={refreshPlatformData} onAction={onAction} />;
  if (activeNav === "Plans") return <PlansPage />;
  if (activeNav === "Analytics") return <AnalyticsPage organizations={orgRows} />;
  if (activeNav === "Support") return <SupportPage />;
  if (activeNav === "Audit Logs") return <AuditPage />;
  if (activeNav === "Changelog") return <ChangelogPage />;
  

  return <SuperAdminDashboard organizations={orgRows} requests={requests} loading={platformLoading} loadError={loadError} onAction={onAction} />;
}
