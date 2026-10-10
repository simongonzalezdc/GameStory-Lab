# Template System Audit & Improvement Plan
Scope: backend template service (`packages/backend/src/services/templates`), JSON genre templates under `genres/`, blending logic in `template-service.ts`, frontend Template Browser UX (`packages/frontend/src/pages/TemplateBrowserPage.tsx`). Audience: product/design/engineering.

## Current Coverage
- **Available genres (15 + blank):** rpg, fps, strategy, puzzle, survival, action-adventure, adventure, battle-royale, sports, fighting, platformer, horror, roguelike, simulation, racing, blank.
- **Unrepresented/highly requested genres/subgenres:** stealth, tactics/turn-based tactics, 4X (distinct from strategy), metroidvania, soulslike, deckbuilder/card battler, tower defense, city-builder/colony sim, life sim/farming, sandbox/voxel crafting, bullet hell, rhythm/music, visual novel/dating, narrative/walking sim/mystery, party co-op (couch/online), MMO/co-op extraction, idle/incremental, AR/VR, educational/serious, cozy/pastoral, immersive sim. Recommend adding at least: stealth, tactics, deckbuilder, metroidvania, soulslike, city-builder, life-sim, tower-defense, rhythm, bullet-hell, visual-novel/dating, sandbox crafting.

## Depth & Quality of Existing Templates
- **Structure:** Each template has a single core loop, flat player actions list, basic progression/resource definitions, and a short lore block (setting, protagonist, conflict, world rules, themes). Difficulty/targetAudience/tags present.
- **Issues:**
  - Content is generic/cliché (e.g., “ancient dark lord,” “special forces operative”) and risks feeling like existing IPs.
  - Minimal mechanical specificity: no constraints on session length, camera, input complexity, monetization, multiplayer model, pacing, or encounter composition.
  - Progression is shallow (linear/branching/open only) with generic bullet lists; no gating, reset, or meta-progression nuance.
  - Resource systems are few and lack dynamics (generation/sinks, scarcity curves, risk/reward).
  - Lore lacks unique hooks (no cultures/factions/props/verbs unique to setting).
  - Themes are broad and repeated across genres.
  - No variant knobs per genre (e.g., horror sub-flavors, FPS substyles).

## Blending Logic (How Multi-Genre Mixes Are Built)
- Located in `template-service.ts` → `blendGenres`, `blendMechanics`, `blendLore`.
- **Mechanics blending:** Weighted slicing of player actions; progression type chosen by presence of “open” or “branching”; core loops concatenated with “⚡”; win/fail/resources unioned. No deduplication beyond resource names; no coherence check or weighting of importance.
- **Lore blending:** Uses first template as primary background/motivation; abilities/themes merged; setting/eras concatenated with “meets/with”; conflicts joined with “while also”; world rules concatenated. This can produce awkward, unfocused text and keeps clichés from source templates.
- **Naming/description:** Just concatenated genre names; no hybrid naming logic or tone.

## Recommendations to Fully Flesh Out Templates
1) **Increase systemic depth per template**
   - Add fields: `camera` (isometric/side/top/down/first), `sessionLength`, `teamSize`/`partySize`, `pacing` (turn-based/real-time/pausable), `controls` (complexity & platform), `multiplayerModel` (solo/co-op/PvP/PvEvP), `monetization` (premium/seasonal/battle pass/cosmetics only), `economy` (sources/sinks, scarcity curves), `riskModel` (permadeath/roguelite checkpoints), `progressionGates` (skill, gear, narrative, time).
   - Flesh `resourceSystems` with flows (source, sink, scarcity over time, trade-offs).
   - Add `encounterDesign` and `levelStructure` per genre (e.g., hub-and-spoke, procedural tiles, fixed arenas, handcrafted puzzles).
   - Expand `themes` to 6–8 specific pillars per genre; add `tone` and `mood`.
   - Add `antipatterns` (what to avoid), `freshAngles` (anti-cliché twists), `contentExamples` (non-IP, abstract).
2) **Make lore less cliché**
   - Replace “ancient evil,” “chosen one,” “special forces” with unique societal/technological/cultural hooks.
   - Add `factions`, `props/artifacts`, `environmental hazards`, `cultural rules`, `taboos`, `power sources`.
   - Require “no IP references; invent unique proper nouns.”
3) **Subgenre variants**
   - For each main genre, add 3–4 variant profiles (e.g., Horror → cosmic/folk/tech/psych; FPS → arena/tactical/extraction/hero; RPG → tactical/ARPG/social; Strategy → 4X/RTS/tactics/grand). Expose as selectable on the Template Browser.
4) **Balance difficulty & audience**
   - Provide recommended onboarding (first 30 minutes), tutorial style, skill floor/ceiling, fail affordances.
5) **Add originality constraints**
   - Add `forbiddenComparisons` and `freshnessGuardrails` per template to steer away from known IP and genre stereotypes.

## Improving Blending Logic
- **Weighted selection with dedupe:** Sample top-N actions per genre by weight and importance, then deduplicate semantically and rewrite into a single coherent list.
- **Hybrid progression synthesis:** Pick a primary progression model (highest weight), then graft 2–3 mechanics from secondary genres; ensure gating/risks are coherent.
- **Conflict/setting merge:** Choose a primary conflict; attach 1–2 tensions from others; rewrite setting into one cohesive statement (no “meets/alongside” seams). Use tone/mood knobs to guide rewrite.
- **World rules harmonization:** Detect incompatibilities (magic vs hard sci-fi) and force a unifying rule (e.g., “magitech” or “relic tech”).
- **Hybrid naming:** Generate a short hybrid label (e.g., “Tactical Void Opera,” “Synthpunk Survival”) instead of “Genre A + Genre B.”
- **Anti-clone filters:** Run a pass to strip famous IP names/premises; enforce the “no IP analogues” rule in the blend output.
- **Surface variant choice:** If users pick subgenre variants, blend at the variant level instead of full genre defaults.

## Additional Template Browser Inputs (Beyond Genre)
Add controls to drive generation and blending:
- **Tone/Mood:** cozy, grim, whimsical, tragic, high-tension, hopeful.
 - **Camera/Platform:** first/third/isometric/side; PC/console/mobile/VR.
 - **Multiplayer Model:** solo, drop-in co-op, party PvE, PvP, PvEvP.
 - **Session Length & Pace:** 5-10m runs, 20-40m sessions, marathon; tempo: slow/steady/fast.
 - **Complexity & Onboarding:** accessibility slider; tutorial style (diegetic/explicit).
 - **Narrative Style:** linear/branching/hub anthology; VO vs text; dialogue density.
 - **Economy/Monetization:** premium, cosmetic-only battle pass, roguelite meta, crafting economy.
 - **Art Direction:** painterly low-sat, bold neon, diegetic UI, minimal HUD.
 - **Accessibility/Comfort:** colorblind-safe palettes, low-contrast toggle, motion comfort (camera shake off), control simplification.
 - **Constraints:** forbidden themes/IPs, violence tone, content ratings target.

## Prompt Improvements (for any AI generation/customization tied to templates)
- Prefix all template generation/use prompts with: “Invent original proper nouns; do not reference or mirror existing IPs; avoid famous characters, factions, or plots.”
- Add anti-cliché instructions: “Replace ‘ancient evil,’ ‘chosen one,’ ‘elite spec ops’ with novel cultural/technological drivers and grounded motivations.”
- Require specificity: “Describe 2–3 unique mechanics loops, 2 resource trade-offs, and 2 systemic risks; tie mechanics to setting.”
- Enforce coherence: “Produce one cohesive setting/loop; avoid listing multiple incompatible eras/tech; pick and justify the blend choice.”
- Add freshness score heuristic: ask the model to self-rate novelty vs genre tropes and rewrite until a threshold is met.
- For blends: “Use the highest-weight genre as spine; add only the top 3 supporting mechanics from others; reconcile conflicts into a single throughline; ban direct genre-name concatenation in the title.”

## Action Plan (Engineering/Content)
1) **Expand library:** Add missing subgenres (start with stealth, tactics, deckbuilder, metroidvania, soulslike, city-builder, life-sim, tower-defense, rhythm, bullet-hell, visual-novel/dating, sandbox crafting).
2) **Deepen templates:** Add new fields (tone, pacing, camera, multiplayer model, economy/monetization, risk model, encounter design, onboarding) and enrich mechanics/lore with anti-cliché guidance per genre.
3) **Upgrade Blender:** Implement weighted sampling and rewriting instead of simple concatenation; add dedupe and coherence steps; generate hybrid names/descriptions; apply anti-IP filters.
4) **UI extension:** Add selectors for tone, camera/platform, multiplayer, session length/pace, complexity, art direction, economy, accessibility constraints; pass to backend for blend/customize.
5) **Prompt hardening:** Update any AI generation/customization prompts with originality/anti-IP and specificity clauses; add “freshness” self-check and rewrite loop.
6) **Validation:** Run contrast/focus checks on Template Browser after UI additions; add tests for blend coherence and template validation (non-empty core fields, no banned phrases).

## Project Architect Interview: Pre-Answer from Template Screen
The architect interview has ~25 questions (phases: quick-discovery, deep-dive, open-source). Many can be pre-answered on the Template Browser to shorten the conversation:
- Pre-fill from template selections:
  - Project type/platform (`q1-project-type`, `q2-target-platforms`) → derive from platform/camera selectors.
  - Tech stack (`q1-tech-stack`, `q2-architecture`, `q2-database`, `q2-deployment`) → add stack presets per platform and let users pick/confirm.
  - Authentication (`q2-authentication`) → add auth preference selector.
  - Monetization (`q3-monetization-model`) → add monetization selector (premium, cosmetics, battle pass, none).
  - Distribution (`q2-distribution`) → add store/channel choices.
  - Multiplayer model/session length/pacing → newly proposed controls can map to primary workflow (`q2-primary-workflow`) and performance targets (`q2-performance`).
  - Integrations (`q2-integrations`) → expose common checkboxes (analytics, crash reporting, leaderboards) on the template screen.
  - Testing/monitoring (`q2-testing-strategy`, `q2-monitoring`) → add defaults (unit+smoke, crash reporting).
  - Open source/license (`q3-open-source`, `q3-license`, `q3-community-strategy`) → simple toggle + license picker.
- Pre-fill from template content:
  - Project name/one-liner (`q1-project-name`, `q1-project-description`) → derive from template name + user’s project title input.
  - Key features (`q1-key-features`) → map from template’s top player actions/core loop; let user edit.
  - Constraints (`q1-constraints`) → allow “team size”, “timeline”, “budget” inputs adjacent to template selection.
  - Data model (`q2-data-model`) → infer inventory/progression/state from chosen template; mark as draft.
- Goal: Enter architect interview with 70–80% answers pre-filled; architect chat then confirms/edits rather than asks all questions.
