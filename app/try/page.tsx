'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PersonInput {
  name: string;
  linkedinUrl: string;
  instagramUrl: string;
  status: 'idle' | 'validating' | 'scraping' | 'analyzing' | 'prescreening' | 'dating' | 'ranking' | 'done' | 'error';
  error?: string;
  personId?: string;
}

const STEPS = [
  { id: 'scraping', label: 'Scraping profiles' },
  { id: 'analyzing', label: 'Analyzing person' },
  { id: 'prescreening', label: 'Pre-screening all pairs' },
  { id: 'dating', label: 'Running dates' },
  { id: 'ranking', label: 'Computing rankings' },
];

export default function TryPage() {
  const router = useRouter();
  const [people, setPeople] = useState<PersonInput[]>([
    { name: '', linkedinUrl: '', instagramUrl: '', status: 'idle' },
  ]);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPerson = () => {
    setPeople([...people, { name: '', linkedinUrl: '', instagramUrl: '', status: 'idle' }]);
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, field: keyof PersonInput, value: string) => {
    const updated = [...people];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setPeople(updated);
  };


  const validateUrl = (url: string, type: 'linkedin' | 'instagram'): boolean => {
    if (type === 'linkedin') return url.includes('linkedin.com/in/');
    if (type === 'instagram') return url.includes('instagram.com/');
    return false;
  };

  const runAgents = async () => {
    setRunning(true);
    setError(null);

    try {
      // Create a run
      const runRes = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: people.map((p) => ({ name: p.name, linkedinUrl: p.linkedinUrl, instagramUrl: p.instagramUrl })) }),
      });
      const runData = await runRes.json();
      const newRunId = runData.runId;
      setRunId(newRunId);

      // Step 1: Scrape and analyze each person
      setCurrentStep('scraping');
      const personIds: string[] = [];

      for (let i = 0; i < people.length; i++) {
        const person = people[i];
        const updated = [...people];
        updated[i].status = 'scraping';
        setPeople([...updated]);

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkedinUrl: person.linkedinUrl,
            instagramUrl: person.instagramUrl,
            name: person.name,
            runId: newRunId,
          }),
        });

        const data = await res.json();
        if (data.error) {
          updated[i].status = 'error';
          updated[i].error = data.error;
          setPeople([...updated]);
          continue;
        }

        personIds.push(data.personId);
        updated[i].status = 'done';
        updated[i].personId = data.personId;
        setPeople([...updated]);
      }

      // Step 2: Get all existing people in the pool for pre-screening
      setCurrentStep('prescreening');
      const poolRes = await fetch('/api/people');
      const poolData = await poolRes.json();
      const poolIds = poolData.people?.map((p: { id: string }) => p.id) || [];

      // Pre-screen new people against the pool
      for (const newId of personIds) {
        for (const poolId of poolIds) {
          if (newId === poolId) continue;
          await fetch('/api/prescreen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ personAId: newId, personBId: poolId }),
          });
        }
      }

      // Step 3: Run top-5 dates for each new person
      setCurrentStep('dating');
      for (const personId of personIds) {
        const topMatchRes = await fetch(`/api/prescreen/top?personId=${personId}&limit=5`);
        const topMatches = await topMatchRes.json();

        for (const match of topMatches.matches || []) {
          await fetch('/api/date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ personAId: personId, personBId: match.candidateId }),
          });
        }
      }

      // Step 4: Compute rankings
      setCurrentStep('ranking');
      await fetch('/api/rankings/compute');

      // Done — navigate to first person's profile
      if (personIds.length > 0) {
        router.push(`/p/${personIds[0]}`);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRunning(false);
      setCurrentStep(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Try it with your own links</h1>
        <p className="text-zinc-400">
          Paste public LinkedIn and public Instagram URLs. Your agent will analyze you and date the existing pool of 30 people.
        </p>
      </div>

      {/* People inputs */}
      <div className="space-y-4 mb-6">
        {people.map((person, index) => (
          <div key={index} className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm text-zinc-300">
                Person {index + 1}
              </h3>
              <div className="flex items-center gap-3">
                {person.status !== 'idle' && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      person.status === 'done'
                        ? 'bg-lime-400/20 text-lime-400'
                        : person.status === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {person.status}
                  </span>
                )}
                {people.length > 1 && (
                  <button
                    onClick={() => removePerson(index)}
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updatePerson(index, 'name', e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  disabled={running}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={person.linkedinUrl}
                  onChange={(e) => updatePerson(index, 'linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourhandle"
                  disabled={running}
                  className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 ${
                    person.linkedinUrl && !validateUrl(person.linkedinUrl, 'linkedin')
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-zinc-700 focus:border-zinc-500'
                  }`}
                />
                {person.linkedinUrl && !validateUrl(person.linkedinUrl, 'linkedin') && (
                  <p className="text-xs text-red-400 mt-1">Must be a linkedin.com/in/ URL</p>
                )}
              </div>

              <div>
                <label className="text-xs text-zinc-500 block mb-1">Instagram URL (must be public)</label>
                <input
                  type="url"
                  value={person.instagramUrl}
                  onChange={(e) => updatePerson(index, 'instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  disabled={running}
                  className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 ${
                    person.instagramUrl && !validateUrl(person.instagramUrl, 'instagram')
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-zinc-700 focus:border-zinc-500'
                  }`}
                />
              </div>
            </div>

            {person.error && (
              <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {person.error}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addPerson}
        disabled={running}
        className="w-full py-2 rounded-lg border border-dashed border-zinc-700 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors disabled:opacity-50"
      >
        + Add another person
      </button>

      {/* Run button */}
      <div className="mt-6">
        <button
          onClick={runAgents}
          disabled={running || people.some((p) => !p.linkedinUrl || !p.instagramUrl)}
          className="w-full py-3 rounded-xl bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {running ? 'Running agents...' : 'Run Agents →'}
        </button>
      </div>

      {/* Progress stepper */}
      {running && (
        <div className="mt-8 card-surface p-5">
          <h3 className="text-sm font-medium mb-4 text-zinc-300">Pipeline progress</h3>
          <div className="space-y-3">
            {STEPS.map((step) => {
              const isDone = STEPS.findIndex((s) => s.id === currentStep) > STEPS.findIndex((s) => s.id === step.id);
              const isCurrent = step.id === currentStep;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                      isDone
                        ? 'bg-lime-400 border-lime-400 text-zinc-950'
                        : isCurrent
                        ? 'border-lime-400 text-lime-400'
                        : 'border-zinc-700 text-zinc-700'
                    }`}
                  >
                    {isDone ? '✓' : isCurrent ? '●' : '○'}
                  </div>
                  <span
                    className={`text-sm ${
                      isDone ? 'text-zinc-400 line-through' : isCurrent ? 'text-zinc-200' : 'text-zinc-600'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <div className="flex gap-1 ml-auto">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="typing-dot w-1.5 h-1.5 rounded-full bg-lime-400"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <p className="text-xs text-zinc-500 leading-relaxed">
          <strong className="text-zinc-400">Privacy:</strong> We only read public information from the two links you provide.
          No private data is accessed. Your profiles are analyzed by AI and may be stored in our demo database.
          You can request removal at any time.
        </p>
      </div>
    </div>
  );
}
