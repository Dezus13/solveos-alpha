import type { DecisionMemoryEntry } from './types';

type LifeDecisionCategory =
  | 'business-launch'
  | 'job-transition'
  | 'relocation'
  | 'relationship'
  | 'health'
  | 'learning'
  | 'financial'
  | 'long-term-goal';

type DecisionStage =
  | 'planning'
  | 'hesitation'
  | 'execution'
  | 'burnout'
  | 'recovery'
  | 'scaling';

interface ClassifiedDecision {
  entry: DecisionMemoryEntry;
  category: LifeDecisionCategory;
  stage: DecisionStage;
  daysAgo: number;
  commitment: string | null;
  resolved: boolean;
}

// Ordered: most specific first to avoid misclassification
const CATEGORY_PATTERNS: Array<{ category: LifeDecisionCategory; pattern: RegExp }> = [
  {
    category: 'business-launch',
    pattern: /\b(launch|startup|mvp|saas|company|co-?found|found[ei]r|side.?project|agency|freelanc|product.?idea|start.?(?:a )?business)\b/i,
  },
  {
    category: 'job-transition',
    pattern: /\b(quit|resign|leave (?:my |the )?job|fired|laid.?off|job offer|new job|switch (?:jobs?|careers?)|leave (?:my |the )?company|promotion|career change|career move)\b/i,
  },
  {
    category: 'relocation',
    pattern: /\b(mov(?:e|ing) to|relocat|new city|new country|apartment.?hunt|abroad|emigrat|immigrat|expat)\b/i,
  },
  {
    category: 'relationship',
    pattern: /\b(relationship|partner|marriage|divorce|break.?up|dating|romantic|proposal|wedding|separation|breakup)\b/i,
  },
  {
    category: 'health',
    pattern: /\b(health|fitness|diet|surgery|doctor|therap(?:y|ist)|workout|medical|treatment|medication|weight loss|exercise routine)\b/i,
  },
  {
    category: 'learning',
    pattern: /\b(course|learn(?:ing)?|new skill|degree|bootcamp|certification|study|education|training|school|university|program)\b/i,
  },
  {
    category: 'financial',
    pattern: /\b(invest|debt|loan|funding|savings|crypto|stock|money|raise capital|mortgage|equity|budget|financial risk)\b/i,
  },
  {
    category: 'long-term-goal',
    pattern: /\b(vision|5.?year|five.?year|life.?plan|purpose|life goal|long.?term|mission|direction|where i want to be)\b/i,
  },
];

// Ordered: highest confidence first — a scaling signal beats a planning signal
const STAGE_PATTERNS: Array<{ stage: DecisionStage; pattern: RegExp }> = [
  {
    stage: 'scaling',
    pattern: /\b(grow(?:ing)?|scal(?:e|ing)|doubl(?:e|ing)|expand(?:ing)?|hire|series [abcde]|next level|10x|grow the)\b/i,
  },
  {
    stage: 'burnout',
    pattern: /\b(burn(?:ed|t)?.?out|exhausted|can'?t (?:continue|keep going)|worn out|giving up on|done with|too tired)\b/i,
  },
  {
    stage: 'recovery',
    pattern: /\b(recov(?:er|ering)|getting back|start(?:ing)? over|rebuild(?:ing)?|restart(?:ing)?|pivot(?:ing)?|reset)\b/i,
  },
  {
    stage: 'execution',
    pattern: /\b(i (?:started|launched|shipped|quit|moved|signed|built|joined|left)|working on it|already|in progress|deployed|went live|just (?:launched|started|quit))\b/i,
  },
  {
    stage: 'hesitation',
    pattern: /\b(not sure|scared|afraid|worried|can'?t decide|not ready|still thinking|maybe|on the fence|second.?guess)\b/i,
  },
  {
    stage: 'planning',
    pattern: /\b(thinking (?:about|of)|consider(?:ing)?|planning to|should i|what if|deciding|weighing|exploring)\b/i,
  },
];

const STAGE_RANK: Record<DecisionStage, number> = {
  planning: 0,
  hesitation: 1,
  execution: 2,
  burnout: 3,
  recovery: 4,
  scaling: 5,
};

const CATEGORY_LABEL: Record<LifeDecisionCategory, string> = {
  'business-launch': 'business launch',
  'job-transition': 'career transition',
  'relocation': 'relocation',
  'relationship': 'relationship',
  'health': 'health',
  'learning': 'learning commitment',
  'financial': 'financial decision',
  'long-term-goal': 'long-term goal',
};

function classifyCategory(text: string): LifeDecisionCategory | null {
  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return null;
}

function classifyStage(text: string): DecisionStage {
  for (const { stage, pattern } of STAGE_PATTERNS) {
    if (pattern.test(text)) return stage;
  }
  return 'planning';
}

function extractCommitment(text: string): string | null {
  const patterns = [
    /\bi(?:'ll| will| am going to| plan to) ([^.!?\n]{5,70}) (?:by|in|within|this) ([^.!?\n]{3,30})/i,
    /(?:my|the) (?:plan|goal|target) is to ([^.!?\n]{5,70}) (?:by|in|within|this) ([^.!?\n]{3,30})/i,
    /(?:planning|going) to ([^.!?\n]{5,60}) (?:by|in|within|this) ([^.!?\n]{3,30})/i,
    /\bi(?:'ll| will) ([^.!?\n]{5,60}) (?:next week|this week|next month|this month|tomorrow)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const commitment = match.slice(1).join(' ').replace(/\s+/g, ' ').trim();
      return commitment.slice(0, 90);
    }
  }
  return null;
}

function daysAgo(isoString: string): number {
  const created = new Date(isoString).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.round((Date.now() - created) / 86_400_000));
}

function isHighSignalLifeDecision(problem: string): boolean {
  return CATEGORY_PATTERNS.some(({ pattern }) => pattern.test(problem));
}

function classifyEntry(entry: DecisionMemoryEntry): ClassifiedDecision | null {
  const problem = entry.problem ?? '';
  const category = classifyCategory(problem);
  if (!category) return null;

  const fullText = [
    problem,
    entry.blueprint?.recommendation ?? '',
    entry.blueprint?.hiddenPain ?? '',
  ].join(' ');

  const stage = classifyStage(fullText);
  const commitment = extractCommitment(problem);
  const age = daysAgo(entry.timestamp ?? entry.createdAt ?? new Date().toISOString());
  const resolved = !!(
    entry.outcome?.actualOutcome &&
    entry.outcomeStatus &&
    entry.outcomeStatus !== 'unknown'
  );

  return { entry, category, stage, daysAgo: age, commitment, resolved };
}

interface LoopSignal {
  detected: boolean;
  category: LifeDecisionCategory | null;
  count: number;
  oldestDaysAgo: number;
  dominantStage: DecisionStage | null;
}

function detectPlanningLoop(decisions: ClassifiedDecision[], currentCategory: LifeDecisionCategory | null): LoopSignal {
  if (!currentCategory) return { detected: false, category: null, count: 0, oldestDaysAgo: 0, dominantStage: null };

  const relevant = decisions.filter(
    (d) => d.category === currentCategory && !d.resolved && d.daysAgo <= 180,
  );
  if (relevant.length < 2) return { detected: false, category: null, count: 0, oldestDaysAgo: 0, dominantStage: null };

  const stuckStages: DecisionStage[] = ['planning', 'hesitation'];
  const stuckCount = relevant.filter((d) => stuckStages.includes(d.stage)).length;
  const oldest = Math.max(...relevant.map((d) => d.daysAgo));
  const stageCounts = relevant.reduce<Partial<Record<DecisionStage, number>>>((acc, d) => {
    acc[d.stage] = (acc[d.stage] ?? 0) + 1;
    return acc;
  }, {});
  const dominantStage = (Object.entries(stageCounts) as Array<[DecisionStage, number]>)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const loopDetected =
    stuckCount >= 2 ||
    (relevant.length >= 3 && oldest >= 21) ||
    (relevant.length >= 2 && oldest >= 45 && stuckCount >= 1);

  return {
    detected: loopDetected,
    category: currentCategory,
    count: relevant.length,
    oldestDaysAgo: oldest,
    dominantStage,
  };
}

function buildStageEvolutionNote(current: ClassifiedDecision, prior: ClassifiedDecision): string {
  const currentRank = STAGE_RANK[current.stage];
  const priorRank = STAGE_RANK[prior.stage];

  if (current.stage === prior.stage) return '';

  if (currentRank > priorRank && currentRank >= STAGE_RANK['execution']) {
    return `The user moved from ${prior.stage} to ${current.stage} on their ${CATEGORY_LABEL[current.category]}. Adapt advice to the current stage — operational specifics over decision framing.`;
  }
  if (currentRank < priorRank) {
    return `Possible regression: the user was at ${prior.stage} and is now back at ${current.stage} on their ${CATEGORY_LABEL[current.category]}. Address the setback directly without dramatizing it.`;
  }
  return '';
}

export function buildLongitudinalMemoryInstruction(
  problem: string,
  history: DecisionMemoryEntry[],
): string {
  if (history.length === 0) return '';

  const realHistory = history.filter((e) => !e.blueprint?.isDemo);
  if (realHistory.length === 0) return '';

  // Only process high-signal life decisions — skip trivial chat entries
  const classified = realHistory
    .filter((e) => isHighSignalLifeDecision(e.problem ?? ''))
    .map(classifyEntry)
    .filter((d): d is ClassifiedDecision => d !== null)
    .sort((a, b) => a.daysAgo - b.daysAgo); // most recent first

  if (classified.length === 0) return '';

  const currentCategory = classifyCategory(problem);
  const currentStage = classifyStage(problem);

  // Find decisions related to the current problem
  const related = currentCategory
    ? [
        ...classified.filter((d) => d.category === currentCategory),
        ...classified.filter((d) => d.category !== currentCategory),
      ].slice(0, 3)
    : classified.slice(0, 3);

  if (related.length === 0) return '';

  const loop = detectPlanningLoop(classified, currentCategory);

  const lines: string[] = [
    'LONGITUDINAL DECISION INTELLIGENCE:',
    'Use only when it genuinely improves this specific answer. Do not force references.',
    'Tone: a trusted advisor who remembers — not an app that tracks. Never say "I noticed", "I tracked", "based on your history", or "you have a pattern of".',
    '',
  ];

  // Timeline of key prior decisions
  lines.push('Prior high-signal life decisions (most recent first):');
  for (const d of related.slice(0, 3)) {
    const age =
      d.daysAgo === 0 ? 'today'
      : d.daysAgo === 1 ? 'yesterday'
      : d.daysAgo < 7 ? `${d.daysAgo} days ago`
      : d.daysAgo < 30 ? `${Math.round(d.daysAgo / 7)} weeks ago`
      : d.daysAgo < 365 ? `${Math.round(d.daysAgo / 30)} months ago`
      : `over a year ago`;
    const verdict = (d.entry.blueprint?.recommendation ?? '').slice(0, 80);
    const commitmentNote = d.commitment ? ` Commitment made: "${d.commitment}".` : '';
    const outcomeNote = d.resolved ? ' (outcome logged)' : d.daysAgo > 60 ? ' (no outcome logged yet)' : '';
    lines.push(`- ${age} | ${CATEGORY_LABEL[d.category]} | stage: ${d.stage} | verdict: ${verdict}${commitmentNote}${outcomeNote}`);
  }
  lines.push('');

  // Stage evolution signal
  const sameCategory = classified.filter((d) => d.category === currentCategory);
  if (sameCategory.length >= 2) {
    const stageNote = buildStageEvolutionNote(
      { ...sameCategory[0], stage: currentStage },
      sameCategory[1],
    );
    if (stageNote) {
      lines.push(`Stage evolution: ${stageNote}`);
      lines.push('');
    }
  }

  // Planning loop detection
  if (loop.detected) {
    const categoryLabel = loop.category ? CATEGORY_LABEL[loop.category] : 'similar topic';
    const timeframe = loop.oldestDaysAgo < 30
      ? 'the past few weeks'
      : loop.oldestDaysAgo < 90
        ? 'a few months'
        : 'several months';
    lines.push(
      `Planning loop signal: a ${categoryLabel} decision has appeared ${loop.count + 1} times over ${timeframe} without resolution.`,
    );
    lines.push(
      'If directly relevant, redirect to the smallest decision that breaks the loop. Frame it as a strategic observation, not a diagnosis.',
    );
    lines.push(
      'Natural framing examples: "You\'ve been circling this for a while — what one test would give you enough signal to decide?" / "The analysis isn\'t the missing piece. What\'s the first reversible step?"',
    );
    lines.push('');
  }

  // Outstanding commitment follow-up
  const openCommitment = related.find(
    (d) => d.commitment && !d.resolved && d.daysAgo >= 14 && d.daysAgo <= 150,
  );
  if (openCommitment) {
    lines.push(
      `Outstanding commitment: ${openCommitment.daysAgo} days ago, the user committed to "${openCommitment.commitment}". No outcome has been recorded.`,
    );
    lines.push(
      'If the current question relates to this, reference it naturally — not as a reminder, but as context that shapes the advice.',
    );
    lines.push(
      'Natural framing: "You were planning to [X]. What shifted?" or factor it silently into confidence and next steps without naming it.',
    );
    lines.push('');
  }

  // Cross-decision risk stacking
  const openFinancial = classified.find(
    (d) => d.category === 'financial' && !d.resolved && d.daysAgo <= 90,
  );
  if (
    openFinancial &&
    currentCategory &&
    ['business-launch', 'financial'].includes(currentCategory) &&
    currentCategory !== 'financial'
  ) {
    lines.push(
      'Cross-decision signal: there is an open financial decision from the past 90 days. If the current decision stacks additional financial exposure, surface the combined risk as a tradeoff — not a warning.',
    );
    lines.push('');
  }

  lines.push(
    'Instruction: weave at most one reference naturally into the answer. Do not list prior decisions to the user. Do not explain that you are referencing history. Let it feel like good memory, not surveillance.',
  );

  return lines.filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n');
}
