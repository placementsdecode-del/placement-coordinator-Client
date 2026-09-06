import { PageSkeleton } from "@/components/common/loading-state";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  LoaderCircle,
  Play,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  materialCategories,
  technologyMaterials,
  type MaterialCategory,
} from "./study-materials-data";
import { StudyGuideReader, type GuideView } from "./components/study-guide-reader";
import { guideIdForTitle, loadStudyGuide, studyGuideManifest } from "./study-guide-registry";
import type { StudyGuide } from "./study-guide-schema";

type ChapterTab = GuideView;

const flow = ["Fundamentals", "Core", "Intermediate", "Advanced", "Production", "Interview", "Coding", "Projects", "Revision"];
const tabs: ChapterTab[] = ["Learn", "Examples", "Visualize", "Code", "Practice", "Interview", "Revision", "Notes"];

export function StudyMaterialsSection({ onAction }: { onAction: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MaterialCategory | "All">("All");
  const [selectedTech, setSelectedTech] = useState("Java");
  const [activeStage, setActiveStage] = useState("Fundamentals");
  const [activeTab, setActiveTab] = useState<ChapterTab>("Learn");
  const [chapterOpen, setChapterOpen] = useState(false);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(true);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = guideIdForTitle(selectedTech);
    let active = true;
    setGuideLoading(true);
    setGuideError(null);
    if (!id) {
      setGuide(null);
      setGuideLoading(false);
      setGuideError(`No JSON guide is registered for ${selectedTech}.`);
      return () => { active = false; };
    }
    loadStudyGuide(id)
      .then((nextGuide) => { if (active) setGuide(nextGuide); })
      .catch((error: unknown) => { if (active) setGuideError(error instanceof Error ? error.message : "Unable to load guide."); })
      .finally(() => { if (active) setGuideLoading(false); });
    return () => { active = false; };
  }, [selectedTech]);

  const filteredGuides = useMemo(
    () => studyGuideManifest.filter((item) => {
      return (category === "All" || item.category === category) && item.title.toLowerCase().includes(query.toLowerCase());
    }),
    [category, query],
  );
  const selected = technologyMaterials[selectedTech];
  const selectedManifest = studyGuideManifest.find((item) => item.title === selectedTech);
  const currentGuideId = selectedManifest?.id;
  const totalTopics = selectedManifest?.topics ?? 0;
  const completedCount = currentGuideId
    ? [...completedTopics].filter((key) => key.startsWith(`${currentGuideId}::`)).length
    : 0;
  const progressPct = totalTopics ? Math.round((completedCount / totalTopics) * 100) : 0;

  function toggleTopicComplete(guideId: string, topicId: string) {
    setCompletedTopics((prev) => {
      const key = `${guideId}::${topicId}`;
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (chapterOpen) {
    if (guideLoading) return <PageSkeleton label={`Loading ${selectedTech} study guide`} />;
    if (guideError || !guide) return <GuideStatus title="Guide unavailable" description={guideError ?? `The ${selectedTech} guide could not be loaded.`} onBack={() => setChapterOpen(false)} />;
    return (
      <ChapterPage
        activeTab={activeTab}
        guide={guide}
        activeStage={activeStage}
        completedTopics={completedTopics}
        onToggleComplete={toggleTopicComplete}
        onAction={onAction}
        onBack={() => setChapterOpen(false)}
        onChangeTab={setActiveTab}
      />
    );
  }

  function openStage(stage: string, tab: ChapterTab = "Learn") {
    setActiveStage(stage);
    setActiveTab(tab);
    setChapterOpen(true);
  }

  return (
    <section className="min-w-0 space-y-4">
      <header className="flex flex-col gap-4 border-b bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-secondary">Study library</p>
          <h1 className="mt-1 text-2xl font-bold">Learn deeply. Practise deliberately.</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Complete, interview-oriented curricula from first principles to production for {studyGuideManifest.length} subjects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onAction(`${selectedTech} bookmarked.`)} title="Bookmark course">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Bookmark</span>
          </Button>
          <Button onClick={() => openStage(activeStage)}>
            <Play className="h-4 w-4" /> Continue
          </Button>
        </div>
      </header>

      <section className="border-y bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search subjects" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {(["All", ...materialCategories] as const).map((item) => (
                <button
                  key={item}
                  className={cn(
                    "h-9 shrink-0 rounded-md px-3 text-sm font-medium transition-colors",
                    category === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {filteredGuides.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "min-w-0 bg-white px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted",
                  selectedTech === item.title && "bg-primary/10 text-primary ring-1 ring-inset ring-primary",
                )}
                onClick={() => {
                  setSelectedTech(item.title);
                  setActiveStage("Fundamentals");
                }}
              >
                <span className="block truncate">{item.title}</span>
                <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{item.category}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-5 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{selected.category}</Badge>
              <span className="text-xs text-muted-foreground">{selectedManifest?.stages ?? 0} learning stages · {selectedManifest?.topics ?? 0} topics</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold">{selectedTech}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{selected.purpose}</p>
          </div>
          <div className="grid grid-cols-3 divide-x rounded-md border text-center lg:min-w-[360px]">
            <Stat label="Progress" value={`${progressPct}%`} />
            <Stat label="Completed" value={`${completedCount}`} />
            <Stat label="Topics" value={`${totalTopics}`} />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-md border">
          <div className="hidden grid-cols-[140px_minmax(0,1fr)_110px] bg-muted px-4 py-2 text-xs font-semibold uppercase text-muted-foreground md:grid">
            <span>Stage</span><span>What you will learn</span><span className="text-right">Action</span>
          </div>
          {flow.map((stage, index) => {
            const topics = guide?.stages.find((item) => item.title === stage)?.topics.map((topic) => topic.title) ?? topicsForStage(selectedTech, stage);
            return (
              <button
                key={stage}
                className={cn(
                  "grid w-full gap-2 border-t px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-muted/60 md:grid-cols-[140px_minmax(0,1fr)_110px] md:items-center",
                  activeStage === stage && "bg-primary/5",
                )}
                onClick={() => openStage(stage, stage === "Interview" ? "Interview" : stage === "Coding" ? "Practice" : "Learn")}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs text-primary">{index + 1}</span>
                  {stage}
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">{topics.join(" · ")}</span>
                <span className="flex items-center justify-end gap-1 text-sm font-medium text-primary">
                  Open <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid border-y bg-white lg:grid-cols-2 lg:divide-x">
        <CompactPanel
          icon={Code2}
          title="Practice workspace"
          description={`${selectedTech} exercises from concept checks to production debugging.`}
          items={selected.coding.slice(0, 3)}
          action="Open practice"
          onClick={() => openStage("Coding", "Practice")}
        />
        <CompactPanel
          icon={Brain}
          title="Revision queue"
          description="Spaced review based on weak answers and failed attempts."
          items={selected.revision.slice(0, 3)}
          action="Start revision"
          onClick={() => openStage("Revision", "Revision")}
        />
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="px-3 py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-bold">{value}</p></div>;
}

function CompactPanel({ icon: Icon, title, description, items, action, onClick }: {
  icon: typeof Code2;
  title: string;
  description: string;
  items: string[];
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
        </div>
        <Button size="sm" variant="outline" onClick={onClick}>{action}</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
      </div>
    </div>
  );
}

function ChapterPage({ activeTab, guide, activeStage, completedTopics, onToggleComplete, onAction, onBack, onChangeTab }: {
  activeTab: ChapterTab;
  guide: StudyGuide;
  activeStage: string;
  completedTopics: Set<string>;
  onToggleComplete: (guideId: string, topicId: string) => void;
  onAction: (message: string) => void;
  onBack: () => void;
  onChangeTab: (tab: ChapterTab) => void;
}) {
  const stage = guide.stages.find((item) => item.title === activeStage) ?? guide.stages[0];
  const [topicIndex, setTopicIndex] = useState(0);
  const topic = stage.topics[topicIndex] ?? stage.topics[0];
  const topicDone = completedTopics.has(`${guide.id}::${topic.id}`);

  function selectTopic(index: number) {
    setTopicIndex(index);
    onChangeTab("Learn");
  }

  return (
    <article className="min-w-0 bg-white">
      <header className="border-b px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" />Library</Button>
          <Badge variant="secondary">{guide.title}</Badge>
          <Badge variant="outline">{stage.level}</Badge>
        </div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{guide.title}: {stage.title}</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{stage.objective}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span><strong>{Math.max(stage.topics.length * 2, 2)} hours</strong> estimated</span>
          <span><strong>{stage.topics.length}</strong> topics</span>
          <span>Source: <strong>{guide.id}.json</strong></span>
        </div>
      </header>

      <nav className="sticky top-[61px] z-10 flex gap-1 overflow-x-auto border-b bg-white px-4 py-2 sm:px-6">
        {tabs.map((tab) => <button key={tab} className={cn("h-9 shrink-0 rounded-md px-3 text-sm font-medium", activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => onChangeTab(tab)}>{tab}</button>)}
      </nav>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_250px]">
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:border-r">
          <div className="mb-5 flex items-start justify-between gap-3 border-b pb-4">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase text-secondary">Topic {topicIndex + 1} of {stage.topics.length}</p><h2 className="mt-1 text-xl font-bold sm:text-2xl">{topic.title}</h2></div>
            <Badge className="shrink-0" variant="outline">{stage.title}</Badge>
          </div>
          <StudyGuideReader guideTitle={guide.title} topic={topic} view={activeTab} onAction={onAction} />
          <TopicNavigation topics={stage.topics.map((item) => item.title)} topicIndex={topicIndex} onSelect={selectTopic} />
        </main>
        <aside className="border-t px-4 py-5 lg:border-t-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Chapter outline</p>
          <ol className="mt-3 space-y-1">
            {stage.topics.map((item, index) => {
              const done = completedTopics.has(`${guide.id}::${item.id}`);
              return (
                <li key={item.id}>
                  <button className={cn("flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted", topicIndex === index && "bg-primary/10 font-semibold text-primary")} onClick={() => selectTopic(index)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" /> : null}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 grid gap-2">
            <Button
              variant={topicDone ? "secondary" : "default"}
              onClick={() => {
                onToggleComplete(guide.id, topic.id);
                onAction(topicDone ? `${topic.title} marked not started.` : `${topic.title} marked complete.`);
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {topicDone ? "Completed" : "Mark complete"}
            </Button>
            <Button variant="outline" onClick={() => onAction(`${topic.title} bookmarked.`)}><Bookmark className="h-4 w-4" />Bookmark</Button>
          </div>
        </aside>
      </div>
    </article>
  );
}

function GuideStatus({ title, description, loading = false, onBack }: { title: string; description: string; loading?: boolean; onBack?: () => void }) {
  return <section className="flex min-h-[360px] flex-col items-center justify-center bg-white px-5 text-center">{loading ? <LoaderCircle className="h-8 w-8 animate-spin text-primary" /> : null}<h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>{onBack ? <Button className="mt-4" variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" />Back to library</Button> : null}</section>;
}

function TopicNavigation({ topics, topicIndex, onSelect }: { topics: string[]; topicIndex: number; onSelect: (index: number) => void }) {
  return <div className="mt-7 flex items-center justify-between gap-3 border-t pt-4"><Button variant="outline" disabled={topicIndex === 0} onClick={() => onSelect(topicIndex - 1)}><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Previous topic</span></Button><p className="text-center text-xs text-muted-foreground">{topicIndex + 1} / {topics.length}</p><Button disabled={topicIndex === topics.length - 1} onClick={() => onSelect(topicIndex + 1)}><span className="hidden sm:inline">Next topic</span><ChevronRight className="h-4 w-4" /></Button></div>;
}

function topicsForStage(tech: string, stage: string) {
  const item = technologyMaterials[tech];
  if (stage === "Roadmap") return [...item.fundamentals.slice(0, 1), ...item.core.slice(0, 1), ...item.advanced.slice(0, 1), ...item.production.slice(0, 1)];
  if (stage === "Fundamentals") return item.fundamentals;
  if (stage === "Core") return item.core;
  if (stage === "Intermediate") return item.intermediate;
  if (stage === "Advanced") return item.advanced;
  if (stage === "Production") return item.production;
  if (stage === "Interview") return item.interview;
  if (stage === "Coding") return item.coding;
  if (stage === "Projects") return item.projects;
  if (stage === "Revision") return item.revision;
  return ["Timed concept round", "Technical explanation round", "Coding or case-study round", "Feedback and targeted retry"];
}
