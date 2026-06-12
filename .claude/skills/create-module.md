Scaffold a complete NestJS module following fitNXT's bounded domain architecture.

## When this skill activates
When asked to create a new NestJS module, domain, or backend feature for the fitNXT API.

## Steps

1. **Confirm the domain** — which of the 6 bounded domains does this belong to, or is it a new one? Read ADR-001 to verify it respects existing domain boundaries.

2. **Read an existing module** — locate a comparable module in `apps/api/src/modules/` and mirror its structure exactly.

3. **Scaffold the full module structure:**
```
modules/[domain]/
├── [domain].module.ts
├── [domain].controller.ts
├── [domain].service.ts
├── [domain].repository.ts
├── dto/
│   ├── create-[entity].dto.ts
│   └── update-[entity].dto.ts
├── events/
│   └── [domain].events.ts
├── exceptions/
│   └── [domain].exceptions.ts
└── __tests__/
    ├── [domain].service.spec.ts
    └── [domain].repository.spec.ts
```

4. **Generate each file** with:
   - Module: imports, providers, exports, controllers
   - Controller: one method per endpoint, < 10 lines each, no business logic, Swagger decorators
   - Service: one public method per use case, domain exceptions (not HttpException), typed return
   - Repository: Kysely queries only, soft-delete filtering built-in, typed domain object returns
   - DTOs: class-validator decorators, strict validation, no extra fields
   - Events: typed event classes with static EVENT string
   - Exceptions: extend DomainException, meaningful error codes
   - Tests: happy path + 3 edge cases per service method

5. **Check for cross-domain event needs** — if this module needs to communicate with other domains, define the event contracts in `libs/shared/events/` not in the module itself.

6. **Register the module** — show exactly where to add it in `AppModule` imports.

## Output
All files with full content, then a summary of what each file does and what still needs to be filled in (e.g. business logic specifics).
