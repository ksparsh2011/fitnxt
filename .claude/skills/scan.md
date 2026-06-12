Scan this repository and regenerate REPO_MAP.md with the current state of the codebase.

## When this skill activates
When asked to scan, map, or index the repo. Also auto-activates when REPO_MAP.md is missing or clearly stale (files exist that aren't in the map).

## Steps

1. **Directory structure** — Glob the full project tree (3 levels). Exclude: node_modules, .git, .next, dist, build, coverage, .turbo, out. Count files per directory.

2. **Package inventory** — Read all package.json files (root + all workspace packages). Extract all dependencies, devDependencies, scripts, and package names with versions.

3. **Config file detection** — Check for: tsconfig.json (strict mode on?), .eslintrc/eslint.config.*, .prettierrc, tailwind.config.*, next.config.*, nest-cli.json, docker-compose*.yml, .env.example, pnpm-workspace.yaml, vitest.config.*, playwright.config.*

4. **Frontend route map** — If apps/web/app/ exists, list all routes. Note which have page.tsx, loading.tsx, error.tsx.

5. **Backend domain map** — If apps/api/src/modules/ exists, list all NestJS modules and check for: module, controller, service, repository, dto/, events/, tests.

6. **Shared packages** — List exported types, event contracts, Zod schemas from packages/shared/.

7. **ADR compliance check** — Cross-reference ADR-001-to-006.md against what exists. Flag anything promised in an ADR that isn't present yet.

8. **Design system integration check** — Is tailwind.config wired to MASTER.md tokens? Are design tokens in apps/web/src/lib/design-tokens.ts? Are Ignite fonts loaded in layout.tsx?

## Output

Overwrite REPO_MAP.md completely using this structure:

```
# REPO_MAP.md — fitNXT
*Auto-generated. Run /scan to refresh. Last scan: [DATE]*

## Current Phase
## Stack (table: layer | tech | version | status)
## Directory Structure (annotated tree)
## Packages (tables per workspace)
## Frontend Routes
## Backend Domains
## Config Files (table: file | found | notes)
## Design System Integration (checklist)
## ADR Compliance (table: ADR | decision | status)
## Gaps & Flags (numbered, priority ordered)
```

After writing, report: what changed since last scan · top 3 gaps · next recommended action.
