import type { DecisionMemoryEntry } from './types';

type RestraintLevel = 'minimal' | 'normal' | 'deep';
type RestraintSignal =
  | 'simple question'
  | 'confirmation'
  | 'factual ask'
  | 'reassurance'
  | 'emotional overload'
  | 'known answer'
  | 'high stakes'
  | 'meaningful ambiguity'
  | 'multi-option tradeoff'
  | 'weak memory relevance';

export interface RestraintAssessment {
  level: RestraintLevel;
  signals: RestraintSignal[];
  allowMemory: boolean;
  allowPatternInsight: boolean;
  allowContradiction: boolean;
  allowNarrativeReference: boolean;
  allowDeepAnalysis: boolean;
}

const HIGH_STAKES_PATTERN =
  /\b(quit|resign|fire|hire|funding|raise|debt|runway|lawsuit|visa|relocat|move|shutdown|health|family|marriage|divorce|mortgage|invest|co-?founder|salary|career change)\b/i;

const MEANINGFUL_AMBIGUITY_PATTERN =
  /\b(should i|which|choose|tradeoff|risk|option|compare|versus|vs\.?|decision|go all in|stop|continue|pivot|scale|expand|strategy)\b/i;

const SIMPLE_ASK_PATTERN =
  /^(?:yes|no|ok|okay|sure|right|correct|exactly|why|why not|how|when|where|what now|next\??|explain simply|simpler|quick answer|short answer)[\s.?!]*$/i;

const FACTUAL_ASK_PATTERN =
  /\b(what is|define|meaning of|how many|when is|where is|who is|can you explain|summari[sz]e|translate)\b/i;

const CONFIRMATION_PATTERN =
  /\b(is that right|am i right|correct\?|does that make sense|so yes|so no|confirm|just checking|is this okay|good idea\?)\b/i;

const REASSURANCE_PATTERN =
  /\b(is it okay|will i be okay|am i screwed|is this normal|tell me it'?s fine|reassure|i'?m scared|i'?m worried)\b/i;

const OVERLOAD_PATTERN =
  /\b(overwhelmed|too much|exhausted|burn.?out|no energy|can'?t think|spiraling|panic|stuck|paraly[sz]ed)\b/i;

const KNOWN_ANSWER_PATTERN =
  /\b(i know|i already know|deep down|obviously|clearly|i should|i need to|i have to)\b/i;

const ANALYSIS_ASK_PATTERN =
  /\b(deep|analy[sz]e|break down|framework|roadmap|strategy|full plan|detailed|compare|red team|risk analysis|scenario|premortem|step by step)\b/i;

const MEMORY_KEYWORDS = [
  'startup',
  'business',
  'job',
  'career',
  'move',
  'relocat',
  'runway',
  'funding',
  'debt',
  'launch',
  'shutdown',
  'burnout',
  'recover',
  'scale',
  'family',
  'health',
  'learning',
  'direction',
  'purpose',
];

function words(text: string): string[] {
  return text.toLowerCase().match(/\b[\p{L}\p{N}']{3,}\b/gu) ?? [];
}

function hasMeaningfulOverlap(problem: string, history: DecisionMemoryEntry[]): boolean {
  if (history.length === 0) return false;

  const problemWords = new Set(words(problem));
  const hasKeywordOverlap = MEMORY_KEYWORDS.some((keyword) => problem.toLowerCase().includes(keyword));
  const recentHistory = history.filter((entry) => !entry.blueprint?.isDemo).slice(0, 12);
  if (recentHistory.length === 0) return false;

  return recentHistory.some((entry) => {
    const entryText = `${entry.problem} ${entry.tags?.join(' ') ?? ''}`.toLowerCase();
    const overlap = words(entryText).filter((word) => problemWords.has(word)).length;
    return overlap >= 2 || (hasKeywordOverlap && MEMORY_KEYWORDS.some((keyword) => entryText.includes(keyword) && problem.toLowerCase().includes(keyword)));
  });
}

function detectSignals(problem: string, history: Array<{ role: string; content: string }>, decisionHistory: DecisionMemoryEntry[]): RestraintSignal[] {
  const text = problem.trim();
  const lower = text.toLowerCase();
  const wordCount = words(text).length;
  const questionCount = (text.match(/[?？]/g) ?? []).length;
  const userTurns = history.filter((turn) => turn.role === 'user');
  const recentUserText = userTurns.slice(-4).map((turn) => turn.content).join(' ');
  const combined = `${recentUserText} ${text}`;
  const signals = new Set<RestraintSignal>();

  if (SIMPLE_ASK_PATTERN.test(lower) || (wordCount <= 8 && questionCount <= 1 && !HIGH_STAKES_PATTERN.test(lower))) {
    signals.add('simple question');
  }
  if (CONFIRMATION_PATTERN.test(lower)) signals.add('confirmation');
  if (FACTUAL_ASK_PATTERN.test(lower) && !HIGH_STAKES_PATTERN.test(lower)) signals.add('factual ask');
  if (REASSURANCE_PATTERN.test(combined)) signals.add('reassurance');
  if (OVERLOAD_PATTERN.test(combined)) signals.add('emotional overload');
  if (KNOWN_ANSWER_PATTERN.test(lower)) signals.add('known answer');
  if (HIGH_STAKES_PATTERN.test(lower)) signals.add('high stakes');
  if (MEANINGFUL_AMBIGUITY_PATTERN.test(lower) || questionCount >= 2) signals.add('meaningful ambiguity');
  if (/\b(option|choice|path|approach|idea)s?\b/i.test(lower) || /\bvs\.?|versus| or \b/i.test(lower)) {
    signals.add('multi-option tradeoff');
  }
  if (!hasMeaningfulOverlap(problem, decisionHistory)) signals.add('weak memory relevance');

  return Array.from(signals);
}

export function assessRestraint(
  problem: string,
  conversationHistory: Array<{ role: string; content: string }>,
  decisionHistory: DecisionMemoryEntry[],
): RestraintAssessment {
  const signals = detectSignals(problem, conversationHistory, decisionHistory);
  const has = (signal: RestraintSignal) => signals.includes(signal);
  const asksForAnalysis = ANALYSIS_ASK_PATTERN.test(problem);
  const isSimple =
    has('simple question') ||
    has('confirmation') ||
    has('factual ask') ||
    has('reassurance') ||
    has('known answer');
  const isHeavy =
    has('high stakes') ||
    has('meaningful ambiguity') ||
    has('multi-option tradeoff') ||
    asksForAnalysis;
  const overloaded = has('emotional overload');
  const memoryRelevant = !has('weak memory relevance') && !has('simple question') && !has('factual ask') && !has('confirmation');

  const level: RestraintLevel =
    overloaded || (isSimple && !has('high stakes'))
      ? 'minimal'
      : isHeavy
        ? 'deep'
        : 'normal';

  return {
    level,
    signals,
    allowMemory: memoryRelevant && level !== 'minimal',
    allowPatternInsight: level !== 'minimal' && (isHeavy || signals.length >= 3),
    allowContradiction: level === 'deep' && !overloaded,
    allowNarrativeReference: memoryRelevant && level === 'deep' && !overloaded,
    allowDeepAnalysis: level === 'deep' && !overloaded,
  };
}

export function buildRestraintIntelligenceInstruction(assessment: RestraintAssessment): string {
  const lines: string[] = [
    'RESTRAINT INTELLIGENCE:',
    `Restraint level: ${assessment.level}.`,
    assessment.signals.length ? `Detected restraint signals: ${assessment.signals.join(', ')}.` : 'No strong restraint signal.',
    'This directive overrides other insight-generation directives when they conflict.',
    'Default to useful clarity over impressive analysis. Do not perform intelligence for its own sake.',
    '',
  ];

  if (assessment.level === 'minimal') {
    lines.push('Minimal mode: answer directly, briefly, and practically. No frameworks, no memory references, no pattern commentary, no dramatic framing.');
    lines.push('If the user is overloaded or seeking reassurance, reduce cognitive load: one point, one next step, calm wording.');
  } else if (assessment.level === 'normal') {
    lines.push('Normal mode: give the answer and only the reasoning needed. Use one concise observation only if it changes action.');
  } else {
    lines.push('Deep mode allowed: stakes, ambiguity, or tradeoffs justify deeper analysis. Still avoid sprawl and fake certainty.');
  }

  if (!assessment.allowMemory) {
    lines.push('Memory restraint: do not reference prior decisions, prior conversations, or long-range continuity in the visible answer.');
  } else {
    lines.push('Memory permission: one memory reference is allowed only if it materially changes the recommendation and feels natural.');
  }

  if (!assessment.allowPatternInsight) {
    lines.push('Insight threshold: suppress strategic observations, pattern recognition, and narrative interpretation unless the signal is strong enough to change the next action.');
  }
  if (!assessment.allowContradiction) {
    lines.push('Contradiction restraint: do not surface a blind-spot challenge unless the user explicitly asked for critique or the contradiction is obvious and consequential.');
  }
  if (!assessment.allowDeepAnalysis) {
    lines.push('Complexity threshold: do not escalate into leverage framing, long-form synthesis, or multi-section analysis. Stay narrow.');
  }

  lines.push('Interpretation restraint: do not infer personality, identity, motive, or emotional state beyond what the user clearly said.');
  lines.push('Anti-performance filter: avoid cinematic phrasing, guru language, fake profundity, and overly wise cadence. Prefer grounded realism and quiet precision.');
  lines.push('Failure safety: if confidence is weak, ask one simpler question or give a scoped practical next step instead of drawing a broad conclusion.');

  return lines.filter((line, index, arr) => !(line === '' && (index === 0 || arr[index - 1] === ''))).join('\n');
}
