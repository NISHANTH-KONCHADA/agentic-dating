import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Agentic Dating — AI Agents Date on Your Behalf',
  description:
    'Every person is represented by an AI agent. The agents read your public LinkedIn and Instagram, analyze who you are, then date on your behalf. See who fits you best.',
  openGraph: {
    title: 'Agentic Dating',
    description: 'AI agents date on your behalf. Real people, real matches.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#09090b] text-zinc-50 antialiased`}>
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <a href="/" className="flex items-center gap-2 group">
              <span className="text-xl">💘</span>
              <span className="font-semibold tracking-tight text-zinc-50">
                Agentic<span className="text-lime-400">Dating</span>
              </span>
            </a>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <a href="/demo" className="hover:text-zinc-200 transition-colors">Demo</a>
              <a href="/rankings" className="hover:text-zinc-200 transition-colors">Rankings</a>
              <a href="/dates" className="hover:text-zinc-200 transition-colors">Live Dates</a>
              <a href="/how-it-works" className="hover:text-zinc-200 transition-colors">How it Works</a>
              <a
                href="/try"
                className="px-3 py-1.5 rounded-lg bg-lime-400 text-zinc-950 font-medium hover:bg-lime-300 transition-colors text-xs"
              >
                Try it →
              </a>
            </div>
          </div>
        </nav>
        <main className="pt-14">{children}</main>
        <footer className="border-t border-zinc-800 mt-24 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-zinc-600">
            <p>
              Demo of public data only. All profiles sourced from public LinkedIn and Instagram.{' '}
              <a href="mailto:contact@agenticdating.com" className="underline hover:text-zinc-400">
                Request removal
              </a>
              .
            </p>
            <p className="mt-2">Built in ~3 hours as a technical demo. Not a commercial service.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
