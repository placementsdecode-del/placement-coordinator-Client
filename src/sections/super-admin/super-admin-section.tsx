import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Check, ChevronDown, ChevronRight, CreditCard, FileText, GitCommitHorizontal, LifeBuoy, LoaderCircle, Plus, Settings, ShieldCheck, X } from "lucide-react";
import { DonutProgress } from "@/components/common/donut-progress";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auditLogs, organizationRequests, organizations, platformMetrics, platformUsers, supportTickets } from "@/data/super-admin";
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
  const [loadError, setLoadError] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState(orgRows[0]?.id ?? "");
  const selectedOrg = orgRows.find((org) => org.id === selectedOrgId) ?? orgRows[0];

  async function refreshPlatformData() {
    setLoadError("");
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
      setOrgRows(mappedOrganizations.length ? mappedOrganizations : organizations);
      setApiUsers(users);
      setFeatures(featureRows);
      setRoles(roleRows);
      setPermissions(permissionRows);
      setSelectedOrgId((current) => mappedOrganizations.find((org) => org.id === current)?.id ?? mappedOrganizations[0]?.id ?? current);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load platform data.");
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
      />
    );
  }
  if (activeNav === "Requests") return <RequestsPage requests={requests} loadError={loadError} onHandleRequest={handleRequest} />;
  if (activeNav === "Users") return <UsersPage apiUsers={apiUsers} organizations={apiOrganizations} onUserChanged={refreshPlatformData} onAction={onAction} />;
  if (activeNav === "Settings") {
    return (
      <RolesSettingsPage
        organizations={apiOrganizations}
        permissions={permissions}
        roles={roles}
        onRoleChanged={refreshPlatformData}
        onAction={onAction}
      />
    );
  }
  if (activeNav === "Features") return <FeaturesPage features={features} onFeatureChanged={refreshPlatformData} onAction={onAction} />;
  if (activeNav === "Plans") return <PlansPage onAction={onAction} />;
  if (activeNav === "Analytics") return <AnalyticsPage organizations={orgRows} />;
  if (activeNav === "Support") return <SupportPage onAction={onAction} />;
  if (activeNav === "Audit Logs") return <AuditPage />;
  if (activeNav === "Changelog") return <ChangelogPage />;
  

  return <SuperAdminDashboard organizations={orgRows} requests={requests} onAction={onAction} />;
}

function mapRegistration(registration: RegisterOrg): OrganizationRequest {
  return {
    id: registration._id,
    name: registration.orgName,
    contact: registration.orgEmail,
    featureIds: registration.requestedFeatures.map((feature) => (typeof feature === "string" ? feature : feature._id)),
    requestedPlan: featureNames(registration.requestedFeatures),
    status: registration.status === "pending" ? "New" : registration.status,
    submitted: registration.externalId ?? "Submitted",
  };
}

function mapOrganization(organization: AcceptedOrganization): OrganizationRow {
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

function featureNames(features: string[] | Feature[]) {
  return features.map((feature) => (typeof feature === "string" ? feature : feature.name)).filter(Boolean).join(", ");
}

function organizationLabel(organization: ApiUser["organization"]) {
  if (!organization) return "No organization";
  return typeof organization === "string" ? organization : organization.orgName || organization._id;
}

function SuperAdminDashboard({
  organizations,
  requests,
  onAction,
}: {
  organizations: OrganizationRow[];
  requests: OrganizationRequest[];
  onAction: (message: string) => void;
}) {
  return (
    <>
      <SectionIntro
        eyebrow="Super Admin"
        title="Platform operations across every organization."
        description="Approve institutions, manage subscriptions, monitor platform usage, review support, and audit activity."
        action={
          <Button onClick={() => onAction("Global platform action opened.")}>
            <Plus className="h-4 w-4" />
            Global Action
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {platformMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Organization Health</CardTitle>
            <CardDescription>{organizations.length} organizations tracked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {organizations.map((org) => (
              <div key={org.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{org.name}</p>
                    <Badge variant={org.status === "Active" ? "secondary" : org.status === "Suspended" ? "danger" : "warning"}>{org.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {org.plan} · {org.students} students · {org.region}
                  </p>
                </div>
                <DonutProgress value={org.usage} size="sm" className="justify-self-start sm:justify-self-end" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Work</CardTitle>
            <CardDescription>Platform queues.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Organization requests", value: requests.filter((request) => request.status !== "Approved").length, icon: ShieldCheck },
              { label: "Support tickets", value: supportTickets.length, icon: LifeBuoy },
              { label: "Plans active", value: "4", icon: CreditCard },
              { label: "Audit events", value: auditLogs.length, icon: BarChart3 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function OrganizationsPage({
  organizations,
  apiOrganizations,
  selectedOrg,
  loadError,
  onSelectOrg,
  onUpdateDetails,
  onUpdateStatus,
}: {
  organizations: OrganizationRow[];
  apiOrganizations: AcceptedOrganization[];
  selectedOrg: OrganizationRow;
  loadError: string;
  onSelectOrg: (orgId: string) => void;
  onUpdateDetails: (orgId: string, payload: Partial<AcceptedOrganization>) => Promise<void>;
  onUpdateStatus: (orgId: string, status: string) => Promise<void>;
}) {
  const selectedApiOrg = apiOrganizations.find((organization) => organization._id === selectedOrg.id);
  const [form, setForm] = useState({
    orgName: selectedApiOrg?.orgName ?? selectedOrg.name,
    orgEmail: selectedApiOrg?.orgEmail ?? "",
    phoneNumber: selectedApiOrg?.phoneNumber ?? "",
    country: selectedApiOrg?.location?.country ?? "",
    state: selectedApiOrg?.location?.state ?? "",
    city: selectedApiOrg?.location?.city ?? "",
    postalCode: selectedApiOrg?.location?.postalCode ?? "",
    address: selectedApiOrg?.address ?? selectedOrg.region,
  });

  useEffect(() => {
    setForm({
      orgName: selectedApiOrg?.orgName ?? selectedOrg.name,
      orgEmail: selectedApiOrg?.orgEmail ?? "",
      phoneNumber: selectedApiOrg?.phoneNumber ?? "",
      country: selectedApiOrg?.location?.country ?? "",
      state: selectedApiOrg?.location?.state ?? "",
      city: selectedApiOrg?.location?.city ?? "",
      postalCode: selectedApiOrg?.location?.postalCode ?? "",
      address: selectedApiOrg?.address ?? selectedOrg.region,
    });
  }, [selectedApiOrg?._id, selectedOrg.id]);

  async function submitDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onUpdateDetails(selectedOrg.id, {
      orgName: form.orgName,
      orgEmail: form.orgEmail,
      phoneNumber: form.phoneNumber,
      address: form.address,
      location: {
        country: form.country,
        state: form.state,
        city: form.city,
        postalCode: form.postalCode,
      },
    });
  }

  return (
    <>
      <SectionIntro
        eyebrow="Organizations"
        title="Create, activate, suspend, and inspect tenant organizations."
        description="Each organization has isolated users, students, coordinators, sections, subscriptions, and usage."
      />
      {loadError ? <ApiNotice message={loadError} /> : null}
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_410px]">
        <Card>
          <CardHeader>
            <CardTitle>Organization Directory</CardTitle>
            <CardDescription>Tenant status and subscription overview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {organizations.map((org) => (
              <button
                key={org.id}
                className={`grid w-full gap-3 rounded-lg border p-3 text-left md:grid-cols-[minmax(0,1fr)_110px_120px] md:items-center ${
                  selectedOrg.id === org.id ? "border-primary bg-primary/5" : "bg-white"
                }`}
                onClick={() => onSelectOrg(org.id)}
              >
                <div>
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-sm text-muted-foreground">{org.students} students · {org.coordinators} coordinators · {org.region}</p>
                </div>
                <Badge variant="outline">{org.plan}</Badge>
                <Badge variant={org.status === "Active" ? "secondary" : org.status === "Suspended" ? "danger" : "warning"}>{org.status}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{selectedOrg.name}</CardTitle>
            <CardDescription>Tenant controls and usage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile label="Plan" value={selectedOrg.plan} />
              <InfoTile label="Status" value={selectedOrg.status} />
              <InfoTile label="Students" value={String(selectedOrg.students)} />
              <InfoTile label="Coordinators" value={String(selectedOrg.coordinators)} />
            </div>
            <DonutProgress value={selectedOrg.usage} label="Usage" caption="Current tenant resource usage" />
            <form className="grid gap-2" onSubmit={submitDetails}>
              <Input required placeholder="Organization name" value={form.orgName} onChange={(event) => setForm((current) => ({ ...current, orgName: event.target.value }))} />
              <Input required type="email" placeholder="Organization email" value={form.orgEmail} onChange={(event) => setForm((current) => ({ ...current, orgEmail: event.target.value }))} />
              <Input required placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
              <Input required placeholder="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
              <Input required placeholder="State" value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} />
              <Input required placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
              <Input required placeholder="Postal code" value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} />
              <textarea
                required
                className="min-h-20 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                placeholder="Address"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
              <Button type="submit" variant="outline">Update Details</Button>
            </form>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => onUpdateStatus(selectedOrg.id, "Active")}>Activate</Button>
              <Button variant="outline" onClick={() => onUpdateStatus(selectedOrg.id, "Suspended")}>Suspend</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function RequestsPage({
  requests,
  loadError,
  onHandleRequest,
}: {
  requests: OrganizationRequest[];
  loadError: string;
  onHandleRequest: (requestId: string, status: string) => void;
}) {
  return (
    <>
      <SectionIntro
        eyebrow="Organization Requests"
        title="Review and approve new institution onboarding requests."
        description="Approve valid institutions, reject incomplete requests, or mark them for review."
      />
      {loadError ? <ApiNotice message={loadError} /> : null}
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {requests.map((request) => (
            <div key={request.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_130px_220px] md:items-center">
              <div>
                <p className="font-semibold">{request.name}</p>
                <p className="text-sm text-muted-foreground">{request.contact} · {request.submitted}</p>
                <p className="mt-1 text-xs text-muted-foreground">Requested: {request.requestedPlan || "Standard setup"}</p>
              </div>
              <Badge variant="outline">{request.status}</Badge>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" size="sm" onClick={() => onHandleRequest(request.id, "Approved")}>
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" size="sm" onClick={() => onHandleRequest(request.id, "Rejected")}>
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function UsersPage({
  apiUsers,
  organizations,
  onUserChanged,
  onAction,
}: {
  apiUsers: ApiUser[];
  organizations: AcceptedOrganization[];
  onUserChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState(organizations[0]?._id ?? "");
  const [roleName, setRoleName] = useState("teacher");
  const [password, setPassword] = useState("");
  const hasApiUsers = apiUsers.length > 0;
  const users = hasApiUsers ? apiUsers : platformUsers;

  useEffect(() => {
    setOrganization((current) => current || organizations[0]?._id || "");
  }, [organizations]);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await createUserRecord({
        organization: organization.trim() || undefined,
        name,
        email,
        roleName: roleName as "admin" | "teacher" | "student",
        password: password.trim() || undefined,
      });
      await onUserChanged();
      setName("");
      setEmail("");
      setPassword("");
      onAction(response.temporaryPassword ? `User created. Temporary password: ${response.temporaryPassword}` : response.message || "User created.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "User creation failed.");
    }
  }

  async function changeUserRole(userId: string, nextRole: "admin" | "teacher" | "student") {
    try {
      await updateUser(userId, { roleName: nextRole });
      await onUserChanged();
      onAction("User role updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role assignment failed.");
    }
  }

  async function toggleUserStatus(user: ApiUser) {
    try {
      await updateUser(user.id, { status: user.status === "active" ? "inactive" : "active" });
      await onUserChanged();
      onAction("User status updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "User update failed.");
    }
  }

  return (
    <>
      <SectionIntro
        eyebrow="Users"
        title="Platform-wide users across organizations."
        description="Monitor organization admins, coordinators, and account status across tenants."
      />
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>Superadmins must provide an organization id for tenant users.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-5" onSubmit={createUser}>
            <Input required placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={organization} onChange={(event) => setOrganization(event.target.value)}>
              <option value="">Select organization</option>
              {organizations.map((item) => <option key={item._id} value={item._id}>{item.orgName}</option>)}
            </select>
            <select className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={roleName} onChange={(event) => setRoleName(event.target.value)}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            <Input placeholder="Password optional" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Button className="md:col-span-5" type="submit">Create User</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {users.map((user) => (
            <div key={user.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_150px_130px_150px] md:items-center">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email} · {organizationLabel(user.organization)}</p>
              </div>
              <select
                className="h-10 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                value={user.role === "superadmin" || user.role === "Super Admin" ? "admin" : user.role}
                disabled={!hasApiUsers || user.role === "superadmin" || user.role === "Super Admin"}
                onChange={(event) => changeUserRole(user.id, event.target.value as "admin" | "teacher" | "student")}
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
              <Badge variant={user.status === "active" || user.status === "Active" ? "secondary" : "warning"}>{user.status}</Badge>
              <Button size="sm" variant="outline" disabled={!hasApiUsers || user.role === "superadmin" || user.role === "Super Admin"} onClick={() => toggleUserStatus(user as ApiUser)}>
                {user.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function FeaturesPage({
  features,
  onFeatureChanged,
  onAction,
}: {
  features: Feature[];
  onFeatureChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [form, setForm] = useState({ key: "", name: "", description: "", enabledByDefault: false });

  async function createFeature(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createFeatureRecord(form);
      await onFeatureChanged();
      setForm({ key: "", name: "", description: "", enabledByDefault: false });
      onAction("Feature created.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Feature creation failed.");
    }
  }

  async function toggleFeature(feature: Feature, field: "enabledByDefault" | "isActive") {
    try {
      await updateFeature(feature._id, { ...feature, [field]: !feature[field] });
      await onFeatureChanged();
      onAction("Feature updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Feature update failed.");
    }
  }

  return (
    <>
      <SectionIntro
        eyebrow="Features"
        title="Manage platform modules available to organizations."
        description="Create features and control default enablement for new organization requests."
      />
      <Card>
        <CardHeader>
          <CardTitle>Create Feature</CardTitle>
          <CardDescription>Feature keys should be stable API identifiers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[180px_220px_minmax(0,1fr)_160px]" onSubmit={createFeature}>
            <Input required placeholder="key" value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} />
            <Input required placeholder="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <Input required placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <label className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <input
                className="h-4 w-4 accent-primary"
                type="checkbox"
                checked={form.enabledByDefault}
                onChange={(event) => setForm((current) => ({ ...current, enabledByDefault: event.target.checked }))}
              />
              Default
            </label>
            <Button className="md:col-span-4" type="submit">Create Feature</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {features.length ? features.map((feature) => (
            <div key={feature._id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_130px_120px_190px] md:items-center">
              <div>
                <p className="font-semibold">{feature.name}</p>
                <p className="text-sm text-muted-foreground">{feature.key} · {feature.description}</p>
              </div>
              <Badge variant={feature.enabledByDefault ? "secondary" : "outline"}>{feature.enabledByDefault ? "Default" : "Optional"}</Badge>
              <Badge variant={feature.isActive ? "secondary" : "warning"}>{feature.isActive ? "Active" : "Inactive"}</Badge>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button size="sm" variant="outline" onClick={() => toggleFeature(feature, "enabledByDefault")}>Default</Button>
                <Button size="sm" variant="outline" onClick={() => toggleFeature(feature, "isActive")}>Active</Button>
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Connect the API to load feature rows.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ApiNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-accent/50 bg-accent/20 p-3 text-sm text-muted-foreground">
      API data unavailable: {message}. Showing local demo data where available.
    </div>
  );
}

function RolesSettingsPage({
  organizations,
  permissions,
  roles,
  onRoleChanged,
  onAction,
}: {
  organizations: AcceptedOrganization[];
  permissions: string[];
  roles: ApiRole[];
  onRoleChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?._id ?? "");
  const visibleRoles = roles.filter((role) => !organizationId || role.organization === organizationId || (typeof role.organization === "object" && role.organization?._id === organizationId));

  useEffect(() => {
    setOrganizationId((current) => current || organizations[0]?._id || "");
  }, [organizations]);

  async function syncRoles() {
    if (!organizationId) {
      onAction("Select an organization first.");
      return;
    }

    try {
      await syncOrganizationRoles(organizationId);
      await onRoleChanged();
      onAction("Organization roles are ready.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role sync failed.");
    }
  }

  async function saveRole(role: ApiRole, nextPermissions: string[]) {
    try {
      await updateRole(role._id, { permissions: nextPermissions });
      await onRoleChanged();
      onAction("Role permissions updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role update failed.");
    }
  }

  return (
    <>
      <SectionIntro
        eyebrow="Roles"
        title="Create organization roles and update permissions."
        description="Sync default organization roles, then assign permissions and use the Users page to assign roles to people."
        action={<Button onClick={syncRoles}><ShieldCheck className="h-4 w-4" />Sync Roles</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Choose the tenant whose roles you want to manage.</CardDescription>
        </CardHeader>
        <CardContent>
          <select className="h-10 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
            <option value="">All roles</option>
            {organizations.map((organization) => <option key={organization._id} value={organization._id}>{organization.orgName}</option>)}
          </select>
        </CardContent>
      </Card>
      <section className="grid gap-4 lg:grid-cols-3">
        {visibleRoles.map((role) => (
          <Card key={role._id}>
            <CardHeader>
              <CardTitle>{role.displayName}</CardTitle>
              <CardDescription>{role.name} · {role.isEditable ? "Editable" : "Locked"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{role.description}</p>
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <label key={permission} className="flex items-center gap-2 text-sm">
                    <input
                      className="h-4 w-4 accent-primary"
                      type="checkbox"
                      disabled={!role.isEditable}
                      checked={role.permissions.includes(permission)}
                      onChange={(event) => {
                        const nextPermissions = event.target.checked
                          ? [...role.permissions, permission]
                          : role.permissions.filter((item) => item !== permission);
                        saveRole(role, nextPermissions);
                      }}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}

function PlansPage({ onAction }: { onAction: (message: string) => void }) {
  return (
    <>
      <SectionIntro
        eyebrow="Plans"
        title="Subscription plans and tenant billing controls."
        description="Manage plan limits, subscriptions, and upgrade/downgrade actions."
        action={<Button onClick={() => onAction("Plan creation opened.")}><Plus className="h-4 w-4" />New Plan</Button>}
      />
      <section className="grid gap-4 md:grid-cols-3">
        {["Starter", "Growth", "Enterprise"].map((plan, index) => (
          <Card key={plan}>
            <CardHeader>
              <CardTitle>{plan}</CardTitle>
              <CardDescription>{index === 0 ? "Small colleges" : index === 1 ? "Growing institutions" : "Large organizations"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{index === 0 ? "₹9k" : index === 1 ? "₹29k" : "Custom"}</p>
              <Badge variant="outline">{index === 2 ? "Unlimited users" : `${index === 0 ? 500 : 2500} students`}</Badge>
              <Button className="w-full" variant="outline">Edit Plan</Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}

function AnalyticsPage({ organizations }: { organizations: OrganizationRow[] }) {
  return (
    <>
      <SectionIntro
        eyebrow="Platform Analytics"
        title="Growth, usage, subscriptions, and tenant activity."
        description="Compare organizations, plan usage, active users, and placement-preparation engagement."
      />
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Organization Usage</CardTitle>
            <CardDescription>Usage by tenant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {organizations.map((org) => (
              <div key={org.id} className="rounded-lg border p-3">
                <DonutProgress value={org.usage} label={org.name} caption={`${org.students} students`} size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Tenant plans.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Enterprise 36%", "Growth 42%", "Starter 14%", "Trial 8%"].map((item) => (
              <div key={item} className="rounded-lg border p-3 text-sm font-semibold">{item}</div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function SupportPage({ onAction }: { onAction: (message: string) => void }) {
  return (
    <>
      <SectionIntro
        eyebrow="Support"
        title="Support requests from organizations."
        description="Track, escalate, and resolve institution support requests."
      />
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {supportTickets.map((ticket) => (
            <div key={ticket.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_100px_120px] md:items-center">
              <div>
                <p className="font-semibold">{ticket.id} · {ticket.title}</p>
                <p className="text-sm text-muted-foreground">{ticket.organization}</p>
              </div>
              <Badge variant={ticket.priority === "Critical" ? "danger" : ticket.priority === "High" ? "warning" : "outline"}>{ticket.priority}</Badge>
              <Button size="sm" variant="outline" onClick={() => onAction(`${ticket.id} opened.`)}>Open</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function AuditPage() {
  return (
    <>
      <SectionIntro
        eyebrow="Audit Logs"
        title="Platform activity and compliance trail."
        description="Review actions across organizations, subscriptions, settings, and user access."
      />
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {auditLogs.map((log, index) => (
            <div key={log} className="rounded-lg border p-3 text-sm">
              <span className="font-semibold">#{index + 1}</span> · {log}
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function ChangelogPage() {
  const [openHash, setOpenHash] = useState<string | null>(null);
  const [commitHistory, setCommitHistory] = useState<CommitEntry[] | null>(null);

  // Load the (large) commit data only when this admin page is opened.
  useEffect(() => {
    let active = true;
    import("@/data/commit-history").then((module) => {
      if (active) setCommitHistory(module.commitHistory);
    });
    return () => {
      active = false;
    };
  }, []);

  const latest = commitHistory?.[0];
  const areas = useMemo(
    () => (commitHistory ? Array.from(new Set(commitHistory.map((commit) => commit.area))) : []),
    [commitHistory],
  );

  if (!commitHistory) {
    return (
      <>
        <SectionIntro eyebrow="Changelog" title="Recent code changes across the platform." description="Loading commit history..." />
        <div className="flex min-h-[240px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const openCommit = commitHistory.find((commit) => commit.hash === openHash);

  if (openCommit) {
    return <CommitDetail commit={openCommit} onBack={() => setOpenHash(null)} />;
  }

  return (
    <>
      <SectionIntro
        eyebrow="Changelog"
        title="Recent code changes across the platform."
        description="Every pushed commit to the application — with its short hash. Open a commit to see exactly which files changed in the deployed build."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Tracked commits</p>
            <p className="mt-1 text-2xl font-bold">{commitHistory.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Latest change</p>
            <p className="mt-1 font-mono text-lg font-bold text-primary">{latest?.hash ?? "—"}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{latest?.date}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Areas touched</p>
            <p className="mt-1 text-2xl font-bold">{areas.length}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Commit history</CardTitle>
          <CardDescription>Newest first — select a commit to view the deployed changes. Run <span className="font-mono">npm run generate:commits</span> to refresh after a push.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {commitHistory.map((commit) => (
            <button
              key={commit.hash}
              className="flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:gap-4"
              onClick={() => setOpenHash(commit.hash)}
            >
              <div className="flex items-center gap-2">
                <GitCommitHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold text-primary">{commit.hash}</code>
              </div>
              <p className="min-w-0 flex-1 text-sm font-medium">{commit.message}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="muted">{commit.area}</Badge>
                <span>{commit.filesChanged} {commit.filesChanged === 1 ? "file" : "files"}</span>
                <span aria-hidden>·</span>
                <span>{commit.date}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function CommitDetail({ commit, onBack }: { commit: CommitEntry; onBack: () => void }) {
  const moreCount = commit.filesChanged - commit.files.length;
  const [openFile, setOpenFile] = useState<string | null>(commit.files.find((file) => file.patch)?.path ?? null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Changelog</Button>
        <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold text-primary">{commit.hash}</code>
        <Badge variant="muted">{commit.area}</Badge>
      </div>

      <SectionIntro
        eyebrow="Commit detail"
        title={commit.message}
        description={commit.body || `Changes pushed by ${commit.author} on ${commit.date}.`}
      />

      <section className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Files changed", value: `${commit.filesChanged}`, tone: "" },
          { label: "Insertions", value: `+${commit.insertions.toLocaleString()}`, tone: "text-secondary" },
          { label: "Deletions", value: `-${commit.deletions.toLocaleString()}`, tone: "text-destructive" },
          { label: "Author", value: commit.author, tone: "" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={cn("mt-1 truncate text-xl font-bold", item.tone)}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Files in this deploy</CardTitle>
          <CardDescription>
            {moreCount > 0
              ? `Top ${commit.files.length} of ${commit.filesChanged} changed files (largest first).`
              : "All files changed in this commit."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-4 sm:p-5">
          {commit.files.map((file) => {
            const expanded = openFile === file.path;
            const hasDiff = Boolean(file.patch);
            return (
              <div key={file.path} className="overflow-hidden rounded-lg border">
                <button
                  className={cn(
                    "flex w-full items-center gap-3 p-3 text-left transition-colors",
                    hasDiff ? "hover:bg-muted/60" : "cursor-default",
                  )}
                  onClick={() => hasDiff && setOpenFile(expanded ? null : file.path)}
                  aria-expanded={hasDiff ? expanded : undefined}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <code className="min-w-0 flex-1 truncate font-mono text-xs sm:text-sm">{file.path}</code>
                  <span className="shrink-0 font-mono text-xs font-semibold">
                    <span className="text-secondary">+{file.added}</span> <span className="text-destructive">-{file.removed}</span>
                  </span>
                  {hasDiff ? (
                    expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <span className="shrink-0 text-[11px] text-muted-foreground">diff hidden</span>
                  )}
                </button>
                {hasDiff && expanded ? <DiffView patch={file.patch} truncated={file.patchTruncated} /> : null}
              </div>
            );
          })}
          {moreCount > 0 ? (
            <p className="pt-1 text-center text-xs text-muted-foreground">
              +{moreCount} more {moreCount === 1 ? "file" : "files"} in this commit
            </p>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

function DiffView({ patch, truncated }: { patch: string; truncated: boolean }) {
  const lines = patch.split("\n");
  return (
    <div className="overflow-x-auto border-t bg-muted/30">
      <pre className="min-w-full font-mono text-xs leading-5">
        {lines.map((line, index) => {
          const type = line.startsWith("+") ? "add" : line.startsWith("-") ? "del" : line.startsWith("@@") ? "hunk" : "ctx";
          return (
            <div
              key={index}
              className={cn(
                "whitespace-pre px-3 py-0.5",
                type === "add" && "bg-secondary/15 text-secondary",
                type === "del" && "bg-destructive/10 text-destructive",
                type === "hunk" && "bg-primary/10 font-semibold text-primary",
                type === "ctx" && "text-muted-foreground",
              )}
            >
              {line || " "}
            </div>
          );
        })}
      </pre>
      {truncated ? (
        <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">Diff truncated — showing the first 200 lines.</p>
      ) : null}
    </div>
  );
}

function PlatformSettingsPage({ onAction }: { onAction: (message: string) => void }) {
  return (
    <>
      <SectionIntro
        eyebrow="Global Settings"
        title="Platform defaults, security, and system controls."
        description="Configure global permissions, security controls, support routing, and platform behavior."
        action={<Button onClick={() => onAction("Platform settings saved.")}><Settings className="h-4 w-4" />Save Settings</Button>}
      />
      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
          <Input defaultValue="support@placeprep.io" />
          <Input defaultValue="Default Growth Plan" />
          <Input defaultValue="MFA optional" />
          <Input defaultValue="Audit retention 365 days" />
        </CardContent>
      </Card>
    </>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
