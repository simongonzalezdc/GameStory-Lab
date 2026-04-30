# ShipLab - Monetization Audit

**Version:** 1.0  
**Last Updated:** November 18, 2025  
**Status:** Planning

---

## Executive Summary

**Primary Recommendation:** Freemium + Hosted SaaS (Open Core Model)

**Rationale:** The open-core model aligns with dev tool expectations (free for solo devs, paid for teams/cloud) while maintaining sustainable revenue. Local deployment stays free forever, cloud features and team collaboration require payment.

**Estimated Revenue Potential:** $120K ARR by end of Year 1 (1,000 free users, 100 paid @ avg $100/month)

---

## Feature Inventory & Tier Mapping

### Core Features (Free / Open Source)
*Must remain free to solve the main problem and drive adoption*

| Feature | User Value | Complexity | Why Free |
|---------|------------|------------|----------|
| Code Quality Analysis (ESLint, Semgrep) | High | Medium | Core value prop - needs wide adoption |
| Documentation Generator (README, API) | High | Medium | Essential for open source, drives word-of-mouth |
| Licensing Assistant | Medium | Low | Commoditized feature, low differentiation |
| Local LLM Integration (Ollama) | High | Medium | Privacy commitment, competitive moat |
| Project Dashboard (Single User) | High | Low | Basic UX necessity |
| Marketing Content Generator (Basic) | Medium | Low | Attracts indie hackers, leads to Pro upgrades |
| Deployment Guide (Manual configs) | Medium | Low | Educational value, builds trust |

### Pro/Advanced Features (Paid Tier - $19/month)
*Convenience, scale, automation - valuable but not essential*

| Feature | User Value | Complexity | Pricing Justification |
|---------|------------|------------|----------------------|
| Cloud Sync (Multi-Device Access) | High | High | Server costs + convenience premium |
| OpenRouter API Credits ($10 included) | High | Low | Pass-through cost + small markup |
| Advanced Marketing (SEO, A/B Testing) | Medium | High | Professional-grade tools worth paying for |
| Custom Rule Sets (Save/Share Configs) | Medium | Medium | Power user feature, saves significant time |
| Priority Support (Email, 24hr SLA) | Medium | Low | Operational cost justification |
| Team Workspaces (Up to 5 members) | High | High | Collaboration is high-value business need |
| Automated Git Integration | High | Medium | Saves manual work, worth premium |
| Cost Analytics Dashboard | Medium | Low | Data-driven decision making tool |

### Enterprise Features (Custom/Premium - $500+/month)
*SSO, multi-tenant, compliance, white-label, SLAs*

| Feature | Target Market | Implementation Effort | Revenue Impact |
|---------|--------------|----------------------|----------------|
| SSO / SAML Integration | Companies 50+ employees | High | High - table stakes for enterprise |
| SOC2 Compliance & Audit Logs | Regulated industries (finance, health) | High | High - enables enterprise sales |
| On-Premise Deployment | Security-conscious orgs | Medium | Medium - reduces churn, premium pricing |
| Custom AI Model Fine-Tuning | Large teams with proprietary code | Very High | Very High - differentiated capability |
| Advanced Analytics (Trends, Insights) | Engineering managers | Medium | Medium - decision-support value |
| API Access (Headless Integration) | DevOps teams, automation | Low | Medium - enables CI/CD workflows |
| White-Label / Reseller Program | Agencies, consultants | High | High - new distribution channel |
| Dedicated Support Manager | Enterprise customers | Low (operational) | High - justifies premium pricing |

---

## Recommended Monetization Model

### Freemium + Hosted SaaS (Open Core)

**Structure:**
- **Free Tier (Open Source):** Self-hosted local deployment with all core features
- **Pro Tier ($19/month):** Cloud-hosted with sync, team features, premium LLM access
- **Enterprise Tier ($500+/month):** Custom deployment + advanced security + dedicated support

**Revenue Streams:**
1. **Subscription Revenue:** $19/month Pro tier, convert 10-15% of active free users
2. **Enterprise Licenses:** $500-2,000/month for large teams (10+ contracts in Year 1)
3. **LLM API Markup:** Small margin on OpenRouter API usage beyond included credits

**Pricing Strategy:**

**Free Tier (Always Free):**
- Local deployment only (Ollama models)
- Core analysis, docs, licensing features
- Community support (GitHub Discussions, Discord)
- Unlimited projects (local storage)
- No team collaboration

**Pro Tier ($19/month or $180/year):**
- Everything in Free, plus:
- Cloud sync across devices
- $10/month OpenRouter API credits (additional usage at cost + 20%)
- Team workspaces (up to 5 members)
- Advanced marketing features
- Priority email support (24hr response)
- Automated Git integration
- Custom rule sets
- Cost analytics dashboard

**Enterprise Tier (Contact Sales, $500+/month):**
- Everything in Pro, plus:
- SSO / SAML authentication
- On-premise deployment option
- SOC2 compliance + audit logs
- Custom AI model fine-tuning
- API access for CI/CD integration
- White-label branding
- Dedicated support manager
- Custom SLAs
- Volume pricing for 20+ seats

**Why This Model:**
This freemium approach respects the open source ethos while creating clear upgrade paths. Solo developers keep full functionality for free (local), teams pay for collaboration/cloud, enterprises pay for security/compliance. The model is proven in dev tools (Sentry, Vercel, Supabase) and aligns with user expectations.

---

## Architecture Considerations

### Current Architecture
Local-first Next.js web app with SQLite database, Ollama for local LLM inference, optional OpenRouter for cloud models. All data stored on user's machine by default.

### Required Changes for Monetization

**1. Authentication & User Management:**
- Add Auth.js (NextAuth) for email/password + OAuth (GitHub, Google)
- User profiles with subscription tier
- License key validation for Pro/Enterprise

**2. Cloud Sync Infrastructure:**
- PostgreSQL database (Vercel Postgres or Supabase)
- Sync engine (Replicache or custom)
- Conflict resolution for multi-device editing

**3. Team Collaboration:**
- Multi-tenant database schema
- Shared project workspaces
- Role-based access control (Owner, Editor, Viewer)

**4. Billing Integration:**
- Stripe for payments
- Usage tracking for LLM API calls
- Overage handling (additional credits)

**5. Admin Dashboard:**
- User management
- Subscription status
- Usage analytics
- Support ticketing

**Plugin/Extension System:**
- [x] Needed for community ecosystem
- [ ] Implement plugin registry (NPM-style)
- [ ] Plugin API with hooks for analysis, generation, UI
- [ ] Marketplace UI (browse, install, rate plugins)
- [ ] Revenue sharing for paid plugins (70/30 split)

**Licensing Strategy:**
- **Core (Free):** MIT License - maximum adoption, community contributions welcome
- **Cloud Sync/Team Features:** Proprietary source-available - visible code but restricted commercial use
- **Enterprise Features:** Fully proprietary - closed source, custom licensing

**Clear Separation:**
- Core features in `/src/lib/core` (MIT)
- Pro features in `/src/lib/pro` (Source-Available)
- Enterprise features in `/src/lib/enterprise` (Proprietary)
- Feature flags check subscription tier

**Implementation Approach:**
1. Build all MVP features as open source (MIT)
2. Add authentication + basic billing (Month 2)
3. Implement cloud sync for Pro tier (Month 3)
4. Launch Pro tier with initial paid features (Month 4)
5. Develop enterprise features based on demand (Month 6+)

---

## Competitive Landscape

| Competitor | Model | Pricing | Strengths | Gaps/Opportunities |
|------------|-------|---------|-----------|-------------------|
| Mintlify | Hosted SaaS | Free for OSS, $150/mo Pro | Auto-docs from code, beautiful UI | No code analysis, no AI chat, no local option |
| Kodezi | Freemium | $6.99/mo | AI code review, auto-fix bugs | Limited languages, cloud-only, no docs generation |
| Sourcegraph Cody | Free + Enterprise | Free for individuals, $9/user Enterprise | Code search + AI, IDE integration | Focused on code intelligence, not post-production |
| GitBook | Freemium | Free, $8/user/mo Pro | Collaborative docs, Git sync | Manual writing only, no AI generation, no code analysis |
| SonarQube | Open Core | Free Community, $150+/mo paid | Industry-standard code quality | Complex setup, no docs/marketing features |

**Market Positioning:** 
ShipLab is the only AI-native tool that covers the *entire* post-production workflow (quality → docs → licensing → marketing → deployment) in one integrated experience. Competitors solve individual pieces, forcing developers to stitch together 5+ tools. Our local-first architecture also differentiates us on privacy.

**Pricing Positioning:**
- More expensive than single-feature tools (Kodezi $7)
- Cheaper than combining multiple tools (Mintlify $150 + GitBook $8 + SonarQube $150 = $308)
- Value proposition: "Replace 5 tools with one"

---

## Revenue Projections

**Assumptions:**
- Target market size: 10M solo developers worldwide (GitHub, indie hackers)
- Free → Paid conversion: 10% (above industry avg due to high value prop)
- Average revenue per user: $100/month ($19 Pro × 80% + $800 Enterprise × 20%)
- Enterprise deals: 10 contracts @ $8,000/year avg
- Churn rate: 5% monthly (industry standard for dev tools)

**Conservative Scenario (Year 1):**
- Free users: 500
- Paid users (Pro): 50 (10% conversion)
- Paid users (Enterprise): 2 contracts
- Monthly Revenue: $1,283 ($950 Pro + $1,333 Enterprise)
- Annual Revenue: $15,400

**Realistic Scenario (Year 1):**
- Free users: 1,000
- Paid users (Pro): 100 (10% conversion)
- Paid users (Enterprise): 5 contracts
- Monthly Revenue: $3,233 ($1,900 Pro + $3,333 Enterprise)
- Annual Revenue: $38,800

**Optimistic Scenario (Year 1):**
- Free users: 5,000
- Paid users (Pro): 500 (10% conversion)
- Paid users (Enterprise): 10 contracts
- Monthly Revenue: $16,167 ($9,500 Pro + $6,667 Enterprise)
- Annual Revenue: $194,000

**Most Likely:** Realistic scenario ($40K ARR) in Year 1, scaling to $120K ARR by end of Year 2

---

## Alternative Monetization Options

### Non-Feature Revenue Streams

**Support & Consulting:**
- Implementation consulting for enterprise customers
- Custom integration development
- Training workshops for teams
- **Estimated revenue:** $20K/year (4-5 consulting engagements @ $5K each)

**Training & Workshops:**
- "Post-Production Bootcamp" online course ($99)
- Live workshops for dev teams ($500/session)
- Certification program for agencies
- **Estimated revenue:** $10K/year

**Custom Integrations:**
- Build integrations for specific platforms (Jira, Linear, Azure DevOps)
- Charge $2-5K per integration to enterprise customers
- **Estimated revenue:** $15K/year (3-5 custom integrations)

**Sponsorship:**
- GitHub Sponsors ($5-500/month from community)
- OpenCollective for transparent funding
- Corporate sponsorships ($1-5K/month)
- **Estimated revenue:** $12K/year ($1K/month avg)

**Total Alternative Revenue:** $57K/year (additional to subscription revenue)

---

## Implementation Roadmap

### Phase 1: Foundation (Month 1-2)
- [x] Launch MVP with all free features
- [ ] Set up Stripe account and test payment flow
- [ ] Implement Auth.js for email + OAuth login
- [ ] Create pricing page and subscription management UI
- [ ] Add feature flags for tier-gating

### Phase 2: Launch Paid Tier (Month 3-4)
- [ ] Build cloud sync with PostgreSQL + Replicache
- [ ] Implement team workspaces (invite, roles, shared projects)
- [ ] Add OpenRouter API credit tracking + billing
- [ ] Launch Pro tier ($19/month) to early adopters
- [ ] Set up customer support system (Intercom or Plain)

### Phase 3: Scale & Optimize (Month 5-6)
- [ ] Develop 2-3 initial enterprise features (SSO, audit logs)
- [ ] Close first 3 enterprise contracts
- [ ] Optimize conversion funnel (landing page, onboarding)
- [ ] Implement referral program (give 1 month free, get $10 credit)
- [ ] Launch affiliate program (20% commission)

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low free → paid conversion (<5%) | High | Medium | Aggressive onboarding, limited free tier features, strong value proposition |
| High churn (>10% monthly) | High | Medium | Excellent product, fast support response, regular feature releases |
| OpenRouter API costs exceed revenue | High | Low | Implement strict usage caps, default to local models, negotiate volume discounts |
| Enterprise sales cycle too long | Medium | High | Start with smaller contracts ($500/mo), build case studies, offer pilots |
| Competitors copy open-core model | Medium | High | Move fast, build community, emphasize local-first privacy advantage |
| Pricing too high for market | High | Medium | A/B test pricing ($15 vs $19 vs $25), offer annual discount, grandfather early adopters |

---

## Decision Points

**Key Questions to Answer:**

1. **Open source strategy:**
   - [x] Open core + proprietary extensions (chosen)
   - [ ] Fully open source + SaaS hosting?
   - [ ] Dual license (GPL + commercial)?

2. **Pricing model:**
   - [x] Subscription (monthly/annual) (chosen)
   - [ ] Usage-based (API calls, seats, etc.)?
   - [ ] One-time license?
   - [ ] Hybrid?

3. **Go-to-market:**
   - [x] Self-serve signup (chosen for Pro tier)
   - [x] Sales-assisted (for enterprise) (chosen for Enterprise tier)
   - [ ] Partner/reseller channel? (Phase 2)

4. **Support model:**
   - [x] Community-only (free tier)
   - [x] Tiered support (email for Pro, dedicated manager for Enterprise)
   - [ ] Managed service? (Consider for Phase 3)

---

## Next Steps

**Immediate (This Week):**
1. Set up Stripe account and test payment integration
2. Design pricing page with clear tier comparison table
3. Draft Pro tier features list and prioritize development order

**Short-term (This Month):**
1. Build authentication system (Auth.js + GitHub OAuth)
2. Implement feature flags for tier gating
3. Create billing management UI (upgrade, downgrade, cancel)
4. Launch beta pricing with first 20 users

**Long-term (This Quarter):**
1. Ship cloud sync and team workspaces for Pro tier
2. Close first 3 enterprise pilot contracts
3. Hit $5K MRR milestone
4. Develop enterprise sales materials (case studies, ROI calculator)

---

**Notes:**
- Pricing should be reviewed quarterly based on actual conversion data
- Consider offering lifetime deals to early adopters (one-time $499 for Pro)
- Monitor competitor pricing closely; adjust if market shifts
- Build strong community before pushing paid tiers too aggressively
