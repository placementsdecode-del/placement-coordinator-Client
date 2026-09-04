import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Building2, Check, ChevronDown, ChevronRight, CreditCard, FileText, GitCommitHorizontal, LifeBuoy, LoaderCircle, Mail, MapPin, Phone, Plus, Settings, ShieldCheck, Users, X, type LucideIcon } from "lucide-react";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { ApiNotice, InfoTile } from "@/components/common/admin-primitives";
import { DonutProgress } from "@/components/common/donut-progress";
import { EmptyState } from "@/components/common/empty-state";
import { FieldError, isValidEmail } from "@/components/common/form-validation";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auditLogs, organizationRequests, organizations, supportTickets } from "@/data/super-admin";
import { cn } from "@/lib/utils";
import { createFeature as createFeatureRecord, listFeatures, updateFeature } from "@/services/features.service";
import {
  approveOrganizationRegistration,
  listOrganizationRegistrations,
  rejectOrganizationRegistration,
} from "@/services/organization-registrations.service";
import { listOrganizations, updateOrganization } from "@/services/organizations.service";
import { listPermissions, listRoles, syncOrganizationRoles, updateRole } from "@/services/roles.service";
import { createUser as createUserRecord, listUsers, updateUser } from "@/services/users.service";
import { mapOrganization, mapRegistration } from "@/sections/super-admin/super-admin-mappers";
import { UsersPage, FeaturesPage, RolesSettingsPage } from "@/sections/super-admin/components/access-pages";
import { OrganizationsPage, RequestsPage } from "@/sections/super-admin/components/organization-pages";
import { AnalyticsPage, AuditPage, ChangelogPage, PlansPage, PlatformSettingsPage, SupportPage } from "@/sections/super-admin/components/platform-pages";
import { SuperAdminDashboard } from "@/sections/super-admin/components/super-admin-dashboard";
import type { AcceptedOrganization, ApiRole, ApiUser, Feature, RegisterOrg } from "@/types/api";
import type { CommitEntry, OrganizationRequest, OrganizationRow, SuperAdminNavLabel } from "@/types/super-admin";

export function SuperAdminSection({ activeNav, onAction }: { activeNav: SuperAdminNavLabel; onAction: (message: string) => void }) {
  const [orgRows, setOrgRows] = useState<OrganizationRow[]>(organizations);
  const [apiOrganizations, setApiOrganizations] = useState<AcceptedOrganization[]>([]);
  const [requests, setRequests] = useState<OrganizationRequest[]>(organizationRequests);
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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
        await approveOrganizationRegistration(requestId, {
          features: requests.find((request) => request.id === requestId)?.featureIds ?? [],
          adminName: "Organization Admin",
          discussionNotes: "Approved from frontend console.",
        });
      } else {
        await rejectOrganizationRegistration(requestId, { discussionNotes: "Rejected from frontend console." });
      }
      await refreshPlatformData();
      onAction(`Organization request ${status.toLowerCase()}.`);
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Request update failed.");
    }
  }

  if (activeNav === "Organizations") {
    return (
      <OrganizationsPage
        organizations={orgRows}
        apiOrganizations={apiOrganizations}
        selectedOrg={selectedOrg}
        loadError={loadError}
        onSelectOrg={setSelectedOrgId}
        onUpdateDetails={updateOrgDetails}
        onUpdateStatus={updateOrgStatus}
        loading={platformLoading}
      />
    );
  }
  if (activeNav === "Requests") return <RequestsPage requests={requests} loadError={loadError} loading={platformLoading} onHandleRequest={handleRequest} />;
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
  if (activeNav === "Plans") return <PlansPage onAction={onAction} />;
  if (activeNav === "Analytics") return <AnalyticsPage organizations={orgRows} />;
  if (activeNav === "Support") return <SupportPage onAction={onAction} />;
  if (activeNav === "Audit Logs") return <AuditPage />;
  if (activeNav === "Changelog") return <ChangelogPage />;
  

  return <SuperAdminDashboard organizations={orgRows} requests={requests} loading={platformLoading} loadError={loadError} onAction={onAction} />;
}
















