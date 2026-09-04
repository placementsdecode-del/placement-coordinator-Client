import { BarChart3, CreditCard, LifeBuoy, Plus, ShieldCheck } from "lucide-react";
import { ApiNotice } from "@/components/common/admin-primitives";
import { DonutProgress } from "@/components/common/donut-progress";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auditLogs, supportTickets } from "@/data/super-admin";
import type { OrganizationRequest, OrganizationRow } from "@/types/super-admin";

export function SuperAdminDashboard({
  organizations,
  requests,
  loading,
  loadError,
  onAction,
}: {
  organizations: OrganizationRow[];
  requests: OrganizationRequest[];
  loading: boolean;
  loadError: string;
  onAction: (message: string) => void;
}) {
  const metrics = [
    { label: "Organizations", value: organizations.length, detail: "Accepted tenants" },
    { label: "Pending requests", value: requests.length, detail: "Awaiting review" },
    { label: "Active tenants", value: organizations.filter((org) => org.status === "Active").length, detail: "Currently active" },
    { label: "Suspended tenants", value: organizations.filter((org) => org.status === "Suspended").length, detail: "Needs follow-up" },
  ];

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
      {loadError ? <ApiNotice message={loadError} /> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="min-h-28 p-5">
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
            {loading ? <SkeletonRows rows={3} /> : organizations.length ? organizations.map((org) => (
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
            )) : (
              <EmptyState title="No organizations yet" description="Approved organizations will appear here after registration review." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Work</CardTitle>
            <CardDescription>Platform queues.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonRows rows={4} /> : [
              { label: "Organization requests", value: requests.filter((request) => request.status !== "Approved").length, icon: ShieldCheck },
              { label: "Support tickets", value: supportTickets.length, icon: LifeBuoy },
              { label: "Plans active", value: "0", icon: CreditCard },
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
