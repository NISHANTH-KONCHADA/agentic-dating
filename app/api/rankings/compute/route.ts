import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Get all people with profiles
    const people = await prisma.person.findMany({
      where: { profile: { isNot: null } },
      include: { profile: true, rankings: true },
    });

    const allRankings: Array<{
      personId: string;
      candidateId: string;
      finalScore: number;
      isMutual: boolean;
      isPredicted: boolean;
      whyYouFit: string;
      friction: string;
      rank: number;
    }> = [];

    for (const person of people) {
      const candidates = people.filter((p) => p.id !== person.id);

      let rankIndex = 1;
      const scored: Array<{
        candidateId: string;
        finalScore: number;
        isMutual: boolean;
        isPredicted: boolean;
        whyYouFit: string;
        friction: string;
      }> = [];

      for (const candidate of candidates) {
        // Get scores
        const myScore = await prisma.score.findFirst({
          where: { givenById: person.id, receivedById: candidate.id },
          include: { date: true },
        });

        const theirScore = await prisma.score.findFirst({
          where: { givenById: candidate.id, receivedById: person.id },
        });

        const prescreen = await prisma.preScreen.findFirst({
          where: {
            OR: [
              { personAId: person.id, personBId: candidate.id },
              { personAId: candidate.id, personBId: person.id },
            ],
          },
        });

        let finalScore = 0;
        let isMutual = false;
        let isPredicted = false;

        if (myScore && theirScore) {
          // Full date: weighted blend
          finalScore =
            myScore.finalScore * 0.5 +
            theirScore.finalScore * 0.25 +
            ((prescreen?.scoreAtoB || 50) * 0.25);

          // Mutual match bonus
          if (myScore.wouldSeeAgain && theirScore.wouldSeeAgain) {
            finalScore = Math.min(100, finalScore * 1.1);
            isMutual = true;
          }
        } else if (prescreen) {
          // No date, use prescreen
          const prescreenScore = person.id === prescreen.personAId
            ? prescreen.scoreAtoB
            : prescreen.scoreBtoA;
          finalScore = prescreenScore;
          isPredicted = true;
        } else {
          finalScore = 50; // Unknown
          isPredicted = true;
        }

        // Generate why/friction from profile data
        const personProfile = person.profile;
        const candidateProfile = candidate.profile;
        let whyYouFit = '';
        let friction = '';

        if (personProfile && candidateProfile) {
          const personValues = (personProfile.values as string[]) || [];
          const candidateValues = (candidateProfile.values as string[]) || [];
          const sharedValues = personValues.filter((v: string) => candidateValues.includes(v));
          whyYouFit = sharedValues.length > 0
            ? `Shared values in ${sharedValues.slice(0, 2).join(' & ')}`
            : `Complementary energy and drive`;
          friction = (myScore?.frictionPoints as string[] | null | undefined)?.[0] || 'Different communication styles';

        }

        scored.push({
          candidateId: candidate.id,
          finalScore: Math.round(finalScore),
          isMutual,
          isPredicted,
          whyYouFit,
          friction,
        });
      }

      // Sort by score
      scored.sort((a, b) => b.finalScore - a.finalScore);

      for (const s of scored) {
        allRankings.push({
          personId: person.id,
          candidateId: s.candidateId,
          finalScore: s.finalScore,
          isMutual: s.isMutual,
          isPredicted: s.isPredicted,
          whyYouFit: s.whyYouFit,
          friction: s.friction,
          rank: rankIndex++,
        });
      }
    }

    // Upsert rankings
    for (const r of allRankings) {
      await prisma.ranking.upsert({
        where: { personId_candidateId: { personId: r.personId, candidateId: r.candidateId } },
        update: r,
        create: r,
      });
    }

    return NextResponse.json({ success: true, count: allRankings.length });
  } catch (err) {
    console.error('Rankings error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
