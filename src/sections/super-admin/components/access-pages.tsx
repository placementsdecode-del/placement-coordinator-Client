import { useEffect, useState } from "react";
import { LoaderCircle, Plus, Settings, ShieldCheck, Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { FieldError, isValidEmail } from "@/components/common/form-validation";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createFeature as createFeatureRecord, updateFeature } from "@/services/features.service";
import { syncOrganizationRoles, updateRole } from "@/services/roles.service";
import { createUser as createUserRecord, updateUser } from "@/services/users.service";
import { organizationLabel } from "@/sections/super-admin/super-admin-mappers";
import type { AcceptedOrganization, ApiRole, ApiUser, Feature } from "@/types/api";

export function UsersPage({
  apiUsers,
  organizations,
  loading,
  onUserChanged,
  onAction,
}: {
  apiUsers: ApiUser[];
  organizations: AcceptedOrganization[];
  loading: boolean;
  onUserChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState(organizations[0]?._id ?? "");
  const [roleName, setRoleName] = useState("teacher");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasApiUsers = apiUsers.length > 0;
  const users = apiUsers;

  useEffect(() => {
    setOrganization((current) => current || organizations[0]?._id || "");
  }, [organizations]);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (!organization.trim()) nextErrors.organization = "Select an organization.";
    if (!roleName) nextErrors.roleName = "Select a role.";
    if (password && password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setCreating(true);
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
    } finally {
      setCreating(false);
    }
  }

  async function changeUserRole(userId: string, nextRole: "admin" | "teacher" | "student") {
    setUpdatingUserId(userId);
    try {
      await updateUser(userId, { roleName: nextRole });
      await onUserChanged();
      onAction("User role updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role assignment failed.");
    } finally {
      setUpdatingUserId("");
    }
  }

  async function toggleUserStatus(user: ApiUser) {
    setUpdatingUserId(user.id);
    try {
      await updateUser(user.id, { status: user.status === "active" ? "inactive" : "active" });
      await onUserChanged();
      onAction("User status updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "User update failed.");
    } finally {
      setUpdatingUserId("");
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
          <form className="grid max-w-5xl gap-3 md:grid-cols-5" onSubmit={createUser}>
            <div className="space-y-1"><Input required placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} /><FieldError message={errors.name} /></div>
            <div className="space-y-1"><Input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} /><FieldError message={errors.email} /></div>
            <div className="space-y-1">
              <select className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={organization} onChange={(event) => setOrganization(event.target.value)}>
                <option value="">Select organization</option>
                {organizations.map((item) => <option key={item._id} value={item._id}>{item.orgName}</option>)}
              </select>
              <FieldError message={errors.organization} />
            </div>
            <div className="space-y-1">
              <select className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={roleName} onChange={(event) => setRoleName(event.target.value)}>
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
              <FieldError message={errors.roleName} />
            </div>
            <div className="space-y-1"><Input placeholder="Password optional" value={password} onChange={(event) => setPassword(event.target.value)} /><FieldError message={errors.password} /></div>
            <div className="flex justify-end md:col-span-5">
              <Button type="submit" disabled={creating}>
                {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {loading ? <SkeletonRows rows={4} /> : users.map((user) => (
            <div key={user.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_150px_130px_150px] md:items-center">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email} · {organizationLabel(user.organization)}</p>
              </div>
              {user.role === "superadmin" ? (
                <Badge variant="outline">Super Admin</Badge>
              ) : (
                <select
                  className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                  value={user.role}
                  disabled={!hasApiUsers || Boolean(updatingUserId)}
                  onChange={(event) => changeUserRole(user.id, event.target.value as "admin" | "teacher" | "student")}
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              )}
              <Badge variant={user.status === "active" ? "secondary" : "warning"}>{user.status}</Badge>
              <Button size="sm" variant="outline" disabled={!hasApiUsers || user.role === "superadmin" || Boolean(updatingUserId)} onClick={() => toggleUserStatus(user as ApiUser)}>
                {updatingUserId === user.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {updatingUserId === user.id ? "Updating..." : user.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
          {!loading && !users.length ? (
            <EmptyState icon={Users} title="No users yet" description="Users created through organization approval or user creation will appear here." />
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

export function FeaturesPage({
  features,
  loading,
  onFeatureChanged,
  onAction,
}: {
  features: Feature[];
  loading: boolean;
  onFeatureChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [form, setForm] = useState({ key: "", name: "", description: "", enabledByDefault: false });
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function createFeature(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.key.trim()) nextErrors.key = "Feature key is required.";
    if (!/^[a-z0-9-]+$/.test(form.key.trim())) nextErrors.key = "Use lowercase letters, numbers, and hyphens only.";
    if (!form.name.trim()) nextErrors.name = "Feature name is required.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setCreating(true);
    try {
      await createFeatureRecord(form);
      await onFeatureChanged();
      setForm({ key: "", name: "", description: "", enabledByDefault: false });
      onAction("Feature created.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Feature creation failed.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleFeature(feature: Feature, field: "enabledByDefault" | "isActive") {
    setToggling(`${feature._id}:${field}`);
    try {
      await updateFeature(feature._id, { ...feature, [field]: !feature[field] });
      await onFeatureChanged();
      onAction("Feature updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Feature update failed.");
    } finally {
      setToggling("");
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
          <form className="grid max-w-5xl gap-3 md:grid-cols-[180px_220px_minmax(0,1fr)_160px]" onSubmit={createFeature}>
            <div className="space-y-1"><Input required placeholder="feature-key" value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} /><FieldError message={errors.key} /></div>
            <div className="space-y-1"><Input required placeholder="Feature name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /><FieldError message={errors.name} /></div>
            <div className="space-y-1"><Input required placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /><FieldError message={errors.description} /></div>
            <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
              <input
                className="h-5 w-5 accent-primary"
                type="checkbox"
                checked={form.enabledByDefault}
                onChange={(event) => setForm((current) => ({ ...current, enabledByDefault: event.target.checked }))}
              />
              Default
            </label>
            <div className="flex justify-end md:col-span-4">
              <Button type="submit" disabled={creating}>
                {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? "Creating..." : "Create Feature"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {loading ? <SkeletonRows rows={4} /> : features.length ? features.map((feature) => (
            <div key={feature._id} className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="font-semibold">{feature.name}</p>
                <p className="break-words text-sm text-muted-foreground">{feature.key} · {feature.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={feature.enabledByDefault ? "secondary" : "outline"}>{feature.enabledByDefault ? "Default" : "Optional"}</Badge>
                  <Badge variant={feature.isActive ? "secondary" : "warning"}>{feature.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" disabled={Boolean(toggling)} onClick={() => toggleFeature(feature, "enabledByDefault")}>
                  {toggling === `${feature._id}:enabledByDefault` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Default
                </Button>
                <Button size="sm" variant="outline" disabled={Boolean(toggling)} onClick={() => toggleFeature(feature, "isActive")}>
                  {toggling === `${feature._id}:isActive` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Active
                </Button>
              </div>
            </div>
          )) : (
            <EmptyState icon={Settings} title="No features available" description="Feature rows will appear here after the API returns platform modules." />
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function RolesSettingsPage({
  organizations,
  permissions,
  roles,
  loading,
  onRoleChanged,
  onAction,
}: {
  organizations: AcceptedOrganization[];
  permissions: string[];
  roles: ApiRole[];
  loading: boolean;
  onRoleChanged: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?._id ?? "");
  const [syncing, setSyncing] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState("");
  const visibleRoles = roles.filter((role) => !organizationId || role.organization === organizationId || (typeof role.organization === "object" && role.organization?._id === organizationId));

  useEffect(() => {
    setOrganizationId((current) => current || organizations[0]?._id || "");
  }, [organizations]);

  async function syncRoles() {
    if (!organizationId) {
      onAction("Select an organization first.");
      return;
    }

    setSyncing(true);
    try {
      await syncOrganizationRoles(organizationId);
      await onRoleChanged();
      onAction("Organization roles are ready.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function saveRole(role: ApiRole, nextPermissions: string[]) {
    setSavingRoleId(role._id);
    try {
      await updateRole(role._id, { permissions: nextPermissions });
      await onRoleChanged();
      onAction("Role permissions updated.");
    } catch (error) {
      onAction(error instanceof Error ? error.message : "Role update failed.");
    } finally {
      setSavingRoleId("");
    }
  }

  return (
    <>
      <SectionIntro
        eyebrow="Roles"
        title="Create organization roles and update permissions."
        description="Sync default organization roles, then assign permissions and use the Users page to assign roles to people."
        action={
          <Button onClick={syncRoles} disabled={syncing}>
            {syncing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {syncing ? "Syncing..." : "Sync Roles"}
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Choose the tenant whose roles you want to manage.</CardDescription>
        </CardHeader>
        <CardContent>
          <select className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
            <option value="">All roles</option>
            {organizations.map((organization) => <option key={organization._id} value={organization._id}>{organization.orgName}</option>)}
          </select>
        </CardContent>
      </Card>
      <section className="grid gap-4 lg:grid-cols-3">
        {loading ? <SkeletonRows rows={4} className="lg:col-span-3" /> : visibleRoles.map((role) => (
          <Card key={role._id}>
            <CardHeader>
              <CardTitle>{role.displayName}</CardTitle>
              <CardDescription>{role.name} · {role.isEditable ? "Editable" : "Locked"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{role.description}</p>
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <label key={permission} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      className="h-5 w-5 accent-primary"
                      type="checkbox"
                      disabled={!role.isEditable || Boolean(savingRoleId)}
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
              {savingRoleId === role._id ? <p className="text-xs text-muted-foreground">Saving permissions...</p> : null}
            </CardContent>
          </Card>
        ))}
        {!loading && !visibleRoles.length ? (
          <div className="lg:col-span-3">
            <EmptyState icon={ShieldCheck} title="No roles available" description="Select an organization and sync roles to manage permissions." />
          </div>
        ) : null}
      </section>
    </>
  );
}
