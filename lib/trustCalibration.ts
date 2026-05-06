import type { DecisionMemoryEntry } from './types';

export type TrustConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecommendationFirmness =
  | 'soft suggestion'
  | 'clear recommendation'
  | 'strong recommendation'
  | 'caution-first recommendation';
export type UncertaintyBehavior =
  | 'ask one useful question'
  | 'safe provisional answer'
  | 'state best assumption'
  | 'decisive next move';

type EvidenceQuality = 'weak' | 'adequate' | 'strong';
type AmbiguityLevel = 'low' | 'medium' | 'high';
type StakesLevel = 'low' | 'medium' | 'high';
type TrustSignal =
  | 'specific evidence'
  | 'quantified constraint'
  | 'outcome history'
  | 'missing facts'
  | 'many unknowns'
  | 'high stakes'
  | 'reversible decision'
  | 'irreversible decision'
  | 'explicit uncertainty'
  | 'clear commitment';

export interface TrustCalibration {
  confidenceLevel: TrustConfidenceLevel;
  recommendationFirmness: RecommendationFirmness;
  uncertaintyBehavior: UncertaintyBehavior;
  evidenceQuality: EvidenceQuality;
  ambiguityLevel: AmbiguityLevel;
  stakesLevel: StakesLevel;
  shouldAskQuestion: boolean;
  shouldVerify: boolean;
  signals: TrustSignal[];
  rationale: string[];
}

const HIGH_STAKES_PATTERN =
  /\b(money|cash|debt|loan|mortgage|invest|funding|runway|legal|lawsuit|contract|visa|tax|health|medical|doctor|family|marriage|divorce|child|kids|job|career|salary|quit|fire|hire|co-?founder|equity|shutdown|acquire|sell the company)\b/i;
const IRREVERSIBLE_PATTERN =
  /\b(quit|resign|fire|sell|shut down|shutdown|move country|relocat|sign the contract|take the loan|invest everything|go all in|divorce)\b/i;
const REVERSIBLE_PATTERN =
  /\b(test|pilot|experiment|try|prototype|call|survey|small bet|reversible|validate|trial|sample|first step)\b/i;
const SPECIFIC_EVIDENCE_PATTERN =
  /\b(customers?|users?|revenue|sales|paid|conversion|retention|data|metric|feedback|signed|launched|shipped|validated|interviews?)\b/i;
const QUANTIFIED_PATTERN =
  /\b(\$?\d+(?:[,.]\d+)?\s?(?:k|m|%|days?|weeks?|months?|hours?)?|runway|budget|deadline|salary|revenue|cost)\b/i;
const UNCERTAINTY_PATTERN =
  /\b(not sure|unknown|maybe|i don't know|i dont know|unclear|confused|what if|missing|no data|haven't tested|have not tested)\b/i;
const QUESTION_PATTERN =
  /\b(should i|which|what should|how do i|what if|is it worth|do i need)\b/i;

function collectText(problem: string, history: Array<{ role: string; content: string }>): string {
  return `${history.filter((turn) => turn.role === 'user').slice(-4).map((turn) => turn.content).join(' ')} ${problem}`.toLowerCase();
}

function hasRelevantOutcomeHistory(problem: string, decisionHistory: DecisionMemoryEntry[]): boolean {
  const words = new Set(problem.toLowerCase().match(/\b[\p{L}\p{N}']{4,}\b/gu) ?? []);
  return decisionHistory
    .filter((entry) => !entry.blueprint?.isDemo && entry.outcome)
    .slice(0, 20)
    .some((entry) => {
      const entryWords = entry.problem.toLowerCase().match(/\b[\p{L}\p{N}']{4,}\b/gu) ?? [];
      return entryWords.filter((word) => words.has(word)).length >= 2;
    });
}

function classifyEvidence(text: string, hasOutcomeHistory: boolean): EvidenceQuality {
  const evidencePoints = [
    SPECIFIC_EVIDENCE_PATTERN.test(text),
    QUANTIFIED_PATTERN.test(text),
    hasOutcomeHistory,
    /\b(i did|i started|i launched|i shipped|paid|signed|customer said|data shows)\b/i.test(text),
  ].filter(Boolean).length;

  if (evidencePoints >= 3) return 'strong';
  if (evidencePoints >= 1) return 'adequate';
  return 'weak';
}

function classifyAmbiguity(text: string): AmbiguityLevel {
  const unknownCount = (text.match(/\b(maybe|unknown|unclear|not sure|what if|or|option|depends|could|might)\b/g) ?? []).length;
  const questionCount = (text.match(/[?？]/g) ?? []).length;
  const hasMissingFacts = /\b(no data|haven't tested|have not tested|don't know|dont know|missing)\b/i.test(text);

  if (hasMissingFacts || unknownCount >= 4 || questionCount >= 3) return 'high';
  if (unknownCount >= 2 || questionCount >= 1 || QUESTION_PATTERN.test(text)) return 'medium';
  return 'low';
}

function classifyStakes(text: string): StakesLevel {
  if (HIGH_STAKES_PATTERN.test(text) || IRREVERSIBLE_PATTERN.test(text)) return 'high';
  if (/\b(team|client|launch|pricing|public|deadline|contract|partner)\b/i.test(text)) return 'medium';
  return 'low';
}

function collectSignals(
  text: string,
  evidenceQuality: EvidenceQuality,
  hasOutcomeHistory: boolean,
): TrustSignal[] {
  const signals = new Set<TrustSignal>();
  if (SPECIFIC_EVIDENCE_PATTERN.test(text)) signals.add('specific evidence');
  if (QUANTIFIED_PATTERN.test(text)) signals.add('quantified constraint');
  if (hasOutcomeHistory) signals.add('outcome history');
  if (UNCERTAINTY_PATTERN.test(text)) signals.add('explicit uncertainty');
  if (/\b(no data|haven't tested|have not tested|missing|don't know|dont know)\b/i.test(text)) signals.add('missing facts');
  if ((text.match(/\b(maybe|what if|or|option|could|might)\b/g) ?? []).length >= 3) signals.add('many unknowns');
  if (HIGH_STAKES_PATTERN.test(text)) signals.add('high stakes');
  if (REVERSIBLE_PATTERN.test(text)) signals.add('reversible decision');
  if (IRREVERSIBLE_PATTERN.test(text)) signals.add('irreversible decision');
  if (/\b(i will|i'll|decided|ready|committed|i need to)\b/i.test(text) && evidenceQuality !== 'weak') signals.add('clear commitment');
  return Array.from(signals);
}

function decideConfidence(
  evidenceQuality: EvidenceQuality,
  ambiguityLevel: AmbiguityLevel,
  stakesLevel: StakesLevel,
): TrustConfidenceLevel {
  if (evidenceQuality === 'weak' && (ambiguityLevel !== 'low' || stakesLevel === 'high')) return 'LOW';
  if (ambiguityLevel === 'high' && stakesLevel === 'high') return 'LOW';
  if (evidenceQuality === 'strong' && ambiguityLevel === 'low' && stakesLevel !== 'high') return 'HIGH';
  if (evidenceQuality === 'strong' && ambiguityLevel !== 'high') return 'HIGH';
  return 'MEDIUM';
}

function decideFirmness(
  confidenceLevel: TrustConfidenceLevel,
  stakesLevel: StakesLevel,
  signals: TrustSignal[],
): RecommendationFirmness {
  if (stakesLevel === 'high' && (confidenceLevel === 'LOW' || signals.includes('irreversible decision'))) {
    return 'caution-first recommendation';
  }
  if (confidenceLevel === 'LOW') return 'soft suggestion';
  if (confidenceLevel === 'HIGH' && stakesLevel !== 'high') return 'strong recommendation';
  return 'clear recommendation';
}

function decideUncertaintyBehavior(
  confidenceLevel: TrustConfidenceLevel,
  ambiguityLevel: AmbiguityLevel,
  stakesLevel: StakesLevel,
): UncertaintyBehavior {
  if (confidenceLevel === 'LOW' && ambiguityLevel === 'high') return 'ask one useful question';
  if (confidenceLevel === 'LOW') return 'safe provisional answer';
  if (confidenceLevel === 'MEDIUM' || stakesLevel === 'high') return 'state best assumption';
  return 'decisive next move';
}

export function calibrateTrust(
  problem: string,
  conversationHistory: Array<{ role: string; content: string }>,
  decisionHistory: DecisionMemoryEntry[],
): TrustCalibration {
  const text = collectText(problem, conversationHistory);
  const outcomeHistory = hasRelevantOutcomeHistory(problem, decisionHistory);
  const evidenceQuality = classifyEvidence(text, outcomeHistory);
  const ambiguityLevel = classifyAmbiguity(text);
  const stakesLevel = classifyStakes(text);
  const signals = collectSignals(text, evidenceQuality, outcomeHistory);
  const confidenceLevel = decideConfidence(evidenceQuality, ambiguityLevel, stakesLevel);
  const recommendationFirmness = decideFirmness(confidenceLevel, stakesLevel, signals);
  const uncertaintyBehavior = decideUncertaintyBehavior(confidenceLevel, ambiguityLevel, stakesLevel);
  const shouldAskQuestion = uncertaintyBehavior === 'ask one useful question';
  const shouldVerify =
    stakesLevel === 'high' ||
    signals.includes('irreversible decision') ||
    (confidenceLevel === 'LOW' && ambiguityLevel !== 'low');

  const rationale = [
    `Evidence is ${evidenceQuality}.`,
    `Ambiguity is ${ambiguityLevel}.`,
    `Stakes are ${stakesLevel}.`,
    `Firmness should be ${recommendationFirmness}.`,
  ];

  return {
    confidenceLevel,
    recommendationFirmness,
    uncertaintyBehavior,
    evidenceQuality,
    ambiguityLevel,
    stakesLevel,
    shouldAskQuestion,
    shouldVerify,
    signals,
    rationale,
  };
}

export function buildTrustCalibrationInstruction(calibration: TrustCalibration): string {
  const lines = [
    'TRUST CALIBRATION:',
    `Internal confidence: ${calibration.confidenceLevel}.`,
    `Evidence: ${calibration.evidenceQuality}. Ambiguity: ${calibration.ambiguityLevel}. Stakes: ${calibration.stakesLevel}.`,
    `Recommendation firmness: ${calibration.recommendationFirmness}.`,
    `Uncertainty behavior: ${calibration.uncertaintyBehavior}.`,
    calibration.shouldVerify ? 'Verification needed before heavy commitment. Surface downside or validation step without sounding legalistic.' : '',
    calibration.shouldAskQuestion ? 'Ask one useful question if it materially changes the answer; otherwise give a safe provisional answer.' : '',
    'Never say "confidence level", "trust calibration", or "my certainty is".',
    'Natural phrasing examples: "I would treat this as a working assumption." / "This is enough to make the next move." / "I would not bet heavily on this yet."',
    'Avoid fake certainty, over-cautious disclaimers, legalistic tone, robotic hedging, and generic safety paragraphs.',
  ];

  return lines.filter(Boolean).join('\n');
}
