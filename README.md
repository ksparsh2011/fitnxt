# FitAI — Intelligent Training Platform

> A production-grade AI-powered fitness coaching platform. Built with a modular monolith backend, React frontend, and Claude AI integration. Designed to scale from single-user to thousands with zero architectural rewrites.

[![CI](https://github.com/ksparsh2011/fitai/actions/workflows/ci.yml/badge.svg)](https://github.com/ksparsh2011/fitai/actions)
[![codecov](https://codecov.io/gh/ksparsh2011/fitai/branch/main/graph/badge.svg)](https://codecov.io/gh/ksparsh2011/fitai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What this is

FitAI is a personal training platform where the coach is Claude. It tracks your workouts, reads machine screens via computer vision, plans your training blocks using progressive overload principles, and adapts your program in real-time based on feedback. The AI coach maintains full context of your training history, nutrition, and goals — not a generic chatbot.

## Architecture at a glance

```
apps/
├── api/          # NestJS modular monolith — 6 bounded domains
└── web/          # Next.js 14 PWA — mobile-first

docs/
├── adr/          # Architecture Decision Records (ADR-001 to ADR-009)
├── api/          # OpenAPI contracts per domain
└── design/       # System design, data model, context strategy
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for full system design including C4 diagrams, domain model, data flow, and scaling strategy.

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| API | NestJS + TypeScript | Modular DI, domain isolation, scales to microservices |
| Web | Next.js 14 + TypeScript | SSR, PWA, App Router, Turbopack |
| Primary DB | PostgreSQL 16 | ACID, rich querying, `pgvector` for future ML embeddings |
| Cache | Redis 7 | Session store, AI context cache, BullMQ job queue |
| AI | Claude 3.5 Sonnet API | Vision OCR, structured output, prompt caching |
| Storage | S3 / GCS | Workout photos, progress images |
| Infra | Docker + GitHub Actions | Local parity, CI/CD, deploy to Cloud Run or ECS |

## Running locally

```bash
# Prerequisites: Node 20+, Docker, pnpm

git clone https://github.com/ksparsh2011/fitai
cd fitai
cp .env.example .env  # fill in ANTHROPIC_API_KEY, DATABASE_URL

docker compose up -d  # starts postgres + redis

pnpm install
pnpm --filter api run dev   # http://localhost:3001
pnpm --filter web run dev   # http://localhost:3000
```

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, C4 model, scaling strategy, domain boundaries |
| [DATA-MODEL.md](docs/design/DATA-MODEL.md) | PostgreSQL schema, indexing strategy, data retention policy |
| [AI-CONTEXT-STRATEGY.md](docs/design/AI-CONTEXT-STRATEGY.md) | How user context is managed, token budgeting, caching |
| [SYSTEM-DESIGN.md](docs/design/SYSTEM-DESIGN.md) | Multi-user scaling, event architecture, future ML data strategy |
| [ADR Index](docs/adr/INDEX.md) | All architecture decisions with status and rationale |
| [API Contracts](docs/api/) | OpenAPI 3.1 specs per domain |
| [Frontend Components](docs/design/FRONTEND-COMPONENTS.md) | Component tree, state management, UX decisions |
| [DEPLOYMENT.md](docs/design/DEPLOYMENT.md) | Free-tier deployment on GCP/AWS, Play Store path |

## Domains

The API is a **modular monolith** with six bounded contexts. Each domain is independently testable and extractable to a microservice without changing public interfaces.

```
auth        → JWT, refresh tokens, OAuth (Google)
users       → profile, goals, body metrics, BMI history
workouts    → plans, sessions, exercises, sets, PRs
nutrition   → meal logs, macro targets, food database
ai-coach    → Claude integration, context assembly, plan generation
media       → photo upload, Vision OCR, S3 management
```

## Design decisions

Key ADRs (see [docs/adr/](docs/adr/) for full reasoning):

- **ADR-001**: Modular monolith over microservices — domain isolation without operational overhead at MVP scale
- **ADR-002**: Next.js over plain React or Angular — SSR for initial load, PWA for mobile, App Router for streaming
- **ADR-003**: PostgreSQL + pgvector — relational model for workout data + future embedding storage for semantic search
- **ADR-004**: Claude prompt caching strategy — per-user context assembled in layers, cached at profile boundary
- **ADR-005**: Event-driven intra-domain communication — EventEmitter2 decouples domains, same interface if extracted to message queue later
