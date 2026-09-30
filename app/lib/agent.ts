import Groq from 'groq-sdk';
import { z } from 'zod';
import type { InstagramData, LinkedInData } from './scraper';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_build' });

// Groq model — use Llama 3.1 70b for quality analysis and dating
const MODEL = 'llama-3.3-70b-versatile';
const FAST_MODEL = 'llama-3.1-8b-instant'; // for prescreen

// Zod schemas for structured output
export const NeedSchema = z.object({
  need: z.string(),
  why: z.string(),
  evidence: z.string(),
  confidence: z.number().min(0).max(1),
});

export const HobbySchema = z.object({
  name: z.string(),
  evidence: z.string(),
  source: z.enum(['linkedin', 'instagram', 'both']),
});

export const InterestSchema = z.object({
  topic: z.string(),
  depth: z.enum(['casual', 'serious', 'obsessed']),
  evidence: z.string(),
});

export const PersonProfileSchema = z.object({
  summary: z.string(),
  tagline: z.string(),
  photoUrl: z.string().optional(),
  handle: z.string().optional(),
  needs: z.array(NeedSchema).min(2).max(6),
  hobbies: z.array(HobbySchema),
  interests: z.array(InterestSchema),
  values: z.array(z.string()),
  communicationStyle: z.string(),
  energy: z.number().min(0).max(1),
  lifestyle: z.object({
    travel: z.boolean(),
    fitness: z.boolean(),
    nightlife: z.boolean(),
    food: z.boolean(),
    pets: z.boolean(),
    cityVsNature: z.enum(['city', 'nature', 'both', 'unknown']),
  }),
  careerDrive: z.number().min(0).max(1),
  humorStyle: z.string(),
  socialStyle: z.string(),
  aesthetic: z.string(),
  dealBreakers: z.array(z.string()),
  greenFlags: z.array(z.string()),
  conversationHooks: z.array(z.string()).length(5),
  personaCard: z.object({
    tone: z.string(),
    slang: z.array(z.string()),
    emojiUse: z.enum(['none', 'minimal', 'moderate', 'heavy']),
    sentenceLength: z.enum(['short', 'medium', 'long', 'mixed']),
    sampleVoice: z.string(),
  }),
  dataQuality: z.object({
    linkedin: z.number().min(0).max(1),
    instagram: z.number().min(0).max(1),
    notes: z.string(),
  }),
  radarEnergy: z.number().min(0).max(10),
  radarAmbition: z.number().min(0).max(10),
  radarSocial: z.number().min(0).max(10),
  radarAdventure: z.number().min(0).max(10),
  radarCreativity: z.number().min(0).max(10),
  radarWarmth: z.number().min(0).max(10),
  radarHumor: z.number().min(0).max(10),
});

export type PersonProfile = z.infer<typeof PersonProfileSchema>;

export const PreScreenSchema = z.object({
  valuesAlignment: z.number().min(0).max(10),
  lifestyleOverlap: z.number().min(0).max(10),
  ambitionCompat: z.number().min(0).max(10),
  interestOverlap: z.number().min(0).max(10),
  complementarity: z.number().min(0).max(10),
  communicationFit: z.number().min(0).max(10),
  needsSatisfaction: z.number().min(0).max(10),
  scoreAtoB: z.number().min(0).max(100),
  scoreBtoA: z.number().min(0).max(100),
});

export type PreScreenResult = z.infer<typeof PreScreenSchema>;

export const DateVerdictSchema = z.object({
  wouldSeeAgain: z.boolean(),
  chemistry: z.number().min(0).max(10),
  valuesMatch: z.number().min(0).max(10),
  needsMet: z.array(z.string()),
  frictionPoints: z.array(z.string()),
  bestMoment: z.string(),
  oneLineReview: z.string(),
  finalScore: z.number().min(0).max(100),
});

export type DateVerdict = z.infer<typeof DateVerdictSchema>;

async function callGroqWithRetry(
  messages: Groq.Chat.ChatCompletionMessageParam[],
  systemPrompt: string,
  model = MODEL,
  maxRetries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      });
      return response.choices[0]?.message?.content || '';
    } catch (err: unknown) {
      if (attempt === maxRetries) throw err;
      const delay = 1000 * Math.pow(2, attempt);
      console.error(`Groq attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('All retries failed');
}

function extractJSON(text: string): unknown {
  // Try to extract JSON from code block first
  const codeBlock = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch { /* fall through */ }
  }
  // Try raw JSON object
  const rawMatch = text.match(/\{[\s\S]*\}/);
  if (rawMatch) {
    try { return JSON.parse(rawMatch[0]); } catch { /* fall through */ }
  }
  throw new Error('No valid JSON found in response');
}

export async function analyzePersonProfile(
  linkedinData: LinkedInData | null,
  instagramData: InstagramData | null,
  personName: string
): Promise<PersonProfile> {
  const linkedinText = linkedinData
    ? `LINKEDIN DATA:
Name: ${linkedinData.fullName}
Headline: ${linkedinData.headline}
About: ${linkedinData.about}
Location: ${linkedinData.location}
Experience: ${JSON.stringify(linkedinData.experience).slice(0, 1000)}
Skills: ${linkedinData.skills.slice(0, 20).join(', ')}
Languages: ${linkedinData.languages.join(', ')}`
    : 'LINKEDIN: Not available';

  const instagramText = instagramData
    ? `INSTAGRAM DATA:
Username: @${instagramData.username}
Bio: ${instagramData.biography}
Followers: ${instagramData.followersCount}
Category: ${instagramData.category || 'none'}
Recent Posts (${instagramData.posts.length}):
${instagramData.posts
  .slice(0, 15)
  .map((p, i) => `[${i + 1}] ${(p.caption || '').slice(0, 200)} | #${p.hashtags.slice(0, 4).join(' #')} | 📍${p.locationName || '?'}`)
  .join('\n')}`
    : 'INSTAGRAM: Not available';

  const systemPrompt = `You are a relationship analyst and psychologist. Analyze public social media profiles to understand who someone is.

ETHICS - NEVER infer or output: health, religion, sexual orientation, ethnicity, political affiliation, immigration, minors.
Label ALL inferences with confidence 0-1. Only use public info.
Return ONLY valid JSON. No preamble.`;

  // Pass 1: Extract facts
  const pass1 = await callGroqWithRetry(
    [{
      role: 'user',
      content: `Analyze ${personName}:\n${linkedinText}\n\n${instagramText}\n\nExtract: career facts, personality signals from writing style, lifestyle from locations/activities/hashtags, communication style, what they care about most.`,
    }],
    systemPrompt
  );

  // Pass 2: Synthesize into PersonProfile
  const pass2 = await callGroqWithRetry(
    [{
      role: 'user',
      content: `Based on this analysis of ${personName}:\n${pass1.slice(0, 2000)}\n\nReturn ONLY this JSON object (no markdown, no explanation):\n{"summary":"2-3 sentence vibe read","tagline":"one punchy tagline","photoUrl":"${instagramData?.profilePicUrl || linkedinData?.profilePicUrl || ''}","handle":"${instagramData?.username || ''}","needs":[{"need":"...","why":"...","evidence":"exact quote","confidence":0.8}],"hobbies":[{"name":"...","evidence":"...","source":"linkedin"}],"interests":[{"topic":"...","depth":"serious","evidence":"..."}],"values":["ambition","creativity"],"communicationStyle":"direct and thoughtful","energy":0.6,"lifestyle":{"travel":true,"fitness":true,"nightlife":false,"food":true,"pets":false,"cityVsNature":"city"},"careerDrive":0.8,"humorStyle":"dry wit","socialStyle":"connector","aesthetic":"minimalist professional","dealBreakers":[],"greenFlags":["intellectually curious","ambitious"],"conversationHooks":["topic1","topic2","topic3","topic4","topic5"],"personaCard":{"tone":"thoughtful and direct","slang":[],"emojiUse":"minimal","sentenceLength":"medium","sampleVoice":"A sentence that sounds like them"},"dataQuality":{"linkedin":0.8,"instagram":0.7,"notes":"good data quality"},"radarEnergy":6,"radarAmbition":9,"radarSocial":6,"radarAdventure":5,"radarCreativity":7,"radarWarmth":6,"radarHumor":5}`,
    }],
    systemPrompt
  );

  const rawJson = extractJSON(pass2);
  const validated = PersonProfileSchema.safeParse(rawJson);

  if (validated.success) return validated.data;

  // Auto-repair
  console.warn('Profile validation failed, attempting repair...');
  const fixResponse = await callGroqWithRetry(
    [{
      role: 'user',
      content: `Fix this JSON to pass this Zod schema. Errors: ${validated.error.message}\n\nJSON:\n${JSON.stringify(rawJson, null, 2)}\n\nReturn ONLY the fixed JSON.`,
    }],
    systemPrompt
  );
  return PersonProfileSchema.parse(extractJSON(fixResponse));
}

export async function preScreenPair(
  profileA: PersonProfile,
  nameA: string,
  profileB: PersonProfile,
  nameB: string
): Promise<PreScreenResult> {
  const response = await callGroqWithRetry(
    [{
      role: 'user',
      content: `Rate compatibility between:\nA: ${nameA} - needs: ${profileA.needs.map(n => n.need).join(', ')}, values: ${profileA.values.join(', ')}, energy: ${profileA.energy}, career: ${profileA.careerDrive}\nB: ${nameB} - needs: ${profileB.needs.map(n => n.need).join(', ')}, values: ${profileB.values.join(', ')}, energy: ${profileB.energy}, career: ${profileB.careerDrive}\n\nReturn ONLY JSON: {"valuesAlignment":0-10,"lifestyleOverlap":0-10,"ambitionCompat":0-10,"interestOverlap":0-10,"complementarity":0-10,"communicationFit":0-10,"needsSatisfaction":0-10,"scoreAtoB":0-100,"scoreBtoA":0-100}`,
    }],
    'Compatibility analyst. Return only JSON numbers.',
    FAST_MODEL
  );

  const rawJson = extractJSON(response);
  return PreScreenSchema.parse(rawJson);
}

const DATE_SCENARIOS = [
  { id: 'coffee_shop', name: 'Coffee Shop', scene: 'A cozy specialty coffee shop on a rainy Sunday morning. Espresso fills the air.' },
  { id: 'rooftop_dinner', name: 'Rooftop Dinner', scene: 'A rooftop restaurant at golden hour. City lights flickering on below.' },
  { id: 'bookstore_walk', name: 'Bookstore Walk', scene: 'An independent bookstore, floor-to-ceiling shelves. Jazz plays softly.' },
  { id: 'arcade', name: 'Retro Arcade', scene: 'A dimly-lit arcade bar with vintage machines and competitive energy.' },
  { id: 'hike', name: 'Morning Hike', scene: 'A scenic trail at dawn. City quiet below, air crisp.' },
  { id: 'art_gallery', name: 'Art Gallery', scene: 'A contemporary gallery opening. Wine, interesting people.' },
];

export async function runDate(
  personAId: string,
  profileA: PersonProfile,
  nameA: string,
  personBId: string,
  profileB: PersonProfile,
  nameB: string,
  onTurn: (turn: { speaker: 'A' | 'B'; content: string; turnIndex: number }) => Promise<void>
): Promise<{ verdictA: DateVerdict; verdictB: DateVerdict }> {
  // Suppress unused variable warnings
  void personAId;
  void personBId;
  
  const scenario = DATE_SCENARIOS[Math.floor(Math.random() * DATE_SCENARIOS.length)];

  const makeSystemPrompt = (myProfile: PersonProfile, myName: string, otherName: string) =>
    `You are ${myName}'s dating agent. Speak in their voice: tone=${myProfile.personaCard.tone}, emoji=${myProfile.personaCard.emojiUse}, sentences=${myProfile.personaCard.sentenceLength}. Sample: "${myProfile.personaCard.sampleVoice}". 

RULES: You know NOTHING about ${otherName} before this date. Be genuinely curious. Show ${myName}'s authentic personality — humor, values, quirks. Be honest — show friction if it exists. No sycophancy. Keep turns to 2-4 sentences max. Setting: ${scenario.scene}`;

  const historyA: Groq.Chat.ChatCompletionMessageParam[] = [];
  const historyB: Groq.Chat.ChatCompletionMessageParam[] = [];

  for (let i = 0; i < 9; i++) {
    const isA = i % 2 === 0;
    const speaker = isA ? 'A' as const : 'B' as const;
    const myProfile = isA ? profileA : profileB;
    const myName = isA ? nameA : nameB;
    const otherName = isA ? nameB : nameA;
    const myHistory = isA ? historyA : historyB;
    const otherHistory = isA ? historyB : historyA;

    const lastMessage = otherHistory.length > 0
      ? (otherHistory[otherHistory.length - 1] as { content: string }).content
      : '';
    const ctx = i === 0
      ? `You just arrived at the ${scenario.name}. Open naturally.`
      : `Continue. Your date ${otherName} just said: "${lastMessage}"`;

    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        max_tokens: 200,
        messages: [
          { role: 'system', content: makeSystemPrompt(myProfile, myName, otherName) },
          ...myHistory,
          { role: 'user', content: ctx },
        ],
      });

      const content = response.choices[0]?.message?.content || '...';
      myHistory.push({ role: 'user', content: ctx });
      myHistory.push({ role: 'assistant', content });
      otherHistory.push({ role: 'user', content: `${myName}: "${content}"` });

      await onTurn({ speaker, content, turnIndex: i });
    } catch (err) {
      console.error(`Turn ${i} failed:`, err);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  // Get verdicts
  const getVerdict = async (myProfile: PersonProfile, myName: string, myHistory: Groq.Chat.ChatCompletionMessageParam[]): Promise<DateVerdict> => {
    const transcript = myHistory
      .filter(h => h.role === 'assistant')
      .map(h => h.content)
      .join('\n');

    const response = await callGroqWithRetry(
      [{
        role: 'user',
        content: `You are ${myName}'s agent. Assess this date from their POV. Their needs: ${myProfile.needs.map(n => n.need).join(', ')}.\nWhat ${myName} said:\n${transcript}\n\nReturn ONLY JSON: {"wouldSeeAgain":true,"chemistry":7,"valuesMatch":8,"needsMet":["intellectual connection"],"frictionPoints":["different energy levels"],"bestMoment":"quote from date","oneLineReview":"honest one-line take","finalScore":75}`,
      }],
      `You are ${myName}'s dating agent. Be honest. Return only JSON.`
    );

    const rawJson = extractJSON(response);
    return DateVerdictSchema.parse(rawJson);
  };

  const [verdictA, verdictB] = await Promise.all([
    getVerdict(profileA, nameA, historyA),
    getVerdict(profileB, nameB, historyB),
  ]);

  return { verdictA, verdictB };
}

export { DATE_SCENARIOS };
