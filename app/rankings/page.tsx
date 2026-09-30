import { prisma } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function RankingsPage() {
  // Global leaderboard: mutual matches + top overall couples
  const mutualMatches = await prisma.ranking.findMany({
    where: { isMutual: true },
    orderBy: { finalScore: 'desc' },
    take: 20,
  });

  const personIds = [...new Set([...mutualMatches.map(r => r.personId), ...mutualMatches.map(r => r.candidateId)])];
  const persons = await prisma.person.findMany({
    where: { id: { in: personIds } },
    include: { profile: { select: { photoUrl: true, tagline: true } } },
  });
  const personMap = Object.fromEntries(persons.map(p => [p.id, p]));

  // Get all people for heat matrix
  const allPeople = await prisma.person.findMany({
    include: { profile: { select: { photoUrl: true, handle: true } } },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });

  // Get all rankings for heat matrix
  const allRankings = await prisma.ranking.findMany({
    where: {
      personId: { in: allPeople.map(p => p.id) },
      candidateId: { in: allPeople.map(p => p.id) },
    },
  });

  const rankingMap: Record<string, Record<string, number>> = {};
  for (const r of allRankings) {
    if (!rankingMap[r.personId]) rankingMap[r.personId] = {};
    rankingMap[r.personId][r.candidateId] = r.finalScore;
  }

  const getCellColor = (score: number | undefined) => {
    if (!score) return 'bg-zinc-900';
    if (score >= 85) return 'bg-lime-400/60';
    if (score >= 75) return 'bg-lime-400/30';
    if (score >= 65) return 'bg-orange-400/30';
    if (score >= 55) return 'bg-blue-400/20';
    return 'bg-zinc-800/50';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Global Rankings & Leaderboard</h1>
        <p className="text-zinc-400">Mutual matches, top couples, and the full compatibility heat matrix.</p>
      </div>

      {/* Mutual matches */}
      {mutualMatches.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>💘</span> Mutual Matches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mutualMatches.slice(0, 6).map((match) => {
              const personA = personMap[match.personId];
              const personB = personMap[match.candidateId];
              if (!personA || !personB) return null;

              return (
                <div key={match.id} className="card-surface p-5 border border-rose-500/20 glow-orange">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center">
                      {personA.profile?.photoUrl ? (
                        <Image src={personA.profile.photoUrl as string} alt={personA.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover ring-2 ring-[#111113]" unoptimized />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">{personA.name.charAt(0)}</div>
                      )}
                      {personB.profile?.photoUrl ? (
                        <Image src={personB.profile.photoUrl as string} alt={personB.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover -ml-3 ring-2 ring-[#111113]" unoptimized />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 -ml-3 ring-2 ring-[#111113]">{personB.name.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{personA.name} × {personB.name}</div>
                      <div className="text-xs text-rose-400">Both want to see each other again</div>
                    </div>
                    <div className="ml-auto text-xl font-bold text-lime-400">{Math.round(match.finalScore)}</div>
                  </div>
                  <p className="text-xs text-zinc-500">{match.whyYouFit}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Heat matrix */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔥</span> Compatibility Heat Matrix
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Row = person, Column = match. Click any cell to see the date. <span className="text-lime-400">■</span> = 85+ &nbsp; <span className="text-orange-400">■</span> = 75+ &nbsp; <span className="text-blue-400">■</span> = 55+
        </p>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="p-2 text-left text-zinc-500 w-28 sticky left-0 bg-[#111113]"></th>
                {allPeople.map((p) => (
                  <th key={p.id} className="p-1 text-center text-zinc-500" style={{ minWidth: 28 }}>
                    <Link href={`/p/${p.id}`}>
                      <div className="flex flex-col items-center gap-0.5">
                        {p.profile?.photoUrl ? (
                          <Image src={p.profile.photoUrl as string} alt={p.name} width={20} height={20} className="w-5 h-5 rounded-full object-cover" unoptimized />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center" style={{ fontSize: 8 }}>{p.name.charAt(0)}</div>
                        )}
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPeople.map((person) => (
                <tr key={person.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                  <td className="p-2 sticky left-0 bg-[#111113] font-medium text-zinc-300 truncate max-w-28">
                    <Link href={`/rankings/${person.id}`} className="hover:text-lime-400 transition-colors">
                      {person.name.split(' ')[0]}
                    </Link>
                  </td>
                  {allPeople.map((candidate) => {
                    if (candidate.id === person.id) {
                      return <td key={candidate.id} className="p-1 bg-zinc-900/50"><div className="w-6 h-6 mx-auto rounded" style={{ background: '#27272a' }} /></td>;
                    }
                    const score = rankingMap[person.id]?.[candidate.id];
                    return (
                      <td key={candidate.id} className="p-1">
                        <div
                          className={`w-6 h-6 mx-auto rounded cursor-pointer transition-transform hover:scale-125 ${getCellColor(score)}`}
                          title={score ? `${person.name} → ${candidate.name}: ${Math.round(score)}` : 'No data'}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allPeople.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            <p>Run the pipeline first to generate rankings.</p>
          </div>
        )}
      </section>
    </div>
  );
}
