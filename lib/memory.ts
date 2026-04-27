import fs from 'fs/promises';
import path from 'path';
import { DecisionMemoryEntry, DecisionOutcome, DecisionContext, MemoryGraph, MemoryIntelligence } from './types';
import { buildMemoryGraph, getMemoryIntelligenceFromHistory } from './memory-graph';

const DATA_DIR = path.join(process.cwd(), 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'decisions.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Save a decision to persistent memory
 */
export async function saveDecision(
  entry: Omit<DecisionMemoryEntry, 'id' | 'timestamp' | 'tags' | 'similarity'>
) {
  await ensureDataDir();
  
  let history: DecisionMemoryEntry[] = [];
  try {
    const data = await fs.readFile(MEMORY_FILE, 'utf-8');
    history = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }

  // Extract tags from problem and context for categorization
  const tags = extractTags(entry.problem, entry.context);

  const newEntry: DecisionMemoryEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    tags,
  };

  history.unshift(newEntry); // Newest first
  
  await fs.writeFile(MEMORY_FILE, JSON.stringify(history, null, 2));
  return newEntry;
}

/**
 * Record outcome for a past decision (learning mechanism)
 */
export async function recordOutcome(
  decisionId: string,
  outcome: Omit<DecisionOutcome, 'decisionId' | 'timestamp'>
) {
  await ensureDataDir();
  
  let history: DecisionMemoryEntry[] = [];
  try {
    const data = await fs.readFile(MEMORY_FILE, 'utf-8');
    history = JSON.parse(data);
  } catch {
    return null;
  }

  const entry = history.find(e => e.id === decisionId);
  if (!entry) {
    return null;
  }

  entry.outcome = {
    ...outcome,
    decisionId,
    timestamp: new Date().toISOString(),
  };

  await fs.writeFile(MEMORY_FILE, JSON.stringify(history, null, 2));
  return entry;
}

/**
 * Get full decision history
 */
export async function getDecisionHistory(): Promise<DecisionMemoryEntry[]> {
  try {
    const data = await fs.readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
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
 * Build the full memory graph from persisted decisions
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
