import { prisma } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DatePage({ params }: Props) {
  const { id } = await params;
  const date = await prisma.date.findUnique({
    where: { id },
    include: {
      personA: { include: { profile: true } },
      personB: { include: { profile: true } },
      turns: { orderBy: { turnIndex: 'asc' } },
      scores: true,
    },
  });

  if (!date) notFound();

  const verdictA = date.scores.find((s) => s.givenById === date.personAId);
  const verdictB = date.scores.find((s) => s.givenById === date.personBId);

  const scenarioEmojis: Record<string, string> = {
    coffee_shop: '☕',
    rooftop_dinner: '🌆',
    bookstore_walk: '📚',
    arcade: '🕹️',
    hike: '🏔️',
    art_gallery: '🎨',
  };

  const scenarioLabel: Record<string, string> = {
    coffee_shop: 'Coffee Shop',
    rooftop_dinner: 'Rooftop Dinner',
    bookstore_walk: 'Bookstore Walk',
    arcade: 'Retro Arcade',
    hike: 'Morning Hike',
    art_gallery: 'Art Gallery',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      {/* Scene banner */}
      <div className="card-surface p-5 mb-6 text-center">
        <div className="text-3xl mb-2">{scenarioEmojis[date.scenario] || '💑'}</div>
        <h2 className="text-sm font-medium text-zinc-300 mb-1">
          {scenarioLabel[date.scenario] || date.scenario}
        </h2>
        <p className="text-xs text-zinc-500 italic">{date.sceneSetting}</p>
      </div>

      {/* Participants */}
      <div className="flex items-center justify-center gap-8 mb-8">
        {[
          { person: date.personA, side: 'A' as const },
          { person: date.personB, side: 'B' as const },
        ].map(({ person, side }) => (
          <div key={person.id} className={`flex flex-col items-center gap-2`}>
            <div className={`relative`}>
              {person.profile?.photoUrl ? (
                <Image
                  src={person.profile.photoUrl as string}
                  alt={person.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${side === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {person.name.charAt(0)}
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#09090b] ${side === 'A' ? 'bg-blue-400' : 'bg-rose-400'}`} />
            </div>
            <Link href={`/p/${person.id}`} className="text-sm font-medium hover:text-lime-400 transition-colors">
              {person.name}
            </Link>
            <div className={`text-xs px-2 py-0.5 rounded-full ${side === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'}`}>
              Agent {side}
            </div>
          </div>
        ))}
      </div>

      {/* Transcript */}
      <div className="card-surface p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-5">Date Transcript</h2>
        <div className="space-y-4">
          {date.turns.map((turn) => {
            const isA = turn.speaker === 'A';
            const person = isA ? date.personA : date.personB;
            return (
              <div key={turn.id} className={`flex items-start gap-3 ${isA ? 'justify-end' : 'justify-start'}`}>
                {!isA && (
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xs font-bold text-rose-400 shrink-0">
                    {person.name.charAt(0)}
                  </div>
                )}
                <div className={`max-w-sm lg:max-w-lg`}>
                  <div className={`text-xs text-zinc-600 mb-1 ${isA ? 'text-right' : 'text-left'}`}>
                    {person.name}
                  </div>
                  <div className={isA ? 'chat-bubble-a p-3 text-sm text-zinc-200' : 'chat-bubble-b p-3 text-sm text-zinc-200'}>
                    {turn.content}
                  </div>
                </div>
                {isA && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Verdicts */}
      {(verdictA || verdictB) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { verdict: verdictA, person: date.personA, side: 'A', color: 'blue' },
            { verdict: verdictB, person: date.personB, side: 'B', color: 'rose' },
          ].map(({ verdict, person, color }) => {
            if (!verdict) return null;
            return (
              <div key={person.id} className={`card-surface p-5 border ${color === 'blue' ? 'border-blue-500/20' : 'border-rose-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{person.name}&apos;s verdict</h3>
                  <div className={`text-xl font-bold ${verdict.finalScore >= 75 ? 'text-lime-400' : verdict.finalScore >= 55 ? 'text-orange-400' : 'text-zinc-400'}`}>
                    {Math.round(verdict.finalScore)}
                  </div>
                </div>

                <p className="text-sm text-zinc-400 italic mb-3">&ldquo;{verdict.oneLineReview}&rdquo;</p>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div>
                    <div className="text-zinc-600">Chemistry</div>
                    <div className="text-zinc-200">{verdict.chemistry}/10</div>
                  </div>
                  <div>
                    <div className="text-zinc-600">Values match</div>
                    <div className="text-zinc-200">{verdict.valuesMatch}/10</div>
                  </div>
                </div>

                <div className={`text-xs px-2 py-1 rounded-full inline-block ${verdict.wouldSeeAgain ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {verdict.wouldSeeAgain ? '💚 Would see again' : '❌ Would not see again'}
                </div>

                {verdict.bestMoment && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="text-xs text-zinc-600 mb-1">Best moment:</div>
                    <p className="text-xs text-zinc-400 italic">{verdict.bestMoment}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mutual match banner */}
      {verdictA?.wouldSeeAgain && verdictB?.wouldSeeAgain && (
        <div className="mt-4 p-4 rounded-xl bg-lime-400/10 border border-lime-400/30 text-center">
          <span className="text-2xl">💘</span>
          <p className="text-sm text-lime-400 font-medium mt-1">Mutual Match! Both agents want to see each other again.</p>
        </div>
      )}
    </div>
  );
}
