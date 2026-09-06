import { useMemo } from "react";
import { Download, Search } from "lucide-react";
import { SectionIntro } from "@/components/common/section-intro";
import { TaskList } from "@/components/common/task-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TaskItem } from "@/types/student";

export function DailyTasksSection({
  query,
  setQuery,
  taskItems,
  onTaskAction,
}: {
  query: string;
  setQuery: (value: string) => void;
  taskItems: TaskItem[];
  onTaskAction: (title: string) => void;
}) {
  const visibleTasks = useMemo(
    () => taskItems.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())),
    [query, taskItems],
  );
  const pendingCount = taskItems.filter((task) => task.status !== "Completed").length;
  const completedCount = taskItems.filter((task) => task.status === "Completed").length;
  const overdueCount = taskItems.filter((task) => task.status === "Overdue").length;

  return (
    <>
      <SectionIntro
        eyebrow="Tasks & Activities"
        title="Today's coordinator-assigned work queue."
        description="Start, submit, comment, upload attachments, and track overdue placement preparation tasks."
        action={
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <Badge variant="warning">{pendingCount} Pending</Badge>
            <Badge variant="secondary">{completedCount} Completed</Badge>
            <Badge variant="danger">{overdueCount} Overdue</Badge>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search tasks" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <TaskList tasksToShow={visibleTasks} onTaskAction={onTaskAction} />
        </CardContent>
      </Card>
      <section className="grid gap-4 lg:grid-cols-3">
        {["Open task details", "Add comments", "Upload attachments"].map((item, index) => (
          <Card key={item}>
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">{index + 1}</div>
              <p className="font-medium">{item}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
