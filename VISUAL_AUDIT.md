# Frontend Visual & Accessibility Audit (Current State: Dark-Only)

Author perspective: senior software engineer, staff product designer, web design lead, accessibility advocate. Scope covers all tabs/pages/components in `packages/frontend` as of this run (Projects, Templates, Concept Editor, Project Architect, Tutorial/Status shells, shared layout/assistant panel). Light mode was removed; dark is default.

## High-Severity Issues (Fix First)
- **Color system cohesion** (`src/index.css`, `tailwind.config.js`): Tokens are dark-only but many components still reference generic slate/gray utilities (e.g., cards, inputs, nav). This causes inconsistent contrast and occasional muted text. Consolidate to token-based classes or mod custom utilities to eliminate slate/gray drift.
- **Focus visibility gaps** (`src/pages/ProjectsPage.tsx`, `src/components/ProjectAssistantPanel.tsx`, `src/components/Layout.tsx`): Sort chips, nav links, icon-only buttons, and quick-action chips rely on color change only. Add `:focus-visible` outlines to all actionable elements.
- **Card elevation/borders** (`src/index.css` surfaces + `ProjectsPage` tiles): Some tiles (stats, activity rail) fall below AA when on dark backgrounds due to low-contrast borders. Increase border alpha and ensure text uses `--color-text-primary`.
- **Assistant rail readability** (`src/components/ProjectAssistantPanel.tsx`): Proposal rail and chat bubbles are improved but should enforce solid surfaces (no translucency) and consistent padding on narrow widths; ensure avatars/labels have alt text/aria where applicable.
- **Input/search contrast** (`ProjectsPage` search, template inputs): Placeholder and border colors need a guaranteed 4.5:1; set explicit token-based colors and consistent focus rings.

## Medium-Severity Issues
- **Typography hierarchy**: Headings use Space Grotesk + Plus Jakarta Sans but body copy sometimes inherits muted slate utilities. Normalize text utilities to tokens and set a typographic scale (h1–h6, body, small, micro) with matching letter-spacing.
- **Icons & labels**: Nav icons are inline SVG, but icon-only controls (delete, close, attach) need consistent 44×44 hit area and `aria-label`. Emoji persists in some buttons (e.g., empty states); replace with consistent icon set.
- **Spacing/rhythm**: Mixed spacing values (px, rem, tailwind gaps) across pages. Define a spacing scale and apply to grids/panels to reduce visual jitter.
- **Motion**: Animations are minimal. Consider subtle, meaningful motions (card rise, button press) with `prefers-reduced-motion` fallbacks already present.
- **Modals/backgrounds**: Overlays are correct but modal surfaces sometimes reuse base cards; introduce a modal-specific elevation token.

## Low-Severity Issues
- **Header branding**: Logo/wordmark is text; consider an SVG mark for clarity. Header height is fine; top padding could increase 2–4px for breathing room.
- **Footer**: Solid dark is OK; check contrast of link text vs background (should be AA at least).
- **Avatar badges**: Assistant “AI” badge uses gradients; ensure text contrast is ≥3:1 on gradient segments.

## Page-by-Page Notes & Recommendations
- **Layout Shell (`src/components/Layout.tsx`)**
  - Keep header solid dark; ensure nav inactive state uses `--color-text-secondary` (not slate). Increase focus ring on nav tabs and CTA.
  - Remove remaining slate utility colors; map to tokens.
  - Add `aria-current` and `aria-label` on nav icons where missing; ensure 44px hit area for logo/back buttons.
- **Projects Page (`src/pages/ProjectsPage.tsx`)**
  - Hero: Solid surface is good; ensure title/body use `--color-text-primary` / `--color-text-secondary` tokens; reduce reliance on slate classes.
  - Stats tiles: Increase border opacity + text color to primary; remove tinted gradient if it lowers contrast.
  - Project cards: Ensure borders use token color, text is primary, and badge text remains ≥3:1. Action buttons already high-contrast; keep.
  - Search/sort: Raise placeholder and border contrast; add visible focus outlines to sort pills.
  - Empty states: Replace emoji with SVG icons; align colors with tokens.
- **Template Browser (`src/pages/TemplateBrowserPage.tsx`)**
  - Ensure genre list items and sliders use token colors; raise border contrast on sliders/buttons; add focus styles to weight sliders and “Blend” action.
  - Modal inputs: enforce solid dark surfaces and high-contrast labels/placeholders.
- **Concept Editor (`src/pages/ConceptEditorPage.tsx`)**
  - Tabs/buttons: standardize to token colors; ensure validation messages have AA contrast.
  - JSON/raw toggles: add focus/hover outlines; ensure text contrast meets 4.5:1.
- **Project Architect (`src/pages/ProjectArchitectPage.tsx`)**
  - Header bar: make sure labels are primary text and borders visible.
  - Assistant panel: inherits fixes; ensure document lists/previews use token colors and readable mono font size.
- **Assistant Panel (`src/components/ProjectAssistantPanel.tsx`)**
  - Chat bubbles: keep solid surfaces; ensure user bubble has ≥4.5:1 contrast.
  - Proposal rail: border + background solid, maintain focus styles on buttons.
  - Quick chips: retain border + focus-visible; ensure text color is primary.
  - Composer: border + background to tokens; raise placeholder contrast.

## Color & Token System (Next Actions)
- Move all slate/gray utilities to token-driven classes; define Tailwind custom utilities bound to `--color-*`.
- Define a spacing + radius + shadow scale in tokens and reuse (radii already present; apply consistently).
- Add semantic text tokens for headings/body/muted and enforce across pages.

## Accessibility Checklist & Fixes
- **Contrast**: Verify with axe/Lighthouse; ensure text on cards, inputs, chips, nav, and buttons meets AA (4.5:1 standard; 3:1 for large text). Adjust `--color-text-primary/secondary` or backgrounds where needed.
- **Focus**: Add `focus-visible` outlines (2px, token accent) to all actionable elements, including icon-only and chips.
- **Hit targets**: Ensure 44×44 minimum for icon-only controls (close/delete, attach, theme toggle removed).
- **ARIA**: Add `aria-label` to icon-only buttons; ensure `aria-current` on active nav; provide descriptive labels on sliders and custom controls.
- **Reduced motion**: Already present—also disable blur-heavy effects under `prefers-reduced-motion`.
- **Form placeholders**: Ensure placeholders meet contrast or reduce reliance; always have labels.

## Prioritized To-Do (Engineering + Design)
1) Token cleanup: replace slate/gray Tailwind utilities with tokenized classes; align cards/inputs/buttons to tokens.  
2) Focus & contrast pass: add focus-visible to chips/nav/icon buttons; darken text/borders on cards/inputs/chips.  
3) Assistant panel polish: solid surfaces, consistent padding, focus on chips/buttons, high-contrast bubbles.  
4) Templates/Concept Editor: normalize inputs/tabs/alerts to token colors; ensure validation messages meet AA.  
5) Icon pass: swap emoji to SVG set; add aria-labels + 44px targets.  
6) Run automated audit (axe/Lighthouse) on Projects, Templates, Concept Editor, Architect; fix residual findings.

## File Pointers (Key Touchpoints)
- Tokens/surfaces/buttons: `src/index.css`, `tailwind.config.js`
- Layout/nav/footer: `src/components/Layout.tsx`
- Assistant/chat: `src/components/ProjectAssistantPanel.tsx`
- Projects dashboard: `src/pages/ProjectsPage.tsx`
- Templates: `src/pages/TemplateBrowserPage.tsx`
- Concept editor: `src/pages/ConceptEditorPage.tsx`
- Project architect: `src/pages/ProjectArchitectPage.tsx`

## Closing
Dark-only mode reduces complexity; now tighten tokens, contrast, and focus behavior. After the above fixes, rerun an automated audit and brief hallway tests in both desktop and mobile widths.***
