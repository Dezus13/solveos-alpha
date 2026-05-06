import type { EnergyAssessment } from '../energyStateIntelligence';
import type { ArbitrationContract } from '../intelligenceArbitration';
import type { IntentAssessment } from '../intentDifferentiation';
import type { IdentityKernelContract } from '../identityKernel';
import type { MemoryDecayAssessment } from '../memoryDecay';
import type { SessionPressureLevel } from '../pressureEngine';
import type { RestraintAssessment } from '../restraintIntelligence';
import type { TrustCalibration } from '../trustCalibration';

export type OrchestrationStage =
  | 'intent routing'
  | 'memory relevance'
  | 'identity relevance'
  | 'pressure evaluation'
  | 'execution evaluation'
  | 'risk evaluation'
  | 'self-evaluation eligibility'
  | 'response compression eligibility';

export type IntelligenceId =
  | 'intent-router'
  | 'memory-relevance'
  | 'identity-kernel'
  | 'session-pressure'
  | 'overload-intelligence'
  | 'execution-readiness'
  | 'execution-failure'
  | 'risk-calibration'
  | 'self-evaluation'
  | 'response-compression'
  | 'narrative-continuity'
  | 'contradiction-check'
  | 'structured-tooling';

export type PrimaryFrame =
  | 'intent-first'
  | 'memory-aware'
  | 'identity-stable'
  | 'pressure-managed'
  | 'execution-first'
  | 'overload-reduction'
  | 'risk-first'
  | 'compressed-answer'
  | 'stable';

export type OrchestrationResponseDepth = 'short' | 'medium' | 'deep';
export type OrchestrationRiskLevel = 'low' | 'medium' | 'high';

interface DetectedIntentInput {
  requestIntent: string;
  mode: string;
  isReview: boolean;
  intentAssessment?: IntentAssessment;
}

interface IntelligenceCandidate {
  id: IntelligenceId;
  stage: OrchestrationStage;
  triggerConditions: string[];
  ownedResponsibility: string;
  forbiddenOverlap: string[];
  priorityScore: number;
  confidenceScore: number;
  active: boolean;
}

export interface IntelligenceActivation {
  id: IntelligenceId;
  stage: OrchestrationStage;
  triggerConditions: string[];
  ownedResponsibility: string;
  forbiddenOverlap: string[];
  priorityScore: number;
  confidenceScore: number;
}

export interface SuppressedIntelligence extends IntelligenceActivation {
  suppressedBy: IntelligenceId | 'orchestration-threshold';
  reason: string;
}

export interface OrchestrationInput {
  problem: string;
  conversationContext: Array<{ role: string; content: string }>;
  detectedIntent: DetectedIntentInput;
  memoryDecay: MemoryDecayAssessment;
  restraint: RestraintAssessment;
  energy: EnergyAssessment;
  trust: TrustCalibration;
  arbitration: ArbitrationContract;
  identityKernel: IdentityKernelContract;
  basePressureLevel: SessionPressureLevel;
  finalPressureLevel: SessionPressureLevel;
  hasNarrativeSignal: boolean;
  hasContradictionSignal: boolean;
  hasCompressionSignal: boolean;
  hasStructuredToolSignal: boolean;
  selfEvaluationEligible: boolean;
}

export interface OrchestrationResult {
  activeIntelligences: IntelligenceActivation[];
  suppressedIntelligences: SuppressedIntelligence[];
  primaryFrame: PrimaryFrame;
  responseDepth: OrchestrationResponseDepth;
  riskLevel: OrchestrationRiskLevel;
  synthesisPriority: string[];
  stageOrder: OrchestrationStage[];
  conflictNotes: string[];
}

const STAGE_ORDER: OrchestrationStage[] = [
  'intent routing',
  'memory relevance',
  'identity relevance',
  'pressure evaluation',
  'execution evaluation',
  'risk evaluation',
  'self-evaluation eligibility',
  'response compression eligibility',
];

const MIN_ACTIVE_PRIORITY = 35;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function candidate(input: IntelligenceCandidate): IntelligenceCandidate {
  return {
    ...input,
    priorityScore: clampScore(input.priorityScore),
    confidenceScore: clampScore(input.confidenceScore),
  };
}

function activeReasons(items: Array<[boolean, string]>): string[] {
  return items.filter(([active]) => active).map(([, reason]) => reason);
}

function conversationText(input: OrchestrationInput): string {
  return [
    ...input.conversationContext.filter((turn) => turn.role === 'user').slice(-6).map((turn) => turn.content),
    input.problem,
  ].join(' ').toLowerCase();
}

function buildCandidates(input: OrchestrationInput): IntelligenceCandidate[] {
  const text = conversationText(input);
  const intent = input.detectedIntent.intentAssessment;
  const intentIsNonStandard = Boolean(
    input.detectedIntent.isReview ||
    input.detectedIntent.requestIntent !== 'normal_decision' ||
    input.detectedIntent.mode !== 'Strategy' ||
    (intent && intent.primaryIntent !== 'standard') ||
    intent?.intentConfidence === 'LOW',
  );
  const memoryRelevant = input.arbitration.allowMemory || input.memoryDecay.callbackAllowed;
  const overloadActive =
    input.energy.state === 'OVERLOAD' ||
    input.restraint.signals.includes('emotional overload') ||
    /\b(overwhelmed|too much|exhausted|burn.?out|no energy|can't think)\b/i.test(text);
  const executionFailureActive =
    intent?.primaryIntent === 'execution_failure' ||
    /\b(can'?t finish|can'?t execute|never finish|don'?t follow through|keep abandoning|gave up)\b/i.test(text);
  const executionReady =
    input.energy.state === 'EXECUTION' ||
    input.arbitration.dominantState === 'execution readiness' ||
    /\b(i did|done|completed|i will|i'll|next action)\b/i.test(text);
  const riskActive =
    input.trust.stakesLevel === 'high' ||
    input.trust.shouldVerify ||
    input.energy.state === 'IMPULSIVE' ||
    input.arbitration.dominantState === 'high-stakes caution' ||
    input.arbitration.dominantState === 'impulsive risk';
  const pressureActive =
    input.finalPressureLevel > 0 ||
    input.basePressureLevel > 0 ||
    input.energy.state === 'HESITATION' ||
    input.arbitration.dominantState === 'hesitation';
  const compressionActive =
    input.hasCompressionSignal ||
    input.arbitration.depthLevel === 'short' ||
    input.restraint.level === 'minimal' ||
    input.arbitration.suppressionList.includes('deep analysis');

  return [
    candidate({
      id: 'intent-router',
      stage: 'intent routing',
      active: intentIsNonStandard,
      triggerConditions: activeReasons([
        [input.detectedIntent.isReview, 'review mode detected'],
        [input.detectedIntent.requestIntent !== 'normal_decision', `request intent: ${input.detectedIntent.requestIntent}`],
        [input.detectedIntent.mode !== 'Strategy', `mode: ${input.detectedIntent.mode}`],
        [Boolean(intent && intent.primaryIntent !== 'standard'), intent ? `semantic family: ${intent.primaryIntent}` : 'semantic family detected'],
        [intent?.intentConfidence === 'LOW', 'low intent confidence'],
      ]),
      ownedResponsibility: 'Choose the route, mode, and semantic frame before any memory or pressure layer speaks.',
      forbiddenOverlap: ['confidence calibration', 'memory callbacks', 'tone identity'],
      priorityScore: input.detectedIntent.requestIntent !== 'normal_decision' ? 98 : intent?.intentConfidence === 'LOW' ? 84 : 68,
      confidenceScore: intent ? (intent.intentConfidence === 'HIGH' ? 88 : intent.intentConfidence === 'MEDIUM' ? 66 : 42) : 70,
    }),
    candidate({
      id: 'memory-relevance',
      stage: 'memory relevance',
      active: memoryRelevant,
      triggerConditions: activeReasons([
        [input.arbitration.allowMemory, 'arbitration allows memory'],
        [input.memoryDecay.callbackAllowed, 'memory decay allows callback'],
        [input.memoryDecay.preservedDurablePatterns.length > 0, 'durable memory pattern exists'],
      ]),
      ownedResponsibility: 'Decide whether history should influence the answer and whether visible callbacks are allowed.',
      forbiddenOverlap: ['user identity labels', 'pressure escalation', 'fresh intent routing'],
      priorityScore: input.memoryDecay.callbackAllowed ? 62 : 44,
      confidenceScore: clampScore(input.memoryDecay.averageFreshness * 100),
    }),
    candidate({
      id: 'identity-kernel',
      stage: 'identity relevance',
      active: true,
      triggerConditions: activeReasons([
        [input.identityKernel.driftSignals.length > 0, 'tone drift detected'],
        [input.identityKernel.suppressions.length > 0, 'kernel suppressions active'],
        [input.arbitration.pressureLevel === 'HIGH', 'pressure cap required'],
      ]),
      ownedResponsibility: 'Preserve SolveOS behavioral identity: calm, useful, non-hyped, operationally honest.',
      forbiddenOverlap: ['user behavior scoring', 'verdict routing', 'memory relevance'],
      priorityScore: input.identityKernel.driftSignals.length > 0 ? 92 : 74,
      confidenceScore: input.identityKernel.driftSignals.length > 0 ? 86 : 72,
    }),
    candidate({
      id: 'session-pressure',
      stage: 'pressure evaluation',
      active: pressureActive,
      triggerConditions: activeReasons([
        [input.finalPressureLevel > 0, `final pressure level ${input.finalPressureLevel}`],
        [input.basePressureLevel > 0, `base pressure level ${input.basePressureLevel}`],
        [input.energy.state === 'HESITATION', 'energy state hesitation'],
        [input.arbitration.dominantState === 'hesitation', 'arbitration dominant hesitation'],
      ]),
      ownedResponsibility: 'Manage session hesitation pressure and avoid analysis loops.',
      forbiddenOverlap: ['persistent deadline pressure', 'overload recovery', 'risk verification'],
      priorityScore: input.finalPressureLevel >= 2 ? 82 : input.finalPressureLevel === 1 ? 66 : 48,
      confidenceScore: clampScore(Math.max(input.energy.confidence * 100, input.basePressureLevel * 35)),
    }),
    candidate({
      id: 'overload-intelligence',
      stage: 'execution evaluation',
      active: overloadActive,
      triggerConditions: activeReasons([
        [input.energy.state === 'OVERLOAD', 'energy state overload'],
        [input.restraint.signals.includes('emotional overload'), 'restraint overload signal'],
        [/\b(overwhelmed|too much|exhausted|burn.?out|no energy|can't think)\b/i.test(text), 'overload language in conversation'],
      ]),
      ownedResponsibility: 'Reduce load, suppress option expansion, and shrink the next move.',
      forbiddenOverlap: ['execution failure diagnosis', 'aggressive challenge', 'pressure escalation'],
      priorityScore: 90,
      confidenceScore: input.energy.state === 'OVERLOAD' ? 86 : 70,
    }),
    candidate({
      id: 'execution-readiness',
      stage: 'execution evaluation',
      active: executionReady,
      triggerConditions: activeReasons([
        [input.energy.state === 'EXECUTION', 'energy state execution'],
        [input.arbitration.dominantState === 'execution readiness', 'arbitration execution readiness'],
        [/\b(i did|done|completed|i will|i'll|next action)\b/i.test(text), 'execution language in conversation'],
      ]),
      ownedResponsibility: 'Move from analysis to one concrete action when the user is ready to execute.',
      forbiddenOverlap: ['option expansion', 'long exploratory analysis', 'overload diagnosis'],
      priorityScore: 64,
      confidenceScore: input.energy.state === 'EXECUTION' ? 78 : 58,
    }),
    candidate({
      id: 'execution-failure',
      stage: 'execution evaluation',
      active: executionFailureActive,
      triggerConditions: activeReasons([
        [intent?.primaryIntent === 'execution_failure', 'execution-failure intent family'],
        [/\b(can'?t finish|can'?t execute|never finish|don'?t follow through|keep abandoning|gave up)\b/i.test(text), 'execution failure language in conversation'],
      ]),
      ownedResponsibility: 'Diagnose structural execution failure: sequence, capacity, definition of done, or environment.',
      forbiddenOverlap: ['overload reduction conclusion', 'motivation diagnosis', 'identity labels'],
      priorityScore: overloadActive ? 58 : 76,
      confidenceScore: intent?.primaryIntent === 'execution_failure' ? 82 : 60,
    }),
    candidate({
      id: 'risk-calibration',
      stage: 'risk evaluation',
      active: riskActive,
      triggerConditions: activeReasons([
        [input.trust.stakesLevel === 'high', 'high stakes'],
        [input.trust.shouldVerify, 'verification required'],
        [input.energy.state === 'IMPULSIVE', 'impulsive energy state'],
        [input.arbitration.dominantState === 'high-stakes caution', 'arbitration high-stakes caution'],
        [input.arbitration.dominantState === 'impulsive risk', 'arbitration impulsive risk'],
      ]),
      ownedResponsibility: 'Size downside, reversibility, verification needs, and recommendation firmness.',
      forbiddenOverlap: ['fake certainty', 'pressure escalation', 'hype amplification'],
      priorityScore: input.trust.stakesLevel === 'high' ? 88 : 70,
      confidenceScore: input.trust.confidenceLevel === 'HIGH' ? 82 : input.trust.confidenceLevel === 'MEDIUM' ? 64 : 46,
    }),
    candidate({
      id: 'self-evaluation',
      stage: 'self-evaluation eligibility',
      active: input.selfEvaluationEligible,
      triggerConditions: activeReasons([
        [input.selfEvaluationEligible, 'self-evaluation stage available'],
      ]),
      ownedResponsibility: 'Run one private quality pass for clarity, restraint, compression, and identity compliance.',
      forbiddenOverlap: ['new reasoning loops', 'verdict changes', 'visible self-critique'],
      priorityScore: 56,
      confidenceScore: 72,
    }),
    candidate({
      id: 'response-compression',
      stage: 'response compression eligibility',
      active: compressionActive,
      triggerConditions: activeReasons([
        [input.hasCompressionSignal, 'short answer compression signal'],
        [input.arbitration.depthLevel === 'short', 'arbitration depth is short'],
        [input.restraint.level === 'minimal', 'minimal restraint mode'],
        [input.arbitration.suppressionList.includes('deep analysis'), 'deep analysis suppressed'],
      ]),
      ownedResponsibility: 'Keep output length and structure proportional to the user ask.',
      forbiddenOverlap: ['strategic architecture expansion', 'formatting flourish', 'memory callbacks'],
      priorityScore: input.restraint.level === 'minimal' ? 78 : 60,
      confidenceScore: input.hasCompressionSignal ? 78 : 62,
    }),
    candidate({
      id: 'narrative-continuity',
      stage: 'memory relevance',
      active: input.hasNarrativeSignal && input.arbitration.allowNarrativeReference,
      triggerConditions: activeReasons([
        [input.hasNarrativeSignal, 'narrative signal exists'],
        [input.arbitration.allowNarrativeReference, 'arbitration allows narrative reference'],
      ]),
      ownedResponsibility: 'Use at most one continuity reference when it materially improves sequencing.',
      forbiddenOverlap: ['identity diagnosis', 'surveillance-like callbacks', 'memory dumping'],
      priorityScore: 50,
      confidenceScore: 58,
    }),
    candidate({
      id: 'contradiction-check',
      stage: 'risk evaluation',
      active: input.hasContradictionSignal && input.arbitration.allowContradiction,
      triggerConditions: activeReasons([
        [input.hasContradictionSignal, 'contradiction signal exists'],
        [input.arbitration.allowContradiction, 'arbitration allows contradiction'],
      ]),
      ownedResponsibility: 'Surface one consequential strategic contradiction or blind spot, if useful.',
      forbiddenOverlap: ['aggressive challenge', 'personality diagnosis', 'multi-critique stacking'],
      priorityScore: 54,
      confidenceScore: 60,
    }),
    candidate({
      id: 'structured-tooling',
      stage: 'response compression eligibility',
      active: input.hasStructuredToolSignal && input.arbitration.allowStructuredTool,
      triggerConditions: activeReasons([
        [input.hasStructuredToolSignal, 'structured tool signal exists'],
        [input.arbitration.allowStructuredTool, 'arbitration allows structured output'],
      ]),
      ownedResponsibility: 'Choose a useful output shape only when structure improves clarity.',
      forbiddenOverlap: ['formatting for display', 'over-sectioning', 'compression mode'],
      priorityScore: 48,
      confidenceScore: 56,
    }),
  ];
}

function activationFrom(candidate: IntelligenceCandidate): IntelligenceActivation {
  return {
    id: candidate.id,
    stage: candidate.stage,
    triggerConditions: candidate.triggerConditions,
    ownedResponsibility: candidate.ownedResponsibility,
    forbiddenOverlap: candidate.forbiddenOverlap,
    priorityScore: candidate.priorityScore,
    confidenceScore: candidate.confidenceScore,
  };
}

function suppress(
  item: IntelligenceCandidate,
  suppressedBy: SuppressedIntelligence['suppressedBy'],
  reason: string,
): SuppressedIntelligence {
  return {
    ...activationFrom(item),
    suppressedBy,
    reason,
  };
}

function applyConflictPrevention(candidates: IntelligenceCandidate[]): {
  active: IntelligenceActivation[];
  suppressed: SuppressedIntelligence[];
  conflictNotes: string[];
} {
  const activeCandidates = candidates
    .filter((item) => item.active && item.priorityScore >= MIN_ACTIVE_PRIORITY)
    .sort((a, b) => b.priorityScore - a.priorityScore || b.confidenceScore - a.confidenceScore);
  const suppressed: SuppressedIntelligence[] = candidates
    .filter((item) => !item.active || item.priorityScore < MIN_ACTIVE_PRIORITY)
    .map((item) => suppress(item, 'orchestration-threshold', item.active ? 'Priority below activation threshold.' : 'Trigger conditions not met.'));
  const conflictNotes: string[] = [];
  const suppressedIds = new Set<IntelligenceId>(suppressed.map((item) => item.id));

  const activeById = new Map(activeCandidates.map((item) => [item.id, item]));
  const suppressIfPresent = (id: IntelligenceId, by: IntelligenceId, reason: string) => {
    const item = activeById.get(id);
    if (!item || suppressedIds.has(id)) return;
    suppressedIds.add(id);
    suppressed.push(suppress(item, by, reason));
    conflictNotes.push(reason);
  };

  if (activeById.has('overload-intelligence') && activeById.has('execution-failure')) {
    suppressIfPresent(
      'execution-failure',
      'overload-intelligence',
      'Overload owns the visible conclusion; execution failure may inform reasoning silently to avoid duplicate "cannot execute" diagnostics.',
    );
  }

  if (activeById.has('response-compression') && activeById.has('structured-tooling')) {
    const compression = activeById.get('response-compression')!;
    const tooling = activeById.get('structured-tooling')!;
    if (compression.priorityScore >= tooling.priorityScore) {
      suppressIfPresent(
        'structured-tooling',
        'response-compression',
        'Compression outranks structured tooling; avoid adding sections or tables when the answer should be short.',
      );
    }
  }

  if (activeById.has('risk-calibration') && activeById.has('session-pressure')) {
    const risk = activeById.get('risk-calibration')!;
    const pressure = activeById.get('session-pressure')!;
    if (risk.priorityScore > pressure.priorityScore) {
      suppressIfPresent(
        'session-pressure',
        'risk-calibration',
        'Risk verification outranks pressure; do not push urgency when downside sizing is the primary frame.',
      );
    }
  }

  const active = activeCandidates
    .filter((item) => !suppressedIds.has(item.id))
    .map(activationFrom);

  return { active, suppressed, conflictNotes };
}

function riskLevel(input: OrchestrationInput): OrchestrationRiskLevel {
  if (
    input.trust.stakesLevel === 'high' ||
    input.energy.state === 'IMPULSIVE' ||
    input.arbitration.dominantState === 'impulsive risk' ||
    input.arbitration.dominantState === 'high-stakes caution'
  ) {
    return 'high';
  }
  if (input.trust.stakesLevel === 'medium' || input.trust.shouldVerify || input.trust.confidenceLevel === 'LOW') {
    return 'medium';
  }
  return 'low';
}

function responseDepth(input: OrchestrationInput, active: IntelligenceActivation[]): OrchestrationResponseDepth {
  if (
    active.some((item) => item.id === 'response-compression' || item.id === 'overload-intelligence') ||
    input.arbitration.depthLevel === 'short'
  ) {
    return 'short';
  }
  if (input.arbitration.depthLevel === 'deep') return 'deep';
  return 'medium';
}

function primaryFrame(active: IntelligenceActivation[], input: OrchestrationInput): PrimaryFrame {
  if (active.some((item) => item.id === 'overload-intelligence')) return 'overload-reduction';
  if (active.some((item) => item.id === 'risk-calibration')) return 'risk-first';
  if (active.some((item) => item.id === 'execution-readiness' || item.id === 'execution-failure')) return 'execution-first';
  if (active.some((item) => item.id === 'session-pressure')) return 'pressure-managed';
  if (active.some((item) => item.id === 'response-compression')) return 'compressed-answer';
  if (active.some((item) => item.id === 'memory-relevance' || item.id === 'narrative-continuity')) return 'memory-aware';
  if (active.some((item) => item.id === 'intent-router')) return 'intent-first';
  if (input.identityKernel.suppressions.length > 0) return 'identity-stable';
  return 'stable';
}

function synthesisPriority(frame: PrimaryFrame, active: IntelligenceActivation[], input: OrchestrationInput): string[] {
  const priorities: string[] = [];
  const add = (item: string) => {
    if (!priorities.includes(item)) priorities.push(item);
  };

  if (frame === 'overload-reduction') {
    add('reduce cognitive load before adding analysis');
    add('name one stabilizing next move');
  } else if (frame === 'risk-first') {
    add('size downside and reversibility before recommending action');
    add('state the verification signal that changes the recommendation');
  } else if (frame === 'execution-first') {
    add('move from diagnosis to one executable action');
    add('avoid restarting broad strategy');
  } else if (frame === 'pressure-managed') {
    add('end the hesitation loop without creating artificial urgency');
    add('give one path, one action, one deadline');
  } else if (frame === 'compressed-answer') {
    add('answer directly with minimal structure');
    add('cut repeated diagnostics and formatting flourish');
  } else if (frame === 'memory-aware') {
    add('use history only when it materially changes the answer');
    add('avoid surveillance-like callbacks');
  } else if (frame === 'intent-first') {
    add('honor the detected route and semantic intent first');
    add('avoid answering a different decision than the one asked');
  } else {
    add('give the strongest useful answer with stable SolveOS identity');
  }

  if (active.some((item) => item.id === 'identity-kernel')) {
    add('preserve calm, non-hyped, operationally honest tone');
  }
  if (input.trust.confidenceLevel === 'LOW') {
    add('state a working assumption or ask one useful question instead of faking certainty');
  }
  if (input.arbitration.suppressionList.length > 0) {
    add(`respect suppressions: ${input.arbitration.suppressionList.slice(0, 4).join(', ')}`);
  }

  return priorities.slice(0, 6);
}

export function orchestrateSolveIntelligence(input: OrchestrationInput): OrchestrationResult {
  const candidates = buildCandidates(input);
  const { active, suppressed, conflictNotes } = applyConflictPrevention(candidates);
  const frame = primaryFrame(active, input);
  const depth = responseDepth(input, active);
  const risk = riskLevel(input);

  return {
    activeIntelligences: active,
    suppressedIntelligences: suppressed,
    primaryFrame: frame,
    responseDepth: depth,
    riskLevel: risk,
    synthesisPriority: synthesisPriority(frame, active, input),
    stageOrder: STAGE_ORDER,
    conflictNotes,
  };
}

export function buildOrchestrationInstruction(result: OrchestrationResult): string {
  const active = result.activeIntelligences
    .slice(0, 6)
    .map((item) => `${item.id}(${item.priorityScore}/${item.confidenceScore})`)
    .join(', ');
  const suppressed = result.suppressedIntelligences
    .filter((item) => item.suppressedBy !== 'orchestration-threshold')
    .slice(0, 4)
    .map((item) => `${item.id} by ${item.suppressedBy}`)
    .join(', ');

  return [
    'CENTRAL ORCHESTRATION:',
    'This is the authoritative coordination layer for this response. Use it to prevent duplicated diagnostics and conflicting framing.',
    `Pipeline order: ${result.stageOrder.join(' -> ')}.`,
    `Primary frame: ${result.primaryFrame}. Response depth: ${result.responseDepth}. Risk level: ${result.riskLevel}.`,
    active ? `Active intelligences: ${active}.` : 'Active intelligences: stable baseline only.',
    suppressed ? `Conflict suppressions: ${suppressed}.` : '',
    result.conflictNotes.length ? `Conflict prevention notes: ${result.conflictNotes.join(' ')}` : '',
    result.synthesisPriority.length ? `Synthesis priority: ${result.synthesisPriority.join(' | ')}.` : '',
    'Do not reveal orchestration labels, scores, suppressions, or stage names to the user.',
    'If two modules imply the same visible conclusion, say it once through the primary frame and let the lower-priority signal remain silent.',
  ].filter(Boolean).join('\n');
}
