import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { people } = await req.json();

    const run = await prisma.run.create({
      data: {
        name: `Run ${new Date().toISOString()}`,
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Add people to run (create if they don't exist)
    for (const p of people) {
      let person = await prisma.person.findFirst({ where: { linkedinUrl: p.linkedinUrl } });
      if (!person) {
        person = await prisma.person.create({
          data: {
            name: p.name || 'Unknown',
            linkedinUrl: p.linkedinUrl,
            instagramUrl: p.instagramUrl,
          },
        });
      }

      await prisma.runPerson.create({
        data: {
          runId: run.id,
          personId: person.id,
        },
      });
    }

    return NextResponse.json({ runId: run.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
