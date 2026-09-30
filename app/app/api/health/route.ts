import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [dbOk, apifyOk, anthropicOk] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      fetch(`https://api.apify.com/v2/users/me?token=${process.env.APIFY_TOKEN}`).then((r) => r.ok),
      fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
      }).then((r) => r.ok),
    ]);

    return NextResponse.json({
      status: 'ok',
      db: dbOk.status === 'fulfilled' ? 'connected' : 'error',
      apify: apifyOk.status === 'fulfilled' && apifyOk.value ? 'connected' : 'error',
      anthropic: anthropicOk.status === 'fulfilled' && anthropicOk.value ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}
