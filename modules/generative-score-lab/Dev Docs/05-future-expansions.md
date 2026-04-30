# Generative Score Lab - Future Expansions & Long-Term Vision

**Version:** 1.0  
**Last Updated:** November 17, 2025  
**Purpose:** Document potential features, improvements, and strategic directions beyond MVP

---

## Document Overview

This document captures **all future possibilities** for Generative Score Lab that are:
- Out of scope for MVP (Phase 1)
- Deferred to later phases
- Experimental or research-required
- Strategic/monetization opportunities

Use this as a **reference for decision-making** when planning Phase 2+.

---

## Table of Contents

1. [Enhanced Generators & Music Features](#1-enhanced-generators--music-features)
2. [Cloud & Collaboration Features](#2-cloud--collaboration-features)
3. [Game Engine Integration](#3-game-engine-integration)
4. [Advanced UI/UX](#4-advanced-uiux)
5. [Performance & Optimization](#5-performance--optimization)
6. [Platform Expansion](#6-platform-expansion)
7. [Monetization Strategies](#7-monetization-strategies)
8. [Community & Ecosystem](#8-community--ecosystem)
9. [AI & Machine Learning](#9-ai--machine-learning)
10. [Enterprise & Professional Features](#10-enterprise--professional-features)

---

## 1. Enhanced Generators & Music Features

### 1.1 Advanced Generators

**Strudel DSL Integration (Phase 2)**
- Full TidalCycles-style pattern language
- Live coding interface with syntax highlighting
- Pattern composition and sequencing
- Community pattern library
- **Benefit:** Power users can write complex patterns in code
- **Effort:** Medium (5-7 days)
- **Risk:** Strudel still in beta, API may change

**Magenta ML Models (Phase 2-3)**
- Melody generation (MelodyRNN, PolyphonyRNN)
- Drum pattern generation (DrumsRNN)
- Performance RNN (expressive timing)
- Style transfer (make it sound like Bach/Jazz)
- **Benefit:** AI-generated music that's musically coherent
- **Effort:** High (10-14 days, requires TensorFlow.js)
- **Risk:** Large model files (bundle size), slow inference

**Audio Stem Generator (Phase 3)**
- AI-powered audio synthesis (not MIDI, actual audio)
- Text-to-audio: "lofi hip hop drums" → generates audio file
- Integration with services like Replicate, Stability AI
- **Benefit:** Non-musicians can generate professional sounds
- **Effort:** Medium (requires cloud API integration)
- **Risk:** Cost per generation, quality inconsistency

**Custom Generator Scripting (Phase 4)**
- JavaScript API for user-defined generators
- Hot-reloading in browser
- Generator marketplace (share/sell custom generators)
- **Benefit:** Infinite extensibility, community contributions
- **Effort:** High (15-20 days, requires sandboxing)
- **Risk:** Security (malicious code), support burden

### 1.2 Advanced Composition Tools

**Visual Node-Based Programming (Phase 4)**
- Max/MSP or Pure Data style patching
- Drag-drop nodes for generators, effects, mappings
- Visual dataflow programming
- Save/load patches
- **Benefit:** Appeals to visual learners, non-coders
- **Effort:** Very High (20-30 days)
- **Risk:** Complexity, steep learning curve

**Chord Progression Builder (Phase 2)**
- Visual chord editor (I-IV-V-I, etc.)
- Roman numeral notation
- Auto-generate bass/harmony from chords
- Genre-specific progressions (jazz, pop, EDM)
- **Benefit:** Helps users create harmonic structure
- **Effort:** Medium (6-8 days)

**Groove Templates (Phase 2)**
- Pre-built rhythm templates (swing, shuffle, straight)
- Humanization (timing variation, velocity variation)
- Apply groove to any pattern
- **Benefit:** More musical, less robotic feel
- **Effort:** Low-Medium (3-5 days)

**MIDI Import/Export (Phase 3)**
- Import MIDI files → convert to clips
- Export project as Standard MIDI File
- MIDI CC mapping (for hardware controllers)
- **Benefit:** Interoperability with other music software
- **Effort:** Medium (6-8 days)

### 1.3 Audio Effects & Processing

**Effects Chain Editor (Phase 2)**
- Visual routing of effects (reverb → delay → filter)
- Per-track effects
- Master bus effects
- Effect presets library
- **Benefit:** Professional sound design capabilities
- **Effort:** Medium (5-7 days)

**Advanced Effects (Phase 3)**
- Sidechain compression (ducking)
- Modulation (chorus, flanger, phaser)
- Bitcrusher, distortion
- Granular synthesis
- **Benefit:** More creative sound design options
- **Effort:** Medium-High (8-12 days)

**Audio Recording (Phase 3)**
- Record external audio (microphone, line-in)
- Audio editing (trim, fade, normalize)
- Sample library management
- **Benefit:** Use custom sounds, not just synths
- **Effort:** High (10-15 days)

---

## 2. Cloud & Collaboration Features

### 2.1 Cloud Infrastructure (Phase 3)

**User Authentication**
- Email + password (Supabase Auth)
- OAuth providers (Google, GitHub, Discord)
- Anonymous accounts (no email required)
- **Benefit:** Enables cloud save and collaboration
- **Effort:** Medium (5-7 days)

**Cloud Project Storage**
- Auto-save to cloud (like Figma)
- Project versioning (history, rollback)
- Conflict resolution (if edited offline)
- **Benefit:** Never lose work, access from anywhere
- **Effort:** Medium-High (8-10 days)

**Shareable Project Links**
- Public/private sharing
- View-only vs edit permissions
- Embed projects in websites (iframe)
- **Benefit:** Easy sharing with team/clients
- **Effort:** Low-Medium (3-5 days)

### 2.2 Real-Time Collaboration (Phase 3)

**Multiplayer Editing**
- Multiple users edit same project simultaneously
- Live cursors and presence indicators
- CRDT (Conflict-Free Replicated Data Type) for sync
- Chat/comments inside project
- **Benefit:** Like Google Docs for music
- **Effort:** Very High (15-20 days)
- **Risk:** Complex to implement, testing required

**Commenting & Feedback**
- Leave timestamped comments on scenes
- Tag collaborators (@username)
- Resolve/archive comments
- **Benefit:** Better communication with team
- **Effort:** Medium (5-7 days)

### 2.3 Project Management (Phase 3)

**Project Organization**
- Folders/collections
- Tags and labels
- Search and filter
- Recently opened list
- **Benefit:** Better organization for power users
- **Effort:** Low-Medium (4-6 days)

**Project Templates**
- Official templates (Retro Platformer, RPG, Shooter)
- User-generated templates
- Template marketplace
- **Benefit:** Faster start for new projects
- **Effort:** Medium (6-8 days)

---

## 3. Game Engine Integration

### 3.1 Runtime Integration (Phase 4)

**Real-Time WebSocket Protocol**
- Bidirectional communication: Game ↔ Music
- Send game state (HP, enemies, time) → Music responds
- Music sends events (beat, measure, intensity) → Game responds
- **Benefit:** True adaptive music (not just scene switching)
- **Effort:** High (10-12 days)

**Unity Native Plugin (Phase 4)**
- C# library for parsing JSON + playing music
- Inspector integration (drag-drop JSON files)
- Runtime API for scene switching
- **Benefit:** Native Unity workflow (no JSON parsing)
- **Effort:** Very High (20-25 days)
- **Risk:** Requires Unity knowledge, maintenance burden

**Godot Native Plugin (Phase 4)**
- GDScript library for JSON + audio
- Similar to Unity plugin
- **Benefit:** Native Godot workflow
- **Effort:** Very High (20-25 days)

**Web Game Library (Phase 3)**
- JavaScript library for web games
- Phaser, PixiJS, Three.js integration
- Lightweight (< 50KB)
- **Benefit:** Easy integration for web games
- **Effort:** Medium (8-10 days)

### 3.2 Game Engine Marketplace (Phase 4+)

**Unity Asset Store Listing**
- Package as Unity asset
- Video tutorial and documentation
- Paid or free with upsell
- **Benefit:** Reach Unity developers directly
- **Effort:** Medium (marketing, packaging, support)

**Godot Asset Library**
- Similar to Unity Asset Store
- **Benefit:** Reach Godot developers
- **Effort:** Low-Medium

### 3.3 Export Formats (Phase 3-4)

**DAW Project Export**
- Ableton Live (.als) project files
- FL Studio (.flp) project files
- Logic Pro (.logic) project files
- **Benefit:** Use Generative Score Lab as MIDI generator for DAW
- **Effort:** Very High (15-20 days per DAW)
- **Risk:** Reverse engineering proprietary formats

**Audio File Export (Phase 3)**
- Render scenes to WAV/MP3/OGG
- Batch export (all scenes)
- Stem export (separate tracks)
- **Benefit:** Use in any game engine (not just JSON)
- **Effort:** Medium (6-8 days)

**MusicXML Export (Phase 3)**
- Standard sheet music format
- Import into Sibelius, Finale
- **Benefit:** Musicians can print/read scores
- **Effort:** High (10-12 days)

---

## 4. Advanced UI/UX

### 4.1 Visual Enhancements (Phase 2-3)

**Waveform Visualization**
- Real-time audio waveform display
- Frequency spectrum analyzer
- Oscilloscope view
- **Benefit:** Visual feedback for sound design
- **Effort:** Medium (5-7 days)

**Piano Roll Editor**
- Traditional DAW-style note editor
- Click to add/remove/edit notes
- Velocity, duration, pan editing
- **Benefit:** Fine-grained control for musicians
- **Effort:** High (12-15 days)

**Automation Curves**
- Draw parameter automation (volume, pan, effects)
- Bezier curve handles
- LFO modulation
- **Benefit:** Expressive, evolving sounds
- **Effort:** High (10-12 days)

**Dark Mode (Phase 2)**
- Toggle light/dark theme
- Respect OS preference
- **Benefit:** User preference, eye strain reduction
- **Effort:** Low (2-3 days)

### 4.2 Workflow Improvements (Phase 2-3)

**Keyboard Shortcuts Customization**
- User-defined shortcuts
- Cheat sheet overlay (Cmd/Ctrl + ?)
- **Benefit:** Power user efficiency
- **Effort:** Low-Medium (3-4 days)

**Undo/Redo History Viewer**
- Visual timeline of changes
- Jump to any point in history
- Branch history (undo tree)
- **Benefit:** Fearless experimentation
- **Effort:** Medium (5-7 days)

**Multi-Track Selection & Editing**
- Select multiple tracks/clips
- Bulk operations (delete, mute, transpose)
- **Benefit:** Faster editing of large projects
- **Effort:** Medium (4-6 days)

**Copy/Paste Between Projects**
- Copy scenes/tracks from one project to another
- Paste with key/tempo adjustment
- **Benefit:** Reuse work across projects
- **Effort:** Medium (5-7 days)

### 4.3 Accessibility (Phase 2-3)

**Screen Reader Optimization**
- Detailed ARIA labels
- Keyboard-only navigation
- Announce state changes
- **Benefit:** Inclusive design for blind/low-vision users
- **Effort:** Medium (5-7 days)

**High Contrast Mode**
- WCAG AAA compliance (7:1 contrast)
- Colorblind-friendly palette
- **Benefit:** Visual accessibility
- **Effort:** Low-Medium (3-4 days)

**Localization (i18n)**
- Multi-language support
- Spanish, Japanese, French, German
- RTL language support (Arabic)
- **Benefit:** Global reach
- **Effort:** High (10-15 days + ongoing translation)

---

## 5. Performance & Optimization

### 5.1 Audio Performance (Phase 2-3)

**Web Audio Worklet**
- Move processing to audio thread
- Lower latency (< 10ms possible)
- Prevents UI jank affecting audio
- **Benefit:** Professional-grade audio performance
- **Effort:** High (8-10 days)
- **Risk:** Browser support varies

**WebAssembly Generators**
- Compile hot-path algorithms to WASM
- 10x speed improvement for complex generators
- **Benefit:** Faster pattern generation
- **Effort:** Very High (15-20 days)
- **Risk:** Requires Rust/C++ knowledge

**Audio Buffer Pooling**
- Reuse buffers (reduce garbage collection)
- Pre-allocate memory for real-time use
- **Benefit:** Fewer dropouts, smoother playback
- **Effort:** Medium (5-7 days)

### 5.2 Bundle Size Optimization (Phase 2-3)

**Code Splitting**
- Lazy load generators (only when used)
- Route-based splitting
- Dynamic imports
- **Benefit:** Faster initial load (< 200KB)
- **Effort:** Low-Medium (3-5 days)

**Tree Shaking**
- Remove unused Tone.js modules
- Optimize Radix UI imports
- **Benefit:** Smaller bundle size
- **Effort:** Low (1-2 days)

**Asset Optimization**
- Compress audio samples
- WebP images (instead of PNG)
- Inline critical CSS
- **Benefit:** Faster load times
- **Effort:** Low (2-3 days)

### 5.3 Scalability (Phase 3-4)

**Offline-First Architecture**
- Service Worker caching
- IndexedDB for large projects
- Background sync
- **Benefit:** Works without internet (PWA)
- **Effort:** High (10-12 days)

**Web Workers for Heavy Computation**
- Generate patterns in background thread
- Export processing in Web Worker
- **Benefit:** UI stays responsive
- **Effort:** Medium (5-7 days)

---

## 6. Platform Expansion

### 6.1 Desktop App (Phase 4+)

**Electron Wrapper**
- Native macOS/Windows/Linux app
- Better file system access
- Offline installation
- **Benefit:** Professional users prefer desktop apps
- **Effort:** Medium (8-10 days)
- **Risk:** Large download size (100-200MB)

**Native Menu Integration**
- File → Open, Save, Export
- Edit → Undo, Redo, Copy, Paste
- Window → Minimize, Maximize
- **Benefit:** Familiar UX for desktop users
- **Effort:** Low-Medium (3-5 days)

**VST/AU Plugin (Phase 4+)**
- Embed as plugin in DAWs
- Host as instrument or effect
- Sync tempo with DAW
- **Benefit:** Integrate with traditional production workflow
- **Effort:** Very High (30-40 days)
- **Risk:** Platform-specific code, complex audio routing

### 6.2 Mobile App (Phase 4+)

**iOS App (React Native)**
- Native iOS UI
- Touch-optimized controls
- iCloud sync
- **Benefit:** Create music on iPad/iPhone
- **Effort:** Very High (20-30 days)
- **Risk:** App Store approval, 30% fee

**Android App (React Native)**
- Similar to iOS app
- **Benefit:** Reach Android users
- **Effort:** Very High (20-30 days)

**Mobile-Specific Features**
- Multi-touch gestures (pinch-zoom, swipe)
- Accelerometer input (tilt to control parameters)
- Split-screen mode (reference + editing)
- **Benefit:** Mobile-native UX
- **Effort:** Medium (added to mobile app build)

### 6.3 Hardware Integration (Phase 5+)

**MIDI Controller Support**
- Keyboard input (play notes live)
- Knobs/faders (control parameters)
- Transport controls (play/stop)
- **Benefit:** Hands-on control for musicians
- **Effort:** Medium (6-8 days)

**Ableton Push / Launchpad Integration**
- Grid-based pattern entry
- LED feedback
- **Benefit:** Hardware workflow enthusiasts
- **Effort:** High (10-15 days)

---

## 7. Monetization Strategies

### 7.1 Open Core Model (Recommended)

**Free Tier (Open Source)**
- Core composition engine
- Basic generators (Euclidean, Arp, Markov)
- Local file management
- JSON export
- Local LLM support
- **Goal:** Maximum adoption, community trust

**Pro Tier ($15-25/month)**
- Cloud save & sync (unlimited projects)
- Cloud AI assistant (unlimited usage)
- Advanced generators (Magenta, Strudel, audio stems)
- Real-time collaboration (3 collaborators)
- Priority support (24h response)
- Export to more formats (MIDI, audio, DAW projects)
- **Goal:** Convert 5-10% of active users

**Enterprise Tier ($299+/month)**
- White-label embedding
- API access (programmatic composition)
- Team management (SSO, roles, permissions)
- Custom integrations (consulting)
- SLA guarantee (99.9% uptime)
- Dedicated support
- **Goal:** High-value B2B customers

### 7.2 Hosted SaaS Model (Alternative)

**Free Tier**
- 3 projects max
- 10 scenes per project
- Basic generators only
- Community support
- **Goal:** Try before you buy

**Starter ($9/month)**
- Unlimited projects
- Unlimited scenes
- All generators
- Cloud save
- **Goal:** Hobbyists, students

**Pro ($29/month)**
- Everything in Starter
- Collaboration (5 users)
- Priority support
- Advanced features
- **Goal:** Professionals

### 7.3 Asset Marketplace (20% Commission)

**User-Generated Content**
- Instrument presets
- Generator scripts
- Scene templates
- Effect chains
- **Revenue Share:** 80% creator, 20% platform
- **Benefit:** Passive income for creators, variety for users

**Official Packs**
- Genre-specific bundles (EDM, Retro, Orchestral)
- Sound design packs (cinematic, horror, sci-fi)
- $5-30 per pack
- **Benefit:** Additional revenue, professional quality

### 7.4 Additional Revenue Streams

**Courses & Tutorials**
- "Adaptive Music 101" (video course)
- "Advanced Generator Scripting"
- $50-200 per course
- **Benefit:** Educational, builds authority

**Consulting Services**
- Custom game integration ($500-2000/project)
- Music production consulting ($150/hour)
- **Benefit:** High-margin, relationship building

**Sponsorships**
- Indie game studios sponsor development
- Hardware companies (MIDI controller manufacturers)
- **Benefit:** Non-user revenue, partnerships

**API Access**
- Pay-per-use API ($0.01 per generation)
- Use Generative Score Lab programmatically
- **Benefit:** B2B revenue, automation use cases

### 7.5 Freemium Feature Gating Strategy

**Free Features (Always)**
- Scene creation & editing
- Basic generators (Euclidean, Arp)
- Local JSON export
- Local LLM support
- Tutorial & documentation
- Community forum access

**Pro Features (Paywall)**
- Cloud save (after 3 projects)
- Advanced generators (Magenta, Strudel, audio stems)
- Collaboration (real-time multiplayer)
- Export formats (MIDI, audio, DAW projects)
- AI assistant (cloud backend, unlimited usage)
- Priority support

**Implementation:**
- Soft paywall (try Pro features 3 times free)
- Upgrade prompts (non-intrusive)
- Annual discount (2 months free)

---

## 8. Community & Ecosystem

### 8.1 Open Source Community (Phase 2+)

**GitHub Repository**
- MIT licensed (open source)
- Accept pull requests
- Issue tracker for bugs/features
- Contributor guidelines
- **Benefit:** Community contributions, transparency

**Documentation Site**
- API reference
- Generator development guide
- Integration examples
- Video tutorials
- **Benefit:** Self-service support, SEO

**Community Forum**
- Discussion board (Discourse or similar)
- Show & Tell (user projects)
- Feature requests
- Troubleshooting
- **Benefit:** User-to-user support, feedback

### 8.2 Content Creation (Phase 2+)

**YouTube Channel**
- Tutorials (beginner to advanced)
- Feature showcases
- Guest interviews (game developers)
- **Benefit:** Brand awareness, SEO, education

**Blog/Newsletter**
- Release notes & changelogs
- Case studies (indie devs using the tool)
- Music theory & game audio articles
- **Benefit:** SEO, thought leadership

**Social Media**
- Twitter/X (announcements, tips)
- Discord (real-time community)
- Reddit (r/gamedev, r/WeAreTheMusicMakers)
- **Benefit:** Community building, feedback

### 8.3 Partnerships (Phase 3+)

**Game Engine Partnerships**
- Co-marketing with Unity/Godot
- Featured in Unity Asset Store
- **Benefit:** Credibility, distribution

**Music Software Partnerships**
- Integration with Ableton, FL Studio
- Cross-promotion
- **Benefit:** Reach music producers

**Education Partnerships**
- University licensing (music/game programs)
- Online course platforms (Udemy, Skillshare)
- **Benefit:** Recurring revenue, brand awareness

### 8.4 Events & Competitions (Phase 3+)

**Game Jams**
- Sponsor game jams with free Pro access
- Music-focused game jam
- **Benefit:** User acquisition, showcase

**Music Challenges**
- Monthly composition contests
- Prize: Featured on homepage, free Pro tier
- **Benefit:** Engagement, user-generated content

**Conferences**
- Sponsor/attend GDC, IndieCade, PAX
- Host workshops
- **Benefit:** B2B networking, brand awareness

---

## 9. AI & Machine Learning

### 9.1 Advanced AI Features (Phase 3-4)

**AI Composition from Text Prompt**
- "Generate epic boss battle music"
- Full scene generated (tracks, generators, effects)
- **Benefit:** Zero-to-music in seconds
- **Effort:** Very High (20-30 days)
- **Risk:** Quality control, unpredictable output

**Style Transfer**
- "Make this sound like Hans Zimmer"
- "Apply lo-fi hip hop vibes"
- Analyze reference, apply style
- **Benefit:** Creative inspiration, genre exploration
- **Effort:** High (15-20 days)

**Intelligent Arrangement**
- AI suggests track additions ("This needs a pad")
- Balance suggestions ("Bass is too loud")
- **Benefit:** Learning tool, quality improvement
- **Effort:** High (12-15 days)

**Personalized Recommendations**
- "Users who made X also used Y generator"
- ML-based preset recommendations
- **Benefit:** Discovery, engagement
- **Effort:** Medium (8-10 days)

### 9.2 Custom Model Training (Phase 4+)

**Train on User's Music**
- Upload reference tracks
- Fine-tune Magenta models on user style
- Generate music in user's unique style
- **Benefit:** Personalized AI, copyright-free
- **Effort:** Very High (30-40 days)
- **Risk:** Computational cost, data privacy

**Collaborative Filtering**
- Learn from community patterns
- Suggest generators based on similar users
- **Benefit:** Better recommendations
- **Effort:** Medium (8-10 days)

---

## 10. Enterprise & Professional Features

### 10.1 Team Collaboration (Phase 3-4)

**Team Workspaces**
- Shared project libraries
- Team billing (single invoice)
- Centralized admin dashboard
- **Benefit:** B2B sales, higher LTV

**Role-Based Access Control**
- Owner, Admin, Editor, Viewer roles
- Granular permissions
- **Benefit:** Enterprise security requirements

**Audit Logs**
- Track all changes (who, what, when)
- Export logs for compliance
- **Benefit:** Enterprise accountability

### 10.2 White-Label & Embedding (Phase 4+)

**White-Label Version**
- Custom branding (logo, colors)
- Custom domain
- Remove "Powered by Generative Score Lab"
- **Benefit:** Enterprise customers, high margin

**Embeddable Widget**
- Embed composition interface in other apps
- iframe or Web Component
- **Benefit:** OEM partnerships, licensing revenue

**API-Only Access**
- Headless backend (no UI)
- Programmatic composition
- **Benefit:** B2B integrations, automation

### 10.3 Enterprise Support (Phase 4+)

**Dedicated Account Manager**
- Onboarding assistance
- Regular check-ins
- Custom integrations
- **Benefit:** High-touch sales, retention

**SLA Guarantees**
- 99.9% uptime
- < 1h response time for critical issues
- **Benefit:** Enterprise trust, higher pricing

**Custom Training & Workshops**
- On-site or virtual training
- Game audio best practices
- **Benefit:** Consulting revenue, relationships

---

## Strategic Recommendations

### Phase 2 (Months 3-4) - Focus Areas:
1. **Enhanced Generators:** Strudel, Magenta, effects chain
2. **UI Polish:** Dark mode, keyboard shortcuts, accessibility
3. **Documentation:** Video tutorials, API reference
4. **Community:** Launch Discord, start blog

### Phase 3 (Months 5-8) - Focus Areas:
1. **Cloud Features:** Authentication, cloud save, sharing
2. **Collaboration:** Real-time multiplayer, comments
3. **Monetization:** Implement Pro tier, billing
4. **Mobile:** Start React Native prototypes

### Phase 4 (Months 9-12) - Focus Areas:
1. **Game Integration:** Unity/Godot plugins, WebSocket protocol
2. **Advanced Features:** Visual programming, MIDI I/O
3. **Platform Expansion:** Desktop app, mobile apps
4. **Enterprise:** White-label, API access

### Phase 5+ (Year 2) - Focus Areas:
1. **Scale:** Multi-region infrastructure, performance
2. **AI Research:** Custom model training, style transfer
3. **Ecosystem:** Marketplace, partnerships, events
4. **Global:** Localization, international expansion

---

## Metrics to Track (Post-MVP)

**Acquisition:**
- New signups per week
- Traffic sources (organic, referral, paid)
- Conversion rate (visitor → signup)

**Activation:**
- % of users who complete tutorial
- Time to first export
- Projects created per user

**Retention:**
- Weekly/monthly active users (WAU/MAU)
- Churn rate
- Return rate (after 7/30 days)

**Revenue:**
- Monthly recurring revenue (MRR)
- Average revenue per user (ARPU)
- Free → Pro conversion rate
- Lifetime value (LTV)

**Engagement:**
- Projects per user
- Scenes per project
- AI requests per user
- Collaboration sessions

**Product:**
- Feature usage (which generators most used?)
- Error rates
- Performance metrics (audio dropouts, latency)
- Support tickets per user

---

## Conclusion

This document is a **living roadmap** of possibilities. Not everything will be built - prioritize based on:
1. **User feedback** (what do people actually want?)
2. **Business impact** (what drives revenue/growth?)
3. **Technical feasibility** (what can we realistically build?)
4. **Strategic alignment** (what fits the long-term vision?)

**Update this document quarterly** as you learn more about your users and market.

---

**Last Updated:** November 17, 2025  
**Last Verified:** November 17, 2025 (against codebase v1.0.0)  
**Next Review:** February 2026 (post-MVP launch)

**Note:** The current implementation supports multiple AI providers (OpenRouter, Minimax, GLM, Ollama), providing flexibility for future expansion and user choice.
