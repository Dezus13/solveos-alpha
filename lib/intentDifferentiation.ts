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

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function classifyIntentFamily(problem: string): IntentFamily {
  if (matchesAny(problem, PROCRASTINATION_PATTERNS)) return 'procrastination';
  if (matchesAny(problem, FEAR_PATTERNS)) return 'fear';
  if (matchesAny(problem, EMOTIONAL_OVERLOAD_PATTERNS)) return 'emotional_overload';
  if (matchesAny(problem, EXECUTION_FAILURE_PATTERNS)) return 'execution_failure';
  if (matchesAny(problem, CONFUSION_PATTERNS)) return 'confusion';
  if (matchesAny(problem, UNCERTAINTY_PATTERNS)) return 'uncertainty';
  if (matchesAny(problem, STRATEGIC_RISK_PATTERNS)) return 'strategic_risk';
  if (matchesAny(problem, LACK_OF_CLARITY_PATTERNS)) return 'lack_of_clarity';
  return 'standard';
}

export function classifySecondaryIntentFamily(
  problem: string,
  primary: IntentFamily
): IntentFamily | null {
  const candidates: Array<[IntentFamily, RegExp[]]> = [
    ['procrastination', PROCRASTINATION_PATTERNS],
    ['fear', FEAR_PATTERNS],
    ['emotional_overload', EMOTIONAL_OVERLOAD_PATTERNS],
    ['execution_failure', EXECUTION_FAILURE_PATTERNS],
    ['confusion', CONFUSION_PATTERNS],
    ['uncertainty', UNCERTAINTY_PATTERNS],
    ['strategic_risk', STRATEGIC_RISK_PATTERNS],
    ['lack_of_clarity', LACK_OF_CLARITY_PATTERNS],
  ];
  for (const [family, patterns] of candidates) {
    if (family !== primary && matchesAny(problem, patterns)) return family;
  }
  return null;
}

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
  history: Array<{ role: string; content: string }>
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
  recentPatterns: SemanticResponsePattern[]
): string {
  if (recentPatterns.length === 0) return '';

  const last = recentPatterns[recentPatterns.length - 1];
  const prevFrame = last.frameType;
  const prevVerdict = last.verdictClass;
  const prevKeyword = last.framingKeyword;

  const sameFamily = prevFrame === family;
  const sameVerdict =
    prevVerdict === 'Reversible Experiment' &&
    recentPatterns.filter((p) => p.verdictClass === 'Reversible Experiment').length >= 2;

  if (!sameFamily && !sameVerdict) return '';

  const lines = ['RESPONSE DIVERSITY ENFORCEMENT:'];
  if (sameFamily) {
    lines.push(
      `The previous response used "${prevFrame}" framing${prevKeyword ? ` (keyword: "${prevKeyword}")` : ''}.`
    );
    lines.push('You MUST approach this response from a different diagnostic angle.');
    lines.push('Change: the framing perspective, the diagnostic question, and the primary leverage point.');
  }
  if (sameVerdict) {
    lines.push(
      `"${prevVerdict}" has appeared in ${recentPatterns.filter((p) => p.verdictClass === prevVerdict).length} consecutive responses.`
    );
    lines.push('Select a different verdict class unless there is overwhelming evidence for the same one.');
    lines.push('Consider: Delay (evidence gap), Full Commit (clear upside), or Kill The Idea (fatal flaw).');
  }
  lines.push('Do not repeat the same strategic template even if the topic is similar.');
  return lines.join('\n');
}

export function buildIntentDifferentiationInstruction(
  problem: string,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const family = classifyIntentFamily(problem);
  if (family === 'standard') return '';

  const secondary = classifySecondaryIntentFamily(problem, family);
  const recentPatterns = extractRecentSemanticPatterns(conversationHistory);
  const lens = FAMILY_LENS[family];
  const diversityNote = buildDiversityEnforcementNote(family, recentPatterns);

  const lines: string[] = [
    'SEMANTIC INTENT DIFFERENTIATION:',
    `Primary intent: ${family.replace('_', ' ').toUpperCase()}`,
    `Diagnostic lens: ${lens.lens}`,
    `Leverage point: ${lens.leverage}`,
    `Framing question: ${lens.frame}`,
  ];

  if (secondary) {
    const sl = FAMILY_LENS[secondary];
    lines.push(
      `Secondary intent: ${secondary.replace('_', ' ').toUpperCase()} — use ${sl.lens} as a supporting layer only.`
    );
  }

  lines.push('');
  lines.push('INTENT-SPECIFIC ROUTING:');

  switch (family) {
    case 'procrastination':
      lines.push('This is an EXECUTION FRICTION problem, not a strategy question.');
      lines.push('Do NOT use generic reversible-experiment framing as the primary lens.');
      lines.push(
        'Diagnose: name the specific friction type (fear-of-failure, unclear-first-step, wrong-sequence, perfectionism-lock, unclear-owner).'
      );
      lines.push(
        'Output: identify the friction type + the single unblocking action. No motivational framing.'
      );
      lines.push(
        'The recommendation must name a concrete obstacle — not abstract "take action" advice.'
      );
      break;

    case 'uncertainty':
      lines.push('This is a TRAJECTORY AND ROI question.');
      lines.push(
        'Do NOT default to "run an experiment" unless genuine uncertainty about the path exists.'
      );
      lines.push(
        'Diagnose: is current effort generating compounding signal or diminishing returns?'
      );
      lines.push(
        'Output: trajectory assessment with one specific ROI indicator that confirms or refutes the path\'s value.'
      );
      lines.push(
        'Include: time investment audit, opportunity cost of continuing, one measurable signal to track.'
      );
      break;

    case 'fear':
      lines.push('This is a DOWNSIDE CONTAINMENT question.');
      lines.push('Do NOT minimize fear or provide reassurance framing.');
      lines.push(
        'Diagnose: separate survivable failure modes from catastrophic ones and price each realistically.'
      );
      lines.push(
        'Output: name the most likely failure mode, its actual probability, and the containment action.'
      );
      lines.push(
        'Distinguish "this hurts" from "this ends you" — they require fundamentally different responses.'
      );
      break;

    case 'execution_failure':
      lines.push('This is an EXECUTION BARRIER question.');
      lines.push('Do NOT diagnose motivation or willpower — locate the system error.');
      lines.push(
        'Diagnose: sequencing error, capacity mismatch, definition-of-done problem, or environment mismatch?'
      );
      lines.push(
        'Output: name the specific barrier type and the structural fix — not encouragement or general advice.'
      );
      break;

    case 'confusion':
      lines.push('This is a DECISION COMPRESSION question.');
      lines.push('Do NOT provide frameworks, option lists, or multi-path analysis.');
      lines.push(
        'Diagnose: identify the single binary question that resolves the confusion if answered.'
      );
      lines.push(
        'Output: the compressed decision question, the evidence that answers it, and the fastest path to that evidence.'
      );
      lines.push('Compress to one discriminating factor — not a list of considerations.');
      break;

    case 'lack_of_clarity':
      lines.push('This is a PRIORITY CLARIFICATION question.');
      lines.push('Do NOT provide a comprehensive list of everything to consider.');
      lines.push(
        'Diagnose: force-rank available options by asymmetric upside and irreversibility.'
      );
      lines.push(
        'Output: one clear priority with the logic — and what stops mattering once that priority is set.'
      );
      break;

    case 'emotional_overload':
      lines.push('This is a LOAD REDUCTION question, not a strategy question.');
      lines.push('Do NOT add more analysis, frameworks, or additional considerations.');
      lines.push('Diagnose: what is overloading the plate and what can be dropped or deferred today.');
      lines.push(
        'Output: one thing to stop, one thing to defer, the minimal next move. Nothing else.'
      );
      break;

    case 'strategic_risk':
      lines.push('This is a RISK CALIBRATION question.');
      lines.push('Do NOT use generic risk management language.');
      lines.push(
        'Diagnose: separate tail risk (catastrophic, low probability) from expected variance (normal, manageable).'
      );
      lines.push(
        'Output: actual exposure limit, signal that risk is materializing, and the one hedge that changes the equation.'
      );
      break;
  }

  if (diversityNote) {
    lines.push('');
    lines.push(diversityNote);
  }

  return lines.filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n');
}
