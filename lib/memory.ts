import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  DecisionMemoryEntry,
  DecisionOutcome,
  DecisionContext,
  MemoryGraph,
  MemoryIntelligence,
  OutcomeStatus,
  PendingReview,
  ReviewCheckpoint,
} from './types';
import { computeLearningResult } from './benchmarks';
import { buildMemoryGraph, getMemoryIntelligenceFromHistory } from './memory-graph';

const REVIEW_EXPIRY_DAYS = 90;
const MEMORY_FILE = path.join(process.cwd(), 'data', 'decisions.json');
const CHECKPOINT_HORIZONS = [30, 60, 90] as const;

let memoryStore: DecisionMemoryEntry[] = [];
let memoryLoaded = false;
let memoryWriteQueue: Promise<void> = Promise.resolve();

function cloneEntry(entry: DecisionMemoryEntry): DecisionMemoryEntry {
  return JSON.parse(JSON.stringify(entry)) as DecisionMemoryEntry;
}

async function writeHistory(history: DecisionMemoryEntry[]): Promise<void> {
  memoryStore = history.map(cloneEntry);
  memoryLoaded = true;
  await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true });
  await fs.writeFile(MEMORY_FILE, `${JSON.stringify(memoryStore, null, 2)}\n`, 'utf8');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime());
}

function isOutcomeStatus(value: unknown): value is OutcomeStatus {
  return value === 'unknown' || value === 'better' || value === 'expected' || value === 'worse';
}

function addDaysIso(baseIso: string, days: number): string {
  return new Date(new Date(baseIso).getTime() + days * 86_400_000).toISOString();
}

function createReviewCheckpoints(createdAt: string, status: OutcomeStatus): ReviewCheckpoint[] {
  return CHECKPOINT_HORIZONS.map(horizon => ({
    horizon,
    scheduledFor: addDaysIso(createdAt, horizon),
    status,
  }));
}

function normalizeReviewCheckpoints(value: unknown, createdAt: string, status: OutcomeStatus): ReviewCheckpoint[] {
  if (!Array.isArray(value)) return createReviewCheckpoints(createdAt, status);

  const byHorizon = new Map<number, ReviewCheckpoint>();
  value.filter(isRecord).forEach(checkpoint => {
    const horizon = checkpoint.horizon;
    if (
      (horizon === 30 || horizon === 60 || horizon === 90) &&
      isValidDateString(checkpoint.scheduledFor)
    ) {
      byHorizon.set(horizon, {
        horizon,
        scheduledFor: checkpoint.scheduledFor,
        status: isOutcomeStatus(checkpoint.status) ? checkpoint.status : status,
      });
    }
  });

  return CHECKPOINT_HORIZONS.map(horizon => (
    byHorizon.get(horizon) || {
      horizon,
      scheduledFor: addDaysIso(createdAt, horizon),
      status,
    }
  ));
}

function inferOutcomeStatusFromOutcome(outcome: DecisionOutcome | undefined): OutcomeStatus {
  if (!outcome) return 'unknown';
  if (isOutcomeStatus(outcome.outcomeStatus)) return outcome.outcomeStatus;

  const lower = outcome.actualOutcome.toLowerCase();
  if (lower.includes('succeeded') || lower.includes('better')) return 'better';
  if (lower.includes('failed') || lower.includes('worse')) return 'worse';
  return 'expected';
}

function keyRisksFromEntry(entry: DecisionMemoryEntry): string[] {
  const risks: string[] = [];
  const diagnosisRisk = entry.blueprint.diagnosis?.keyRisks;
  if (typeof diagnosisRisk === 'string' && diagnosisRisk.trim()) risks.push(diagnosisRisk.trim());
  entry.blueprint.preMortemRisks?.forEach(risk => {
    if (risk.riskTrigger?.trim()) risks.push(risk.riskTrigger.trim());
  });
  return risks.slice(0, 5);
}

function nextMoveFromEntry(entry: DecisionMemoryEntry): string {
  return (
    entry.blueprint.actionPlan?.today ||
    entry.blueprint.operatorNextSteps?.[0] ||
    entry.blueprint.actionPlan?.thisWeek ||
    ''
  );
}

function applyMemorySnapshotFields(entry: DecisionMemoryEntry): DecisionMemoryEntry {
  const createdAt = entry.createdAt || entry.timestamp;
  const outcomeStatus = isOutcomeStatus(entry.outcomeStatus)
    ? entry.outcomeStatus
    : inferOutcomeStatusFromOutcome(entry.outcome);
  const learning = entry.learning || computeLearningResult({ ...entry, outcomeStatus });

  return {
    ...entry,
    createdAt,
    question: entry.question || entry.problem,
    verdict: entry.verdict || entry.blueprint.recommendation,
    confidence: isFiniteNumber(entry.confidence) ? clampScore(entry.confidence) : clampScore(entry.blueprint.score),
    keyRisks: Array.isArray(entry.keyRisks)
      ? entry.keyRisks.filter((risk): risk is string => typeof risk === 'string' && risk.trim().length > 0)
      : keyRisksFromEntry(entry),
    nextMove: entry.nextMove || nextMoveFromEntry(entry),
    outcomeStatus,
    learning,
    reviewCheckpoints: normalizeReviewCheckpoints(entry.reviewCheckpoints, createdAt, outcomeStatus),
  };
}

function isPendingReviewExpired(
  pendingReview: PendingReview,
  now = Date.now()
): boolean {
  const scheduledFor = new Date(pendingReview.scheduledFor).getTime();
  if (!Number.isFinite(scheduledFor)) return true;
  return scheduledFor < now - REVIEW_EXPIRY_DAYS * 86_400_000;
}

function normalizeHistoryEntry(value: unknown): DecisionMemoryEntry | null {
  if (!isRecord(value)) return null;

  const blueprint = value.blueprint;
  if (
    typeof value.id !== 'string' ||
    typeof value.problem !== 'string' ||
    !isValidDateString(value.timestamp) ||
    !isRecord(blueprint) ||
    !isFiniteNumber(blueprint.score)
  ) {
    return null;
  }

  const entry = value as unknown as DecisionMemoryEntry;
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === 'string')
    : extractTags(entry.problem, entry.context);

  let normalized: DecisionMemoryEntry = {
    ...entry,
    blueprint: {
      ...entry.blueprint,
      score: clampScore(entry.blueprint.score),
    },
    tags,
  };

  if (value.outcome) {
    const outcome = value.outcome;
    if (
      isRecord(outcome) &&
      typeof outcome.actualOutcome === 'string' &&
      isFiniteNumber(outcome.scoreAccuracy) &&
      isValidDateString(outcome.timestamp)
    ) {
      normalized.outcome = {
        decisionId: typeof outcome.decisionId === 'string' ? outcome.decisionId : normalized.id,
        actualOutcome: outcome.actualOutcome,
        scoreAccuracy: clampScore(outcome.scoreAccuracy),
        verdictAccuracy: isFiniteNumber(outcome.verdictAccuracy) ? clampScore(outcome.verdictAccuracy) : undefined,
        outcomeStatus: isOutcomeStatus(outcome.outcomeStatus) ? outcome.outcomeStatus : undefined,
        timestamp: outcome.timestamp,
        lessons: Array.isArray(outcome.lessons)
          ? outcome.lessons.filter((lesson): lesson is string => typeof lesson === 'string')
          : [],
        recommendations: Array.isArray(outcome.recommendations)
          ? outcome.recommendations.filter((rec): rec is string => typeof rec === 'string')
          : [],
      };
    } else {
      delete normalized.outcome;
    }
  }

  if (value.pendingReview && !normalized.outcome) {
    const pending = value.pendingReview;
    if (
      isRecord(pending) &&
      (pending.reviewType === '7day' || pending.reviewType === '30day' ||
       pending.reviewType === '60day' || pending.reviewType === '90day') &&
      isValidDateString(pending.scheduledFor) &&
      isValidDateString(pending.createdAt)
    ) {
      normalized.pendingReview = pending as unknown as PendingReview;
    } else {
      delete normalized.pendingReview;
    }
  } else {
    delete normalized.pendingReview;
  }

  normalized = applyMemorySnapshotFields(normalized);

  return normalized;
}

async function withMemoryWrite<T>(mutate: (history: DecisionMemoryEntry[]) => Promise<T>): Promise<T> {
  const previous = memoryWriteQueue;
  let release!: () => void;
  memoryWriteQueue = new Promise<void>(resolve => {
    release = resolve;
  });

  await previous;
  try {
    return await mutate(await readHistory());
  } finally {
    release();
  }
}

async function readHistory(): Promise<DecisionMemoryEntry[]> {
  if (!memoryLoaded) {
    try {
      const raw = await fs.readFile(MEMORY_FILE, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      memoryStore = Array.isArray(parsed)
        ? parsed.map(normalizeHistoryEntry).filter((entry): entry is DecisionMemoryEntry => Boolean(entry))
        : [];
    } catch (error: unknown) {
      if (!isRecord(error) || error.code !== 'ENOENT') throw error;
      memoryStore = [];
    }
    memoryLoaded = true;
  }
  return memoryStore.map(cloneEntry);
}

/**
 * Save a decision to local memory storage.
 */
export async function saveDecision(
  entry: Omit<DecisionMemoryEntry, 'id' | 'timestamp' | 'tags' | 'similarity'>
) {
  return withMemoryWrite(async history => {
    const tags = extractTags(entry.problem, entry.context);
    const timestamp = new Date().toISOString();

    const newEntry = applyMemorySnapshotFields({
      ...entry,
      blueprint: {
        ...entry.blueprint,
        score: clampScore(entry.blueprint.score),
      },
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      createdAt: timestamp,
      outcomeStatus: 'unknown',
      tags,
    });

    history.unshift(newEntry);
    await writeHistory(history);
    return newEntry;
  });
}

/**
 * Record outcome for a past decision (learning mechanism).
 * Returns:
 *   { ok: true, entry }   — outcome saved
 *   { ok: false, reason } — 'not_found' | 'already_logged'
 */
export async function recordOutcome(
  decisionId: string,
  outcome: Omit<DecisionOutcome, 'decisionId' | 'timestamp'>
): Promise<{ ok: true; entry: DecisionMemoryEntry } | { ok: false; reason: 'not_found' | 'already_logged' | 'invalid_outcome' }> {
  return withMemoryWrite(async history => {
    const entry = history.find(e => e.id === decisionId);
    if (!entry) return { ok: false, reason: 'not_found' };
    if (entry.outcome) return { ok: false, reason: 'already_logged' };
    if (
      typeof outcome.actualOutcome !== 'string' ||
      !outcome.actualOutcome.trim() ||
      !isFiniteNumber(outcome.scoreAccuracy)
    ) {
      return { ok: false, reason: 'invalid_outcome' };
    }

    entry.outcome = {
      actualOutcome: outcome.actualOutcome.trim(),
      scoreAccuracy: clampScore(outcome.scoreAccuracy),
      verdictAccuracy: isFiniteNumber(outcome.verdictAccuracy) ? clampScore(outcome.verdictAccuracy) : undefined,
      outcomeStatus: isOutcomeStatus(outcome.outcomeStatus) ? outcome.outcomeStatus : undefined,
      lessons: Array.isArray(outcome.lessons) ? outcome.lessons.filter(Boolean) : [],
      recommendations: Array.isArray(outcome.recommendations) ? outcome.recommendations.filter(Boolean) : [],
      decisionId,
      timestamp: new Date().toISOString(),
    };
    entry.outcomeStatus = inferOutcomeStatusFromOutcome(entry.outcome);
    entry.learning = computeLearningResult(entry);
    entry.reviewCheckpoints = normalizeReviewCheckpoints(
      entry.reviewCheckpoints,
      entry.createdAt || entry.timestamp,
      entry.outcomeStatus
    ).map(checkpoint => ({
      ...checkpoint,
      status: entry.outcomeStatus || checkpoint.status,
    }));
    // Clear any pending review now that the outcome is logged.
    delete entry.pendingReview;

    await writeHistory(history);
    return { ok: true, entry };
  });
}

/**
 * Schedule a delayed outcome review for a decision (used when outcome is "unknown").
 * Returns null if: decision not found, or outcome already recorded.
 * Idempotent: re-scheduling replaces the existing pendingReview (allowed reschedule).
 */
export async function scheduleReview(
  decisionId: string,
  reviewType: PendingReview['reviewType']
): Promise<{ ok: true; entry: DecisionMemoryEntry } | { ok: false; reason: 'not_found' | 'already_logged' | 'review_conflict' }> {
  return withMemoryWrite(async history => {
    const entry = history.find(e => e.id === decisionId);
    if (!entry) return { ok: false, reason: 'not_found' };
    // Cannot schedule a review after outcome is already recorded.
    if (entry.outcome) return { ok: false, reason: 'already_logged' };
    if (
      entry.pendingReview &&
      !isPendingReviewExpired(entry.pendingReview) &&
      entry.pendingReview.reviewType !== reviewType
    ) {
      return { ok: false, reason: 'review_conflict' };
    }

    const daysOut = reviewType === '30day' ? 30 : reviewType === '60day' ? 60 : 90;
    const now = new Date().toISOString();
    entry.pendingReview = {
      reviewType,
      scheduledFor: new Date(Date.now() + daysOut * 86_400_000).toISOString(),
      createdAt: entry.pendingReview?.reviewType === reviewType ? entry.pendingReview.createdAt : now,
    };
    entry.reviewCheckpoints = normalizeReviewCheckpoints(
      entry.reviewCheckpoints,
      entry.createdAt || entry.timestamp,
      entry.outcomeStatus || 'unknown'
    ).map(checkpoint => (
      checkpoint.horizon === daysOut
        ? { ...checkpoint, scheduledFor: entry.pendingReview!.scheduledFor, status: 'unknown' }
        : checkpoint
    ));

    await writeHistory(history);
    return { ok: true, entry };
  });
}

/**
 * Get decisions whose scheduled review is due (past scheduledFor) and not yet expired.
 * Reviews are surfaced for up to 90 days after their scheduled date, then silently
 * dropped from the queue (the record remains, the user can still log from history).
 */
export async function getDueReviews(): Promise<DecisionMemoryEntry[]> {
  const history = await getDecisionHistory();
  const now = Date.now();
  return history.filter(
    e => {
      if (!e.pendingReview || e.outcome || isPendingReviewExpired(e.pendingReview, now)) {
        return false;
      }
      return new Date(e.pendingReview.scheduledFor).getTime() <= now;
    }
  );
}

/**
 * Get all decisions with a pending review (due or not yet due, no outcome yet).
 */
export async function getPendingReviews(): Promise<DecisionMemoryEntry[]> {
  const history = await getDecisionHistory();
  const now = Date.now();
  return history.filter(e => e.pendingReview && !e.outcome && !isPendingReviewExpired(e.pendingReview, now));
}

/**
 * Get full decision history
 */
export async function getDecisionHistory(): Promise<DecisionMemoryEntry[]> {
  return readHistory();
}

/**
 * Search decisions by multiple criteria
 */
export async function searchDecisions(filters: {
  domain?: string;
  tags?: string[];
  dateRange?: { start: string; end: string };
  hasOutcome?: boolean;
  minScore?: number;
}): Promise<DecisionMemoryEntry[]> {
  let history = await getDecisionHistory();

  if (filters.domain) {
    history = history.filter(e => e.context?.domain === filters.domain);
  }

  if (filters.tags && filters.tags.length > 0) {
    history = history.filter(e => 
      filters.tags!.some(tag => e.tags.includes(tag))
    );
  }

  if (filters.dateRange) {
    const start = new Date(filters.dateRange.start).getTime();
    const end = new Date(filters.dateRange.end).getTime();
    history = history.filter(e => {
      const time = new Date(e.timestamp).getTime();
      return time >= start && time <= end;
    });
  }

  if (filters.hasOutcome !== undefined) {
    history = history.filter(e => 
      filters.hasOutcome ? !!e.outcome : !e.outcome
    );
  }

  if (filters.minScore !== undefined) {
    history = history.filter(e => e.blueprint.score >= filters.minScore!);
  }

  return history;
}

/**
 * Find similar decisions based on semantic similarity
 * (Simplified: uses tag overlap; could be enhanced with embeddings)
 */
export async function findSimilarDecisions(
  problem: string,
  context?: DecisionContext,
  limit: number = 5
): Promise<DecisionMemoryEntry[]> {
  const history = await getDecisionHistory();
  const newTags = extractTags(problem, context);

  const scored = history.map(entry => {
    const overlap = newTags.filter(tag => entry.tags.includes(tag)).length;
    const similarity = newTags.length > 0 
      ? (overlap / newTags.length) * 100 
      : 0;
    return { entry, similarity };
  });

  return scored
    .filter(s => s.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(s => ({ ...s.entry, similarity: s.similarity }));
}

/**
 * Build the full memory graph from process-local decisions
 */
export async function getMemoryGraph(): Promise<MemoryGraph> {
  const history = await getDecisionHistory();
  return buildMemoryGraph(history);
}

/**
 * Get intelligence context for a new incoming problem
 * Used to inject historical signal into agent prompts before simulation
 */
export async function getMemoryIntelligence(
  problem: string,
  context?: DecisionContext
): Promise<MemoryIntelligence> {
  const history = await getDecisionHistory();
  return getMemoryIntelligenceFromHistory(problem, history, context);
}

/**
 * Get pattern insights from decision history
 */
export async function getDecisionPatterns() {
  const history = await getDecisionHistory();

  // Accuracy analysis: predictions vs outcomes
  const withOutcomes = history.filter(e => !!e.outcome);
  const avgAccuracy = withOutcomes.length > 0
    ? withOutcomes.reduce((sum, e) => sum + (e.outcome?.scoreAccuracy || 0), 0) / 
      withOutcomes.length
    : 0;

  // Domain distribution
  const byDomain: Record<string, number> = {};
  history.forEach(e => {
    const domain = e.context?.domain || 'unspecified';
    byDomain[domain] = (byDomain[domain] || 0) + 1;
  });

  // Success rate (rough estimate based on score)
  const avgScore = history.length > 0
    ? history.reduce((sum, e) => sum + e.blueprint.score, 0) / history.length
    : 0;

  return {
    totalDecisions: history.length,
    withOutcomes: withOutcomes.length,
    averageAccuracy: Math.round(avgAccuracy),
    averageConfidence: Math.round(avgScore),
    domainDistribution: byDomain,
    topTags: getTopTags(history),
  };
}

/**
 * Extract tags from problem and context for classification
 */
function extractTags(problem: string, context?: DecisionContext): string[] {
  const tags: Set<string> = new Set();

  // Add domain tag
  if (context?.domain) {
    tags.add(context.domain);
  }

  // Add domain inference from keywords
  const lowerProblem = problem.toLowerCase();
  const domainKeywords: Record<string, string[]> = {
    'business': ['business', 'company', 'startup', 'product', 'market', 'revenue'],
    'career': ['career', 'job', 'role', 'promotion', 'switch', 'hire'],
    'financial': ['invest', 'capital', 'fund', 'loan', 'budget', 'cost'],
    'strategic': ['strategy', 'pivot', 'expand', 'merge', 'acquire'],
  };

  Object.entries(domainKeywords).forEach(([domain, keywords]) => {
    if (keywords.some(kw => lowerProblem.includes(kw))) {
      tags.add(domain);
    }
  });

  // Add stakeholder tags
  if (context?.stakeholders) {
    context.stakeholders.forEach(s => tags.add(`stakeholder:${s}`));
  }

  // Add time horizon tag
  if (context?.timeHorizon) {
    tags.add(`horizon:${context.timeHorizon}`);
  }

  return Array.from(tags);
}

/**
 * Get most frequently used tags
 */
function getTopTags(history: DecisionMemoryEntry[]): Record<string, number> {
  const tagCounts: Record<string, number> = {};
  history.forEach(e => {
    e.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((acc, [tag, count]) => ({ ...acc, [tag]: count }), {});
}
