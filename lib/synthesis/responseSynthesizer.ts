import type {
  IntelligenceActivation,
  OrchestrationResult,
  PrimaryFrame,
} from '../orchestration/orchestrationEngine';
import type { PipelineInspector } from '../debug/pipelineInspector';
import { generateExplainabilityReport, type ExplainabilityReport } from '../core/explainabilityEngine';

export type ResponseMode =
  | 'fast-direct'
  | 'strategic'
  | 'reflective'
  | 'containment'
  | 'execution'
  | 'analytical'
  | 'motivational-light';

export type FinalTone =
  | 'calm-direct'
  | 'strategic-neutral'
  | 'quiet-reflective'
  | 'stabilizing'
  | 'operator-sharp'
  | 'analytical-clear'
  | 'light-encouraging';

export type ResponseLength = 'very short' | 'short' | 'medium' | 'deep';
export type AdvisoryIntensity = 'low' | 'moderate' | 'high';
export type EmotionalPressure = 'reduced' | 'steady' | 'firm';
export type CompressionLevel = 'high' | 'medium' | 'low';
export type ContradictionPolicy = 'suppress' | 'single-soft-challenge' | 'allow-if-central';

export interface ResponseSynthesisResult {
  selectedMode: ResponseMode;
  finalTone: FinalTone;
  responseLength: ResponseLength;
  dominantFrame: PrimaryFrame;
  supportingFrames: PrimaryFrame[];
  suppressedFrames: PrimaryFrame[];
  actionableFocus: string;
  advisoryIntensity: AdvisoryIntensity;
  emotionalPressure: EmotionalPressure;
  compressionLevel: CompressionLevel;
  actionabilityScore: number;
  contradictionFiltering: ContradictionPolicy;
  safeguards: string[];
  rationale: string[];
  explainabilityReport?: ExplainabilityReport;
}

const FRAME_TO_MODE: Record<PrimaryFrame, ResponseMode> = {
  'intent-first': 'strategic',
  'memory-aware': 'reflective',
  'identity-stable': 'strategic',
  'pressure-managed': 'fast-direct',
  'execution-first': 'execution',
  'overload-reduction': 'containment',
  'risk-first': 'analytical',
  'compressed-answer': 'fast-direct',
  stable: 'strategic',
};

const MODE_TO_TONE: Record<ResponseMode, FinalTone> = {
  'fast-direct': 'calm-direct',
  strategic: 'strategic-neutral',
  reflective: 'quiet-reflective',
  containment: 'stabilizing',
  execution: 'operator-sharp',
  analytical: 'analytical-clear',
  'motivational-light': 'light-encouraging',
};

const INTELLIGENCE_FRAME: Partial<Record<IntelligenceActivation['id'], PrimaryFrame>> = {
  'intent-router': 'intent-first',
  'memory-relevance': 'memory-aware',
  'identity-kernel': 'identity-stable',
  'session-pressure': 'pressure-managed',
  'overload-intelligence': 'overload-reduction',
  'execution-readiness': 'execution-first',
  'execution-failure': 'execution-first',
  'risk-calibration': 'risk-first',
  'response-compression': 'compressed-answer',
  'narrative-continuity': 'memory-aware',
  'contradiction-check': 'risk-first',
  'structured-tooling': 'stable',
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function uniqueFrames(frames: PrimaryFrame[]): PrimaryFrame[] {
  return Array.from(new Set(frames));
}

function hasActive(result: OrchestrationResult, id: IntelligenceActivation['id']): boolean {
  return result.activeIntelligences.some((item) => item.id === id);
}

function supportingFrames(result: OrchestrationResult): PrimaryFrame[] {
  return uniqueFrames(
    result.activeIntelligences
      .map((item) => INTELLIGENCE_FRAME[item.id])
      .filter((frame): frame is PrimaryFrame => Boolean(frame))
      .filter((frame) => frame !== result.primaryFrame),
  ).slice(0, 3);
}

function suppressedFrames(result: OrchestrationResult): PrimaryFrame[] {
  return uniqueFrames(
    result.suppressedIntelligences
      .map((item) => INTELLIGENCE_FRAME[item.id])
      .filter((frame): frame is PrimaryFrame => Boolean(frame))
      .filter((frame) => frame !== result.primaryFrame),
  ).slice(0, 4);
}

function selectMode(result: OrchestrationResult): ResponseMode {
  if (result.primaryFrame === 'overload-reduction') return 'containment';
  if (result.primaryFrame === 'execution-first') return 'execution';
  if (result.primaryFrame === 'risk-first') return 'analytical';
  if (result.primaryFrame === 'pressure-managed' || result.primaryFrame === 'compressed-answer') return 'fast-direct';
  if (result.primaryFrame === 'memory-aware') return 'reflective';
  if (
    result.riskLevel === 'low' &&
    hasActive(result, 'execution-readiness') &&
    !hasActive(result, 'risk-calibration')
  ) {
    return 'motivational-light';
  }
  return FRAME_TO_MODE[result.primaryFrame];
}

function selectLength(result: OrchestrationResult, mode: ResponseMode): ResponseLength {
  if (result.responseDepth === 'short') return hasActive(result, 'response-compression') ? 'very short' : 'short';
  if (mode === 'containment' || mode === 'fast-direct') return 'short';
  if (mode === 'analytical' && result.riskLevel === 'high') return result.responseDepth === 'deep' ? 'deep' : 'medium';
  if (result.responseDepth === 'deep') return 'deep';
  return 'medium';
}

function advisoryIntensity(result: OrchestrationResult, mode: ResponseMode): AdvisoryIntensity {
  if (mode === 'containment' || result.riskLevel === 'high') return 'low';
  if (mode === 'execution' || mode === 'fast-direct') return 'high';
  return 'moderate';
}

function emotionalPressure(result: OrchestrationResult, mode: ResponseMode): EmotionalPressure {
  if (mode === 'containment' || result.riskLevel === 'high') return 'reduced';
  if (mode === 'fast-direct' || hasActive(result, 'session-pressure')) return 'firm';
  return 'steady';
}

function compressionLevel(result: OrchestrationResult, length: ResponseLength): CompressionLevel {
  if (length === 'very short' || length === 'short' || hasActive(result, 'response-compression')) return 'high';
  if (result.responseDepth === 'medium') return 'medium';
  return 'low';
}

function contradictionFiltering(result: OrchestrationResult, mode: ResponseMode): ContradictionPolicy {
  if (!hasActive(result, 'contradiction-check')) return 'suppress';
  if (mode === 'analytical' || result.riskLevel === 'high') return 'allow-if-central';
  return 'single-soft-challenge';
}

function actionabilityScore(result: OrchestrationResult, mode: ResponseMode, length: ResponseLength): number {
  let score = 58;
  if (mode === 'execution') score += 24;
  if (mode === 'fast-direct') score += 18;
  if (mode === 'containment') score += 10;
  if (hasActive(result, 'session-pressure')) score += 8;
  if (hasActive(result, 'structured-tooling')) score += 6;
  if (length === 'deep') score -= 8;
  if (hasActive(result, 'memory-relevance') || hasActive(result, 'narrative-continuity')) score -= 4;
  return clampScore(score);
}

function actionableFocus(result: OrchestrationResult, mode: ResponseMode): string {
  if (mode === 'containment') return 'one stabilizing move that reduces load before adding options';
  if (mode === 'execution') return 'one executable next action with owner, timebox, and stop condition';
  if (mode === 'fast-direct') return 'direct answer first, then one reason and one next move';
  if (mode === 'analytical') return 'risk, reversibility, verification signal, and the action threshold';
  if (mode === 'reflective') return 'one relevant continuity signal, then the current decision move';
  if (mode === 'motivational-light') return 'small forward motion without hype or identity language';
  return 'strongest strategic frame, practical tradeoff, and decisive next step';
}

function safeguards(result: OrchestrationResult, mode: ResponseMode, compression: CompressionLevel): string[] {
  const items = [
    'prevent repeated wording',
    'prevent recursive framing',
    'suppress duplicate reasoning',
  ];

  if (compression !== 'low') items.push('prevent over-analysis');
  if (result.riskLevel !== 'low' || hasActive(result, 'risk-calibration')) items.push('prevent stacked warnings');
  if (mode === 'containment' || hasActive(result, 'overload-intelligence')) items.push('prevent AI therapist loop');
  if (hasActive(result, 'memory-relevance') || hasActive(result, 'narrative-continuity')) {
    items.push('avoid surveillance-like memory callbacks');
  }
  if (hasActive(result, 'session-pressure')) items.push('avoid artificial urgency');

  return Array.from(new Set(items));
}

function rationale(result: OrchestrationResult, mode: ResponseMode, length: ResponseLength): string[] {
  return [
    `Mode ${mode} selected from primary frame ${result.primaryFrame}.`,
    `Length ${length} follows orchestration depth ${result.responseDepth}.`,
    result.conflictNotes.length
      ? `Conflict prevention already active: ${result.conflictNotes.slice(0, 2).join(' ')}`
      : 'No high-priority frame conflict remains after orchestration.',
  ];
}

export function synthesizeResponseStrategy(result: OrchestrationResult, inspector?: PipelineInspector): ResponseSynthesisResult {
  const selectedMode = selectMode(result);
  const responseLength = selectLength(result, selectedMode);
  const compression = compressionLevel(result, responseLength);

  const strategy: ResponseSynthesisResult = {
    selectedMode,
    finalTone: MODE_TO_TONE[selectedMode],
    responseLength,
    dominantFrame: result.primaryFrame,
    supportingFrames: supportingFrames(result),
    suppressedFrames: suppressedFrames(result),
    actionableFocus: actionableFocus(result, selectedMode),
    advisoryIntensity: advisoryIntensity(result, selectedMode),
    emotionalPressure: emotionalPressure(result, selectedMode),
    compressionLevel: compression,
    actionabilityScore: actionabilityScore(result, selectedMode, responseLength),
    contradictionFiltering: contradictionFiltering(result, selectedMode),
    safeguards: safeguards(result, selectedMode, compression),
    rationale: rationale(result, selectedMode, responseLength),
  };
  strategy.explainabilityReport = generateExplainabilityReport({
    orchestration: result,
    synthesis: strategy,
    mode: 'verbose',
  });
  inspector?.captureExplainability(strategy.explainabilityReport);
  inspector?.captureSynthesis(strategy);
  return strategy;
}

export function buildResponseSynthesisInstruction(strategy: ResponseSynthesisResult): string {
  return [
    'CENTRAL RESPONSE SYNTHESIS:',
    'This is the final response strategy after orchestration. It converts active intelligence signals into one coherent answer style.',
    `Selected mode: ${strategy.selectedMode}. Final tone: ${strategy.finalTone}.`,
    `Response length: ${strategy.responseLength}. Compression: ${strategy.compressionLevel}.`,
    `Dominant frame: ${strategy.dominantFrame}.`,
    strategy.supportingFrames.length ? `Supporting frames: ${strategy.supportingFrames.join(', ')}.` : 'Supporting frames: none.',
    strategy.suppressedFrames.length ? `Suppressed frames: ${strategy.suppressedFrames.join(', ')}.` : '',
    `Advisory intensity: ${strategy.advisoryIntensity}. Emotional pressure: ${strategy.emotionalPressure}.`,
    `Actionability target: ${strategy.actionabilityScore}/100. Actionable focus: ${strategy.actionableFocus}.`,
    `Contradiction filtering: ${strategy.contradictionFiltering}.`,
    strategy.safeguards.length ? `Synthesis safeguards: ${strategy.safeguards.join(', ')}.` : '',
    'Write through the dominant frame only. Supporting frames may inform one sentence each only if they change the action.',
    'Do not stack warnings, repeat the same diagnosis, recursively explain framing, or drift into therapist-like validation loops.',
    'Do not reveal synthesis labels, scores, modes, frames, or safeguards to the user.',
  ].filter(Boolean).join('\n');
}
