export type IntelligencePriorityLevel = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'PASSIVE';

export interface IntelligenceConfidenceScore {
  confidence: number;
  stability: number;
  semanticRelevance: number;
  riskLevel: number;
  escalationPressure: number;
}

export interface IntelligencePrioritySignal {
  id: string;
  active: boolean;
  basePriorityScore: number;
  confidenceScore: number;
  triggerConditions: string[];
  ownedResponsibility: string;
  forbiddenOverlap: string[];
  priorityLevel?: IntelligencePriorityLevel;
  confidenceBreakdown?: Partial<IntelligenceConfidenceScore>;
  conflictsWith?: string[];
  compatibleWith?: string[];
}

export interface WeightedIntelligenceRoute extends IntelligencePrioritySignal {
  priorityLevel: IntelligencePriorityLevel;
  priorityWeight: number;
  confidenceBreakdown: IntelligenceConfidenceScore;
  weightedScore: number;
  routeState: 'active' | 'merged' | 'suppressed';
  routingReason: string;
  suppressedBy?: string;
}

export interface IntelligenceConflict {
  id: string;
  modules: string[];
  dominantIntelligence?: string;
  suppressedIntelligences: string[];
  reason: string;
}

export interface IntelligencePriorityArbitrationResult {
  routedSignals: WeightedIntelligenceRoute[];
  activeSignals: WeightedIntelligenceRoute[];
  suppressedSignals: WeightedIntelligenceRoute[];
  dominantIntelligence?: WeightedIntelligenceRoute;
  mergedIntelligences: string[];
  conflicts: IntelligenceConflict[];
  synthesisPrecedence: string[];
  debugVisualization: {
    winningIntelligence?: string;
    why: string;
    confidenceBreakdown?: IntelligenceConfidenceScore;
    suppressedModules: Array<{
      id: string;
      suppressedBy?: string;
      reason: string;
      weightedScore: number;
    }>;
  };
}

interface ArbitrationOptions {
  minActivePriority?: number;
}

const PRIORITY_WEIGHTS: Record<IntelligencePriorityLevel, number> = {
  CRITICAL: 100,
  HIGH: 82,
  NORMAL: 62,
  LOW: 42,
  PASSIVE: 18,
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function inferPriorityLevel(score: number): IntelligencePriorityLevel {
  if (score >= 88) return 'CRITICAL';
  if (score >= 74) return 'HIGH';
  if (score >= 55) return 'NORMAL';
  if (score >= 35) return 'LOW';
  return 'PASSIVE';
}

function normalizeConfidence(signal: IntelligencePrioritySignal): IntelligenceConfidenceScore {
  const semanticFallback = signal.triggerConditions.length > 0
    ? Math.min(88, 48 + signal.triggerConditions.length * 10)
    : 28;
  const stabilityFallback = signal.confidenceScore >= 70 ? 78 : signal.confidenceScore >= 50 ? 62 : 42;
  const riskFallback = signal.id.includes('risk') ? 86 : signal.basePriorityScore >= 88 ? 72 : 42;
  const escalationFallback = signal.basePriorityScore >= 88 ? 76 : signal.basePriorityScore >= 74 ? 58 : 36;

  return {
    confidence: clampScore(signal.confidenceBreakdown?.confidence ?? signal.confidenceScore),
    stability: clampScore(signal.confidenceBreakdown?.stability ?? stabilityFallback),
    semanticRelevance: clampScore(signal.confidenceBreakdown?.semanticRelevance ?? semanticFallback),
    riskLevel: clampScore(signal.confidenceBreakdown?.riskLevel ?? riskFallback),
    escalationPressure: clampScore(signal.confidenceBreakdown?.escalationPressure ?? escalationFallback),
  };
}

function weightedScore(
  signal: IntelligencePrioritySignal,
  level: IntelligencePriorityLevel,
  confidence: IntelligenceConfidenceScore,
): number {
  return clampScore(
    signal.basePriorityScore * 0.34 +
    PRIORITY_WEIGHTS[level] * 0.2 +
    confidence.confidence * 0.18 +
    confidence.stability * 0.1 +
    confidence.semanticRelevance * 0.1 +
    confidence.riskLevel * 0.04 +
    confidence.escalationPressure * 0.04,
  );
}

function route(signal: IntelligencePrioritySignal, minActivePriority: number): WeightedIntelligenceRoute {
  const priorityLevel = signal.priorityLevel ?? inferPriorityLevel(signal.basePriorityScore);
  const confidenceBreakdown = normalizeConfidence(signal);
  const score = weightedScore(signal, priorityLevel, confidenceBreakdown);
  const unstable = confidenceBreakdown.confidence < 35 || confidenceBreakdown.stability < 35;
  const inactiveReason = signal.active ? 'Priority below activation threshold.' : 'Trigger conditions not met.';
  const routeState = signal.active && signal.basePriorityScore >= minActivePriority && !unstable ? 'active' : 'suppressed';
  const routingReason = unstable
    ? 'Suppressed because confidence or stability is too low for visible routing.'
    : routeState === 'active'
      ? `${priorityLevel} signal routed with weighted score ${score}.`
      : inactiveReason;

  return {
    ...signal,
    priorityLevel,
    priorityWeight: PRIORITY_WEIGHTS[priorityLevel],
    confidenceBreakdown,
    weightedScore: score,
    routeState,
    routingReason,
    suppressedBy: routeState === 'suppressed' ? 'priority-threshold' : undefined,
  };
}

function conflictId(a: string, b: string): string {
  return [a, b].sort().join('::');
}

function compatible(a: WeightedIntelligenceRoute, b: WeightedIntelligenceRoute): boolean {
  return (a.compatibleWith ?? []).includes(b.id) || (b.compatibleWith ?? []).includes(a.id);
}

function conflicts(a: WeightedIntelligenceRoute, b: WeightedIntelligenceRoute): boolean {
  return (
    (a.conflictsWith ?? []).includes(b.id) ||
    (b.conflictsWith ?? []).includes(a.id) ||
    a.forbiddenOverlap.some((overlap) => b.ownedResponsibility.toLowerCase().includes(overlap.toLowerCase())) ||
    b.forbiddenOverlap.some((overlap) => a.ownedResponsibility.toLowerCase().includes(overlap.toLowerCase()))
  );
}

function selectWinner(a: WeightedIntelligenceRoute, b: WeightedIntelligenceRoute): WeightedIntelligenceRoute {
  if (a.weightedScore !== b.weightedScore) return a.weightedScore > b.weightedScore ? a : b;
  if (a.priorityWeight !== b.priorityWeight) return a.priorityWeight > b.priorityWeight ? a : b;
  return a.confidenceBreakdown.confidence >= b.confidenceBreakdown.confidence ? a : b;
}

export function arbitrateIntelligencePriority(
  signals: IntelligencePrioritySignal[],
  options: ArbitrationOptions = {},
): IntelligencePriorityArbitrationResult {
  const minActivePriority = options.minActivePriority ?? 35;
  const routed = signals.map((signal) => route(signal, minActivePriority));
  const byId = new Map(routed.map((item) => [item.id, item]));
  const conflictRecords: IntelligenceConflict[] = [];
  const seenConflicts = new Set<string>();

  for (const left of routed.filter((item) => item.routeState === 'active')) {
    if (left.routeState !== 'active') continue;
    for (const right of routed.filter((item) => item.routeState === 'active' && item.id !== left.id)) {
      const id = conflictId(left.id, right.id);
      if (seenConflicts.has(id) || compatible(left, right) || !conflicts(left, right)) continue;
      seenConflicts.add(id);
      const winner = selectWinner(left, right);
      const loser = winner.id === left.id ? right : left;
      loser.routeState = 'suppressed';
      loser.suppressedBy = winner.id;
      loser.routingReason = `${winner.id} has higher synthesis precedence; ${loser.id} is suppressed to reduce duplicated or conflicting framing.`;
      conflictRecords.push({
        id,
        modules: [left.id, right.id],
        dominantIntelligence: winner.id,
        suppressedIntelligences: [loser.id],
        reason: loser.routingReason,
      });
    }
  }

  const activeSignals = routed
    .filter((item) => item.routeState === 'active')
    .sort((a, b) => b.weightedScore - a.weightedScore || b.priorityWeight - a.priorityWeight);
  const dominantIntelligence = activeSignals[0];
  const mergedIntelligences = activeSignals
    .slice(1)
    .filter((item) => dominantIntelligence && compatible(dominantIntelligence, item))
    .map((item) => item.id);
  for (const id of mergedIntelligences) {
    const item = byId.get(id);
    if (item) {
      item.routeState = 'merged';
      item.routingReason = `${id} is compatible with ${dominantIntelligence?.id}; keep as supporting signal without taking response authority.`;
    }
  }
  const finalActive = routed
    .filter((item) => item.routeState === 'active' || item.routeState === 'merged')
    .sort((a, b) => b.weightedScore - a.weightedScore || b.priorityWeight - a.priorityWeight);
  const suppressedSignals = routed
    .filter((item) => item.routeState === 'suppressed')
    .sort((a, b) => b.weightedScore - a.weightedScore || b.priorityWeight - a.priorityWeight);

  return {
    routedSignals: routed,
    activeSignals: finalActive,
    suppressedSignals,
    dominantIntelligence,
    mergedIntelligences,
    conflicts: conflictRecords,
    synthesisPrecedence: finalActive.map((item) => item.id),
    debugVisualization: {
      winningIntelligence: dominantIntelligence?.id,
      why: dominantIntelligence
        ? `${dominantIntelligence.id} won with ${dominantIntelligence.priorityLevel} priority and weighted score ${dominantIntelligence.weightedScore}.`
        : 'No active intelligence passed the priority threshold.',
      confidenceBreakdown: dominantIntelligence?.confidenceBreakdown,
      suppressedModules: suppressedSignals.map((item) => ({
        id: item.id,
        suppressedBy: item.suppressedBy,
        reason: item.routingReason,
        weightedScore: item.weightedScore,
      })),
    },
  };
}
