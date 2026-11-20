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
type StudyLocation = { guideId: string; stage: string; topicId?: string; title: string };
type SavedStudy = { completed: string[]; bookmarks: StudyLocation[]; recent?: StudyLocation };

const flow = ["Fundamentals", "Core", "Intermediate", "Advanced", "Production", "Interview", "Coding", "Projects", "Revision"];
const tabs: ChapterTab[] = ["Learn", "Examples", "Visualize", "Code", "Practice", "Interview", "Revision", "Notes"];

function readSavedStudy(key: string): SavedStudy {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    const isLocation = (value: unknown): value is StudyLocation => {
      if (!value || typeof value !== 'object') return false;
      const item = value as Partial<StudyLocation>;
      return typeof item.guideId === 'string' && typeof item.stage === 'string' && typeof item.title === 'string' && (item.topicId === undefined || typeof item.topicId === 'string');
    };
    return {
      completed: Array.isArray(saved.completed) ? saved.completed.filter((item: unknown) => typeof item === 'string') : [],
      bookmarks: Array.isArray(saved.bookmarks) ? saved.bookmarks.filter(isLocation) : [],
      recent: isLocation(saved.recent) ? saved.recent : undefined,
    };
  } catch {
    return { completed: [], bookmarks: [] };
  }
}

export function StudyMaterialsSection({ onAction, studentId }: { onAction: (message: string) => void; studentId: string }) {
  const storageKey = `placement-decode.study.${studentId}`;
  const [saved, setSaved] = useState(() => readSavedStudy(storageKey));
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MaterialCategory | "All">("All");
  const [selectedTech, setSelectedTech] = useState(() => studyGuideManifest.find(item => item.id === saved.recent?.guideId)?.title || "Java");
  const [activeStage, setActiveStage] = useState("Fundamentals");
  const [startingTopic, setStartingTopic] = useState<string>();
  const [activeTab, setActiveTab] = useState<ChapterTab>("Learn");
  const [chapterOpen, setChapterOpen] = useState(false);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(true);
  const [guideError, setGuideError] = useState<string | null>(null);
  const completedTopics = useMemo(() => new Set(saved.completed), [saved.completed]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      setStorageUnavailable(true);
    }
  }, [saved, storageKey]);

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
  const guideSaved = saved.bookmarks.some(item => item.guideId === currentGuideId && !item.topicId);
  const recent = saved.recent;

  function toggleTopicComplete(guideId: string, topicId: string) {
    const key = `${guideId}::${topicId}`;
    setSaved(previous => ({ ...previous, completed: previous.completed.includes(key) ? previous.completed.filter(item => item !== key) : [...previous.completed, key] }));
  }

  function toggleBookmark(location: StudyLocation) {
    const matches = (item: StudyLocation) => item.guideId === location.guideId && item.topicId === location.topicId;
    setSaved(previous => ({ ...previous, bookmarks: previous.bookmarks.some(matches) ? previous.bookmarks.filter(item => !matches(item)) : [...previous.bookmarks, location] }));
  }

  function openSaved(location: StudyLocation) {
    const subject = studyGuideManifest.find(item => item.id === location.guideId);
    if (!subject) return;
    setSelectedTech(subject.title);
    openStage(location.stage, 'Learn', location.topicId, location.guideId);
  }

  if (chapterOpen) {
    if (guideLoading || (guide && guide.id !== currentGuideId && !guideError)) return <PageSkeleton label={`Loading ${selectedTech} study guide`} />;
    if (guideError || !guide) return <GuideStatus title="Guide unavailable" description={guideError ?? `The ${selectedTech} guide could not be loaded.`} onBack={() => setChapterOpen(false)} />;
    return (
      <ChapterPage
        key={`${guide.id}:${activeStage}:${startingTopic || ''}`}
        activeTab={activeTab}
        guide={guide}
        activeStage={activeStage}
        startingTopic={startingTopic}
        completedTopics={completedTopics}
        bookmarkIds={new Set(saved.bookmarks.filter(item => item.guideId === guide.id).map(item => item.topicId))}
        onToggleBookmark={toggleBookmark}
        onVisit={location => setSaved(previous => ({ ...previous, recent: location }))}
        onToggleComplete={toggleTopicComplete}
        onAction={onAction}
        onBack={() => setChapterOpen(false)}
        onChangeTab={setActiveTab}
      />
    );
  }

  function openStage(stage: string, tab: ChapterTab = "Learn", topicId?: string, guideId = currentGuideId) {
    setActiveStage(stage);
    setStartingTopic(topicId);
    setActiveTab(tab);
    setChapterOpen(true);
    if (guideId) setSaved(previous => ({ ...previous, recent: { guideId, stage, topicId, title: selectedTech } }));
  }

  return (
    <section className="min-w-0 space-y-4">
      <header className="flex flex-col gap-4 border-b bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Study library</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Complete, interview-oriented curricula from first principles to production for {studyGuideManifest.length} subjects.
          </p>
        </div>
        <div className="flex gap-2">
          {recent && <Button onClick={() => openSaved(recent)}><Play className="h-4 w-4" /> Continue studying</Button>}
        </div>
      </header>

      {storageUnavailable && <p role="status" className="text-sm text-muted-foreground">This browser couldn’t save your study progress.</p>}
      {saved.bookmarks.length > 0 && <section aria-labelledby="saved-study-heading" className="rounded-lg border bg-white p-4 sm:p-5">
        <h2 id="saved-study-heading" className="font-semibold">Saved for later</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {saved.bookmarks.map(item => <Button key={`${item.guideId}:${item.topicId || ''}`} variant="outline" size="sm" className="h-auto max-w-full whitespace-normal text-left" onClick={() => openSaved(item)}><Bookmark aria-hidden="true" className="h-4 w-4 shrink-0" />{item.title}</Button>)}
        </div>
      </section>}

      <section className="border-y bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" aria-label="Search subjects" placeholder="Search subjects" value={query} onChange={(event) => setQuery(event.target.value)} />
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
          {!filteredGuides.length && <p className="text-sm text-muted-foreground">No subjects match your search.</p>}
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
            {currentGuideId && <Button className="mt-3" size="sm" variant="outline" aria-pressed={guideSaved} onClick={() => toggleBookmark({ guideId: currentGuideId, stage: 'Fundamentals', title: selectedTech })}><Bookmark aria-hidden="true" className="h-4 w-4" />{guideSaved ? 'Guide saved' : 'Save guide'}</Button>}
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
            const topics = (guide?.id === currentGuideId ? guide?.stages.find((item) => item.title === stage) : undefined)?.topics.map((topic) => topic.title) ?? topicsForStage(selectedTech, stage);
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
          description="Review the subject’s core concepts and interview questions."
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

function ChapterPage({ activeTab, guide, activeStage, startingTopic, completedTopics, bookmarkIds, onToggleBookmark, onVisit, onToggleComplete, onAction, onBack, onChangeTab }: {
  activeTab: ChapterTab;
  guide: StudyGuide;
  activeStage: string;
  startingTopic?: string;
  completedTopics: Set<string>;
  bookmarkIds: Set<string | undefined>;
  onToggleBookmark: (location: StudyLocation) => void;
  onVisit: (location: StudyLocation) => void;
  onToggleComplete: (guideId: string, topicId: string) => void;
  onAction: (message: string) => void;
  onBack: () => void;
  onChangeTab: (tab: ChapterTab) => void;
}) {
  const stage = guide.stages.find((item) => item.title === activeStage) ?? guide.stages[0];
  const [topicIndex, setTopicIndex] = useState(() => Math.max(0, stage.topics.findIndex(item => item.id === startingTopic)));
  const topic = stage.topics[topicIndex] ?? stage.topics[0];
  const topicDone = completedTopics.has(`${guide.id}::${topic.id}`);
  const topicSaved = bookmarkIds.has(topic.id);

  function selectTopic(index: number) {
    setTopicIndex(index);
    onVisit({ guideId: guide.id, stage: stage.title, topicId: stage.topics[index].id, title: stage.topics[index].title });
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
            <Button variant="outline" aria-pressed={topicSaved} onClick={() => onToggleBookmark({ guideId: guide.id, stage: stage.title, topicId: topic.id, title: topic.title })}><Bookmark aria-hidden="true" className="h-4 w-4" />{topicSaved ? 'Topic saved' : 'Save topic'}</Button>
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
