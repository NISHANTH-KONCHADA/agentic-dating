import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-lime-400';
  if (score >= 70) return 'text-orange-400';
  if (score >= 55) return 'text-blue-400';
  return 'text-zinc-400';
}

export function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-lime-400/20 border-lime-400/30 text-lime-400';
  if (score >= 70) return 'bg-orange-400/20 border-orange-400/30 text-orange-400';
  if (score >= 55) return 'bg-blue-400/20 border-blue-400/30 text-blue-400';
  return 'bg-zinc-800 border-zinc-700 text-zinc-400';
}

export function getEnergyLabel(energy: number): string {
  if (energy > 0.7) return 'Extrovert';
  if (energy < 0.3) return 'Introvert';
  return 'Ambivert';
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
}
