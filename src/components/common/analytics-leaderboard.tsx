import { useState } from "react";
import { DonutProgress } from "@/components/common/donut-progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { leaderboardRows, organizationAnalytics, sectionPerformance } from "@/data/student";
import { cn } from "@/lib/utils";

export function AnalyticsAndLeaderboard() {
  const [scope, setScope] = useState<"organization" | "section">("section");
  const metrics = organizationAnalytics[scope];
  const rankedRows = scope === "section" ? leaderboardRows.filter((row) => row.section === "CSE C") : leaderboardRows;

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="min-w-0">
            <CardTitle>Analytics</CardTitle>
            <CardDescription>{scope === "section" ? "Section C performance snapshot." : "Organization-wide placement readiness."}</CardDescription>
          </div>
          <div className="grid grid-cols-2 rounded-md border bg-muted p-1 text-sm">
            {(["section", "organization"] as const).map((item) => (
              <button
                key={item}
                className={cn(
                  "rounded px-3 py-2 font-medium capitalize transition-colors",
                  scope === item ? "bg-white text-primary shadow-sm" : "text-muted-foreground",
                )}
                onClick={() => setScope(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.length ? metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border bg-background p-3">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.detail}</p>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground sm:col-span-2">
                No analytics available yet.
              </div>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sectionPerformance.length ? sectionPerformance.map((item) => (
              <div key={item.section} className="rounded-lg border p-3">
                <p className="text-sm font-semibold">{item.section}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DonutProgress value={item.readiness} label="Readiness" size="sm" />
                  <DonutProgress value={item.completion} label="Completion" size="sm" />
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground md:col-span-2">
                No section performance data available yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>{scope === "section" ? "CSE Section C ranking." : "Organization ranking."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rankedRows.length ? rankedRows.map((row) => (
            <div
              key={`${scope}-${row.name}`}
              className={cn(
                "grid grid-cols-[36px_minmax(0,1fr)_52px] items-center gap-3 rounded-lg border p-3",
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                #{scope === "section" ? row.sectionRank : row.orgRank}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.section}</p>
              </div>
              <p className="text-right text-lg font-bold">{row.score}</p>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No leaderboard rows available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
