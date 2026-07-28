import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronRight,
  Circle,
  Code2,
  FileQuestion,
  FolderKanban,
  MessageSquareText,
  Play,
  Search,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { conceptsOf, roadmapFamilies, roadmapTracks, type RoadmapNode, type RoadmapTrack } from "./career-roadmaps-data";
import {
  DEFAULT_AVATAR,
  RoadmapAvatarPicker,
  RoadmapRaceTrack,
  RoadmapStepList,
  RoadmapViewToggle,
  type PathItem,
  type PathView,
  type RoadmapAvatar,
} from "./roadmap-path";

type DetailTab = "Learn" | "Practice" | "Interview" | "Project" | "Revision";
type TrackTab = "Overview" | "Projects" | "Interview" | "Companies";
type NodeStatus = "Not started" | "In progress" | "Completed";

function nodeKey(trackId: string, label: string) {
  return `${trackId}::${label}`;
}

export function CareerRoadmapsSection({ onAction }: { onAction: (message: string) => void }) {
  const [selectedId, setSelectedId] = useState("software");
  const [family, setFamily] = useState<(typeof roadmapFamilies)[number]>("All");
  const [query, setQuery] = useState("");
  const [trackTab, setTrackTab] = useState<TrackTab>("Overview");
  const [pathView, setPathView] = useState<PathView>("Track");
  const [avatar, setAvatar] = useState<RoadmapAvatar>(DEFAULT_AVATAR);
  /** Kept out of the track component, which unmounts whenever a milestone page opens. */
  const [markerByTrack, setMarkerByTrack] = useState<Record<string, number>>({});
  const [detailNode, setDetailNode] = useState<RoadmapNode | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState<Set<string>>(new Set());
  const selected = roadmapTracks.find((item) => item.id === selectedId) ?? roadmapTracks[0];
  const filtered = useMemo(() => roadmapTracks.filter((item) => {
    return (family === "All" || item.family === family) && item.title.toLowerCase().includes(query.toLowerCase());
  }), [family, query]);

  function statusOf(node: RoadmapNode): NodeStatus {
    const key = nodeKey(selected.id, node.label);
    if (completed.has(key)) return "Completed";
    if (started.has(key)) return "In progress";
    return "Not started";
  }

  function openNode(node: RoadmapNode) {
    const key = nodeKey(selected.id, node.label);
    setStarted((prev) => {
      if (prev.has(key) || completed.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setDetailNode(node);
  }

  function completeNode(node: RoadmapNode) {
    const key = nodeKey(selected.id, node.label);
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setStarted((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    onAction(`${node.label} marked complete.`);
  }

  if (detailNode) {
    return (
      <RoadmapNodePage
        track={selected}
        node={detailNode}
        status={statusOf(detailNode)}
        onAction={onAction}
        onComplete={() => completeNode(detailNode)}
        onBack={() => setDetailNode(null)}
      />
    );
  }

  const completedCount = selected.nodes.filter((node) => completed.has(nodeKey(selected.id, node.label))).length;
  const nextNode = selected.nodes.find((node) => statusOf(node) !== "Completed") ?? selected.nodes[0];
  const pathItems: PathItem[] = selected.nodes.map((node) => ({ node, status: statusOf(node), concepts: conceptsOf(node) }));

  return (
    <section className="min-w-0 space-y-4">
      <header className="flex flex-col gap-4 border-b bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-secondary">Career roadmaps</p>
          <h1 className="mt-1 text-2xl font-bold">Skills connected to real roles</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Choose a target role, follow its ordered path, build evidence and prepare for the complete interview loop.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4 text-primary" /> {roadmapTracks.length} complete career paths
        </div>
      </header>

      <section className="border-y bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search career path" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {roadmapFamilies.map((item) => (
              <button key={item} className={cn("h-9 shrink-0 rounded-md px-3 text-sm font-medium", family === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => setFamily(item)}>{item}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <button
              key={item.id}
              className={cn("min-w-0 bg-white px-3 py-2.5 text-left transition-colors hover:bg-muted", selected.id === item.id && "bg-primary/10 text-primary ring-1 ring-inset ring-primary")}
              onClick={() => { setSelectedId(item.id); setTrackTab("Overview"); }}
            >
              <span className="block truncate text-sm font-semibold">{item.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.family}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-5 sm:px-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{selected.family}</Badge><span className="text-xs text-muted-foreground">{selected.nodes.length} milestones</span></div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{selected.title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{selected.promise}</p>
            <div className="mt-3 flex flex-wrap gap-2">{selected.roles.map((role) => <Badge key={role} variant="outline"><BriefcaseBusiness className="h-3.5 w-3.5" />{role}</Badge>)}</div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-3 divide-x rounded-md border text-center">
              <Meta label="Time" value={selected.estimatedTime} />
              <Meta label="Level" value={selected.difficulty} />
              <Meta label="Typical range" value={selected.packageRange} />
            </div>
            <Button onClick={() => openNode(nextNode)}><Play className="h-4 w-4" /> {completedCount > 0 ? "Continue" : "Start"}</Button>
          </div>
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3 className="font-semibold">Learning path</h3>
            <p className="text-sm text-muted-foreground">Follow the track checkpoint by checkpoint, or switch to the step list.</p>
            <div className="mt-2 flex items-center gap-2">
              <Progress className="h-2 w-40" value={(completedCount / selected.nodes.length) * 100} />
              <span className="text-xs text-muted-foreground">{completedCount} of {selected.nodes.length} complete</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pathView === "Track" ? <RoadmapAvatarPicker avatar={avatar} onChange={setAvatar} /> : null}
            <RoadmapViewToggle view={pathView} onChange={setPathView} />
          </div>
        </div>
        {pathView === "Track"
          ? (
            <RoadmapRaceTrack
              items={pathItems}
              onOpen={openNode}
              avatar={avatar}
              markerAt={markerByTrack[selected.id] ?? -1}
              onMarkerArrive={(index) => setMarkerByTrack((prev) => ({ ...prev, [selected.id]: index }))}
            />
          )
          : <RoadmapStepList items={pathItems} onOpen={openNode} />}
      </section>

      <section className="border-y bg-white">
        <div className="flex gap-1 overflow-x-auto border-b px-4 py-2 sm:px-5">
          {(["Overview", "Projects", "Interview", "Companies"] as TrackTab[]).map((tab) => (
            <button key={tab} className={cn("h-9 shrink-0 rounded-md px-3 text-sm font-medium", trackTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => setTrackTab(tab)}>{tab}</button>
          ))}
        </div>
        <TrackPanel tab={trackTab} track={selected} onAction={onAction} />
      </section>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="min-w-[100px] px-3 py-2"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-semibold">{value}</p></div>;
}

function TrackPanel({ tab, track, onAction }: { tab: TrackTab; track: RoadmapTrack; onAction: (message: string) => void }) {
  if (tab === "Projects") return (
    <div className="divide-y">{track.projects.map((project, index) => <div key={project} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[40px_minmax(0,1fr)_120px] md:items-center"><span className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span><div><p className="font-semibold">{project}</p><p className="mt-1 text-sm text-muted-foreground">Build, test, document decisions and publish measurable evidence.</p></div><Button size="sm" variant="outline" onClick={() => onAction(`${project} project opened.`)}>View brief</Button></div>)}</div>
  );
  if (tab === "Interview") return (
    <div className="divide-y">{track.questions.map((question, index) => <div key={question} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex gap-3"><span className="text-sm font-semibold text-primary">Q{index + 1}</span><p className="text-sm font-medium">{question}</p></div><Button size="sm" variant="outline" onClick={() => onAction(`Interview answer opened: ${question}`)}>Prepare</Button></div>)}<div className="px-4 py-4 sm:px-5"><Button onClick={() => onAction(`${track.title} mock interview started.`)}><MessageSquareText className="h-4 w-4" />Start mock interview</Button></div></div>
  );
  if (tab === "Companies") return (
    <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">{track.companies.map((company) => <div key={company} className="bg-white p-4 sm:p-5"><Building2 className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">{company}</p><p className="mt-1 text-sm text-muted-foreground">Prepare coding, role fundamentals and project discussion.</p></div>)}</div>
  );
  return (
    <div className="grid gap-px bg-border md:grid-cols-3">
      <Summary icon={Target} title="Current focus" body={track.nodes[2]?.label ?? track.nodes[0].label} detail="Finish the concept, one exercise and one spoken explanation." />
      <Summary icon={FolderKanban} title="Portfolio evidence" body={`${track.projects.length} projects`} detail="Start small, then add one production-quality capstone." />
      <Summary icon={MessageSquareText} title="Interview readiness" body={`${track.questions.length} core prompts`} detail="Practise follow-ups, internals and tradeoff questions." />
    </div>
  );
}

function Summary({ icon: Icon, title, body, detail }: { icon: typeof Target; title: string; body: string; detail: string }) {
  return <div className="bg-white p-4 sm:p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">{title}</p><p className="mt-1 font-semibold">{body}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p></div>;
}

function RoadmapNodePage({ track, node, status, onAction, onComplete, onBack }: { track: RoadmapTrack; node: RoadmapNode; status: NodeStatus; onAction: (message: string) => void; onComplete: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<DetailTab>("Learn");
  const index = track.nodes.findIndex((item) => item.label === node.label);
  const previous = index > 0 ? track.nodes[index - 1] : null;
  const concepts = conceptsOf(node);

  return (
    <article className="min-w-0 bg-white">
      <header className="border-b px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Roadmap</Button><Badge variant="secondary">{track.title}</Badge><Badge variant="outline">Milestone {index + 1}</Badge><Badge variant={status === "Completed" ? "secondary" : status === "In progress" ? "warning" : "outline"}>{status}</Badge></div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{node.label}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{node.summary}. Learn the model, see it operate, practise it, and connect it to interview evidence.</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span><strong>4-6 hours</strong> estimated</span><span>Prerequisite: <strong>{previous?.label ?? "None"}</strong></span><span><strong>{concepts.length}</strong> concepts</span></div>
      </header>

      <nav className="sticky top-[61px] z-10 flex gap-1 overflow-x-auto border-b bg-white/95 px-4 py-2 backdrop-blur sm:px-6">
        {(["Learn", "Practice", "Interview", "Project", "Revision"] as DetailTab[]).map((item) => <button key={item} className={cn("h-9 shrink-0 rounded-md px-3 text-sm font-medium", tab === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => setTab(item)}>{item}</button>)}
      </nav>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_240px]">
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:border-r"><NodePanel tab={tab} track={track} node={node} concepts={concepts} onAction={onAction} /></main>
        <aside className="border-t px-4 py-5 lg:border-t-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Concept outline</p>
          <ol className="mt-3 space-y-1">{concepts.map((concept) => <li key={concept} className="flex gap-2 py-1.5 text-sm"><Circle className="mt-1 h-3 w-3 shrink-0 text-primary" />{concept}</li>)}</ol>
          <div className="mt-5 grid gap-2">
            {status === "Completed" ? (
              <Button variant="secondary" disabled><Check className="h-4 w-4" />Completed</Button>
            ) : (
              <Button onClick={onComplete}><Check className="h-4 w-4" />Mark complete</Button>
            )}
            <Button variant="outline" onClick={() => onAction(`${node.label} bookmarked.`)}><Bookmark className="h-4 w-4" />Bookmark</Button>
          </div>
        </aside>
      </div>
    </article>
  );
}

function NodePanel({ tab, track, node, concepts, onAction }: { tab: DetailTab; track: RoadmapTrack; node: RoadmapNode; concepts: string[]; onAction: (message: string) => void }) {
  if (tab === "Practice") return <DetailList icon={Code2} title="Practice plan" description="Move from recall to implementation." items={[`Explain ${node.label} without notes`, ...concepts.map((concept) => `Implement or demonstrate ${concept}`), `Debug one failing ${node.label} scenario`]} action="Open practice" onAction={onAction} />;
  if (tab === "Interview") return <DetailList icon={MessageSquareText} title="Interview drill" description="Answer, justify, then handle a follow-up." items={[`Why does ${node.label} matter for a ${track.title}?`, `Explain the internal flow of ${concepts[0] ?? node.label}.`, `What tradeoff or failure case should an engineer consider?`, ...track.questions.slice(0, 2)]} action="Start answer" onAction={onAction} />;
  if (tab === "Project") return <DetailList icon={FolderKanban} title="Apply it in a project" description="Convert the milestone into resume evidence." items={track.projects.map((project) => `${project}: apply ${node.label}, document one decision and test one failure case`)} action="Open brief" onAction={onAction} />;
  if (tab === "Revision") return <DetailList icon={Bookmark} title="Revision sheet" description="Short prompts for spaced recall." items={[`Define ${node.label} in two sentences`, ...concepts.map((concept) => `${concept}: purpose, operation and one tradeoff`), "Write the three mistakes you are most likely to repeat"]} action="Mark reviewed" onAction={onAction} />;
  return (
    <div>
      <div className="flex gap-3"><FileQuestion className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="text-xl font-bold">Learn from first principles</h2><p className="mt-1 text-sm text-muted-foreground">Understand why the milestone exists before memorising tools.</p></div></div>
      <div className="mt-5 divide-y border-y">
        {concepts.map((concept, conceptIndex) => <section key={concept} className="py-5"><div className="flex gap-3"><span className="text-xs font-semibold text-primary">{String(conceptIndex + 1).padStart(2, "0")}</span><div><p className="text-xs font-semibold uppercase text-secondary">Core concept</p><h3 className="mt-1 text-lg font-semibold">{concept}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">Learn what {concept.toLowerCase()} solves, how information or state moves through it, the constraints that shape its design, and the failure modes that matter in a real {track.title} role.</p><p className="mt-3 border-l-2 border-secondary pl-3 text-sm">Checkpoint: draw the flow, give one project example, and defend one tradeoff.</p></div></div></section>)}
      </div>
    </div>
  );
}

function DetailList({ icon: Icon, title, description, items, action, onAction }: { icon: typeof Code2; title: string; description: string; items: string[]; action: string; onAction: (message: string) => void }) {
  return <div><div className="flex gap-3"><Icon className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div><div className="mt-5 divide-y border-y">{items.map((item, index) => <div key={`${item}-${index}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span><p className="text-sm font-medium">{item}</p></div><Button size="sm" variant="outline" onClick={() => onAction(`${action}: ${item}`)}>{action}<ChevronRight className="h-4 w-4" /></Button></div>)}</div></div>;
}
