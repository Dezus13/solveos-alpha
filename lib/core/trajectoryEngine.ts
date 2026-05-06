import type { DecisionMemoryEntry, StrategicPattern } from '../types';
import type { UserDecisionProfile } from '../userProfile';

// ─── Emotional State ─────────────────────────────────────────────────────────

export type EmotionalState =
  | 'motivated'
  | 'hesitant'
  | 'overwhelmed'
  | 'decisive'
  | 'avoidant'
  | 'recovering'
  | 'burned_out'
  | 'stable'
  | 'unknown';

// ─── Trajectory Data Structures ──────────────────────────────────────────────

export interface TrajectoryPoint {
  timestamp: string;
  decisionId: string;
  domain: string;
  score: number;               // 0–100 decision quality
  executionRate: number;       // 0–1 follow-through rate at time of point
  emotionalState: EmotionalState;
  decisionQuality: number;     // 0–100 composite
  riskProfile: 'low' | 'medium' | 'high';
  hasOutcome: boolean;
  outcomeAccuracy?: number;    // 0–100 when outcome recorded
}

export type TrajectorySlopeDirection = 'ascending' | 'descending' | 'flat' | 'volatile';

export interface TrajectoryVector {
  slope: number;               // rate of change per 30 days
  direction: TrajectorySlopeDirection;
  confidence: number;          // 0–100 statistical confidence in slope
  sampleSize: number;
}

// ─── Behavioral Pattern Detection ────────────────────────────────────────────

export type BehavioralPatternType =
  | 'serial_hesitation'     // repeatedly hesitates before acting
  | 'high_risk_seeking'     // consistently pursues bold paths
  | 'avoidance_loop'        // avoids completing or revisits same problems
  | 'execution_collapse'    // plans well but fails to follow through
  | 'burst_activity'        // high activity spikes followed by inactivity
  | 'domain_concentration'  // heavy focus on one domain to exclusion of others
  | 'decision_fatigue'      // quality degrades under volume
  | 'momentum_build'        // steady improvement over time
  | 'strategic_scatter'     // no coherent long-term direction
  | 'identity_consistency'; // decisions consistently aligned with stated identity

export interface BehavioralPattern {
  type: BehavioralPatternType;
  label: string;
  frequency: number;           // how many times observed
  strength: number;            // 0–1 signal strength
  firstSeen: string;
  lastSeen: string;
  supportingDecisionIds: string[];
  implication: string;
  adaptationHint: string;      // how to adjust orchestration based on this
}

// ─── Drift Detection ─────────────────────────────────────────────────────────

export type DriftType =
  | 'strategic_drift'      // long-term goals are shifting without deliberate choice
  | 'domain_drift'         // focus area is changing
  | 'risk_drift'           // risk appetite is shifting
  | 'execution_drift'      // follow-through behavior is changing
  | 'emotional_drift'      // emotional baseline is shifting
  | 'identity_drift';      // identity signals diverging from past pattern

export interface DriftSignal {
  type: DriftType;
  severity: 'mild' | 'moderate' | 'significant';
  detectedAt: string;
  baseline: number;            // reference value (e.g. avg risk score 30 days ago)
  current: number;             // current value
  delta: number;               // signed change
  explanation: string;
  recommendation: string;
}

// ─── Momentum Analysis ────────────────────────────────────────────────────────

export interface MomentumScore {
  raw: number;                 // 0–100 composite momentum
  direction: 'building' | 'declining' | 'stalled' | 'recovering';
  executionMomentum: number;   // 0–100
  qualityMomentum: number;     // 0–100
  volumeMomentum: number;      // 0–100 relative to historical activity rate
  streakDays: number;          // consecutive days with at least one decision
  lastActiveDate: string;
  inactiveDays: number;
}

// ─── Adaptive Memory Layers ───────────────────────────────────────────────────

export interface ShortTermMemory {
  windowDays: 7;
  points: TrajectoryPoint[];
  avgScore: number;
  dominantEmotionalState: EmotionalState;
  activeDecisionCount: number;
  executionRate: number;
}

export interface MediumTermMemory {
  windowDays: 30;
  points: TrajectoryPoint[];
  avgScore: number;
  avgExecutionRate: number;
  topDomain: string;
  patternSignals: BehavioralPatternType[];
  qualityVector: TrajectoryVector;
}

export interface LongTermMemory {
  windowDays: 90;
  points: TrajectoryPoint[];
  avgScore: number;
  avgExecutionRate: number;
  domainDistribution: Record<string, number>;
  qualityVector: TrajectoryVector;
  executionVector: TrajectoryVector;
  peakScore: number;
  troughScore: number;
}

export interface IdentityMemory {
  corePatterns: BehavioralPattern[];
  consistencyScore: number;    // 0–100 how consistent identity signals are
  identityLabel: string;
  riskPersona: 'risk_averse' | 'balanced' | 'risk_seeking' | 'impulsive';
  executionPersona: 'executor' | 'planner' | 'procrastinator' | 'inconsistent';
  dominantDomains: string[];
  lastUpdated: string;
}

export interface StrategicMemory {
  recurringThemes: string[];
  openLoops: string[];         // decisions started but not concluded or reviewed
  strategicGoals: string[];    // inferred long-term goals from decision history
  driftSignals: DriftSignal[];
  alignmentScore: number;      // 0–100 how aligned recent decisions are with inferred goals
  lastDriftCheck: string;
}

export interface AdaptiveMemoryLayer {
  shortTerm: ShortTermMemory;
  mediumTerm: MediumTermMemory;
  longTerm: LongTermMemory;
  identity: IdentityMemory;
  strategic: StrategicMemory;
}

// ─── Trajectory Prediction ────────────────────────────────────────────────────

export interface TrajectoryPrediction {
  horizon: 30 | 60 | 90;
  predictedScore: number;         // 0–100
  predictedExecutionRate: number; // 0–1
  predictedEmotionalState: EmotionalState;
  confidence: 'high' | 'medium' | 'low';
  riskFactors: string[];
  growthFactors: string[];
  likelyDomain: string;
}

// ─── Future-State Simulation ──────────────────────────────────────────────────

export type SimulationScenario =
  | 'maintain_current'      // continue as-is
  | 'increase_execution'    // improve follow-through by ~20%
  | 'reduce_risk'           // shift toward safer decisions
  | 'increase_volume'       // make more decisions
  | 'domain_focus'          // concentrate on top domain
  | 'strategic_reset';      // start fresh with new direction

export interface FutureStateSimulation {
  scenario: SimulationScenario;
  label: string;
  projectedScore30: number;
  projectedScore90: number;
  projectedExecutionRate: number;
  momentum: 'positive' | 'neutral' | 'negative';
  keyRisks: string[];
  keyOpportunities: string[];
  recommendPriority: number;  // 1 = highest recommendation priority
}

// ─── Main Output ──────────────────────────────────────────────────────────────

export interface TrajectoryIntelligence {
  userId: string;
  computedAt: string;

  // Core data
  points: TrajectoryPoint[];
  vector: TrajectoryVector;
  momentum: MomentumScore;

  // Patterns & drift
  behavioralPatterns: BehavioralPattern[];
  driftSignals: DriftSignal[];

  // Memory layers
  memory: AdaptiveMemoryLayer;

  // Forward-looking
  predictions: TrajectoryPrediction[];
  simulations: FutureStateSimulation[];

  // Orchestration signal
  orchestrationHints: OrchestrationHints;

  // Explainability
  explanation: TrajectoryExplanation;
}

export interface OrchestrationHints {
  primaryAdaptation:
    | 'encourage_action'    // user is hesitating — push toward execution
    | 'slow_down'           // user is moving too fast / impulsively
    | 'reinforce_identity'  // remind user of their stated goals
    | 'acknowledge_burnout' // reduce pressure, offer recovery framing
    | 'challenge_comfort'   // user is too comfortable — introduce challenge
    | 'celebrate_momentum'  // user is on a streak — reinforce it
    | 'flag_drift'          // alert user to strategic drift
    | 'standard';           // no special adaptation needed
  responseDepthBias: 'shorter' | 'deeper' | 'neutral';
  toneAdjustment: 'warmer' | 'colder' | 'neutral';
  shouldSurfacePattern: boolean;
  shouldSurfaceDrift: boolean;
  patternToSurface?: BehavioralPatternType;
  driftToSurface?: DriftType;
  momentumMessage?: string;
}

export interface TrajectoryExplanation {
  summary: string;
  momentumNarrative: string;
  topPattern?: string;
  topDrift?: string;
  predictionRationale: string;
  adaptationRationale: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  dataSufficiency: 'sufficient' | 'limited' | 'insufficient';
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface TrajectoryEngineInput {
  decisions: DecisionMemoryEntry[];
  profile: UserDecisionProfile;
  patterns?: StrategicPattern[];
  userId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;
const SHORT_WINDOW_DAYS = 7;
const MEDIUM_WINDOW_DAYS = 30;
const LONG_WINDOW_DAYS = 90;

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(v)));
}

function clampFloat(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function daysAgo(timestamp: string): number {
  return (Date.now() - new Date(timestamp).getTime()) / MS_PER_DAY;
}

function withinDays(timestamp: string, days: number): boolean {
  return daysAgo(timestamp) <= days;
}

function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const freq = new Map<T, number>();
  let maxCount = 0;
  let result = arr[0];
  for (const item of arr) {
    const count = (freq.get(item) ?? 0) + 1;
    freq.set(item, count);
    if (count > maxCount) { maxCount = count; result = item; }
  }
  return result;
}

// ─── Emotional State Inference ────────────────────────────────────────────────

function inferEmotionalState(entry: DecisionMemoryEntry): EmotionalState {
  const problem = (entry.problem ?? '').toLowerCase();
  const verdict = (entry.blueprint?.recommendation ?? '').toLowerCase();
  const combined = problem + ' ' + verdict;

  if (/\b(overwhelmed|burned.?out|too much|exhausted|no energy|can't think)\b/.test(combined)) return 'burned_out';
  if (/\b(overwhelm|anxious|stress|chaos|spiral)\b/.test(combined)) return 'overwhelmed';
  if (/\b(hesitat|unsure|not sure|doubt|can't decide|torn)\b/.test(combined)) return 'hesitant';
  if (/\b(avoid|postpone|delay|procrastinat|keep putting off)\b/.test(combined)) return 'avoidant';
  if (/\b(recover|bounce back|restart|back on track|trying again)\b/.test(combined)) return 'recovering';
  if (/\b(motivated|excited|ready|committed|let's go|let me)\b/.test(combined)) return 'motivated';
  if (/\b(decided|clear|going to|will do|action plan)\b/.test(combined)) return 'decisive';
  if (entry.blueprint?.score >= 70) return 'stable';
  return 'unknown';
}

// ─── Risk Profile Inference ───────────────────────────────────────────────────

function inferRiskProfile(entry: DecisionMemoryEntry): 'low' | 'medium' | 'high' {
  const confidence = entry.blueprint?.confidenceScore ?? entry.blueprint?.score ?? 50;
  const bold = entry.blueprint?.paths?.bold?.description ?? '';
  const risks = entry.blueprint?.diagnosis?.keyRisks ?? '';
  const hasBoldHint = /\b(bold|aggressive|high.?risk|bet|pivot|disrupt)\b/i.test(bold + ' ' + risks);
  if (hasBoldHint || confidence < 45) return 'high';
  if (confidence >= 70) return 'low';
  return 'medium';
}

// ─── Trajectory Points Builder ────────────────────────────────────────────────

export function buildTrajectoryPoints(decisions: DecisionMemoryEntry[]): TrajectoryPoint[] {
  return decisions
    .filter((d) => d.timestamp)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((entry): TrajectoryPoint => {
      const outcomeAccuracy = entry.outcome?.scoreAccuracy;
      const decisionQuality = clamp(
        (entry.blueprint?.score ?? 50) * 0.6 +
        (outcomeAccuracy !== undefined ? outcomeAccuracy * 0.4 : (entry.blueprint?.score ?? 50) * 0.4),
      );
      return {
        timestamp: entry.timestamp,
        decisionId: entry.id,
        domain: entry.context?.domain ?? entry.tags?.[0] ?? 'general',
        score: clamp(entry.blueprint?.score ?? 50),
        executionRate: entry.outcome ? (entry.outcome.scoreAccuracy >= 60 ? 1 : 0) : 0.5,
        emotionalState: inferEmotionalState(entry),
        decisionQuality,
        riskProfile: inferRiskProfile(entry),
        hasOutcome: Boolean(entry.outcome),
        outcomeAccuracy,
      };
    });
}

// ─── Trajectory Vector ────────────────────────────────────────────────────────

export function computeTrajectoryVector(points: TrajectoryPoint[]): TrajectoryVector {
  if (points.length < 2) {
    return { slope: 0, direction: 'flat', confidence: 0, sampleSize: points.length };
  }

  const n = points.length;
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.score);

  const xMean = avg(xs);
  const yMean = avg(ys);
  const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;

  // Normalize slope per 30 decisions
  const slopeNormalized = slope * 30;

  const direction: TrajectorySlopeDirection =
    Math.abs(slopeNormalized) < 2 ? 'flat'
    : slopeNormalized > 0 ? 'ascending'
    : Math.abs(slopeNormalized) > 15 ? 'volatile'
    : 'descending';

  // Confidence scales with sample size, capped at 90
  const confidence = clamp(Math.min(90, n * 5));

  return { slope: slopeNormalized, direction, confidence, sampleSize: n };
}

// ─── Behavioral Pattern Detection ────────────────────────────────────────────

function makePattern(
  type: BehavioralPatternType,
  label: string,
  frequency: number,
  strength: number,
  supporting: DecisionMemoryEntry[],
  implication: string,
  adaptationHint: string,
): BehavioralPattern {
  const sorted = [...supporting].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return {
    type,
    label,
    frequency,
    strength: clampFloat(strength),
    firstSeen: sorted[0]?.timestamp ?? new Date().toISOString(),
    lastSeen: sorted[sorted.length - 1]?.timestamp ?? new Date().toISOString(),
    supportingDecisionIds: sorted.map((d) => d.id),
    implication,
    adaptationHint,
  };
}

export function detectBehavioralPatterns(
  decisions: DecisionMemoryEntry[],
  profile: UserDecisionProfile,
): BehavioralPattern[] {
  if (decisions.length < 3) return [];
  const patterns: BehavioralPattern[] = [];
  const resolved = decisions.filter((d) => d.outcome);

  // Serial hesitation: multiple decisions with hesitant emotional state
  const hesitantDecisions = decisions.filter((d) => inferEmotionalState(d) === 'hesitant');
  if (hesitantDecisions.length >= 2) {
    patterns.push(makePattern(
      'serial_hesitation',
      'Serial Hesitation',
      hesitantDecisions.length,
      clampFloat(hesitantDecisions.length / decisions.length),
      hesitantDecisions,
      'User consistently hesitates before committing. Responses should provide clearer decision criteria.',
      'encourage_action',
    ));
  }

  // High risk seeking: bold path chosen or high-risk profile decisions
  const highRiskDecisions = decisions.filter((d) => inferRiskProfile(d) === 'high');
  if (highRiskDecisions.length >= 2 && highRiskDecisions.length / decisions.length > 0.4) {
    patterns.push(makePattern(
      'high_risk_seeking',
      'High Risk Seeking',
      highRiskDecisions.length,
      clampFloat(highRiskDecisions.length / decisions.length),
      highRiskDecisions,
      'User gravitates toward bold, high-risk options regardless of context.',
      'slow_down',
    ));
  }

  // Avoidance loop: same domain problems re-entered without resolution
  const domainCounts: Record<string, DecisionMemoryEntry[]> = {};
  for (const d of decisions) {
    const domain = d.context?.domain ?? d.tags?.[0] ?? 'general';
    domainCounts[domain] = [...(domainCounts[domain] ?? []), d];
  }
  for (const [, domainDecisions] of Object.entries(domainCounts)) {
    const unresolvedInDomain = domainDecisions.filter((d) => !d.outcome);
    if (unresolvedInDomain.length >= 3) {
      patterns.push(makePattern(
        'avoidance_loop',
        'Avoidance Loop',
        unresolvedInDomain.length,
        clampFloat(unresolvedInDomain.length / decisions.length * 2),
        unresolvedInDomain,
        'User repeatedly enters the same domain without resolving open loops.',
        'encourage_action',
      ));
      break;
    }
  }

  // Execution collapse: high confidence decisions with poor outcomes
  if (resolved.length >= 3) {
    const executionCollapse = resolved.filter(
      (d) => (d.blueprint?.confidenceScore ?? d.blueprint?.score ?? 50) >= 65
        && (d.outcome?.scoreAccuracy ?? 100) < 50,
    );
    if (executionCollapse.length >= 2) {
      patterns.push(makePattern(
        'execution_collapse',
        'Execution Collapse',
        executionCollapse.length,
        clampFloat(executionCollapse.length / resolved.length),
        executionCollapse,
        'User plans well and scores high confidence but fails to execute. Gap between planning and doing.',
        'encourage_action',
      ));
    }
  }

  // Burst activity: clustering of many decisions in a short window followed by silence
  const sorted = [...decisions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  let burstCount = 0;
  for (let i = 0; i < sorted.length - 2; i++) {
    const span = (new Date(sorted[i + 2].timestamp).getTime() - new Date(sorted[i].timestamp).getTime()) / MS_PER_DAY;
    if (span < 3) burstCount++;
  }
  if (burstCount >= 2) {
    patterns.push(makePattern(
      'burst_activity',
      'Burst Activity',
      burstCount,
      clampFloat(burstCount / Math.max(1, decisions.length - 2)),
      sorted,
      'User makes decisions in sudden bursts rather than consistent cadence.',
      'flag_drift',
    ));
  }

  // Domain concentration
  const maxDomainCount = Math.max(...Object.values(domainCounts).map((arr) => arr.length));
  if (maxDomainCount / decisions.length > 0.6 && decisions.length >= 4) {
    const concentratedDomain = Object.entries(domainCounts).find(([, arr]) => arr.length === maxDomainCount);
    if (concentratedDomain) {
      patterns.push(makePattern(
        'domain_concentration',
        'Domain Concentration',
        concentratedDomain[1].length,
        clampFloat(concentratedDomain[1].length / decisions.length),
        concentratedDomain[1],
        `User focuses heavily on "${concentratedDomain[0]}" domain to exclusion of others.`,
        'challenge_comfort',
      ));
    }
  }

  // Decision fatigue: quality degrades as volume increases within a window
  const recentPoints = buildTrajectoryPoints(decisions.filter((d) => withinDays(d.timestamp, 14)));
  if (recentPoints.length >= 5) {
    const firstHalfAvg = avg(recentPoints.slice(0, Math.floor(recentPoints.length / 2)).map((p) => p.score));
    const secondHalfAvg = avg(recentPoints.slice(Math.floor(recentPoints.length / 2)).map((p) => p.score));
    if (firstHalfAvg - secondHalfAvg > 10) {
      patterns.push(makePattern(
        'decision_fatigue',
        'Decision Fatigue',
        recentPoints.length,
        clampFloat((firstHalfAvg - secondHalfAvg) / 50),
        decisions.filter((d) => withinDays(d.timestamp, 14)),
        'Decision quality declining within a high-volume recent window. Cognitive overload.',
        'acknowledge_burnout',
      ));
    }
  }

  // Momentum build: sustained quality improvement over 30 days
  const longVector = computeTrajectoryVector(buildTrajectoryPoints(decisions.filter((d) => withinDays(d.timestamp, 30))));
  if (longVector.direction === 'ascending' && longVector.slope > 3 && decisions.length >= 5) {
    patterns.push(makePattern(
      'momentum_build',
      'Momentum Build',
      decisions.filter((d) => withinDays(d.timestamp, 30)).length,
      clampFloat(longVector.slope / 10),
      decisions.filter((d) => withinDays(d.timestamp, 30)),
      'User is on a positive trajectory with improving decision quality.',
      'celebrate_momentum',
    ));
  }

  // Identity consistency: decisions score consistently tracks profile riskTolerance
  if (decisions.length >= 5) {
    const consistencyScores = decisions.map((d) => {
      const riskProfile = inferRiskProfile(d);
      const expectedRisk = profile.riskTolerance > 0.65 ? 'high' : profile.riskTolerance < 0.35 ? 'low' : 'medium';
      return riskProfile === expectedRisk ? 1 : 0;
    });
    const consistencyRate = avg(consistencyScores);
    if (consistencyRate >= 0.7) {
      patterns.push(makePattern(
        'identity_consistency',
        'Identity Consistency',
        Math.round(consistencyRate * decisions.length),
        consistencyRate,
        decisions,
        'User\'s decisions are well-aligned with their stated risk profile and identity.',
        'reinforce_identity',
      ));
    }
  }

  // Sort by strength descending
  return patterns.sort((a, b) => b.strength - a.strength);
}

// ─── Drift Detection ─────────────────────────────────────────────────────────

export function detectDrift(
  points: TrajectoryPoint[],
  _profile: UserDecisionProfile,
): DriftSignal[] {
  if (points.length < 6) return [];
  const signals: DriftSignal[] = [];
  const now = new Date().toISOString();

  const firstHalf = points.slice(0, Math.floor(points.length / 2));
  const secondHalf = points.slice(Math.floor(points.length / 2));

  // Risk drift
  const riskToNum = (r: 'low' | 'medium' | 'high') => r === 'low' ? 0.2 : r === 'medium' ? 0.5 : 0.8;
  const baselineRisk = avg(firstHalf.map((p) => riskToNum(p.riskProfile)));
  const currentRisk = avg(secondHalf.map((p) => riskToNum(p.riskProfile)));
  const riskDelta = currentRisk - baselineRisk;
  if (Math.abs(riskDelta) > 0.2) {
    signals.push({
      type: 'risk_drift',
      severity: Math.abs(riskDelta) > 0.35 ? 'significant' : 'moderate',
      detectedAt: now,
      baseline: Math.round(baselineRisk * 100),
      current: Math.round(currentRisk * 100),
      delta: Math.round(riskDelta * 100),
      explanation: riskDelta > 0
        ? 'User is taking on significantly more risk than their historical baseline.'
        : 'User has become notably more risk-averse than their baseline.',
      recommendation: riskDelta > 0
        ? 'Review whether increased risk is intentional or driven by external pressure.'
        : 'Check whether risk avoidance is a deliberate strategy or fear-based retreat.',
    });
  }

  // Execution drift
  const baselineExecution = avg(firstHalf.map((p) => p.executionRate));
  const currentExecution = avg(secondHalf.map((p) => p.executionRate));
  const executionDelta = currentExecution - baselineExecution;
  if (Math.abs(executionDelta) > 0.15) {
    signals.push({
      type: 'execution_drift',
      severity: Math.abs(executionDelta) > 0.3 ? 'significant' : Math.abs(executionDelta) > 0.2 ? 'moderate' : 'mild',
      detectedAt: now,
      baseline: Math.round(baselineExecution * 100),
      current: Math.round(currentExecution * 100),
      delta: Math.round(executionDelta * 100),
      explanation: executionDelta > 0
        ? 'Follow-through rate has improved significantly compared to historical behavior.'
        : 'Follow-through rate has declined. More decisions are going unresolved.',
      recommendation: executionDelta > 0
        ? 'Reinforce this positive shift — identify and sustain what is working.'
        : 'Identify the blocking factor: capacity, confidence, or context overload.',
    });
  }

  // Emotional drift
  const emotionToNum = (e: EmotionalState): number => {
    const map: Record<EmotionalState, number> = {
      motivated: 0.9, decisive: 0.85, stable: 0.7,
      recovering: 0.5, unknown: 0.5,
      hesitant: 0.35, avoidant: 0.2, overwhelmed: 0.15, burned_out: 0.05,
    };
    return map[e] ?? 0.5;
  };
  const baselineEmotion = avg(firstHalf.map((p) => emotionToNum(p.emotionalState)));
  const currentEmotion = avg(secondHalf.map((p) => emotionToNum(p.emotionalState)));
  const emotionDelta = currentEmotion - baselineEmotion;
  if (Math.abs(emotionDelta) > 0.2) {
    signals.push({
      type: 'emotional_drift',
      severity: Math.abs(emotionDelta) > 0.4 ? 'significant' : 'moderate',
      detectedAt: now,
      baseline: Math.round(baselineEmotion * 100),
      current: Math.round(currentEmotion * 100),
      delta: Math.round(emotionDelta * 100),
      explanation: emotionDelta < 0
        ? 'Emotional tone has shifted toward hesitation, avoidance, or overload patterns.'
        : 'Emotional tone has shifted positively — more motivated and decisive signals.',
      recommendation: emotionDelta < 0
        ? 'Address underlying stress factors before pushing for execution.'
        : 'Leverage this positive window to tackle high-priority decisions.',
    });
  }

  // Domain drift: top domain has shifted
  const baselineDomains: Record<string, number> = {};
  const currentDomains: Record<string, number> = {};
  for (const p of firstHalf) baselineDomains[p.domain] = (baselineDomains[p.domain] ?? 0) + 1;
  for (const p of secondHalf) currentDomains[p.domain] = (currentDomains[p.domain] ?? 0) + 1;
  const topBaselineDomain = Object.entries(baselineDomains).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topCurrentDomain = Object.entries(currentDomains).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topBaselineDomain && topCurrentDomain && topBaselineDomain !== topCurrentDomain) {
    signals.push({
      type: 'domain_drift',
      severity: 'mild',
      detectedAt: now,
      baseline: 0,
      current: 0,
      delta: 0,
      explanation: `Decision focus has shifted from "${topBaselineDomain}" to "${topCurrentDomain}".`,
      recommendation: 'Confirm this shift is intentional and not a form of strategic avoidance.',
    });
  }

  // Strategic drift: overall quality vector is descending for 30+ days
  const recentVector = computeTrajectoryVector(secondHalf);
  if (recentVector.direction === 'descending' && recentVector.slope < -5 && secondHalf.length >= 3) {
    signals.push({
      type: 'strategic_drift',
      severity: recentVector.slope < -10 ? 'significant' : 'moderate',
      detectedAt: now,
      baseline: Math.round(avg(firstHalf.map((p) => p.score))),
      current: Math.round(avg(secondHalf.map((p) => p.score))),
      delta: Math.round(avg(secondHalf.map((p) => p.score)) - avg(firstHalf.map((p) => p.score))),
      explanation: 'Overall decision quality is trending downward. Strategic coherence is weakening.',
      recommendation: 'Conduct a strategic review session — identify what has changed and realign.',
    });
  }

  return signals;
}

// ─── Momentum Score ───────────────────────────────────────────────────────────

export function computeMomentum(
  points: TrajectoryPoint[],
  decisions: DecisionMemoryEntry[],
): MomentumScore {
  if (points.length === 0) {
    return {
      raw: 50,
      direction: 'stalled',
      executionMomentum: 50,
      qualityMomentum: 50,
      volumeMomentum: 50,
      streakDays: 0,
      lastActiveDate: new Date().toISOString(),
      inactiveDays: 0,
    };
  }

  const recent30 = points.filter((p) => withinDays(p.timestamp, 30));
  const older30to60 = points.filter((p) => !withinDays(p.timestamp, 30) && withinDays(p.timestamp, 60));

  const recentQuality = avg(recent30.map((p) => p.score));
  const olderQuality = avg(older30to60.map((p) => p.score));
  const qualityMomentum = clamp(50 + (recentQuality - olderQuality) * 1.5);

  const recentExecution = avg(recent30.map((p) => p.executionRate));
  const olderExecution = avg(older30to60.map((p) => p.executionRate));
  const executionMomentum = clamp(50 + (recentExecution - olderExecution) * 100);

  const volumeRate = recent30.length / 30;
  const historicalRate = points.length / Math.max(1, (new Date(points[points.length - 1].timestamp).getTime() - new Date(points[0].timestamp).getTime()) / MS_PER_DAY);
  const volumeMomentum = clamp(50 + (volumeRate - historicalRate) * 200);

  const raw = clamp((qualityMomentum + executionMomentum + volumeMomentum) / 3);

  const direction: MomentumScore['direction'] =
    raw >= 65 ? 'building'
    : raw >= 45 ? 'recovering'
    : qualityMomentum < 40 && executionMomentum < 40 ? 'declining'
    : 'stalled';

  // Streak: count consecutive days with at least one decision
  const sorted = [...decisions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  let streakDays = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasDecisionOnDay = sorted.some((d) => d.timestamp.startsWith(dateStr));
    if (hasDecisionOnDay) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const lastActiveDate = sorted[0]?.timestamp ?? new Date().toISOString();
  const inactiveDays = Math.floor(daysAgo(lastActiveDate));

  return {
    raw,
    direction,
    executionMomentum,
    qualityMomentum,
    volumeMomentum,
    streakDays,
    lastActiveDate,
    inactiveDays,
  };
}

// ─── Adaptive Memory Layers ───────────────────────────────────────────────────

function buildShortTermMemory(points: TrajectoryPoint[]): ShortTermMemory {
  const recent = points.filter((p) => withinDays(p.timestamp, SHORT_WINDOW_DAYS));
  return {
    windowDays: 7,
    points: recent,
    avgScore: clamp(avg(recent.map((p) => p.score))),
    dominantEmotionalState: mode(recent.map((p) => p.emotionalState)) ?? 'unknown',
    activeDecisionCount: recent.length,
    executionRate: clampFloat(avg(recent.map((p) => p.executionRate))),
  };
}

function buildMediumTermMemory(
  points: TrajectoryPoint[],
  patterns: BehavioralPattern[],
): MediumTermMemory {
  const recent = points.filter((p) => withinDays(p.timestamp, MEDIUM_WINDOW_DAYS));
  const domainCounts: Record<string, number> = {};
  for (const p of recent) domainCounts[p.domain] = (domainCounts[p.domain] ?? 0) + 1;
  const topDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'general';
  return {
    windowDays: 30,
    points: recent,
    avgScore: clamp(avg(recent.map((p) => p.score))),
    avgExecutionRate: clampFloat(avg(recent.map((p) => p.executionRate))),
    topDomain,
    patternSignals: patterns.filter((p) => withinDays(p.lastSeen, 30)).map((p) => p.type),
    qualityVector: computeTrajectoryVector(recent),
  };
}

function buildLongTermMemory(points: TrajectoryPoint[]): LongTermMemory {
  const recent = points.filter((p) => withinDays(p.timestamp, LONG_WINDOW_DAYS));
  const domainDistribution: Record<string, number> = {};
  for (const p of recent) domainDistribution[p.domain] = (domainDistribution[p.domain] ?? 0) + 1;
  const scores = recent.map((p) => p.score);
  return {
    windowDays: 90,
    points: recent,
    avgScore: clamp(avg(scores)),
    avgExecutionRate: clampFloat(avg(recent.map((p) => p.executionRate))),
    domainDistribution,
    qualityVector: computeTrajectoryVector(recent),
    executionVector: computeTrajectoryVector(
      recent.map((p) => ({ ...p, score: Math.round(p.executionRate * 100) })),
    ),
    peakScore: scores.length > 0 ? Math.max(...scores) : 0,
    troughScore: scores.length > 0 ? Math.min(...scores) : 0,
  };
}

function buildIdentityMemory(
  patterns: BehavioralPattern[],
  profile: UserDecisionProfile,
  points: TrajectoryPoint[],
): IdentityMemory {
  const corePatterns = patterns.filter((p) => p.frequency >= 2);

  const consistencySignals = points.filter((p) => p.emotionalState === 'decisive' || p.emotionalState === 'stable');
  const consistencyScore = clamp(points.length > 0 ? (consistencySignals.length / points.length) * 100 : 50);

  const riskPersona: IdentityMemory['riskPersona'] =
    profile.riskTolerance > 0.7 ? 'risk_seeking'
    : profile.riskTolerance < 0.3 ? 'risk_averse'
    : profile.riskTolerance > 0.55 ? 'balanced'
    : 'impulsive';

  const executionPersona: IdentityMemory['executionPersona'] =
    profile.executionScore > 0.7 ? 'executor'
    : profile.executionScore > 0.5 ? 'planner'
    : profile.executionScore > 0.3 ? 'inconsistent'
    : 'procrastinator';

  const domainCounts: Record<string, number> = {};
  for (const p of points) domainCounts[p.domain] = (domainCounts[p.domain] ?? 0) + 1;
  const dominantDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => d);

  const identityLabel =
    profile.userDecisionScore >= 80 ? 'Strategic executor'
    : profile.userDecisionScore >= 60 ? 'Consistent decision-maker'
    : profile.userDecisionScore >= 40 ? 'Developing discipline'
    : 'Early-stage learner';

  return {
    corePatterns,
    consistencyScore,
    identityLabel,
    riskPersona,
    executionPersona,
    dominantDomains,
    lastUpdated: new Date().toISOString(),
  };
}

function buildStrategicMemory(
  decisions: DecisionMemoryEntry[],
  patterns: BehavioralPattern[],
  driftSignals: DriftSignal[],
  points: TrajectoryPoint[],
): StrategicMemory {
  const openLoops = decisions
    .filter((d) => !d.outcome && daysAgo(d.timestamp) > 30)
    .slice(0, 5)
    .map((d) => d.problem.slice(0, 100));

  const recurringThemes: string[] = [];
  const domainCounts: Record<string, number> = {};
  for (const d of decisions) {
    const domain = d.context?.domain ?? d.tags?.[0] ?? 'general';
    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
  }
  for (const [domain, count] of Object.entries(domainCounts)) {
    if (count >= 3) recurringThemes.push(domain);
  }

  // Infer strategic goals from decision content keywords
  const goalKeywords = new Map<string, string>([
    ['business-launch', 'Build or scale a venture'],
    ['career', 'Advance professional trajectory'],
    ['financial', 'Achieve financial stability or growth'],
    ['relationship', 'Navigate personal relationships'],
    ['health', 'Maintain or improve health'],
    ['learning', 'Develop new skills or knowledge'],
  ]);
  const strategicGoals: string[] = [];
  for (const theme of recurringThemes) {
    const goal = goalKeywords.get(theme);
    if (goal) strategicGoals.push(goal);
  }

  // Alignment: how many recent decisions match inferred goals
  const recentPoints = points.filter((p) => withinDays(p.timestamp, 30));
  const alignedCount = recentPoints.filter((p) => recurringThemes.includes(p.domain)).length;
  const alignmentScore = clamp(recentPoints.length > 0 ? (alignedCount / recentPoints.length) * 100 : 50);

  return {
    recurringThemes,
    openLoops,
    strategicGoals,
    driftSignals,
    alignmentScore,
    lastDriftCheck: new Date().toISOString(),
  };
}

export function buildAdaptiveMemory(
  decisions: DecisionMemoryEntry[],
  points: TrajectoryPoint[],
  patterns: BehavioralPattern[],
  driftSignals: DriftSignal[],
  profile: UserDecisionProfile,
): AdaptiveMemoryLayer {
  return {
    shortTerm: buildShortTermMemory(points),
    mediumTerm: buildMediumTermMemory(points, patterns),
    longTerm: buildLongTermMemory(points),
    identity: buildIdentityMemory(patterns, profile, points),
    strategic: buildStrategicMemory(decisions, patterns, driftSignals, points),
  };
}

// ─── Trajectory Prediction Engine ────────────────────────────────────────────

export function predictTrajectory(
  points: TrajectoryPoint[],
  vector: TrajectoryVector,
  horizon: 30 | 60 | 90,
): TrajectoryPrediction {
  if (points.length === 0) {
    return {
      horizon,
      predictedScore: 50,
      predictedExecutionRate: 0.5,
      predictedEmotionalState: 'unknown',
      confidence: 'low',
      riskFactors: ['Insufficient data'],
      growthFactors: [],
      likelyDomain: 'general',
    };
  }

  const currentAvg = avg(points.slice(-5).map((p) => p.score));
  const multiplier = horizon / 30;
  const projectedChange = vector.slope * multiplier;
  const predictedScore = clamp(currentAvg + projectedChange);

  const currentExecution = avg(points.slice(-5).map((p) => p.executionRate));
  const executionChange = vector.direction === 'ascending' ? 0.05 * multiplier : -0.03 * multiplier;
  const predictedExecutionRate = clampFloat(currentExecution + executionChange);

  const recentEmotions = points.slice(-5).map((p) => p.emotionalState);
  const dominantEmotion = mode(recentEmotions) ?? 'unknown';
  const predictedEmotionalState: EmotionalState =
    vector.direction === 'ascending' ? 'motivated'
    : vector.direction === 'descending' ? 'hesitant'
    : dominantEmotion;

  const riskFactors: string[] = [];
  const growthFactors: string[] = [];

  if (vector.direction === 'descending') riskFactors.push('Downward quality trend');
  if (predictedExecutionRate < 0.4) riskFactors.push('Low execution rate trajectory');
  if (vector.direction === 'volatile') riskFactors.push('Unstable decision pattern');
  if (points.length < 5) riskFactors.push('Limited data for accurate prediction');

  if (vector.direction === 'ascending') growthFactors.push('Positive quality momentum');
  if (predictedExecutionRate > 0.65) growthFactors.push('Strong execution trajectory');
  if (vector.confidence > 70) growthFactors.push('High prediction confidence');

  const domainCounts: Record<string, number> = {};
  for (const p of points.slice(-10)) domainCounts[p.domain] = (domainCounts[p.domain] ?? 0) + 1;
  const likelyDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'general';

  const confidence: TrajectoryPrediction['confidence'] =
    points.length >= 10 && vector.confidence > 60 ? 'high'
    : points.length >= 5 ? 'medium'
    : 'low';

  return {
    horizon,
    predictedScore,
    predictedExecutionRate,
    predictedEmotionalState,
    confidence,
    riskFactors,
    growthFactors,
    likelyDomain,
  };
}

// ─── Future-State Simulation Helpers ─────────────────────────────────────────

export function simulateFutureStates(
  points: TrajectoryPoint[],
  vector: TrajectoryVector,
  memory: AdaptiveMemoryLayer,
): FutureStateSimulation[] {
  const currentScore = avg(points.slice(-5).map((p) => p.score)) || 50;
  const currentExecution = avg(points.slice(-5).map((p) => p.executionRate)) || 0.5;

  const scenarios: FutureStateSimulation[] = [
    {
      scenario: 'maintain_current',
      label: 'Continue as-is',
      projectedScore30: clamp(currentScore + vector.slope * 0.5),
      projectedScore90: clamp(currentScore + vector.slope * 1.5),
      projectedExecutionRate: clampFloat(currentExecution),
      momentum: vector.direction === 'ascending' ? 'positive' : vector.direction === 'descending' ? 'negative' : 'neutral',
      keyRisks: vector.direction === 'descending' ? ['Quality erosion without intervention'] : [],
      keyOpportunities: vector.direction === 'ascending' ? ['Compounding momentum'] : [],
      recommendPriority: vector.direction === 'ascending' ? 2 : 4,
    },
    {
      scenario: 'increase_execution',
      label: 'Increase follow-through by 20%',
      projectedScore30: clamp(currentScore + 8),
      projectedScore90: clamp(currentScore + 18),
      projectedExecutionRate: clampFloat(currentExecution + 0.2),
      momentum: 'positive',
      keyRisks: ['Risk of overextension if capacity is limited'],
      keyOpportunities: ['Converts planning into real outcomes', 'Builds identity consistency'],
      recommendPriority: currentExecution < 0.5 ? 1 : 3,
    },
    {
      scenario: 'reduce_risk',
      label: 'Shift toward safer, more deliberate decisions',
      projectedScore30: clamp(currentScore + 3),
      projectedScore90: clamp(currentScore + 5),
      projectedExecutionRate: clampFloat(currentExecution + 0.1),
      momentum: 'neutral',
      keyRisks: ['May miss high-upside opportunities', 'Could enable avoidance patterns'],
      keyOpportunities: ['Reduces execution collapse risk', 'Builds confidence through wins'],
      recommendPriority: memory.identity.riskPersona === 'impulsive' ? 1 : 4,
    },
    {
      scenario: 'increase_volume',
      label: 'Make more decisions, increase cadence',
      projectedScore30: clamp(currentScore - 2),
      projectedScore90: clamp(currentScore + 10),
      projectedExecutionRate: clampFloat(currentExecution - 0.05),
      momentum: 'positive',
      keyRisks: ['Short-term quality dip from volume', 'Decision fatigue if overloaded'],
      keyOpportunities: ['Faster learning loop', 'Broader strategic coverage'],
      recommendPriority: memory.shortTerm.activeDecisionCount < 2 ? 2 : 5,
    },
    {
      scenario: 'domain_focus',
      label: `Concentrate on ${memory.mediumTerm.topDomain}`,
      projectedScore30: clamp(currentScore + 6),
      projectedScore90: clamp(currentScore + 14),
      projectedExecutionRate: clampFloat(currentExecution + 0.08),
      momentum: 'positive',
      keyRisks: ['Over-indexing on one domain', 'Blind spots from narrow focus'],
      keyOpportunities: ['Deep expertise accumulation', 'Pattern recognition in primary domain'],
      recommendPriority: memory.identity.executionPersona === 'planner' ? 1 : 3,
    },
    {
      scenario: 'strategic_reset',
      label: 'Reassess goals and reset direction',
      projectedScore30: clamp(currentScore - 5),
      projectedScore90: clamp(currentScore + 20),
      projectedExecutionRate: clampFloat(currentExecution),
      momentum: 'neutral',
      keyRisks: ['Short-term disruption', 'Loss of momentum during reset period'],
      keyOpportunities: ['Corrects strategic drift', 'Re-aligns effort with actual goals'],
      recommendPriority: memory.strategic.driftSignals.length >= 2 ? 1 : 5,
    },
  ];

  return scenarios.sort((a, b) => a.recommendPriority - b.recommendPriority);
}

// ─── Orchestration Hints ─────────────────────────────────────────────────────

function buildOrchestrationHints(
  momentum: MomentumScore,
  patterns: BehavioralPattern[],
  driftSignals: DriftSignal[],
  memory: AdaptiveMemoryLayer,
): OrchestrationHints {
  const topPattern = patterns[0];
  const topDrift = driftSignals[0];

  let primaryAdaptation: OrchestrationHints['primaryAdaptation'] = 'standard';

  if (momentum.inactiveDays > 14) primaryAdaptation = 'encourage_action';
  else if (topPattern?.adaptationHint === 'acknowledge_burnout') primaryAdaptation = 'acknowledge_burnout';
  else if (memory.shortTerm.dominantEmotionalState === 'burned_out') primaryAdaptation = 'acknowledge_burnout';
  else if (topPattern?.adaptationHint === 'celebrate_momentum') primaryAdaptation = 'celebrate_momentum';
  else if (topDrift?.severity === 'significant') primaryAdaptation = 'flag_drift';
  else if (topPattern?.adaptationHint === 'encourage_action') primaryAdaptation = 'encourage_action';
  else if (topPattern?.adaptationHint === 'slow_down') primaryAdaptation = 'slow_down';
  else if (topPattern?.adaptationHint === 'reinforce_identity') primaryAdaptation = 'reinforce_identity';
  else if (topPattern?.adaptationHint === 'challenge_comfort') primaryAdaptation = 'challenge_comfort';

  const responseDepthBias: OrchestrationHints['responseDepthBias'] =
    primaryAdaptation === 'acknowledge_burnout' ? 'shorter'
    : primaryAdaptation === 'flag_drift' || primaryAdaptation === 'challenge_comfort' ? 'deeper'
    : 'neutral';

  const toneAdjustment: OrchestrationHints['toneAdjustment'] =
    primaryAdaptation === 'acknowledge_burnout' ? 'warmer'
    : primaryAdaptation === 'challenge_comfort' || primaryAdaptation === 'slow_down' ? 'colder'
    : 'neutral';

  let momentumMessage: string | undefined;
  if (momentum.direction === 'building' && momentum.streakDays > 2) {
    momentumMessage = `${momentum.streakDays}-day decision streak — momentum is building.`;
  } else if (momentum.inactiveDays > 7) {
    momentumMessage = `${momentum.inactiveDays} days since last decision — reconnect with your goals.`;
  }

  return {
    primaryAdaptation,
    responseDepthBias,
    toneAdjustment,
    shouldSurfacePattern: Boolean(topPattern && topPattern.frequency >= 2),
    shouldSurfaceDrift: Boolean(topDrift && topDrift.severity !== 'mild'),
    patternToSurface: topPattern?.type,
    driftToSurface: topDrift?.type,
    momentumMessage,
  };
}

// ─── Explainability ───────────────────────────────────────────────────────────

export function generateTrajectoryExplanation(
  points: TrajectoryPoint[],
  vector: TrajectoryVector,
  momentum: MomentumScore,
  patterns: BehavioralPattern[],
  driftSignals: DriftSignal[],
  memory: AdaptiveMemoryLayer,
): TrajectoryExplanation {
  const dataSufficiency: TrajectoryExplanation['dataSufficiency'] =
    points.length >= 10 ? 'sufficient' : points.length >= 4 ? 'limited' : 'insufficient';

  const confidenceLevel: TrajectoryExplanation['confidenceLevel'] =
    dataSufficiency === 'sufficient' && vector.confidence > 60 ? 'high'
    : dataSufficiency === 'limited' ? 'medium'
    : 'low';

  const directionLabel = {
    ascending: 'improving', descending: 'declining', flat: 'stable', volatile: 'unstable',
  }[vector.direction];

  const summary =
    `${points.length} decisions analyzed. Quality trend is ${directionLabel} ` +
    `(slope ${vector.slope > 0 ? '+' : ''}${vector.slope.toFixed(1)} per 30 decisions). ` +
    `Momentum: ${momentum.direction}. ` +
    (patterns.length > 0 ? `Top pattern: ${patterns[0].label}. ` : '') +
    (driftSignals.length > 0 ? `${driftSignals.length} drift signal(s) detected.` : 'No drift signals.');

  const momentumNarrative =
    momentum.direction === 'building'
      ? `Strong upward momentum. Execution rate ${Math.round(memory.longTerm.avgExecutionRate * 100)}% over 90 days.`
      : momentum.direction === 'declining'
      ? `Declining momentum. Address execution gaps before adding new decisions.`
      : momentum.direction === 'recovering'
      ? `Recovering trajectory. Signs of re-engagement after a slower period.`
      : `Momentum is stalled. Last active ${momentum.inactiveDays} day(s) ago.`;

  const topPattern = patterns[0]
    ? `${patterns[0].label}: ${patterns[0].implication}`
    : undefined;

  const topDrift = driftSignals[0]
    ? `${driftSignals[0].type.replace(/_/g, ' ')}: ${driftSignals[0].explanation}`
    : undefined;

  const predictionRationale =
    vector.sampleSize >= 5
      ? `Prediction based on ${vector.sampleSize}-point linear regression with ${vector.confidence}% confidence.`
      : `Prediction based on limited data (${vector.sampleSize} points). Treat as directional, not precise.`;

  const adaptationRationale =
    `Response adapted based on: ` +
    [
      memory.shortTerm.dominantEmotionalState !== 'unknown' ? `emotional state (${memory.shortTerm.dominantEmotionalState})` : null,
      momentum.direction !== 'building' ? `momentum (${momentum.direction})` : null,
      driftSignals.length > 0 ? `${driftSignals.length} drift signal(s)` : null,
    ].filter(Boolean).join(', ') || 'stable baseline.';

  return {
    summary,
    momentumNarrative,
    topPattern,
    topDrift,
    predictionRationale,
    adaptationRationale,
    confidenceLevel,
    dataSufficiency,
  };
}

// ─── Main Engine Entry Point ──────────────────────────────────────────────────

export function computeTrajectory(input: TrajectoryEngineInput): TrajectoryIntelligence {
  const { decisions, profile, userId = 'anonymous' } = input;

  const points = buildTrajectoryPoints(decisions);
  const vector = computeTrajectoryVector(points);
  const momentum = computeMomentum(points, decisions);
  const behavioralPatterns = detectBehavioralPatterns(decisions, profile);
  const driftSignals = detectDrift(points, profile);
  const memory = buildAdaptiveMemory(decisions, points, behavioralPatterns, driftSignals, profile);
  const predictions: TrajectoryPrediction[] = [
    predictTrajectory(points, vector, 30),
    predictTrajectory(points, vector, 60),
    predictTrajectory(points, vector, 90),
  ];
  const simulations = simulateFutureStates(points, vector, memory);
  const orchestrationHints = buildOrchestrationHints(momentum, behavioralPatterns, driftSignals, memory);
  const explanation = generateTrajectoryExplanation(points, vector, momentum, behavioralPatterns, driftSignals, memory);

  return {
    userId,
    computedAt: new Date().toISOString(),
    points,
    vector,
    momentum,
    behavioralPatterns,
    driftSignals,
    memory,
    predictions,
    simulations,
    orchestrationHints,
    explanation,
  };
}

// ─── Dashboard Helpers ────────────────────────────────────────────────────────

export interface TrajectoryDashboardData {
  trajectoryGraph: Array<{ date: string; score: number; executionRate: number }>;
  momentumScore: number;
  momentumDirection: MomentumScore['direction'];
  consistencyIndicator: number;
  executionTrend: number[];
  strategicAlignmentScore: number;
  topBehavioralPattern: string | undefined;
  driftAlerts: string[];
  predictionAt30: number;
  predictionAt90: number;
  streakDays: number;
}

export function buildTrajectoryDashboardData(
  intelligence: TrajectoryIntelligence,
): TrajectoryDashboardData {
  const { points, momentum, memory, behavioralPatterns, driftSignals, predictions } = intelligence;

  const trajectoryGraph = points.slice(-30).map((p) => ({
    date: p.timestamp.split('T')[0],
    score: p.score,
    executionRate: Math.round(p.executionRate * 100),
  }));

  const executionTrend = points
    .filter((p) => withinDays(p.timestamp, 90))
    .slice(-10)
    .map((p) => Math.round(p.executionRate * 100));

  const driftAlerts = driftSignals
    .filter((d) => d.severity !== 'mild')
    .map((d) => d.explanation);

  return {
    trajectoryGraph,
    momentumScore: momentum.raw,
    momentumDirection: momentum.direction,
    consistencyIndicator: memory.identity.consistencyScore,
    executionTrend,
    strategicAlignmentScore: memory.strategic.alignmentScore,
    topBehavioralPattern: behavioralPatterns[0]?.label,
    driftAlerts,
    predictionAt30: predictions.find((p) => p.horizon === 30)?.predictedScore ?? 50,
    predictionAt90: predictions.find((p) => p.horizon === 90)?.predictedScore ?? 50,
    streakDays: momentum.streakDays,
  };
}
