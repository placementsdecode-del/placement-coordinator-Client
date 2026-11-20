import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardMetric({ label, value, detail }: {
  label: string;
  value: ReactNode;
  detail?: string;
}) {
  return <Card>
    <CardContent className="space-y-1 p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="min-w-0 break-words text-2xl font-semibold tabular-nums">
        {value}
      </div>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
    </CardContent>
  </Card>;
}
