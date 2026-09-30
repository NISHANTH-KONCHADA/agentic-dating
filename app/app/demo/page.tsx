import { prisma } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const revalidate = 60;

export default async function DemoPage() {
  const people = await prisma.person.findMany({
    include: { profile: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/20 bg-lime-400/5 text-lime-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 inline-block live-dot" />
          Pre-run demo — loads instantly
        </div>
        <h1 className="text-3xl font-bold mb-3">30 Real People, Fully Analyzed</h1>
        <p className="text-zinc-400 max-w-2xl">
          Each person was analyzed by their AI agent reading their public LinkedIn and Instagram. Click any person to see their full profile, analysis, and who their agent thinks fits them best.
        </p>
      </div>

      {people.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <div className="text-4xl mb-4">⚙️</div>
          <p className="text-lg font-medium mb-2">Pipeline not yet run</p>
          <p className="text-sm">Run <code className="bg-zinc-800 px-2 py-0.5 rounded text-xs">npm run seed</code> to populate the demo with 30 real people.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => {
            const profile = person.profile;
            return (
              <Link key={person.id} href={`/p/${person.id}`}>
                <div className="card-surface card-hover p-5 h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      {profile?.photoUrl ? (
                        <Image
                          src={profile.photoUrl as string}
                          alt={person.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-400">
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-lime-400 border-2 border-[#111113]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{person.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {profile?.handle ? `@${profile.handle}` : person.domain || 'tech/startup'}
                      </p>
                    </div>
                  </div>

                  {profile ? (
                    <>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                        {profile.tagline as string}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {((profile.interests as Array<{topic: string}>) || []).slice(0, 3).map((interest) => (
                          <span key={interest.topic} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                            {interest.topic}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="text-xs text-zinc-500">Energy</div>
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-lime-400 rounded-full"
                              style={{ width: `${(profile.energy as number) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500">{person.location || ''}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Analyzing...
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Global leaderboard teaser */}
      <div className="mt-12 text-center">
        <Link
          href="/rankings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white transition-all"
        >
          🏆 See global compatibility leaderboard →
        </Link>
      </div>
    </div>
  );
}
