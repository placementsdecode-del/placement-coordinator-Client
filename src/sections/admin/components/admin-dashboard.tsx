import { ClipboardList, FileText, Layers, Plus, ShieldCheck, Users } from "lucide-react";
import { ApiNotice } from "@/components/common/admin-primitives";
import { DonutProgress } from "@/components/common/donut-progress";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminAssessment, AdminStudentRow, AdminTask, CoordinatorRow, SectionRow } from "@/types/admin";

export function AdminDashboard({
  sections,
  students,
  coordinators,
  tasks,
  assessments,
  loading,
  loadError,
  onAction,
}: {
  sections: SectionRow[];
  students: AdminStudentRow[];
  coordinators: CoordinatorRow[];
  tasks: AdminTask[];
  assessments: AdminAssessment[];
  loading: boolean;
  loadError: string;
  onAction: (message: string) => void;
}) {
  const metrics = [
    { label: "Total students", value: students.length, detail: "Created from API data", tone: "bg-primary/10 text-primary" },
    { label: "Coordinators", value: coordinators.length, detail: "Assigned teachers", tone: "bg-green-100 text-green-800" },
    { label: "Active sections", value: sections.length, detail: "Organization sections", tone: "bg-slate-100 text-slate-700" },
    { label: "Assessments", value: assessments.length, detail: "Created assessments", tone: "bg-amber-100 text-amber-800" },
  ];

  return (
    <>
      <SectionIntro
        eyebrow="Organization Admin"
        title="Institution placement operations dashboard."
        description="Manage students through sections, assign coordinators, publish work, create assessments, and monitor readiness."
        action={
          <Button onClick={() => onAction("Quick create opened.")}>
            <Plus className="h-4 w-4" />
            Quick Create
          </Button>
        }
      />
      {loadError ? <ApiNotice message={loadError} /> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="min-h-28 p-5">
              <div className={`mb-4 inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${metric.tone}`}>{metric.label}</div>
              <p className="text-3xl font-bold">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Section Health</CardTitle>
            <CardDescription>Students are managed through their assigned sections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonRows rows={3} /> : sections.length ? sections.map((section) => (
              <div key={section.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{section.name}</p>
                    <Badge variant={section.status === "Active" ? "secondary" : "warning"}>{section.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {students.filter((student) => student.sectionId === section.id).length} students · {section.coordinator}
                  </p>
                </div>
                <DonutProgress value={section.readiness} size="sm" className="justify-self-start sm:justify-self-end" />
              </div>
            )) : (
              <EmptyState icon={Layers} title="No sections yet" description="Create a section to organize students, teachers, and assessments." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operations Queue</CardTitle>
            <CardDescription>Current admin workload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Coordinators", value: coordinators.length, icon: ShieldCheck },
              { label: "Active tasks", value: tasks.length, icon: ClipboardList },
              { label: "Assessments", value: assessments.length, icon: FileText },
              { label: "Students needing attention", value: students.filter((student) => student.status !== "Active").length, icon: Users },
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
