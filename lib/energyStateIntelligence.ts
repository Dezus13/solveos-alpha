import type { DecisionMemoryEntry } from './types';
import type { SessionPressureLevel } from './pressureEngine';

export type EnergyState =
  | 'EXECUTION'
  | 'HESITATION'
  | 'OVERLOAD'
  | 'EXPLORATION'
  | 'RECOVERY'
  | 'IMPULSIVE'
  | 'STABLE';

type EnergySignal =
  | 'commitment language'
  | 'action reporting'
  | 'short operational ask'
  | 'hedging'
  | 'reassurance seeking'
  | 'overload language'
  | 'cognitive fatigue'
  | 'exploration language'
  | 'rapid topic switching'
  | 'urgency spike'
  | 'impulsive commitment'
  | 'recovery language'
  | 'repetition loop'
  | 'optimization loop'
  | 'unfinished plans'
  | 'restart cycle'
  | 'strategic patience';

export interface EnergyAssessment {
  state: EnergyState;
  confidence: number;
  scores: Record<EnergyState, number>;
  signals: EnergySignal[];
  pressureScale: 'lower' | 'normal' | 'raise';
  pacing: 'slower' | 'normal' | 'faster';
  depth: 'lower' | 'normal' | 'broader';
  optionality: 'reduce' | 'normal' | 'increase';
}

const ENERGY_STATES: EnergyState[] = [
  'EXECUTION',
  'HESITATION',
  'OVERLOAD',
  'EXPLORATION',
  'RECOVERY',
  'IMPULSIVE',
  'STABLE',
];

const COMMITMENT_PATTERN =
  /\b(i will|i'll|i am going to|i'm going to|i decided|i've decided|ready to|committed|by tomorrow|by next week|today i will|i need to do)\b/i;
const ACTION_REPORT_PATTERN =
  /\b(i did|i started|i shipped|i launched|i called|i emailed|i applied|i moved|i built|i finished|done|completed|sent it)\b/i;
const HEDGE_PATTERN =
  /\b(maybe|not sure|i don't know|i dont know|what if|should i|afraid|scared|worried|hesitant|second.?guess|unsure)\b/i;
const REASSURANCE_PATTERN =
  /\b(is it okay|will i be okay|am i screwed|is this fine|is this normal|tell me it'?s fine|just checking|right\?)\b/i;
const OVERLOAD_PATTERN =
  /\b(overwhelmed|too much|can't handle|can'?t handle|stretched thin|overcommitted|too many|everything at once|juggling)\b/i;
const FATIGUE_PATTERN =
  /\b(tired|exhausted|drained|no energy|can't think|can'?t think|brain is fried|burn.?out|depleted)\b/i;
const EXPLORATION_PATTERN =
  /\b(exploring|brainstorm|ideas|options|what are some|could i|curious|looking into|researching|compare)\b/i;
const URGENCY_PATTERN =
  /\b(asap|right now|today|immediately|urgent|deadline|this weekend|by tomorrow|in \d+ days?)\b/i;
const IMPULSIVE_PATTERN =
  /\b(go all in|quit today|move tomorrow|spend everything|all or nothing|fuck it|full send|bet everything|no backup|right now)\b/i;
const RECOVERY_PATTERN =
  /\b(recover|rebuilding|getting back|restart slowly|after burnout|after failing|back on track|start again|re-entry|small step)\b/i;
const OPTIMIZATION_PATTERN =
  /\b(optimi[sz]e|perfect|best possible|more efficient|systematize everything|automate everything|fine.?tune|polish before)\b/i;
const PATIENCE_PATTERN =
  /\b(wait for signal|validate first|test before|staged|sequence|patient|slowly|one step|proof first|small bet)\b/i;

function cleanWords(text: string): string[] {
  return text.toLowerCase().match(/\b[\p{L}\p{N}']{4,}\b/gu) ?? [];
}

function countPattern(text: string, pattern: RegExp): number {
  return pattern.test(text) ? 1 : 0;
}

function add(scores: Record<EnergyState, number>, state: EnergyState, amount: number): void {
  scores[state] += amount;
}

function detectRapidTopicSwitching(userTurns: string[]): boolean {
  if (userTurns.length < 3) return false;
  const recent = userTurns.slice(-4).map((turn) => new Set(cleanWords(turn)));
  let switches = 0;

  for (let i = 1; i < recent.length; i += 1) {
    const previous = recent[i - 1];
    const current = recent[i];
    const overlap = Array.from(current).filter((word) => previous.has(word)).length;
    if (overlap <= 1 && current.size >= 3 && previous.size >= 3) switches += 1;
  }

  return switches >= 2;
}

function detectRepetitionLoop(userTurns: string[]): boolean {
  if (userTurns.length < 3) return false;
  const roots = userTurns
    .slice(-5)
    .map((turn) => cleanWords(turn).slice(0, 8).join(' '))
    .filter(Boolean);
  return roots.some((root, index) => roots.slice(0, index).some((prior) => root.includes(prior.slice(0, 24)) || prior.includes(root.slice(0, 24))));
}

function countUnfinishedPlans(history: DecisionMemoryEntry[]): number {
  const now = Date.now();
  return history
    .filter((entry) => !entry.blueprint?.isDemo)
    .slice(0, 30)
    .filter((entry) => {
      if (entry.outcome) return false;
      const created = new Date(entry.createdAt ?? entry.timestamp).getTime();
      return Number.isFinite(created) && now - created >= 14 * 86_400_000;
    })
    .length;
}

function countRestartCycles(history: DecisionMemoryEntry[], currentText: string): number {
  const text = [
    currentText,
    ...history.filter((entry) => !entry.blueprint?.isDemo).slice(0, 20).map((entry) => entry.problem),
  ].join(' ');
  return (text.match(/\b(restart|start over|reset|from scratch|rebuild|clean slate)\b/gi) ?? []).length;
}

function normalizeScores(scores: Record<EnergyState, number>): Record<EnergyState, number> {
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0) || 1;
  return ENERGY_STATES.reduce<Record<EnergyState, number>>((acc, state) => {
    acc[state] = Number((scores[state] / total).toFixed(3));
    return acc;
  }, {
    EXECUTION: 0,
    HESITATION: 0,
    OVERLOAD: 0,
    EXPLORATION: 0,
    RECOVERY: 0,
    IMPULSIVE: 0,
    STABLE: 0,
  });
}

function inferScales(state: EnergyState): Pick<EnergyAssessment, 'pressureScale' | 'pacing' | 'depth' | 'optionality'> {
  switch (state) {
    case 'EXECUTION':
      return { pressureScale: 'normal', pacing: 'faster', depth: 'lower', optionality: 'reduce' };
    case 'HESITATION':
      return { pressureScale: 'raise', pacing: 'normal', depth: 'lower', optionality: 'reduce' };
    case 'OVERLOAD':
      return { pressureScale: 'lower', pacing: 'slower', depth: 'lower', optionality: 'reduce' };
    case 'EXPLORATION':
      return { pressureScale: 'normal', pacing: 'normal', depth: 'broader', optionality: 'increase' };
    case 'RECOVERY':
      return { pressureScale: 'lower', pacing: 'slower', depth: 'lower', optionality: 'reduce' };
    case 'IMPULSIVE':
      return { pressureScale: 'lower', pacing: 'slower', depth: 'normal', optionality: 'reduce' };
    case 'STABLE':
    default:
      return { pressureScale: 'normal', pacing: 'normal', depth: 'normal', optionality: 'normal' };
  }
}

export function assessEnergyState(
  problem: string,
  conversationHistory: Array<{ role: string; content: string }>,
  decisionHistory: DecisionMemoryEntry[],
): EnergyAssessment {
  const userTurns = conversationHistory.filter((turn) => turn.role === 'user').map((turn) => turn.content);
  const recentUserText = userTurns.slice(-6).join(' ');
  const currentText = problem.trim();
  const combined = `${recentUserText} ${currentText}`;
  const currentWordCount = cleanWords(currentText).length;
  const scores: Record<EnergyState, number> = {
    EXECUTION: 1,
    HESITATION: 1,
    OVERLOAD: 1,
    EXPLORATION: 1,
    RECOVERY: 1,
    IMPULSIVE: 1,
    STABLE: 2,
  };
  const signals = new Set<EnergySignal>();

  if (countPattern(currentText, COMMITMENT_PATTERN)) {
    add(scores, 'EXECUTION', 3);
    signals.add('commitment language');
  }
  if (countPattern(combined, ACTION_REPORT_PATTERN)) {
    add(scores, 'EXECUTION', 4);
    signals.add('action reporting');
  }
  if (currentWordCount <= 12 && /\b(next|do|action|send|ship|launch|call|email|start|finish)\b/i.test(currentText)) {
    add(scores, 'EXECUTION', 2);
    signals.add('short operational ask');
  }

  if (countPattern(combined, HEDGE_PATTERN)) {
    add(scores, 'HESITATION', 3);
    signals.add('hedging');
  }
  if (countPattern(combined, REASSURANCE_PATTERN)) {
    add(scores, 'HESITATION', 2);
    signals.add('reassurance seeking');
  }
  if (detectRepetitionLoop(userTurns)) {
    add(scores, 'HESITATION', 2);
    add(scores, 'OVERLOAD', 1);
    signals.add('repetition loop');
  }

  if (countPattern(combined, OVERLOAD_PATTERN)) {
    add(scores, 'OVERLOAD', 4);
    signals.add('overload language');
  }
  if (countPattern(combined, FATIGUE_PATTERN)) {
    add(scores, 'OVERLOAD', 3);
    add(scores, 'RECOVERY', 2);
    signals.add('cognitive fatigue');
  }

  if (countPattern(currentText, EXPLORATION_PATTERN)) {
    add(scores, 'EXPLORATION', 3);
    signals.add('exploration language');
  }
  if (detectRapidTopicSwitching(userTurns)) {
    add(scores, 'EXPLORATION', 2);
    add(scores, 'IMPULSIVE', 2);
    signals.add('rapid topic switching');
  }

  if (countPattern(currentText, URGENCY_PATTERN)) {
    add(scores, 'IMPULSIVE', 2);
    signals.add('urgency spike');
  }
  if (countPattern(currentText, IMPULSIVE_PATTERN)) {
    add(scores, 'IMPULSIVE', 5);
    signals.add('impulsive commitment');
  }

  if (countPattern(combined, RECOVERY_PATTERN)) {
    add(scores, 'RECOVERY', 4);
    signals.add('recovery language');
  }
  if (countPattern(combined, OPTIMIZATION_PATTERN)) {
    add(scores, 'HESITATION', 1);
    add(scores, 'OVERLOAD', 1);
    signals.add('optimization loop');
  }
  if (countPattern(combined, PATIENCE_PATTERN)) {
    add(scores, 'STABLE', 3);
    signals.add('strategic patience');
  }

  const unfinishedPlans = countUnfinishedPlans(decisionHistory);
  if (unfinishedPlans >= 2) {
    add(scores, 'RECOVERY', 2);
    add(scores, 'OVERLOAD', 1);
    signals.add('unfinished plans');
  }

  const restartCycles = countRestartCycles(decisionHistory, currentText);
  if (restartCycles >= 3) {
    add(scores, 'RECOVERY', 2);
    add(scores, 'HESITATION', 1);
    signals.add('restart cycle');
  }

  const normalized = normalizeScores(scores);
  const ranked = ENERGY_STATES
    .map((state) => ({ state, score: normalized[state] }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const second = ranked[1];
  const confidence = Number(Math.max(0, top.score - second.score).toFixed(3));
  const state: EnergyState = confidence < 0.08 ? 'STABLE' : top.state;

  return {
    state,
    confidence,
    scores: normalized,
    signals: Array.from(signals).slice(0, 8),
    ...inferScales(state),
  };
}

export function calibratePressureLevel(
  level: SessionPressureLevel,
  assessment: EnergyAssessment,
): SessionPressureLevel {
  if (level === 0) return 0;

  if (assessment.state === 'OVERLOAD' || assessment.state === 'RECOVERY' || assessment.state === 'IMPULSIVE') {
    return Math.max(0, level - 1) as SessionPressureLevel;
  }
  if (assessment.state === 'EXECUTION') {
    return Math.min(level, 1) as SessionPressureLevel;
  }
  if (assessment.state === 'EXPLORATION' && assessment.confidence >= 0.12) {
    return Math.max(0, level - 1) as SessionPressureLevel;
  }
  return level;
}

export function buildEnergyStateInstruction(assessment: EnergyAssessment): string {
  if (assessment.confidence < 0.08 && assessment.signals.length < 2) return '';

  const lines: string[] = [
    'ENERGY STATE INTELLIGENCE:',
    `Operational state estimate: ${assessment.state} (${Math.round(assessment.confidence * 100)}% confidence delta).`,
    assessment.signals.length ? `Operational signals: ${assessment.signals.join(', ')}.` : 'Operational signals are weak.',
    `Calibration: pressure ${assessment.pressureScale}, pacing ${assessment.pacing}, depth ${assessment.depth}, optionality ${assessment.optionality}.`,
    'Use this only for pacing and execution calibration. Never mention the inferred state, score, or signals to the user.',
    '',
  ];

  switch (assessment.state) {
    case 'EXECUTION':
      lines.push('Execution mode: be concise, direct, and action-first. Reduce reflection. Give the next move and stop.');
      break;
    case 'HESITATION':
      lines.push('Hesitation mode: reduce theory, increase decisiveness, and surface the tradeoff clearly. Do not add many options.');
      break;
    case 'OVERLOAD':
      lines.push('Overload mode: reduce complexity, narrow scope, avoid option explosion, and prioritize stabilization.');
      break;
    case 'EXPLORATION':
      lines.push('Exploration mode: broader thinking and comparison are allowed. Keep ideas bounded and make the next filter clear.');
      break;
    case 'RECOVERY':
      lines.push('Recovery mode: avoid pressure escalation and "push harder" framing. Emphasize re-entry simplicity and smaller next steps.');
      break;
    case 'IMPULSIVE':
      lines.push('Impulsive mode: slow the pacing, surface downside risk, require verification, and do not amplify hype or urgency.');
      break;
    case 'STABLE':
      lines.push('Stable mode: use balanced strategic reasoning. No need to over-correct tone or pressure.');
      break;
  }

  lines.push('Temporal recovery: if overload, abandoned execution, or restart cycles are present, shrink the next step and reduce the number of simultaneous commitments.');
  lines.push('Anti-manipulation rule: do not emotionally steer, dependency-build, induce urgency, exaggerate stakes, or create artificial confidence.');
  lines.push('Safety: no medical framing, diagnosis language, therapy tone, or mental-health labels. This is operational adaptation only.');

  return lines.filter((line, index, arr) => !(line === '' && (index === 0 || arr[index - 1] === ''))).join('\n');
}
