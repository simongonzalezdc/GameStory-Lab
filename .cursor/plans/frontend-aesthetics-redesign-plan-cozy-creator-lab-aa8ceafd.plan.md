<!-- aa8ceafd-20bb-47f8-9bb3-b79a2e8bb8c2 5bb5bd15-4934-4081-be5b-9975efce5026 -->
# Frontend Redesign: Utilitarian "Jewel" App Shell

## 1. Core Architecture: The "App Shell"

- **Goal**: Shift from "Website" (Header + Page) to "Professional Tool" (Sidebar + Workspace).
- **New Layout Structure**:
    - **Left Sidebar (Fixed)**: Navigation, User Profile, Global Settings.
    - **Top Bar (Contextual)**: Breadcrumbs, Project Status, Search/Command Trigger.
    - **Main Workspace**: Scrollable content area with high information density.
    - **Right Panel (Collapsible)**: The AI Assistant/Inspector (already exists, but needs integration into the shell).

## 2. Aesthetics: "Functional Jewel"

- **Style**: Keep the `Dev Docs/jewel-engine-theme-lowcontrast-garnet-topaz.css` colors but apply them functionally.
- **Refinements**:
    - **Glassmorphism**: Use it for *panels* and *overlays*, not general page backgrounds.
    - **Density**: Reduce padding on lists and cards. Use strict grid alignments.
    - **Typography**: Keep `Plus Jakarta Sans` for UI text but tighten tracking. Use `Space Grotesk` only for top-level headers.
    - **Borders**: Use subtle 1px borders with `border-subtle` color to define panes (classic "IDE" look).

## 3. Library Additions

- **`lucide-react`**: For crisp, consistent, professional UI icons.
- **`framer-motion`**: For subtle, "expensive-feeling" layout transitions (e.g., sidebar collapse, list reordering).
- **`clsx` & `tailwind-merge`**: For robust class management.

## 4. Page Overhaul: `ProjectsPage` -> "Dashboard"

- **Remove**: The large "Hero" / Welcome section.
- **Add**:
    - **Quick Actions Bar**: Row of compact buttons (Create, Template, Import).
    - **Recent Files Grid**: A high-density grid of recently accessed projects with "last edited" metadata prominent.
    - **All Projects Table/List**: A sortable, filterable list view (more utilitarian than big cards).
- **Visuals**: "Notebook" spine effect on project thumbnails to keep the "Story" vibe but in a grid format.

## 5. Component Updates

- **Navigation**: Vertical Sidebar component with active state indicators (Garnet glow).
- **Search**: A "Command Bar" aesthetic (CMD+K style visual) in the Top Bar.
- **Buttons**: "Tactile" feel but more compact (`h-9` or `h-8` standard height).

## Implementation Steps

1.  **Setup**: Install `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`.
2.  **Theme Tweak**: Update `index.css` to support "App Shell" variables (sidebar width, top bar height).
3.  **Layout Refactor**: Create `AppShell.tsx` (replacing current Layout) with Sidebar + TopBar structure.
4.  **Dashboard Implementation**: Rewrite `ProjectsPage.tsx` to be a density-focused dashboard.
5.  **Component Polish**: Update buttons and inputs to match the new utilitarian density.