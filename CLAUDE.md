# fitNXT — Claude Code Project Context

> **First time in this session?** Read REPO_MAP.md before touching any code.
> **Codebase changed significantly?** Run `/scan` to regenerate REPO_MAP.md.

## What is fitNXT?
AI-powered fitness PWA for gym athletes. Core features: intelligent workout logging, AI coaching (Claude API), macro tracking, PR celebrations, progress analytics. Deployed as PWA via Play Store (TWA).

## Must-Read Docs (in order)
1. [REPO_MAP.md](REPO_MAP.md) — current file map, installed packages, domain inventory
2. [docs/design-system/MASTER.md](docs/design-system/MASTER.md) — Ignite design system (colors, fonts, components, anti-patterns)
3. [docs/ADR-001-to-006.md](docs/ADR-001-to-006.md) — every architectural decision and why

---

## Stack Constraints — NEVER violate these

| Constraint | Rule |
|-----------|------|
| Language | TypeScript strict mode everywhere. Zero `any`. No `.js` files in src. |
| Frontend | Next.js 14 App Router only. Never use Pages Router patterns. |
| Backend | NestJS modular monolith. 6 bounded domains: auth, users, workouts, nutrition, ai-coach, media. |
| ORM | Kysely only. Never suggest Prisma, TypeORM, Sequelize, or Drizzle. |
| Styling | Tailwind CSS + Ignite design tokens only. Never hardcode hex values. |
| Icons | lucide-react only, stroke 1.8px. No other icon libraries. |
| Animations | Framer Motion only. No CSS keyframes for motion. Never animate width/height/margin. |
| State (server) | TanStack Query v5. Never put server state in Zustand. |
| State (global UI) | Zustand with slices. |
| State (component) | Local useState / useReducer. |
| State (URL) | nuqs for searchParams. |
| Package manager | pnpm only. |
| Validation | Zod at all API/form boundaries. class-validator in NestJS DTOs. |
| Event bus | EventEmitter2 (in-process). Extraction path to Kafka/SQS — never couple tightly. |
| Cache/Queue | Redis 7 via BullMQ (queues) and ioredis (cache). |

---

## Monorepo Structure
```
apps/
  web/          → Next.js 14 PWA (App Router, TypeScript, Tailwind, Framer Motion)
  api/          → NestJS modular monolith (TypeScript, Kysely, Redis, BullMQ)
packages/
  shared/       → Shared types, event contracts, DTOs, Zod schemas
  ui/           → Ignite component library (planned Phase 2)
```

## Backend Domains (apps/api/src/)
```
modules/
  auth/         → JWT, refresh tokens, OAuth (Google)
  users/        → profile, goals, body metrics, BMI history
  workouts/     → plans, sessions, exercises, sets, PRs
  nutrition/    → meal logs, macro targets, food database
  ai-coach/     → Claude API integration, context assembly, plan generation
  media/        → photo upload, Vision OCR, S3/GCS management
libs/
  shared/       → event contracts, shared utilities
  database/     → Kysely client, migrations, seeds
```

---

## Active Agents

| Agent | File | Invoke when |
|-------|------|-------------|
| `frontend-architect` | `.claude/agents/frontend-architect.md` | Designing component hierarchy, state strategy, performance decisions, PWA patterns |
| `backend-architect` | `.claude/agents/backend-architect.md` | API design, DB schema, domain patterns, caching, event contracts, scaling decisions |
| `developer` | `.claude/agents/developer.md` | Writing/refactoring actual code — implements what architects specify |
| `product-owner` | `.claude/agents/product-owner.md` | Breaking down features, prioritization, acceptance criteria, release planning |
| `ui-ux-reviewer` | `.claude/agents/ui-ux-reviewer.md` | Reviewing screens against Ignite design system and UX standards |

---

## Design System Quick Reference (full spec in MASTER.md)
| Token | Dark | Light | Use |
|-------|------|-------|-----|
| Root bg | `#06060D` | `#EEEDF8` | App background |
| Violet | `#7C6AF7` | `#5B4EE8` | AI/intelligence (Today, Coach, Plan, Auth screens) |
| Coral | `#FF6B4A` | `#E85A3A` | Intensity/effort (Session screen) |
| Gold | `#C8A84B` | `#B8943C` | Achievements only (PR celebrations) |
| Fonts | Syne (display) | DM Sans (body) | JetBrains Mono (numbers/metrics) |
| Base grid | 8dp | — | All spacing is multiples of 8 (or 4 for micro) |
