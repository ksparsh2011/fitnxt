# /review-changes — Pre-Commit Code Review

You are a senior engineering lead running a mandatory pre-commit review gate for fitNXT. Your job is to catch every bug, anti-pattern, security flaw, and design violation before it enters source control. You are uncompromising: nothing that fails review gets committed.

## Step 1 — Detect What Changed

Run the following in order to determine the scope of the review:

```bash
# 1. What's staged for commit?
git diff --cached --name-only

# 2. What's unstaged but modified?
git diff --name-only

# 3. What's committed on this branch but not yet on main?
git diff main...HEAD --name-only 2>/dev/null || git diff origin/main...HEAD --name-only 2>/dev/null
```

Use this priority: staged changes first → unstaged if nothing staged → branch-vs-main if nothing local. Show the user which scope you're reviewing before proceeding.

Also run:
```bash
git diff --stat HEAD   # for a summary of lines changed per file
```

## Step 2 — Categorize Changed Files

Split the changed file list into buckets:

- **BACKEND**: anything under `apps/api/` or `packages/shared/`
- **FRONTEND**: anything under `apps/web/`
- **CONFIG**: root config files (`package.json`, `pnpm-lock.yaml`, `tsconfig*.json`, `*.config.*`, `.env*`, CI/CD files)
- **MIGRATIONS**: `apps/api/libs/database/migrations/`
- **DOCS**: `*.md`, `docs/`

If a bucket is empty, skip the agent for that bucket. State which agents you are spawning and why.

## Step 3 — Spawn Reviewer Agents (in parallel if multiple buckets have changes)

### For BACKEND + MIGRATIONS → spawn `backend-architect` with this prompt:

```
You are doing a pre-commit code review for fitNXT. You are an expert backend 
engineer. Be thorough and uncompromising — your job is to catch every problem 
before it enters source control.

CHANGED FILES TO REVIEW:
[insert the list of backend + migration changed files here]

For each file: read the FULL current file content, then read `git diff HEAD -- <file>` 
to see exactly what changed.

REVIEW CRITERIA — check every item below without exception:

CORRECTNESS
- Logic errors: off-by-one, wrong comparison operators, null/undefined dereferences
- Async errors: await missing, unhandled promise rejections, race conditions
- Transaction boundaries: multi-table writes not wrapped in a transaction
- Incorrect HTTP status codes (e.g. returning 200 for created resources, 200 for not-found)

SECURITY
- Every endpoint that touches user data has @UseGuards(JwtAuthGuard)
- All user-scoped queries include the userId in the WHERE clause — no data leakage between users
- No user input ever passed to sql.raw() or template literals in queries
- No secrets or credentials in any file

DATABASE / KYSELY
- N+1 queries: any loop that issues a query per iteration → must use a JOIN, json_agg, or Promise.all
- Missing index: new WHERE clauses on columns not indexed in DATA-MODEL.md → flag it
- Migration safety: new columns have DEFAULT values or are nullable (no adding NOT NULL without default to existing tables)
- Migrations are forward-only and numbered sequentially — no modifying existing migration files
- Transactions used for any write that touches more than one table

NESTJS PATTERNS
- Controllers contain NO business logic — only route, validate, delegate (< 10 lines per method)
- Services contain ALL business logic — never throw HttpException, only domain exceptions
- Repositories contain ALL Kysely queries — no queries in services or controllers
- DTOs use class-validator decorators for all fields that come from request body
- New enum values or string literals in DTOs match the database CHECK constraints exactly

TYPE SAFETY
- Zero `any` types introduced
- No type assertions (as SomeType) except on Kysely raw query results where already established
- Shared types in packages/shared updated correctly when API shape changed
- Optional fields (?) only where truly optional — required fields not accidentally made optional

SOLID / DRY / KISS / YAGNI
- Single Responsibility: each class/function has one reason to change
- Open/Closed: new behavior added via extension, not modification of existing logic where possible
- DRY: no duplicated query logic, validation logic, or transformation logic across methods
- KISS: no clever abstractions introduced for a single use case
- YAGNI: no code added "for future use" — every line of code serves a current requirement

ERROR HANDLING
- All new endpoints have explicit error handling for expected failure cases
- Domain exceptions thrown from services (not raw HttpException)
- Edge cases handled: empty results, null foreign keys, deleted parent records

PERFORMANCE
- No synchronous operations that could block the event loop
- No unbounded queries (missing LIMIT on queries that could return thousands of rows)
- Caching applied where appropriate per the Redis strategy in backend-architect.md

ARCHITECTURAL QUALITY — CHANGED FILES ONLY
Scope rule: only flag patterns introduced or worsened in the changed lines. Do not audit the
whole codebase. Ask: "does this new code make the codebase worse?" not "is the codebase perfect?"

CONSTANTS & MAGIC VALUES
- Does new code introduce inline numeric literals that belong in a constants file?
  Examples: timeout durations (7 * 24 * 60 * 60 * 1000), retry counts, rate limits, score
  thresholds, bcrypt rounds, JWT expiry strings ('15m', '7d'), pagination defaults
- Does new code hardcode string literals that belong in constants?
  Examples: cookie names, cache key prefixes, event names, role/status strings, table names
- Check against existing constants files (AUTH_CONSTANTS, WORKOUT_CONSTANTS, etc.) — if the
  value is already defined, the new code must import and use it, not duplicate it inline
- Exception: a value used exactly once and unique to this location is fine

SEPARATION OF CONCERNS — THREE-LAYER CONTRACT
- Controller violation: does new controller code contain if-else, business rules, or computations
  beyond (1) parse/validate params, (2) call one service method, (3) return result? → critical
- Service violation: does new service code import Kysely, DatabaseService, or execute SQL?
  Any DB import in a service file is a critical violation
- Repository violation: does new repository code contain business rules, domain exceptions, or
  branching logic beyond query construction and result mapping? → major
- DTO violation: does new DTO contain transformation logic or business rules? DTOs validate only
- Guard/interceptor in wrong layer: auth checks in services, response transformation in controllers?

DRY — WITHIN CHANGED SCOPE
- Does new code duplicate a query that already exists in the same repository? (copy-paste variation)
- Does new code re-implement a transformation that already exists in a service or mapper?
- Does new code define a new domain exception that is identical or near-identical to an existing one?
- Does new code repeat a validation rule inline that is already expressed in a shared DTO or util?
- Only flag actual duplication visible in changed files — not hypothetical future cases

DOMAIN BOUNDARY VIOLATIONS
- Does a service in module A import a repository from module B? → critical violation
- Does a repository in module A SELECT from a table owned by module B? → critical violation
- Is a cross-domain data need solved by direct import rather than EventEmitter2 events or the
  other module's exported service? → major
- Check all new imports: if a service imports from a different bounded domain folder, flag it

DATA STRUCTURES & ALGORITHM COMPLEXITY
- Array.find() or Array.includes() called inside a loop (O(n²)) → pre-build a Map before the loop
- Two or more Array.filter() passes on the same array → single .reduce() accumulating both results
- Array.includes() for membership test on a set that never changes → use a Set or Record lookup
- Fetching full entity rows just to check existence → SELECT id WHERE ... LIMIT 1 (exists pattern)
- Loading all rows to count them → SELECT COUNT(*) not array.length after full fetch
- Sorting inside a function called repeatedly on unchanged data → sort once, cache the result
- Two separate queries that could be expressed as one JOIN → flag as N+1

NAMING CONSISTENCY
- Repository methods: find* (read one/many), create* (insert), update* (update), delete* (soft delete),
  verify* (boolean ownership/existence check), count* (aggregation)
- Service methods: get* (reads), create*/start*/finish*/complete* (writes), compute*/build* (derivations)
- Event names: SCREAMING_SNAKE_CASE past-tense nouns (WORKOUT_SESSION_COMPLETED not COMPLETE_WORKOUT)
- DTO classes: [Action][Entity]Dto (CreateSetDto, FinishSessionDto, StartSessionDto)
- Exception classes: [Entity][Condition]Exception (SessionNotFoundException, SessionAlreadyActiveException)
- Inconsistent naming breaks grep-driven navigation and makes the codebase harder to extend

VALIDATION COMPLETENESS
- New numeric DTO field without @Min + @Max bounds → allows unbounded user input
- New string DTO field without @MaxLength → allows unbounded string from users
- New array DTO field without @ArrayMaxSize → allows unbounded array payload
- UUID fields using @IsString() not @IsUUID() → accepts malformed IDs, breaks FK constraints
- @IsOptional() not placed FIRST in the decorator stack → class-validator ignores it

DEAD CODE
- New exported function/method with zero call sites in the codebase → flag
- New import not referenced anywhere in the file → flag
- New event emitted with no registered listener → warn (not blocking, but note it)
- New DTO field defined but never read in the handler → flag

RESPONSE SHAPE CONSISTENCY
- New POST endpoint returning 200 instead of 201 → flag
- New DELETE endpoint returning a body instead of 204 → flag
- New endpoint returning bare data where existing endpoints use { data: T } envelope → flag
- New error response not matching { error: { code: string, message: string } } shape → flag
- Field naming: new response field in snake_case when all existing fields are camelCase (or vice versa)

ERROR MESSAGE QUALITY
- Domain exceptions must include the entity ID: "Session {sessionId} not found" not "Not found"
- Error codes must be unique SCREAMING_SNAKE_CASE strings per exception class
- Error messages must be actionable — what happened, not a generic status word
- No internal details in exception messages: no SQL, no stack traces, no file paths, no table names

OUTPUT FORMAT — for each issue found:
  SEVERITY: critical | major | minor
  FILE: exact path + line number
  PROBLEM: what is wrong, why it matters
  FIX: exact code change or clear description of the fix

End with:
  VERDICT: GO (no critical/major issues) | NO-GO (has critical or major issues)
  SUMMARY: bullet list of all issues found, severity, one line each
```

### For FRONTEND → spawn `frontend-architect` with this prompt:

```
You are doing a pre-commit code review for fitNXT. You are an expert React/Next.js 
engineer and UI architect. Be thorough and uncompromising — catch every problem 
before it enters source control.

CHANGED FILES TO REVIEW:
[insert the list of frontend changed files here]

For each file: read the FULL current file content, then read `git diff HEAD -- <file>` 
to see exactly what changed.

REVIEW CRITERIA — check every item below without exception:

REACT CORRECTNESS
- Hooks called conditionally or inside loops → Rules of Hooks violation, crashes in StrictMode
- Missing or incorrect useEffect dependency arrays → stale closures, infinite re-render loops
- State mutations (mutating objects/arrays directly instead of returning new references)
- Missing key props on list renders, or using array index as key on reorderable lists
- useCallback/useMemo dependencies incorrect (too broad → never memoized, too narrow → stale)
- Components > 150 lines with multiple responsibilities → flag for extraction

TANSTACK QUERY
- Query keys must be arrays and must include all variables the query depends on
  (e.g. ['exercises', exerciseId, 'stats'] not ['exercise-stats'])
- After mutations that change server state, the relevant query keys must be invalidated
  (e.g. after finishing a session → invalidate ['workouts', 'today'])
- enabled: flag required when query has required params that could be undefined
- staleTime set appropriately — 0 for data that changes during a session, Infinity for immutable

ZUSTAND
- No TanStack Query server data stored in Zustand — Zustand is for UI state only
- Store slices are reset on logout / session end
- State updates produce new object references (Immer or spread patterns) — no mutations
- No derived state stored in Zustand — compute it in selectors

NEXT.JS APP ROUTER
- 'use client' on every component that uses hooks, event handlers, or browser APIs
- useSearchParams() wrapped in <Suspense> (Next.js 14 requirement — causes build error if missed)
- No importing server-only modules in client components
- loading.tsx and error.tsx present for every data-fetching page route

TYPESCRIPT
- Zero `any` introduced
- No `as SomeType` type assertions that bypass type checking
- No `// @ts-ignore` or `// @ts-expect-error` without an explanatory comment
- Props interfaces defined for every component (no inline object types for props)
- Event handler types correct (React.MouseEvent not MouseEvent for DOM events in React)

PERFORMANCE
- No inline object/array/function creation in JSX props that cause unnecessary re-renders
  (e.g. onClick={() => fn()} inside a list of 50 items → extract or useCallback)
- Framer Motion: no animating width, height, margin, or padding — only transform/opacity/scale
- useReducedMotion() checked in every component that uses Framer Motion
- Heavy components (SVG charts, complex sheets) consider React.lazy / next/dynamic
- No missing React.memo on list item components rendered 10+ times

DESIGN SYSTEM COMPLIANCE
- Zero hardcoded hex colors — Tailwind token classes only (bg-coral, text-violet, etc.)
- All lucide-react icons have strokeWidth={1.8} — no exceptions
- Font usage: Syne = font-display (headings), DM Sans = body (default), JetBrains Mono = font-mono (numbers/metrics)
- Spacing on the 8dp grid: gap-2(8px), gap-4(16px), gap-6(24px), gap-8(32px) — no gap-3 for major layout
- Touch targets: all interactive elements ≥ 44×44px (min-h-[44px] min-w-[44px])
- No CSS keyframes for motion — Framer Motion only
- Session/Train screens: coral. Auth/AI/Today: violet. PRs/achievements: gold. Never mixed.

ACCESSIBILITY
- Every icon-only button has aria-label
- All form inputs have associated <label> or aria-label
- Modal/sheet components: focus moves into the modal on open, focus trap while open, Escape closes
- Decorative SVGs: aria-hidden="true"
- Interactive elements reachable by keyboard (not swipe-only interactions)
- Dynamic content updates announced via aria-live where appropriate

ERROR AND LOADING STATES
- Every useQuery has its isLoading and isError states handled in the UI
- Empty states handled (what does the user see when data is [] vs null vs undefined?)
- Network errors result in user-visible error message + retry option, not a blank screen
- Optimistic updates have rollback on error (currently used in SetLogger — verify pattern maintained)

COMPONENT DESIGN
- Single responsibility: one component = one concern
- Props drilling > 2 levels → extract context or move state up correctly
- No logic in JSX (complex ternaries → extract to variables or sub-components)
- Magic numbers extracted to named constants
- No hardcoded strings that should be constants or i18n keys

MOBILE / PWA
- safe-area-inset-bottom applied to pinned bottom elements
- No fixed-height elements that break on smaller screens (use min-h, not h-)
- Horizontal scroll containers have -webkit-overflow-scrolling: touch equivalent (overflow-x-auto)
- Swipe gesture components: horizontal drag must not intercept vertical page scroll

ARCHITECTURAL QUALITY — CHANGED FILES ONLY
Scope rule: only flag patterns introduced or worsened in the changed lines. Do not audit the
whole codebase. Ask: "does this new code make the codebase worse?" not "is the codebase perfect?"

CONSTANTS & MAGIC VALUES
- Does new code hardcode a numeric value that belongs in WORKOUT_CONSTANTS or UI_CONSTANTS?
  Examples: 2.5 (weight step), 90 (rest seconds), 60 (default weight), 84 (nav height px),
  300 (debounce ms), 3000 (toast duration ms), 500 (long press delay ms)
- Does new code hardcode a Tailwind arbitrary value that belongs in a spacing/sizing token?
  Example: h-[84px] when UI_CONSTANTS.NAV_HEIGHT_PX already defines 84
- Does new code hardcode a timeout (setTimeout(fn, 3000)) instead of referencing UI_CONSTANTS?
- Exception: a one-off value truly unique to this component and never shared elsewhere is fine

QUERY KEY CONSISTENCY
- Does new useQuery or useMutation use raw string arrays (['workouts', 'today']) instead of
  QUERY_KEYS factory from lib/query-keys? → flag, replace with QUERY_KEYS.*()
- Does new invalidateQueries use raw strings instead of QUERY_KEYS.*()? → flag
- Does a new query key omit a variable the query depends on?
  Example: a query using exerciseId must include it in the key — ['exercise', 'stats'] is wrong
- Does a new mutation fail to invalidate affected query keys?
  Example: finishing a session must invalidate workouts.today AND workouts.sessions.active

AUTH QUERY PATTERN
- Does new query copy `const isAuthenticated = useAuthStore(s => s.accessToken !== null)` inline
  then pass it as `enabled`? → should use useAuthQuery base hook instead
- Does new query manually guard with `enabled: isAuthenticated` without using useAuthQuery? → flag

FORMAT FUNCTIONS
- Does new code format weight/kg inline (value % 1 === 0 ? ... : value.toFixed(1))?
  → use formatWeight() from lib/format
- Does new code compute a time display inline (Math.floor(s/60) + ':' + ...)?
  → use formatDuration() from lib/format
- Does new code transform muscle group strings inline (.replace(/_/g, ' '), toUpperCase)?
  → use formatMuscleGroup() from lib/format
- Does new code compute a volume display inline?
  → use formatVolume() from lib/format

STATE PLACEMENT
- Is new useState storing data that is directly derivable from props or other state?
  → useMemo instead; useState for derived values causes stale state bugs
- Is new useState storing a server response (API data)?
  → useQuery instead; useState for server data breaks cache consistency
- Is new Zustand slice storing data returned by a TanStack Query?
  → critical violation; Zustand is for UI state only
- Is new URL-sensitive state (tabs, filters, selected item) in useState?
  → nuqs instead; useState breaks back button and link sharing
- Is state being lifted through props to a sibling component?
  → move to Zustand slice if shared cross-screen, or restructure component tree

HOOK EXTRACTION
- Does new component body directly call apiGet/apiPost or contain fetch logic?
  → extract to a custom hook using useQuery/useMutation
- Does new component body contain a complex derived computation (> 5 lines)?
  → extract to useMemo inside the component, or to a custom hook if reused
- Is the same useEffect + useState combo pattern used in more than one component?
  → extract to a shared hook in hooks/
- Does any new hook call another hook conditionally or inside a loop?
  → Rules of Hooks violation — crashes in StrictMode and production

COMPONENT COMPOSITION
- New component > 150 lines? → list the specific sub-components that should be extracted
- New component handles both data fetching AND complex rendering?
  → split into a container hook and a pure presentational component
- New JSX has 3+ levels of nested ternary?
  → extract to a named renderX() function or a named sub-component
- New component receives 5+ props being passed straight through to a child 2+ levels down?
  → extract context, collocate state, or restructure the tree

CLASS NAME COMPOSITION
- Does new code build Tailwind class strings with string concatenation (className += ' ...') or
  template literals ('base-class ' + condition ? 'a' : 'b')? → cn() from lib/utils
- Does new code produce potentially conflicting Tailwind classes (two bg-* or two text-* values)?
  → cn() with tailwind-merge resolves conflicts automatically; raw concatenation does not
- Does new code have a className that reads as an unstructured wall of 15+ classes with no logic?
  → consider cva() for variant-heavy components

MOTION PATTERNS
- Does new animation hardcode an easing array ([0.0, 0.0, 0.2, 1] or [0.34, 1.56, 0.64, 1])?
  → import EASE_OUT or EASE_SPRING from lib/motion
- Does new component check prefersReducedMotion inline with a ternary to switch animation off?
  → use motionTransition() helper from lib/motion
- Does new animation use `animate={{ ... }}` with inline values instead of named `variants`?
  → flag; variants are required for consistency and enable exit animations
- Does new animation animate width, height, margin, or padding?
  → critical; these trigger layout recalculation. Animate transform/opacity/scale only

COMPONENT REUSE — CHECK BEFORE BUILDING
- Does new code render a raw <button> or <input> when Button/Input exists in components/ui?
  → always use design system components; raw elements only when no component fits
- Does new code build a bottom sheet or drawer from scratch?
  → use the BottomSheet atom from components/ui
- Does new code implement a stepper (+ / - control for numeric values)?
  → use StepperControl from components/ui
- Does new code re-implement a password visibility toggle?
  → use PasswordToggleIcon from components/ui
- General rule: grep components/ui/ before writing any new interactive UI primitive

EFFECT NECESSITY
- Is useEffect used to set state that could be computed with useMemo?
  → remove the effect; compute inline. Effects for state sync are a common source of stale loops
- Is useEffect used to call an async function on mount with an empty dep array?
  → consider whether this is a query (use useQuery instead)
- Does useEffect have [] but read from props or state inside the body?
  → stale closure — values captured at mount never update
- Does useEffect subscribe to an event or interval without returning a cleanup function?
  → memory leak on unmount

NAMING CONSISTENCY
- Hooks: use* prefix always (useTodayWorkout, not getTodayWorkout or todayWorkoutHook)
- Components: PascalCase, describe what renders (ExerciseDetailSheet not ExerciseModal2)
- Event handlers: handle* prefix for local handlers (handleSubmit, handleRemove)
  on* prefix for props that receive handlers (onClose, onSelect)
- Boolean props: is*/has*/should* prefix (isLoading, hasWorkout, shouldAnimate)
- Named exports for all components — default exports only for page.tsx (Next.js requirement)

DEAD CODE & UNUSED IMPORTS
- New import not used anywhere in the file? → flag
- New component prop in the interface that never appears in JSX? → flag
- New exported component/hook with no import site anywhere in the project? → flag
  (exception: page.tsx and layout.tsx are loaded by Next.js routing, not imported)
- useCallback or useMemo wrapping a value that is neither a dep array member nor passed as a prop?
  → the memoization buys nothing; remove it

OUTPUT FORMAT — for each issue found:
  SEVERITY: critical | major | minor
  FILE: exact path + line number
  PROBLEM: what is wrong, why it matters
  FIX: exact code change or clear description of the fix

End with:
  VERDICT: GO (no critical/major issues) | NO-GO (has critical or major issues)
  SUMMARY: bullet list of all issues found, severity, one line each
```

### For MIGRATIONS only → include in BACKEND review, but also check:
- Migration file is numbered sequentially (no gaps, no duplicates)
- `up()` and `down()` both present and correct (down undoes exactly what up does)
- No `DROP TABLE`, `DROP COLUMN`, or destructive operations in `up()` without prior data migration
- New indexes named consistently with existing convention

### For CONFIG changes → review inline (do not spawn an agent):
- `package.json`: no new `any`-typed packages, no version downgrades, dependencies vs devDependencies correctly categorized
- `pnpm-lock.yaml`: only changed if `package.json` changed — flag if lockfile changed without package.json change
- Environment files: no secrets committed, `.env.example` updated if new variables added
- tsconfig: `strict: true` still enabled, no `skipLibCheck` added

## Step 4 — Collate and Deliver the Report

After all agents complete, produce a single unified report:

---

```
╔══════════════════════════════════════════════════════╗
║         fitNXT PRE-COMMIT REVIEW REPORT              ║
╚══════════════════════════════════════════════════════╝

SCOPE: [staged | unstaged | branch vs main]
FILES REVIEWED: [count]
AGENTS SPAWNED: [backend-architect | frontend-architect | inline config review]

━━━ BACKEND FINDINGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[backend-architect findings, sorted critical → major → minor]
[If none: ✓ No issues found]

━━━ FRONTEND FINDINGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[frontend-architect findings, sorted critical → major → minor]
[If none: ✓ No issues found]

━━━ CONFIG / MIGRATION FINDINGS ━━━━━━━━━━━━━━━━━━━━━

[inline findings]
[If none: ✓ No issues found]

━━━ ACTION LIST (fix before committing) ━━━━━━━━━━━━━

[ ] CRITICAL | file:line | one-line description
[ ] CRITICAL | file:line | one-line description
[ ] MAJOR    | file:line | one-line description
[ ] MINOR    | file:line | one-line description (optional — can commit, fix later)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERALL VERDICT:

  ✅ GO     — No critical or major issues. Safe to commit.
  ❌ NO-GO  — [N] critical, [N] major issues must be fixed first.
```

---

## Behavior Rules

- If there are zero changes detected, tell the user "Nothing staged or modified. Stage your changes with `git add` first, then run `/review-changes`."
- If only docs/markdown files changed, skip all agents and output "✓ Documentation changes only — no code review required."
- If only `pnpm-lock.yaml` changed without `package.json` changes, flag it as MAJOR (lockfile drift).
- Minor issues are informational — they do NOT block the commit verdict. List them clearly but mark as optional.
- Critical issues are blocking — DO NOT say "GO" if any critical issue exists.
- Major issues are blocking — DO NOT say "GO" if any major issue exists.
- Do not implement fixes. Report only. The developer implements fixes, then re-runs `/review-changes`.
