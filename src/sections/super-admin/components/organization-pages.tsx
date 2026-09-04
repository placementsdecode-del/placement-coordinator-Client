import { useEffect, useState } from "react";
import { Building2, Check, LoaderCircle, Mail, MapPin, Phone, ShieldCheck, Users, X, type LucideIcon } from "lucide-react";
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
import type { AcceptedOrganization } from "@/types/api";
import type { OrganizationRequest, OrganizationRow } from "@/types/super-admin";

export function OrganizationsPage({
  organizations,
  apiOrganizations,
  selectedOrg,
  loadError,
  loading,
  onSelectOrg,
  onUpdateDetails,
  onUpdateStatus,
}: {
  organizations: OrganizationRow[];
  apiOrganizations: AcceptedOrganization[];
  selectedOrg: OrganizationRow | null;
  loadError: string;
  loading: boolean;
  onSelectOrg: (orgId: string) => void;
  onUpdateDetails: (orgId: string, payload: Partial<AcceptedOrganization>) => Promise<void>;
  onUpdateStatus: (orgId: string, status: string) => Promise<void>;
}) {
  const selectedApiOrg = selectedOrg ? apiOrganizations.find((organization) => organization._id === selectedOrg.id) : undefined;
  const [form, setForm] = useState({
    orgName: selectedApiOrg?.orgName ?? selectedOrg?.name ?? "",
    orgEmail: selectedApiOrg?.orgEmail ?? "",
    phoneNumber: selectedApiOrg?.phoneNumber ?? "",
    country: selectedApiOrg?.location?.country ?? "",
    state: selectedApiOrg?.location?.state ?? "",
    city: selectedApiOrg?.location?.city ?? "",
    postalCode: selectedApiOrg?.location?.postalCode ?? "",
    address: selectedApiOrg?.address ?? selectedOrg?.region ?? "",
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({
      orgName: selectedApiOrg?.orgName ?? selectedOrg?.name ?? "",
      orgEmail: selectedApiOrg?.orgEmail ?? "",
      phoneNumber: selectedApiOrg?.phoneNumber ?? "",
      country: selectedApiOrg?.location?.country ?? "",
      state: selectedApiOrg?.location?.state ?? "",
      city: selectedApiOrg?.location?.city ?? "",
      postalCode: selectedApiOrg?.location?.postalCode ?? "",
      address: selectedApiOrg?.address ?? selectedOrg?.region ?? "",
    });
  }, [selectedApiOrg?._id, selectedOrg?.id]);

  async function submitDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrg) return;
    const nextErrors: Record<string, string> = {};
    if (!form.orgName.trim()) nextErrors.orgName = "Organization name is required.";
    if (!form.orgEmail.trim()) nextErrors.orgEmail = "Organization email is required.";
    else if (!isValidEmail(form.orgEmail)) nextErrors.orgEmail = "Enter a valid email address.";
    if (!form.phoneNumber.trim()) nextErrors.phoneNumber = "Phone number is required.";
    if (!form.country.trim()) nextErrors.country = "Country is required.";
    if (!form.state.trim()) nextErrors.state = "State is required.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (!form.postalCode.trim()) nextErrors.postalCode = "Postal code is required.";
    if (!form.address.trim()) nextErrors.address = "Address is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSavingDetails(true);
    try {
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
    } finally {
      setSavingDetails(false);
    }
  }

  async function submitStatus(status: string) {
    if (!selectedOrg) return;
    setUpdatingStatus(status);
    try {
      await onUpdateStatus(selectedOrg.id, status);
    } finally {
      setUpdatingStatus("");
    }
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
            {loading ? <SkeletonRows rows={4} /> : organizations.map((org) => (
              <button
                key={org.id}
                className={`grid w-full gap-3 rounded-lg border p-3 text-left md:grid-cols-[minmax(0,1fr)_120px] md:items-center ${
                  selectedOrg?.id === org.id ? "border-primary bg-primary/5" : "bg-white"
                }`}
                onClick={() => onSelectOrg(org.id)}
              >
                <div className="min-w-0">
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-sm text-muted-foreground">{org.students} students · {org.coordinators} coordinators · {org.region}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{org.plan}</p>
                </div>
                <Badge variant={org.status === "Active" ? "secondary" : org.status === "Suspended" ? "danger" : "warning"}>{org.status}</Badge>
              </button>
            ))}
            {!loading && !organizations.length ? (
              <EmptyState title="No organizations yet" description="Approved organizations will appear here after registration review." />
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{selectedOrg?.name ?? "No organization selected"}</CardTitle>
            <CardDescription>Tenant controls and usage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedOrg ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <InfoTile label="Status" value={selectedOrg.status} />
                  <InfoTile label="Students" value={String(selectedOrg.students)} />
                  <InfoTile label="Coordinators" value={String(selectedOrg.coordinators)} />
                  <InfoTile label="Region" value={selectedOrg.region || "Not provided"} />
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">Enabled Features</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedOrg.plan ? selectedOrg.plan.split(",").map((item) => item.trim()).filter(Boolean) : ["Custom"]).map((feature) => (
                      <Badge key={feature} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
                <DonutProgress value={selectedOrg.usage} label="Usage" caption="Current tenant resource usage" />
              </>
            ) : (
              <EmptyState icon={Users} title="No organization selected" description="Select an organization after one is approved." />
            )}
            <form className="grid max-w-xl gap-2" onSubmit={submitDetails}>
              <div className="space-y-1"><Input required placeholder="Organization name" value={form.orgName} onChange={(event) => setForm((current) => ({ ...current, orgName: event.target.value }))} /><FieldError message={errors.orgName} /></div>
              <div className="space-y-1"><Input required type="email" placeholder="Organization email" value={form.orgEmail} onChange={(event) => setForm((current) => ({ ...current, orgEmail: event.target.value }))} /><FieldError message={errors.orgEmail} /></div>
              <div className="space-y-1"><Input required placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} /><FieldError message={errors.phoneNumber} /></div>
              <div className="space-y-1"><Input required placeholder="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} /><FieldError message={errors.country} /></div>
              <div className="space-y-1"><Input required placeholder="State" value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} /><FieldError message={errors.state} /></div>
              <div className="space-y-1"><Input required placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} /><FieldError message={errors.city} /></div>
              <div className="space-y-1"><Input required placeholder="Postal code" value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} /><FieldError message={errors.postalCode} /></div>
              <div className="space-y-1">
              <textarea
                required
                className="min-h-20 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                placeholder="Address"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
              <FieldError message={errors.address} />
              </div>
              <Button type="submit" variant="outline" disabled={!selectedOrg || savingDetails}>
                {savingDetails ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {savingDetails ? "Updating..." : "Update Details"}
              </Button>
            </form>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" disabled={!selectedOrg || Boolean(updatingStatus)} onClick={() => submitStatus("Active")}>
                {updatingStatus === "Active" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Activate
              </Button>
              <Button variant="outline" disabled={!selectedOrg || Boolean(updatingStatus)} onClick={() => submitStatus("Suspended")}>
                {updatingStatus === "Suspended" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Suspend
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

export function RequestsPage({
  requests,
  loadError,
  loading,
  onHandleRequest,
}: {
  requests: OrganizationRequest[];
  loadError: string;
  loading: boolean;
  onHandleRequest: (requestId: string, status: string) => Promise<void>;
}) {
  const [busyRequest, setBusyRequest] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(requests[0]?.id ?? "");
  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? requests[0] ?? null;

  useEffect(() => {
    setSelectedRequestId((current) => requests.find((request) => request.id === current)?.id ?? requests[0]?.id ?? "");
  }, [requests]);

  async function handleRequestAction(requestId: string, status: string) {
    setBusyRequest(`${requestId}:${status}`);
    try {
      await onHandleRequest(requestId, status);
    } finally {
      setBusyRequest("");
    }
  }

  return (
    <>
      <SectionIntro
        eyebrow="Organization Requests"
        title="Review and approve new institution onboarding requests."
        description="Approve valid institutions, reject incomplete requests, or mark them for review."
      />
      {loadError ? <ApiNotice message={loadError} /> : null}
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Registration Queue</CardTitle>
            <CardDescription>Select a request to inspect full organization details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonRows rows={4} /> : requests.map((request) => (
              <button
                key={request.id}
                className={`grid w-full gap-3 rounded-lg border p-3 text-left md:grid-cols-[minmax(0,1fr)_130px] md:items-center ${
                  selectedRequest?.id === request.id ? "border-primary bg-primary/5" : "bg-white"
                }`}
                onClick={() => setSelectedRequestId(request.id)}
              >
                <div className="min-w-0">
                  <p className="font-semibold">{request.name}</p>
                  <p className="text-sm text-muted-foreground">{request.contact} · {request.submitted}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">Requested: {request.requestedPlan || "Standard setup"}</p>
                </div>
                <Badge variant="outline">{request.status}</Badge>
              </button>
            ))}
            {!loading && !requests.length ? (
              <EmptyState icon={ShieldCheck} title="No organization requests" description="New organization registrations will appear here for approval or rejection." />
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{selectedRequest?.name ?? "No request selected"}</CardTitle>
            <CardDescription>Review all submitted details before making a decision.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <SkeletonRows rows={5} /> : selectedRequest ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <RequestDetail icon={Building2} label="Organization" value={selectedRequest.name} />
                  <RequestDetail icon={Mail} label="Email" value={selectedRequest.contact} />
                  <RequestDetail icon={Phone} label="Phone" value={selectedRequest.phoneNumber || "Not provided"} />
                  <RequestDetail icon={MapPin} label="Location" value={[selectedRequest.city, selectedRequest.state, selectedRequest.country, selectedRequest.postalCode].filter(Boolean).join(", ") || "Not provided"} />
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">Address</p>
                  <p className="mt-1 text-sm font-semibold">{selectedRequest.address || "Not provided"}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">Requested Features</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedRequest.requestedPlan ? selectedRequest.requestedPlan.split(",").map((item) => item.trim()).filter(Boolean) : ["Standard setup"]).map((feature) => (
                      <Badge key={feature} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
                {selectedRequest.notes ? (
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                    <p className="mt-1 text-sm">{selectedRequest.notes}</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" disabled={Boolean(busyRequest)} onClick={() => handleRequestAction(selectedRequest.id, "Rejected")}>
                    {busyRequest === `${selectedRequest.id}:Rejected` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    {busyRequest === `${selectedRequest.id}:Rejected` ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button disabled={Boolean(busyRequest)} onClick={() => handleRequestAction(selectedRequest.id, "Approved")}>
                    {busyRequest === `${selectedRequest.id}:Approved` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {busyRequest === `${selectedRequest.id}:Approved` ? "Approving..." : "Approve"}
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState icon={ShieldCheck} title="No request selected" description="Select a registration request to review its details." />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

export function RequestDetail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}
