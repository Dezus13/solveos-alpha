import type { OrchestrationResult } from '../orchestration/orchestrationEngine';
import type { ResponseSynthesisResult } from '../synthesis/responseSynthesizer';
import type { IntelligenceConfidenceScore } from './intelligencePriority';

export type ExplainabilityDebugMode = 'compact' | 'verbose' | 'full-reasoning-trace';

export interface ReasoningTrace {
  selectedIntelligence?: string;
  rejectedIntelligences: Array<{
    id: string;
    suppressedBy?: string;
    reason: string;
    confidenceScore: number;
    weightedScore: number;
  }>;
  confidenceBreakdown?: IntelligenceConfidenceScore;
  routingPath: string[];
  arbitrationOutcome?: {
    winningIntelligence?: string;
    why: string;
    synthesisPrecedence: string[];
    mergedIntelligences: string[];
    conflicts: Array<{
      modules: string[];
      dominantIntelligence?: string;
      suppressedIntelligences: string[];
    }>;
  };
  synthesisDecisions?: {
    selectedMode: string;
    finalTone: string;
    responseLength: string;
    dominantFrame: string;
    supportingFrames: string[];
    suppressedFrames: string[];
    compressionLevel: string;
    actionabilityScore: number;
    contradictionFiltering: string;
  };
  escalationTriggers: string[];
}

export interface OrchestrationVisualization {
  nodes: Array<{
    id: string;
    kind: 'active' | 'suppressed' | 'merged' | 'synthesis';
    label: string;
    score?: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    relation: 'routes-to' | 'suppresses' | 'supports' | 'synthesizes';
  }>;
}

export interface PipelineTraceSnapshot {
  stage: string;
  timestamp: string;
  summary: string;
  decisions: Record<string, SafeExplainabilityValue>;
}

export interface ExplainabilityReport {
  mode: ExplainabilityDebugMode;
  generatedAt: string;
  safety: {
    filtered: boolean;
    policy: string[];
  };
  reasoningTrace: ReasoningTrace;
  visualization: OrchestrationVisualization;
  snapshots: PipelineTraceSnapshot[];
}

type SafeExplainabilityValue =
  | string
  | number
  | boolean
  | null
  | SafeExplainabilityValue[]
  | { [key: string]: SafeExplainabilityValue };

interface ExplainabilityInput {
  orchestration: OrchestrationResult;
  synthesis?: ResponseSynthesisResult;
  mode?: ExplainabilityDebugMode;
}

const UNSAFE_KEY_PATTERN = /(prompt|secret|token|password|authorization|credential|cookie|session|raw|payload|conversation|memory|content|problem|history|chain)/i;
const MAX_STRING_LENGTH = 220;

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeString(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > MAX_STRING_LENGTH ? `${compact.slice(0, MAX_STRING_LENGTH - 3)}...` : compact;
}

function safeValue(value: unknown, key = '', depth = 0): SafeExplainabilityValue {
  if (UNSAFE_KEY_PATTERN.test(key)) return '[filtered]';
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    if (depth >= 3) return `[filtered-array:${value.length}]`;
    return value.slice(0, 16).map((item) => safeValue(item, key, depth + 1));
  }
  if (typeof value === 'object') {
    if (depth >= 3) return '[filtered-object]';
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).slice(0, 28).map(([childKey, childValue]) => [
        childKey,
        safeValue(childValue, childKey, depth + 1),
      ]),
    );
  }
  return sanitizeString(String(value));
}

function safeRecord(value: Record<string, unknown>): Record<string, SafeExplainabilityValue> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, safeValue(item, key)]));
}

function escalationTriggers(orchestration: OrchestrationResult): string[] {
  const triggers: string[] = [];
  if (orchestration.riskLevel === 'high') triggers.push('high risk level');
  for (const item of orchestration.activeIntelligences) {
    if (item.priorityLevel === 'CRITICAL') triggers.push(`${item.id} critical priority`);
    if (item.confidenceBreakdown.escalationPressure >= 75) triggers.push(`${item.id} escalation pressure`);
  }
  return Array.from(new Set(triggers)).slice(0, 8);
}

function rejectedIntelligences(orchestration: OrchestrationResult): ReasoningTrace['rejectedIntelligences'] {
  return orchestration.suppressedIntelligences.map((item) => ({
    id: item.id,
    suppressedBy: item.suppressedBy,
    reason: item.reason,
    confidenceScore: item.confidenceScore,
    weightedScore: item.weightedScore,
  }));
}

function synthesisDecisions(synthesis?: ResponseSynthesisResult): ReasoningTrace['synthesisDecisions'] {
  if (!synthesis) return undefined;
  return {
    selectedMode: synthesis.selectedMode,
    finalTone: synthesis.finalTone,
    responseLength: synthesis.responseLength,
    dominantFrame: synthesis.dominantFrame,
    supportingFrames: synthesis.supportingFrames,
    suppressedFrames: synthesis.suppressedFrames,
    compressionLevel: synthesis.compressionLevel,
    actionabilityScore: synthesis.actionabilityScore,
    contradictionFiltering: synthesis.contradictionFiltering,
  };
}

function visualization(orchestration: OrchestrationResult, synthesis?: ResponseSynthesisResult): OrchestrationVisualization {
  const dominant = orchestration.priorityArbitration.dominantIntelligence?.id;
  const nodes: OrchestrationVisualization['nodes'] = [
    ...orchestration.activeIntelligences.map((item) => ({
      id: item.id,
      kind: item.id === dominant ? 'active' as const : item.weightedScore < 55 ? 'merged' as const : 'active' as const,
      label: item.id,
      score: item.weightedScore,
    })),
    ...orchestration.suppressedIntelligences.map((item) => ({
      id: item.id,
      kind: 'suppressed' as const,
      label: item.id,
      score: item.weightedScore,
    })),
  ];
  if (synthesis) {
    nodes.push({
      id: `synthesis:${synthesis.selectedMode}`,
      kind: 'synthesis',
      label: synthesis.selectedMode,
      score: synthesis.actionabilityScore,
    });
  }

  const edges: OrchestrationVisualization['edges'] = [
    ...orchestration.activeIntelligences.map((item) => ({
      from: item.id,
      to: orchestration.primaryFrame,
      relation: 'routes-to' as const,
    })),
    ...orchestration.suppressedIntelligences
      .filter((item) => item.suppressedBy && item.suppressedBy !== 'orchestration-threshold' && item.suppressedBy !== 'priority-threshold')
      .map((item) => ({
        from: String(item.suppressedBy),
        to: item.id,
        relation: 'suppresses' as const,
      })),
  ];
  if (synthesis) {
    edges.push({
      from: orchestration.primaryFrame,
      to: `synthesis:${synthesis.selectedMode}`,
      relation: 'synthesizes',
    });
  }
  return { nodes, edges };
}

function snapshots(input: ExplainabilityInput, generatedAt: string): PipelineTraceSnapshot[] {
  const { orchestration, synthesis, mode = 'compact' } = input;
  const base: PipelineTraceSnapshot[] = [
    {
      stage: 'orchestration',
      timestamp: generatedAt,
      summary: `Primary frame ${orchestration.primaryFrame}; ${orchestration.activeIntelligences.length} active, ${orchestration.suppressedIntelligences.length} suppressed.`,
      decisions: safeRecord({
        routingPath: orchestration.stageOrder,
        primaryFrame: orchestration.primaryFrame,
        responseDepth: orchestration.responseDepth,
        riskLevel: orchestration.riskLevel,
      }),
    },
    {
      stage: 'priority arbitration',
      timestamp: generatedAt,
      summary: orchestration.priorityArbitration.debugVisualization.why,
      decisions: safeRecord({
        winningIntelligence: orchestration.priorityArbitration.debugVisualization.winningIntelligence ?? null,
        synthesisPrecedence: orchestration.priorityArbitration.synthesisPrecedence,
        suppressedModules: orchestration.priorityArbitration.debugVisualization.suppressedModules,
      }),
    },
  ];
  if (synthesis) {
    base.push({
      stage: 'response synthesis',
      timestamp: generatedAt,
      summary: `Mode ${synthesis.selectedMode}; tone ${synthesis.finalTone}; compression ${synthesis.compressionLevel}.`,
      decisions: safeRecord({
        selectedMode: synthesis.selectedMode,
        finalTone: synthesis.finalTone,
        responseLength: synthesis.responseLength,
        dominantFrame: synthesis.dominantFrame,
        safeguards: synthesis.safeguards,
      }),
    });
  }
  if (mode === 'compact') return base.slice(0, synthesis ? 3 : 2);
  if (mode === 'verbose') return base;
  return [
    ...base,
    {
      stage: 'safety filtering',
      timestamp: generatedAt,
      summary: 'Explainability trace filtered to decision metadata only.',
      decisions: safeRecord({
        hiddenPromptsExcluded: true,
        rawReasoningExcluded: true,
        sensitivePayloadsExcluded: true,
      }),
    },
  ];
}

export function generateExplainabilityReport(input: ExplainabilityInput): ExplainabilityReport {
  const { orchestration, synthesis, mode = 'compact' } = input;
  const generatedAt = nowIso();
  const selected = orchestration.priorityArbitration.dominantIntelligence;
  const trace: ReasoningTrace = {
    selectedIntelligence: selected?.id,
    rejectedIntelligences: mode === 'compact'
      ? rejectedIntelligences(orchestration).slice(0, 5)
      : rejectedIntelligences(orchestration),
    confidenceBreakdown: selected?.confidenceBreakdown,
    routingPath: orchestration.stageOrder,
    arbitrationOutcome: {
      winningIntelligence: orchestration.priorityArbitration.debugVisualization.winningIntelligence,
      why: orchestration.priorityArbitration.debugVisualization.why,
      synthesisPrecedence: orchestration.priorityArbitration.synthesisPrecedence,
      mergedIntelligences: orchestration.priorityArbitration.mergedIntelligences,
      conflicts: orchestration.priorityArbitration.conflicts.map((item) => ({
        modules: item.modules,
        dominantIntelligence: item.dominantIntelligence,
        suppressedIntelligences: item.suppressedIntelligences,
      })),
    },
    synthesisDecisions: synthesisDecisions(synthesis),
    escalationTriggers: escalationTriggers(orchestration),
  };

  return {
    mode,
    generatedAt,
    safety: {
      filtered: true,
      policy: [
        'hidden prompts excluded',
        'raw chain exposure excluded',
        'sensitive memory payloads excluded',
        'decision metadata only',
      ],
    },
    reasoningTrace: mode === 'compact'
      ? {
        ...trace,
        rejectedIntelligences: trace.rejectedIntelligences.slice(0, 5),
      }
      : trace,
    visualization: visualization(orchestration, synthesis),
    snapshots: snapshots(input, generatedAt),
  };
}
