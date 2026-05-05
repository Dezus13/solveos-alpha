import type { DecisionContext, DecisionMemoryEntry } from './types';

type ExecutionReliability = 'high execution reliability' | 'low follow-through' | 'inconsistent momentum' | 'fast operator tendencies';

function compact(value: string, limit = 180): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? `${clean.slice(0, limit - 3).trim()}...` : clean;
}

function includesAny(text: string, terms: RegExp[]): boolean {
  return terms.some((term) => term.test(text));
}

function isRealEntry(entry: DecisionMemoryEntry): boolean {
  return !entry.blueprint.isDemo || Boolean(entry.outcome);
}

function isOldUnresolved(entry: DecisionMemoryEntry, now = Date.now()): boolean {
  if (entry.outcome) return false;
  const created = new Date(entry.createdAt || entry.timestamp).getTime();
  if (!Number.isFinite(created)) return false;
  return now - created > 14 * 86_400_000;
}

function outcomeText(entry: DecisionMemoryEntry): string {
  return [
    entry.problem,
    entry.blueprint.recommendation,
    entry.outcome?.actualOutcome,
    ...(entry.outcome?.lessons || []),
    ...(entry.outcome?.recommendations || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function classifyOutcome(entry: DecisionMemoryEntry): 'worked' | 'failed' | 'delayed' | 'avoided' | 'partially executed' | 'unresolved' {
  const text = outcomeText(entry);
  const status = entry.outcomeStatus || entry.outcome?.outcomeStatus;

  if (!entry.outcome) return isOldUnresolved(entry) ? 'delayed' : 'unresolved';
  if (includesAny(text, [/avoid/, /ignored/, /didn'?t do/, /not done/, /skipped/, /abandon/, /gave up/, /отлож/, /избеж/, /не сделал/, /не сделала/, /заброс/, /vermeid/, /nicht gemacht/, /abgebrochen/])) {
    return 'avoided';
  }
  if (includesAny(text, [/partial/, /partly/, /half/, /some/, /частич/, /наполовину/, /teilweise/]) || status === 'expected') {
    return 'partially executed';
  }
  if (includesAny(text, [/delay/, /too early/, /waiting/, /later/, /postpone/, /позже/, /рано/, /жду/, /отлож/, /später/, /spaeter/, /warte/]) || status === 'unknown') {
    return 'delayed';
  }
  if (status === 'better' || (entry.outcome?.scoreAccuracy ?? 0) >= 70) return 'worked';
  if (status === 'worse' || (entry.outcome?.scoreAccuracy ?? 100) <= 35) return 'failed';
  return 'partially executed';
}

function inferExecutionReliability(entries: DecisionMemoryEntry[]): ExecutionReliability | '' {
  if (entries.length < 3) return '';

  const categories = entries.map(classifyOutcome);
  const resolved = categories.filter((category) => category !== 'unresolved');
  if (resolved.length < 2) return '';

  const worked = resolved.filter((category) => category === 'worked').length;
  const weak = resolved.filter((category) => category === 'failed' || category === 'avoided' || category === 'delayed').length;
  const partial = resolved.filter((category) => category === 'partially executed').length;

  const outcomeLags = entries
    .filter((entry) => entry.outcome)
    .map((entry) => {
      const start = new Date(entry.createdAt || entry.timestamp).getTime();
      const end = new Date(entry.outcome!.timestamp).getTime();
      return Number.isFinite(start) && Number.isFinite(end) ? (end - start) / 86_400_000 : Number.NaN;
    })
    .filter(Number.isFinite);

  const avgLag = outcomeLags.length > 0
    ? outcomeLags.reduce((sum, value) => sum + value, 0) / outcomeLags.length
    : 999;

  if (worked >= 2 && worked >= weak + partial && avgLag <= 14) return 'fast operator tendencies';
  if (worked >= 3 && worked >= resolved.length * 0.6) return 'high execution reliability';
  if (weak >= 2 && weak >= worked) return 'low follow-through';
  return 'inconsistent momentum';
}

function buildOutcomeSummary(entries: DecisionMemoryEntry[]): string[] {
  return entries
    .filter((entry) => entry.outcome || isOldUnresolved(entry))
    .slice(0, 5)
    .map((entry) => {
      const category = classifyOutcome(entry);
      const lesson = entry.outcome?.lessons?.[0] || entry.learning?.learningInsight || entry.outcome?.actualOutcome || 'No logged lesson.';
      return `- ${category}: "${compact(entry.problem, 90)}" -> ${compact(lesson, 140)}`;
    });
}

function detectLearningPatterns(entries: DecisionMemoryEntry[], problem: string): string[] {
  const patterns: string[] = [];
  const real = entries.filter(isRealEntry);
  const categories = real.map(classifyOutcome);
  const unresolvedOld = real.filter((entry) => isOldUnresolved(entry)).length;
  const weakCount = categories.filter((category) => category === 'failed' || category === 'avoided' || category === 'delayed').length;
  const workedCount = categories.filter((category) => category === 'worked').length;
  const text = `${real.map(outcomeText).join(' ')} ${problem}`.toLowerCase();

  if (real.length >= 4 && (unresolvedOld >= 2 || weakCount >= 3)) {
    patterns.push('User may overplan or reopen decisions faster than actions are completed. Compress advice into one near-term execution proof.');
  }

  if (workedCount >= 2 && includesAny(text, [/experiment/, /test/, /validate/, /ship/, /launch/, /интервью/, /тест/, /провер/, /запуст/, /experiment/, /testen/, /validier/, /gestartet/])) {
    patterns.push('Fast experiments have produced useful outcomes before. Favor rapid validation when the current downside is contained.');
  }

  if (weakCount >= 2 && includesAny(text, [/distribution/, /sales/, /customers?/, /market/, /канал/, /дистриб/, /продаж/, /клиент/, /рынок/, /vertrieb/, /kunden/, /markt/])) {
    patterns.push('Distribution and customer access have been a recurring weak point. Surface go-to-market proof earlier than product detail.');
  }

  const similarFailures = real.filter((entry) => {
    const entryText = outcomeText(entry);
    return classifyOutcome(entry) === 'failed' && problem.toLowerCase().split(/\s+/).some((word) => word.length > 5 && entryText.includes(word));
  });
  if (similarFailures.length >= 1) {
    patterns.push('A similar prior decision underperformed. Ask what evidence is different now before recommending a stronger commitment.');
  }

  return patterns.slice(0, 4);
}

export function buildOutcomeLearningInstruction(
  history: DecisionMemoryEntry[],
  problem: string,
  context?: DecisionContext
): string {
  const real = history
    .filter(isRealEntry)
    .filter((entry) => {
      if (!context?.domain) return true;
      return !entry.context?.domain || entry.context.domain === context.domain || entry.outcome;
    })
    .slice(0, 20);

  const outcomeEntries = real.filter((entry) => entry.outcome || isOldUnresolved(entry));
  if (outcomeEntries.length < 2) return '';

  const reliability = inferExecutionReliability(real);
  const patterns = detectLearningPatterns(real, problem);
  const summaries = buildOutcomeSummary(outcomeEntries);

  if (!reliability && patterns.length === 0 && summaries.length === 0) return '';

  return [
    'DECISION OUTCOME LEARNING:',
    'Use this as quiet behavioral calibration from prior decisions and logged outcomes.',
    reliability ? `Execution reliability signal: ${reliability}. Use only to adapt guidance style; never expose this label or any score.` : '',
    summaries.length ? 'Recent outcome memory:' : '',
    ...summaries,
    patterns.length ? 'Adaptation rules:' : '',
    ...patterns.map((pattern) => `- ${pattern}`),
    'Response evolution: if the user has shown follow-through, assume more capability and move toward advanced leverage; if follow-through is weak, compress advice into one concrete action and one proof signal.',
    'Occasionally let the answer feel like continuity, e.g. "Last time, the useful signal came from moving faster, not thinking longer." Do not say you tracked behavior.',
    'Avoid psychological profiling, therapy framing, manipulation, deterministic judgments, labels, dashboards, or scores.',
  ].filter(Boolean).join('\n');
}
