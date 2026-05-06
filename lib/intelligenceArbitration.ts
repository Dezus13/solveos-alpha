import type { EnergyAssessment } from './energyStateIntelligence';
import type { RestraintAssessment } from './restraintIntelligence';
import type { SessionPressureLevel } from './pressureEngine';
import type { RecommendationFirmness, TrustCalibration } from './trustCalibration';
import type { MemoryDecayAssessment } from './memoryDecay';

type PriorityCategory = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type PressureGovernor = 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH';
type DepthGovernor = 'short' | 'medium' | 'deep';
type ReasoningIntensity = 'minimal' | 'focused' | 'expanded';
type ExplorationAllowance = 'none' | 'limited' | 'open';
type PacingDirective = 'slow' | 'steady' | 'fast';
type ChallengeIntensity = 'none' | 'light' | 'direct';
type ArbitrationSignalName =
  | 'overload'
  | 'impulsive risk'
  | 'severe contradiction'
  | 'execution collapse'
  | 'hesitation'
  | 'repeated unresolved loop'
  | 'strategic conflict'
  | 'exploration'
  | 'narrative continuity'
  | 'response compression'
  | 'stylistic optimization'
  | 'formatting adaptation'
  | 'execution readiness'
  | 'recovery'
  | 'low confidence'
  | 'high-stakes caution';

type Suppression =
  | 'deep analysis'
  | 'option expansion'
  | 'aggressive challenge'
  | 'hype amplification'
  | 'high-certainty recommendation'
  | 'rapid escalation'
  | 'excessive caution'
  | 'long exploratory branches'
  | 'pressure escalation'
  | 'optimization stacking'
  | 'memory reference'
  | 'narrative continuity'
  | 'contradiction challenge'
  | 'formatting flourish';

interface ArbitrationSignal {
  name: ArbitrationSignalName;
  priority: PriorityCategory;
  weight: number;
  evidence: string;
}

interface ArbitrationInput {
  problem: string;
  conversationHistory: Array<{ role: string; content: string }>;
  restraint: RestraintAssessment;
  energy: EnergyAssessment;
  basePressureLevel: SessionPressureLevel;
  trust: TrustCalibration;
  memoryDecay: MemoryDecayAssessment;
  hasContradictionSignal: boolean;
  hasNarrativeSignal: boolean;
  hasCompressionSignal: boolean;
}

export interface ArbitrationContract {
  dominantState: ArbitrationSignalName | 'stable';
  pressureLevel: PressureGovernor;
  sessionPressureLevel: SessionPressureLevel;
  depthLevel: DepthGovernor;
  suppressionList: Suppression[];
  pacingDirective: PacingDirective;
  reasoningIntensity: ReasoningIntensity;
  explorationAllowance: ExplorationAllowance;
  challengeIntensity: ChallengeIntensity;
  recommendationFirmness: RecommendationFirmness;
  shouldAskQuestion: boolean;
  allowMemory: boolean;
  allowPatternInsight: boolean;
  allowContradiction: boolean;
  allowNarrativeReference: boolean;
  allowStrategicArchitecture: boolean;
  allowStructuredTool: boolean;
  allowFirstResponseInsight: boolean;
  activeSignals: ArbitrationSignal[];
  internalRationale: string[];
}

const PRIORITY_RANK: Record<PriorityCategory, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function userText(history: Array<{ role: string; content: string }>, problem: string): string {
  return `${history.filter((turn) => turn.role === 'user').slice(-6).map((turn) => turn.content).join(' ')} ${problem}`.toLowerCase();
}

function addSignal(signals: ArbitrationSignal[], signal: ArbitrationSignal): void {
  const existing = signals.find((item) => item.name === signal.name);
  if (!existing) {
    signals.push(signal);
    return;
  }
  if (signal.weight > existing.weight) {
    existing.weight = signal.weight;
    existing.priority = signal.priority;
    existing.evidence = signal.evidence;
  }
}

function collectSignals(input: ArbitrationInput): ArbitrationSignal[] {
  const signals: ArbitrationSignal[] = [];
  const text = userText(input.conversationHistory, input.problem);

  if (input.energy.state === 'OVERLOAD' || input.restraint.signals.includes('emotional overload')) {
    addSignal(signals, {
      name: 'overload',
      priority: 'CRITICAL',
      weight: input.energy.state === 'OVERLOAD' ? 95 : 88,
      evidence: 'Operational overload or low cognitive bandwidth is active.',
    });
  }

  if (input.memoryDecay.expiredPressureSuppressed && input.basePressureLevel > 0) {
    addSignal(signals, {
      name: 'response compression',
      priority: 'MEDIUM',
      weight: 66,
      evidence: 'Old pressure or temporary state signals have expired.',
    });
  }

  if (input.trust.confidenceLevel === 'LOW') {
    addSignal(signals, {
      name: 'low confidence',
      priority: input.trust.stakesLevel === 'high' ? 'CRITICAL' : 'HIGH',
      weight: input.trust.stakesLevel === 'high' ? 90 : 72,
      evidence: 'Evidence or ambiguity does not support strong claims.',
    });
  }

  if (input.trust.stakesLevel === 'high' && input.trust.shouldVerify) {
    addSignal(signals, {
      name: 'high-stakes caution',
      priority: 'CRITICAL',
      weight: 88,
      evidence: 'High stakes require downside awareness and verification before heavy commitment.',
    });
  }

  if (input.energy.state === 'IMPULSIVE' || /\b(go all in|quit today|move tomorrow|all or nothing|right now)\b/i.test(input.problem)) {
    addSignal(signals, {
      name: 'impulsive risk',
      priority: 'CRITICAL',
      weight: input.energy.state === 'IMPULSIVE' ? 92 : 84,
      evidence: 'Urgency or all-or-nothing commitment raises downside risk.',
    });
  }

  if (input.energy.state === 'RECOVERY') {
    addSignal(signals, {
      name: 'recovery',
      priority: 'CRITICAL',
      weight: 86,
      evidence: 'Recovery/re-entry signals require reduced pressure.',
    });
  }

  if (/\b(can'?t keep going|everything failed|nothing works|missed again|abandoned|gave up)\b/i.test(text)) {
    addSignal(signals, {
      name: 'execution collapse',
      priority: 'CRITICAL',
      weight: 82,
      evidence: 'Execution appears to be breaking down or repeatedly abandoned.',
    });
  }

  if (input.energy.state === 'HESITATION' || input.basePressureLevel >= 1) {
    addSignal(signals, {
      name: 'hesitation',
      priority: 'HIGH',
      weight: input.basePressureLevel >= 2 ? 76 : 68,
      evidence: 'User is circling the decision or asking without committing.',
    });
  }

  if (/\b(same question|again|still stuck|still not sure|keep asking|circling)\b/i.test(text)) {
    addSignal(signals, {
      name: 'repeated unresolved loop',
      priority: 'HIGH',
      weight: 74,
      evidence: 'Recent thread suggests repetition without resolution.',
    });
  }

  if (input.hasContradictionSignal) {
    addSignal(signals, {
      name: 'strategic conflict',
      priority: 'HIGH',
      weight: 70,
      evidence: 'Contradiction intelligence found a consequential tradeoff.',
    });
  }

  if (input.energy.state === 'EXPLORATION') {
    addSignal(signals, {
      name: 'exploration',
      priority: 'MEDIUM',
      weight: 56,
      evidence: 'User is exploring options or asking for broader thinking.',
    });
  }

  if (input.hasNarrativeSignal) {
    addSignal(signals, {
      name: 'narrative continuity',
      priority: 'MEDIUM',
      weight: 52,
      evidence: 'Long-range continuity may improve the answer if not suppressed.',
    });
  }

  if (input.hasCompressionSignal || input.restraint.level === 'minimal') {
    addSignal(signals, {
      name: 'response compression',
      priority: 'MEDIUM',
      weight: input.restraint.level === 'minimal' ? 64 : 48,
      evidence: 'The turn is short, direct, confirmatory, or low-signal.',
    });
  }

  if (input.energy.state === 'EXECUTION') {
    addSignal(signals, {
      name: 'execution readiness',
      priority: 'MEDIUM',
      weight: 58,
      evidence: 'Commitment or action-reporting language suggests readiness to execute.',
    });
  }

  addSignal(signals, {
    name: 'stylistic optimization',
    priority: 'LOW',
    weight: 18,
    evidence: 'Style variation can help, but never outranks operational signals.',
  });
  addSignal(signals, {
    name: 'formatting adaptation',
    priority: 'LOW',
    weight: 16,
    evidence: 'Formatting is subordinate to pressure, depth, and safety.',
  });

  return signals.sort((a, b) => (
    PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
    b.weight - a.weight
  ));
}

function smoothDominantState(
  dominant: ArbitrationSignalName | 'stable',
  input: ArbitrationInput,
): ArbitrationSignalName | 'stable' {
  const recentUserTurns = input.conversationHistory.filter((turn) => turn.role === 'user').slice(-3);
  if (recentUserTurns.length < 2) return dominant;

  const recentText = recentUserTurns.map((turn) => turn.content).join(' ').toLowerCase();
  const stableExecution =
    /\b(i did|i started|done|completed|i will|i'll|next action)\b/i.test(recentText) &&
    dominant !== 'overload' &&
    dominant !== 'impulsive risk';
  const stableOverload =
    /\b(overwhelmed|too much|exhausted|burn.?out|no energy)\b/i.test(recentText);
  const stableExploration =
    /\b(exploring|ideas|options|brainstorm|compare)\b/i.test(recentText) &&
    dominant !== 'overload' &&
    dominant !== 'impulsive risk' &&
    dominant !== 'recovery';

  if (stableOverload) return 'overload';
  if (stableExecution && dominant === 'response compression') return 'execution readiness';
  if (stableExploration && dominant === 'response compression') return 'exploration';
  return dominant;
}

function pressureFromDominant(
  dominant: ArbitrationSignalName | 'stable',
  basePressureLevel: SessionPressureLevel,
): PressureGovernor {
  if (dominant === 'overload' || dominant === 'recovery' || dominant === 'impulsive risk' || dominant === 'execution collapse') {
    return 'MINIMAL';
  }
  if (dominant === 'low confidence' || dominant === 'high-stakes caution') return 'LOW';
  if (dominant === 'hesitation' || dominant === 'repeated unresolved loop' || basePressureLevel >= 2) {
    return 'HIGH';
  }
  if (dominant === 'strategic conflict') return 'MODERATE';
  if (dominant === 'execution readiness' || dominant === 'response compression') return 'LOW';
  return basePressureLevel >= 1 ? 'MODERATE' : 'LOW';
}

function sessionPressureFromGovernor(
  pressure: PressureGovernor,
  basePressureLevel: SessionPressureLevel,
): SessionPressureLevel {
  if (pressure === 'MINIMAL' || pressure === 'LOW') return 0;
  if (pressure === 'MODERATE') return Math.min(basePressureLevel, 1) as SessionPressureLevel;
  return basePressureLevel;
}

function uniqueSuppressions(items: Suppression[]): Suppression[] {
  return Array.from(new Set(items));
}

export function arbitrateIntelligence(input: ArbitrationInput): ArbitrationContract {
  const activeSignals = collectSignals(input);
  const rawDominant = activeSignals[0]?.name ?? 'stable';
  const dominantState = smoothDominantState(rawDominant, input);
  const suppressionList: Suppression[] = [];
  const rationale: string[] = [];

  if (dominantState === 'overload') {
    suppressionList.push('deep analysis', 'option expansion', 'aggressive challenge', 'optimization stacking');
    rationale.push('Overload wins because reducing load protects execution better than adding insight.');
  }
  if (dominantState === 'impulsive risk') {
    suppressionList.push('hype amplification', 'high-certainty recommendation', 'rapid escalation', 'option expansion');
    rationale.push('Impulsive risk wins because verification must precede escalation.');
  }
  if (dominantState === 'execution readiness') {
    suppressionList.push('excessive caution', 'long exploratory branches', 'option expansion');
    rationale.push('Execution readiness wins because the next action matters more than more exploration.');
  }
  if (dominantState === 'recovery' || dominantState === 'execution collapse') {
    suppressionList.push('pressure escalation', 'optimization stacking', 'deep analysis', 'aggressive challenge');
    rationale.push('Recovery/execution collapse wins because re-entry simplicity beats pressure.');
  }
  if (dominantState === 'low confidence') {
    suppressionList.push('high-certainty recommendation', 'aggressive challenge', 'rapid escalation');
    rationale.push('Low confidence wins because the evidence does not justify strong claims.');
  }
  if (dominantState === 'high-stakes caution') {
    suppressionList.push('high-certainty recommendation', 'rapid escalation', 'hype amplification');
    rationale.push('High-stakes caution wins because downside and verification matter more than force.');
  }
  if (input.restraint.level === 'minimal') {
    suppressionList.push('memory reference', 'narrative continuity', 'contradiction challenge', 'formatting flourish');
    rationale.push('Restraint minimal mode suppresses nonessential intelligence.');
  }
  if (!input.memoryDecay.callbackAllowed) {
    suppressionList.push('memory reference', 'narrative continuity');
    rationale.push('Memory decay suppresses callbacks because relevant history is stale or weak.');
  }

  const finalSuppressions = uniqueSuppressions(suppressionList);
  const pressureLevel = pressureFromDominant(dominantState, input.basePressureLevel);
  const trustAdjustedPressure: PressureGovernor =
    input.memoryDecay.expiredPressureSuppressed && pressureLevel === 'HIGH'
      ? 'MODERATE'
      : input.trust.confidenceLevel === 'LOW' && pressureLevel === 'HIGH'
      ? 'MODERATE'
      : input.trust.stakesLevel === 'high' && pressureLevel === 'HIGH'
        ? 'MODERATE'
        : pressureLevel;
  const sessionPressureLevel = sessionPressureFromGovernor(trustAdjustedPressure, input.basePressureLevel);
  const depthLevel: DepthGovernor =
    finalSuppressions.includes('deep analysis') || input.restraint.level === 'minimal'
      ? 'short'
      : input.trust.confidenceLevel === 'LOW' && input.trust.ambiguityLevel === 'high'
        ? 'medium'
        : dominantState === 'exploration' || input.restraint.allowDeepAnalysis
        ? 'deep'
        : 'medium';
  const pacingDirective: PacingDirective =
    dominantState === 'overload' || dominantState === 'impulsive risk' || dominantState === 'recovery' || dominantState === 'execution collapse'
      ? 'slow'
      : dominantState === 'execution readiness'
        ? 'fast'
        : 'steady';
  const reasoningIntensity: ReasoningIntensity =
    depthLevel === 'short' ? 'minimal' : depthLevel === 'deep' ? 'expanded' : 'focused';
  const explorationAllowance: ExplorationAllowance =
    finalSuppressions.includes('option expansion')
      ? 'none'
      : dominantState === 'exploration'
        ? 'open'
        : 'limited';
  const challengeIntensity: ChallengeIntensity =
    finalSuppressions.includes('aggressive challenge') || input.trust.confidenceLevel === 'LOW'
      ? 'light'
      : dominantState === 'strategic conflict' || dominantState === 'hesitation'
        ? 'direct'
        : 'none';

  const allowMemory = input.restraint.allowMemory && input.memoryDecay.callbackAllowed && !finalSuppressions.includes('memory reference');
  const allowNarrativeReference =
    input.restraint.allowNarrativeReference &&
    !finalSuppressions.includes('narrative continuity') &&
    dominantState !== 'overload' &&
    dominantState !== 'impulsive risk';
  const allowContradiction =
    input.restraint.allowContradiction &&
    !finalSuppressions.includes('contradiction challenge') &&
    !finalSuppressions.includes('aggressive challenge');
  const allowDeep = depthLevel === 'deep' && !finalSuppressions.includes('deep analysis');

  return {
    dominantState,
    pressureLevel: trustAdjustedPressure,
    sessionPressureLevel,
    depthLevel,
    suppressionList: finalSuppressions,
    pacingDirective,
    reasoningIntensity,
    explorationAllowance,
    challengeIntensity,
    recommendationFirmness: input.trust.recommendationFirmness,
    shouldAskQuestion: input.trust.shouldAskQuestion && input.restraint.level !== 'minimal',
    allowMemory,
    allowPatternInsight: input.restraint.allowPatternInsight && depthLevel !== 'short',
    allowContradiction,
    allowNarrativeReference,
    allowStrategicArchitecture: allowDeep,
    allowStructuredTool: allowDeep || (depthLevel === 'medium' && explorationAllowance !== 'none'),
    allowFirstResponseInsight: input.restraint.allowPatternInsight && depthLevel !== 'short',
    activeSignals,
    internalRationale: [
      ...(rationale.length ? rationale : ['No major conflict; stable orchestration applies.']),
      `Trust calibration: ${input.trust.rationale.join(' ')}`,
      `Memory decay: ${input.memoryDecay.rationale.join(' ')}`,
    ],
  };
}

export function buildArbitrationInstruction(contract: ArbitrationContract): string {
  return [
    'INTELLIGENCE ARBITRATION:',
    'This is the final coordination layer above all other intelligence systems. Follow it when directives conflict.',
    `Dominant state: ${contract.dominantState}.`,
    `Pressure governor: ${contract.pressureLevel}.`,
    `Depth governor: ${contract.depthLevel}.`,
    `Pacing: ${contract.pacingDirective}. Reasoning intensity: ${contract.reasoningIntensity}. Exploration allowance: ${contract.explorationAllowance}.`,
    `Challenge intensity: ${contract.challengeIntensity}. Recommendation firmness: ${contract.recommendationFirmness}.`,
    contract.shouldAskQuestion ? 'Question behavior: ask one useful question if it is required before a confident recommendation; otherwise state a working assumption.' : 'Question behavior: prefer a strategic assumption over extra questioning.',
    contract.suppressionList.length ? `Suppressed signals/modules: ${contract.suppressionList.join(', ')}.` : 'No suppressions active.',
    contract.internalRationale.length ? `Internal rationale: ${contract.internalRationale.join(' ')}` : '',
    'The user must never see these labels. Translate the contract into natural response behavior only.',
    'Safety: no manipulative escalation, fake certainty, pseudo-psychology, emotional steering, or dependency framing.',
  ].filter(Boolean).join('\n');
}
