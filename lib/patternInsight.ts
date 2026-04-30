import type { SavedDecision } from './savedDecisions';

// Mirrors are in test-pattern-insight.mjs — keep in sync
export const MIN_RESOLVED = 5;
export const WINDOW = 10;
export const MIN_INSTANCES = 3;
export const FAIL_RATE_THRESHOLD = 0.5;
export const CONFIDENCE_THRESHOLD = 45; // skip if current blueprint is already low-confidence

function verdictClass(v: string): string {
  if (/^Full Commit/i.test(v)) return 'Full Commit';
  if (/^Reversible Experiment/i.test(v)) return 'Reversible Experiment';
  if (/^Delay/i.test(v)) return 'Delay';
  if (/^Kill The Idea/i.test(v)) return 'Kill The Idea';
  return 'Other';
}

interface PatternResult {
  label: string;
  evidence: string;
  implication: string;
  adjustment: string;
  forcedAction: string;
  strength: number;
}

export interface PatternInsightResult {
  patternInsight: string;
  forcedAction: string;
}

export function generatePatternInsight(
  decisions: SavedDecision[],
  currentConfidence = 100,
): PatternInsightResult | null {
  if (currentConfidence < CONFIDENCE_THRESHOLD) return null;

  const resolved = decisions.filter((d) => d.status === 'worked' || d.status === 'failed');
  if (resolved.length < MIN_RESOLVED) return null;

  // Sort most-recent first, cap at WINDOW
  const recent = resolved
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, WINDOW);

  const failed = recent.filter((d) => d.status === 'failed');
  const patterns: PatternResult[] = [];

  // ── 1. Early commitment ───────────────────────────────────────────────────
  const fullCommits = recent.filter((d) => verdictClass(d.verdict) === 'Full Commit');
  if (fullCommits.length >= MIN_INSTANCES) {
    const fcFailed = fullCommits.filter((d) => d.status === 'failed');
    if (fcFailed.length / fullCommits.length >= FAIL_RATE_THRESHOLD) {
      patterns.push({
        label: 'Early Commitment',
        evidence: `${fcFailed.length} of ${fullCommits.length} Full Commit decisions failed`,
        implication:
          fcFailed.length === fullCommits.length
            ? 'Every full commitment you made has failed. You are committing before the assumption is validated.'
            : 'You repeatedly commit fully before readiness is confirmed. You are overestimating readiness.',
        adjustment:
          'Run a staged test before any full commitment. Name one measurable signal that must fire before scaling.',
        forcedAction:
          'Do not commit. Run a 3-user validation test before any build.',
        strength: (fcFailed.length / fullCommits.length) * fullCommits.length,
      });
    }
  }

  // ── 2. Overestimated upside (high confidence → failed) ───────────────────
  const highConf = recent.filter((d) => (d.confidence ?? 0) >= 70);
  if (highConf.length >= MIN_INSTANCES) {
    const hcFailed = highConf.filter((d) => d.status === 'failed');
    if (hcFailed.length / highConf.length >= FAIL_RATE_THRESHOLD) {
      patterns.push({
        label: 'Overestimated Upside',
        evidence: `${hcFailed.length} of ${highConf.length} high-confidence decisions (≥70%) failed`,
        implication:
          'Your confidence scores consistently exceed actual outcomes. You are more optimistic than the data warrants.',
        adjustment:
          'Discount confidence by 10–15% on decisions that feel certain. Write down the one assumption that, if wrong, breaks the whole thing.',
        forcedAction:
          'Find 3 real users and ask them to reject your idea before you proceed.',
        strength: (hcFailed.length / highConf.length) * highConf.length,
      });
    }
  }

  // ── 3. Execution gap (execution keywords in failed key risks) ────────────
  const execKeywords = [
    'execut', 'capacity', 'bandwidth', 'resource', 'staffing',
    'implement', 'deliver', 'timeline', 'operati', 'priorit',
  ];
  const execFailed = failed.filter((d) =>
    d.keyRisks.some((r) => execKeywords.some((k) => r.toLowerCase().includes(k))),
  );
  if (execFailed.length >= MIN_INSTANCES) {
    patterns.push({
      label: 'Execution Gap',
      evidence: `${execFailed.length} of ${recent.length} recent decisions failed at execution`,
      implication:
        'Sound strategies are failing at implementation. You are underestimating operational constraints.',
      adjustment:
        'Before committing, map one bottleneck explicitly: who executes it, by when, with what resources.',
      forcedAction:
        'Ship a minimal version in 48 hours or pause this idea.',
      strength: execFailed.length * 1.2,
    });
  }

  // ── 4. Consistent misjudgement (high overall failure rate, no other pattern) ──
  if (failed.length >= MIN_INSTANCES && failed.length / recent.length >= 0.6 && patterns.length === 0) {
    patterns.push({
      label: 'Consistent Misjudgement',
      evidence: `${failed.length} of ${recent.length} recent decisions failed`,
      implication:
        'You are systematically overestimating option quality or acting before conditions are right.',
      adjustment:
        'Before any commitment, write down what would have to be true for this to fail. If you cannot answer in 60 seconds, the decision is not ready.',
      forcedAction:
        "Write one sentence: 'This fails if ___.' Fill it in before you do anything else today.",
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
