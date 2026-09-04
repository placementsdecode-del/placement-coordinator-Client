import { MetricCards } from "@/components/common/metric-cards";
import { SkillBars } from "@/components/common/skill-bars";
import { TaskList } from "@/components/common/task-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { feedback } from "@/data/student";
import type { TaskItem } from "@/types/student";

export function DashboardSection({
  taskItems,
  onTaskAction,
}: {
  taskItems: TaskItem[];
  onTaskAction: (title: string) => void;
}) {
  return (
    <>
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)]">
        <div className="min-w-0 rounded-lg border bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="min-w-0">
              <p className="text-sm font-medium text-secondary">Dashboard</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">Placement preparation overview</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Metrics, tasks, feedback, and performance summaries will appear here when real activity is available.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coordinator Feedback</CardTitle>
            <CardDescription>Latest notes from mentors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.length ? feedback.map((note) => (
              <div key={note} className="rounded-lg border bg-background p-3 text-sm leading-6">
                {note}
              </div>
            )) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No coordinator feedback available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <MetricCards taskItems={taskItems} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Today{"'"}s Task Bar</CardTitle>
            <CardDescription>Tasks ordered by deadline and priority.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList tasksToShow={taskItems.slice(0, 3)} onTaskAction={onTaskAction} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Skill Performance</CardTitle>
            <CardDescription>Current preparation strength.</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillBars />
          </CardContent>
        </Card>
      </section>

    </>
  );
}
