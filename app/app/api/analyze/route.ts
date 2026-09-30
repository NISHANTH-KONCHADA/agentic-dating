import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scrapeInstagram, scrapeLinkedIn } from '@/lib/scraper';
import { analyzePersonProfile } from '@/lib/agent';

export async function POST(req: Request) {
  try {
    const { linkedinUrl, instagramUrl, name, runId } = await req.json();

    if (!linkedinUrl || !instagramUrl) {
      return NextResponse.json({ error: 'LinkedIn and Instagram URLs required' }, { status: 400 });
    }

    // Check cache first
    let person = await prisma.person.findFirst({
      where: { linkedinUrl },
      include: { rawScrapes: true, profile: true },
    });

    if (!person) {
      person = await prisma.person.create({
        data: {
          name: name || 'Unknown',
          linkedinUrl,
          instagramUrl,
        },
        include: { rawScrapes: true, profile: true },
      });
    }

    // Update run status
    if (runId) {
      await prisma.runPerson.updateMany({
        where: { runId, personId: person.id },
        data: { scrapeStatus: 'running' },
      });
    }

    // Scrape if no cached data
    let linkedinData = null;
    let instagramData = null;

    const liScrape = person.rawScrapes.find((s) => s.source === 'linkedin');
    const igScrape = person.rawScrapes.find((s) => s.source === 'instagram');

    if (!liScrape || !liScrape.success) {
      try {
        linkedinData = await scrapeLinkedIn(linkedinUrl);
        await prisma.rawScrape.create({
          data: {
            personId: person.id,
            source: 'linkedin',
            url: linkedinUrl,
            data: linkedinData as object ?? {},
            success: !!linkedinData,
            error: linkedinData ? null : 'Scrape returned empty',
          },
        });
      } catch (err) {
        await prisma.rawScrape.create({
          data: {
            personId: person.id,
            source: 'linkedin',
            url: linkedinUrl,
            data: {},
            success: false,
            error: String(err),
          },
        });
      }
    } else {
      linkedinData = liScrape.data;
    }

    if (!igScrape || !igScrape.success) {
      try {
        instagramData = await scrapeInstagram(instagramUrl);
        await prisma.rawScrape.create({
          data: {
            personId: person.id,
            source: 'instagram',
            url: instagramUrl,
            data: instagramData as object ?? {},
            success: !!instagramData,
            error: instagramData ? null : 'Scrape returned empty',
          },
        });
      } catch (err) {
        await prisma.rawScrape.create({
          data: {
            personId: person.id,
            source: 'instagram',
            url: instagramUrl,
            data: {},
            success: false,
            error: String(err),
          },
        });
      }
    } else {
      instagramData = igScrape.data;
    }

    if (runId) {
      await prisma.runPerson.updateMany({
        where: { runId, personId: person.id },
        data: { scrapeStatus: 'done', analyzeStatus: 'running' },
      });
    }

    // Analyze profile if not cached
    if (!person.profile) {
      const profile = await analyzePersonProfile(
        linkedinData as Parameters<typeof analyzePersonProfile>[0],
        instagramData as Parameters<typeof analyzePersonProfile>[1],
        person.name
      );

      await prisma.profile.create({
        data: {
          personId: person.id,
          summary: profile.summary,
          tagline: profile.tagline,
          photoUrl: profile.photoUrl || '',
          handle: profile.handle || '',
          needs: profile.needs,
          hobbies: profile.hobbies,
          interests: profile.interests,
          values: profile.values,
          communicationStyle: profile.communicationStyle,
          energy: profile.energy,
          lifestyle: profile.lifestyle,
          careerDrive: profile.careerDrive,
          humorStyle: profile.humorStyle,
          socialStyle: profile.socialStyle,
          aesthetic: profile.aesthetic,
          dealBreakers: profile.dealBreakers,
          greenFlags: profile.greenFlags,
          conversationHooks: profile.conversationHooks,
          personaCard: profile.personaCard,
          dataQuality: profile.dataQuality,
          radarEnergy: profile.radarEnergy,
          radarAmbition: profile.radarAmbition,
          radarSocial: profile.radarSocial,
          radarAdventure: profile.radarAdventure,
          radarCreativity: profile.radarCreativity,
          radarWarmth: profile.radarWarmth,
          radarHumor: profile.radarHumor,
        },
      });
    }

    if (runId) {
      await prisma.runPerson.updateMany({
        where: { runId, personId: person.id },
        data: { analyzeStatus: 'done' },
      });
    }

    return NextResponse.json({ personId: person.id, success: true });
  } catch (err) {
    console.error('Scrape/analyze error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
