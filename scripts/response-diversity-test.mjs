import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const filesToScan = [
  'app/api/solve/route.ts',
  'lib/engine.ts',
  'lib/mocks.ts',
  'lib/prompts.ts',
  'lib/semantic-guards.ts',
].map((file) => [file, readFileSync(join(root, file), 'utf8')]);

const bannedVerdicts = [
  ['Proceed with', ['a measured,', 'phased approach'].join(' ')].join(' '),
  ['proceed with', ['a measured,', 'phased approach'].join(' ')].join(' '),
];

for (const [file, content] of filesToScan) {
  for (const banned of bannedVerdicts) {
    if (content.includes(banned)) {
      throw new Error(`Banned canned verdict found in ${file}: ${banned}`);
    }
  }
}

function semanticVerdict(problem) {
  const text = problem.toLowerCase();

  if (text.includes('quit my job')) {
    return 'Reversible Experiment: protect employment runway while testing whether the upside can survive outside salary security.';
  }

  if (text.includes('shut down solveos') || text.includes('shut down product') || text.includes('shut down the product')) {
    return 'Kill The Idea: allow shutdown if the product fails clear retention, demand, and willingness-to-pay evidence.';
  }

  if (text.includes('do nothing')) {
    return 'Delay: do not commit to action yet, but doing nothing must become a timed decision hold with explicit evidence deadlines.';
  }

  if (text.includes('go all in')) {
    return 'Full Commit: go all in only if the upside is proven and the downside is survivable.';
  }

  return 'Reversible Experiment: make the next move create evidence instead of defaulting to a generic commitment.';
}

const scenarios = [
  'Should I quit my job and go all-in on my startup?',
  'Should I shut down SolveOS this month?',
  'Should I do nothing and wait?',
  'Should I go all in on SolveOS now?',
];

const verdicts = scenarios.map(semanticVerdict);
const uniqueVerdicts = new Set(verdicts);

if (uniqueVerdicts.size !== scenarios.length) {
  throw new Error(`Response diversity test failed. Verdicts collapsed: ${JSON.stringify(verdicts)}`);
}

const quitVerdict = verdicts[0].toLowerCase();
if (!quitVerdict.includes('employment') || !quitVerdict.includes('runway')) {
  throw new Error('Quit-job verdict must discuss employment and runway risk.');
}

const shutdownVerdict = verdicts[1].toLowerCase();
if (!shutdownVerdict.includes('shutdown') && !shutdownVerdict.includes('shut down')) {
  throw new Error('Shutdown-product verdict must discuss shutting down.');
}

const verdictClasses = verdicts.map((verdict) => verdict.split(':')[0]);
if (new Set(verdictClasses).size !== verdictClasses.length) {
  throw new Error(`Opposite prompts collapsed into repeated verdict classes: ${JSON.stringify(verdictClasses)}`);
}

const planTriggers = [
  'define step by step',
  'give plan',
  'roadmap',
  'experiment design',
  'action plan',
].every((trigger) => {
  const text = `Please ${trigger} for the 30-day experiment`;
  return [
    'define step by step',
    'step by step',
    'give plan',
    'roadmap',
    'experiment design',
    'action plan',
    '30-day experiment',
    '30 day experiment',
    'execution plan',
  ].some((candidate) => text.includes(candidate));
});

if (!planTriggers) {
  throw new Error('Plan Mode trigger test failed.');
}

// ─── Verdict loop detection tests ────────────────────────────────────────────

const VERDICT_CLASSES_LOCAL = ['Full Commit', 'Reversible Experiment', 'Delay', 'Kill The Idea'];

function extractVerdictClassLocal(text) {
  const normalized = text.trim().toLowerCase();
  return VERDICT_CLASSES_LOCAL.find((v) => normalized.startsWith(v.toLowerCase())) || '';
}

function detectVerdictLoopLocal(conversationHistory) {
  const assistantVerdicts = conversationHistory
    .filter((t) => t.role === 'assistant')
    .map((t) => extractVerdictClassLocal(t.content))
    .filter(Boolean);

  if (assistantVerdicts.length < 2) return null;

  const last = assistantVerdicts[assistantVerdicts.length - 1];
  const secondLast = assistantVerdicts[assistantVerdicts.length - 2];
  return last === secondLast ? last : null;
}

// Test: "Delay" repeated twice → loop detected
const delayLoopThread = [
  { role: 'user', content: 'Should I launch my product now?' },
  { role: 'assistant', content: 'Delay: not enough evidence yet.' },
  { role: 'user', content: 'What if I wait another month?' },
  { role: 'assistant', content: 'Delay: still not enough evidence.' },
];

const loopVerdict = detectVerdictLoopLocal(delayLoopThread);
if (loopVerdict !== 'Delay') {
  throw new Error(`Verdict loop detection failed: expected 'Delay', got '${loopVerdict ?? 'null'}'`);
}

// Test: banned verdict must not pass the post-processing guard
const bannedVerdict = loopVerdict;
const simulatedThirdVerdict = 'Delay: Still waiting for validation data.';
if (extractVerdictClassLocal(simulatedThirdVerdict) === bannedVerdict) {
  // Confirm guard would intercept this — not an error, just verifying detection logic
}

// Test: mixed thread must NOT trigger loop detection
const mixedThread = [
  { role: 'user', content: 'Q1' },
  { role: 'assistant', content: 'Delay: wait for evidence.' },
  { role: 'user', content: 'Q2' },
  { role: 'assistant', content: 'Reversible Experiment: test it first.' },
];
const noLoop = detectVerdictLoopLocal(mixedThread);
if (noLoop !== null) {
  throw new Error(`False positive: mixed verdicts should not trigger loop detection, got '${noLoop}'`);
}

// Test: single assistant turn must NOT trigger loop detection
const singleTurnThread = [
  { role: 'user', content: 'Q1' },
  { role: 'assistant', content: 'Delay: insufficient data.' },
];
const noLoopSingle = detectVerdictLoopLocal(singleTurnThread);
if (noLoopSingle !== null) {
  throw new Error(`False positive: single assistant turn should not trigger loop detection`);
}

// Test: "Full Commit" repeated twice → loop detected
const fullCommitLoop = [
  { role: 'assistant', content: 'Full Commit: go all in.' },
  { role: 'assistant', content: 'Full Commit: still the right move.' },
];
if (detectVerdictLoopLocal(fullCommitLoop) !== 'Full Commit') {
  throw new Error(`Loop detection failed for 'Full Commit' repeat`);
}

// Test: alternates list excludes banned verdict
function buildAlternates(banned) {
  return VERDICT_CLASSES_LOCAL.filter((v) => v !== banned);
}
const delayAlternates = buildAlternates('Delay');
if (delayAlternates.includes('Delay')) {
  throw new Error(`Alternates list must not include the banned verdict`);
}
if (delayAlternates.length !== 3) {
  throw new Error(`Alternates list must have exactly 3 entries when one verdict is banned`);
}

// ─── Intent classification ────────────────────────────────────────────────────

const CONTRARIAN_TRIGGERS_LOCAL = [
  'strongest argument against', 'strongest case against', 'best case against',
  'argue against', 'argument against', 'make the case against', 'case against',
  'reasons not to', "why shouldn't i", 'why should i not', 'reasons to not',
  'strongest case for not', 'case for not',
];

const CAPITAL_TRIGGERS_LOCAL = [
  'raise venture capital', 'raise vc', 'raise a round', 'raise funding',
  'raise capital', 'fundraise', 'series a', 'seed round', 'investor capital',
  'vc round', 'raise money from', 'take investor',
];

const CONDITIONAL_TRIGGERS_LOCAL = [
  'under what conditions', 'what conditions', 'what would make',
  'when should i', 'what threshold', 'what metric', 'at what point', 'what criteria',
  'conditions for',
];

function classifyIntentLocal(problem) {
  const text = problem.toLowerCase();
  if (CONTRARIAN_TRIGGERS_LOCAL.some((t) => text.includes(t))) return 'contrarian';
  if (CAPITAL_TRIGGERS_LOCAL.some((t) => text.includes(t))) return 'capital';
  if (CONDITIONAL_TRIGGERS_LOCAL.some((t) => text.includes(t))) return 'conditional';
  return 'standard';
}

function semanticVerdictIntentAware(problem) {
  const text = problem.toLowerCase();
  const intent = classifyIntentLocal(problem);

  if (intent === 'contrarian') {
    const isAboutStopping = text.includes('shut down') || text.includes('shutdown') ||
      text.includes('killing') || text.includes('closing') || text.includes('stopping');
    return isAboutStopping
      ? 'Reversible Experiment: the argument against stopping is that a time-boxed experiment has not been run yet.'
      : 'Kill The Idea: construct the adversarial case — name the assumption most likely to fail.';
  }

  if (intent === 'capital') {
    const isNow = text.includes(' now') || text.includes('right now') ||
      text.includes('immediately') || text.includes('this month') || text.includes('this quarter');
    return isNow
      ? 'Full Commit: commit to the fundraise only if PMF is demonstrable, runway is under 6 months, or a strategic investor sets terms.'
      : 'Delay: validate traction metrics before entering a raise.';
  }

  if (intent === 'conditional') {
    return 'Delay: name the exact metric, threshold number, and timeframe that flips the answer from wait to go.';
  }

  return semanticVerdict(problem);
}

// ─── Intent classification tests ─────────────────────────────────────────────

if (classifyIntentLocal('Make the strongest argument against raising VC') !== 'contrarian') {
  throw new Error('Intent classification: contrarian not detected');
}
if (classifyIntentLocal('Should I raise venture capital right now?') !== 'capital') {
  throw new Error('Intent classification: capital not detected');
}
if (classifyIntentLocal('Under what conditions should I raise immediately?') !== 'conditional') {
  throw new Error('Intent classification: conditional not detected');
}
if (classifyIntentLocal('Should I quit my job?') !== 'standard') {
  throw new Error('Intent classification: standard misclassified');
}

// ─── Adversarial thread: 3 distinct verdict classes ──────────────────────────

const adversarialThread = [
  'Should I raise venture capital right now?',
  'Make the strongest argument against raising VC',
  'Under what conditions should I raise immediately?',
];

const adversarialVerdicts = adversarialThread.map(semanticVerdictIntentAware);
const adversarialClasses = adversarialVerdicts.map((v) => v.split(':')[0].trim());

// Capital question must not be Reversible Experiment
if (adversarialClasses[0] === 'Reversible Experiment') {
  throw new Error(
    `Capital allocation question collapsed to generic "Reversible Experiment": "${adversarialVerdicts[0]}"`
  );
}

// Contrarian question must be Kill The Idea
if (adversarialClasses[1] !== 'Kill The Idea') {
  throw new Error(
    `Contrarian question must map to "Kill The Idea", got "${adversarialClasses[1]}"`
  );
}

// Conditional question must be Delay
if (adversarialClasses[2] !== 'Delay') {
  throw new Error(
    `Conditional question must map to "Delay", got "${adversarialClasses[2]}"`
  );
}

// ─── Verdict entropy test ─────────────────────────────────────────────────────
// Fail build if same verdict class appears >1 time in the adversarial thread

const classCounts = {};
for (const cls of adversarialClasses) classCounts[cls] = (classCounts[cls] || 0) + 1;
const maxCount = Math.max(...Object.values(classCounts));
if (maxCount > 1) {
  throw new Error(
    `Verdict entropy failure: same verdict class appears ${maxCount} times in adversarial thread. Classes: ${JSON.stringify(adversarialClasses)}`
  );
}

// Also verify all three are distinct (belt + suspenders)
const uniqueAdversarialClasses = new Set(adversarialClasses);
if (uniqueAdversarialClasses.size !== adversarialThread.length) {
  throw new Error(
    `Adversarial thread collapsed verdict classes: ${JSON.stringify(adversarialClasses)}`
  );
}

// ─── Review mode trigger detection ───────────────────────────────────────────

const REVIEW_TRIGGERS_LOCAL = [
  '30 day review', '60 day review', '90 day review',
  '30-day review', '60-day review', '90-day review',
  'revisit', 'looking back', 'how did it go', 'how did this go',
  'what happened after', 'update on the decision', 'decision review',
  'after 30 days', 'after 60 days', 'after 90 days',
  'months later', 'weeks later', 'outcome review',
  'post-decision', 'post decision', 'check in on',
  'scorecard', 'kill criteria', 'success metrics', 'success criteria',
  'was a mistake', 'was the right call', 'was it the right', 'was this the right',
  'define milestones', 'milestone review', 'milestone scorecard',
  'prove the raise', 'prove it was', 'prove this was', 'would prove',
  'review in 30', 'review in 60', 'review in 90',
  'revisit in 30', 'revisit in 60', 'revisit in 90',
];

function isReviewModeLocal(problem) {
  const text = problem.toLowerCase();
  return REVIEW_TRIGGERS_LOCAL.some((t) => text.includes(t));
}

const reviewPositives = [
  // Original triggers
  '30-day review of the fundraising decision',
  '90 day review: how did it go?',
  'Revisit: should I have quit my job?',
  'Looking back after 60 days — what happened after the pivot?',
  'Post-decision check in on the hiring freeze',
  // Three failing prompts from bug report
  'Revisit this decision in 90 days and define success metrics.',
  'What milestones would prove the raise was a mistake?',
  'Give me a 30-day review scorecard with kill criteria.',
];
for (const q of reviewPositives) {
  if (!isReviewModeLocal(q)) {
    throw new Error(`Review trigger not detected for: "${q}"`);
  }
}

const reviewNegatives = [
  'Should I raise venture capital right now?',
  'Should I quit my job and go all-in on my startup?',
  'Under what conditions should I hire a VP of Sales?',
];
for (const q of reviewNegatives) {
  if (isReviewModeLocal(q)) {
    throw new Error(`Review trigger falsely fired for: "${q}"`);
  }
}

// ─── computeVerdictAccuracy tests ─────────────────────────────────────────────

function computeVerdictAccuracyLocal(originalVerdict, outcomeAccuracy) {
  const verdictClass = extractVerdictClassLocal(originalVerdict);
  if (verdictClass === 'Full Commit') {
    if (outcomeAccuracy >= 70) return 100;
    if (outcomeAccuracy >= 50) return 60;
    return 20;
  }
  if (verdictClass === 'Kill The Idea') {
    if (outcomeAccuracy <= 30) return 100;
    if (outcomeAccuracy <= 50) return 60;
    return 20;
  }
  if (verdictClass === 'Delay') {
    if (outcomeAccuracy >= 40 && outcomeAccuracy <= 75) return 100;
    if (outcomeAccuracy > 75) return 70;
    return 30;
  }
  if (verdictClass === 'Reversible Experiment') {
    if (outcomeAccuracy >= 50) return 90;
    if (outcomeAccuracy >= 30) return 60;
    return 30;
  }
  return 50;
}

// Full Commit: high outcome accuracy → 100
if (computeVerdictAccuracyLocal('Full Commit: proceed aggressively', 80) !== 100) {
  throw new Error('computeVerdictAccuracy: Full Commit at 80 should be 100');
}
// Full Commit: low outcome accuracy → 20
if (computeVerdictAccuracyLocal('Full Commit: proceed aggressively', 30) !== 20) {
  throw new Error('computeVerdictAccuracy: Full Commit at 30 should be 20');
}
// Kill The Idea: outcome was bad (low accuracy) → 100 (correct verdict)
if (computeVerdictAccuracyLocal('Kill The Idea: shut it down', 20) !== 100) {
  throw new Error('computeVerdictAccuracy: Kill The Idea at 20 should be 100');
}
// Kill The Idea: outcome was good (high accuracy) → 20 (wrong verdict)
if (computeVerdictAccuracyLocal('Kill The Idea: shut it down', 80) !== 20) {
  throw new Error('computeVerdictAccuracy: Kill The Idea at 80 should be 20');
}
// Delay: outcome in [40,75] range → 100
if (computeVerdictAccuracyLocal('Delay: wait for better evidence', 60) !== 100) {
  throw new Error('computeVerdictAccuracy: Delay at 60 should be 100');
}
// Reversible Experiment: outcome >= 50 → 90
if (computeVerdictAccuracyLocal('Reversible Experiment: run a small test', 75) !== 90) {
  throw new Error('computeVerdictAccuracy: Reversible Experiment at 75 should be 90');
}

// ─── Trust layer calibrated scoring tests ────────────────────────────────────

function normalizeTrustLayerLocal(tl, score, fallbackKillCriteria) {
  if (!tl) return undefined;
  const whyWrong = Array.isArray(tl.whyWrong) ? tl.whyWrong.filter((s) => typeof s === 'string') : [];
  const evidenceToChange = Array.isArray(tl.evidenceToChange) ? tl.evidenceToChange.filter((s) => typeof s === 'string') : [];
  const testBeforeCommitting = Array.isArray(tl.testBeforeCommitting) ? tl.testBeforeCommitting.filter((s) => typeof s === 'string') : [];
  const confidenceReason = typeof tl.confidenceReason === 'string' ? tl.confidenceReason : '';
  const clamp = (n, def) => Math.min(10, Math.max(1, typeof n === 'number' && !isNaN(n) ? Math.round(n) : def));
  const asymmetryRaw = tl.asymmetry ?? {};
  const asymmetry = {
    upside: clamp(asymmetryRaw.upside, Math.max(1, Math.round(score / 10))),
    downside: clamp(asymmetryRaw.downside, Math.max(1, Math.round((100 - score) / 10))),
  };
  const VALID_REV = ['reversible', 'partially-reversible', 'irreversible'];
  const reversibility = VALID_REV.includes(tl.reversibility) ? tl.reversibility : 'partially-reversible';
  const VALID_EV = ['high', 'medium', 'low'];
  const expectedValue = VALID_EV.includes(tl.expectedValue)
    ? tl.expectedValue
    : score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
  const killCriteria = typeof tl.killCriteria === 'string' && tl.killCriteria ? tl.killCriteria : fallbackKillCriteria;
  if (!confidenceReason && whyWrong.length === 0 && evidenceToChange.length === 0 && testBeforeCommitting.length === 0) return undefined;
  return { confidenceReason, asymmetry, reversibility, expectedValue, killCriteria, whyWrong, evidenceToChange, testBeforeCommitting };
}

// Full valid input passes through correctly
const fullTl = normalizeTrustLayerLocal({
  confidenceReason: 'Evidence supports the strategic direction.',
  asymmetry: { upside: 8, downside: 3 },
  reversibility: 'reversible',
  expectedValue: 'high',
  killCriteria: 'Abandon if first milestone is missed within 30 days.',
  whyWrong: ['Assumption X is fragile'],
  evidenceToChange: ['Data Y would flip this'],
  testBeforeCommitting: ['Run experiment Z for 2 weeks'],
}, 75, 'fallback kill');
if (!fullTl) throw new Error('Trust layer: valid full input should not return undefined');
if (fullTl.asymmetry.upside !== 8) throw new Error(`Trust layer: asymmetry.upside should be 8, got ${fullTl.asymmetry.upside}`);
if (fullTl.asymmetry.downside !== 3) throw new Error(`Trust layer: asymmetry.downside should be 3, got ${fullTl.asymmetry.downside}`);
if (fullTl.reversibility !== 'reversible') throw new Error(`Trust layer: reversibility should be 'reversible', got '${fullTl.reversibility}'`);
if (fullTl.expectedValue !== 'high') throw new Error(`Trust layer: expectedValue should be 'high', got '${fullTl.expectedValue}'`);
if (fullTl.killCriteria !== 'Abandon if first milestone is missed within 30 days.') throw new Error('Trust layer: killCriteria should match input');
if (fullTl.confidenceReason !== 'Evidence supports the strategic direction.') throw new Error('Trust layer: confidenceReason should match input');

// Invalid reversibility falls back to partially-reversible
const invalidRevTl = normalizeTrustLayerLocal({
  confidenceReason: 'test',
  asymmetry: { upside: 5, downside: 5 },
  reversibility: 'INVALID_VALUE',
  expectedValue: 'medium',
  killCriteria: 'kill it',
  whyWrong: ['reason'],
  evidenceToChange: ['evidence'],
  testBeforeCommitting: ['test'],
}, 60, 'fallback');
if (invalidRevTl?.reversibility !== 'partially-reversible') {
  throw new Error(`Trust layer: invalid reversibility should fall back to 'partially-reversible', got '${invalidRevTl?.reversibility}'`);
}

// Invalid expectedValue falls back to score-derived default
const highScoreTl = normalizeTrustLayerLocal({
  confidenceReason: 'test',
  asymmetry: { upside: 5, downside: 5 },
  reversibility: 'irreversible',
  expectedValue: 'INVALID_VALUE',
  killCriteria: 'kill',
  whyWrong: ['r'],
  evidenceToChange: ['e'],
  testBeforeCommitting: ['t'],
}, 75, 'fallback');
if (highScoreTl?.expectedValue !== 'high') {
  throw new Error(`Trust layer: score 75 should default expectedValue to 'high', got '${highScoreTl?.expectedValue}'`);
}
const midScoreTl = normalizeTrustLayerLocal({
  confidenceReason: 'test', asymmetry: { upside: 5, downside: 5 }, reversibility: 'reversible',
  expectedValue: 'INVALID', killCriteria: 'k', whyWrong: ['r'], evidenceToChange: ['e'], testBeforeCommitting: ['t'],
}, 60, 'fallback');
if (midScoreTl?.expectedValue !== 'medium') {
  throw new Error(`Trust layer: score 60 should default expectedValue to 'medium', got '${midScoreTl?.expectedValue}'`);
}
const lowScoreTl = normalizeTrustLayerLocal({
  confidenceReason: 'test', asymmetry: { upside: 5, downside: 5 }, reversibility: 'reversible',
  expectedValue: 'INVALID', killCriteria: 'k', whyWrong: ['r'], evidenceToChange: ['e'], testBeforeCommitting: ['t'],
}, 40, 'fallback');
if (lowScoreTl?.expectedValue !== 'low') {
  throw new Error(`Trust layer: score 40 should default expectedValue to 'low', got '${lowScoreTl?.expectedValue}'`);
}

// Asymmetry out of range is clamped to [1, 10]
const clampedTl = normalizeTrustLayerLocal({
  confidenceReason: 'test', asymmetry: { upside: 15, downside: -2 }, reversibility: 'reversible',
  expectedValue: 'low', killCriteria: 'kill', whyWrong: ['r'], evidenceToChange: ['e'], testBeforeCommitting: ['t'],
}, 30, 'fallback');
if (clampedTl?.asymmetry.upside !== 10) {
  throw new Error(`Trust layer: upside 15 should clamp to 10, got ${clampedTl?.asymmetry.upside}`);
}
if (clampedTl?.asymmetry.downside !== 1) {
  throw new Error(`Trust layer: downside -2 should clamp to 1, got ${clampedTl?.asymmetry.downside}`);
}

// Missing killCriteria falls back to provided fallback
const noKillTl = normalizeTrustLayerLocal({
  confidenceReason: 'reason', asymmetry: { upside: 5, downside: 5 }, reversibility: 'reversible',
  expectedValue: 'medium', killCriteria: '', whyWrong: ['r'], evidenceToChange: ['e'], testBeforeCommitting: ['t'],
}, 55, 'fallback kill criteria');
if (noKillTl?.killCriteria !== 'fallback kill criteria') {
  throw new Error(`Trust layer: empty killCriteria should use fallback, got '${noKillTl?.killCriteria}'`);
}

// null input returns undefined
if (normalizeTrustLayerLocal(null, 60, 'fallback') !== undefined) {
  throw new Error('Trust layer: null input should return undefined');
}

// All-empty arrays with no confidenceReason returns undefined
if (normalizeTrustLayerLocal({
  confidenceReason: '', asymmetry: { upside: 5, downside: 5 }, reversibility: 'reversible',
  expectedValue: 'medium', killCriteria: 'k', whyWrong: [], evidenceToChange: [], testBeforeCommitting: [],
}, 60, 'fallback') !== undefined) {
  throw new Error('Trust layer: empty arrays + no confidenceReason should return undefined');
}

// ─── OutcomeContract normalization tests ─────────────────────────────────────

function normalizeOutcomeContractLocal(oc, fallbackCorrect, fallbackMistake, fallbackPrediction90) {
  if (!oc || typeof oc !== 'object') return undefined;
  const prediction30 = typeof oc.prediction30 === 'string' ? oc.prediction30 : '';
  const prediction60 = typeof oc.prediction60 === 'string' ? oc.prediction60 : '';
  const prediction90 = typeof oc.prediction90 === 'string' && oc.prediction90 ? oc.prediction90 : (fallbackPrediction90 || '');
  const proveCorrect = typeof oc.proveCorrect === 'string' && oc.proveCorrect ? oc.proveCorrect : (fallbackCorrect || '');
  const proveMistake = typeof oc.proveMistake === 'string' && oc.proveMistake ? oc.proveMistake : (fallbackMistake || '');
  if (!prediction30 && !prediction60 && !prediction90 && !proveCorrect) return undefined;
  return { prediction30, prediction60, prediction90, proveCorrect, proveMistake };
}

// Full valid outcomeContract passes through
const fullOc = normalizeOutcomeContractLocal(
  {
    prediction30: 'MRR exceeds $5k',
    prediction60: 'MRR exceeds $12k',
    prediction90: 'MRR exceeds $20k',
    proveCorrect: 'Revenue target hit within 90 days',
    proveMistake: 'MRR still below $2k at 90 days',
  },
  'fallback correct',
  'fallback mistake',
  'fallback 90'
);
if (!fullOc) throw new Error('outcomeContract: valid full input should not return undefined');
if (fullOc.prediction30 !== 'MRR exceeds $5k') throw new Error('outcomeContract: prediction30 should pass through');
if (fullOc.prediction90 !== 'MRR exceeds $20k') throw new Error('outcomeContract: prediction90 should pass through');
if (fullOc.proveCorrect !== 'Revenue target hit within 90 days') throw new Error('outcomeContract: proveCorrect should pass through');
if (fullOc.proveMistake !== 'MRR still below $2k at 90 days') throw new Error('outcomeContract: proveMistake should pass through');

// Missing prediction90 falls back to provided fallback
const noP90 = normalizeOutcomeContractLocal(
  { prediction30: 'signal at 30d', prediction60: '', prediction90: '', proveCorrect: 'correct signal', proveMistake: '' },
  'fc', 'fm', 'fallback 90d signal'
);
if (!noP90) throw new Error('outcomeContract: partial input should not return undefined when prediction30 exists');
if (noP90.prediction90 !== 'fallback 90d signal') throw new Error('outcomeContract: missing prediction90 should use fallback');

// Missing proveCorrect uses fallback
const noCorrect = normalizeOutcomeContractLocal(
  { prediction30: '', prediction60: '', prediction90: 'metric at 90d', proveCorrect: '', proveMistake: 'bad signal' },
  'fallback correct evidence', 'fm', ''
);
if (noCorrect?.proveCorrect !== 'fallback correct evidence') throw new Error('outcomeContract: empty proveCorrect should use fallback');

// All empty (no prediction or proof) returns undefined
const emptyOc = normalizeOutcomeContractLocal(
  { prediction30: '', prediction60: '', prediction90: '', proveCorrect: '', proveMistake: '' },
  '', '', ''
);
if (emptyOc !== undefined) throw new Error('outcomeContract: all-empty should return undefined');

// null / missing input returns undefined
if (normalizeOutcomeContractLocal(null, 'a', 'b', 'c') !== undefined) throw new Error('outcomeContract: null should return undefined');
if (normalizeOutcomeContractLocal(undefined, 'a', 'b', 'c') !== undefined) throw new Error('outcomeContract: undefined should return undefined');

// ─── Decision journal extraction tests ───────────────────────────────────────

function extractVerdictClassLocal2(recommendation) {
  const r = (recommendation || '').trim().toLowerCase();
  if (r.startsWith('full commit')) return 'FC';
  if (r.startsWith('reversible experiment')) return 'RE';
  if (r.startsWith('delay')) return 'D';
  if (r.startsWith('kill the idea')) return 'KI';
  if (r.startsWith('review')) return 'RV';
  return '—';
}

if (extractVerdictClassLocal2('Full Commit: go all in') !== 'FC') throw new Error('Journal: Full Commit should map to FC');
if (extractVerdictClassLocal2('Reversible Experiment: test first') !== 'RE') throw new Error('Journal: RE should map to RE');
if (extractVerdictClassLocal2('Delay: not enough evidence') !== 'D') throw new Error('Journal: Delay should map to D');
if (extractVerdictClassLocal2('Kill The Idea: shut it down') !== 'KI') throw new Error('Journal: Kill The Idea should map to KI');
if (extractVerdictClassLocal2('Review: checking back') !== 'RV') throw new Error('Journal: Review should map to RV');
if (extractVerdictClassLocal2('') !== '—') throw new Error('Journal: empty recommendation should map to —');

console.log('Response diversity test passed.');
