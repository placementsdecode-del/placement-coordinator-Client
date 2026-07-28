import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Atom,
  Binary,
  Blocks,
  BrainCircuit,
  Braces,
  Check,
  ChevronRight,
  Cloud,
  Code2,
  Container,
  Cpu,
  Database,
  FileCode2,
  Flag,
  FlaskConical,
  FolderKanban,
  Gauge,
  GitBranch,
  Layers,
  LayoutTemplate,
  Lightbulb,
  ListOrdered,
  MessageSquareText,
  Milestone,
  Network,
  Rocket,
  Route,
  Server,
  ShieldCheck,
  Sigma,
  Smartphone,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RoadmapNode } from "./career-roadmaps-data";

export type PathStatus = "Not started" | "In progress" | "Completed";
export type PathView = "Track" | "Steps";

export type PathItem = {
  node: RoadmapNode;
  status: PathStatus;
  concepts: string[];
};

/** First matching keyword wins, so put the more specific labels first. */
const MILESTONE_ICONS: [RegExp, typeof Code2][] = [
  [/interview/i, MessageSquareText],
  [/\bgit\b|version control|branching/i, GitBranch],
  [/linux|shell|scripting|command/i, Terminal],
  [/container|docker|kubernetes/i, Container],
  [/cloud/i, Cloud],
  [/infrastructure|iac|terraform/i, FileCode2],
  [/ci\/cd|deployment|production|release/i, Rocket],
  [/observability|monitoring|incident|logging|tracing/i, Activity],
  [/reliability|performance|capacity|\bslo\b/i, Gauge],
  [/security|cryptography|identity|authentication|threat|detection/i, ShieldCheck],
  [/network/i, Network],
  [/database|sql|warehouse|lake|storage/i, Database],
  [/backend|api|http|service|serving/i, Server],
  [/system design|architecture|scale/i, Blocks],
  [/data structure/i, Binary],
  [/algorithm/i, Sigma],
  [/math|probability|statistic/i, Sigma],
  [/machine learning|deep learning|neural|model|experimentation|mlops/i, BrainCircuit],
  [/\bai\b|llm|prompt|agent|embedding|rag|retrieval/i, Sparkles],
  [/etl|pipeline|streaming|orchestration|processing|data quality|data modeling/i, Workflow],
  [/react|framework|component/i, Atom],
  [/javascript|typescript|language|syntax/i, Braces],
  [/web|html|css|responsive|accessibility|\bui\b/i, LayoutTemplate],
  [/mobile|android|device/i, Smartphone],
  [/concurrency|thread|jvm|async|background/i, Cpu],
  [/test|quality|qa|automation|revision/i, FlaskConical],
  [/cach|queue|messaging|state|lifecycle/i, Layers],
  [/object|\boop\b|design pattern|programming|python|java|code/i, Code2],
  [/portfolio|project/i, FolderKanban],
  [/product|growth|thinking/i, Lightbulb],
];

function milestoneIcon(label: string) {
  return MILESTONE_ICONS.find(([pattern]) => pattern.test(label))?.[1] ?? Milestone;
}

/** Serpentine geometry in SVG user units. Checkpoints alternate between the two lanes. */
const LANE_LEFT = 26;
const LANE_RIGHT = 74;
const FIRST_Y = 15;
const STEP_Y = 16;
/** Runway between a flag and the nearest checkpoint — long enough for the marker to rest between them. */
const FLAG_GAP = 12;
const FLAG_HANDLE = FLAG_GAP / 2;
const UNIT_PX = 8.2;

function laneOf(index: number) {
  return index % 2 === 0 ? LANE_LEFT : LANE_RIGHT;
}

function yOf(index: number) {
  return FIRST_Y + STEP_Y * index;
}

function geometry(count: number) {
  const lastY = yOf(count - 1);
  const startY = FIRST_Y - FLAG_GAP;
  const finishY = lastY + FLAG_GAP;
  const finishX = laneOf(count - 1) === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
  const viewHeight = finishY + 5;

  let d = `M ${laneOf(0)} ${startY} C ${laneOf(0)} ${startY + FLAG_HANDLE}, ${laneOf(0)} ${FIRST_Y - FLAG_HANDLE}, ${laneOf(0)} ${FIRST_Y}`;
  for (let index = 1; index < count; index += 1) {
    d += ` C ${laneOf(index - 1)} ${yOf(index - 1) + 8}, ${laneOf(index)} ${yOf(index) - 8}, ${laneOf(index)} ${yOf(index)}`;
  }
  d += ` C ${laneOf(count - 1)} ${finishY - FLAG_HANDLE}, ${finishX} ${finishY - FLAG_HANDLE}, ${finishX} ${finishY}`;

  return { d, startY, finishY, finishX, viewHeight };
}

/** An emoji, or an image URL/data URI to use instead. */
export type RoadmapAvatar = string;

export const DEFAULT_AVATAR = "🎓";
const AVATAR_PRESETS = ["🎓", "🏃", "🚀", "🧗", "📚", "⚡", "🛵", "🦉"];
const CELEBRATION_EMOJIS = ["🎉", "✨", "🎊", "⭐", "🥳", "💥"];

function isImageAvatar(avatar: RoadmapAvatar) {
  return /^(https?:\/\/|data:|\/)/.test(avatar);
}

export function RoadmapAvatarPicker({ avatar, onChange }: { avatar: RoadmapAvatar; onChange: (avatar: RoadmapAvatar) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Change progress marker"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-md border px-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
          <AvatarMark avatar={avatar} className="text-base leading-none" />
        </span>
        Marker
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-60 rounded-lg border bg-white p-3 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Progress marker</p>
          <div className="mt-2 grid grid-cols-8 gap-1">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={cn(
                  "flex h-7 items-center justify-center rounded border text-base hover:bg-muted",
                  avatar === preset && "border-primary bg-primary/10",
                )}
                onClick={() => onChange(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          <Input
            className="mt-2 h-8 text-sm"
            aria-label="Custom emoji or image URL"
            placeholder="Emoji or image URL"
            value={avatar}
            onChange={(event) => onChange(event.target.value || DEFAULT_AVATAR)}
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">Paste any emoji, or an image URL to use a picture.</p>
        </div>
      ) : null}
    </div>
  );
}

function AvatarMark({ avatar, className }: { avatar: RoadmapAvatar; className?: string }) {
  if (isImageAvatar(avatar)) {
    return <img src={avatar} alt="" className={cn("h-full w-full rounded-full object-cover", className)} />;
  }
  return <span className={className}>{avatar}</span>;
}

/** Control points of the road segment leading into `to`; -1 means the START flag. */
function segmentOf(from: number, to: number) {
  const fromX = laneOf(Math.max(from, 0));
  const toX = laneOf(to);
  const fromY = from < 0 ? FIRST_Y - FLAG_GAP : yOf(from);
  const toY = yOf(to);
  const handle = from < 0 ? FLAG_HANDLE : 8;
  return {
    p0: [fromX, fromY],
    c1: [fromX, fromY + handle],
    c2: [toX, toY - handle],
    p3: [toX, toY],
  } as const;
}

function cubicAt(segment: ReturnType<typeof segmentOf>, t: number) {
  const inverse = 1 - t;
  const a = inverse * inverse * inverse;
  const b = 3 * inverse * inverse * t;
  const c = 3 * inverse * t * t;
  const d = t * t * t;
  return [
    a * segment.p0[0] + b * segment.c1[0] + c * segment.c2[0] + d * segment.p3[0],
    a * segment.p0[1] + b * segment.c1[1] + c * segment.c2[1] + d * segment.p3[1],
  ] as const;
}

/** How far short of / past a checkpoint the marker settles, so it never sits on top of a card. */
const REST_UNITS = 7;

/** The road leaving checkpoint `index` — the run to the next one, or the final curve to FINISH. */
function outgoingSegment(index: number, count: number) {
  if (index < count - 1) return segmentOf(index, index + 1);
  const fromX = laneOf(index);
  const toX = fromX === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
  const finishY = yOf(index) + FLAG_GAP;
  return {
    p0: [fromX, yOf(index)],
    c1: [fromX, finishY - FLAG_HANDLE],
    c2: [toX, finishY - FLAG_HANDLE],
    p3: [toX, finishY],
  } as const;
}

/** Bisect for the point on `segment` at height `targetY` — y rises monotonically along it. */
function tAtHeight(segment: ReturnType<typeof segmentOf>, targetY: number) {
  let low = 0;
  let high = 1;
  for (let step = 0; step < 22; step += 1) {
    const mid = (low + high) / 2;
    if (cubicAt(segment, mid)[1] < targetY) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** Resting spot for a marker that has cleared `index` (-1 = nothing cleared yet). */
function restT(index: number, count: number) {
  if (index < 0) return tAtHeight(segmentOf(-1, 0), yOf(0) - REST_UNITS);
  return tAtHeight(outgoingSegment(index, count), yOf(index) + REST_UNITS);
}

function restSegment(index: number, count: number) {
  return index < 0 ? segmentOf(-1, 0) : outgoingSegment(index, count);
}

function positionAt(index: number, count: number) {
  return cubicAt(restSegment(index, count), restT(index, count));
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function badgeVariant(status: PathStatus) {
  return status === "Completed" ? "secondary" : status === "In progress" ? "warning" : "outline";
}

function MilestoneLogo({ label, status, className }: { label: string; status: PathStatus; className?: string }) {
  const Icon = milestoneIcon(label);
  return (
    <span className="relative shrink-0">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border bg-muted text-muted-foreground",
          status === "Completed" && "border-secondary bg-secondary/15 text-secondary",
          status === "In progress" && "roadmap-pulse border-primary bg-primary/10 text-primary",
          className,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      {status === "Completed" ? (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary text-white ring-2 ring-white">
          <Check className="h-2 w-2" />
        </span>
      ) : null}
    </span>
  );
}

export function RoadmapViewToggle({ view, onChange }: { view: PathView; onChange: (view: PathView) => void }) {
  return (
    <div role="group" aria-label="Roadmap view" className="flex gap-1">
      {([
        ["Track", Route],
        ["Steps", ListOrdered],
      ] as [PathView, typeof Route][]).map(([item, Icon]) => (
        <button
          key={item}
          type="button"
          aria-pressed={view === item}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
            view === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
          onClick={() => onChange(item)}
        >
          <Icon className="h-4 w-4" />
          {item}
        </button>
      ))}
    </div>
  );
}

export function RoadmapRaceTrack({
  items,
  onOpen,
  avatar = DEFAULT_AVATAR,
  markerAt,
  onMarkerArrive,
}: {
  items: PathItem[];
  onOpen: (node: RoadmapNode) => void;
  avatar?: RoadmapAvatar;
  /** Checkpoint the marker currently rests on (-1 = the start line). Owned by the parent so it
   *  survives the trip into a milestone page, which unmounts this component. */
  markerAt: number;
  onMarkerArrive: (index: number) => void;
}) {
  const { d, startY, finishY, finishX, viewHeight } = geometry(items.length);
  /** The SVG is stretched to the box, so x maps straight to a percentage and y is scaled by the view height. */
  const xPercent = (value: number) => `${value}%`;
  const yPercent = (value: number) => `${(value / viewHeight) * 100}%`;
  const [open, setOpen] = useState<number | null>(null);

  /** The marker belongs on the last cleared checkpoint; -1 parks it just past the START flag. */
  const clearedIndex = items.reduce((last, item, index) => (item.status === "Completed" ? index : last), -1);
  const [marker, setMarker] = useState<readonly [number, number]>(() => positionAt(markerAt, items.length));
  const [celebrating, setCelebrating] = useState<number | null>(null);
  const arrive = useRef(onMarkerArrive);
  arrive.current = onMarkerArrive;
  const checkpointRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (open === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const from = markerAt;
    const count = items.length;
    if (clearedIndex === from) {
      setMarker(positionAt(from, count));
      return;
    }
    if (clearedIndex < from) {
      setMarker(positionAt(clearedIndex, count));
      arrive.current(clearedIndex);
      return;
    }

    /** Walk the road one checkpoint at a time so the marker never cuts across a bend, then coast
     *  a little past the checkpoint it just cleared so it does not sit on that card. */
    const segments: ReturnType<typeof segmentOf>[] = [restSegment(from, count)];
    for (let index = Math.max(from, 0) + (from < 0 ? 0 : 1); index <= clearedIndex; index += 1) {
      segments.push(outgoingSegment(index, count));
    }
    const startProgress = restT(from, count);
    const endProgress = segments.length - 1 + restT(clearedIndex, count);
    const span = endProgress - startProgress;
    const duration = 650 + 350 * Math.ceil(span);
    let frame = 0;
    let start = 0;

    function step(now: number) {
      if (!start) start = now;
      const elapsed = Math.min((now - start) / duration, 1);
      const progress = startProgress + easeInOut(elapsed) * span;
      const segmentIndex = Math.min(Math.floor(progress), segments.length - 1);
      setMarker(cubicAt(segments[segmentIndex], progress - segmentIndex));
      if (elapsed < 1) {
        frame = requestAnimationFrame(step);
        return;
      }
      setCelebrating(clearedIndex);
      arrive.current(clearedIndex);
    }

    /** Hold the run until the student is actually looking at it — a tab in the background or a
     *  checkpoint scrolled off screen would mean the whole thing plays to nobody. */
    let cancelled = false;
    let settle = 0;

    function begin() {
      if (cancelled) return;
      const target = checkpointRefs.current[clearedIndex];
      const box = target?.getBoundingClientRect();
      const offScreen = !box || box.top < 80 || box.bottom > window.innerHeight - 40;
      if (offScreen) target?.scrollIntoView({ behavior: "smooth", block: "center" });
      settle = window.setTimeout(() => {
        if (!cancelled) frame = requestAnimationFrame(step);
      }, offScreen ? 550 : 180);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") begin();
    }

    if (document.visibilityState === "visible") begin();
    else document.addEventListener("visibilitychange", onVisibilityChange, { once: true });

    return () => {
      cancelled = true;
      clearTimeout(settle);
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [clearedIndex, markerAt, items.length]);

  useEffect(() => {
    if (celebrating === null) return;
    const timer = setTimeout(() => setCelebrating(null), 1600);
    return () => clearTimeout(timer);
  }, [celebrating]);

  return (
    <div className="overflow-x-auto px-4 py-6 sm:px-5" onMouseLeave={() => setOpen(null)}>
      <div className="relative mx-auto min-w-[560px] max-w-3xl" style={{ height: Math.round(viewHeight * UNIT_PX) }}>
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 100 ${viewHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={d}
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-muted"
            strokeWidth={38}
            strokeLinecap="round"
          />
          <path
            d={d}
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-primary/40"
            strokeWidth={2}
            strokeDasharray="10 12"
          />
        </svg>

        <TrackFlag label="Start" left={xPercent(laneOf(0))} top={yPercent(startY)} />

        {items.map((item, index) => {
          const isOpen = open === index;
          const openUpwards = index === items.length - 1;
          return (
            <div
              key={item.node.label}
              ref={(element) => { checkpointRefs.current[index] = element; }}
              className={cn("absolute -translate-x-1/2 -translate-y-1/2", isOpen ? "z-20" : "z-10")}
              style={{ left: xPercent(laneOf(index)), top: yPercent(yOf(index)) }}
              onMouseEnter={() => setOpen(index)}
              onMouseLeave={() => setOpen((current) => (current === index ? null : current))}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                className={cn(
                  "flex w-[216px] items-center gap-2.5 rounded-lg border bg-white p-2.5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg",
                  item.status === "In progress" && "border-primary bg-primary/5",
                  isOpen && "-translate-y-0.5 border-primary shadow-lg",
                )}
                onFocus={() => setOpen(index)}
                onClick={() => onOpen(item.node)}
              >
                <MilestoneLogo label={item.node.label} status={item.status} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-secondary">
                    Checkpoint {index + 1}
                  </span>
                  <span className="truncate text-[13px] font-semibold leading-tight">{item.node.label}</span>
                  <span className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-muted-foreground">{item.node.summary}</span>
                  <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.concepts.length} steps · {item.status}
                  </span>
                </span>
              </button>

              {isOpen ? (
                /* The padding is a hover bridge, so the pointer never leaves the group on its way to the popup. */
                <div className={cn("absolute left-1/2 w-60 -translate-x-1/2", openUpwards ? "bottom-full pb-2" : "top-full pt-2")}>
                  <div
                    role="dialog"
                    aria-label={item.node.label}
                    className={cn(
                      "rounded-lg border bg-white p-3.5 shadow-lg",
                      "duration-200 ease-out animate-in fade-in-0 zoom-in-95",
                      openUpwards ? "origin-bottom slide-in-from-bottom-1" : "origin-top slide-in-from-top-1",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary">
                        {item.concepts.length} steps
                      </span>
                      <Badge variant={badgeVariant(item.status)}>{item.status}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold leading-tight">{item.node.label}</p>
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {item.concepts.map((concept) => (
                        <li key={concept} className="rounded border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {concept}
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" className="mt-3 w-full" onClick={() => onOpen(item.node)}>
                      {item.status === "Not started" ? "Start milestone" : "Open milestone"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        <span
          aria-hidden="true"
          className="absolute z-30 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-white text-base shadow-soft"
          style={{ left: xPercent(marker[0]), top: yPercent(marker[1]) }}
        >
          <AvatarMark avatar={avatar} className="leading-none" />
        </span>

        {celebrating !== null ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
            style={{ left: xPercent(laneOf(celebrating)), top: yPercent(yOf(celebrating)) }}
          >
            {CELEBRATION_EMOJIS.map((emoji, index) => (
              <span
                key={emoji}
                className="roadmap-burst absolute text-lg"
                style={{
                  ["--burst-x" as string]: `${Math.round(Math.cos((index / CELEBRATION_EMOJIS.length) * Math.PI * 2) * 62)}px`,
                  ["--burst-y" as string]: `${Math.round(Math.sin((index / CELEBRATION_EMOJIS.length) * Math.PI * 2) * 62) - 18}px`,
                  animationDelay: `${index * 60}ms`,
                }}
              >
                {emoji}
              </span>
            ))}
            <span className="roadmap-cheer absolute left-1/2 whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
              Checkpoint {celebrating + 1} cleared
            </span>
          </span>
        ) : null}

        <TrackFlag label="Finish" finish left={xPercent(finishX)} top={yPercent(finishY)} />
      </div>
    </div>
  );
}

function TrackFlag({ label, left, top, finish }: { label: string; left: string; top: string; finish?: boolean }) {
  return (
    <span className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
      <Badge variant={finish ? "secondary" : "outline"} className={cn("gap-1 uppercase tracking-wide", !finish && "border bg-white")}>
        {finish ? <Flag className="h-3.5 w-3.5" /> : null}
        {label}
      </Badge>
    </span>
  );
}

export function RoadmapStepList({ items, onOpen }: { items: PathItem[]; onOpen: (node: RoadmapNode) => void }) {
  return (
    <ol>
      {items.map((item, index) => (
        <li key={item.node.label} className="border-b last:border-b-0">
          <button
            type="button"
            className={cn(
              "grid w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/60 sm:px-5 md:grid-cols-[48px_200px_minmax(0,1fr)_110px_80px] md:items-center",
              item.status === "In progress" && "bg-primary/5",
            )}
            onClick={() => onOpen(item.node)}
          >
            <MilestoneLogo label={item.node.label} status={item.status} />
            <span className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
                Checkpoint {index + 1}
              </span>
              <span className="font-semibold">{item.node.label}</span>
            </span>
            <span className="line-clamp-2 text-sm text-muted-foreground">{item.node.summary}</span>
            <Badge variant={badgeVariant(item.status)}>{item.status}</Badge>
            <span className="text-sm text-muted-foreground md:text-right">{item.concepts.length} steps</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
