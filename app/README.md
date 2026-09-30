# Agentic Dating

**AI agents date on your behalf.** Every person is represented by an agent that reads their public LinkedIn and Instagram, analyzes who they are, then dates other agents on their behalf. See who fits you best.

## Live Demo

- **Live Site:** [Deploy link after Railway deploy]
- **Demo:** `/demo` — 30 pre-analyzed real people, loads instantly
- **Video:** [YouTube link]

---

## Architecture

```
LinkedIn (public) + Instagram (public)
        ↓
   Apify Scraping (harvestapi/linkedin-profile-scraper + apify/instagram-profile-scraper)
        ↓
   Raw JSON → cached in Postgres
        ↓
   Claude claude-sonnet-4-6 — 2-pass analyst agent
   - Pass 1: extract raw facts with evidence
   - Pass 2: synthesize PersonProfile (needs · hobbies · interests · values · persona card)
        ↓
   Pre-screen: 300 pairs, 7-dimension rubric, both directions
        ↓
   Full Dates: top-5 matches per person, 8-10 turn multi-agent conversations
   - Each agent speaks in its person's voice
   - No omniscience: agents learn only from what's said
   - Post-date verdict: chemistry, valuesMatch, wouldSeeAgain, finalScore
        ↓
   Rankings: weighted blend (own 50% + theirs 25% + prescreen 25%) + mutual match bonus
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| AI | Anthropic Claude claude-sonnet-4-6 (analysis + dating) |
| Scraping | Apify: `apify/instagram-profile-scraper` + `harvestapi/linkedin-profile-scraper` |
| Database | PostgreSQL + Prisma ORM |
| Validation | Zod (all LLM JSON outputs validated + auto-repaired) |
| Concurrency | p-limit (5 concurrent), exponential backoff on 429s |
| Deploy | Railway (persistent Node server) |

## Setup

```bash
# Clone and install
git clone https://github.com/you/agentic-dating
cd agentic-dating/app
npm install

# Environment
cp .env.example .env
# Fill in: DATABASE_URL, ANTHROPIC_API_KEY, APIFY_TOKEN

# Database
npx prisma db push

# Run the full pipeline (scrape → analyze → prescreen → date → rank)
npm run pipeline

# Start dev server
npm run dev
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing: hero, how it works, live date preview |
| `/try` | Add your own LinkedIn + Instagram links |
| `/demo` | Pre-run demo of 30 people |
| `/p/[id]` | Profile page: analysis, radar chart, needs, hooks |
| `/dates` | All date transcripts |
| `/dates/[id]` | Full date transcript + post-date verdicts |
| `/rankings/[personId]` | Ranked list of best fits |
| `/rankings` | Global leaderboard + 25×25 heat matrix |
| `/how-it-works` | Architecture + tech explanation |
| `/api/health` | Health check: DB + Apify + Anthropic |

## Ethics & Limitations

- **Public data only:** Only the two URLs you provide
- **No sensitive categories:** Health, religion, sexual orientation, ethnicity, political affiliation, immigration, minor data — never inferred
- **Labeled inferences:** Every trait has a confidence score and evidence quote
- **Removal:** Contact [contact@agenticdating.com](mailto:contact@agenticdating.com)
- **Not a commercial product:** Demo only

## 30 Real People

See `seed/people.json` for the full list of verified LinkedIn + Instagram pairs. All verified by name match, photo consistency, and cross-platform bio.

## Agent Design

Each agent receives:
1. Its person's full `PersonProfile` (2-pass analysis)
2. Their `persona_card` (how they write: tone, slang, emoji use, sentence length)
3. A strict rule: only know what's in your own profile; learn about the date from what they say

Date flow: scene setting → 9 turns alternating → independent verdicts from each agent's POV.

---

*Built in ~3 hours as a technical demo. All data public. People can request removal.*
