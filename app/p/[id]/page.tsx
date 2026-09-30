import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;
  const n = data.length;

  const toXY = (angle: number, r: number) => ({
    x: cx + r * Math.sin(angle),
    y: cy - r * Math.cos(angle),
  });

  const points = data.map((d, i) => {
    const angle = (2 * Math.PI * i) / n;
    const r = (d.value / 10) * radius;
    return toXY(angle, r);
  });

  const outerPoints = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return toXY(angle, radius);
  });

  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const outerPolyPoints = outerPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <circle
          key={f}
          cx={cx}
          cy={cy}
          r={radius * f}
          fill="none"
          stroke="#27272a"
          strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#27272a" strokeWidth="1" />
      ))}
      {/* Outer polygon reference */}
      <polygon points={outerPolyPoints} fill="none" stroke="#3f3f46" strokeWidth="1" />
      {/* Data polygon */}
      <polygon
        points={polyPoints}
        fill="rgba(228,255,26,0.1)"
        stroke="#e4ff1a"
        strokeWidth="2"
      />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#e4ff1a" />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const angle = (2 * Math.PI * i) / n;
        const labelR = radius + 16;
        const lp = toXY(angle, labelR);
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#a1a1aa"
            fontSize="9"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      profile: true,
      rankings: {
        orderBy: { rank: 'asc' },
        take: 5,
      },
    },
  });

  if (!person) notFound();

  const profile = person.profile;
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h1 className="text-xl font-bold mb-2">Profile still being analyzed...</h1>
        <p className="text-zinc-400 text-sm">Check back in a moment.</p>
      </div>
    );
  }

  const needs = (profile.needs as Array<{ need: string; why: string; evidence: string; confidence: number }>) || [];
  const hobbies = (profile.hobbies as Array<{ name: string; evidence: string; source: string }>) || [];
  const interests = (profile.interests as Array<{ topic: string; depth: string; evidence: string }>) || [];
  const values = (profile.values as string[]) || [];
  const greenFlags = (profile.greenFlags as string[]) || [];
  const dealBreakers = (profile.dealBreakers as string[]) || [];
  const conversationHooks = (profile.conversationHooks as string[]) || [];
  const personaCard = profile.personaCard as { tone: string; slang: string[]; emojiUse: string; sentenceLength: string; sampleVoice: string };
  const dataQuality = profile.dataQuality as { linkedin: number; instagram: number; notes: string };
  const lifestyle = profile.lifestyle as { travel: boolean; fitness: boolean; nightlife: boolean; food: boolean; pets: boolean; cityVsNature: string };

  const radarData = [
    { label: 'Energy', value: profile.radarEnergy },
    { label: 'Ambition', value: profile.radarAmbition },
    { label: 'Social', value: profile.radarSocial },
    { label: 'Adventure', value: profile.radarAdventure },
    { label: 'Creativity', value: profile.radarCreativity },
    { label: 'Warmth', value: profile.radarWarmth },
    { label: 'Humor', value: profile.radarHumor },
  ];

  const depthColors: Record<string, string> = {
    casual: 'bg-zinc-800 text-zinc-400',
    serious: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    obsessed: 'bg-lime-400/20 text-lime-400 border border-lime-400/30',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="flex items-start gap-6 mb-10">
        <div className="relative shrink-0">
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl as string}
              alt={person.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-2xl object-cover"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400">
              {person.name.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-lime-400 border-2 border-[#09090b] live-dot" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-1">{person.name}</h1>
          {profile.handle && (
            <p className="text-zinc-400 text-sm mb-2">@{profile.handle as string}</p>
          )}
          <p className="text-zinc-300 font-medium italic mb-3">&ldquo;{profile.tagline as string}&rdquo;</p>
          <div className="flex flex-wrap items-center gap-2">
            {person.location && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                📍 {person.location}
              </span>
            )}
            {person.domain && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {person.domain}
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span>LinkedIn</span>
              <span className="w-1 h-1 rounded-full bg-lime-400 inline-block" style={{ opacity: dataQuality.linkedin }} />
              <span className="text-lime-400/70">{Math.round(dataQuality.linkedin * 100)}%</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span>Instagram</span>
              <span className="w-1 h-1 rounded-full bg-lime-400 inline-block" style={{ opacity: dataQuality.instagram }} />
              <span className="text-lime-400/70">{Math.round(dataQuality.instagram * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-2">
          <Link
            href={`/rankings/${person.id}`}
            className="px-4 py-2 rounded-xl bg-lime-400 text-zinc-950 font-semibold text-sm hover:bg-lime-300 transition-colors text-center"
          >
            Who fits best →
          </Link>
          <a
            href={person.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-xs hover:text-zinc-200 hover:border-zinc-500 transition-colors text-center"
          >
            LinkedIn ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <span className="text-lime-400">🧠</span> Agent&apos;s read
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">{profile.summary as string}</p>
          </div>

          {/* Needs */}
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <span className="text-rose-400">💝</span> What they need in a partner
            </h2>
            <div className="space-y-3">
              {needs.map((need, i) => (
                <div key={i} className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-200">{need.need}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                        need.confidence > 0.7
                          ? 'bg-lime-400/20 text-lime-400'
                          : need.confidence > 0.4
                          ? 'bg-amber-400/20 text-amber-400'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {Math.round(need.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">{need.why}</p>
                  <div className="flex items-start gap-1.5">
                    <span className="text-xs text-zinc-600 shrink-0">Evidence:</span>
                    <span className="text-xs text-zinc-500 italic">&ldquo;{need.evidence}&rdquo;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <span className="text-blue-400">⚡</span> Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${depthColors[interest.depth] || 'bg-zinc-800 text-zinc-400'}`}>
                  <span>{interest.topic}</span>
                  <span className="opacity-60">· {interest.depth}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <span className="text-orange-400">🎯</span> Hobbies
            </h2>
            <div className="space-y-2">
              {hobbies.map((hobby, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-200">{hobby.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">{hobby.source}</span>
                    <span className="text-xs text-zinc-500 max-w-40 truncate">{hobby.evidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation hooks */}
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <span className="text-lime-400">💬</span> 5 things to talk about with them
            </h2>
            <div className="space-y-2">
              {conversationHooks.map((hook, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-xs font-mono text-lime-400/60 mt-0.5 w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm text-zinc-300">{hook}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Radar chart */}
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Personality Radar</h2>
            <div className="flex justify-center">
              <RadarChart data={radarData} />
            </div>
          </div>

          {/* Lifestyle */}
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Lifestyle</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries({
                Travel: lifestyle.travel,
                Fitness: lifestyle.fitness,
                Nightlife: lifestyle.nightlife,
                Food: lifestyle.food,
                Pets: lifestyle.pets,
              }).map(([key, val]) => (
                <div key={key} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${val ? 'bg-lime-400/10 text-lime-400' : 'bg-zinc-900 text-zinc-600'}`}>
                  <span>{val ? '✓' : '–'}</span>
                  <span>{key}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 col-span-2">
                🏙️ {lifestyle.cityVsNature}
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="card-surface p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Values</h2>
            <div className="flex flex-wrap gap-1.5">
              {values.map((v) => (
                <span key={v} className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-400">
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Green flags / deal breakers */}
          <div className="card-surface p-5 space-y-3">
            {greenFlags.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-green-400 mb-2">Green Flags</h3>
                <ul className="space-y-1">
                  {greenFlags.map((f) => (
                    <li key={f} className="text-xs text-zinc-400 flex items-start gap-1.5">
                      <span className="text-green-400 shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dealBreakers.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-red-400 mb-2">Possible Deal Breakers</h3>
                <ul className="space-y-1">
                  {dealBreakers.map((d) => (
                    <li key={d} className="text-xs text-zinc-400 flex items-start gap-1.5">
                      <span className="text-red-400 shrink-0">⚠</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Agent voice card */}
          <div className="card-surface p-5 border border-dashed border-zinc-700">
            <h2 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">
              Their Agent Speaks Like This
            </h2>
            <p className="text-sm text-zinc-300 italic mb-3">&ldquo;{personaCard?.sampleVoice}&rdquo;</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                {personaCard?.tone}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                emoji: {personaCard?.emojiUse}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                {personaCard?.sentenceLength} sentences
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
