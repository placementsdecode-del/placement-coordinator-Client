import { Card, CardContent } from "@/components/ui/card";
import { stats } from "@/data/student";
import type { TaskItem } from "@/types/student";

export function MetricCards({ taskItems = [] }: { taskItems?: TaskItem[] }) {
  const dynamicStats = stats.map((stat) => {
    if (stat.label === "Tasks Due Today") {
      return { ...stat, value: String(taskItems.filter((task) => task.status !== "Completed").length) };
    }
    if (stat.label === "Completed Tasks") {
      return { ...stat, value: String(28 + taskItems.filter((task) => task.status === "Completed").length) };
    }
    return stat;
  });

  return (
    <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {dynamicStats.length ? dynamicStats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-11 sm:w-11">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-xl font-bold">{stat.value}</p>
              <p className="truncate text-xs text-muted-foreground">{stat.detail}</p>
            </div>
          </CardContent>
        </Card>
      )) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground sm:p-5">
            No preparation metrics available yet.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
