<!-- aa8ceafd-20bb-47f8-9bb3-b79a2e8bb8c2 7f57cd53-9fe8-441a-ab87-33a0f9423094 -->
# Frontend Redesign Specification: Utilitarian Creator App

## 1. Design Philosophy & Theme Strictness
- **Visual Identity**: "Cozy Creator Lab" meets "Professional IDE".
- **Strict Color Rule**: NO hardcoded hex values outside of `index.css` or `tailwind.config.js`. All colors must reference `jewel-engine-theme-lowcontrast-garnet-topaz.css` variables (e.g., `var(--jewel-garnet)`, `var(--bg-panel)`).
- **Personality**: Achieved through "Notebook" textures, subtle jewel-tone gradients in icons/headers, and "tactile" interaction states (hover lifts, active glows), rather than loud background colors.

## 2. Core Architecture: The App Shell
- **New Component**: `AppShell.tsx` (Replaces existing `Layout.tsx`).
- **Layout Structure**:
    - **Left Sidebar (Fixed, w-64)**:
        - **Header**: "GameStory Lab" Logo (compact).
        - **Nav**: Vertical list with `Lucide` icons. Active state = Left border strip (Garnet) + subtle background.
        - **Footer**: User profile / Global Settings.
    - **Top Bar (Contextual, h-14)**:
        - **Left**: Breadcrumbs (e.g., "Projects / Tidal Cities").
        - **Right**: Command Palette trigger (Cmd+K visual), Sync Status.
    - **Main Workspace**: Scrollable, high-density area.
    - **Right Panel (Collapsible)**: AI Assistant (existing component, integrated into shell).

## 3. Page Overhaul: Dashboard (`ProjectsPage`)
- **Layout**: "Bento Grid" Dashboard.
- **Elements**:
    1.  **Quick Actions Row**: Compact buttons for "New Project", "Import", "Templates".
    2.  **"Recent" Spotlight**: Top 3 recently edited projects displayed as "Open Notebooks" (visual metaphor: spine on the left, subtle paper texture or glass effect).
    3.  **Project List**: High-density table/grid for all other projects. Columns: Name, Genre (Pill), Last Edited, Version Count.
- **Personality Injection**:
    - Project icons are generated based on their genre color (Garnet for Action, Topaz for Adventure, etc.).
    - "Empty State" uses a high-quality ASCII or SVG illustration of a messy desk/lab.

## 4. Correction: Template Browser Colors
- **Problem**: `TemplateBrowserPage.tsx` currently has hardcoded hex values in `genreColors`.
- **Fix**: Refactor `genreColors` object to use CSS variables.
    - Example: Replace `'#5B2B33'` with `'var(--jewel-garnet)'`.
    - Gradients: Use `linear-gradient(135deg, var(--jewel-garnet), var(--jewel-fireopal))`.
- **Result**: Ensure the "rainbow" effect is replaced by the strictly defined "Jewel Tones" (Garnet, Topaz, Amethyst, Emerald, Sapphire, Turquoise, Fire Opal).

## 5. Library & Tech Stack
- **Icons**: `lucide-react` (Install).
- **Animation**: `framer-motion` (Install) for:
    - Sidebar collapse/expand.
    - List entry animations.
    - "Spotlight" hover effects on Bento cards.
- **Utils**: `clsx`, `tailwind-merge` (Install).

## 6. Implementation Roadmap
1.  **Dependencies**: `npm install lucide-react framer-motion clsx tailwind-merge`.
2.  **Theme Audit**:
    - Verify `index.css` has all `jewel-*` variables defined.
    - Add `sidebar-width`, `topbar-height` variables.
3.  **Shell Construction**:
    - Create `src/components/AppShell.tsx`.
    - Migrate `App.tsx` to use `AppShell`.
4.  **Dashboard Redesign**:
    - Rewrite `ProjectsPage.tsx`.
    - Create `ProjectCard.tsx` (Bento style) and `ProjectRow.tsx` (List style).
5.  **Template Color Fix**:
    - Refactor `TemplateBrowserPage.tsx` color logic.
6.  **UI Polish**:
    - Update `Button` components to be `h-9` (compact) by default.
    - Add "Command Bar" visual to Top Bar.

## 7. Final Consistency Audit
- [ ] **Navigation**: Does the Sidebar persist correctly across all routes?
- [ ] **Colors**: Are there any "rogue" colors in the Template Browser?
- [ ] **Responsiveness**: Does the Sidebar collapse on mobile?
- [ ] **Functionality**: Do all links in the new Sidebar work?
- [ ] **Aesthetics**: Does the Dashboard feel "Cozy" (Notebook vibes) yet "Utilitarian" (High density)?


### To-dos

- [ ] Install dependencies (lucide-react, framer-motion, clsx, tailwind-merge)
- [ ] Update index.css with app shell variables and verify jewel tokens
- [ ] Create AppShell component and update App.tsx
- [ ] Redesign ProjectsPage.tsx (Dashboard) with Bento grid and list view
- [ ] Refactor TemplateBrowserPage.tsx to use CSS variable jewel colors
- [ ] Perform final consistency and functionality audit