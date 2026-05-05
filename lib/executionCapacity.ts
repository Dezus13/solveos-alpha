import type { DecisionMemoryEntry } from './types';

type ExecutionMode =
  | 'exploring'
  | 'planning'
  | 'committing'
  | 'executing'
  | 'overloaded'
  | 'recovering'
  | 'scaling';

type OverloadSignal =
  | 'burnout'
  | 'energy-overload'
  | 'fragmented-focus'
  | 'financial-pressure'
  | 'family-obligations'
  | 'learning-load'
  | 'unstable-environment'
  | 'unrealistic-timeline';

type SequencingError =
  | 'premature-scaling'
  | 'premature-automation'
  | 'premature-branding'
  | 'premature-hiring'
  | 'planning-before-validation'
  | 'building-before-distribution'
  | 'optimizing-before-proving';

// Each overload signal has a single pattern — no dual-gate needed, just presence
const OVERLOAD_SIGNAL_PATTERNS: Array<{ signal: OverloadSignal; pattern: RegExp }> = [
  {
    signal: 'burnout',
    pattern: /\b(burn.?out|exhausted|no energy|drained|worn out|depleted|running on empty|barely functioning|can'?t keep going)\b/i,
  },
  {
    signal: 'energy-overload',
    pattern: /\b(overwhelmed|too much (going on|on my plate)|juggling|pulled in (too many|different) (direction|ways?)|stretched thin|overcommitted|too many (things|balls))\b/i,
  },
  {
    signal: 'fragmented-focus',
    pattern: /\b(multiple projects?|several things|context.?switch|working on (a lot|many|several|multiple)|can'?t focus|scattered|split (time|attention|focus))\b/i,
  },
  {
    signal: 'financial-pressure',
    pattern: /\b(running out of money|low on cash|almost broke|tight budget|can'?t afford|financial stress|money is tight|dipping into savings|maxed out|no runway|no capital)\b/i,
  },
  {
    signal: 'family-obligations',
    pattern: /\b(kids?|children|family responsibilities?|new baby|pregnant|caregiv|taking care of (my )?(parents?|kids?|family))\b/i,
  },
  {
    signal: 'learning-load',
    pattern: /\b(still learning|learning (how to|to code|everything)|figuring (it|things) out|new to (this|all of this)|no experience (in|with)|complete beginner|catching up)\b/i,
  },
  {
    signal: 'unstable-environment',
    pattern: /\b(between jobs|just got (fired|laid off|let go)|job.?hunting|looking for work|no stable income|variable income|not sure about my job|unemployed)\b/i,
  },
  {
    signal: 'unrealistic-timeline',
    pattern: /\b(by (tomorrow|next week|this weekend|end of (month|week))|in (\d+) (day|week)s? (from now|only)|asap|immediately|overnight|same day|instant(ly)?)\b/i,
  },
];

// Sequencing errors require BOTH the premature action AND a signal that the prerequisite is missing
const SEQUENCING_ERROR_PATTERNS: Array<{ error: SequencingError; action: RegExp; prerequisiteMissing: RegExp }> = [
  {
    error: 'premature-scaling',
    action: /\b(scale|hire more|increase (budget|spend|team)|go (national|international|global)|series [abcde]|double (revenue|team|spending)|expand aggressively)\b/i,
    prerequisiteMissing: /\b(no (customers|revenue|sales|users)|haven'?t (validated|launched|proven)|pre.?revenue|not (profitable|proven)|first (customer|sale|user) (not yet|haven'?t))\b/i,
  },
  {
    error: 'premature-automation',
    action: /\b(automat|build (a )?(system|workflow|pipeline|process)|set up (crm|tools?|infrastructure)|systematize)\b/i,
    prerequisiteMissing: /\b(no (customers|revenue|sales|users|validation)|haven'?t (validated|launched|proven|sold)|pre.?launch|not yet proven|never sold)\b/i,
  },
  {
    error: 'premature-branding',
    action: /\b(rebrand|brand (identity|design|name|strategy)|logo|visual identity|brand (colors?|voice|guide))\b/i,
    prerequisiteMissing: /\b(no (customers|revenue|sales|validation)|haven'?t (validated|launched|proven|sold)|pre.?launch|just starting|first)\b/i,
  },
  {
    error: 'premature-hiring',
    action: /\b(hire|bring (someone|a person) on|find (a co-?founder|a partner|employees?)|build (a )?team|add (someone|headcount))\b/i,
    prerequisiteMissing: /\b(no (revenue|customers|validation)|pre.?revenue|haven'?t (validated|launched|proven)|not (profitable|proven))\b/i,
  },
  {
    error: 'planning-before-validation',
    action: /\b(business plan|pitch deck|investor (deck|presentation)|5.?year (plan|roadmap)|long.?term strategy|full roadmap)\b/i,
    prerequisiteMissing: /\b(no (customers|revenue|validation|sales|proof)|haven'?t (talked to|tested|validated|sold)|don'?t know if (people|anyone) (want|will buy))\b/i,
  },
  {
    error: 'building-before-distribution',
    action: /\b(build(ing)? (the )?(product|app|platform|mvp|full|complete)|develop(ing)?|cod(e|ing) (the|a|an)|finish(ing)? (the )?mvp)\b/i,
    prerequisiteMissing: /\b(don'?t know how to (find|reach|get|acquire)|no (audience|channel|customer base|distribution)|no one knows (about|us|me))\b/i,
  },
  {
    error: 'optimizing-before-proving',
    action: /\b(optim(iz|ising)|polish(ing)?|perf(ect|ecting)|refin(e|ing)|v2|version 2|better version|improv(e|ing) the (existing|current))\b/i,
    prerequisiteMissing: /\b(no (customers|real users|revenue|validation)|haven'?t (launched|proven|validated)|nobody has (used|tried|bought))\b/i,
  },
];

// Execution mode — ordered most specific/strong first to avoid weak matches overriding strong ones
const MODE_PATTERNS: Array<{ mode: ExecutionMode; pattern: RegExp }> = [
  {
    mode: 'overloaded',
    pattern: /\b(too much (on|to)|can'?t (handle|keep up|do it all)|overwhelmed|too many (things|projects|goals|commitments)|something has to (give|go)|need to drop|can'?t do everything)\b/i,
  },
  {
    mode: 'recovering',
    pattern: /\b(recover(ing)?|getting back (on track|to it)|restart(ing)?|rebuild(ing)?|starting over|after (the )?failure|after (burn.?out|the setback)|picking (it )?back up)\b/i,
  },
  {
    mode: 'scaling',
    pattern: /\b(scal(e|ing)|grow(ing)? fast|10x|series [abcde]|raise (a round|capital|funding)|expanding (to|into)|go (national|international|global))\b/i,
  },
  {
    mode: 'executing',
    pattern: /\b(i (started|launched|shipped|quit|signed|moved|joined|left|built)|working on it|already (doing|running|executing|underway)|in (progress|motion)|deployed)\b/i,
  },
  {
    mode: 'committing',
    pattern: /\b(i'?m (going to|planning to|about to|decided to)|i will|ready to (start|launch|commit|pull the trigger)|committed to|final decision|made (my|the) decision)\b/i,
  },
  {
    mode: 'exploring',
    pattern: /\b(exploring|considering|thinking (about|of) (trying|doing|starting)|curious about|wondering if|evaluating|researching|looking into|what if i)\b/i,
  },
  {
    mode: 'planning',
    pattern: /\b(planning|figuring out|mapping (out)?|laying out|preparing (to|for)|setting up|designing the (plan|approach)|organizing|how (should|do) i)\b/i,
  },
];

// Active concurrent goal patterns — used for priority collision detection
const CONCURRENT_GOAL_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'business launch', pattern: /\b(launch|start|build|create|found)\b.{0,30}\b(business|startup|product|company|agency|practice|saas)\b/i },
  { label: 'career change', pattern: /\b(quit|leave|change|switch|find)\b.{0,20}\b(job|career|employer|company)\b/i },
  { label: 'relocation', pattern: /\b(move|moving|relocat|new city|new country|going to|leaving)\b.{0,30}\b(city|country|state|abroad|overseas|somewhere)\b/i },
  { label: 'learning commitment', pattern: /\b(learn(ing)?|study(ing)?|course|bootcamp|degree|certification|training|school)\b/i },
  { label: 'financial restructuring', pattern: /\b(invest(ing)?|pay(ing)? off|clear(ing)?\b.{0,15}debt|sav(e|ing)|restructur)\b.{0,20}\b(debt|loan|money|savings|finances)\b/i },
  { label: 'fundraising', pattern: /\b(rais(e|ing)|fundrais|find(ing)? investors?|pitch(ing)?|seek(ing)? capital)\b/i },
  { label: 'team building', pattern: /\b(hir(e|ing)|build(ing)?\b.{0,10}team|find(ing)?\b.{0,15}co-?founder|bring(ing)? (someone|people) on)\b/i },
  { label: 'health commitment', pattern: /\b(start(ing)?|commit(ing)?\b.{0,10}to)\b.{0,30}\b(workout|fitness|diet|health|exercise|running)\b/i },
];

// Overcomplexity detection — building unnecessary systems before validating
const OVERCOMPLEXITY_PATTERNS: RegExp[] = [
  /\b(full|complete|comprehensive|enterprise.?grade|end.?to.?end|production.?ready)\b.{0,30}\b(system|solution|platform|infrastructure|stack|pipeline)\b.{0,40}\b(before|first|yet)\b/i,
  /\b(automat|systematize|integrate|optimize)\b.{0,20}\b(everything|all (of it|the things)|the (entire|whole) (process|workflow))\b/i,
  /\brebuild(ing)?\b.{0,40}\bfrom scratch\b.{0,30}\b(because|so that|to make it).{0,30}\b(perfect|clean|professional|better|scalable)\b/i,
  /\b(also adding|also (need|want)|and (also|additionally|on top of that)).{0,40}\b(system|tool|process|layer|integration|feature)\b/i,
];

function detectExecutionMode(problem: string, history: Array<{ role: string; content: string }>): ExecutionMode {
  const recentUser = history.filter((t) => t.role === 'user').slice(-3).map((t) => t.content).join(' ');
  const text = `${problem} ${recentUser}`;
  for (const { mode, pattern } of MODE_PATTERNS) {
    if (pattern.test(text)) return mode;
  }
  return 'planning';
}

function detectOverloadSignals(text: string): OverloadSignal[] {
  return OVERLOAD_SIGNAL_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ signal }) => signal).slice(0, 4);
}

function detectSequencingErrors(text: string): SequencingError[] {
  return SEQUENCING_ERROR_PATTERNS
    .filter(({ action, prerequisiteMissing }) => action.test(text) && prerequisiteMissing.test(text))
    .map(({ error }) => error)
    .slice(0, 2);
}

function detectConcurrentGoals(text: string): string[] {
  return CONCURRENT_GOAL_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ label }) => label).slice(0, 5);
}

function detectOvercomplexity(text: string): boolean {
  return OVERCOMPLEXITY_PATTERNS.some((p) => p.test(text));
}

const MODE_GUIDANCE: Record<ExecutionMode, string> = {
  exploring: 'User is in exploration mode. Give framing, the most important tradeoff, and the one question that must be answered before moving forward — not a full execution plan.',
  planning: 'User is in planning mode. Help remove unnecessary complexity, sharpen the first action, and identify what can wait.',
  committing: 'User is in committing mode. Reduce friction, confirm the first concrete step, and name the one signal that would stop this commitment.',
  executing: 'User is in execution mode. Focus on what is working, what is blocking, and the specific next unblocking action. Do not restart the decision from scratch.',
  overloaded: 'User is in overloaded mode. Simplify aggressively — name what to deprioritize and why. One action beats a framework. Do not add anything; subtract.',
  recovering: 'User is in recovery mode. Reduce scope, stabilize the base, sequence the return. Do not give expansion advice. Ambition comes after the base is stable.',
  scaling: 'User is in scaling mode. Focus on what is breaking under growth and what must be systematized before the next commitment. What works at 1 breaks at 10.',
};

const OVERLOAD_GUIDANCE: Record<OverloadSignal, string> = {
  'burnout': 'Burnout signal present. Give one recovery action, not an expanded plan. Shrink scope.',
  'energy-overload': 'User is overextended. Recommend subtraction before addition. What can stop before something new starts?',
  'fragmented-focus': 'Fragmented focus detected. Sequence, do not add. One thing at a time is the leverage move here.',
  'financial-pressure': 'Financial pressure is real. Bias toward low-cost, high-signal experiments. No capital-intensive recommendations.',
  'family-obligations': 'Family obligations constrain available time. Adjust time estimates and scope accordingly — do not ignore this constraint.',
  'learning-load': 'User is still building foundational competency. Avoid advanced multi-step strategy until basics are demonstrated.',
  'unstable-environment': 'Income or employment is unstable. Delay high-commitment moves until the base is stabilized. Stability unlocks everything else.',
  'unrealistic-timeline': 'The stated timeline compresses real risk. Name the timeline gap without dismissing the ambition — surface what is realistically achievable inside it.',
};

const SEQUENCING_GUIDANCE: Record<SequencingError, string> = {
  'premature-scaling': 'Scaling before validation amplifies a flawed assumption. Prove unit economics or distribution first, then scale.',
  'premature-automation': 'Automating an unproven process embeds the wrong process permanently. Do it manually until the model works, then systematize.',
  'premature-branding': 'Branding before validation is aesthetic spending on an unproven idea. Identity follows proof of demand.',
  'premature-hiring': 'Hiring before revenue or validated model creates fixed cost against an unproven bet. Prove one core metric first.',
  'planning-before-validation': 'More planning will not reduce uncertainty here. The next move is evidence, not strategy. One conversation beats another framework.',
  'building-before-distribution': 'Building without a customer channel is building in the dark. Distribution strategy should precede or parallel product work.',
  'optimizing-before-proving': 'Optimizing an unproven product is misallocated effort. Find proof first, then polish what is working.',
};

export function buildExecutionCapacityInstruction(
  problem: string,
  history: Array<{ role: string; content: string }>,
  decisionHistory?: DecisionMemoryEntry[],
): string {
  const recentUser = history.filter((t) => t.role === 'user').slice(-5).map((t) => t.content).join(' ');
  const fullText = `${problem} ${recentUser}`;

  const mode = detectExecutionMode(problem, history);
  const overloadSignals = detectOverloadSignals(fullText);
  const sequencingErrors = detectSequencingErrors(fullText);
  const concurrentGoals = detectConcurrentGoals(fullText);
  const hasOvercomplexity = detectOvercomplexity(fullText);

  // History signals — weight unresolved backlog and repeated failures
  let unresolvedOldCount = 0;
  let repeatedFailures = false;
  if (decisionHistory && decisionHistory.length > 0) {
    const real = decisionHistory.filter((e) => !e.blueprint?.isDemo);
    const now = Date.now();
    unresolvedOldCount = real.filter((e) => {
      if (e.outcome) return false;
      const created = new Date(e.createdAt ?? e.timestamp).getTime();
      return Number.isFinite(created) && now - created > 30 * 86_400_000;
    }).length;
    const recentWeak = real.slice(0, 10).filter((e) => {
      const status = e.outcomeStatus ?? e.outcome?.outcomeStatus;
      return status === 'worse' || (e.outcome?.scoreAccuracy ?? 100) <= 35;
    });
    repeatedFailures = recentWeak.length >= 2;
  }

  const hasPriorityCollision = concurrentGoals.length >= 3;
  const hasDualGoalTension = concurrentGoals.length === 2;
  const hasHistorySignal = unresolvedOldCount >= 2 || repeatedFailures;
  const isInterestingMode = mode !== 'planning'; // 'planning' is the default; not informative alone

  // Only emit if there is meaningful signal to add
  const hasSignal =
    overloadSignals.length > 0 ||
    sequencingErrors.length > 0 ||
    hasPriorityCollision ||
    hasOvercomplexity ||
    hasHistorySignal ||
    isInterestingMode;

  if (!hasSignal) return '';

  const lines: string[] = [
    'EXECUTION CAPACITY INTELLIGENCE:',
    'Apply this quietly. Do not label the user, expose a score, or name this system. Do not use consultant framing.',
    'Tone: calm, practical, observant — like a trusted operator who has seen this constraint before.',
    '',
  ];

  // Execution mode
  lines.push(`Detected execution mode: ${mode}.`);
  lines.push(MODE_GUIDANCE[mode]);
  lines.push('');

  // Overload signals
  if (overloadSignals.length > 0) {
    const labels = overloadSignals.map((s) => s.replace(/-/g, ' ')).join(', ');
    lines.push(`Capacity constraint signals detected: ${labels}.`);
    for (const signal of overloadSignals) {
      lines.push(`- ${OVERLOAD_GUIDANCE[signal]}`);
    }
    lines.push('Adapt advice scope and ambition to real available bandwidth, not ideal bandwidth. Constraints are not excuses — they are inputs.');
    lines.push('');
  }

  // Priority collision
  if (hasPriorityCollision) {
    lines.push(`Priority collision: ${concurrentGoals.slice(0, 3).join(', ')} are all active simultaneously.`);
    lines.push('Executing these in parallel will likely degrade all of them. Identify which one unlocks or de-risks the others and recommend sequencing from there.');
    lines.push('Natural framing: "You are moving three major things at once. One of them should probably become secondary for 60–90 days." Do not moralize — name the tradeoff and the sequence.');
    lines.push('');
  } else if (hasDualGoalTension) {
    lines.push(`Dual-goal signal: ${concurrentGoals.join(' + ')} are running simultaneously. If resource tension appears in this conversation, name the sequencing tradeoff directly.`);
    lines.push('');
  }

  // Sequencing errors
  if (sequencingErrors.length > 0) {
    lines.push('Sequencing error detected — the user may be operating out of order:');
    for (const error of sequencingErrors) {
      lines.push(`- ${error.replace(/-/g, ' ')}: ${SEQUENCING_GUIDANCE[error]}`);
    }
    lines.push('Redirect to the earlier-stage action that should happen first. Frame it as leverage, not correction. The goal is not to stop the user — it is to sequence them correctly.');
    lines.push('');
  }

  // Overcomplexity
  if (hasOvercomplexity) {
    lines.push('Overcomplexity signal: the user may be adding systems, tools, or layers before the core is proven.');
    lines.push('Recommend strategic simplification: remove one thing, not add one. The best next move is often reducing complexity, not increasing it.');
    lines.push('Natural framing: "Before adding another layer, the question is whether the core works. What is the simplest version that would give you real signal?"');
    lines.push('');
  }

  // History-based signals
  if (unresolvedOldCount >= 2) {
    lines.push(`Unresolved backlog signal: ${unresolvedOldCount} prior decisions are unresolved and aging. Before adding new commitments, surface whether the open loops are already consuming capacity.`);
    lines.push('');
  }
  if (repeatedFailures) {
    lines.push('Repeated underperformance signal: multiple prior decisions did not land as expected. Before recommending strong commitment, surface what is concretely different this time.');
    lines.push('');
  }

  lines.push('Response discipline: do not recommend doing everything. Recommend the one move with the most leverage or the one constraint that, if removed, unlocks progress. Hustle-culture framing ("you can do it all") is off-brand and actively unhelpful here.');

  // Collapse consecutive blank lines
  return lines.filter((line, i, arr) => !(line === '' && (arr[i - 1] === '' || i === 0))).join('\n');
}
