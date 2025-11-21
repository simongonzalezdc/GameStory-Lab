<!-- aa8ceafd-20bb-47f8-9bb3-b79a2e8bb8c2 5857f8fa-650b-41fb-8366-33be370b6239 -->
# Frontend Aesthetics Redesign Plan: "Cozy Creator Lab"

## 1. Core Aesthetics & Theming

- **Goal**: Enhance the "Jewel Engine" theme with tactile, cozy textures and modern "glass" effects.
- **Actions**:
    - **Noise Texture**: Add a subtle SVG noise overlay to the background to reduce digital harshness.
    - **Refined Glassmorphism**: Update `.glass-card` in `index.css` with sophisticated `backdrop-filter`, `box-shadow` layers, and a subtle border gradient to simulate depth.
    - **Typography**: Scale up `Space Grotesk` headings for impact. Use `text-balance` for better readability.
    - **Gradients**: Replace linear background gradients with softer, organic radial gradients (mesh-like) using CSS.

## 2. Library Additions (High Impact / Low Weight)

- **`lucide-react`**: Standard, consistent, tree-shakeable icons to replace inline SVGs.
- **`framer-motion`**: Essential for "cutting edge" feel. Enables:
    - Smooth page transitions.
    - "Springy" micro-interactions on buttons/cards.
    - Layout animations (e.g., when deleting a project or filtering).
- **`clsx` & `tailwind-merge`**: For cleaner class composition.

## 3. Component Redesign

- **Icons System**: Create a centralized `Icon` wrapper or direct usage of Lucide for consistency.
- **Buttons**: Update `.btn` classes to have a "tactile" feel (subtle inner shadow, smooth scale on press).
- **Inputs**: Add a "glow" focus state using the specific jewel color (Garnet/Topaz).

## 4. Page Overhaul: `ProjectsPage` (The Showcase)

- **Hero Section**: Transform into a **Bento Grid** layout.
    - **Cell 1 (Large)**: Welcome / "Create Project" call to action with a 3D-like abstract jewel illustration (CSS only).
    - **Cell 2**: Recent Activity stream.
    - **Cell 3**: Quick stats.
- **Project Cards**:
    - Implement a "Spotlight" hover effect (cursor-following glow).
    - Add a visual "spine" or "notebook" edge to the cards to reinforce the "Creator Lab" / "Story" vibe.

## 5. Layout & Navigation

- **Sidebar/Header**: Make the navigation feel more like a "cockpit" or "workbench".
- **Transitions**: Add subtle fade/slide transitions between routes using `AnimatePresence` (if `framer-motion` is approved).

## 6. Cutting Edge Touch

- **Cursor Glow**: A subtle ambient light that follows the mouse on the background (optional, toggleable for performance).

## Implementation Steps

1.  Install `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`.
2.  Update `index.css` with new utility classes (noise, spotlight, refined glass).
3.  Refactor `Layout.tsx` to use the new structure and icons.
4.  Redesign `ProjectsPage.tsx` with the Bento grid layout and new card components.
5.  Audit and update `App.tsx` for routing transitions.

### To-dos

- [ ] 