# Dark Mode Implementation Plan

## 1. Foundation Audit
- inventory Tailwind usage in `packages/frontend/src/components/Layout.tsx` and `packages/frontend/src/pages/ProjectsPage.tsx` to map current colors, spacing, and shadows.
- review global styles in `packages/frontend/src/index.css`, noting base body background and typography choices.
- confirm Tailwind version and configuration (current `tailwind.config` + PostCSS pipeline) to understand the baseline before Tailwind 4 changes.

## 2. Tailwind 4 Upgrade Prep
- read Tailwind CSS 4 migration docs; list mandatory package upgrades and deprecated config options.
- plan updated `tailwind.config` (e.g., migrating to the new `@theme` syntax and simplifying the `content` array).
- determine if Vite config or `postcss.config` needs adjustments; document exact package.json script or dependency changes.

## 3. Design System Definition
- establish dual palettes (light/dark) with semantic tokens: surface, elevated surface, card, text-primary, text-muted, accent, danger.
- map tokens to CSS variables to plug into Tailwind 4 via custom utilities so both themes share the same semantic class names.
- define hover/focus/pressed/disabled states ensuring at least WCAG AA contrast, especially for buttons and links.

## 4. Implementation Strategy
- decide on theme detection: respect `prefers-color-scheme` and add a manual toggle in `Layout`, persisting preference (e.g., `localStorage`).
- update Tailwind config to include semantic classes (`bg-surface`, `text-muted`, `border-subtle`) referencing the CSS variables.
- ensure animations/transitions are gentle, using Tailwind’s dark variants or CSS variables to avoid duplicate markup.

## 5. Component Refactor Sequence
1. **Global Styles (`packages/frontend/src/index.css`)**
   - define CSS variables for both themes and apply them via `:root` (light) and `.dark` (dark).
   - adjust scrollbar, selection, and base body background for each theme.
   - consolidate typography smoothing and motion preferences.
2. **Layout (`packages/frontend/src/components/Layout.tsx`)**
   - wrap the app in a theme-aware class (e.g., `<div className={clsx(theme, 'min-h-screen')}>`).
   - restyle header/footer using semantic utilities; integrate a toggle button with accessible labels and focus rings.
   - verify gradient accents and nav states adapt to both palettes.
3. **Projects Page (`packages/frontend/src/pages/ProjectsPage.tsx`)**
   - replace hard-coded colors with semantic classes; ensure cards, stats, empty states, and modals read well in dark mode.
   - update progress bars and gradients to maintain depth without glare on dark backgrounds.
   - confirm the modal backdrop, text, and form controls respect the new tokens.

## 6. Testing & Validation
- build: `npm run build --workspace @gameforge/frontend` to ensure Tailwind recompiles post-upgrade.
- manual QA in both themes: navigation, cards, modals, empty/loading states, hover/focus states.
- responsive pass (mobile/tablet/desktop) verifying toggle placement and layout spacing.
- contrast audit using devtools (or plugins like Stark) to confirm WCAG AA.

## 7. Documentation & Handoff
- update README or a dedicated design doc to explain how the theme system works, how to add new semantic tokens, and how to toggle themes during development.
- note any remaining gaps (e.g., third-party widgets without dark variants) and add follow-up tasks to the backlog.
