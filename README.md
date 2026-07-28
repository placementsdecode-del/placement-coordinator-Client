# PlacePrep — Student Learning & Placement Preparation

PlacePrep is a web workspace that helps students **learn technologies and tools** and **prepare for campus
placements** in one place. It combines structured, interview-oriented study guides with career roadmaps, coding
practice, self-assessments, daily tasks, and progress tracking — alongside admin and super-admin views for the
organizations that run placement programs.

> Status: front-end prototype connected to the API authentication flow. Some learning and dashboard views still use
> local demo data until their backend endpoints are wired.

## Live demo

Deployed on Vercel. Sign in with an account created through the backend or use the organization registration flow to
request a new institution account.

## Pitching / showcasing

- **Landing page** — the app now opens on a marketing landing screen (hero, features, subject library, and sign-in
  entry point). Sign in uses the API-backed login flow.
- **Demo script** — a click-by-click walkthrough in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) so anyone can
  deliver the pitch consistently in ~2–4 minutes.
- **Product one-pager** — [`docs/pitch-one-pager.html`](docs/pitch-one-pager.html), a self-contained visual overview
  to show alongside the live demo.

## What students get

- **Study Materials** — 40+ subjects (languages, web, backend, databases, CS core, DevOps & cloud, AI, career),
  each authored as a multi-stage guide (Fundamentals → Core → … → Interview → Revision) with Learn / Examples /
  Visualize / Code / Practice / Interview / Revision / Notes views. Content lives in versioned JSON guides under
  [`src/sections/study-materials/guides/`](src/sections/study-materials/guides/).
- **Career Roadmaps** — role tracks (frontend, full-stack, data/AI, cyber/cloud) with target roles, core vs. next
  skills, readiness, hiring signals, and a preparation timeline.
- **Coding Practice** — curated problems by topic and difficulty.
- **Self-Assessment & Assessments** — practice tests and coordinator-created assessments.
- **Daily Tasks, Homework, Announcements, Results, Preparation Progress, Profile.**

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)-style primitives
  (`src/components/ui`) and [lucide-react](https://lucide.dev/) icons
- Path alias `@` → `src/` (see [`vite.config.ts`](vite.config.ts) and [`tsconfig.json`](tsconfig.json))
- SPA routing handled by [`vercel.json`](vercel.json) rewrites

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
```

### Available scripts

| Script                    | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `npm run dev`             | Start the Vite dev server                                  |
| `npm run build`           | Type-check (`tsc -b`) and build for production             |
| `npm run preview`         | Preview the production build locally                       |
| `npm run lint`            | Run ESLint                                                 |
| `npm run generate:guides` | Regenerate study-guide JSON via `scripts/`                 |
| `npm run validate:guides` | Validate study-guide JSON against the schema              |

## Project structure

```text
src/
├── components/      # ui primitives, layout shells, shared common components
├── data/            # mock data for student / admin / super-admin
├── sections/        # feature modules (study-materials, career-roadmaps, coding-practice, ...)
├── types/           # shared TypeScript types
├── lib/             # utilities (cn, ...)
└── App.tsx          # role-based routing + top-level state
```

Product/UX requirements are documented in [`Placement Coordinator.md`](Placement%20Coordinator.md).

## Roadmap

The current build is a UI prototype. To make it production-ready:

- **Persist all workflows** beyond authentication: learning progress, submissions, assessments, reports, and
  announcements.
- **Persist learning progress** (completed topics, bookmarks, revision queue) per user.
- **Coordinator/admin data flows** wired to the backend (students, sections, groups, assessments, reports).
- See `Placement Coordinator.md` §28 and §31 for the full feature backlog and MVP scope.
