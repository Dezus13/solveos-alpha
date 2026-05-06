import type { ArbitrationContract } from './intelligenceArbitration';
import type { IdentityKernelContract } from './identityKernel';

type EvaluationDimension =
  | 'clarity'
  | 'usefulness'
  | 'signal density'
  | 'realism'
  | 'decisiveness'
  | 'restraint'
  | 'pacing fit';

type QualityRisk =
  | 'fluff'
  | 'repeated ideas'
  | 'fake certainty'
  | 'generic consultant phrasing'
  | 'emotional over-framing'
  | 'excessive length'
  | 'weak actionable value'
  | 'over-analysis'
  | 'pacing mismatch'
  | 'identity kernel violation'
  | 'smart-sounding nonsense';

type BoundedCorrection =
  | 'compress'
  | 'simplify'
  | 'sharpen'
  | 'soften'
  | 'reduce hype'
  | 'improve pacing';

interface DimensionScore {
  dimension: EvaluationDimension;
  target: 'acceptable' | 'watch' | 'strict';
}

export interface SelfEvaluationPlan {
  maxPasses: 1;
  activeRisks: QualityRisk[];
  scores: DimensionScore[];
  corrections: BoundedCorrection[];
  compressionRequired: boolean;
  rationale: string[];
}

const CONSULTANT_PHRASES = /\b(holistic|robust|synergy|stakeholder alignment|strategic framework|navigate|balanced approach|measured phased approach|proceed with caution)\b/i;
const HYPE_PHRASES = /\b(life-changing|game-changing|incredible|powerful insight|unlock your potential|transformational|destined|now or never)\b/i;
const FAKE_CERTAINTY = /\b(definitely|guaranteed|without question|100%|no doubt|always|never|inevitable)\b/i;
const EMPATHY_LOOP = /\b(i hear you|that must feel|it makes sense you feel|your feelings are valid)\b/i;
const ACTION_LANGUAGE = /\b(do|ship|test|decide|cut|pause|measure|call|write|send|choose|validate|commit|stop|start|schedule)\b/i;

function recentAssistantText(history: Array<{ role: string; content: string }>): string {
  return history.filter((turn) => turn.role === 'assistant').slice(-4).map((turn) => turn.content).join(' ');
}

function recentUserText(problem: string, history: Array<{ role: string; content: string }>): string {
  return `${history.filter((turn) => turn.role === 'user').slice(-4).map((turn) => turn.content).join(' ')} ${problem}`.trim();
}

function sentenceRepetitionRisk(text: string): boolean {
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim().toLowerCase())
    .filter((sentence) => sentence.length > 20);
  return new Set(sentences).size < sentences.length;
}

function addRisk(risks: Set<QualityRisk>, risk: QualityRisk, rationale: string[], reason: string): void {
  risks.add(risk);
  rationale.push(reason);
}

function correctionForRisk(risk: QualityRisk): BoundedCorrection {
  if (risk === 'fake certainty' || risk === 'emotional over-framing') return 'soften';
  if (risk === 'fluff' || risk === 'generic consultant phrasing' || risk === 'smart-sounding nonsense') return 'sharpen';
  if (risk === 'excessive length' || risk === 'repeated ideas' || risk === 'over-analysis') return 'compress';
  if (risk === 'pacing mismatch') return 'improve pacing';
  if (risk === 'identity kernel violation') return 'reduce hype';
  return 'simplify';
}

function dimensionTargets(contract: ArbitrationContract, risks: Set<QualityRisk>): DimensionScore[] {
  return [
    { dimension: 'clarity', target: risks.has('smart-sounding nonsense') ? 'strict' : 'acceptable' },
    { dimension: 'usefulness', target: risks.has('weak actionable value') ? 'strict' : 'watch' },
    { dimension: 'signal density', target: risks.has('fluff') || risks.has('repeated ideas') ? 'strict' : 'watch' },
    { dimension: 'realism', target: risks.has('fake certainty') ? 'strict' : 'acceptable' },
    { dimension: 'decisiveness', target: contract.recommendationFirmness === 'soft suggestion' ? 'watch' : 'acceptable' },
    { dimension: 'restraint', target: risks.has('over-analysis') || risks.has('excessive length') ? 'strict' : 'watch' },
    { dimension: 'pacing fit', target: risks.has('pacing mismatch') ? 'strict' : 'acceptable' },
  ];
}

export function planSelfEvaluation(
  problem: string,
  conversationHistory: Array<{ role: string; content: string }>,
  contract: ArbitrationContract,
  kernel: IdentityKernelContract,
): SelfEvaluationPlan {
  const assistantText = recentAssistantText(conversationHistory);
  const userText = recentUserText(problem, conversationHistory);
  const risks = new Set<QualityRisk>();
  const rationale: string[] = [];

  if (CONSULTANT_PHRASES.test(assistantText)) {
    addRisk(risks, 'generic consultant phrasing', rationale, 'Recent assistant text used generic advisor phrasing.');
  }
  if (HYPE_PHRASES.test(assistantText) || kernel.suppressions.includes('hype language')) {
    addRisk(risks, 'identity kernel violation', rationale, 'Identity kernel suppresses hype or dramatic language.');
  }
  if (FAKE_CERTAINTY.test(assistantText) || contract.suppressionList.includes('high-certainty recommendation')) {
    addRisk(risks, 'fake certainty', rationale, 'Current contract does not support high-certainty wording.');
  }
  if (EMPATHY_LOOP.test(assistantText) || !kernel.allowEmotionalMirroring) {
    addRisk(risks, 'emotional over-framing', rationale, 'Emotional mirroring should stay minimal and practical.');
  }
  if (sentenceRepetitionRisk(assistantText)) {
    addRisk(risks, 'repeated ideas', rationale, 'Recent assistant phrasing repeated sentence-level ideas.');
  }
  if (contract.depthLevel === 'deep' || contract.reasoningIntensity === 'expanded') {
    addRisk(risks, 'excessive length', rationale, 'Deep reasoning raises verbosity drift risk.');
    addRisk(risks, 'over-analysis', rationale, 'Expanded reasoning needs a strict relevance check.');
  }
  if (contract.depthLevel === 'short' && contract.pacingDirective === 'slow') {
    addRisk(risks, 'pacing mismatch', rationale, 'Short output with slow pacing needs extra clarity and calm sequencing.');
  }
  if (!ACTION_LANGUAGE.test(userText) && contract.recommendationFirmness !== 'soft suggestion') {
    addRisk(risks, 'weak actionable value', rationale, 'Recommendation should end with a practical move, not just framing.');
  }
  if (contract.suppressionList.includes('formatting flourish') || contract.allowStrategicArchitecture === false) {
    addRisk(risks, 'fluff', rationale, 'Suppressed structure increases the need for direct signal density.');
  }
  if (contract.reasoningIntensity === 'expanded' && contract.explorationAllowance === 'open') {
    addRisk(risks, 'smart-sounding nonsense', rationale, 'Open exploration must still avoid clever but non-actionable synthesis.');
  }

  const corrections = Array.from(new Set(Array.from(risks).map(correctionForRisk)));
  const compressionRequired =
    risks.has('excessive length') ||
    risks.has('repeated ideas') ||
    risks.has('fluff') ||
    contract.suppressionList.includes('deep analysis');

  return {
    maxPasses: 1,
    activeRisks: Array.from(risks),
    scores: dimensionTargets(contract, risks),
    corrections,
    compressionRequired,
    rationale: rationale.length ? rationale : ['No major draft quality risk detected; use one light final check only.'],
  };
}

export function buildSelfEvaluationInstruction(plan: SelfEvaluationPlan): string {
  return [
    'BOUNDED SELF-EVALUATION:',
    'Before final output, run exactly one private quality pass on the draft. Do not reveal this pass, scores, labels, or self-critique.',
    'Hard cap: MAX 1 evaluation pass. Do not restart reasoning, recursively revise, or narrate the review.',
    plan.activeRisks.length ? `Draft risks to check: ${plan.activeRisks.join(', ')}.` : 'Draft risks to check: low signal, repetition, fake certainty, over-length, and pacing mismatch.',
    `Internal score dimensions: ${plan.scores.map((score) => `${score.dimension}=${score.target}`).join(', ')}.`,
    plan.corrections.length ? `Allowed bounded corrections: ${plan.corrections.join(', ')}.` : 'Allowed bounded corrections: small sharpening only.',
    plan.compressionRequired ? 'Compression rule: if the draft can lose 30% length without losing meaning, compress it before finalizing.' : 'Compression rule: keep length only when each sentence adds new information.',
    'Failure check: remove fluff, repeated ideas, generic consultant phrasing, motivational filler, artificial certainty, emotional over-framing, and smart-sounding nonsense.',
    'Human rhythm check: avoid robotic paragraph symmetry, repeated openings, repeated closings, and identical sentence pacing.',
    'Identity check: preserve the identity kernel after revision: calm, useful, non-hyped, operationally honest, signal-dense, and reality-oriented.',
    'Safety: no chain-of-thought exposure, no self-awareness language, no "I analyzed my reasoning", no visible critique behavior.',
  ].join('\n');
}
