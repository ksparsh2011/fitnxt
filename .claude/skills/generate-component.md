Generate a new React component that fully complies with the fitNXT Ignite design system.

## When this skill activates
When asked to create a new UI component, button, card, screen section, or any React UI element for the fitNXT app.

## Steps

1. **Read the spec** — understand exactly what this component needs to do and where it appears (which screen, what color theme)

2. **Read MASTER.md** — check the relevant section for this component type (pills, cards, motion specs, color tokens, typography scale)

3. **Find an existing similar component** — locate comparable components in `apps/web/src/components/` and mirror their structure exactly

4. **Generate the component** following these rules:
   - Named export, TypeScript, strict props interface
   - Tailwind classes using design token classes only (no hardcoded hex)
   - Framer Motion for any animation, using `variants` pattern from MASTER.md
   - lucide-react for icons, stroke 1.8px
   - `cn()` for conditional classes
   - `cva` for variant props if component has multiple visual states
   - Minimum 44×44dp for all interactive targets
   - `aria-label` on icon-only buttons, correct ARIA roles
   - `prefers-reduced-motion` variant in all animations

5. **Generate the co-located test** — `ComponentName.test.tsx` using Testing Library
   - Test rendered output for each variant
   - Test interactive behavior (click, keyboard)
   - Test accessibility (getByRole, getByLabelText)

6. **Output a usage example** — show exactly how to import and use the component with all required props

## Output structure
```
apps/web/src/components/[category]/ComponentName.tsx
apps/web/src/components/[category]/ComponentName.test.tsx
```

Then show a usage snippet.
