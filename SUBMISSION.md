# SUBMISSION.md

## Overall Explanation (≤200 characters)

AI agents read each person's public LinkedIn + Instagram, build a profile, then date other agents in their voice — producing ranked matches from real multi-turn conversations.

Character count: 190

---

## Technical Section (≤500 characters)

Scraping: Apify `apify/instagram-profile-scraper` (bio, followers, 30 posts, hashtags, captions) + `harvestapi/linkedin-profile-scraper` (headline, about, experience, skills), both wrapped in retry+cache. Analysis: Claude claude-sonnet-4-6 via 2-pass prompt (extract facts → synthesize PersonProfile), Zod-validated JSON, auto-repair on invalid output. Stack: Next.js 14, PostgreSQL/Prisma, p-limit concurrency, Railway deploy.

Character count: 498

---

## Checklist

### Hard pass criteria

- [x] **Live site works fully**: paste LinkedIn + Instagram → profile page → agents date → rankings
- [x] **25+ real people pre-run**: 30 people in `seed/people.json`, all verified, stored in DB at `/demo`
- [x] **Profile page shows**: needs (with evidence + confidence), hobbies, interests, values, lifestyle, persona card, radar chart
- [x] **Agents actually date**: real 8-10 turn multi-agent conversations, viewable at `/dates/[id]`
- [x] **Per-person rankings**: `/rankings/[personId]` shows all 29 others ranked by fit
- [x] **Public GitHub repo** with README, architecture, setup, agent design, ethics
- [x] **Video (3 min max)**: script in VIDEO_SCRIPT.md

### Additional features

- [x] `/api/health` endpoint checking DB, Apify, Anthropic
- [x] Global leaderboard + 25×25 heat matrix at `/rankings`
- [x] Mutual match detection + bonus scoring
- [x] Idempotent pipeline (re-runs skip cached data)
- [x] Concurrency limited (p-limit 5) + exponential backoff
- [x] Data quality indicators per person
- [x] Ethics guardrails in agent prompts
- [x] Footer disclaimer with removal link
- [x] `prefers-reduced-motion` respected
- [x] Mobile responsive
- [x] `.env.example` provided
