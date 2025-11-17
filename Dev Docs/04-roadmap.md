# Generative Score Lab - Development Roadmap

**Version:** 1.0  
**Last Updated:** November 17, 2025  
**Planning Horizon:** 12 months

---

## Vision & Strategy

**Product Vision:**  
"Make adaptive game music creation accessible to everyone, powered by AI."

Generative Score Lab will become the **Figma of game audio** - a browser-based, collaborative tool that democratizes dynamic music creation through natural language AI and algorithmic generation.

**Strategic Goals:**
1. **Launch MVP in 8-10 weeks** with core AI, voice, and export features
2. **Validate market fit** with 100+ indie developers using the tool in real games
3. **Build community** around open-source contributions and template sharing
4. **Establish technical foundation** for future monetization (cloud features, marketplace)

---

## Release Timeline

```
Nov 2025          Jan 2026          Mar 2026          Jun 2026          Sep 2026
    |                 |                 |                 |                 |
    MVP Start         MVP Launch        v1.1              v1.5              v2.0
  (Foundation)     (Local-only)    (Generators)   (Collaboration)      (Cloud)
```

---

## Phase 1: MVP Foundation (Weeks 1-8)

**Goal:** Build a working local-only app with core AI and voice features

**Target Release:** End of Week 8 (Mid-January 2026)

### Features

| Feature | Priority | Status | Estimate | Owner |
|---------|----------|--------|----------|-------|
| Project setup (Vite, React, TS, Tailwind) | P0 | Not started | 2 days | AI Agent |
| Type system + Zustand store | P0 | Not started | 3 days | AI Agent |
| Audio engine foundation (Tone.js) | P0 | Not started | 4 days | AI Agent |
| Scene board UI (cards, CRUD) | P0 | Not started | 5 days | AI Agent |
| Euclidean rhythm generator | P0 | Not started | 3 days | AI Agent |
| Arpeggiator generator | P0 | Not started | 3 days | AI Agent |
| Track management UI | P0 | Not started | 4 days | AI Agent |
| Scene playback system | P0 | Not started | 4 days | AI Agent |
| AI assistant (cloud backend) | P0 | Not started | 5 days | AI Agent |
| AI assistant (local backend) | P0 | Not started | 3 days | AI Agent |
| AI chat UI + setup wizard | P0 | Not started | 4 days | AI Agent |
| Voice pitch detection | P0 | Not started | 4 days | AI Agent |
| Voice capture UI | P0 | Not started | 3 days | AI Agent |
| JSON export system | P0 | Not started | 3 days | AI Agent |
| Interactive tutorial | P1 | Not started | 4 days | AI Agent |
| Markov + Random Walk generators | P1 | Not started | 3 days | AI Agent |
| UI polish + accessibility | P1 | Not started | 4 days | AI Agent |
| Testing + bug fixes | P1 | Not started | 5 days | AI Agent |

**Total Estimate:** 60 days (8.5 weeks with parallel work)

### Success Metrics
- **Time-to-first-export:** < 1 hour for new users
- **AI success rate:** 80%+ requests understood correctly
- **Voice accuracy:** 70%+ notes detected correctly
- **Export validation:** 100% of exports load in Unity/Godot
- **Test coverage:** 60%+ for generators/utils

### Key Milestones
- **Week 2:** Audio engine plays first sound, scene CRUD works
- **Week 4:** Euclidean + Arp generators working, AI chat functional
- **Week 6:** Voice capture working, JSON export functional
- **Week 8:** MVP complete, polished, documented

---

## Phase 2: Enhanced Generators (Weeks 9-12)

**Goal:** Add advanced generators and improve music quality

**Target Release:** Mid-February 2026 (v1.1)

### Features

| Feature | Priority | Dependencies | Estimate |
|---------|----------|--------------|----------|
| Strudel DSL integration | P1 | Strudel npm package | 5 days |
| Pattern editor UI (for Strudel) | P1 | Strudel integration | 4 days |
| Magenta ML models (melody generation) | P2 | TensorFlow.js | 7 days |
| Audio stem generator (AI audio) | P2 | Cloud API | 5 days |
| Generator presets library | P1 | None | 3 days |
| Advanced mapping system (game vars) | P1 | None | 4 days |
| Effects chain UI (reverb, delay) | P2 | Tone.js effects | 3 days |
| Performance optimization | P1 | None | 4 days |

**Total Estimate:** 35 days (5 weeks)

### Technical Debt
- Refactor audio scheduling for better timing accuracy
- Optimize generator algorithm performance (parallel processing)
- Add comprehensive error boundaries to React components

### Success Metrics
- **Generator variety:** 7+ generator types available
- **Music quality:** Blind test shows 4/5 users prefer v1.1 over MVP
- **Performance:** No audio dropouts on 10-track scenes

---

## Phase 3: Collaboration & Cloud (Weeks 13-20)

**Goal:** Enable cloud save, sharing, and multiplayer editing

**Target Release:** End of April 2026 (v1.5)

### Features

| Feature | Priority | Dependencies | Estimate |
|---------|----------|--------------|----------|
| User authentication (email + OAuth) | P0 | Supabase | 5 days |
| Cloud project save/sync | P0 | Supabase storage | 6 days |
| Shareable project links | P1 | Cloud save | 3 days |
| Real-time collaboration (multiplayer) | P1 | WebSocket, CRDT | 10 days |
| Project versioning (history) | P2 | Cloud save | 4 days |
| Template marketplace | P1 | Cloud storage | 6 days |
| User profiles + project gallery | P2 | Cloud DB | 4 days |
| Social features (comments, likes) | P3 | Cloud DB | 3 days |
| Analytics dashboard (usage tracking) | P2 | Analytics API | 3 days |

**Total Estimate:** 44 days (6 weeks)

### Technical Debt
- Implement offline-first architecture (sync when online)
- Add conflict resolution for multiplayer edits
- Optimize bundle size (currently ~400KB, target <300KB)

### Success Metrics
- **Cloud adoption:** 60%+ of users enable cloud save
- **Sharing:** 20%+ of projects shared with others
- **Collaboration:** 5%+ of users try multiplayer mode
- **Template marketplace:** 50+ user-generated templates

---

## Phase 4: Advanced Features (Weeks 21-40)

**Goal:** Add pro features for serious game developers

**Target Release:** September 2026 (v2.0)

### Features

**Real-Time Game Integration:**
- WebSocket protocol for live game ↔ music communication
- Unity/Godot native plugins (C#/GDScript)
- Real-time parameter mapping (player HP → intensity, etc.)
- Estimate: 12 days

**Visual Programming:**
- Node-based patch editor (like Max/MSP)
- Custom generator scripting (JavaScript)
- Modular effects routing
- Estimate: 15 days

**MIDI I/O:**
- MIDI keyboard input (play notes live)
- MIDI export (Standard MIDI File)
- MIDI CC mapping (hardware controllers)
- Estimate: 8 days

**DAW Integration:**
- Export to Ableton Live project (.als)
- Export to FL Studio project (.flp)
- VST/AU plugin (embed in DAW)
- Estimate: 20 days

**Mobile App:**
- iOS app (React Native)
- Android app (React Native)
- Touch-optimized UI
- Offline editing
- Estimate: 25 days

**Total Estimate:** 80 days (11 weeks)

---

## Phase 5: Monetization & Scale (Month 12+)

**Goal:** Sustainable revenue and growth

**Features:**
- Freemium tier enforcement (feature gating)
- Paid subscription billing (Stripe)
- Enterprise features (SSO, team management)
- API access for programmatic composition
- White-label embedding

**Timeline:** Ongoing (post v2.0)

---

## Future Considerations (12-24 months)

### Potential Features
- **AI composition assistant:** Generate entire scenes from text prompts ("epic boss battle music")
- **Adaptive music middleware:** Drop-in replacement for Wwise/FMOD
- **Live performance mode:** Use as VJ/DJ tool for game streams
- **Educational mode:** Interactive music theory lessons
- **Licensing marketplace:** Sell ready-made game scores

### Technical Improvements
- **Web Audio Worklet:** Move processing to audio thread (lower latency)
- **WebAssembly:** Compile generators to WASM (10x speed)
- **Offline-first PWA:** Full app works without internet
- **Desktop app:** Electron wrapper for better performance

### Scalability
- **CDN for assets:** Faster load times globally
- **Serverless audio rendering:** Cloudflare Workers for export
- **Horizontal scaling:** Multi-region database replication

---

## Dependencies & Risks

### External Dependencies

| Dependency | Impact | Owner | Status |
|------------|--------|-------|--------|
| Anthropic Claude API | AI assistant functionality | Anthropic | Stable |
| Ollama/LM Studio | Local LLM support | Open source | Active development |
| Tone.js | Audio engine | Open source | Stable |
| Strudel | Pattern generation | Open source | Beta (v1.0 coming) |
| TensorFlow.js Magenta | ML music generation | Google | Maintained |
| Supabase | Cloud backend | Supabase Inc | Production-ready |

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Web Audio API limitations** | Medium | High | Test on multiple browsers early, use Tone.js abstractions |
| **AI API rate limits** | Low | Medium | Implement caching, queue requests, fallback to local LLM |
| **Strudel integration complexity** | Medium | Medium | Start with simple patterns, expand gradually |
| **Voice detection inaccuracy** | High | Low | Set realistic expectations, provide manual correction |
| **User adoption (market fit)** | Medium | High | Early user testing, iterate on feedback, free tier |
| **Performance on low-end devices** | Medium | Medium | Optimize bundle size, lazy loading, Web Workers |
| **Scope creep (feature bloat)** | High | High | Strict MVP definition, ruthless prioritization |

---

## Resource Planning

### Team Composition
- **Solo developer (you):** Full-stack development, design, product management
- **AI coding agents:** Claude Code, Cursor (coding assistance)
- **Community (future):** Open source contributors

### Budget (Phase 1 - MVP)
- **Development:** $0 (self-funded, sweat equity)
- **Infrastructure:** $0 (local-only, no hosting)
- **Third-party services:**
  - Anthropic Claude API: ~$20-50/month (dev testing)
  - **Total Phase 1:** ~$50/month

### Budget (Phase 3 - Cloud Features)
- **Development:** $0 (still self-funded)
- **Infrastructure:**
  - Supabase: $25/month (Pro plan)
  - Netlify/Vercel: Free tier (static hosting)
  - CDN: Free tier (Cloudflare)
  - **Total Phase 3:** ~$25-50/month

### Budget (Phase 4+)
- **Development:** Consider hiring help if revenue > $5K/month
- **Infrastructure:** $100-500/month (depending on user growth)
- **Marketing:** $200-1000/month (ads, content, community)

---

## Decision Log

### Decision 1: React + TypeScript (No Vue/Svelte)

**Date:** November 17, 2025  
**Context:** Choosing frontend framework for MVP  
**Decision:** React 18 + TypeScript  
**Rationale:**  
- Largest ecosystem and hiring pool
- Best Tone.js integration examples
- AI agents (Claude Code) most familiar with React
- TypeScript prevents runtime errors in audio code

**Consequences:**  
- Slightly larger bundle size than Svelte
- More boilerplate than Vue
- Accepted tradeoff for stability and ecosystem

---

### Decision 2: Local-Only MVP (No Cloud Backend)

**Date:** November 17, 2025  
**Context:** MVP scope definition  
**Decision:** No cloud backend, server, or database in Phase 1  
**Rationale:**  
- Faster MVP (no backend code)
- Lower cost (no hosting fees)
- User privacy (no data collection)
- Sufficient for solo developer use case

**Consequences:**  
- No cloud save/sync (manual export/import)
- No collaboration features
- No user accounts
- Must add later (Phase 3) - potential refactor

---

### Decision 3: Zustand Over Redux/MobX

**Date:** November 17, 2025  
**Context:** Choosing state management library  
**Decision:** Zustand 4.4+  
**Rationale:**  
- Simpler API than Redux (less boilerplate)
- JSON-serializable state (easy export)
- Excellent TypeScript support
- Small bundle size (3KB vs Redux 15KB)

**Consequences:**  
- Less community resources than Redux
- May need custom middleware for advanced features
- Accepted tradeoff for simplicity

---

### Decision 4: Anthropic Claude for Cloud AI (Not OpenAI)

**Date:** November 17, 2025  
**Context:** Choosing cloud LLM provider  
**Decision:** Anthropic Claude Sonnet 3.5  
**Rationale:**  
- Better structured output (JSON patches)
- Longer context window (200K tokens)
- Fewer refusals for creative tasks
- Personal preference (you're already using Claude)

**Consequences:**  
- API costs ~2x OpenAI ($3 vs $1.5 per million tokens)
- Smaller ecosystem than OpenAI
- Accepted tradeoff for quality

---

### Decision 5: GarageBand-Level UI (Not Pro-DAW Complexity)

**Date:** November 17, 2025  
**Context:** Defining UI complexity target  
**Decision:** Simple, visual UI like GarageBand (not Ableton/FL Studio)  
**Rationale:**  
- Target audience is indie devs + non-technical composers
- Reduces development time (fewer features)
- Lowers barrier to entry (wider adoption)
- AI assistant compensates for hidden complexity

**Consequences:**  
- Power users may want more control
- May need "Advanced Mode" toggle later
- Some features hidden/simplified
- Accepted tradeoff for usability

---

## Appendices

### Backlog (Unscheduled Features)

**Nice-to-Have (Low Priority):**
- Dark mode theme
- Keyboard shortcuts customization
- Undo/redo history viewer
- Audio waveform visualization
- BPM tap tempo
- Metronome click track
- Scene transition editor (crossfades)
- MIDI clock sync (for external hardware)
- Accessibility: high contrast mode
- Localization (i18n) - Spanish, Japanese, French

**Experimental (Research Needed):**
- AI mastering (auto-EQ, compression)
- Style transfer (make it sound like X artist)
- Procedural sound design (not just music)
- Binaural/spatial audio
- Generative visuals (music visualization)

### Ideas Parking Lot

**From design doc (deferred to future):**
- Transitions with conditions (if danger > 0.8, switch scenes)
- Mapping system (game variables → music parameters)
- External service integrations (Freesound.org, Splice)

**Community requests (future):**
- Mobile app (iOS/Android)
- VR/AR support
- Game engine marketplace (Unity Asset Store, Godot Asset Library)

---

## Next Steps

**Week 1 (Now):**
1. Review and approve this documentation ✅
2. Set up development environment (Vite + React + TS)
3. Install dependencies (Tone.js, Zustand, Radix UI)
4. Create project structure (folders, files)
5. Initialize Git repository

**Week 2:**
1. Implement type system (Project, Scene, Track, Clip)
2. Build Zustand store (scene CRUD operations)
3. Create audio engine foundation (Tone.js initialization)
4. Build basic UI (scene board, scene card components)
5. First playable sound (test tone)

**Week 3-8:**
Follow implementation order in Technical Specification document.

---

**This roadmap is a living document.**  
**Update weekly based on actual progress and user feedback.**

**Last Updated:** November 17, 2025
