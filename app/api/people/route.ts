import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      include: { profile: { select: { tagline: true, photoUrl: true, handle: true, energy: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ people });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
