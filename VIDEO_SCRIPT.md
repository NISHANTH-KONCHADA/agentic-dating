# VIDEO_SCRIPT.md — 3-Minute Shot-by-Shot

## Target: 3:00 max. One take. Record at 1080p. Dark room, browser at full width.

---

## 00:00–00:20 | Hook + Concept

**Screen:** Open `/` — the landing page
- Brief pause on the hero: "Your agent dates so you don't have to"
- Point at the live-dot badge: "25+ real people pre-analyzed, agents dating right now"
- Click "Watch the demo run" → navigate to `/demo`

**Voiceover:** "What if an AI could read your LinkedIn, your Instagram, and figure out who you'd actually click with? That's what we built."

---

## 00:20–01:00 | Agent Reading + Profile Page

**Screen:** `/demo` — grid of 30 people

1. Click **Lenny Rachitsky** → `/p/[lennys-id]`
2. Scroll slowly, pointing out:
   - Profile photo, tagline: "Probably annotating a product roadmap right now"
   - **Needs section** — hover over a need, point at evidence quote + confidence score
   - **Interests** — show depth badges (obsessed / serious / casual)
   - **Radar chart** — "This is the 7-dimension personality radar from LinkedIn + Instagram"
   - **Agent Voice card** — "This is how Lenny's agent speaks on his behalf"
3. Click "Who fits best" → `/rankings/[lennys-id]`
   - Quick scan of top 5 matches, point at mutual match badge

**Voiceover:** "The agent reads both profiles in two passes. First it extracts every verifiable fact. Then it synthesizes: needs, hobbies, interests — all with confidence scores and evidence quotes."

---

## 01:00–02:00 | The Agents Actually Dating

**Screen:** Navigate to `/dates` → click on a top mutual match date

1. Point at scene banner: "☕ Coffee Shop — Sunday morning"
2. Slowly scroll through 8-10 turn transcript:
   - "Notice how Lenny's agent asks about ambition and building — that's his core need"
   - "Paige's agent pushes back here — no sycophancy"
   - "This is a real conversation, not templated responses"
3. After transcript — scroll to **verdict cards** side by side
   - "Chemistry: 8/10, Values match: 9/10, Would see again: Yes"
   - Point at the mutual match banner: "💘 Both agents want to see each other again"
4. Optionally click to a second date that went badly — show friction

**Voiceover:** "Each agent speaks in its person's voice. It knows nothing about the other person before the date. 8 to 10 turns, honest reactions, real friction when it exists."

---

## 02:00–02:40 | Rankings + Heat Matrix

**Screen:** `/rankings`

1. Show **Mutual Matches** top section — 6 cards with couple photos and scores
2. Scroll to **heat matrix** — "This is compatibility for all 25 people, every cell clickable"
3. Hover over a bright green cell — tooltip shows "89/100"
4. Click a cell → goes to that date transcript (demonstrates it's fully clickable)
5. Navigate to `/rankings/[lennys-id]` — full ranked list
   - Point at rank 1: lime badge, "Mutual Match", why-you-fit, link to transcript
   - Show rank 5: predicted, lower score, no date

**Voiceover:** "Scores are a weighted blend: 50% how you felt after the date, 25% how they felt about you, 25% pre-screen — plus a bonus if it's mutual."

---

## 02:40–03:00 | Architecture + Try It

**Screen:** `/how-it-works` — briefly

1. Show the data flow diagram (5 seconds)
2. Navigate to `/try`
3. Type in two URLs — LinkedIn + Instagram
4. Click "Run Agents" — show the progress stepper animate through steps
5. Point: "Any public profile works — paste yours and you'll date all 30"

**Voiceover:** "Apify scrapes. Claude analyzes. Agents date. Rankings computed. The whole stack: Next.js, Postgres, Claude claude-sonnet-4-6, Apify. Open source on GitHub."

**End card:** Brief hold on homepage logo.

---

## People to click in video (exact URLs):

1. `/p/[lenny-rachitsky-id]` — strong profile, great analysis
2. `/dates/[lenny-paige-date-id]` — mutual match, great chemistry  
3. `/dates/[high-friction-date-id]` — one that went poorly (shows honesty)
4. `/rankings/[lenny-id]` — his full ranked list

*(Fill in actual IDs after pipeline run)*

---

## Recording tips:
- Browser zoom: 90% to fit more content
- Hide bookmarks bar
- Use Chrome/Arc for best font rendering
- Mic: speak clearly, match voiceover pace to scroll speed
- No edits needed if flow is one take
