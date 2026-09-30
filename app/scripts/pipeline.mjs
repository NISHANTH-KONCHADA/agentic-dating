#!/usr/bin/env node
/**
 * Full pipeline: scrape → analyze → prescreen → date → rank
 * Usage: node scripts/pipeline.mjs
 */
import { PrismaClient } from '@prisma/client';
import { ApifyClient } from 'apify-client';
import Groq from 'groq-sdk';
import pLimit from 'p-limit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const limit = pLimit(5);

const people = JSON.parse(readFileSync(join(__dirname, '../seed/people.json'), 'utf-8'));

// ─── UTILITIES ───────────────────────────────────────────────────────────────

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callClaude(messages, system, model = 'llama3-70b-8192', maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const res = await groq.chat.completions.create({
        model,
        max_tokens: 4096,
        messages: [{ role: 'system', content: system }, ...messages],
      });
      return res.choices[0]?.message?.content || '';
    } catch (e) {
      if (i === maxRetries) throw e;
      await sleep(1000 * Math.pow(2, i));
    }
  }
}

function extractJSON(text) {
  const m = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/(\{[\s\S]*\})/);
  if (!m) throw new Error('No JSON');
  try { return JSON.parse(m[1]); } catch { return JSON.parse(m[0]); }
}

// ─── STAGE 1: SCRAPE ─────────────────────────────────────────────────────────

async function scrapeInstagram(url) {
  const username = url.replace(/\/$/, '').split('/').pop();
  try {
    const run = await apify.actor('apify/instagram-profile-scraper').call({ usernames: [username], resultsLimit: 30 }, { timeout: 120 });
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();
    return items[0] || null;
  } catch (e) {
    console.error(`  Instagram scrape failed for ${username}:`, e.message);
    return null;
  }
}

async function scrapeLinkedIn(url) {
  try {
    const run = await apify.actor('harvestapi/linkedin-profile-scraper').call({ profileUrls: [url], proxy: { useApifyProxy: true } }, { timeout: 120 });
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();
    return items[0] || null;
  } catch (e) {
    console.error(`  LinkedIn scrape failed for ${url}:`, e.message);
    return null;
  }
}

// ─── STAGE 2: ANALYZE ────────────────────────────────────────────────────────

async function analyzePerson(person, linkedinData, instagramData) {
  const liText = linkedinData ? `LINKEDIN: ${JSON.stringify(linkedinData).slice(0, 3000)}` : 'LINKEDIN: unavailable';
  const igText = instagramData ? `INSTAGRAM: ${JSON.stringify(instagramData).slice(0, 3000)}` : 'INSTAGRAM: unavailable';

  const system = `You are a relationship analyst. Analyze public profiles. Never infer: health, religion, sexual orientation, ethnicity, political affiliation. Label all inferences with confidence. Return only JSON.`;

  // Pass 1: raw extraction
  const pass1 = await callClaude([{ role: 'user', content: `Analyze ${person.name}:\n${liText}\n${igText}\n\nExtract facts about career, personality, lifestyle, communication style, interests, and what they seem to value.` }], system);

  // Pass 2: synthesize
  const pass2 = await callClaude([{
    role: 'user',
    content: `Based on this analysis of ${person.name}:\n${pass1}\n\nReturn a JSON PersonProfile. Include these fields:\n{"summary":"2-3 sentence vibe","tagline":"one punchy line","photoUrl":"${instagramData?.profilePicUrl || ''}","handle":"${instagramData?.username || ''}","needs":[{"need":"...","why":"...","evidence":"...","confidence":0.7}],"hobbies":[{"name":"...","evidence":"...","source":"linkedin|instagram|both"}],"interests":[{"topic":"...","depth":"casual|serious|obsessed","evidence":"..."}],"values":["..."],"communicationStyle":"...","energy":0.5,"lifestyle":{"travel":true,"fitness":true,"nightlife":false,"food":true,"pets":false,"cityVsNature":"city|nature|both|unknown"},"careerDrive":0.8,"humorStyle":"...","socialStyle":"...","aesthetic":"...","dealBreakers":[],"greenFlags":["..."],"conversationHooks":["topic1","topic2","topic3","topic4","topic5"],"personaCard":{"tone":"...","slang":["..."],"emojiUse":"none|minimal|moderate|heavy","sentenceLength":"short|medium|long|mixed","sampleVoice":"a sentence that sounds like them"},"dataQuality":{"linkedin":0.8,"instagram":0.6,"notes":"..."},"radarEnergy":6,"radarAmbition":8,"radarSocial":5,"radarAdventure":4,"radarCreativity":7,"radarWarmth":6,"radarHumor":5}`
  }], system);

  return extractJSON(pass2);
}

// ─── STAGE 3: PRESCREEN ──────────────────────────────────────────────────────

async function prescreen(personA, profileA, personB, profileB) {
  const system = 'Compatibility analyst. Return only JSON.';
  const res = await callClaude([{
    role: 'user',
    content: `Rate compatibility (0-10 each dimension, 0-100 overall) between:\nA: ${personA.name} - needs: ${JSON.stringify(profileA.needs?.map(n=>n.need))}, values: ${JSON.stringify(profileA.values)}, energy: ${profileA.energy}, interests: ${JSON.stringify(profileA.interests?.map(i=>i.topic))}\nB: ${personB.name} - needs: ${JSON.stringify(profileB.needs?.map(n=>n.need))}, values: ${JSON.stringify(profileB.values)}, energy: ${profileB.energy}, interests: ${JSON.stringify(profileB.interests?.map(i=>i.topic))}\n\nReturn: {"valuesAlignment":0-10,"lifestyleOverlap":0-10,"ambitionCompat":0-10,"interestOverlap":0-10,"complementarity":0-10,"communicationFit":0-10,"needsSatisfaction":0-10,"scoreAtoB":0-100,"scoreBtoA":0-100}`
  }], system);
  return extractJSON(res);
}

// ─── STAGE 4: DATE ────────────────────────────────────────────────────────────

const SCENARIOS = [
  { id: 'coffee_shop', scene: 'A cozy specialty coffee shop on a rainy Sunday morning.' },
  { id: 'rooftop_dinner', scene: 'A rooftop restaurant at golden hour.' },
  { id: 'bookstore_walk', scene: 'An independent bookstore with floor-to-ceiling shelves.' },
  { id: 'arcade', scene: 'A dimly-lit arcade bar with vintage machines.' },
  { id: 'hike', scene: 'A scenic trail at dawn. Crisp air.' },
  { id: 'art_gallery', scene: 'A contemporary art gallery opening.' },
];

async function runDate(personA, profileA, personB, profileB) {
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  const historyA = [];
  const historyB = [];
  const turns = [];

  const makeSystem = (myProfile, myName, otherName) => `You are ${myName}'s dating agent. Speak in their voice: tone=${myProfile.personaCard?.tone}, emoji=${myProfile.personaCard?.emojiUse}, sentences=${myProfile.personaCard?.sentenceLength}. Sample: "${myProfile.personaCard?.sampleVoice}". You know nothing about ${otherName} except what they say on this date. Be curious, honest, real — no sycophancy. 2-4 sentences max per turn. Setting: ${scenario.scene}`;

  for (let i = 0; i < 9; i++) {
    const isA = i % 2 === 0;
    const myProfile = isA ? profileA : profileB;
    const myName = isA ? personA.name : personB.name;
    const otherName = isA ? personB.name : personA.name;
    const myHistory = isA ? historyA : historyB;
    const otherHistory = isA ? historyB : historyA;

    const ctx = i === 0 
      ? `You just arrived. Open the conversation naturally.` 
      : `Continue. Last thing your date said: "${otherHistory.at(-1)?.content || ''}"`;

    try {
      const res = await groq.chat.completions.create({
        model: 'llama3-70b-8192',
        max_tokens: 200,
        messages: [
          { role: 'system', content: makeSystem(myProfile, myName, otherName) },
          ...myHistory,
          { role: 'user', content: ctx }
        ],
      });
      const content = res.choices[0]?.message?.content || '...';
      myHistory.push({ role: 'user', content: ctx });
      myHistory.push({ role: 'assistant', content });
      otherHistory.push({ role: 'user', content: `${myName} said: "${content}"` });
      turns.push({ speaker: isA ? 'A' : 'B', content, turnIndex: i });
    } catch (e) {
      console.error(`  Turn ${i} failed:`, e.message);
    }
    await sleep(300);
  }

  // Verdicts
  const getVerdict = async (myProfile, myName, myHistory) => {
    const transcript = myHistory.filter(h => h.role === 'assistant').map(h => h.content).join('\n');
    const res = await callClaude([{
      role: 'user',
      content: `You are ${myName}'s agent. Assess this date from ${myName}'s POV. Their needs: ${JSON.stringify(myProfile.needs?.map(n=>n.need))}.\nWhat they said:\n${transcript}\n\nReturn: {"wouldSeeAgain":true/false,"chemistry":0-10,"valuesMatch":0-10,"needsMet":["..."],"frictionPoints":["..."],"bestMoment":"quote or moment","oneLineReview":"honest take","finalScore":0-100}`
    }], `You are ${myName}'s dating agent. Be honest. Return only JSON.`);
    return extractJSON(res);
  };

  const [verdictA, verdictB] = await Promise.all([
    getVerdict(profileA, personA.name, historyA),
    getVerdict(profileB, personB.name, historyB),
  ]);

  return { scenario: scenario.id, sceneSetting: scenario.scene, turns, verdictA, verdictB };
}

// ─── MAIN PIPELINE ───────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Agentic Dating Pipeline Starting...\n');

  // Stage 1: Scrape & Analyze
  console.log('━━━ Stage 1: Scrape & Analyze ━━━');
  const personRecords = [];

  for (const p of people) {
    console.log(`\n📥 Processing: ${p.name}`);

    // Check cache
    let person = await prisma.person.findFirst({ where: { linkedinUrl: p.linkedin } });
    if (!person) {
      person = await prisma.person.create({
        data: { name: p.name, linkedinUrl: p.linkedin, instagramUrl: p.instagram, verified: p.verified, verificationNote: p.verification_note, gender: p.gender, location: p.location, domain: p.domain }
      });
    }

    // Skip if profile exists
    const existingProfile = await prisma.profile.findUnique({ where: { personId: person.id } });
    if (existingProfile) {
      console.log(`  ✓ Cached: ${p.name}`);
      personRecords.push({ person, profile: existingProfile });
      continue;
    }

    // Scrape
    console.log('  Scraping LinkedIn...');
    const liData = await scrapeLinkedIn(p.linkedin);
    if (liData) {
      await prisma.rawScrape.upsert({
        where: { id: `li_${person.id}` },
        update: { data: liData, success: true },
        create: { id: `li_${person.id}`, personId: person.id, source: 'linkedin', url: p.linkedin, data: liData, success: true }
      }).catch(() => prisma.rawScrape.create({ data: { personId: person.id, source: 'linkedin', url: p.linkedin, data: liData, success: true } }));
    }

    console.log('  Scraping Instagram...');
    const igData = await scrapeInstagram(p.instagram);
    if (igData) {
      await prisma.rawScrape.create({ data: { personId: person.id, source: 'instagram', url: p.instagram, data: igData, success: !!igData, error: igData ? null : 'empty' } }).catch(() => {});
    }

    // Analyze
    console.log('  Analyzing...');
    try {
      const profileData = await analyzePerson(p, liData, igData);
      const profile = await prisma.profile.create({
        data: {
          personId: person.id,
          summary: profileData.summary || '',
          tagline: profileData.tagline || '',
          photoUrl: profileData.photoUrl || '',
          handle: profileData.handle || p.instagram.split('/').filter(Boolean).pop() || '',
          needs: profileData.needs || [],
          hobbies: profileData.hobbies || [],
          interests: profileData.interests || [],
          values: profileData.values || [],
          communicationStyle: profileData.communicationStyle || '',
          energy: profileData.energy || 0.5,
          lifestyle: profileData.lifestyle || {},
          careerDrive: profileData.careerDrive || 0.5,
          humorStyle: profileData.humorStyle || '',
          socialStyle: profileData.socialStyle || '',
          aesthetic: profileData.aesthetic || '',
          dealBreakers: profileData.dealBreakers || [],
          greenFlags: profileData.greenFlags || [],
          conversationHooks: profileData.conversationHooks || [],
          personaCard: profileData.personaCard || {},
          dataQuality: profileData.dataQuality || { linkedin: liData ? 0.7 : 0, instagram: igData ? 0.7 : 0, notes: '' },
          radarEnergy: profileData.radarEnergy || 5,
          radarAmbition: profileData.radarAmbition || 5,
          radarSocial: profileData.radarSocial || 5,
          radarAdventure: profileData.radarAdventure || 5,
          radarCreativity: profileData.radarCreativity || 5,
          radarWarmth: profileData.radarWarmth || 5,
          radarHumor: profileData.radarHumor || 5,
        }
      });
      personRecords.push({ person, profile });
      console.log(`  ✅ Done: ${p.name} — "${profileData.tagline}"`);
    } catch (e) {
      console.error(`  ❌ Analysis failed for ${p.name}:`, e.message);
      personRecords.push({ person, profile: null });
    }
  }

  // Stage 2: Pre-screen all pairs
  console.log('\n━━━ Stage 2: Pre-screening All Pairs ━━━');
  const validPeople = personRecords.filter(r => r.profile);
  const pairs = [];
  for (let i = 0; i < validPeople.length; i++) {
    for (let j = i + 1; j < validPeople.length; j++) {
      pairs.push([validPeople[i], validPeople[j]]);
    }
  }
  console.log(`  ${pairs.length} pairs to pre-screen`);

  await Promise.all(pairs.map(([a, b]) => limit(async () => {
    const existing = await prisma.preScreen.findFirst({ where: { OR: [{ personAId: a.person.id, personBId: b.person.id }, { personAId: b.person.id, personBId: a.person.id }] } });
    if (existing) return;
    try {
      const result = await prescreen(a.person, a.profile, b.person, b.profile);
      await prisma.preScreen.create({
        data: { personAId: a.person.id, personBId: b.person.id, ...result }
      });
      process.stdout.write('.');
    } catch (e) {
      process.stdout.write('x');
    }
  })));
  console.log('\n  ✅ Pre-screening done');

  // Stage 3: Run dates for top-5 matches
  console.log('\n━━━ Stage 3: Running Dates ━━━');
  
  for (const { person, profile } of validPeople) {
    if (!profile) continue;
    
    // Get top 5 pre-screen matches
    const prescreens = await prisma.preScreen.findMany({
      where: { OR: [{ personAId: person.id }, { personBId: person.id }] }
    });
    
    const scored = prescreens.map(ps => ({
      candidateId: ps.personAId === person.id ? ps.personBId : ps.personAId,
      score: ps.personAId === person.id ? ps.scoreAtoB : ps.scoreBtoA,
    })).sort((a, b) => b.score - a.score).slice(0, 5);

    for (const match of scored) {
      // Check if date already exists
      const existing = await prisma.date.findFirst({
        where: { status: 'complete', OR: [{ personAId: person.id, personBId: match.candidateId }, { personAId: match.candidateId, personBId: person.id }] }
      });
      if (existing) continue;

      const candidateRecord = validPeople.find(r => r.person.id === match.candidateId);
      if (!candidateRecord?.profile) continue;

      console.log(`  💬 ${person.name} × ${candidateRecord.person.name}`);
      try {
        const dateResult = await runDate(person, profile, candidateRecord.person, candidateRecord.profile);
        
        const date = await prisma.date.create({
          data: { personAId: person.id, personBId: candidateRecord.person.id, scenario: dateResult.scenario, sceneSetting: dateResult.sceneSetting, status: 'running', startedAt: new Date() }
        });

        for (const turn of dateResult.turns) {
          await prisma.dateTurn.create({ data: { dateId: date.id, ...turn } });
        }

        await prisma.score.create({
          data: { dateId: date.id, givenById: person.id, receivedById: candidateRecord.person.id, ...dateResult.verdictA, needsMet: dateResult.verdictA.needsMet || [], frictionPoints: dateResult.verdictA.frictionPoints || [] }
        });
        await prisma.score.create({
          data: { dateId: date.id, givenById: candidateRecord.person.id, receivedById: person.id, ...dateResult.verdictB, needsMet: dateResult.verdictB.needsMet || [], frictionPoints: dateResult.verdictB.frictionPoints || [] }
        });

        await prisma.date.update({ where: { id: date.id }, data: { status: 'complete', completedAt: new Date() } });
        console.log(`  ✅ Score: A→${Math.round(dateResult.verdictA.finalScore)} B→${Math.round(dateResult.verdictB.finalScore)}`);
      } catch (e) {
        console.error(`  ❌ Date failed:`, e.message);
      }
    }
  }

  // Stage 4: Rankings
  console.log('\n━━━ Stage 4: Computing Rankings ━━━');
  for (const { person } of validPeople) {
    const others = validPeople.filter(r => r.person.id !== person.id);
    const scored = [];

    for (const { person: candidate } of others) {
      const myScore = await prisma.score.findFirst({ where: { givenById: person.id, receivedById: candidate.id } });
      const theirScore = await prisma.score.findFirst({ where: { givenById: candidate.id, receivedById: person.id } });
      const prescreen = await prisma.preScreen.findFirst({ where: { OR: [{ personAId: person.id, personBId: candidate.id }, { personAId: candidate.id, personBId: person.id }] } });

      let finalScore = 50;
      let isMutual = false;
      let isPredicted = false;

      if (myScore && theirScore) {
        finalScore = myScore.finalScore * 0.5 + theirScore.finalScore * 0.25 + ((prescreen?.scoreAtoB || 50) * 0.25);
        if (myScore.wouldSeeAgain && theirScore.wouldSeeAgain) { finalScore = Math.min(100, finalScore * 1.1); isMutual = true; }
      } else if (prescreen) {
        finalScore = person.id === prescreen.personAId ? prescreen.scoreAtoB : prescreen.scoreBtoA;
        isPredicted = true;
      }

      scored.push({ candidateId: candidate.id, finalScore: Math.round(finalScore), isMutual, isPredicted,
        whyYouFit: myScore ? `Chemistry ${myScore.chemistry}/10` : 'Strong pre-screen compatibility',
        friction: myScore?.frictionPoints[0] || 'Different communication styles',
      });
    }

    scored.sort((a, b) => b.finalScore - a.finalScore);

    for (let i = 0; i < scored.length; i++) {
      const r = scored[i];
      await prisma.ranking.upsert({
        where: { personId_candidateId: { personId: person.id, candidateId: r.candidateId } },
        update: { ...r, rank: i + 1 },
        create: { personId: person.id, ...r, rank: i + 1 },
      });
    }
  }

  console.log('\n✅ Pipeline complete!');
  console.log(`   ${validPeople.length} people analyzed`);
  console.log(`   ${pairs.length} pairs pre-screened`);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
