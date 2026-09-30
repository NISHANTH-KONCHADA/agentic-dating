import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runDate } from '@/lib/agent';
import type { PersonProfile } from '@/lib/agent';

export const maxDuration = 300; // 5 min timeout for Railway

export async function POST(req: Request) {
  try {
    const { personAId, personBId } = await req.json();

    // Check if date already exists and is complete
    const existingDate = await prisma.date.findFirst({
      where: {
        OR: [
          { personAId, personBId },
          { personAId: personBId, personBId: personAId },
        ],
        status: 'complete',
      },
      include: { turns: true, scores: true },
    });

    if (existingDate) {
      return NextResponse.json({ dateId: existingDate.id, cached: true });
    }

    const [personA, personB] = await Promise.all([
      prisma.person.findUnique({ where: { id: personAId }, include: { profile: true } }),
      prisma.person.findUnique({ where: { id: personBId }, include: { profile: true } }),
    ]);

    if (!personA?.profile || !personB?.profile) {
      return NextResponse.json({ error: 'Both people must have profiles' }, { status: 400 });
    }

    // Create date record
    const scenarios = ['coffee_shop', 'rooftop_dinner', 'bookstore_walk', 'arcade', 'hike', 'art_gallery'];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const sceneSetting = {
      coffee_shop: 'A cozy specialty coffee shop on a rainy Sunday morning.',
      rooftop_dinner: 'A rooftop restaurant at golden hour. City lights below.',
      bookstore_walk: 'An independent bookstore with floor-to-ceiling shelves.',
      arcade: 'A dimly-lit arcade bar with vintage machines.',
      hike: 'A scenic trail at dawn. Crisp air, quiet city below.',
      art_gallery: 'A contemporary art gallery opening.',
    }[scenario] || 'A cozy cafe.';

    const date = await prisma.date.create({
      data: {
        personAId,
        personBId,
        scenario,
        sceneSetting,
        status: 'running',
        startedAt: new Date(),
      },
    });

    let turnIndex = 0;
    const { verdictA, verdictB } = await runDate(
      personAId,
      personA.profile as unknown as PersonProfile,
      personA.name,
      personBId,
      personB.profile as unknown as PersonProfile,
      personB.name,
      async (turn) => {
        await prisma.dateTurn.create({
          data: {
            dateId: date.id,
            turnIndex: turnIndex++,
            speaker: turn.speaker,
            content: turn.content,
          },
        });
      }
    );

    // Save scores
    await Promise.all([
      prisma.score.create({
        data: {
          dateId: date.id,
          givenById: personAId,
          receivedById: personBId,
          ...verdictA,
          needsMet: verdictA.needsMet,
          frictionPoints: verdictA.frictionPoints,
        },
      }),
      prisma.score.create({
        data: {
          dateId: date.id,
          givenById: personBId,
          receivedById: personAId,
          ...verdictB,
          needsMet: verdictB.needsMet,
          frictionPoints: verdictB.frictionPoints,
        },
      }),
    ]);

    await prisma.date.update({
      where: { id: date.id },
      data: { status: 'complete', completedAt: new Date() },
    });

    return NextResponse.json({ dateId: date.id, cached: false });
  } catch (err) {
    console.error('Date error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
