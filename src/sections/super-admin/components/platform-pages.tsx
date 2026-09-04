import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, ChevronDown, ChevronRight, FileText, GitCommitHorizontal, LifeBuoy, LoaderCircle, Plus, Settings } from "lucide-react";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { DonutProgress } from "@/components/common/donut-progress";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auditLogs, supportTickets } from "@/data/super-admin";
import { cn } from "@/lib/utils";
import type { CommitEntry, OrganizationRow } from "@/types/super-admin";

export function PlansPage({ onAction }: { onAction: (message: string) => void }) {
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
              <Button variant="outline">Edit Plan</Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}

export function AnalyticsPage({ organizations }: { organizations: OrganizationRow[] }) {
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

export function SupportPage({ onAction }: { onAction: (message: string) => void }) {
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

export function AuditPage() {
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

export function ChangelogPage() {
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

export function PlatformSettingsPage({ onAction }: { onAction: (message: string) => void }) {
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
          <Input placeholder="Support email" defaultValue="support@placeprep.io" />
          <Input placeholder="Default plan" defaultValue="Default Growth Plan" />
          <Input placeholder="Security policy" defaultValue="MFA optional" />
          <Input placeholder="Audit retention" defaultValue="Audit retention 365 days" />
        </CardContent>
      </Card>
      <ChangePasswordCard />
    </>
  );
}
