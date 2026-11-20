import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, FileText, GitCommitHorizontal, CreditCard, LifeBuoy, FileClock } from "lucide-react";
import { DashboardMetric } from "@/components/common/dashboard-metric";
import { EmptyState } from "@/components/common/empty-state";
import { PageSkeleton, LoadError } from "@/components/common/loading-state";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { DonutProgress } from "@/components/common/donut-progress";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auditLogs, supportTickets } from "@/data/super-admin";
import { cn } from "@/lib/utils";
import type { CommitEntry, OrganizationRow } from "@/types/super-admin";

export function PlansPage() {
  return <>
    <SectionIntro eyebrow="Plans" title="Subscription plans" description="Manage platform billing once plans are configured." />
    <EmptyState icon={CreditCard} title="Billing is awaiting setup" description="Organization access is managed through Requests and Organizations." />
  </>;
}

export function AnalyticsPage({ organizations }: { organizations: OrganizationRow[] }) {
  return (
    <>
      <SectionIntro
        eyebrow="Platform Analytics"
        title="Organization accounts"
        description="Student and coordinator counts from organization accounts."
      />
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Active accounts by organization</CardTitle>
            <CardDescription>Percentage of accounts enabled for sign-in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!organizations.length && <EmptyState title="No organization accounts" description="Account activity appears here after organizations are approved." />}
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
            <p className="text-sm text-muted-foreground">Billing plans have not been configured.</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

export function SupportPage() {
  return (
    <>
      <SectionIntro
        eyebrow="Support"
        title="Support requests"
        description="Track, escalate, and resolve institution support requests."
      />
      {!supportTickets.length ? <EmptyState icon={LifeBuoy} title="Support requests are awaiting setup" description="Requests from organizations will appear here once collection is enabled." /> : <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {supportTickets.map((ticket) => (
            <div key={ticket.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <p className="font-semibold">{ticket.id} · {ticket.title}</p>
                <p className="text-sm text-muted-foreground">{ticket.organization}</p>
              </div>
              <Badge variant={ticket.priority === "Critical" ? "danger" : ticket.priority === "High" ? "warning" : "outline"}>{ticket.priority}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>}
    </>
  );
}

export function AuditPage() {
  return (
    <>
      <SectionIntro
        eyebrow="Audit Logs"
        title="Audit logs"
        description="Review actions across organizations, subscriptions, settings, and user access."
      />
      {auditLogs.length ? <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          {auditLogs.map((log, index) => (
            <div key={log} className="rounded-lg border p-3 text-sm">
              <span className="font-semibold">#{index + 1}</span> · {log}
            </div>
          ))}
        </CardContent>
      </Card> : <EmptyState icon={FileClock} title="No audit events available" description="Recorded platform activity will appear here when audit data is available." />}
    </>
  );
}

export function ChangelogPage() {
  const [openHash, setOpenHash] = useState<string | null>(null);
  const [commitHistory, setCommitHistory] = useState<CommitEntry[] | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [retry, setRetry] = useState(0);

  // Load the (large) commit data only when this admin page is opened.
  useEffect(() => {
    let active = true;
    import("@/data/commit-history").then((module) => {
      if (active) setCommitHistory(module.commitHistory);
    }).catch(() => { if (active) setHistoryError(true); });
    return () => {
      active = false;
    };
  }, [retry]);

  const latest = commitHistory?.[0];
  const areas = useMemo(
    () => (commitHistory ? Array.from(new Set(commitHistory.map((commit) => commit.area))) : []),
    [commitHistory],
  );

  if (historyError) return <LoadError message="Unable to load commit history." onRetry={() => { setHistoryError(false); setRetry(value => value + 1); }} />;
  if (!commitHistory) return <PageSkeleton label="Loading commit history" />;

  const openCommit = commitHistory.find((commit) => commit.hash === openHash);

  if (openCommit) {
    return <CommitDetail commit={openCommit} onBack={() => setOpenHash(null)} />;
  }

  return (
    <>
      <SectionIntro
        eyebrow="Changelog"
        title="Changelog"
        description="Every pushed commit to the application — with its short hash. Open a commit to see exactly which files changed in the deployed build."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <DashboardMetric label="Tracked commits" value={commitHistory.length} />
        <DashboardMetric label="Latest change" value={<code className="text-lg text-primary">{latest?.hash ?? "—"}</code>} detail={latest?.date} />
        <DashboardMetric label="Areas touched" value={areas.length} />
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

export function CommitDetail({ commit, onBack }: { commit: CommitEntry; onBack: () => void }) {
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

export function DiffView({ patch, truncated }: { patch: string; truncated: boolean }) {
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

export function PlatformSettingsPage() {
  return <ChangePasswordCard />;
}
