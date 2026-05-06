export type IntentFamily =
  | 'procrastination'
  | 'uncertainty'
  | 'fear'
  | 'execution_failure'
  | 'confusion'
  | 'lack_of_clarity'
  | 'emotional_overload'
  | 'strategic_risk'
  | 'standard';

export type IntentConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface IntentAssessment {
  primaryIntent: IntentFamily;
  secondaryIntent: IntentFamily | null;
  intentConfidence: IntentConfidence;
  ambiguityReasons: string[];
  primaryMatchCount: number;
  secondaryMatchCount: number;
}

interface FamilyLens {
  lens: string;
  leverage: string;
  frame: string;
}

const FAMILY_LENS: Record<IntentFamily, FamilyLens> = {
  procrastination: {
    lens: 'execution friction analysis',
    leverage: 'identify the specific friction point blocking the first physical action, not motivation',
    frame: 'What specific task, ambiguity, or fear is preventing the first step?',
  },
  uncertainty: {
    lens: 'trajectory and ROI analysis',
    leverage: 'assess whether current path generates compounding signal or diminishing returns',
    frame: 'Is current effort producing measurable signal toward a clear outcome?',
  },
  fear: {
    lens: 'downside containment',
    leverage: 'separate survivable from catastrophic failure modes, then price each realistically',
    frame: 'Which failure mode is actually likely versus catastrophic but improbable?',
  },
  execution_failure: {
    lens: 'execution barrier analysis',
    leverage: 'locate the system or sequencing error causing repeated failure, not willpower',
    frame: 'Is this a sequencing error, capacity mismatch, or unclear definition of done?',
  },
  confusion: {
    lens: 'decision compression',
    leverage: 'reduce to a binary, then name the single piece of evidence that resolves it',
    frame: 'What is the one question that, if answered, makes this decision obvious?',
  },
  lack_of_clarity: {
    lens: 'priority clarification',
    leverage: 'force-rank by asymmetric upside and irreversibility, not comfort',
    frame: 'Which one action, if done this week, makes all others easier or irrelevant?',
  },
  emotional_overload: {
    lens: 'load reduction',
    leverage: 'identify what to stop or defer before adding any new direction',
    frame: 'What can be dropped or deferred today without significant consequence?',
  },
  strategic_risk: {
    lens: 'risk calibration',
    leverage: 'separate tail risk from expected variance, then name the actual exposure limit',
    frame: 'What is the worst-case loss and is it survivable? What signals that risk is materializing?',
  },
  standard: {
    lens: 'decision analysis',
    leverage: 'identify the highest-leverage next action given the available evidence',
    frame: 'What is the most important unknown and how do you resolve it cheaply?',
  },
};

// ─── Pattern definitions ──────────────────────────────────────────────────────

const PROCRASTINATION_PATTERNS = [
  /\bwhy am i procrastinat/i,
  /\bprocrastinat/i,
  /\bcan'?t (?:get )?start(?:ed)?\b/i,
  /\bkeep (?:avoiding|putting off|delaying|stalling)\b/i,
  /\bnot starting\b/i,
  /\bwhy (?:don'?t|can'?t) i start\b/i,
  /\bstalling\b/i,
  /\bkeep postponing\b/i,
  /\bkeep (?:finding )?excuses\b/i,
  /\bwhy (?:do i|am i) (?:keep )?delay(?:ing)?\b/i,
  /\bkeep changing (?:my )?(?:mind|ideas?|direction)\b/i,
];

const UNCERTAINTY_PATTERNS = [
  /\bam i wasting\b/i,
  /\bwasting (?:my )?(?:time|energy|effort|money)\b/i,
  /\bis this worth\b/i,
  /\bworth (?:it|my time|doing)\b/i,
  /\bam i on the right\b/i,
  /\bright (?:path|direction|track)\b/i,
  /\bshould i (?:keep|continue|stay on)\b/i,
  /\bis this going anywhere\b/i,
  /\breturn on (?:my )?(?:time|investment|effort)\b/i,
  /\bROI\b/,
  /\bis it (?:still )?worth\b/i,
];

const FEAR_PATTERNS = [
  /\bwhat if (?:this|it) fails?\b/i,
  /\bwhat if i fail\b/i,
  /\bscared (?:of|to)\b/i,
  /\bafraid (?:of|to)\b/i,
  /\bworried (?:about|that)\b/i,
  /\bfear (?:of|that|is)\b/i,
  /\bwhat could go wrong\b/i,
  /\bworst case\b/i,
  /\bwhat if everything (?:falls|goes)\b/i,
  /\bi'?m (?:scared|afraid|terrified)\b/i,
  /\bscares? me\b/i,
  /\bfrightens? me\b/i,
];

const EXECUTION_FAILURE_PATTERNS = [
  /\bwhy can'?t i (?:finish|complete|execute|follow through|ship)\b/i,
  /\bkeep (?:failing|stopping|quitting|giving up|abandoning)\b/i,
  /\bcan'?t finish\b/i,
  /\bcan'?t execute\b/i,
  /\bnever (?:finish|follow through|complete|ship)\b/i,
  /\balways (?:quit|stop|give up|abandon)\b/i,
  /\bdon'?t follow through\b/i,
  /\bcan'?t complete\b/i,
  /\bkeep abandoning\b/i,
  /\bhalfway (?:through|done)\b/i,
  /\blose momentum\b/i,
];

const CONFUSION_PATTERNS = [
  /\bi can'?t decide\b/i,
  /\bcannot decide\b/i,
  /\bdon'?t know what to do\b/i,
  /\bno idea what\b/i,
  /\bi'?m (?:so )?confused\b/i,
  /\bdon'?t know (?:which|where to start)\b/i,
  /\bparalyz(?:ed|ing)\b/i,
  /\bcan'?t choose\b/i,
  /\bcan'?t make (?:up my mind|a decision)\b/i,
  /\btoo many (?:options|choices|paths)\b/i,
  /\bstuck (?:between|choosing)\b/i,
];

const LACK_OF_CLARITY_PATTERNS = [
  /\bdon'?t know (?:what|where) to focus\b/i,
  /\bwhat (?:should|do) i focus\b/i,
  /\bwhat (?:should i|to) prioriti[sz]e\b/i,
  /\bwhat (?:is|are) (?:the )?(?:most )?important\b/i,
  /\bwhere (?:should|do) i start\b/i,
  /\bwhat (?:comes|should come) first\b/i,
  /\bdon'?t know what matters\b/i,
  /\bwhat (?:should i|to) (?:do|work on) (?:first|next)\b/i,
  /\bno (?:clear )?direction\b/i,
  /\blost (?:focus|direction|track)\b/i,
];

const EMOTIONAL_OVERLOAD_PATTERNS = [
  /\boverwhelmed\b/i,
  /\btoo much (?:to|on)\b/i,
  /\bcan'?t (?:handle|cope|deal)\b/i,
  /\bburn.?out\b/i,
  /\bexhausted (?:by|from|with)\b/i,
  /\bspiraling\b/i,
  /\bdrowning in\b/i,
  /\beverything (?:is|feels) too\b/i,
  /\bno (?:energy|capacity|bandwidth) (?:left|for)\b/i,
  /\bcan'?t think (?:straight|clearly)\b/i,
  /\bmentally (?:drained|exhausted|done)\b/i,
  /\btired but\b/i,
];

const STRATEGIC_RISK_PATTERNS = [
  /\b(?:is this|am i taking) too (?:risky|much risk)\b/i,
  /\bam i (?:over)?exposed\b/i,
  /\bhow (?:risky|much risk)\b/i,
  /\bright amount of risk\b/i,
  /\bover.?exposed\b/i,
  /\bbetting (?:too much|everything)\b/i,
  /\brisking (?:too much)\b/i,
  /\bdownside (?:risk|exposure)\b/i,
  /\bexposure (?:too|is) (?:high|large|big)\b/i,
];

const ALL_FAMILY_PATTERNS: Array<[IntentFamily, RegExp[]]> = [
  ['procrastination', PROCRASTINATION_PATTERNS],
  ['fear', FEAR_PATTERNS],
  ['emotional_overload', EMOTIONAL_OVERLOAD_PATTERNS],
  ['execution_failure', EXECUTION_FAILURE_PATTERNS],
  ['confusion', CONFUSION_PATTERNS],
  ['uncertainty', UNCERTAINTY_PATTERNS],
  ['strategic_risk', STRATEGIC_RISK_PATTERNS],
  ['lack_of_clarity', LACK_OF_CLARITY_PATTERNS],
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

interface FamilyScore {
  family: IntentFamily;
  score: number;
}

function countPatternMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function rankFamilies(problem: string): FamilyScore[] {
  return ALL_FAMILY_PATTERNS.map(([family, patterns]) => ({
    family,
    score: countPatternMatches(problem, patterns),
  }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}

function computeConfidence(
  ranked: FamilyScore[],
  wordCount: number,
): IntentConfidence {
  if (ranked.length === 0) return 'LOW';

  const top = ranked[0];
  const second = ranked[1];

  if (wordCount <= 4) return 'LOW';

  // HIGH: strong unambiguous match
  if (top.score >= 3) return 'HIGH';
  if (top.score >= 2 && (!second || top.score >= second.score * 2)) return 'HIGH';

  // LOW: competing signals or weak single match
  if (second && second.score >= top.score) return 'LOW';
  if (ranked.length >= 3) return 'LOW';
  if (top.score === 1 && wordCount <= 8) return 'LOW';

  return 'MEDIUM';
}

function computeAmbiguityReasons(
  ranked: FamilyScore[],
  wordCount: number,
  confidence: IntentConfidence,
): string[] {
  if (confidence === 'HIGH') return [];
  const reasons: string[] = [];

  if (wordCount <= 4) reasons.push('question is too short to infer clear intent');
  if (ranked.length === 0) reasons.push('no specific intent patterns matched');
  if (ranked.length >= 2 && ranked[1].score >= 1) {
    reasons.push(`competing intent: "${ranked[1].family.replace('_', ' ')}" signals also present`);
  }
  if (ranked.length >= 3) reasons.push('three or more intent families active simultaneously');
  if (ranked[0]?.score === 1 && wordCount > 8) {
    reasons.push('single keyword match — intent inferred, not confirmed');
  }
  if (confidence === 'LOW' && ranked.length === 0) {
    reasons.push('insufficient specificity to classify intent reliably');
  }
  return reasons;
}

// ─── Public assessment API ────────────────────────────────────────────────────

export function assessIntent(problem: string): IntentAssessment {
  const wordCount = problem.trim().split(/\s+/).filter(Boolean).length;
  const ranked = rankFamilies(problem);
  const primaryFamily: IntentFamily = ranked[0]?.family ?? 'standard';
  const secondaryFamily: IntentFamily | null = ranked[1]?.family ?? null;
  const confidence = computeConfidence(ranked, wordCount);
  const ambiguityReasons = computeAmbiguityReasons(ranked, wordCount, confidence);

  return {
    primaryIntent: primaryFamily,
    secondaryIntent: secondaryFamily,
    intentConfidence: confidence,
    ambiguityReasons,
    primaryMatchCount: ranked[0]?.score ?? 0,
    secondaryMatchCount: ranked[1]?.score ?? 0,
  };
}

// Backwards-compatible fast-path for semantic-guards
export function classifyIntentFamily(problem: string): IntentFamily {
  return assessIntent(problem).primaryIntent;
}

export function classifySecondaryIntentFamily(
  problem: string,
  primary: IntentFamily,
): IntentFamily | null {
  const ranked = rankFamilies(problem);
  return ranked.find((r) => r.family !== primary)?.family ?? null;
}

// ─── Semantic response memory ─────────────────────────────────────────────────

export interface SemanticResponsePattern {
  frameType: IntentFamily | string;
  verdictClass: string;
  framingKeyword: string;
}

const FRAME_MARKERS: Array<{ keyword: string; frame: IntentFamily }> = [
  { keyword: 'execution friction', frame: 'procrastination' },
  { keyword: 'first step', frame: 'procrastination' },
  { keyword: 'friction point', frame: 'procrastination' },
  { keyword: 'trajectory', frame: 'uncertainty' },
  { keyword: 'return on', frame: 'uncertainty' },
  { keyword: 'opportunity cost', frame: 'uncertainty' },
  { keyword: 'downside containment', frame: 'fear' },
  { keyword: 'survivable', frame: 'fear' },
  { keyword: 'worst case', frame: 'fear' },
  { keyword: 'catastrophic', frame: 'fear' },
  { keyword: 'decision compression', frame: 'confusion' },
  { keyword: 'binary', frame: 'confusion' },
  { keyword: 'single question', frame: 'confusion' },
  { keyword: 'execution barrier', frame: 'execution_failure' },
  { keyword: 'sequencing error', frame: 'execution_failure' },
  { keyword: 'priority clarification', frame: 'lack_of_clarity' },
  { keyword: 'force-rank', frame: 'lack_of_clarity' },
  { keyword: 'load reduction', frame: 'emotional_overload' },
  { keyword: 'defer', frame: 'emotional_overload' },
  { keyword: 'risk calibration', frame: 'strategic_risk' },
  { keyword: 'tail risk', frame: 'strategic_risk' },
  { keyword: 'exposure limit', frame: 'strategic_risk' },
];

function detectFrameFromContent(content: string): IntentFamily | string {
  const lower = content.toLowerCase();
  for (const { keyword, frame } of FRAME_MARKERS) {
    if (lower.includes(keyword)) return frame;
  }
  return 'standard';
}

function detectVerdictFromContent(content: string): string {
  const match = content.match(/\b(Full Commit|Reversible Experiment|Delay|Kill The Idea)\b/);
  return match?.[1] ?? '';
}

function detectFramingKeywordFromContent(content: string): string {
  const lower = content.toLowerCase();
  for (const { keyword } of FRAME_MARKERS) {
    if (lower.includes(keyword)) return keyword;
  }
  return '';
}

export function extractRecentSemanticPatterns(
  history: Array<{ role: string; content: string }>,
): SemanticResponsePattern[] {
  return history
    .filter((t) => t.role === 'assistant' && t.content.trim())
    .slice(-3)
    .map((t) => ({
      frameType: detectFrameFromContent(t.content),
      verdictClass: detectVerdictFromContent(t.content),
      framingKeyword: detectFramingKeywordFromContent(t.content),
    }));
}

function buildDiversityEnforcementNote(
  family: IntentFamily,
  recentPatterns: SemanticResponsePattern[],
): string {
  if (recentPatterns.length === 0) return '';
  const last = recentPatterns[recentPatterns.length - 1];
  const sameFamily = last.frameType === family;
  const sameVerdict =
    last.verdictClass === 'Reversible Experiment' &&
    recentPatterns.filter((p) => p.verdictClass === 'Reversible Experiment').length >= 2;

  if (!sameFamily && !sameVerdict) return '';

  const lines = ['RESPONSE DIVERSITY ENFORCEMENT:'];
  if (sameFamily) {
    lines.push(
      `Previous response used "${last.frameType}" framing${last.framingKeyword ? ` (keyword: "${last.framingKeyword}")` : ''}.`,
    );
    lines.push('Approach this response from a different diagnostic angle.');
    lines.push('Change the framing perspective, the diagnostic question, and the primary leverage point.');
  }
  if (sameVerdict) {
    lines.push(
      `"Reversible Experiment" appeared in ${recentPatterns.filter((p) => p.verdictClass === 'Reversible Experiment').length} consecutive responses.`,
    );
    lines.push('Select a different verdict class unless evidence overwhelmingly supports the same one.');
  }
  lines.push('Do not repeat the same strategic template even if the topic is similar.');
  return lines.join('\n');
}

// ─── Mixed-intent routing ─────────────────────────────────────────────────────

type MixedPair = `${IntentFamily}+${IntentFamily}`;

function makePairKey(a: IntentFamily, b: IntentFamily): MixedPair {
  return [a, b].sort().join('+') as MixedPair;
}

const MIXED_INTENT_ROUTING: Partial<Record<MixedPair, string>> = {
  'fear+procrastination': [
    'MIXED INTENT: EXECUTION FRICTION + FEAR',
    'Both are active. The friction blocking action is fear-based.',
    'Combined lens: the first step is blocked by a specific feared outcome, not an unclear task.',
    'Answer structure: (1) name what is feared specifically, (2) assess whether that fear is rational or inflated, (3) name the one unblocking action once the fear is sized.',
    'Do not treat these as separate — resolve the fear to unlock the action.',
  ].join('\n'),

  'lack_of_clarity+uncertainty': [
    'MIXED INTENT: TRAJECTORY UNCERTAINTY + PRIORITY CONFUSION',
    'Both are active. Measuring ROI requires knowing what outcome is being tracked.',
    'Combined lens: before assessing whether effort is compounding, define the one metric that would confirm value.',
    'Answer structure: (1) identify what the user is actually trying to achieve, (2) name the one signal that proves forward motion, (3) then assess ROI against that signal.',
    'Do not assess trajectory without first compressing to the right output definition.',
  ].join('\n'),

  'emotional_overload+execution_failure': [
    'MIXED INTENT: LOAD OVERLOAD + EXECUTION BREAKDOWN',
    'Both are active. The system is failing because capacity is exhausted, not because the plan is wrong.',
    'Combined lens: execution is structurally broken by overload.',
    'Answer structure: (1) identify what is consuming capacity, (2) name what to stop or defer, (3) then and only then locate the execution barrier.',
    'Do not fix the execution structure while the load remains unmanaged.',
  ].join('\n'),

  'confusion+fear': [
    'MIXED INTENT: DECISION PARALYSIS + FEAR',
    'Both are active. The confusion may be manufactured by fear of the decision itself.',
    'Combined lens: compress to the one choice fear is avoiding.',
    'Answer structure: (1) name what the user is avoiding deciding, (2) price the feared downside, (3) give the compressed binary that bypasses the noise.',
    'Do not expand options — the confusion is a symptom, not the root problem.',
  ].join('\n'),

  'strategic_risk+uncertainty': [
    'MIXED INTENT: RISK EXPOSURE + TRAJECTORY DOUBT',
    'Both are active. These are the same question at different time horizons.',
    'Combined lens: the trajectory question and the risk question resolve together.',
    'Answer structure: (1) name the actual downside exposure limit, (2) name the ROI signal that justifies continued exposure, (3) give the threshold that flips the verdict.',
    'Risk and trajectory are not separate concerns here — size the risk against the expected return.',
  ].join('\n'),

  'procrastination+lack_of_clarity': [
    'MIXED INTENT: EXECUTION FRICTION + PRIORITY CONFUSION',
    'Both are active. The first action is blocked because the priority is unclear.',
    'Combined lens: clarify the priority to unlock the first step.',
    'Answer structure: (1) force-rank to one priority, (2) name the first physical action under that priority, (3) nothing else until that action is complete.',
    'Do not diagnose friction without first establishing which task should be acted on.',
  ].join('\n'),
};

function buildMixedIntentNote(
  primary: IntentFamily,
  secondary: IntentFamily,
  primaryCount: number,
  secondaryCount: number,
): string {
  if (primaryCount < 1 || secondaryCount < 1) return '';
  if (secondaryCount < primaryCount - 1) return '';

  const key = makePairKey(primary, secondary);
  return MIXED_INTENT_ROUTING[key] ?? '';
}

// ─── Confidence-aware instruction builder ─────────────────────────────────────

function buildLowConfidenceSection(assessment: IntentAssessment): string {
  const lines = [
    'INTENT AMBIGUITY — LOW CONFIDENCE:',
    `Working assumption: ${assessment.primaryIntent === 'standard' ? 'general decision question' : assessment.primaryIntent.replace('_', ' ')}.`,
  ];
  if (assessment.ambiguityReasons.length > 0) {
    lines.push(`Ambiguity signals: ${assessment.ambiguityReasons.join('; ')}.`);
  }
  lines.push(
    'Behavior: avoid strong diagnosis or confident framing.',
    'Give a practical provisional answer based on the working assumption.',
    'If one clarifying question would unlock a significantly better answer, ask it — but only one, and only if truly necessary.',
    'Do not label the user\'s emotional state or over-interpret sparse input.',
  );
  return lines.join('\n');
}

function buildMediumConfidenceSection(assessment: IntentAssessment): string {
  const lens = FAMILY_LENS[assessment.primaryIntent];
  const lines = [
    'INTENT CLASSIFICATION — MEDIUM CONFIDENCE:',
    `Primary intent (assumed): ${assessment.primaryIntent.replace('_', ' ').toUpperCase()}`,
    `Diagnostic lens: ${lens.lens}`,
    `Working assumption: this is likely a ${lens.lens} question.`,
  ];
  if (assessment.secondaryIntent) {
    lines.push(
      `Secondary signal also present: ${assessment.secondaryIntent.replace('_', ' ')} — acknowledge if directly relevant.`,
    );
  }
  lines.push(
    'Behavior: state the working assumption naturally in one phrase. Answer based on it.',
    'Avoid overconfident diagnostic framing. Prefer grounded, provisional phrasing.',
    'Example: "If the core issue is..." or "Assuming the question is about..." before the analysis.',
  );
  return lines.join('\n');
}

function buildFamilyRoutingSection(family: IntentFamily): string {
  const lines: string[] = [];
  switch (family) {
    case 'procrastination':
      lines.push('This is an EXECUTION FRICTION problem, not a strategy question.');
      lines.push('Do NOT use generic reversible-experiment framing as the primary lens.');
      lines.push('Diagnose: name the friction type (fear-of-failure, unclear-first-step, wrong-sequence, perfectionism-lock, unclear-owner).');
      lines.push('Output: friction type + single unblocking action. No motivational framing.');
      break;
    case 'uncertainty':
      lines.push('This is a TRAJECTORY AND ROI question.');
      lines.push('Do NOT default to "run an experiment" unless genuine path uncertainty exists.');
      lines.push('Diagnose: is current effort generating compounding signal or diminishing returns?');
      lines.push('Output: trajectory assessment + one measurable ROI indicator. Include opportunity cost of continuing.');
      break;
    case 'fear':
      lines.push('This is a DOWNSIDE CONTAINMENT question.');
      lines.push('Do NOT minimize fear or provide reassurance framing.');
      lines.push('Diagnose: separate survivable failure modes from catastrophic ones and price each.');
      lines.push('Distinguish "this hurts" from "this ends you" — they require fundamentally different responses.');
      break;
    case 'execution_failure':
      lines.push('This is an EXECUTION BARRIER question.');
      lines.push('Do NOT diagnose motivation or willpower — locate the system error.');
      lines.push('Diagnose: sequencing error, capacity mismatch, definition-of-done problem, or environment mismatch?');
      lines.push('Output: barrier type + structural fix. Not encouragement.');
      break;
    case 'confusion':
      lines.push('This is a DECISION COMPRESSION question.');
      lines.push('Do NOT provide frameworks, option lists, or multi-path analysis.');
      lines.push('Compress to the single binary question that resolves the confusion if answered.');
      lines.push('Output: the compressed question + the evidence that answers it. One discriminating factor only.');
      break;
    case 'lack_of_clarity':
      lines.push('This is a PRIORITY CLARIFICATION question.');
      lines.push('Do NOT provide a comprehensive list of considerations.');
      lines.push('Force-rank by asymmetric upside and irreversibility.');
      lines.push('Output: one clear priority + what stops mattering once that priority is set.');
      break;
    case 'emotional_overload':
      lines.push('This is a LOAD REDUCTION question, not a strategy question.');
      lines.push('Do NOT add more analysis, frameworks, or additional considerations.');
      lines.push('Output: one thing to stop, one thing to defer, the minimal next move. Nothing else.');
      break;
    case 'strategic_risk':
      lines.push('This is a RISK CALIBRATION question.');
      lines.push('Do NOT use generic risk management language.');
      lines.push('Diagnose: separate tail risk from expected variance.');
      lines.push('Output: actual exposure limit + signal that risk is materializing + the one hedge that changes the equation.');
      break;
    default:
      break;
  }
  return lines.join('\n');
}

export function buildIntentDifferentiationInstruction(
  assessment: IntentAssessment,
  conversationHistory: Array<{ role: string; content: string }>,
): string {
  const { primaryIntent, secondaryIntent, intentConfidence, primaryMatchCount, secondaryMatchCount } = assessment;

  if (primaryIntent === 'standard' && intentConfidence === 'LOW') return '';

  const recentPatterns = extractRecentSemanticPatterns(conversationHistory);
  const diversityNote = buildDiversityEnforcementNote(primaryIntent, recentPatterns);
  const mixedNote = secondaryIntent
    ? buildMixedIntentNote(primaryIntent, secondaryIntent, primaryMatchCount, secondaryMatchCount)
    : '';

  const lines: string[] = ['SEMANTIC INTENT DIFFERENTIATION:'];

  if (intentConfidence === 'LOW') {
    lines.push(buildLowConfidenceSection(assessment));
  } else if (intentConfidence === 'MEDIUM') {
    lines.push(buildMediumConfidenceSection(assessment));
    if (primaryIntent !== 'standard') {
      lines.push('');
      lines.push('INTENT-SPECIFIC ROUTING (medium confidence — apply with stated assumption):');
      lines.push(buildFamilyRoutingSection(primaryIntent));
    }
  } else {
    const lens = FAMILY_LENS[primaryIntent];
    lines.push(`Primary intent: ${primaryIntent.replace('_', ' ').toUpperCase()}`);
    lines.push(`Diagnostic lens: ${lens.lens}`);
    lines.push(`Leverage point: ${lens.leverage}`);
    lines.push(`Framing question: ${lens.frame}`);
    if (secondaryIntent && !mixedNote) {
      const sl = FAMILY_LENS[secondaryIntent];
      lines.push(`Secondary intent: ${secondaryIntent.replace('_', ' ').toUpperCase()} — use ${sl.lens} as a supporting layer.`);
    }
    lines.push('');
    lines.push('INTENT-SPECIFIC ROUTING:');
    lines.push(buildFamilyRoutingSection(primaryIntent));
  }

  if (mixedNote) {
    lines.push('');
    lines.push(mixedNote);
  }

  if (diversityNote) {
    lines.push('');
    lines.push(diversityNote);
  }

  return lines.filter((line, i, arr) => !(line === '' && (i === 0 || arr[i - 1] === ''))).join('\n');
}
