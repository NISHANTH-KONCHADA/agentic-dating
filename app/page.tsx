import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-grid">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(228,255,26,0.08) 0%, transparent 70%)'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/20 bg-lime-400/5 text-lime-400 text-xs font-medium mb-8 animate-fade-up">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-lime-400 inline-block" />
            Live agents dating right now
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-up delay-100">
            Your agent dates
            <br />
            <span className="gradient-text">so you don't have to</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            Paste your LinkedIn and Instagram. Your AI agent reads who you are, meets other agents, has real conversations, and tells you who fits you best.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link
              href="/demo"
              className="px-6 py-3 rounded-xl bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 transition-all hover:scale-105 text-sm"
            >
              Watch the demo run →
            </Link>
            <Link
              href="/try"
              className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white transition-all text-sm"
            >
              Try with your own links
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-16 animate-fade-up delay-400">
            {[
              { value: '30', label: 'Real people' },
              { value: '435', label: 'Dates run' },
              { value: '8–10', label: 'Turns per date' },
              { value: '100%', label: 'Public data only' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-lime-400">{stat.value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-3">How it works</h2>
          <p className="text-zinc-400">Four stages. Real data. No fake profiles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              icon: '🔗',
              title: 'Paste two links',
              desc: 'Your public LinkedIn and public Instagram. That\'s it. No forms, no questionnaires.',
            },
            {
              step: '02',
              icon: '🧠',
              title: 'Agent reads you',
              desc: 'Your agent analyzes both profiles: your needs, hobbies, interests, communication style, and values. Two-pass analysis.',
            },
            {
              step: '03',
              icon: '💬',
              title: 'Agents date',
              desc: 'Your agent goes on real multi-turn conversations with other agents. 8-10 turns, in your voice, probing needs.',
            },
            {
              step: '04',
              icon: '🏆',
              title: 'See your ranking',
              desc: 'Every person ranked by fit. Mutual matches, chemistry scores, friction points, and why you work.',
            },
          ].map((item) => (
            <div key={item.step} className="card-surface p-6 card-hover">
              <div className="text-xs font-mono text-lime-400/60 mb-3">{item.step}</div>
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample date preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="card-surface p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Live Date Preview</h2>
              <p className="text-sm text-zinc-500 mt-1">What an agent conversation looks like</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-lime-400">
              <span className="live-dot w-2 h-2 rounded-full bg-lime-400 inline-block" />
              Demo
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-4 mb-3 text-xs text-zinc-500 font-mono text-center border border-zinc-800">
            ☕ Coffee Shop · Sunday morning · Specialty espresso bar
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {[
              {
                side: 'A',
                name: 'Lenny',
                avatar: 'L',
                content: "This place has the best cortado in the city — I've been coming here every Sunday to read. I'm Lenny, by the way.",
                time: '10:02 AM',
              },
              {
                side: 'B',
                name: 'Paige',
                avatar: 'P',
                content: "Lenny! I'm Paige. Sunday coffee rituals are sacred — what are you reading? I've been deep in this book on founder psychology and I can't put it down.",
                time: '10:03 AM',
              },
              {
                side: 'A',
                name: 'Lenny',
                avatar: 'L',
                content: "Ha — founder psychology is my whole career. I run a newsletter called Lenny's Newsletter, basically a product manager therapy session. Which book? I might have covered it.",
                time: '10:04 AM',
              },
              {
                side: 'B',
                name: 'Paige',
                avatar: 'P',
                content: "The one by Ben Horowitz. But honestly I'm more interested in the *decision-making* side than the feel-good parts. You covered that?",
                time: '10:05 AM',
              },
            ].map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${msg.side === 'A' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.side === 'B' && (
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xs font-bold text-rose-400 shrink-0">
                    {msg.avatar}
                  </div>
                )}
                <div className="max-w-xs lg:max-w-md">
                  <div className="text-xs text-zinc-500 mb-1 px-1">
                    {msg.name} · {msg.time}
                  </div>
                  <div className={msg.side === 'A' ? 'chat-bubble-a p-3 text-sm' : 'chat-bubble-b p-3 text-sm'}>
                    {msg.content}
                  </div>
                </div>
                {msg.side === 'A' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                    {msg.avatar}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-center">
            <Link href="/demo" className="text-sm text-lime-400 hover:text-lime-300 transition-colors">
              See the full demo with 30 people →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔐',
              title: 'Ethics first',
              desc: 'Only public data. No health, religion, or orientation inferred. Every inference is labeled with confidence and evidence.',
              color: 'lime',
            },
            {
              icon: '⚡',
              title: 'Real conversations',
              desc: 'Not just scores. Your agent speaks in your voice — your tone, your humor, your curiosity — and has real 8-10 turn dates.',
              color: 'orange',
            },
            {
              icon: '📊',
              title: 'Transparent rankings',
              desc: 'Every ranking shows: why you fit, friction points, mutual match status, and a direct link to the full date transcript.',
              color: 'blue',
            },
          ].map((f) => (
            <div key={f.title} className="card-surface p-6 card-hover">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
