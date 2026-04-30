import type { SavedDecision } from './savedDecisions';

const PROFILE_KEY = 'solveos_user_profile';
const STEP = 0.05;

export interface UserDecisionProfile {
  riskTolerance: number;  // 0–1
  executionScore: number; // 0–1
  biasPatterns: string[];
  totalDecisions: number;
  userDecisionScore: number; // 0–100
  decisionScoreTrend: 'up' | 'down';
  updatedAt: string;
}

const DEFAULT_PROFILE: UserDecisionProfile = {
  riskTolerance: 0.5,
  executionScore: 0.5,
  biasPatterns: [],
  totalDecisions: 0,
  userDecisionScore: 50,
  decisionScoreTrend: 'up',
  updatedAt: new Date().toISOString(),
};

export function getProfile(): UserDecisionProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<UserDecisionProfile>;
    return {
      riskTolerance: clamp(typeof parsed.riskTolerance === 'number' ? parsed.riskTolerance : 0.5),
      executionScore: clamp(typeof parsed.executionScore === 'number' ? parsed.executionScore : 0.5),
      biasPatterns: Array.isArray(parsed.biasPatterns) ? parsed.biasPatterns : [],
      totalDecisions: typeof parsed.totalDecisions === 'number' ? parsed.totalDecisions : 0,
      userDecisionScore: clampScore(typeof parsed.userDecisionScore === 'number' ? parsed.userDecisionScore : 50),
      decisionScoreTrend: parsed.decisionScoreTrend === 'down' ? 'down' : 'up',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfile(profile: UserDecisionProfile): void {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function clampScore(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)));
}

export type DecisionScoreOutcome = 'worked' | 'failed' | 'unclear';

export function scoreMessageFor(score: number): string {
  return score >= 50 ? 'You follow through' : 'You ignore your own rules';
}

export function computeDecisionScoreDelta(
  followedForcedAction: boolean,
  outcome: DecisionScoreOutcome,
): number {
  if (followedForcedAction && outcome === 'worked') return 10;
  if (followedForcedAction && outcome === 'failed') return 5;
  if (!followedForcedAction && outcome === 'failed') return -10;
  if (!followedForcedAction && outcome === 'unclear') return -5;
  return 0;
}

export function updateDecisionScoreOnOutcome(
  followedForcedAction: boolean,
  outcome: DecisionScoreOutcome,
): UserDecisionProfile {
  const current = getProfile();
  const delta = computeDecisionScoreDelta(followedForcedAction, outcome);
  const updated: UserDecisionProfile = {
    ...current,
    totalDecisions: current.totalDecisions + 1,
    userDecisionScore: clampScore(current.userDecisionScore + delta),
    decisionScoreTrend: delta < 0 ? 'down' : 'up',
    updatedAt: new Date().toISOString(),
  };

  saveProfile(updated);
  return updated;
}

export function updateDecisionScoreOnActionCompletion(): UserDecisionProfile {
  const current = getProfile();
  const updated: UserDecisionProfile = {
    ...current,
    userDecisionScore: clampScore(current.userDecisionScore + 5),
    decisionScoreTrend: 'up',
    updatedAt: new Date().toISOString(),
  };

  saveProfile(updated);
  return updated;
}

export function updateDecisionScoreOnActionSkip(): UserDecisionProfile {
  const current = getProfile();
  const updated: UserDecisionProfile = {
    ...current,
    userDecisionScore: clampScore(current.userDecisionScore - 10),
    decisionScoreTrend: 'down',
    updatedAt: new Date().toISOString(),
  };

  saveProfile(updated);
  return updated;
}

// A decision is "risky" if its confidence is below 55 (engine thought it was uncertain)
function isRiskyDecision(decision: SavedDecision): boolean {
  return (decision.confidence ?? 75) < 55;
}

// A decision is "execution-heavy" if confidence was high but it still failed
function isExecutionHeavy(decision: SavedDecision): boolean {
  return (decision.confidence ?? 50) >= 65;
}

export function detectBiases(decisions: SavedDecision[]): string[] {
  const resolved = decisions.filter((d) => d.status !== 'pending');
  const biases = new Set<string>();

  const failedRisky = resolved.filter((d) => d.status === 'failed' && isRiskyDecision(d));
  if (failedRisky.length >= 2) biases.add('overestimated upside');

  const failedExecution = resolved.filter((d) => d.status === 'failed' && isExecutionHeavy(d));
  if (failedExecution.length >= 2) biases.add('execution risk');

  // Early commit: failed decisions that were resolved within 30 days of being saved
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const earlyFails = resolved.filter((d) => {
    if (d.status !== 'failed') return false;
    // We don't store the outcome date, so use timestamp as proxy (decision was saved, then quickly marked failed)
    const age = Date.now() - new Date(d.timestamp).getTime();
    return age < thirtyDays;
  });
  if (earlyFails.length >= 2) biases.add('early commit');

  return Array.from(biases);
}

export function updateProfileOnOutcome(
  decisions: SavedDecision[],
  changedDecision: SavedDecision,
  newStatus: 'worked' | 'failed',
): UserDecisionProfile {
  const current = getProfile();

  let { riskTolerance, executionScore } = current;

  if (isRiskyDecision(changedDecision)) {
    riskTolerance = newStatus === 'worked'
      ? clamp(riskTolerance + STEP)
      : clamp(riskTolerance - STEP);
  }

  executionScore = newStatus === 'worked'
    ? clamp(executionScore + STEP)
    : clamp(executionScore - STEP);

  const biasPatterns = detectBiases(decisions);
  const scoreOutcome: DecisionScoreOutcome = newStatus === 'worked' ? 'worked' : 'failed';
  const delta = computeDecisionScoreDelta(changedDecision.followedForcedAction === true, scoreOutcome);

  const updated: UserDecisionProfile = {
    riskTolerance,
    executionScore,
    biasPatterns,
    totalDecisions: current.totalDecisions + 1,
    userDecisionScore: clampScore(current.userDecisionScore + delta),
    decisionScoreTrend: delta < 0 ? 'down' : 'up',
    updatedAt: new Date().toISOString(),
  };

  saveProfile(updated);
  return updated;
}

export function buildProfileContext(profile: UserDecisionProfile): string {
  if (profile.totalDecisions === 0) return '';
  const rt = Math.round(profile.riskTolerance * 100);
  const es = Math.round(profile.executionScore * 100);
  const biasNote = profile.biasPatterns.length > 0
    ? ` Detected bias patterns: ${profile.biasPatterns.join(', ')}.`
    : '';
  return `User decision profile (${profile.totalDecisions} tracked): riskTolerance ${rt}%, executionScore ${es}%, userDecisionScore ${profile.userDecisionScore}/100 (${scoreMessageFor(profile.userDecisionScore)}).${biasNote} Adjust recommendation weight on risk, execution confidence, and decision discipline accordingly.`;
}
