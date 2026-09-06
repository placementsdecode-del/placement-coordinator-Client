import { Download } from "lucide-react";
import { DonutProgress } from "@/components/common/donut-progress";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { results } from "@/data/student";

export function ResultsSection() {
  return (
    <>
      <SectionIntro
        eyebrow="Progress"
        title="Scores, ranks, feedback, and performance history."
        description="Review assessment outcomes, coordinator feedback, strengths, weak areas, and downloadable result summaries."
        action={
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        }
      />
      <section className="grid min-w-0 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Report Cards</CardTitle>
            <CardDescription>Score, rank, feedback, and review status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.length ? results.map((item) => (
              <div key={item.title} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
                <div className="min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge variant={item.score >= 85 ? "secondary" : "outline"}>{item.score >= 85 ? "Strong" : "Review"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.feedback}</p>
                  </div>
                </div>
                <DonutProgress value={item.score} caption={`Rank ${item.rank}`} size="sm" className="justify-self-start sm:justify-self-end" />
              </div>
            )) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No result reports available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
