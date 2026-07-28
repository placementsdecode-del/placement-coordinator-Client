// Regenerates src/data/commit-history.ts from the git log.
// Run with: npm run generate:commits
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(here, "../src/data/commit-history.ts");
const LIMIT = 30;
const MAX_FILES = 12;
const MAX_PATCH_LINES = 200; // per file, to keep the bundle reasonable
const MAX_FILE_CHANGES = 600; // skip diffs for files bigger than this (added + removed)
// Generated / non-human-readable files: list them, but don't embed their diff.
const SKIP_DIFF = [/package-lock\.json$/, /\.svg$/, /\.(png|jpe?g|gif|ico|woff2?)$/, /guides\/.*\.json$/];
const REDACTIONS = [
  [/student@gmail\.com/g, "[removed-demo-email]"],
  [/admin@gmail\.com/g, "[removed-demo-email]"],
  [/superadmin@gmail\.com/g, "[removed-demo-email]"],
  [/123456/g, "[removed-demo-password]"],
];

// Map a commit message to a coarse product area so the changelog is scannable.
function areaFor(message) {
  const m = message.toLowerCase();
  if (/(landing|pitch|onboard|hero)/.test(m)) return "Landing / Onboarding";
  if (/(study|material|guide|devops|course)/.test(m)) return "Study Materials";
  if (/(roadmap|career)/.test(m)) return "Career Roadmaps";
  if (/(super ?admin|platform admin)/.test(m)) return "Super Admin";
  if (/(admin)/.test(m)) return "Admin";
  if (/(assessment|quiz|test)/.test(m)) return "Assessments";
  if (/(login|auth|sign)/.test(m)) return "Authentication";
  if (/(progress|dashboard|milestone)/.test(m)) return "Progress";
  return "Platform";
}

const esc = (value) => String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const num = (value) => (value === "-" || value === undefined ? 0 : Number(value) || 0);
const redact = (value) => REDACTIONS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), String(value));

// One record per commit: header line "@@<hash>|<author>|<date>|<subject>" then numstat lines.
// If git is unavailable (or has no history) in this environment, keep the committed
// data file as-is instead of failing the build.
let raw;
try {
  raw = execSync(
    `git log -n ${LIMIT} --numstat --date=short --pretty=format:"@@%h|%an|%ad|%s"`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
} catch {
  console.warn("[generate:commits] git log unavailable — keeping existing commit-history.ts");
  process.exit(0);
}
if (!raw.trim()) {
  console.warn("[generate:commits] no commits found — keeping existing commit-history.ts");
  process.exit(0);
}

const commits = [];
let current = null;
for (const line of raw.split("\n")) {
  if (line.startsWith("@@")) {
    const [hash, author, date, ...rest] = line.slice(2).split("|");
    const message = rest.join("|");
    current = { hash, author, date, message, area: areaFor(message), files: [], insertions: 0, deletions: 0 };
    commits.push(current);
  } else if (current && line.trim()) {
    const [added, removed, ...pathParts] = line.split("\t");
    const path = pathParts.join("\t");
    if (!path) continue;
    current.insertions += num(added);
    current.deletions += num(removed);
    current.files.push({ path, added: num(added), removed: num(removed) });
  }
}

// The unified diff for one file, trimmed to the hunks and capped at MAX_PATCH_LINES.
function patchFor(hash, path, changes) {
  if (changes > MAX_FILE_CHANGES || SKIP_DIFF.some((re) => re.test(path))) {
    return { patch: "", patchTruncated: false };
  }
  let out = "";
  try {
    out = execSync(`git show ${hash} --format= --unified=2 -- "${path}"`, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch {
    return { patch: "", patchTruncated: false };
  }
  const lines = out.split("\n");
  const start = lines.findIndex((line) => line.startsWith("@@"));
  const hunks = start >= 0 ? lines.slice(start) : lines;
  const truncated = hunks.length > MAX_PATCH_LINES;
  return { patch: redact(hunks.slice(0, MAX_PATCH_LINES).join("\n").trimEnd()), patchTruncated: truncated };
}

const rows = commits.map((c) => {
  let body = "";
  try {
    body = redact(execSync(`git show -s --format=%b ${c.hash}`, { encoding: "utf8" }).trim().replace(/\s+/g, " "));
  } catch {
    body = "";
  }
  const files = [...c.files]
    .sort((a, b) => b.added + b.removed - (a.added + a.removed))
    .slice(0, MAX_FILES)
    .map((f) => ({ ...f, ...patchFor(c.hash, f.path, f.added + f.removed) }));
  return { ...c, body, filesChanged: c.files.length, files };
});

const fileLine = (f) =>
  `        { path: ${JSON.stringify(f.path)}, added: ${f.added}, removed: ${f.removed}, patch: ${JSON.stringify(f.patch)}, patchTruncated: ${f.patchTruncated} },`;
const rowBlock = (r) => `  {
    hash: "${esc(redact(r.hash))}",
    author: "${esc(redact(r.author))}",
    date: "${esc(r.date)}",
    message: "${esc(redact(r.message))}",
    area: "${esc(r.area)}",
    body: "${esc(r.body)}",
    filesChanged: ${r.filesChanged},
    insertions: ${r.insertions},
    deletions: ${r.deletions},
    files: [
${r.files.map(fileLine).join("\n")}
    ],
  },`;

const file = `import type { CommitEntry } from "@/types/super-admin";

// Generated from \`git log\`. Refresh with: npm run generate:commits
// \`files\` is capped at the top ${MAX_FILES} changed files per commit; \`filesChanged\` is the true total.
export const commitHistory: CommitEntry[] = [
${rows.map(rowBlock).join("\n")}
];
`;

// Guard against shallow clones (e.g. some CI): never replace a richer committed
// history with fewer commits. Count entries in the existing file and bail if smaller.
try {
  const existing = readFileSync(outFile, "utf8");
  const existingCount = (existing.match(/^\s*hash:\s*"/gm) ?? []).length;
  if (existingCount > rows.length) {
    console.warn(
      `[generate:commits] git returned ${rows.length} commits but ${existingCount} are already committed ` +
        "(shallow clone?) — keeping the existing file.",
    );
    process.exit(0);
  }
} catch {
  // No existing file yet — fall through and write.
}

writeFileSync(outFile, file);
console.log(`Wrote ${rows.length} commits to ${outFile}`);
