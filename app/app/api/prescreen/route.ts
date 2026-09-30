import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { preScreenPair } from '@/lib/agent';
import type { PersonProfile } from '@/lib/agent';

export async function POST(req: Request) {
  try {
    const { personAId, personBId } = await req.json();

    // Check cache
    const existing = await prisma.preScreen.findFirst({
      where: {
        OR: [
          { personAId, personBId },
          { personAId: personBId, personBId: personAId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ prescreen: existing, cached: true });
    }

    const [personA, personB] = await Promise.all([
      prisma.person.findUnique({ where: { id: personAId }, include: { profile: true } }),
      prisma.person.findUnique({ where: { id: personBId }, include: { profile: true } }),
    ]);

    if (!personA?.profile || !personB?.profile) {
      return NextResponse.json({ error: 'Both people must have profiles' }, { status: 400 });
    }

    const result = await preScreenPair(
      personA.profile as unknown as PersonProfile,
      personA.name,
      personB.profile as unknown as PersonProfile,
      personB.name
    );

    const prescreen = await prisma.preScreen.create({
      data: {
        personAId,
        personBId,
        ...result,
      },
    });

    return NextResponse.json({ prescreen, cached: false });
  } catch (err) {
    console.error('Prescreen error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
