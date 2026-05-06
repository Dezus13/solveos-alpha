import type { DecisionMemoryEntry } from './types';

type DecaySpeed = 'fast' | 'medium' | 'slow';
type TemporalWindow = 'short-term' | 'medium-term' | 'long-term';
type DecaySignal =
  | 'emotional urgency'
  | 'temporary hesitation'
  | 'short-term overload'
  | 'transient excitement'
  | 'exploration theme'
  | 'tactical goal'
  | 'active project'
  | 'execution pacing'
  | 'long-term goal'
  | 'behavior loop'
  | 'strategic contradiction'
  | 'recurring pattern';

interface DecayedEntry {
  entry: DecisionMemoryEntry;
  signal: DecaySignal;
  decaySpeed: DecaySpeed;
  window: TemporalWindow;
  ageDays: number;
  freshness: number;
  durable: boolean;
}

export interface MemoryDecayAssessment {
  decayedHistory: DecisionMemoryEntry[];
  shortTermCount: number;
  mediumTermCount: number;
  longTermCount: number;
  averageFreshness: number;
  staleSignalSuppression: boolean;
  expiredPressureSuppressed: boolean;
  callbackAllowed: boolean;
  preservedDurablePatterns: string[];
  prunedCount: number;
  rationale: string[];
}

const DAY_MS = 86_400_000;
const HALF_LIFE_DAYS: Record<DecaySpeed, number> = {
  fast: 7,
  medium: 35,
  slow: 150,
};

const SIGNAL_PATTERNS: Array<{ signal: DecaySignal; speed: DecaySpeed; pattern: RegExp }> = [
  { signal: 'emotional urgency', speed: 'fast', pattern: /\b(urgent|asap|right now|panic|today|immediately|deadline|scared|worried)\b/i },
  { signal: 'temporary hesitation', speed: 'fast', pattern: /\b(maybe|not sure|hesitant|what if|still thinking|afraid|second.?guess)\b/i },
  { signal: 'short-term overload', speed: 'fast', pattern: /\b(overwhelmed|too much|exhausted|no energy|burn.?out|stretched thin)\b/i },
  { signal: 'transient excitement', speed: 'fast', pattern: /\b(excited|huge opportunity|massive|big move|all in|10x|new idea)\b/i },
  { signal: 'exploration theme', speed: 'medium', pattern: /\b(exploring|brainstorm|ideas|options|researching|looking into|compare)\b/i },
  { signal: 'tactical goal', speed: 'medium', pattern: /\b(launch|build|ship|mvp|roadmap|campaign|pricing|sales calls?|content plan)\b/i },
  { signal: 'active project', speed: 'medium', pattern: /\b(startup|product|business|agency|course|job search|project|client)\b/i },
  { signal: 'execution pacing', speed: 'medium', pattern: /\b(sprint|weekly|routine|pace|execution|habit|schedule|deadline)\b/i },
  { signal: 'long-term goal', speed: 'slow', pattern: /\b(long.?term|direction|purpose|career|life plan|mission|freedom|independence)\b/i },
  { signal: 'behavior loop', speed: 'slow', pattern: /\b(again|keep|always|pattern|loop|avoid|restart|start over|from scratch)\b/i },
  { signal: 'strategic contradiction', speed: 'slow', pattern: /\b(tradeoff|contradiction|conflict|freedom.*salary|risk.*safety|scale.*runway)\b/i },
  { signal: 'recurring pattern', speed: 'slow', pattern: /\b(repeated|recurring|keeps happening|same issue|still stuck|unresolved)\b/i },
];

function ageDays(entry: DecisionMemoryEntry): number {
  const created = new Date(entry.createdAt ?? entry.timestamp).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.round((Date.now() - created) / DAY_MS));
}

function freshness(age: number, speed: DecaySpeed): number {
  return Number(Math.pow(0.5, age / HALF_LIFE_DAYS[speed]).toFixed(3));
}

function classifyWindow(age: number): TemporalWindow {
  if (age <= 14) return 'short-term';
  if (age <= 90) return 'medium-term';
  return 'long-term';
}

function classifySignal(entry: DecisionMemoryEntry): { signal: DecaySignal; speed: DecaySpeed } {
  const text = [
    entry.problem,
    entry.blueprint?.recommendation ?? '',
    entry.blueprint?.hiddenPain ?? '',
    entry.tags?.join(' ') ?? '',
  ].join(' ');

  for (const item of SIGNAL_PATTERNS) {
    if (item.pattern.test(text)) return { signal: item.signal, speed: item.speed };
  }
  return { signal: 'tactical goal', speed: 'medium' };
}

function isDurable(entry: DecisionMemoryEntry, signal: DecaySignal): boolean {
  if (entry.outcome && entry.outcomeStatus !== 'unknown') return true;
  if (entry.tags?.some((tag) => tag.startsWith('narrative:') || tag === 'strategic')) return true;
  return signal === 'long-term goal' || signal === 'behavior loop' || signal === 'strategic contradiction' || signal === 'recurring pattern';
}

function repeatedDurableSignals(entries: DecayedEntry[]): Set<DecaySignal> {
  const counts = entries.reduce<Partial<Record<DecaySignal, number>>>((acc, item) => {
    if (item.decaySpeed === 'slow') acc[item.signal] = (acc[item.signal] ?? 0) + 1;
    return acc;
  }, {});
  return new Set(
    Object.entries(counts)
      .filter(([, count]) => (count ?? 0) >= 2)
      .map(([signal]) => signal as DecaySignal),
  );
}

export function assessMemoryDecay(history: DecisionMemoryEntry[]): MemoryDecayAssessment {
  const realHistory = history.filter((entry) => !entry.blueprint?.isDemo);
  const decayed = realHistory.slice(0, 80).map<DecayedEntry>((entry) => {
    const classified = classifySignal(entry);
    const age = ageDays(entry);
    return {
      entry,
      signal: classified.signal,
      decaySpeed: classified.speed,
      window: classifyWindow(age),
      ageDays: age,
      freshness: freshness(age, classified.speed),
      durable: isDurable(entry, classified.signal),
    };
  });
  const repeated = repeatedDurableSignals(decayed);
  const kept = decayed.filter((item) => {
    if (item.freshness >= 0.18) return true;
    if (item.durable && item.freshness >= 0.08) return true;
    if (repeated.has(item.signal)) return true;
    return false;
  });
  const staleFastSignals = decayed.filter((item) => item.decaySpeed === 'fast' && item.freshness < 0.18).length;
  const recentRecoveryOrExecution = decayed.some((item) => (
    item.ageDays <= 21 &&
    /\b(i did|done|completed|shipped|launched|recovered|back on track|started)\b/i.test(item.entry.problem)
  ));
  const averageFreshness = kept.length
    ? Number((kept.reduce((sum, item) => sum + item.freshness, 0) / kept.length).toFixed(3))
    : 0;
  const preservedDurablePatterns = Array.from(repeated).map((signal) => signal.replace(/-/g, ' ')).slice(0, 5);
  const callbackAllowed = kept.some((item) => item.freshness >= 0.35 || item.durable) && averageFreshness >= 0.2;

  return {
    decayedHistory: kept
      .sort((a, b) => b.freshness - a.freshness || a.ageDays - b.ageDays)
      .map((item) => item.entry),
    shortTermCount: kept.filter((item) => item.window === 'short-term').length,
    mediumTermCount: kept.filter((item) => item.window === 'medium-term').length,
    longTermCount: kept.filter((item) => item.window === 'long-term').length,
    averageFreshness,
    staleSignalSuppression: staleFastSignals > 0,
    expiredPressureSuppressed: staleFastSignals >= 2 || recentRecoveryOrExecution,
    callbackAllowed,
    preservedDurablePatterns,
    prunedCount: Math.max(0, realHistory.length - kept.length),
    rationale: [
      `${staleFastSignals} stale fast-decay signal${staleFastSignals === 1 ? '' : 's'} suppressed.`,
      `${kept.length} of ${realHistory.length} memories kept for this turn.`,
      preservedDurablePatterns.length ? `Durable patterns preserved: ${preservedDurablePatterns.join(', ')}.` : 'No repeated durable pattern required preservation.',
      recentRecoveryOrExecution ? 'Recent recovery/execution evidence reduces old pressure influence.' : '',
    ].filter(Boolean),
  };
}

export function buildMemoryDecayInstruction(assessment: MemoryDecayAssessment): string {
  return [
    'MEMORY DECAY AND SIGNAL AGING:',
    `Freshness: ${Math.round(assessment.averageFreshness * 100)}%. Context windows: short ${assessment.shortTermCount}, medium ${assessment.mediumTermCount}, long ${assessment.longTermCount}.`,
    assessment.staleSignalSuppression ? 'Stale fast-decay signals are suppressed for this turn.' : '',
    assessment.expiredPressureSuppressed ? 'Expired pressure, overload, or hesitation context should not dominate this answer.' : '',
    assessment.callbackAllowed ? 'Historical callback is allowed only if highly relevant and naturally useful.' : 'Callback restraint active: do not reference history visibly unless the user asks.',
    assessment.preservedDurablePatterns.length ? `Durable patterns may inform reasoning quietly: ${assessment.preservedDurablePatterns.join(', ')}.` : '',
    'Recent signals should dominate older ones. Do not lock the user into old patterns if current evidence shows recovery, execution, or changed constraints.',
    'No surveillance-like callbacks. Historical references must be rare, high-relevance, and naturally woven.',
  ].filter(Boolean).join('\n');
}
