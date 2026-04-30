import type { DecisionBlueprint, UserProfileData } from './types';

// Thresholds mirrored in test-profile-engine.mjs — keep in sync
export const RISK_LOW = 0.4;
export const RISK_HIGH = 0.7;
export const EXEC_LOW = 0.4;
export const EXEC_HIGH = 0.7;
export const BIAS_UPSIDE_MULT = 0.88;   // multiply confidence when "overestimated upside" detected
export const BIAS_EXEC_PENALTY = 5;     // subtract from confidence when "execution risk" detected
export const RISK_LOW_CONF_CAP = 72;    // hard cap on confidence for low-risk-tolerance users
export const DECISION_SCORE_LOW = 40;
export const DECISION_SCORE_HIGH = 70;
export const DECISION_SCORE_LOW_CONF_CAP = 60;

export function scoreMessageFor(score: number): string {
  return score >= 50 ? 'You follow through' : 'You ignore your own rules';
}

function getVerdictClass(rec: string): string {
  if (/^Full Commit/i.test(rec)) return 'Full Commit';
  if (/^Reversible Experiment/i.test(rec)) return 'Reversible Experiment';
  if (/^Delay/i.test(rec)) return 'Delay';
  if (/^Kill The Idea/i.test(rec)) return 'Kill The Idea';
  if (/^Review:/i.test(rec)) return 'Review';
  return '';
}

/**
 * Generates a mandatory directive block injected into the model prompt.
 * Tells the model HOW to frame its response before it generates anything.
 * post-processing enforces the same rules deterministically afterwards.
 */
export function buildProfileDirective(data: UserProfileData): string {
  if (data.totalDecisions === 0) return '';

  const { riskTolerance, executionScore, biasPatterns } = data;
  const decisionScore = typeof data.userDecisionScore === 'number' ? data.userDecisionScore : 50;
  const lines: string[] = [];

  if (decisionScore < DECISION_SCORE_LOW) {
    lines.push(
      `userDecisionScore=${Math.round(decisionScore)}/100 (LOW): Strict process mode. ` +
      `Never use "Full Commit". Cap confidence score at ${DECISION_SCORE_LOW_CONF_CAP}. ` +
      `Require one forced action and one clear validation gate before any scale-up.`,
    );
  } else if (decisionScore > DECISION_SCORE_HIGH) {
    lines.push(
      `userDecisionScore=${Math.round(decisionScore)}/100 (HIGH): User usually follows required guidance. ` +
      `More aggressive recommendations are allowed when expected value and reversibility support it.`,
    );
  }

  // Risk tolerance
  if (riskTolerance < RISK_LOW) {
    lines.push(
      `riskTolerance=${Math.round(riskTolerance * 100)}% (LOW): Use "Reversible Experiment" or "Delay" verdict only — never "Full Commit". ` +
      `Require explicit staged validation gates. Cap confidence score at ${RISK_LOW_CONF_CAP}. ` +
      `Prefer small reversible moves over aggressive positions.`,
    );
  } else if (riskTolerance > RISK_HIGH) {
    lines.push(
      `riskTolerance=${Math.round(riskTolerance * 100)}% (HIGH): Higher-asymmetry positions are acceptable. ` +
      `Still require one named, measurable validation signal in the next move before scaling.`,
    );
  }

  // Execution score
  if (executionScore < EXEC_LOW) {
    lines.push(
      `executionScore=${Math.round(executionScore * 100)}% (LOW): Give exactly ONE immediate next step. ` +
      `No compound multi-phase strategies. Keep scope minimal and the first action unambiguously simple.`,
    );
  } else if (executionScore > EXEC_HIGH) {
    lines.push(
      `executionScore=${Math.round(executionScore * 100)}% (HIGH): Complex and compound strategies are appropriate for this user.`,
    );
  }

  // Bias patterns
  if (biasPatterns.includes('overestimated upside')) {
    lines.push(
      `BIAS "overestimated upside": Reduce confidence score by ~12%. ` +
      `Open the recommendation with the downside scenario, not the upside. ` +
      `Do not use bullish framing as the lead.`,
    );
  }
  if (biasPatterns.includes('execution risk')) {
    lines.push(
      `BIAS "execution risk": Reduce confidence by ${BIAS_EXEC_PENALTY} points. ` +
      `Name the specific execution bottleneck as the primary risk in the first operator step. ` +
      `Operational constraints must appear before strategic upside.`,
    );
  }
  if (biasPatterns.includes('early commit')) {
    lines.push(
      `BIAS "early commit": Every recommended action must include an explicit stop/review gate. ` +
      `Never recommend immediate full commitment. Stage: test → review → scale.`,
    );
  }

  if (lines.length === 0) return '';

  return (
    `PROFILE-BASED MANDATORY ADJUSTMENTS (${data.totalDecisions} tracked decisions — apply to verdict, confidence, and next move):\n` +
    lines.map((l) => `- ${l}`).join('\n')
  );
}

interface AppliedFlags {
  confidenceReduced: boolean;
  verdictDowngraded: boolean;
  validationAdded: boolean;
  downsideNoted: boolean;
  scopeReduced: boolean;
  capacityAdded: boolean;
  stagingAdded: boolean;
  stricterDecisionScore: boolean;
  aggressiveDecisionScore: boolean;
}

function buildAdjustmentNote(data: UserProfileData, applied: AppliedFlags): string {
  if (!Object.values(applied).some(Boolean)) return '';
  const rt = Math.round(data.riskTolerance * 100);
  const es = Math.round(data.executionScore * 100);
  const reasons: string[] = [];

  if ((applied.verdictDowngraded || applied.confidenceReduced) && data.riskTolerance < RISK_LOW) {
    reasons.push(`your risk tolerance is low (${rt}%)`);
  } else if ((applied.validationAdded || applied.confidenceReduced) && data.riskTolerance > RISK_HIGH) {
    reasons.push(`your risk tolerance is high (${rt}%)`);
  }
  if (applied.scopeReduced && data.executionScore < EXEC_LOW) {
    reasons.push(`your execution score is low (${es}%)`);
  }
  if ((applied.confidenceReduced || applied.downsideNoted) && data.biasPatterns.includes('overestimated upside')) {
    reasons.push('past decisions show overestimated upside');
  }
  if ((applied.confidenceReduced || applied.capacityAdded) && data.biasPatterns.includes('execution risk')) {
    reasons.push('past decisions show execution risk');
  }
  if ((applied.verdictDowngraded || applied.stagingAdded) && data.biasPatterns.includes('early commit')) {
    reasons.push('past decisions show early commitment');
  }
  if (applied.stricterDecisionScore && typeof data.userDecisionScore === 'number') {
    reasons.push(`your decision score is low (${Math.round(data.userDecisionScore)}/100)`);
  } else if (applied.aggressiveDecisionScore && typeof data.userDecisionScore === 'number') {
    reasons.push(`your decision score is strong (${Math.round(data.userDecisionScore)}/100)`);
  }

  if (reasons.length === 0) return '';

  const effects: string[] = [];
  if (applied.verdictDowngraded) effects.push('recommendation shifted to reversible experiment');
  if (applied.validationAdded) effects.push('validation signal required before scaling');
  if (applied.confidenceReduced) effects.push('confidence adjusted');
  if (applied.scopeReduced) effects.push('next move scope reduced');
  if (applied.stagingAdded) effects.push('staged framing applied');
  if (applied.capacityAdded) effects.push('operational check added');
  if (applied.downsideNoted) effects.push('downside weighted higher');
  if (applied.stricterDecisionScore) effects.push('stricter process applied');
  if (applied.aggressiveDecisionScore) effects.push('more aggressive recommendation allowed');

  const reasonStr = reasons.slice(0, 2).join(' and ');
  const topEffects = effects.slice(0, 2);
  const effectStr = topEffects
    .map((e, i) => (i === 0 ? e.charAt(0).toUpperCase() + e.slice(1) : e))
    .join(', ');
  return `Adjusted because ${reasonStr}.${effectStr ? ` ${effectStr}.` : ''}`;
}

/**
 * Deterministic post-processing applied to the blueprint AFTER LLM generation.
 * Guarantees profile adjustments actually appear in output regardless of whether
 * the model followed the directive.
 *
 * Affects exactly three fields as required: verdict, confidence %, next move.
 */
export function applyProfileAdjustments(
  blueprint: DecisionBlueprint,
  data: UserProfileData,
): DecisionBlueprint {
  if (data.totalDecisions === 0) return blueprint;

  // Shallow copy — nested objects are copied when modified below
  const b: DecisionBlueprint = { ...blueprint };
  const { riskTolerance, executionScore, biasPatterns } = data;
  const userDecisionScore = typeof data.userDecisionScore === 'number' ? data.userDecisionScore : 50;
  const isReview = getVerdictClass(b.recommendation ?? '') === 'Review';

  const flags: AppliedFlags = {
    confidenceReduced: false,
    verdictDowngraded: false,
    validationAdded: false,
    downsideNoted: false,
    scopeReduced: false,
    capacityAdded: false,
    stagingAdded: false,
    stricterDecisionScore: false,
    aggressiveDecisionScore: false,
  };

  // ─── 1. Confidence % ────────────────────────────────────────────────────────
  // Order: apply multiplicative bias first, then subtractive bias, then hard cap.
  let score = b.score;

  if (biasPatterns.includes('overestimated upside')) {
    score = Math.round(score * BIAS_UPSIDE_MULT);
  }
  if (biasPatterns.includes('execution risk')) {
    score = score - BIAS_EXEC_PENALTY;
  }
  if (riskTolerance < RISK_LOW) {
    score = Math.min(score, RISK_LOW_CONF_CAP);
  }
  if (userDecisionScore < DECISION_SCORE_LOW) {
    score = Math.min(score, DECISION_SCORE_LOW_CONF_CAP);
    flags.stricterDecisionScore = true;
  } else if (userDecisionScore > DECISION_SCORE_HIGH) {
    flags.aggressiveDecisionScore = true;
  }

  score = Math.max(0, Math.min(100, score));

  if (score !== b.score) {
    flags.confidenceReduced = true;
    b.score = score;
    b.confidenceScore = score;
    if (b.confidenceDrivers) {
      b.confidenceDrivers = { ...b.confidenceDrivers, finalConfidence: score };
    }
    if (b.riskMap) {
      b.riskMap = { ...b.riskMap, opportunity: score };
    }
  }

  // ─── 2. Verdict ─────────────────────────────────────────────────────────────
  // Review mode blueprints are never verdict-modified.
  if (!isReview) {
    const vc = getVerdictClass(b.recommendation ?? '');
    const isFC = vc === 'Full Commit';

    if (isFC) {
      const body = b.recommendation.replace(/^Full Commit:\s*/i, '').trim();

      if (userDecisionScore < DECISION_SCORE_LOW) {
        flags.verdictDowngraded = true;
        flags.stricterDecisionScore = true;
        b.recommendation =
          `Reversible Experiment: ${body} ` +
          `[Decision score override: ${Math.round(userDecisionScore)}/100 — full commitment locked until follow-through improves.]`;
      } else if (riskTolerance < RISK_LOW) {
        // Strongest signal: user's risk tolerance directly disqualifies Full Commit
        flags.verdictDowngraded = true;
        b.recommendation =
          `Reversible Experiment: ${body} ` +
          `[Profile override: ${Math.round(riskTolerance * 100)}% risk tolerance — ` +
          `staged validation required before full commitment.]`;
      } else if (biasPatterns.includes('early commit')) {
        // Early commit pattern: force staged test regardless of risk tolerance
        flags.verdictDowngraded = true;
        b.recommendation =
          `Reversible Experiment: ${body} ` +
          `[Profile override: early commit pattern detected — run a staged test before scaling.]`;
      } else if (riskTolerance > RISK_HIGH) {
        // High risk tolerance: keep Full Commit but require a named validation signal
        if (!b.recommendation.includes('Validate:')) {
          flags.validationAdded = true;
          b.recommendation =
            `${b.recommendation} ` +
            `Validate: name one measurable signal confirming the core assumption before scaling.`;
        }
      }
    }

    // Overestimated upside: append downside-first note to any non-Review verdict
    if (biasPatterns.includes('overestimated upside') && !b.recommendation.includes('[Profile bias:')) {
      flags.downsideNoted = true;
      b.recommendation =
        `${b.recommendation} ` +
        `[Profile bias: overestimated upside — downside scenarios are more likely than this confidence implies.]`;
    }
  }

  // ─── 3. Next move ────────────────────────────────────────────────────────────
  // Low execution score: reduce to single action
  if (executionScore < EXEC_LOW) {
    if (Array.isArray(b.operatorNextSteps) && b.operatorNextSteps.length > 1) {
      flags.scopeReduced = true;
      b.operatorNextSteps = [b.operatorNextSteps[0]];
    }
    if (b.actionPlan) {
      const firstSentence = b.actionPlan.today.split(/(?<=[.!?])\s+/)[0].trim();
      b.actionPlan = {
        ...b.actionPlan,
        today: `${firstSentence} (Scope reduced to single action — execution score ${Math.round(executionScore * 100)}%.)`,
      };
    }
  }

  // Execution risk bias: flag operational constraint on the first operator step
  if (biasPatterns.includes('execution risk') && Array.isArray(b.operatorNextSteps) && b.operatorNextSteps.length > 0) {
    const [first, ...rest] = b.operatorNextSteps;
    if (!first.includes('operational capacity')) {
      flags.capacityAdded = true;
      b.operatorNextSteps = [
        `${first} — confirm operational capacity before proceeding.`,
        ...rest,
      ];
    }
  }

  // Early commit bias: prefix today's action with staged framing
  if (biasPatterns.includes('early commit') && b.actionPlan) {
    const today = b.actionPlan.today;
    if (!today.startsWith('Stage first:') && !today.startsWith('Test first:')) {
      flags.stagingAdded = true;
      b.actionPlan = { ...b.actionPlan, today: `Stage first: ${today}` };
    }
  }

  const note = buildAdjustmentNote(data, flags);
  if (note) b.profileAdjustment = note;
  b.decisionScore = Math.round(userDecisionScore);
  b.decisionScoreTrend = data.decisionScoreTrend === 'down' ? 'down' : 'up';
  b.scoreMessage = scoreMessageFor(userDecisionScore);

  return b;
}
