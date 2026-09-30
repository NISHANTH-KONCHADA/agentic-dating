import { prisma } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

export default async function DatesPage() {
  const dates = await prisma.date.findMany({
    where: { status: 'complete' },
    orderBy: { completedAt: 'desc' },
    take: 50,
    include: {
      personA: { include: { profile: true } },
      personB: { include: { profile: true } },
      scores: true,
    },
  });

  const running = await prisma.date.findMany({
    where: { status: 'running' },
    include: {
      personA: true,
      personB: true,
    },
  });

  const scenarioEmojis: Record<string, string> = {
    coffee_shop: '☕',
    rooftop_dinner: '🌆',
    bookstore_walk: '📚',
    arcade: '🕹️',
    hike: '🏔️',
    art_gallery: '🎨',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Date Theater</h1>
        <p className="text-zinc-400">Every AI date, all transcripts. Watch agents meet, probe, disagree, and connect.</p>
      </div>

      {running.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-lime-400 live-dot" />
            <h2 className="text-sm font-medium text-lime-400">Live Dates ({running.length})</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {running.map((d) => (
              <div key={d.id} className="card-surface p-4 shrink-0 w-48 border-beam">
                <div className="text-xs text-zinc-500 mb-2">Running...</div>
                <div className="text-sm font-medium">{d.personA.name}</div>
                <div className="text-xs text-zinc-500">× {d.personB.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dates.map((date) => {
          const verdictA = date.scores.find((s) => s.givenById === date.personAId);
          const verdictB = date.scores.find((s) => s.givenById === date.personBId);
          const isMutual = verdictA?.wouldSeeAgain && verdictB?.wouldSeeAgain;
          const avgScore = verdictA && verdictB ? (verdictA.finalScore + verdictB.finalScore) / 2 : null;

          return (
            <Link key={date.id} href={`/dates/${date.id}`}>
              <div className="card-surface card-hover p-5 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{scenarioEmojis[date.scenario] || '💑'}</span>
                  <div className="flex items-center gap-1.5">
                    {date.personA.profile?.photoUrl ? (
                      <Image
                        src={date.personA.profile.photoUrl as string}
                        alt={date.personA.name}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/30"
                        unoptimized
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400">
                        {date.personA.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs text-zinc-500">×</span>
                    {date.personB.profile?.photoUrl ? (
                      <Image
                        src={date.personB.profile.photoUrl as string}
                        alt={date.personB.name}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-rose-500/30"
                        unoptimized
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center text-xs text-rose-400">
                        {date.personB.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {isMutual && <span className="text-xs text-rose-400 ml-auto">💘 Mutual</span>}
                </div>

                <div className="text-sm font-medium mb-0.5">
                  {date.personA.name} × {date.personB.name}
                </div>

                {avgScore !== null && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-lime-400 rounded-full"
                        style={{ width: `${avgScore}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono ${avgScore >= 75 ? 'text-lime-400' : avgScore >= 55 ? 'text-orange-400' : 'text-zinc-500'}`}>
                      {Math.round(avgScore)}
                    </span>
                  </div>
                )}

                {verdictA?.oneLineReview && (
                  <p className="text-xs text-zinc-500 italic mt-2 line-clamp-2">
                    &ldquo;{verdictA.oneLineReview}&rdquo;
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {dates.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <div className="text-4xl mb-4">💤</div>
          <p>No dates run yet. Run <code className="bg-zinc-800 px-2 py-0.5 rounded text-xs">npm run pipeline</code> to start dating.</p>
        </div>
      )}
    </div>
  );
}
