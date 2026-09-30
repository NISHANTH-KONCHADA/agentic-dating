import { prisma } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ personId: string }>;
}

export default async function RankingsPersonPage({ params }: Props) {
  const { personId } = await params;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { profile: true },
  });

  if (!person) notFound();

  const rankings = await prisma.ranking.findMany({
    where: { personId },
    orderBy: { rank: 'asc' },
  });

  // Get candidate details
  const candidateIds = rankings.map((r) => r.candidateId);
  const candidates = await prisma.person.findMany({
    where: { id: { in: candidateIds } },
    include: { profile: true },
  });

  const candidateMap = Object.fromEntries(candidates.map((c) => [c.id, c]));

  // Get dates for "view transcript" links
  const dates = await prisma.date.findMany({
    where: {
      status: 'complete',
      OR: [
        { personAId: personId, personBId: { in: candidateIds } },
        { personBId: personId, personAId: { in: candidateIds } },
      ],
    },
  });

  const dateMap: Record<string, string> = {};
  for (const d of dates) {
    const otherId = d.personAId === personId ? d.personBId : d.personAId;
    dateMap[otherId] = d.id;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="flex items-center gap-4 mb-8">
        {person.profile?.photoUrl ? (
          <Image
            src={person.profile.photoUrl as string}
            alt={person.name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-400">
            {person.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{person.name}&apos;s Rankings</h1>
          <p className="text-zinc-400 text-sm">Who fits them best, from 29 people</p>
        </div>
        <Link href={`/p/${personId}`} className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Profile
        </Link>
      </div>

      {rankings.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p>Rankings not computed yet. Run the pipeline first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.map((ranking, i) => {
            const candidate = candidateMap[ranking.candidateId];
            if (!candidate) return null;
            const dateId = dateMap[ranking.candidateId];

            return (
              <div
                key={ranking.id}
                className={`card-surface p-4 flex items-center gap-4 ${i === 0 ? 'border border-lime-400/30 glow-lime' : ''}`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-lime-400 text-zinc-950' :
                  i === 1 ? 'bg-zinc-300 text-zinc-950' :
                  i === 2 ? 'bg-amber-600 text-white' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {i + 1}
                </div>

                {/* Avatar */}
                {candidate.profile?.photoUrl ? (
                  <Image
                    src={candidate.profile.photoUrl as string}
                    alt={candidate.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
                    {candidate.name.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{candidate.name}</span>
                    {ranking.isMutual && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">💘 Mutual</span>
                    )}
                    {ranking.isPredicted && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">Predicted</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{ranking.whyYouFit}</p>
                  {ranking.friction && (
                    <p className="text-xs text-zinc-600 mt-0.5 truncate">⚠ {ranking.friction}</p>
                  )}
                </div>

                {/* Score */}
                <div className="shrink-0 text-right">
                  <div className={`text-xl font-bold ${
                    ranking.finalScore >= 85 ? 'text-lime-400' :
                    ranking.finalScore >= 70 ? 'text-orange-400' :
                    'text-zinc-400'
                  }`}>
                    {Math.round(ranking.finalScore)}
                  </div>
                  <div className="text-xs text-zinc-600">/ 100</div>
                </div>

                {/* View date */}
                {dateId && (
                  <Link
                    href={`/dates/${dateId}`}
                    className="shrink-0 text-xs px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    Transcript →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
