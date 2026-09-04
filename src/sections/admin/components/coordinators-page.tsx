import { useState } from "react";
import { LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { FieldError, isValidEmail } from "@/components/common/form-validation";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ApiRole, ApiUser } from "@/types/api";
import type { CoordinatorRole, CoordinatorRow, SectionRow } from "@/types/admin";

export function CoordinatorsAdmin({
  coordinators,
  organizationUsers,
  apiRoles,
  apiPermissions,
  roles,
  sections,
  onAddCoordinator,
  onAddRole,
  onCreateOrganizationUser,
  onSyncRoles,
  onUpdateApiRolePermissions,
  loading,
}: {
  coordinators: CoordinatorRow[];
  organizationUsers: ApiUser[];
  apiRoles: ApiRole[];
  apiPermissions: string[];
  roles: CoordinatorRole[];
  sections: SectionRow[];
  onAddCoordinator: (coordinator: CoordinatorRow, teacherId?: string) => Promise<void>;
  onAddRole: (role: CoordinatorRole) => void;
  onCreateOrganizationUser: (user: {
    name: string;
    email: string;
    phoneNumber: string;
    roleName: "teacher" | "student" | "admin";
    password?: string;
  }) => Promise<ApiUser | undefined>;
  onSyncRoles: () => Promise<void>;
  onUpdateApiRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0]?.name ?? "");
  const [section, setSection] = useState(sections[0]?.name ?? "");
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState("");
  const [coordinatorSubmitting, setCoordinatorSubmitting] = useState(false);
  const [syncingRoles, setSyncingRoles] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState("");
  const [coordinatorErrors, setCoordinatorErrors] = useState<Record<string, string>>({});
  const [roleErrors, setRoleErrors] = useState<Record<string, string>>({});

  async function handleSyncRoles() {
    setSyncingRoles(true);
    try {
      await onSyncRoles();
    } finally {
      setSyncingRoles(false);
    }
  }

  return (
    <>
      <SectionIntro
        eyebrow="Coordinators & Roles"
        title="Manage teachers, coordinator access, and role permissions."
        description="Create coordinator accounts, assign them to sections, sync organization roles, and update permissions from one workspace."
        action={
          <Button onClick={handleSyncRoles} disabled={syncingRoles}>
            {syncingRoles ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {syncingRoles ? "Syncing..." : "Sync Roles"}
          </Button>
        }
      />
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card>
          <CardHeader>
            <CardTitle>Add Coordinator</CardTitle>
            <CardDescription>Form for creating a placement coordinator account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-3xl gap-3 md:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const nextErrors: Record<string, string> = {};
                if (!name.trim()) nextErrors.name = "Coordinator name is required.";
                if (!email.trim()) nextErrors.email = "Email address is required.";
                else if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address.";
                if (!role) nextErrors.role = "Select a role.";
                if (!section) nextErrors.section = "Select a section.";
                if (password && password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
                setCoordinatorErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;
                const coordinator = {
                  id: crypto.randomUUID(),
                  name,
                  email,
                  phone: phoneNumber,
                  role,
                  sections: [section],
                  status: "Active",
                };
                setCoordinatorSubmitting(true);
                try {
                  const createdUser = await onCreateOrganizationUser({
                    name,
                    email,
                    phoneNumber,
                    roleName: "teacher",
                    password: password.trim() || undefined,
                  });
                  await onAddCoordinator(coordinator, createdUser?.id);
                  setName("");
                  setEmail("");
                  setPhoneNumber("");
                  setPassword("");
                } finally {
                  setCoordinatorSubmitting(false);
                }
              }}
            >
              <div className="space-y-1">
                <Input required placeholder="Coordinator name" value={name} onChange={(event) => setName(event.target.value)} />
                <FieldError message={coordinatorErrors.name} />
              </div>
              <div className="space-y-1">
                <Input required placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
                <FieldError message={coordinatorErrors.email} />
              </div>
              <Input placeholder="Phone number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
              <div className="space-y-1">
                <Input placeholder="Password optional" value={password} onChange={(event) => setPassword(event.target.value)} />
                <FieldError message={coordinatorErrors.password} />
              </div>
              <div className="space-y-1">
                <select className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="">Select role</option>
                  {roles.map((item) => <option key={item.id}>{item.name}</option>)}
                </select>
                <FieldError message={coordinatorErrors.role} />
              </div>
              <div className="space-y-1">
                <select className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={section} onChange={(event) => setSection(event.target.value)}>
                  <option value="">Select section</option>
                  {sections.map((item) => <option key={item.id}>{item.name}</option>)}
                </select>
                <FieldError message={coordinatorErrors.section} />
              </div>
              <Button type="submit" disabled={coordinatorSubmitting}>
                {coordinatorSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {coordinatorSubmitting ? "Adding..." : "Add Coordinator"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create Role</CardTitle>
            <CardDescription>Define coordinator permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Role name" value={roleName} onChange={(event) => setRoleName(event.target.value)} />
            <textarea className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Comma-separated permissions" value={permissions} onChange={(event) => setPermissions(event.target.value)} />
            <Button
              onClick={() => {
                const nextErrors: Record<string, string> = {};
                if (!roleName.trim()) nextErrors.roleName = "Role name is required.";
                if (!permissions.split(",").map((item) => item.trim()).filter(Boolean).length) nextErrors.permissions = "Add at least one permission.";
                setRoleErrors(nextErrors);
                if (Object.keys(nextErrors).length) return;
                onAddRole({
                  id: crypto.randomUUID(),
                  name: roleName,
                  permissions: permissions.split(",").map((item) => item.trim()).filter(Boolean),
                });
                setRoleName("");
              }}
            >
              Create Role
            </Button>
            <FieldError message={roleErrors.roleName || roleErrors.permissions} />
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coordinator List</CardTitle>
            <CardDescription>Assigned sections and roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonRows rows={3} /> : coordinators.map((coordinator) => (
              <div key={coordinator.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{coordinator.name}</p>
                  <Badge variant="secondary">{coordinator.role}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{coordinator.email} · {coordinator.sections.join(", ")}</p>
              </div>
            ))}
            {!loading ? organizationUsers.filter((user) => user.role === "teacher").map((user) => (
              <div key={user.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{user.name}</p>
                  <Badge variant="secondary">Teacher</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{user.email} · API user</p>
              </div>
            )) : null}
            {!loading && !coordinators.length && !organizationUsers.filter((user) => user.role === "teacher").length ? (
              <EmptyState icon={ShieldCheck} title="No coordinators yet" description="Create teacher accounts and assign them to sections when your organization is ready." />
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Coordinator role-based access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonRows rows={3} /> : apiRoles.length ? apiRoles.map((item) => (
              <div key={item._id} className="rounded-lg border p-3">
                <p className="font-semibold">{item.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.name}</p>
                <div className="mt-3 grid gap-2">
                  {apiPermissions.map((permission) => (
                    <label key={permission} className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        className="h-5 w-5 accent-primary"
                        type="checkbox"
                      disabled={!item.isEditable || Boolean(savingRoleId)}
                        checked={item.permissions.includes(permission)}
                        onChange={(event) => {
                          const nextPermissions = event.target.checked
                            ? [...item.permissions, permission]
                            : item.permissions.filter((current) => current !== permission);
                          setSavingRoleId(item._id);
                          onUpdateApiRolePermissions(item._id, nextPermissions).finally(() => setSavingRoleId(""));
                        }}
                      />
                      {permission}
                    </label>
                  ))}
                </div>
                {savingRoleId === item._id ? <p className="text-xs text-muted-foreground">Saving permissions...</p> : null}
              </div>
            )) : roles.length ? roles.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <p className="font-semibold">{item.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.permissions.map((permission) => <Badge key={permission} variant="outline">{permission}</Badge>)}
                </div>
              </div>
            )) : (
              <EmptyState icon={ShieldCheck} title="No roles available" description="Sync organization roles to prepare admin, teacher, and student permissions." />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
