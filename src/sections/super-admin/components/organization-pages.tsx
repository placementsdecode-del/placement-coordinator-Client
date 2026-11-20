import { useEffect, useState } from "react";
import { Building2, Check, LoaderCircle, Mail, MapPin, Phone, ShieldCheck, X, type LucideIcon } from "lucide-react";
import { ApiNotice } from "@/components/common/admin-primitives";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrganizationRequest } from "@/types/super-admin";

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
        title="Organization requests"
        description="Approve valid institutions, reject incomplete requests, or mark them for review."
      />
      {loadError ? <ApiNotice message={loadError} /> : null}
      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.6fr)]">
        <Card className="flex min-h-0 flex-col lg:max-h-[calc(100dvh-15rem)]">
          <CardHeader className="shrink-0">
            <CardTitle>Registration Queue</CardTitle>
            <CardDescription>Select a request to inspect full organization details.</CardDescription>
          </CardHeader>
          <CardContent className="panel-scroll max-h-80 space-y-3 lg:max-h-none" tabIndex={0} aria-label="Registration requests">
            {loading ? <SkeletonRows rows={4} /> : requests.map((request) => (
              <button
                key={request.id}
                className={`grid w-full gap-3 rounded-lg border p-3 text-left md:grid-cols-[minmax(0,1fr)_130px] md:items-center ${
                  selectedRequest?.id === request.id ? "border-primary bg-primary/5" : "bg-white"
                }`}
                onClick={() => setSelectedRequestId(request.id)}
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold">{request.name}</p>
                  <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{request.contact} · {request.submitted}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">Requested: {request.requestedPlan || "Standard setup"}</p>
                </div>
                <Badge variant="warning">{request.status}</Badge>
              </button>
            ))}
            {!loading && !requests.length ? (
              <EmptyState icon={ShieldCheck} title="No organization requests" description="New organization registrations will appear here for approval or rejection." />
            ) : null}
          </CardContent>
        </Card>
        <Card className="flex min-h-0 flex-col lg:max-h-[calc(100dvh-15rem)]">
          <CardHeader className="shrink-0">
            <CardTitle>{selectedRequest?.name ?? "No request selected"}</CardTitle>
            <CardDescription>Review all submitted details before making a decision.</CardDescription>
          </CardHeader>
          <CardContent className="panel-scroll space-y-4" tabIndex={0} aria-label="Registration details">
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
                      <Badge key={feature} variant="feature">{feature}</Badge>
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
                  <Button variant="destructive" disabled={Boolean(busyRequest)} onClick={() => handleRequestAction(selectedRequest.id, "Rejected")}>
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
