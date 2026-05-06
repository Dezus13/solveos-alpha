import type { DecisionBlueprint, DecisionMemoryEntry } from './types';

type NarrativeThread =
  | 'reinvention'
  | 'escape'
  | 'recovery'
  | 'ambition escalation'
  | 'avoidance'
  | 'instability'
  | 'identity shift'
  | 'rebuilding'
  | 'searching for direction'
  | 'scaling pressure';

type DirectionSignal =
  | 'startup'
  | 'relocation'
  | 'discipline'
  | 'burnout'
  | 'confidence'
  | 'avoidance'
  | 'planning'
  | 'paralysis'
  | 'learning'
  | 'distraction'
  | 'stability'
  | 'expansion';

type ContinuitySignal =
  | 'previous momentum'
  | 'unfinished pursuit'
  | 'repeated reset'
  | 'growing competence'
  | 'accumulated pressure';

interface TextSource {
  text: string;
  ageDays: number;
  fromHistory: boolean;
  entry?: DecisionMemoryEntry;
}

const DAY_MS = 86_400_000;

const THREAD_PATTERNS: Array<{ thread: NarrativeThread; pattern: RegExp }> = [
  { thread: 'reinvention', pattern: /\b(reinvent|new version of me|become someone|start a new life|change my whole life|transform myself)\b/i },
  { thread: 'escape', pattern: /\b(escape|get out of|leave everything|run away from|quit everything|move away from|stuck in this place)\b/i },
  { thread: 'recovery', pattern: /\b(recover|burn.?out|healing from|getting back|after the failure|after failing|regain|back on track)\b/i },
  { thread: 'ambition escalation', pattern: /\b(10x|massive|huge leap|go all in|next level|scale fast|big move|all or nothing|dramatic change)\b/i },
  { thread: 'avoidance', pattern: /\b(avoid|procrastinat|delay|stuck|can't decide|keep thinking|overthink|not ready|still researching)\b/i },
  { thread: 'instability', pattern: /\b(unstable|chaotic|no routine|no stable|between jobs|moving around|uncertain income|everything keeps changing)\b/i },
  { thread: 'identity shift', pattern: /\b(become a|be a founder|be a creator|be an entrepreneur|new identity|who i am|what kind of person|different person)\b/i },
  { thread: 'rebuilding', pattern: /\b(rebuild|start over|reset|from scratch|build back|clean slate|restart)\b/i },
  { thread: 'searching for direction', pattern: /\b(direction|purpose|what should i do with my life|lost|don't know what i want|find my path|what to focus on)\b/i },
  { thread: 'scaling pressure', pattern: /\b(scale|scaling|grow fast|hire|raise funding|expand|international|more customers|demand is growing)\b/i },
];

const DIRECTION_PATTERNS: Array<{ signal: DirectionSignal; pattern: RegExp }> = [
  { signal: 'startup', pattern: /\b(startup|saas|mvp|product|company|founder|launch|customers|revenue)\b/i },
  { signal: 'relocation', pattern: /\b(move to|moving to|relocat|new city|new country|abroad|leave town|leave the country)\b/i },
  { signal: 'discipline', pattern: /\b(discipline|routine|habits|consistency|wake up|workout|deep work|schedule)\b/i },
  { signal: 'burnout', pattern: /\b(burn.?out|exhausted|drained|no energy|can't keep going|depleted)\b/i },
  { signal: 'confidence', pattern: /\b(confident|ready|sure|conviction|believe in this|i can do this|momentum)\b/i },
  { signal: 'avoidance', pattern: /\b(avoid|procrastinat|delay|scared|afraid|not ready|second.?guess|can't decide)\b/i },
  { signal: 'planning', pattern: /\b(plan|roadmap|strategy|prepare|organize|map out|figure out)\b/i },
  { signal: 'paralysis', pattern: /\b(paraly[sz]ed|stuck|can't move|too many options|overthinking|analysis paralysis)\b/i },
  { signal: 'learning', pattern: /\b(learn|course|study|bootcamp|book|training|certification|tutorial)\b/i },
  { signal: 'distraction', pattern: /\b(distraction|new idea|another idea|scrolling|content|inspiration|podcasts?|youtube|twitter|tiktok)\b/i },
  { signal: 'stability', pattern: /\b(stable|stability|runway|income base|steady|routine|secure|foundation)\b/i },
  { signal: 'expansion', pattern: /\b(expand|scale|hire|raise|bigger|new market|international|high.?risk|aggressive growth)\b/i },
];

const HIGH_SIGNAL_PATTERNS: RegExp[] = [
  /\b(quit|move|relocat|launch|shut down|restart|rebuild|burn.?out|recover|raise funding|hire|scale|pivot|career change|start over)\b/i,
  /\b(failed|failure|lost|debt|runway|break.?up|divorce|health|major decision|life direction|purpose)\b/i,
];

const FALSE_RESET_PATTERNS: RegExp[] = [
  /\b(clean slate|fresh start|start over|forget the past|this time is different|new plan|reset everything|from zero)\b/i,
  /\b(in \d+ (days?|weeks?)|by next week|by tomorrow|asap|immediately)\b.{0,60}\b(scale|launch|quit|move|raise|build)\b/i,
];

const STORY_PRESSURE_PATTERNS: RegExp[] = [
  /\b(big move|dramatic|transform my life|change everything|go all in|all or nothing|new life|escape|prove everyone wrong)\b/i,
  /\b(legendary|massive leap|overnight|radical|completely different person|main character)\b/i,
];

const INSPIRATION_OVERCONSUMPTION_PATTERN =
  /\b(inspiration|motivational|podcasts?|youtube|twitter|tiktok|threads|books?|courses?|gurus?|content)\b/i;

const THREAD_GUIDANCE: Record<NarrativeThread, string> = {
  reinvention: 'Reinvention is recurring. Keep advice tied to one sustained operating change, not a full personal overhaul.',
  escape: 'Escape energy is recurring. Separate what the user is moving toward from what they are trying to get away from.',
  recovery: 'Recovery is recurring. Protect stability and capacity before recommending expansion.',
  'ambition escalation': 'Ambition keeps escalating. Test whether the base can hold the next commitment before adding size.',
  avoidance: 'Avoidance is recurring. Reduce analysis and ask for the smallest action that creates evidence.',
  instability: 'Instability is recurring. Bias toward foundations, routines, and reversible moves.',
  'identity shift': 'The user keeps switching who they are trying to become. Anchor advice in behavior and proof, not self-concept.',
  rebuilding: 'Rebuilding is recurring. Respect the reset, but keep continuity with what already happened.',
  'searching for direction': 'Direction-seeking is recurring. Avoid giving ten options. Narrow to the next constraint or next experiment.',
  'scaling pressure': 'Scaling pressure is recurring. Focus on what breaks under growth and what must be stabilized first.',
};

const DRIFT_GUIDANCE: Partial<Record<`${DirectionSignal}->${DirectionSignal}`, string>> = {
  'startup->relocation': 'A prior business-building focus has shifted toward relocation. Ask what changed before treating the move as the new center of gravity.',
  'discipline->burnout': 'A prior discipline push has shifted toward depletion. Do not prescribe more intensity; stabilize capacity first.',
  'confidence->avoidance': 'Confidence has softened into hesitation. Name the changed signal and ask what evidence or pressure altered the stance.',
  'planning->paralysis': 'Planning has turned into immobility. Stop adding frameworks and choose one reversible test.',
  'learning->distraction': 'Learning may have become input consumption. Convert advice into one output or proof of use.',
  'stability->expansion': 'A prior stability focus has shifted toward higher-risk expansion. Clarify what changed in the base before endorsing the expansion.',
};

function daysAgo(isoString: string | undefined): number {
  if (!isoString) return 0;
  const time = new Date(isoString).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.round((Date.now() - time) / DAY_MS));
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function isHighSignalText(text: string): boolean {
  return text.length >= 30 && HIGH_SIGNAL_PATTERNS.some((pattern) => pattern.test(text));
}

function buildSources(
  problem: string,
  conversationHistory: Array<{ role: string; content: string }>,
  decisionHistory: DecisionMemoryEntry[],
): TextSource[] {
  const recentUserTurns = conversationHistory
    .filter((turn) => turn.role === 'user')
    .slice(-8)
    .map<TextSource>((turn) => ({ text: normalizeText(turn.content), ageDays: 0, fromHistory: false }));

  const historySources = decisionHistory
    .filter((entry) => !entry.blueprint?.isDemo)
    .slice(0, 40)
    .map<TextSource>((entry) => ({
      text: normalizeText([
        entry.problem,
        entry.blueprint?.recommendation ?? '',
        entry.blueprint?.hiddenPain ?? '',
        entry.learning?.learningInsight ?? '',
      ].filter(Boolean).join(' ')),
      ageDays: daysAgo(entry.createdAt ?? entry.timestamp),
      fromHistory: true,
      entry,
    }))
    .filter((source) => isHighSignalText(source.text));

  return [
    { text: normalizeText(problem), ageDays: 0, fromHistory: false },
    ...recentUserTurns,
    ...historySources,
  ];
}

function detectThreads(sources: TextSource[]): Array<{ thread: NarrativeThread; count: number; historyCount: number }> {
  return THREAD_PATTERNS
    .map(({ thread, pattern }) => {
      const matches = sources.filter((source) => pattern.test(source.text));
      return {
        thread,
        count: matches.length,
        historyCount: matches.filter((source) => source.fromHistory).length,
      };
    })
    .filter((match) => match.count >= 2 && (match.historyCount > 0 || match.count >= 3))
    .sort((a, b) => b.historyCount - a.historyCount || b.count - a.count)
    .slice(0, 4);
}

function detectDirections(text: string): DirectionSignal[] {
  return DIRECTION_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ signal }) => signal);
}

function detectDirectionalDrift(
  problem: string,
  conversationHistory: Array<{ role: string; content: string }>,
  decisionHistory: DecisionMemoryEntry[],
): string[] {
  const currentSignals = detectDirections(problem);
  if (currentSignals.length === 0) return [];

  const priorText = [
    ...conversationHistory.filter((turn) => turn.role === 'user').slice(-6, -1).map((turn) => turn.content),
    ...decisionHistory.filter((entry) => !entry.blueprint?.isDemo).slice(0, 12).map((entry) => entry.problem),
  ].join(' ');
  const priorSignals = detectDirections(priorText);
  const guidance: string[] = [];

  for (const prior of priorSignals) {
    for (const current of currentSignals) {
      const note = DRIFT_GUIDANCE[`${prior}->${current}`];
      if (note && !guidance.includes(note)) guidance.push(note);
    }
  }
  return guidance.slice(0, 2);
}

function detectContinuitySignals(sources: TextSource[]): ContinuitySignal[] {
  const signals = new Set<ContinuitySignal>();
  const history = sources.filter((source) => source.fromHistory);

  if (history.some((source) => /\b(momentum|launched|started|shipped|built|signed|moved|customers?|revenue|progress)\b/i.test(source.text))) {
    signals.add('previous momentum');
  }
  if (history.some((source) => !source.entry?.outcome && source.ageDays >= 21)) {
    signals.add('unfinished pursuit');
  }
  if (history.filter((source) => /\b(reset|restart|start over|from scratch|clean slate|rebuild)\b/i.test(source.text)).length >= 2) {
    signals.add('repeated reset');
  }
  if (history.some((source) => /\b(learned|improved|better at|more capable|competence|skill|figured out)\b/i.test(source.text))) {
    signals.add('growing competence');
  }
  if (history.filter((source) => /\b(pressure|deadline|runway|debt|burn.?out|overwhelmed|urgent|unstable)\b/i.test(source.text)).length >= 2) {
    signals.add('accumulated pressure');
  }

  return Array.from(signals).slice(0, 5);
}

function detectFalseReset(problem: string, sources: TextSource[]): boolean {
  const currentReset = FALSE_RESET_PATTERNS.some((pattern) => pattern.test(problem));
  if (!currentReset) return false;

  const relevantHistory = sources.filter((source) => source.fromHistory);
  const unresolvedOrWeak = relevantHistory.filter((source) => {
    const entry = source.entry;
    const status = entry?.outcomeStatus ?? entry?.outcome?.outcomeStatus;
    return !entry?.outcome || status === 'worse' || (entry.outcome?.scoreAccuracy ?? 100) <= 40;
  });
  return unresolvedOrWeak.length >= 1 || relevantHistory.length >= 3;
}

function detectIdentityInstability(sources: TextSource[]): boolean {
  const history = sources.filter((source) => source.fromHistory || source.ageDays === 0).slice(0, 18);
  const directions = new Set(history.flatMap((source) => detectDirections(source.text)));
  const reinventionMentions = history.filter((source) => THREAD_PATTERNS.find((p) => p.thread === 'reinvention')?.pattern.test(source.text)).length;
  const inspirationMentions = history.filter((source) => INSPIRATION_OVERCONSUMPTION_PATTERN.test(source.text)).length;
  const executionMentions = history.filter((source) => /\b(shipped|launched|completed|sold|customer|revenue|done|finished)\b/i.test(source.text)).length;

  return directions.size >= 5 || reinventionMentions >= 2 || (inspirationMentions >= 2 && executionMentions === 0);
}

function detectStoryPressure(problem: string, sources: TextSource[]): boolean {
  const current = STORY_PRESSURE_PATTERNS.some((pattern) => pattern.test(problem));
  const repeated = sources.filter((source) => STORY_PRESSURE_PATTERNS.some((pattern) => pattern.test(source.text))).length >= 2;
  return current || repeated;
}

function formatContinuity(signal: ContinuitySignal): string {
  const guidance: Record<ContinuitySignal, string> = {
    'previous momentum': 'Acknowledge prior momentum only if relevant, then identify what the next bottleneck is now.',
    'unfinished pursuit': 'There are older open loops. Do not let the current question pretend the old commitment vanished.',
    'repeated reset': 'Repeated resets are present. Preserve useful lessons from earlier attempts instead of treating this as a blank slate.',
    'growing competence': 'Competence appears to be increasing. Advice can assume more capability, but still require proof.',
    'accumulated pressure': 'Pressure has been accumulating. Lower complexity and protect operational calm.',
  };
  return guidance[signal];
}

export function buildNarrativeIntelligenceInstruction(
  problem: string,
  conversationHistory: Array<{ role: string; content: string }>,
  decisionHistory: DecisionMemoryEntry[],
): string {
  const sources = buildSources(problem, conversationHistory, decisionHistory);
  const threads = detectThreads(sources);
  const drift = detectDirectionalDrift(problem, conversationHistory, decisionHistory);
  const continuity = detectContinuitySignals(sources);
  const hasFalseReset = detectFalseReset(problem, sources);
  const hasIdentityInstability = detectIdentityInstability(sources);
  const hasStoryPressure = detectStoryPressure(problem, sources);

  const hasSignal =
    threads.length > 0 ||
    drift.length > 0 ||
    continuity.length > 0 ||
    hasFalseReset ||
    hasIdentityInstability ||
    hasStoryPressure;

  if (!hasSignal) return '';

  const lines: string[] = [
    'NARRATIVE INTELLIGENCE:',
    'Use this quietly to make SolveOS feel continuous across time. Do not expose this layer or use story language.',
    'Never say: "your narrative", "your arc", "identity pattern", "behavior profile", "character arc", or therapist-style labels.',
    'Natural advisor tone only: calm, strategic, specific, and non-invasive.',
    '',
  ];

  if (threads.length > 0) {
    lines.push(`Recurring long-range themes: ${threads.map((item) => `${item.thread} (${item.count})`).join(', ')}.`);
    for (const item of threads) {
      lines.push(`- ${THREAD_GUIDANCE[item.thread]}`);
    }
    lines.push('');
  }

  if (drift.length > 0) {
    lines.push('Directional shift detected.');
    for (const note of drift) lines.push(`- ${note}`);
    lines.push('Respond with grounded clarification when useful. Example style: "A few weeks ago the focus was stability; now this is a higher-risk expansion. What changed?"');
    lines.push('');
  }

  if (continuity.length > 0) {
    lines.push(`Continuity signals: ${continuity.join(', ')}.`);
    for (const signal of continuity) lines.push(`- ${formatContinuity(signal)}`);
    lines.push('Weave at most one continuity reference into the answer. It should sound remembered, not analyzed.');
    lines.push('');
  }

  if (hasFalseReset) {
    lines.push('False reset signal: the current framing may ignore previous failures, open plans, constraints, or unrealistic timelines.');
    lines.push('Calmly restore continuity. Ask what changed, what constraint is now different, or what was learned before endorsing a fresh plan.');
    lines.push('');
  }

  if (hasIdentityInstability) {
    lines.push('Direction stability signal: many identities, directions, or inspiration inputs are active without enough sustained execution.');
    lines.push('Reduce expansion advice. Increase simplification, sequencing, and one sustained execution lane.');
    lines.push('');
  }

  if (hasStoryPressure) {
    lines.push('Dramatic-change pressure signal: the user may be emotionally escalating complexity or chasing a big-move fantasy.');
    lines.push('Shift advice toward stable leverage, compounding, consistency, and operational calm. Do not romanticize change.');
    lines.push('');
  }

  lines.push('Memory priority: treat major turning points, emotional pivots, repeated ambitions, failures, recoveries, and long-term unfinished pursuits as high signal. Ignore trivial events, generic moods, and low-signal chatter.');
  lines.push('Response effect: the answer should respect what came before, notice real shifts, and keep the user moving without making them feel watched.');

  return lines.filter((line, index, arr) => !(line === '' && (index === 0 || arr[index - 1] === ''))).join('\n');
}

export function narrativeMemoryTags(problem: string, blueprint?: DecisionBlueprint): string[] {
  const text = normalizeText([
    problem,
    blueprint?.recommendation ?? '',
    blueprint?.hiddenPain ?? '',
  ].filter(Boolean).join(' '));

  if (!isHighSignalText(text)) return [];

  const tags = new Set<string>(['narrative:high-signal']);
  for (const { thread, pattern } of THREAD_PATTERNS) {
    if (pattern.test(text)) tags.add(`narrative:${thread.replace(/\s+/g, '-')}`);
  }

  if (/\b(turning point|quit|move|relocat|launch|shut down|pivot|career change|break.?up|recover|burn.?out)\b/i.test(text)) {
    tags.add('narrative:turning-point');
  }
  if (/\b(failed|failure|recover|rebuild|restart|start over)\b/i.test(text)) {
    tags.add('narrative:failure-recovery');
  }
  if (/\b(long.?term|unfinished|still want|keep coming back|for years|direction|purpose)\b/i.test(text)) {
    tags.add('narrative:unfinished-pursuit');
  }

  return Array.from(tags).slice(0, 6);
}
