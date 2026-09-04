import { useState } from "react";
import { CheckCircle2, ClipboardList, FileUp, Target, UploadCloud } from "lucide-react";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HomeworkItem } from "@/types/student";

export function HomeworkSection({
  homeworkItems,
  onSubmitHomework,
}: {
  homeworkItems: HomeworkItem[];
  onSubmitHomework: (title: string) => void;
}) {
  const [selectedHomework, setSelectedHomework] = useState(homeworkItems[0]?.title ?? "");
  const selected = homeworkItems.find((item) => item.title === selectedHomework) ?? homeworkItems[0];
  const detail = {
    objective: `Complete the ${selected?.category.toLowerCase() ?? "placement"} task with clear reasoning, clean formatting, and submission evidence.`,
    deliverables: [
      "Final answer or file in the requested submission format",
      "Short explanation of approach and assumptions",
      "Links, screenshots, or attachments when applicable",
    ],
    acceptanceCriteria: [
      "All required fields are completed before the due time",
      "Submission follows the category-specific instructions",
      "Work is original and includes enough detail for coordinator review",
      "Any external link is accessible without extra permission",
    ],
    minimumExpectations: [
      "No empty or placeholder responses",
      "Readable formatting with correct file naming",
      "At least one self-review comment before submission",
    ],
    rubric: [
      { label: "Completeness", value: 35 },
      { label: "Accuracy", value: 30 },
      { label: "Presentation", value: 20 },
      { label: "Timeliness", value: 15 },
    ],
  };

  return (
    <>
      <SectionIntro
        eyebrow="Placement Homework"
        title="Assignments from coordinators with submission-ready detail views."
        description="Track instructions, difficulty, category, score, due dates, accepted submission types, and review feedback."
        action={
          <Button>
            <FileUp className="h-4 w-4" />
            New Submission
          </Button>
        }
      />
      <section className="grid min-w-0 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="xl:sticky xl:top-20 xl:self-start">
          <CardHeader>
            <CardTitle>Homework Board</CardTitle>
            <CardDescription>Sorted by due date.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {homeworkItems.map((item) => (
              <button
                key={item.title}
                className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted sm:p-4 ${
                  selected?.title === item.title ? "border-primary bg-primary/5" : "bg-white"
                }`}
                onClick={() => setSelectedHomework(item.title)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <Badge variant={item.status === "Submitted" ? "secondary" : "outline"}>{item.status}</Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <p>Due: {item.due}</p>
                  <p>Difficulty: {item.difficulty}</p>
                  <p>Maximum score: {item.score}</p>
                  <p>Submission: {item.submission}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{selected ? selected.title : "Homework Detail"}</CardTitle>
                <CardDescription>{selected ? `${selected.category} · ${selected.difficulty} · ${selected.score}` : "Select homework to preview."}</CardDescription>
              </div>
              {selected ? <Badge variant={selected.status === "Submitted" ? "secondary" : "warning"}>{selected.status}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Due date</p>
                  <p className="font-semibold">{selected.due}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Submission type</p>
                  <p className="font-semibold">{selected.submission}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Assigned by</p>
                  <p className="font-semibold">Coordinator</p>
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Target className="h-4 w-4 text-primary" />
                Objective
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail.objective}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  What Needs To Be Achieved
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {detail.deliverables.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Acceptance Criteria
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {detail.acceptanceCriteria.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-lg border p-4">
                <p className="font-semibold">Minimum Expectations</p>
                <div className="mt-3 grid gap-2">
                  {detail.minimumExpectations.map((item) => (
                    <div key={item} className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-semibold">Evaluation Rubric</p>
                <div className="mt-3 space-y-2">
                  {detail.rubric.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="font-semibold">How To Submit</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Input placeholder="Paste external platform link" />
                <Input placeholder="Attachment name or drive URL" />
              </div>
              <textarea
                className="mt-3 min-h-32 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                placeholder="Write your response, notes, or self-review"
              />
              <div className="mt-3 rounded-lg border border-dashed bg-background p-5 text-center">
                <UploadCloud className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-2 text-sm font-medium">Upload PDF, DOCX, ZIP, image, or code file</p>
              </div>
            </div>
            <Button className="w-full" disabled={!selected || selected.status === "Submitted"} onClick={() => selected && onSubmitHomework(selected.title)}>
              {selected?.status === "Submitted" ? "Already Submitted" : "Submit Homework"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
