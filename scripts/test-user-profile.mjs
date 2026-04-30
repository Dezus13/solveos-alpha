/**
 * Tests for the user decision profile: update logic, bias detection, and context builder.
 * Pure logic only — no DOM, no localStorage (mocked via closures).
 */

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function assertEquals(label, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ─── Inline pure functions (mirrors lib/userProfile.ts logic) ─────────────────

const STEP = 0.05;

function clamp(v) {
  return Math.min(1, Math.max(0, v));
}

function clampScore(v) {
  return Math.min(100, Math.max(0, Math.round(v)));
}

function computeDecisionScoreDelta(followedForcedAction, outcome) {
  if (followedForcedAction && outcome === 'worked') return 10;
  if (followedForcedAction && outcome === 'failed') return 5;
  if (!followedForcedAction && outcome === 'failed') return -10;
  if (!followedForcedAction && outcome === 'unclear') return -5;
  return 0;
}

function isRiskyDecision(decision) {
  return (decision.confidence ?? 75) < 55;
}

function isExecutionHeavy(decision) {
  return (decision.confidence ?? 50) >= 65;
}

function detectBiases(decisions) {
  const resolved = decisions.filter((d) => d.status !== 'pending');
  const biases = new Set();

  const failedRisky = resolved.filter((d) => d.status === 'failed' && isRiskyDecision(d));
  if (failedRisky.length >= 2) biases.add('overestimated upside');

  const failedExecution = resolved.filter((d) => d.status === 'failed' && isExecutionHeavy(d));
  if (failedExecution.length >= 2) biases.add('execution risk');

  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const earlyFails = resolved.filter((d) => {
    if (d.status !== 'failed') return false;
    const age = now - new Date(d.timestamp).getTime();
    return age < thirtyDays;
  });
  if (earlyFails.length >= 2) biases.add('early commit');

  return Array.from(biases);
}

function computeUpdate(profile, decision, newStatus) {
  let { riskTolerance, executionScore } = profile;

  if (isRiskyDecision(decision)) {
    riskTolerance = newStatus === 'worked'
      ? clamp(riskTolerance + STEP)
      : clamp(riskTolerance - STEP);
  }

  executionScore = newStatus === 'worked'
    ? clamp(executionScore + STEP)
    : clamp(executionScore - STEP);

  const delta = computeDecisionScoreDelta(decision.followedForcedAction === true, newStatus);
  return {
    riskTolerance,
    executionScore,
    userDecisionScore: clampScore((profile.userDecisionScore ?? 50) + delta),
    decisionScoreTrend: delta < 0 ? 'down' : 'up',
  };
}

function buildProfileContext(profile) {
  if (profile.totalDecisions === 0) return '';
  const rt = Math.round(profile.riskTolerance * 100);
  const es = Math.round(profile.executionScore * 100);
  const biasNote = profile.biasPatterns.length > 0
    ? ` Detected bias patterns: ${profile.biasPatterns.join(', ')}.`
    : '';
  return `User decision profile (${profile.totalDecisions} tracked): riskTolerance ${rt}%, executionScore ${es}%, userDecisionScore ${profile.userDecisionScore}/100 (${profile.userDecisionScore >= 50 ? 'You follow through' : 'You ignore your own rules'}).${biasNote} Adjust recommendation weight on risk, execution confidence, and decision discipline accordingly.`;
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeDecision(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    question: 'Test decision',
    verdict: 'Test verdict',
    confidence: 70,
    keyRisks: [],
    timestamp: new Date().toISOString(),
    status: 'pending',
    ...overrides,
  };
}

function baseProfile() {
  return { riskTolerance: 0.5, executionScore: 0.5, biasPatterns: [], totalDecisions: 0, userDecisionScore: 50, decisionScoreTrend: 'up' };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\nclamp()');
assert('clamp(1.2) === 1', clamp(1.2) === 1);
assert('clamp(-0.1) === 0', clamp(-0.1) === 0);
assert('clamp(0.5) === 0.5', clamp(0.5) === 0.5);

console.log('\nisRiskyDecision()');
assert('confidence=40 is risky', isRiskyDecision({ confidence: 40 }));
assert('confidence=60 is not risky', !isRiskyDecision({ confidence: 60 }));
assert('confidence undefined defaults to 75 (not risky)', !isRiskyDecision({}));

console.log('\ncomputeUpdate() — non-risky decision');
{
  const p = baseProfile();
  const d = makeDecision({ confidence: 70, followedForcedAction: true }); // not risky
  const r = computeUpdate(p, d, 'worked');
  assertEquals('executionScore increases on worked', r.executionScore, 0.55);
  assertEquals('riskTolerance unchanged (not risky)', r.riskTolerance, 0.5);
  assertEquals('decision score increases when forced action followed and worked', r.userDecisionScore, 60);
}
{
  const p = baseProfile();
  const d = makeDecision({ confidence: 70 });
  const r = computeUpdate(p, d, 'failed');
  assertEquals('executionScore decreases on failed', r.executionScore, 0.45);
  assertEquals('riskTolerance unchanged when not risky and failed', r.riskTolerance, 0.5);
  assertEquals('decision score drops when forced action ignored and failed', r.userDecisionScore, 40);
  assertEquals('decision score trend goes down', r.decisionScoreTrend, 'down');
}

console.log('\ncomputeUpdate() — risky decision (confidence=40)');
{
  const p = baseProfile();
  const d = makeDecision({ confidence: 40 });
  const r = computeUpdate(p, d, 'worked');
  assertEquals('riskTolerance increases on risky worked', r.riskTolerance, 0.55);
  assertEquals('executionScore also increases on worked', r.executionScore, 0.55);
}
{
  const p = baseProfile();
  const d = makeDecision({ confidence: 40 });
  const r = computeUpdate(p, d, 'failed');
  assertEquals('riskTolerance decreases on risky failed', r.riskTolerance, 0.45);
  assertEquals('executionScore decreases on failed', r.executionScore, 0.45);
}

console.log('\ncomputeUpdate() — clamping at boundaries');
{
  const p = { ...baseProfile(), riskTolerance: 0.02, executionScore: 0.02 };
  const d = makeDecision({ confidence: 40 }); // risky
  const r = computeUpdate(p, d, 'failed');
  assert('riskTolerance clamped at 0', r.riskTolerance >= 0);
  assert('executionScore clamped at 0', r.executionScore >= 0);
}
{
  const p = { ...baseProfile(), riskTolerance: 0.98, executionScore: 0.98 };
  const d = makeDecision({ confidence: 40 });
  const r = computeUpdate(p, d, 'worked');
  assert('riskTolerance clamped at 1', r.riskTolerance <= 1);
  assert('executionScore clamped at 1', r.executionScore <= 1);
}

console.log('\ndetectBiases()');
{
  const decisions = [
    makeDecision({ confidence: 40, status: 'failed' }),
    makeDecision({ confidence: 45, status: 'failed' }),
  ];
  const biases = detectBiases(decisions);
  assert('2 failed risky decisions → overestimated upside', biases.includes('overestimated upside'));
}
{
  const decisions = [
    makeDecision({ confidence: 40, status: 'failed' }), // only one risky fail
  ];
  const biases = detectBiases(decisions);
  assert('1 failed risky decision → no bias yet', !biases.includes('overestimated upside'));
}
{
  const decisions = [
    makeDecision({ confidence: 70, status: 'failed' }),
    makeDecision({ confidence: 80, status: 'failed' }),
  ];
  const biases = detectBiases(decisions);
  assert('2 failed execution-heavy → execution risk', biases.includes('execution risk'));
}
{
  const now = new Date().toISOString();
  const decisions = [
    makeDecision({ status: 'failed', timestamp: now }),
    makeDecision({ status: 'failed', timestamp: now }),
  ];
  const biases = detectBiases(decisions);
  assert('2 recent failed decisions → early commit', biases.includes('early commit'));
}
{
  const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
  const decisions = [
    makeDecision({ status: 'failed', timestamp: old }),
    makeDecision({ status: 'failed', timestamp: old }),
  ];
  const biases = detectBiases(decisions);
  assert('old failures do not trigger early commit', !biases.includes('early commit'));
}
{
  const decisions = [
    makeDecision({ status: 'pending' }),
    makeDecision({ confidence: 40, status: 'pending' }),
  ];
  const biases = detectBiases(decisions);
  assertEquals('pending decisions produce no biases', biases.length, 0);
}

console.log('\nbuildProfileContext()');
{
  const p = { ...baseProfile(), totalDecisions: 0 };
  assertEquals('returns empty string when totalDecisions=0', buildProfileContext(p), '');
}
{
  const p = { riskTolerance: 0.7, executionScore: 0.6, biasPatterns: [], totalDecisions: 5, userDecisionScore: 75, decisionScoreTrend: 'up', updatedAt: '' };
  const ctx = buildProfileContext(p);
  assert('includes riskTolerance', ctx.includes('70%'));
  assert('includes executionScore', ctx.includes('60%'));
  assert('includes userDecisionScore', ctx.includes('75/100'));
  assert('includes totalDecisions', ctx.includes('5 tracked'));
  assert('no bias note when empty', !ctx.includes('Detected bias patterns'));
}
{
  const p = { riskTolerance: 0.5, executionScore: 0.5, biasPatterns: ['execution risk'], totalDecisions: 3, userDecisionScore: 35, decisionScoreTrend: 'down', updatedAt: '' };
  const ctx = buildProfileContext(p);
  assert('includes bias patterns when present', ctx.includes('execution risk'));
  assert('includes low score message', ctx.includes('You ignore your own rules'));
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
