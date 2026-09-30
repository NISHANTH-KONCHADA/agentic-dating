import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const personId = searchParams.get('personId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!personId) return NextResponse.json({ error: 'personId required' }, { status: 400 });

    // Get prescreens for this person, ordered by score
    const prescreens = await prisma.preScreen.findMany({
      where: {
        OR: [{ personAId: personId }, { personBId: personId }],
      },
    });

    const scored = prescreens.map((ps) => {
      const isA = ps.personAId === personId;
      const candidateId = isA ? ps.personBId : ps.personAId;
      const score = isA ? ps.scoreAtoB : ps.scoreBtoA;
      return { candidateId, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const matches = scored.slice(0, limit);

    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
