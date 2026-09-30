export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-3">How It Works</h1>
        <p className="text-zinc-400">The complete architecture of Agentic Dating — from public profiles to ranked matches.</p>
      </div>

      {/* Architecture diagram */}
      <div className="card-surface p-8 mb-10">
        <h2 className="text-sm font-semibold text-zinc-300 mb-6 uppercase tracking-wider">Architecture</h2>
        <div className="flex flex-col gap-2 font-mono text-sm">
          {[
            { label: 'LinkedIn', sub: 'public profile', icon: '🔗' },
            { label: '+' },
            { label: 'Instagram', sub: 'public profile', icon: '📸' },
            { label: '↓', note: 'Apify scraping (harvestapi + apify/instagram-profile-scraper)' },
            { label: 'Raw Data', sub: 'structured JSON, cached in Postgres', icon: '📦' },
            { label: '↓', note: 'Claude claude-sonnet-4-6, 2-pass analysis with Zod validation' },
            { label: 'PersonProfile', sub: 'needs · hobbies · interests · values · persona card', icon: '🧠' },
            { label: '↓', note: 'Cheap fast pre-screen: 300 pairs, 7-dimension rubric' },
            { label: 'Top-5 Matches', sub: 'per person, ranked by pre-screen score', icon: '📊' },
            { label: '↓', note: 'Full date engine: 8-10 turns, each agent in its person\'s voice' },
            { label: 'Date Transcripts + Verdicts', sub: 'chemistry · valuesMatch · wouldSeeAgain · finalScore', icon: '💬' },
            { label: '↓', note: 'Weighted blend: 50% own score + 25% their score + 25% prescreen + mutual bonus' },
            { label: 'Rankings', sub: 'per person · global leaderboard · heat matrix', icon: '🏆' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              {item.icon ? (
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6">{item.icon}</span>
                  <div>
                    <span className="text-zinc-200">{item.label}</span>
                    {item.sub && <span className="text-zinc-500 ml-2 text-xs">{item.sub}</span>}
                  </div>
                </div>
              ) : item.label === '↓' ? (
                <div className="flex items-center gap-3 py-1">
                  <span className="text-lime-400 w-6 text-center">{item.label}</span>
                  {item.note && <span className="text-xs text-zinc-600 italic">{item.note}</span>}
                </div>
              ) : (
                <span className="text-zinc-500 w-6 text-center">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-8">
        {[
          {
            num: '1',
            title: 'Reader/Analyst Agent',
            color: 'lime',
            content: `For each person, the agent runs a two-pass analysis:
            
**Pass 1 — Extraction:** Pulls raw facts from both sources: career history, education, locations visited, post captions, hashtags, writing style, recurring themes, emoji usage.

**Pass 2 — Synthesis:** Converts facts into a structured PersonProfile: needs (with why + evidence + confidence), hobbies (with source attribution), interests (with depth rating), values, communication style, lifestyle, humor style, and a persona_card defining how they write and speak.

All inferences carry a confidence score (0–1) and an evidence quote. Nothing is fabricated.`,
          },
          {
            num: '2',
            title: 'Pre-screen Engine',
            color: 'orange',
            content: `25 people = 300 unique pairs. Each pair gets a fast compatibility rubric from both directions (A's fit for B ≠ B's fit for A):

• **Values alignment** — do they care about the same things?
• **Lifestyle overlap** — travel, fitness, city vs nature, food
• **Ambition compatibility** — career drive match/complement
• **Interest overlap** — shared topics and depth
• **Complementarity** — do they fill each other's gaps?
• **Communication fit** — compatible styles (direct + direct, humor + humor)
• **Need satisfaction** — can they meet each other's stated needs?

Results cached in Postgres. Top 5 matches per person proceed to full dates.`,
          },
          {
            num: '3',
            title: 'The Date Engine',
            color: 'rose',
            content: `Each agent gets: its person's full PersonProfile + the persona_card + a rule: "you know nothing about your date before they say it."

A random scenario is assigned (coffee shop, rooftop, bookstore, hike, arcade, gallery). 8–10 alternating turns, each agent speaking in its person's voice.

The agents probe each other's needs, share opinions, show their sense of humor, and may disagree — no sycophancy is allowed. After the date, each agent independently scores from its person's POV: chemistry, values match, needs met, friction points, best moment, and final score (0–100).

Full transcripts + verdicts stored and streamable.`,
          },
          {
            num: '4',
            title: 'Ranking Algorithm',
            color: 'blue',
            content: `For every person → candidate pair:

**Final Score = Own post-date score (50%) + Their post-date score (25%) + Pre-screen (25%)**

If both agents say "would see again" → mutual match bonus (×1.1, capped at 100).

For pairs with no full date → pre-screen only, marked "Predicted".

Rankings display: score, mutual/one-sided badge, "why you fit" (2 lines), friction point, and a direct link to the transcript.

A global leaderboard shows the top mutual matches, and a 25×25 heat matrix visualizes all compatibility scores.`,
          },
        ].map((stage) => (
          <div key={stage.num} className="card-surface p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                stage.color === 'lime' ? 'bg-lime-400 text-zinc-950' :
                stage.color === 'orange' ? 'bg-orange-400 text-zinc-950' :
                stage.color === 'rose' ? 'bg-rose-400 text-zinc-950' :
                'bg-blue-400 text-zinc-950'
              }`}>
                {stage.num}
              </div>
              <h2 className="text-lg font-semibold">{stage.title}</h2>
            </div>
            <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {stage.content.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-medium text-zinc-200 mt-2">{line.replace(/\*\*/g, '')}</p>;
                }
                if (line.startsWith('**')) {
                  const parts = line.split('**');
                  return <p key={i}><span className="font-medium text-zinc-200">{parts[1]}</span>{parts[2]}</p>;
                }
                if (line.startsWith('•')) {
                  return <p key={i} className="flex gap-2"><span className="text-lime-400">•</span><span>{line.slice(1).trim()}</span></p>;
                }
                return <p key={i} className="mt-1">{line}</p>;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div className="mt-10 card-surface p-6">
        <h2 className="text-lg font-semibold mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Frontend', 'Next.js 14 App Router + TypeScript + Tailwind CSS'],
            ['AI', 'Anthropic Claude claude-sonnet-4-6 (analysis + dating)'],
            ['Scraping', 'Apify: apify/instagram-profile-scraper + harvestapi/linkedin-profile-scraper'],
            ['Database', 'PostgreSQL via Prisma ORM'],
            ['Validation', 'Zod (all LLM JSON outputs validated + auto-repaired)'],
            ['Concurrency', 'p-limit (5 concurrent LLM calls), exponential backoff'],
            ['Deploy', 'Railway (persistent Node server, no timeout limits)'],
            ['Ethics', 'Confidence-scored inferences, evidence quotes, no sensitive categories'],
          ].map(([key, val]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">{key}</span>
              <span className="text-zinc-300">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
