import type { OrchestrationResult } from '../orchestration/orchestrationEngine';
import type { ResponseSynthesisResult } from '../synthesis/responseSynthesizer';
import type { SystemHealthReport } from '../core/architectureRules';

export type PipelineEventName =
  | 'intent_detected'
  | 'orchestration_started'
  | 'intelligence_activated'
  | 'intelligence_suppressed'
  | 'orchestration_completed'
  | 'synthesis_selected'
  | 'compression_applied'
  | 'contradiction_filtered'
  | 'duplicate_prevention_triggered'
  | 'architecture_health_checked'
  | 'final_response_generated';

export interface PipelineEvent {
  name: PipelineEventName;
  stage: string;
  timestamp: string;
  decisions: Record<string, RedactedValue>;
  reasoningMetadata?: Record<string, RedactedValue>;
  suppressionMetadata?: Record<string, RedactedValue>;
}

export interface PipelineInspectionReport {
  enabled: boolean;
  source: 'env' | 'request' | 'disabled';
  createdAt: string;
  completedAt?: string;
  pipelineStages: string[];
  timestamps: {
    startedAt: string;
    completedAt?: string;
  };
  decisions: {
    detectedIntent?: Record<string, RedactedValue>;
    activatedIntelligences: string[];
    suppressedIntelligences: string[];
    orchestrationPriority?: Record<string, RedactedValue>;
    synthesis?: Record<string, RedactedValue>;
  };
  reasoningMetadata: Record<string, RedactedValue>;
  suppressionMetadata: Array<Record<string, RedactedValue>>;
  duplicatePreventionTriggers: string[];
  systemHealth?: SystemHealthReport;
  events: PipelineEvent[];
}

type RedactedValue =
  | string
  | number
  | boolean
  | null
  | RedactedValue[]
  | { [key: string]: RedactedValue };

interface PipelineInspectorOptions {
  enabled: boolean;
  source: 'env' | 'request' | 'disabled';
}

const SECRET_KEY_PATTERN = /(api[_-]?key|secret|token|password|authorization|credential|cookie|session)/i;
const SENSITIVE_PAYLOAD_KEY_PATTERN = /(prompt|memory|conversation|content|problem|raw|payload|history|context)/i;
const MAX_STRING_LENGTH = 180;
const MAX_ARRAY_LENGTH = 12;
const MAX_OBJECT_KEYS = 24;

function nowIso(): string {
  return new Date().toISOString();
}

function redactString(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > MAX_STRING_LENGTH ? `${compact.slice(0, MAX_STRING_LENGTH - 3)}...` : compact;
}

function redactValue(value: unknown, key = '', depth = 0): RedactedValue {
  if (SECRET_KEY_PATTERN.test(key)) return '[redacted-secret]';
  if (SENSITIVE_PAYLOAD_KEY_PATTERN.test(key)) return '[redacted-payload]';
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    if (depth >= 3) return `[redacted-array:${value.length}]`;
    return value.slice(0, MAX_ARRAY_LENGTH).map((item) => redactValue(item, key, depth + 1));
  }
  if (typeof value === 'object') {
    if (depth >= 3) return '[redacted-object]';
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, MAX_OBJECT_KEYS)
        .map(([childKey, childValue]) => [childKey, redactValue(childValue, childKey, depth + 1)]),
    );
  }
  return String(value);
}

function redactRecord(value: Record<string, unknown> = {}): Record<string, RedactedValue> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, redactValue(item, key)]),
  );
}

function sourceFor(requestEnabled: boolean): PipelineInspectorOptions['source'] {
  if (requestEnabled) return 'request';
  if (process.env.SOLVEOS_PIPELINE_DEBUG === '1' || process.env.SOLVEOS_PIPELINE_DEBUG === 'true') return 'env';
  return 'disabled';
}

export class PipelineInspector {
  readonly enabled: boolean;
  readonly source: PipelineInspectorOptions['source'];
  private readonly createdAt = nowIso();
  private readonly events: PipelineEvent[] = [];
  private detectedIntent?: Record<string, RedactedValue>;
  private orchestrationPriority?: Record<string, RedactedValue>;
  private synthesis?: Record<string, RedactedValue>;
  private activatedIntelligences: string[] = [];
  private suppressedIntelligences: string[] = [];
  private duplicatePreventionTriggers: string[] = [];
  private systemHealth?: SystemHealthReport;
  private suppressionMetadata: Array<Record<string, RedactedValue>> = [];
  private reasoningMetadata: Record<string, RedactedValue> = {};
  private completedAt?: string;

  constructor(options: PipelineInspectorOptions) {
    this.enabled = options.enabled;
    this.source = options.source;
  }

  record(
    name: PipelineEventName,
    stage: string,
    data: {
      decisions?: Record<string, unknown>;
      reasoningMetadata?: Record<string, unknown>;
      suppressionMetadata?: Record<string, unknown>;
    } = {},
  ): void {
    if (!this.enabled) return;
    const event: PipelineEvent = {
      name,
      stage,
      timestamp: nowIso(),
      decisions: redactRecord(data.decisions),
      reasoningMetadata: data.reasoningMetadata ? redactRecord(data.reasoningMetadata) : undefined,
      suppressionMetadata: data.suppressionMetadata ? redactRecord(data.suppressionMetadata) : undefined,
    };
    this.events.push(event);
  }

  captureIntent(intent: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.detectedIntent = redactRecord(intent);
    this.record('intent_detected', 'intent routing', { decisions: intent });
  }

  captureOrchestrationStarted(input: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.record('orchestration_started', 'central orchestration', {
      decisions: input,
    });
  }

  captureOrchestration(result: OrchestrationResult): void {
    if (!this.enabled) return;
    this.activatedIntelligences = result.activeIntelligences.map((item) => item.id);
    this.suppressedIntelligences = result.suppressedIntelligences.map((item) => item.id);
    this.duplicatePreventionTriggers = result.conflictNotes;
    this.orchestrationPriority = redactRecord({
      primaryFrame: result.primaryFrame,
      responseDepth: result.responseDepth,
      riskLevel: result.riskLevel,
      synthesisPriority: result.synthesisPriority,
      activeCount: result.activeIntelligences.length,
      suppressedCount: result.suppressedIntelligences.length,
    });
    this.suppressionMetadata = result.suppressedIntelligences.map((item) => redactRecord({
      id: item.id,
      suppressedBy: item.suppressedBy,
      reason: item.reason,
      priorityScore: item.priorityScore,
      confidenceScore: item.confidenceScore,
    }));
    this.reasoningMetadata = {
      ...this.reasoningMetadata,
      orchestrationPriority: this.orchestrationPriority,
    };

    for (const item of result.activeIntelligences) {
      this.record('intelligence_activated', item.stage, {
        decisions: {
          id: item.id,
          priorityScore: item.priorityScore,
          confidenceScore: item.confidenceScore,
          ownedResponsibility: item.ownedResponsibility,
        },
      });
    }
    for (const item of result.suppressedIntelligences) {
      this.record('intelligence_suppressed', item.stage, {
        decisions: {
          id: item.id,
          suppressedBy: item.suppressedBy,
          priorityScore: item.priorityScore,
          confidenceScore: item.confidenceScore,
        },
        suppressionMetadata: {
          reason: item.reason,
          forbiddenOverlap: item.forbiddenOverlap,
        },
      });
    }
    for (const note of result.conflictNotes) {
      this.record('duplicate_prevention_triggered', 'conflict prevention', {
        decisions: { note },
      });
    }
    this.record('orchestration_completed', 'central orchestration', {
      decisions: this.orchestrationPriority,
    });
  }

  captureSystemHealth(report: SystemHealthReport): void {
    if (!this.enabled) return;
    this.systemHealth = report;
    this.reasoningMetadata = {
      ...this.reasoningMetadata,
      systemHealth: redactRecord({
        status: report.status,
        scores: report.scores,
        issueCount: report.issues.length,
      }),
    };
    this.record('architecture_health_checked', 'architecture stabilization', {
      decisions: {
        status: report.status,
        scores: report.scores,
        issueCount: report.issues.length,
        criticalIssues: report.issues.filter((item) => item.severity === 'critical').length,
        warningIssues: report.issues.filter((item) => item.severity === 'warning').length,
      },
      reasoningMetadata: {
        summary: report.summary,
      },
      suppressionMetadata: {
        issues: report.issues.map((item) => ({
          id: item.id,
          severity: item.severity,
          ruleId: item.ruleId,
          modules: item.modules,
        })),
      },
    });
  }

  captureSynthesis(strategy: ResponseSynthesisResult): void {
    if (!this.enabled) return;
    this.synthesis = redactRecord({
      selectedMode: strategy.selectedMode,
      finalTone: strategy.finalTone,
      responseLength: strategy.responseLength,
      dominantFrame: strategy.dominantFrame,
      supportingFrames: strategy.supportingFrames,
      suppressedFrames: strategy.suppressedFrames,
      compressionLevel: strategy.compressionLevel,
      riskLevel: this.orchestrationPriority?.riskLevel ?? null,
      contradictionFiltering: strategy.contradictionFiltering,
      actionabilityScore: strategy.actionabilityScore,
      actionableFocus: strategy.actionableFocus,
      safeguards: strategy.safeguards,
    });
    this.reasoningMetadata = {
      ...this.reasoningMetadata,
      synthesis: this.synthesis,
    };
    this.record('synthesis_selected', 'response synthesis', {
      decisions: this.synthesis,
      reasoningMetadata: {
        rationale: strategy.rationale,
      },
    });
    if (strategy.compressionLevel !== 'low') {
      this.record('compression_applied', 'response synthesis', {
        decisions: {
          compressionLevel: strategy.compressionLevel,
          responseLength: strategy.responseLength,
        },
      });
    }
    if (strategy.contradictionFiltering !== 'allow-if-central') {
      this.record('contradiction_filtered', 'response synthesis', {
        decisions: {
          contradictionFiltering: strategy.contradictionFiltering,
        },
      });
    }
  }

  captureFinalResponse(kind: 'streaming' | 'json', metadata: Record<string, unknown> = {}): void {
    if (!this.enabled) return;
    this.completedAt = nowIso();
    this.record('final_response_generated', 'output', {
      decisions: {
        kind,
        ...metadata,
      },
    });
  }

  report(): PipelineInspectionReport | undefined {
    if (!this.enabled) return undefined;
    return {
      enabled: true,
      source: this.source,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      pipelineStages: Array.from(new Set(this.events.map((event) => event.stage))),
      timestamps: {
        startedAt: this.createdAt,
        completedAt: this.completedAt,
      },
      decisions: {
        detectedIntent: this.detectedIntent,
        activatedIntelligences: this.activatedIntelligences,
        suppressedIntelligences: this.suppressedIntelligences,
        orchestrationPriority: this.orchestrationPriority,
        synthesis: this.synthesis,
      },
      reasoningMetadata: this.reasoningMetadata,
      suppressionMetadata: this.suppressionMetadata,
      duplicatePreventionTriggers: this.duplicatePreventionTriggers,
      systemHealth: this.systemHealth,
      events: this.events,
    };
  }
}

export function createPipelineInspector(requestEnabled: boolean): PipelineInspector {
  const source = sourceFor(requestEnabled);
  return new PipelineInspector({
    enabled: source !== 'disabled',
    source,
  });
}

export function shouldEnablePipelineInspector(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}
