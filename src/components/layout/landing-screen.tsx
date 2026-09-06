import { ArrowRight, CheckCircle2, ClipboardCheck, LineChart, ListChecks } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { studyGuideManifest } from "@/sections/study-materials/study-guide-registry";

const subjectCount = studyGuideManifest.length;

const features = [
  {
    icon: LineChart,
    title: "Progress dashboard",
    description: "Readiness, skill growth, milestones, weak areas, and weekly effort stay visible in one place.",
  },
  {
    icon: ListChecks,
    title: "Daily action tracking",
    description: "Tasks, homework, coding practice, and submissions show what each student has actually completed.",
  },
  {
    icon: ClipboardCheck,
    title: "Assessment feedback",
    description: "Scores and self-assessments feed back into the readiness profile instead of sitting separately.",
  },
];

const progressFlow = [
  { label: "Tasks assigned", value: "3 today" },
  { label: "Homework pending", value: "4 items" },
  { label: "Average score", value: "82%" },
  { label: "Practice time", value: "11.5 hrs" },
];

export function LandingScreen({ onEnterDemo }: { onEnterDemo: () => void }) {
  return (
    <div className="student-shell min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo subtitle="Placement prep" />
          <Button onClick={onEnterDemo}>
            <ArrowRight className="h-4 w-4" />
            Open workspace
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-16">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-xs font-semibold text-secondary">
              <LineChart className="h-3.5 w-3.5" />
              Track every student’s placement readiness.
            </span>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              One workspace to monitor <span className="text-primary">student progress</span> from practice to placement.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              PlacePrep brings tasks, homework, assessments, coding practice, roadmaps, and study materials into a
              progress-first student dashboard so readiness is visible, measurable, and easy to improve.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button size="default" onClick={onEnterDemo}>
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Student readiness</p>
                <p className="mt-2 text-4xl font-bold">82%</p>
              </div>
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">+14% this month</span>
            </div>
            <div className="mt-5 h-2 rounded-full bg-muted">
              <div className="h-2 w-[82%] rounded-full bg-primary" />
            </div>
            <div className="mt-5 grid gap-3 border-t pt-4">
              {progressFlow.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold">Clear progress, less clutter</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The student view focuses on what changed, what is pending, and what needs attention next.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-xl border bg-white p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <h2 className="text-2xl font-bold">Materials support progress, not the other way around.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              The library has {subjectCount}+ guided subjects, but the main workflow is still progress: assign work,
              complete practice, measure readiness, and choose the next action.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Assign", "Submit", "Score", "Improve"].map((item) => (
                <span key={item} className="rounded-md border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-lg bg-muted p-4">
            {[
              "Resume draft submitted",
              "Arrays assignment pending",
              "Mock test score updated",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-xl bg-primary px-6 py-9 text-primary-foreground sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Open the student workspace.</h2>
              <p className="mt-2 max-w-xl text-sm text-primary-foreground/85">
                Review readiness, finish the next task, and keep preparation moving.
              </p>
            </div>
            <Button variant="secondary" onClick={onEnterDemo}>
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <BrandLogo subtitle="Placement prep" />
          <p>PlacePrep · Learn &amp; get placement-ready</p>
        </div>
      </footer>
    </div>
  );
}
