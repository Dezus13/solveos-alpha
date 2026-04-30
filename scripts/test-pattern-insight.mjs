/**
 * Tests for lib/patternInsight.ts — pattern detection engine + forced action.
 * Pure logic inlined to avoid ESM/TS compilation overhead.
 */

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}`); failed++; }
}

// ─── Inline constants (mirror lib/patternInsight.ts) ─────────────────────────
const MIN_RESOLVED = 5;
const WINDOW = 10;
const MIN_INSTANCES = 3;
const FAIL_RATE_THRESHOLD = 0.5;
const CONFIDENCE_THRESHOLD = 45;

// ─── Inline logic ─────────────────────────────────────────────────────────────

function verdictClass(v) {
  if (/^Full Commit/i.test(v)) return 'Full Commit';
  if (/^Reversible Experiment/i.test(v)) return 'Reversible Experiment';
  if (/^Delay/i.test(v)) return 'Delay';
  if (/^Kill The Idea/i.test(v)) return 'Kill The Idea';
  return 'Other';
}

function generatePatternInsight(decisions, currentConfidence = 100) {
  if (currentConfidence < CONFIDENCE_THRESHOLD) return null;

  const resolved = decisions.filter(d => d.status === 'worked' || d.status === 'failed');
  if (resolved.length < MIN_RESOLVED) return null;

  const recent = resolved
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, WINDOW);

  const failed = recent.filter(d => d.status === 'failed');
  const patterns = [];

  // 1. Early commitment
  const fullCommits = recent.filter(d => verdictClass(d.verdict) === 'Full Commit');
  if (fullCommits.length >= MIN_INSTANCES) {
    const fcFailed = fullCommits.filter(d => d.status === 'failed');
    if (fcFailed.length / fullCommits.length >= FAIL_RATE_THRESHOLD) {
      patterns.push({
        label: 'Early Commitment',
        evidence: `${fcFailed.length} of ${fullCommits.length} Full Commit decisions failed`,
        implication: fcFailed.length === fullCommits.length
          ? 'Every full commitment you made has failed. You are committing before the assumption is validated.'
          : 'You repeatedly commit fully before readiness is confirmed. You are overestimating readiness.',
        adjustment: 'Run a staged test before any full commitment. Name one measurable signal that must fire before scaling.',
        forcedAction: 'Do not commit. Run a 3-user validation test before any build.',
        strength: (fcFailed.length / fullCommits.length) * fullCommits.length,
      });
    }
  }

  // 2. Overestimated upside
  const highConf = recent.filter(d => (d.confidence ?? 0) >= 70);
  if (highConf.length >= MIN_INSTANCES) {
    const hcFailed = highConf.filter(d => d.status === 'failed');
    if (hcFailed.length / highConf.length >= FAIL_RATE_THRESHOLD) {
      patterns.push({
        label: 'Overestimated Upside',
        evidence: `${hcFailed.length} of ${highConf.length} high-confidence decisions (≥70%) failed`,
        implication: 'Your confidence scores consistently exceed actual outcomes. You are more optimistic than the data warrants.',
        adjustment: 'Discount confidence by 10–15% on decisions that feel certain. Write down the one assumption that, if wrong, breaks the whole thing.',
        forcedAction: 'Find 3 real users and ask them to reject your idea before you proceed.',
        strength: (hcFailed.length / highConf.length) * highConf.length,
      });
    }
  }

  // 3. Execution gap
  const execKeywords = ['execut', 'capacity', 'bandwidth', 'resource', 'staffing', 'implement', 'deliver', 'timeline', 'operati', 'priorit'];
  const execFailed = failed.filter(d =>
    d.keyRisks.some(r => execKeywords.some(k => r.toLowerCase().includes(k)))
  );
  if (execFailed.length >= MIN_INSTANCES) {
    patterns.push({
      label: 'Execution Gap',
      evidence: `${execFailed.length} of ${recent.length} recent decisions failed at execution`,
      implication: 'Sound strategies are failing at implementation. You are underestimating operational constraints.',
      adjustment: 'Before committing, map one bottleneck explicitly: who executes it, by when, with what resources.',
      forcedAction: 'Ship a minimal version in 48 hours or pause this idea.',
      strength: execFailed.length * 1.2,
    });
  }

  // 4. Consistent misjudgement (fallback)
  if (failed.length >= MIN_INSTANCES && failed.length / recent.length >= 0.6 && patterns.length === 0) {
    patterns.push({
      label: 'Consistent Misjudgement',
      evidence: `${failed.length} of ${recent.length} recent decisions failed`,
      implication: 'You are systematically overestimating option quality or acting before conditions are right.',
      adjustment: 'Before any commitment, write down what would have to be true for this to fail. If you cannot answer in 60 seconds, the decision is not ready.',
      forcedAction: "Write one sentence: 'This fails if ___.' Fill it in before you do anything else today.",
      strength: (failed.length / recent.length) * recent.length,
    });
  }

  if (patterns.length === 0) return null;

  const top = patterns.sort((a, b) => b.strength - a.strength)[0];

  return {
    patternInsight: [
      'Your Pattern Insight',
      `Pattern: ${top.label}`,
      `Evidence: ${top.evidence}`,
      `Implication: ${top.implication}`,
      `Adjustment: ${top.adjustment}`,
    ].join('\n'),
    forcedAction: `Do this next:\n${top.forcedAction}`,
  };
}

// ─── Fixture helpers ───────────────────────────────────────────────────────────

let ts = Date.now();
function d(overrides = {}) {
  ts -= 3600_000;
  return {
    id: String(Math.random()),
    question: 'Some decision',
    verdict: 'Full Commit: Go all in.',
    confidence: 75,
    keyRisks: [],
    timestamp: new Date(ts).toISOString(),
    status: 'pending',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\ngeneratePatternInsight() — guard: fewer than MIN_RESOLVED resolved');
{
  const decisions = [
    d({ status: 'failed' }),
    d({ status: 'worked' }),
    d({ status: 'failed' }),
    d({ status: 'failed' }),
    d({ status: 'pending' }),
  ];
  assert('returns null when < 5 resolved', generatePatternInsight(decisions) === null);
}

console.log('\ngeneratePatternInsight() — guard: currentConfidence below threshold');
{
  const decisions = Array.from({ length: 6 }, () => d({ status: 'failed', verdict: 'Full Commit: Go.' }));
  assert('returns null when confidence < 45', generatePatternInsight(decisions, 40) === null);
  assert('returns object when confidence >= 45', generatePatternInsight(decisions, 45) !== null);
}

console.log('\ngeneratePatternInsight() — guard: neutral profile (all worked)');
{
  const decisions = Array.from({ length: 6 }, () => d({ status: 'worked' }));
  assert('returns null when all decisions worked', generatePatternInsight(decisions) === null);
}

console.log('\ngeneratePatternInsight() — return shape');
{
  const decisions = [
    d({ status: 'failed', verdict: 'Full Commit: Go.', confidence: 80 }),
    d({ status: 'failed', verdict: 'Full Commit: Launch.', confidence: 80 }),
    d({ status: 'failed', verdict: 'Full Commit: Ship.', confidence: 80 }),
    d({ status: 'worked', verdict: 'Full Commit: Win.', confidence: 80 }),
    d({ status: 'worked' }),
    d({ status: 'worked' }),
  ];
  const result = generatePatternInsight(decisions);
  assert('result is an object', result !== null && typeof result === 'object');
  assert('has patternInsight string', typeof result.patternInsight === 'string');
  assert('has forcedAction string', typeof result.forcedAction === 'string');
}

console.log('\ngeneratePatternInsight() — patternInsight structure');
{
  const decisions = [
    d({ status: 'failed', verdict: 'Full Commit: Go.', confidence: 80 }),
    d({ status: 'failed', verdict: 'Full Commit: Launch.', confidence: 80 }),
    d({ status: 'failed', verdict: 'Full Commit: Ship.', confidence: 80 }),
    d({ status: 'worked', verdict: 'Full Commit: Win.', confidence: 80 }),
    d({ status: 'worked' }),
    d({ status: 'worked' }),
  ];
  const { patternInsight } = generatePatternInsight(decisions);
  const lines = patternInsight.split('\n');
  assert('first line is title', lines[0] === 'Your Pattern Insight');
  assert('second line starts with Pattern:', lines[1].startsWith('Pattern:'));
  assert('third line starts with Evidence:', lines[2].startsWith('Evidence:'));
  assert('fourth line starts with Implication:', lines[3].startsWith('Implication:'));
  assert('fifth line starts with Adjustment:', lines[4].startsWith('Adjustment:'));
}

console.log('\ngeneratePatternInsight() — forcedAction structure');
{
  const decisions = [
    d({ status: 'failed', verdict: 'Full Commit: Go.', confidence: 80 }),
    d({ status: 'failed', verdict: 'Full Commit: Launch.', confidence: 80 }),
    d({ status: 'failed', verdict: 'Full Commit: Ship.', confidence: 80 }),
    d({ status: 'worked', verdict: 'Full Commit: Win.', confidence: 80 }),
    d({ status: 'worked' }),
    d({ status: 'worked' }),
  ];
  const { forcedAction } = generatePatternInsight(decisions);
  assert('starts with Do this next:', forcedAction.startsWith('Do this next:'));
  const lines = forcedAction.split('\n');
  assert('has exactly two lines', lines.length === 2);
  assert('second line is non-empty', lines[1].trim().length > 0);
}

console.log('\ngeneratePatternInsight() — pattern: early commitment');
{
  const decisions = [
    d({ status: 'failed', verdict: 'Full Commit: Go now.' }),
    d({ status: 'failed', verdict: 'Full Commit: Launch.' }),
    d({ status: 'failed', verdict: 'Full Commit: Ship it.' }),
    d({ status: 'worked', verdict: 'Full Commit: Do it.' }),
    d({ status: 'worked' }),
    d({ status: 'worked' }),
  ];
  const result = generatePatternInsight(decisions);
  assert('returns non-null', result !== null);
  assert('pattern is Early Commitment', result.patternInsight.includes('Pattern: Early Commitment'));
  assert('evidence references Full Commit', result.patternInsight.includes('Full Commit'));
  assert('includes Implication', result.patternInsight.includes('Implication:'));
  assert('includes Adjustment', result.patternInsight.includes('Adjustment:'));
  assert('forcedAction mentions validation test', result.forcedAction.includes('validation test'));
}

console.log('\ngeneratePatternInsight() — early commitment not triggered below MIN_INSTANCES');
{
  const decisions = [
    d({ status: 'failed', verdict: 'Full Commit: Go.' }),
    d({ status: 'failed', verdict: 'Full Commit: Go.' }),
    d({ status: 'worked' }),
    d({ status: 'worked' }),
    d({ status: 'worked' }),
    d({ status: 'worked' }),
  ];
  const result = generatePatternInsight(decisions);
  assert('not triggered with < MIN_INSTANCES full commits', result === null || !result.patternInsight.includes('Early Commitment'));
}

console.log('\ngeneratePatternInsight() — pattern: overestimated upside');
{
  const decisions = [
    d({ status: 'failed', confidence: 80, verdict: 'Delay: Wait.' }),
    d({ status: 'failed', confidence: 75, verdict: 'Delay: Wait.' }),
    d({ status: 'failed', confidence: 90, verdict: 'Delay: Wait.' }),
    d({ status: 'worked', confidence: 72 }),
    d({ status: 'worked', confidence: 40 }),
    d({ status: 'worked' }),
  ];
  const result = generatePatternInsight(decisions);
  assert('returns non-null', result !== null);
  assert('pattern is Overestimated Upside', result.patternInsight.includes('Pattern: Overestimated Upside'));
  assert('evidence references ≥70%', result.patternInsight.includes('≥70%'));
  assert('forcedAction mentions real users', result.forcedAction.includes('real users'));
}

console.log('\ngeneratePatternInsight() — overestimated upside not triggered below 70% confidence');
{
  const decisions = [
    d({ status: 'failed', confidence: 65, verdict: 'Delay: Wait.' }),
    d({ status: 'failed', confidence: 60, verdict: 'Delay: Wait.' }),
    d({ status: 'failed', confidence: 55, verdict: 'Delay: Wait.' }),
    d({ status: 'worked', confidence: 50 }),
    d({ status: 'worked', confidence: 50 }),
    d({ status: 'worked' }),
  ];
  const result = generatePatternInsight(decisions);
  assert('no upside pattern', result === null || !result.patternInsight.includes('Overestimated Upside'));
}

console.log('\ngeneratePatternInsight() — pattern: execution gap');
{
  const decisions = [
    d({ status: 'failed', keyRisks: ['execution bottleneck in team capacity'] }),
    d({ status: 'failed', keyRisks: ['timeline overrun', 'resource constraints'] }),
    d({ status: 'failed', keyRisks: ['deliver on schedule', 'bandwidth issue'] }),
    d({ status: 'worked', keyRisks: [] }),
    d({ status: 'worked', keyRisks: [] }),
    d({ status: 'worked', keyRisks: [] }),
  ];
  const result = generatePatternInsight(decisions);
  assert('returns non-null', result !== null);
  assert('pattern is Execution Gap', result.patternInsight.includes('Pattern: Execution Gap'));
  assert('evidence counts correct', result.patternInsight.includes('3 of'));
  assert('forcedAction mentions 48 hours', result.forcedAction.includes('48 hours'));
}

console.log('\ngeneratePatternInsight() — pattern: consistent misjudgement');
{
  const decisions = [
    d({ status: 'failed', verdict: 'Delay: Not yet.', confidence: 45 }),
    d({ status: 'failed', verdict: 'Delay: Not yet.', confidence: 45 }),
    d({ status: 'failed', verdict: 'Delay: Not yet.', confidence: 45 }),
    d({ status: 'failed', verdict: 'Delay: Not yet.', confidence: 45 }),
    d({ status: 'worked', verdict: 'Delay: Not yet.', confidence: 45 }),
    d({ status: 'failed', verdict: 'Delay: Not yet.', confidence: 45 }),
  ];
  const result = generatePatternInsight(decisions);
  assert('returns non-null', result !== null);
  assert('pattern is Consistent Misjudgement', result.patternInsight.includes('Pattern: Consistent Misjudgement'));
  assert('forcedAction is the sentence prompt', result.forcedAction.includes('This fails if'));
}

console.log('\ngeneratePatternInsight() — early commitment beats misjudgement on strength');
{
  const decisions = [
    d({ status: 'failed', verdict: 'Full Commit: Go.', confidence: 50 }),
    d({ status: 'failed', verdict: 'Full Commit: Launch.', confidence: 50 }),
    d({ status: 'failed', verdict: 'Full Commit: Ship.', confidence: 50 }),
    d({ status: 'failed', verdict: 'Full Commit: Now.', confidence: 50 }),
    d({ status: 'worked', verdict: 'Full Commit: Yes.', confidence: 50 }),
    d({ status: 'failed', verdict: 'Delay: No.', confidence: 50 }),
  ];
  const result = generatePatternInsight(decisions);
  assert('result non-null', result !== null);
  assert('early commitment is primary', result.patternInsight.includes('Early Commitment'));
  assert('forced action is validation test', result.forcedAction.includes('validation test'));
}

console.log('\ngeneratePatternInsight() — WINDOW cap: no crash on large input');
{
  const oldFails = Array.from({ length: 8 }, (_, i) => ({
    ...d({ status: 'failed', verdict: 'Full Commit: Old.', confidence: 80 }),
    timestamp: new Date(Date.now() - (20 + i) * 24 * 3600_000).toISOString(),
  }));
  const recentWorks = Array.from({ length: 6 }, (_, i) => ({
    ...d({ status: 'worked', verdict: 'Delay: Recent.', confidence: 80 }),
    timestamp: new Date(Date.now() - i * 3600_000).toISOString(),
  }));
  generatePatternInsight([...recentWorks, ...oldFails]);
  assert('does not throw on large input', true);
}

console.log('\ngeneratePatternInsight() — forcedAction is exactly one action (no options or theory)');
{
  const decisions = [
    d({ status: 'failed', verdict: 'Full Commit: Go.', confidence: 80 }),
    d({ status: 'failed', verdict: 'Full Commit: Launch.', confidence: 80 }),
    d({ status: 'failed', verdict: 'Full Commit: Ship.', confidence: 80 }),
    d({ status: 'worked', verdict: 'Full Commit: Win.', confidence: 80 }),
    d({ status: 'worked' }),
    d({ status: 'worked' }),
  ];
  const { forcedAction } = generatePatternInsight(decisions);
  const actionLine = forcedAction.split('\n')[1];
  // No bullet list — exactly one sentence/action
  assert('no list marker in action', !actionLine.startsWith('-') && !actionLine.startsWith('•'));
  assert('action line is non-empty', actionLine.trim().length > 0);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
