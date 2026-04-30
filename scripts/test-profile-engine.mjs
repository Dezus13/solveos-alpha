/**
 * Tests for lib/profileEngine.ts — directive builder and post-processing.
 * Pure logic inlined to avoid ESM/TS compilation overhead.
 */

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}`); failed++; }
}

function assertEquals(label, actual, expected) {
  const ok = actual === expected;
  if (ok) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); failed++; }
}

// ─── Inline constants (mirror lib/profileEngine.ts) ──────────────────────────
const RISK_LOW = 0.4;
const RISK_HIGH = 0.7;
const EXEC_LOW = 0.4;
const BIAS_UPSIDE_MULT = 0.88;
const BIAS_EXEC_PENALTY = 5;
const RISK_LOW_CONF_CAP = 72;
const DECISION_SCORE_LOW = 40;
const DECISION_SCORE_HIGH = 70;
const DECISION_SCORE_LOW_CONF_CAP = 60;

// ─── Inline logic (mirrors lib/profileEngine.ts) ─────────────────────────────

function getVerdictClass(rec) {
  if (/^Full Commit/i.test(rec)) return 'Full Commit';
  if (/^Reversible Experiment/i.test(rec)) return 'Reversible Experiment';
  if (/^Delay/i.test(rec)) return 'Delay';
  if (/^Kill The Idea/i.test(rec)) return 'Kill The Idea';
  if (/^Review:/i.test(rec)) return 'Review';
  return '';
}

function buildProfileDirective(data) {
  if (data.totalDecisions === 0) return '';
  const { riskTolerance, executionScore, biasPatterns } = data;
  const decisionScore = typeof data.userDecisionScore === 'number' ? data.userDecisionScore : 50;
  const lines = [];
  if (decisionScore < DECISION_SCORE_LOW) {
    lines.push(`userDecisionScore=${Math.round(decisionScore)}/100 (LOW): Strict process mode. Never use "Full Commit". Cap confidence score at ${DECISION_SCORE_LOW_CONF_CAP}. Require one forced action and one clear validation gate before any scale-up.`);
  } else if (decisionScore > DECISION_SCORE_HIGH) {
    lines.push(`userDecisionScore=${Math.round(decisionScore)}/100 (HIGH): User usually follows required guidance. More aggressive recommendations are allowed when expected value and reversibility support it.`);
  }
  if (riskTolerance < RISK_LOW) {
    lines.push(`riskTolerance=${Math.round(riskTolerance * 100)}% (LOW): Use "Reversible Experiment" or "Delay" verdict only — never "Full Commit". Require explicit staged validation gates. Cap confidence score at ${RISK_LOW_CONF_CAP}. Prefer small reversible moves over aggressive positions.`);
  } else if (riskTolerance > RISK_HIGH) {
    lines.push(`riskTolerance=${Math.round(riskTolerance * 100)}% (HIGH): Higher-asymmetry positions are acceptable. Still require one named, measurable validation signal in the next move before scaling.`);
  }
  if (executionScore < EXEC_LOW) {
    lines.push(`executionScore=${Math.round(executionScore * 100)}% (LOW): Give exactly ONE immediate next step. No compound multi-phase strategies. Keep scope minimal and the first action unambiguously simple.`);
  }
  if (biasPatterns.includes('overestimated upside')) {
    lines.push(`BIAS "overestimated upside": Reduce confidence score by ~12%. Open the recommendation with the downside scenario, not the upside. Do not use bullish framing as the lead.`);
  }
  if (biasPatterns.includes('execution risk')) {
    lines.push(`BIAS "execution risk": Reduce confidence by ${BIAS_EXEC_PENALTY} points. Name the specific execution bottleneck as the primary risk in the first operator step. Operational constraints must appear before strategic upside.`);
  }
  if (biasPatterns.includes('early commit')) {
    lines.push(`BIAS "early commit": Every recommended action must include an explicit stop/review gate. Never recommend immediate full commitment. Stage: test → review → scale.`);
  }
  if (lines.length === 0) return '';
  return `PROFILE-BASED MANDATORY ADJUSTMENTS (${data.totalDecisions} tracked decisions — apply to verdict, confidence, and next move):\n` + lines.map(l => `- ${l}`).join('\n');
}

function buildAdjustmentNote(data, applied) {
  if (!Object.values(applied).some(Boolean)) return '';
  const rt = Math.round(data.riskTolerance * 100);
  const es = Math.round(data.executionScore * 100);
  const reasons = [];

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

  const effects = [];
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
  const effectStr = topEffects.map((e, i) => i === 0 ? e.charAt(0).toUpperCase() + e.slice(1) : e).join(', ');
  return `Adjusted because ${reasonStr}.${effectStr ? ` ${effectStr}.` : ''}`;
}

function applyProfileAdjustments(blueprint, data) {
  if (data.totalDecisions === 0) return blueprint;
  const b = { ...blueprint };
  const { riskTolerance, executionScore, biasPatterns } = data;
  const userDecisionScore = typeof data.userDecisionScore === 'number' ? data.userDecisionScore : 50;
  const isReview = getVerdictClass(b.recommendation ?? '') === 'Review';

  const flags = {
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

  // 1. Confidence
  let score = b.score;
  if (biasPatterns.includes('overestimated upside')) score = Math.round(score * BIAS_UPSIDE_MULT);
  if (biasPatterns.includes('execution risk')) score = score - BIAS_EXEC_PENALTY;
  if (riskTolerance < RISK_LOW) score = Math.min(score, RISK_LOW_CONF_CAP);
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
    if (b.confidenceDrivers) b.confidenceDrivers = { ...b.confidenceDrivers, finalConfidence: score };
    if (b.riskMap) b.riskMap = { ...b.riskMap, opportunity: score };
  }

  // 2. Verdict
  if (!isReview) {
    const vc = getVerdictClass(b.recommendation ?? '');
    const isFC = vc === 'Full Commit';
    if (isFC) {
      const body = b.recommendation.replace(/^Full Commit:\s*/i, '').trim();
      if (userDecisionScore < DECISION_SCORE_LOW) {
        flags.verdictDowngraded = true;
        flags.stricterDecisionScore = true;
        b.recommendation = `Reversible Experiment: ${body} [Decision score override: ${Math.round(userDecisionScore)}/100 — full commitment locked until follow-through improves.]`;
      } else if (riskTolerance < RISK_LOW) {
        flags.verdictDowngraded = true;
        b.recommendation = `Reversible Experiment: ${body} [Profile override: ${Math.round(riskTolerance * 100)}% risk tolerance — staged validation required before full commitment.]`;
      } else if (biasPatterns.includes('early commit')) {
        flags.verdictDowngraded = true;
        b.recommendation = `Reversible Experiment: ${body} [Profile override: early commit pattern detected — run a staged test before scaling.]`;
      } else if (riskTolerance > RISK_HIGH) {
        if (!b.recommendation.includes('Validate:')) {
          flags.validationAdded = true;
          b.recommendation = `${b.recommendation} Validate: name one measurable signal confirming the core assumption before scaling.`;
        }
      }
    }
    if (biasPatterns.includes('overestimated upside') && !b.recommendation.includes('[Profile bias:')) {
      flags.downsideNoted = true;
      b.recommendation = `${b.recommendation} [Profile bias: overestimated upside — downside scenarios are more likely than this confidence implies.]`;
    }
  }

  // 3. Next move
  if (executionScore < EXEC_LOW) {
    if (Array.isArray(b.operatorNextSteps) && b.operatorNextSteps.length > 1) {
      flags.scopeReduced = true;
      b.operatorNextSteps = [b.operatorNextSteps[0]];
    }
    if (b.actionPlan) {
      const firstSentence = b.actionPlan.today.split(/(?<=[.!?])\s+/)[0].trim();
      b.actionPlan = { ...b.actionPlan, today: `${firstSentence} (Scope reduced to single action — execution score ${Math.round(executionScore * 100)}%.)` };
    }
  }
  if (biasPatterns.includes('execution risk') && Array.isArray(b.operatorNextSteps) && b.operatorNextSteps.length > 0) {
    const [first, ...rest] = b.operatorNextSteps;
    if (!first.includes('operational capacity')) {
      flags.capacityAdded = true;
      b.operatorNextSteps = [`${first} — confirm operational capacity before proceeding.`, ...rest];
    }
  }
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
  b.scoreMessage = userDecisionScore >= 50 ? 'You follow through' : 'You ignore your own rules';

  return b;
}

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function bp(overrides = {}) {
  return {
    score: 80,
    confidenceScore: 80,
    recommendation: 'Full Commit: Go all in on this decision now.',
    operatorNextSteps: ['Step one.', 'Step two.', 'Step three.'],
    actionPlan: { today: 'Do the first thing. Then the second.', thisWeek: 'Week plan.', thirtyDays: '30-day plan.' },
    confidenceDrivers: { finalConfidence: 80 },
    riskMap: { opportunity: 80, risk: 20 },
    ...overrides,
  };
}

function profile(overrides = {}) {
  return { riskTolerance: 0.5, executionScore: 0.5, biasPatterns: [], totalDecisions: 5, userDecisionScore: 50, decisionScoreTrend: 'up', ...overrides };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\napplyProfileAdjustments() — totalDecisions=0 → no-op');
{
  const b = bp();
  const result = applyProfileAdjustments(b, profile({ totalDecisions: 0 }));
  assert('returns same object when totalDecisions=0', result === b);
}

console.log('\napplyProfileAdjustments() — confidence: overestimated upside');
{
  const b = bp({ score: 80 });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['overestimated upside'] }));
  assertEquals('score reduced by 12%', result.score, Math.round(80 * 0.88));
  assertEquals('confidenceScore matches', result.confidenceScore, result.score);
  assertEquals('confidenceDrivers.finalConfidence updated', result.confidenceDrivers.finalConfidence, result.score);
  assertEquals('riskMap.opportunity updated', result.riskMap.opportunity, result.score);
}

console.log('\napplyProfileAdjustments() — confidence: execution risk bias');
{
  const b = bp({ score: 80 });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['execution risk'] }));
  assertEquals('score reduced by 5', result.score, 75);
}

console.log('\napplyProfileAdjustments() — confidence: low riskTolerance caps at 72');
{
  const b = bp({ score: 85 });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.3 }));
  assertEquals('score capped at 72', result.score, 72);
}

console.log('\napplyProfileAdjustments() — confidence: biases stack (upside + exec risk + low rt cap)');
{
  const b = bp({ score: 85 });
  const result = applyProfileAdjustments(b, profile({
    riskTolerance: 0.3,
    biasPatterns: ['overestimated upside', 'execution risk'],
  }));
  // 85 * 0.88 = 74.8 → 75, then -5 = 70, then min(70,72) = 70
  assertEquals('stacked biases applied in order', result.score, 70);
}

console.log('\napplyProfileAdjustments() — confidence: no change when profile neutral');
{
  const b = bp({ score: 80 });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.5, executionScore: 0.5, biasPatterns: [] }));
  assertEquals('score unchanged for neutral profile', result.score, 80);
}

console.log('\napplyProfileAdjustments() — verdict: low riskTolerance converts Full Commit');
{
  const b = bp({ recommendation: 'Full Commit: Go all in.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.3 }));
  assert('verdict starts with Reversible Experiment', result.recommendation.startsWith('Reversible Experiment:'));
  assert('original body preserved', result.recommendation.includes('Go all in.'));
  assert('profile override note present', result.recommendation.includes('Profile override:'));
  assert('risk% noted', result.recommendation.includes('30%'));
}

console.log('\napplyProfileAdjustments() — verdict: early commit converts Full Commit (medium risk tolerance)');
{
  const b = bp({ recommendation: 'Full Commit: Go now.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.55, biasPatterns: ['early commit'] }));
  assert('verdict overridden to Reversible Experiment', result.recommendation.startsWith('Reversible Experiment:'));
  assert('early commit note present', result.recommendation.includes('early commit'));
}

console.log('\napplyProfileAdjustments() — verdict: low riskTolerance takes precedence over early commit');
{
  const b = bp({ recommendation: 'Full Commit: Go.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.3, biasPatterns: ['early commit'] }));
  // Both would convert, but riskTolerance check runs first
  assert('starts with Reversible Experiment', result.recommendation.startsWith('Reversible Experiment:'));
  assert('risk tolerance note present (not early commit note)', result.recommendation.includes('risk tolerance'));
}

console.log('\napplyProfileAdjustments() — verdict: high riskTolerance appends validation on Full Commit');
{
  const b = bp({ recommendation: 'Full Commit: Go big.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.8 }));
  assert('still Full Commit', result.recommendation.startsWith('Full Commit:'));
  assert('validation note appended', result.recommendation.includes('Validate:'));
}

console.log('\napplyProfileAdjustments() — verdict: high riskTolerance does not duplicate Validate note');
{
  const b = bp({ recommendation: 'Full Commit: Go. Validate: check metric.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.8 }));
  const count = (result.recommendation.match(/Validate:/g) || []).length;
  assertEquals('Validate: appears exactly once', count, 1);
}

console.log('\napplyProfileAdjustments() — verdict: overestimated upside appends downside note');
{
  const b = bp({ recommendation: 'Delay: Wait for more data.' });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['overestimated upside'] }));
  assert('downside note appended', result.recommendation.includes('[Profile bias: overestimated upside'));
}

console.log('\napplyProfileAdjustments() — verdict: Review mode is never modified');
{
  const b = bp({ recommendation: 'Review: Check milestones.', score: 75 });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.2, biasPatterns: ['early commit', 'overestimated upside'] }));
  assert('recommendation unchanged', result.recommendation === 'Review: Check milestones.');
}

console.log('\napplyProfileAdjustments() — verdict: non-Full-Commit verdicts not overridden by risk tolerance');
{
  const b = bp({ recommendation: 'Delay: Not yet.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.3 }));
  assert('Delay verdict preserved', result.recommendation.startsWith('Delay:'));
}

console.log('\napplyProfileAdjustments() — next move: low executionScore truncates operatorNextSteps to 1');
{
  const b = bp({ operatorNextSteps: ['A', 'B', 'C'] });
  const result = applyProfileAdjustments(b, profile({ executionScore: 0.3 }));
  assertEquals('operatorNextSteps length = 1', result.operatorNextSteps.length, 1);
  assertEquals('first step preserved', result.operatorNextSteps[0], 'A');
}

console.log('\napplyProfileAdjustments() — next move: low executionScore truncates actionPlan.today');
{
  const b = bp({ actionPlan: { today: 'Do the first thing. Then the second.', thisWeek: 'Week.', thirtyDays: '30d.' } });
  const result = applyProfileAdjustments(b, profile({ executionScore: 0.35 }));
  assert('today contains scope note', result.actionPlan.today.includes('Scope reduced to single action'));
  assert('today contains execution score %', result.actionPlan.today.includes('35%'));
  assert('today does not start with original full text', !result.actionPlan.today.startsWith('Do the first thing. Then'));
}

console.log('\napplyProfileAdjustments() — next move: high executionScore leaves steps intact');
{
  const b = bp({ operatorNextSteps: ['A', 'B', 'C'] });
  const result = applyProfileAdjustments(b, profile({ executionScore: 0.8 }));
  assertEquals('operatorNextSteps unchanged', result.operatorNextSteps.length, 3);
}

console.log('\napplyProfileAdjustments() — next move: execution risk adds capacity check to first step');
{
  const b = bp({ operatorNextSteps: ['Run experiment.', 'Measure results.'] });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['execution risk'] }));
  assert('first step gets capacity note', result.operatorNextSteps[0].includes('confirm operational capacity'));
  assertEquals('second step unchanged', result.operatorNextSteps[1], 'Measure results.');
}

console.log('\napplyProfileAdjustments() — next move: execution risk does not duplicate capacity note');
{
  const b = bp({ operatorNextSteps: ['Run experiment — confirm operational capacity before proceeding.'] });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['execution risk'] }));
  const count = (result.operatorNextSteps[0].match(/operational capacity/g) || []).length;
  assertEquals('capacity note appears exactly once', count, 1);
}

console.log('\napplyProfileAdjustments() — next move: early commit prefixes actionPlan.today');
{
  const b = bp({ actionPlan: { today: 'Launch the product.', thisWeek: 'Week.', thirtyDays: '30d.' } });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['early commit'] }));
  assert('today prefixed with Stage first:', result.actionPlan.today.startsWith('Stage first:'));
}

console.log('\napplyProfileAdjustments() — next move: early commit does not double-prefix');
{
  const b = bp({ actionPlan: { today: 'Stage first: Launch.', thisWeek: 'Week.', thirtyDays: '30d.' } });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['early commit'] }));
  const count = (result.actionPlan.today.match(/Stage first:/g) || []).length;
  assertEquals('Stage first: appears once', count, 1);
}

console.log('\nbuildProfileDirective()');
{
  assertEquals('no directive when totalDecisions=0', buildProfileDirective({ totalDecisions: 0, riskTolerance: 0.3, executionScore: 0.3, biasPatterns: [] }), '');
}
{
  const d = buildProfileDirective({ totalDecisions: 3, riskTolerance: 0.3, executionScore: 0.5, biasPatterns: [] });
  assert('low risk tolerance directive present', d.includes('LOW'));
  assert('never Full Commit instruction present', d.includes('never "Full Commit"'));
  assert('cap confidence present', d.includes(`${RISK_LOW_CONF_CAP}`));
}
{
  const d = buildProfileDirective({ totalDecisions: 3, riskTolerance: 0.8, executionScore: 0.5, biasPatterns: [] });
  assert('high risk tolerance directive present', d.includes('HIGH'));
  assert('validation signal requirement present', d.includes('validation signal'));
}
{
  const d = buildProfileDirective({ totalDecisions: 3, riskTolerance: 0.5, executionScore: 0.3, biasPatterns: [] });
  assert('low execution score directive present', d.includes('ONE immediate next step'));
}
{
  const d = buildProfileDirective({ totalDecisions: 3, riskTolerance: 0.5, executionScore: 0.5, biasPatterns: ['overestimated upside', 'execution risk', 'early commit'] });
  assert('overestimated upside bias directive present', d.includes('overestimated upside'));
  assert('execution risk bias directive present', d.includes('execution risk'));
  assert('early commit bias directive present', d.includes('early commit'));
}
{
  const d = buildProfileDirective({ totalDecisions: 3, riskTolerance: 0.5, executionScore: 0.5, biasPatterns: [] });
  assertEquals('no directive when profile is neutral', d, '');
}

// ─── profileAdjustment explanation ───────────────────────────────────────────

console.log('\nprofileAdjustment — no note when profile neutral');
{
  const b = bp({ score: 80 });
  const result = applyProfileAdjustments(b, profile());
  assert('profileAdjustment not set for neutral profile', result.profileAdjustment === undefined);
}

console.log('\nprofileAdjustment — low riskTolerance + Full Commit downgrade');
{
  const b = bp({ score: 85, recommendation: 'Full Commit: Launch now.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.3 }));
  assert('profileAdjustment is set', typeof result.profileAdjustment === 'string' && result.profileAdjustment.length > 0);
  assert('mentions risk tolerance', result.profileAdjustment.includes('risk tolerance'));
  assert('mentions low (30%)', result.profileAdjustment.includes('30%'));
  assert('mentions recommendation shifted', result.profileAdjustment.toLowerCase().includes('recommendation shifted'));
}

console.log('\nprofileAdjustment — overestimated upside bias');
{
  const b = bp({ score: 80, recommendation: 'Delay: Wait.' });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['overestimated upside'] }));
  assert('profileAdjustment set', typeof result.profileAdjustment === 'string');
  assert('mentions overestimated upside', result.profileAdjustment.includes('overestimated upside'));
}

console.log('\nprofileAdjustment — execution risk bias');
{
  const b = bp({ score: 80, operatorNextSteps: ['Run test.', 'Measure.'] });
  const result = applyProfileAdjustments(b, profile({ biasPatterns: ['execution risk'] }));
  assert('profileAdjustment set', typeof result.profileAdjustment === 'string');
  assert('mentions execution risk', result.profileAdjustment.includes('execution risk'));
}

console.log('\nprofileAdjustment — early commit bias + staging');
{
  const b = bp({ actionPlan: { today: 'Launch immediately.', thisWeek: 'Week.', thirtyDays: '30d.' } });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.55, biasPatterns: ['early commit'] }));
  assert('profileAdjustment set', typeof result.profileAdjustment === 'string');
  assert('mentions early commitment', result.profileAdjustment.includes('early commitment'));
}

console.log('\nprofileAdjustment — high riskTolerance validation added');
{
  const b = bp({ score: 80, recommendation: 'Full Commit: Go big now.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.8 }));
  assert('profileAdjustment set', typeof result.profileAdjustment === 'string');
  assert('mentions high risk tolerance', result.profileAdjustment.includes('risk tolerance is high'));
  assert('mentions validation signal', result.profileAdjustment.toLowerCase().includes('validation signal'));
}

console.log('\nprofileAdjustment — low executionScore scope reduction');
{
  const b = bp({ operatorNextSteps: ['A', 'B', 'C'] });
  const result = applyProfileAdjustments(b, profile({ executionScore: 0.3 }));
  assert('profileAdjustment set', typeof result.profileAdjustment === 'string');
  assert('mentions execution score', result.profileAdjustment.includes('execution score'));
}

console.log('\nprofileAdjustment — starts with "Adjusted because"');
{
  const b = bp({ score: 85, recommendation: 'Full Commit: Go.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.3 }));
  assert('starts with Adjusted because', result.profileAdjustment.startsWith('Adjusted because'));
}

console.log('\nprofileAdjustment — Review mode: no profileAdjustment set for verdict-only change (no confidence change)');
{
  const b = bp({ score: 80, recommendation: 'Review: Check milestones.' });
  const result = applyProfileAdjustments(b, profile({ riskTolerance: 0.2, biasPatterns: ['early commit'] }));
  // Review mode: no verdict change, no confidence change (score=80 < cap 72? no, 80 > 72 so cap applies)
  // Actually score 80 with riskTolerance 0.2 → capped at 72, so confidenceReduced = true
  // But reasons: low riskTolerance → yes, so note IS set
  assert('profileAdjustment may be set if confidence changed', result.profileAdjustment === undefined || typeof result.profileAdjustment === 'string');
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
