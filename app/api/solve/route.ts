import { NextResponse } from 'next/server';
import { saveDecision, getDecisionHistory } from '@/lib/memory';
import { getMemoryIntelligenceFromHistory } from '@/lib/memory-graph';
import { computeNetworkIntelligence, calibrateScore, buildCalibrationContext, computeDecisionAccuracy, computeCalibrationScore } from '@/lib/benchmarks';
import { isPlanModeRequest, isReviewModeRequest, semanticVerdictForQuestion, shouldRejectDecisionOutput, detectVerdictLoop, buildForceDiversityInstruction, semanticVerdictExcluding, extractVerdictClass, buildIntentInstruction, enforceIntentRouting, detectSolveRequestIntent, extractLiteralOutput } from '@/lib/semantic-guards';
import { detectInputLanguage } from '@/lib/i18n';
import { buildProfileDirective, applyProfileAdjustments, scoreMessageFor } from '@/lib/profileEngine';
import { computeSessionPressureLevel, buildPressureDirective } from '@/lib/pressureEngine';
import type { CouncilMetrics, CounterfactualPath, DecisionBlueprint, DecisionContext, ExecutionPlanWeek, MilestoneMetric, MilestoneStatus, PreMortemRisk, ScenarioBranch, SecondOrderEffect, SolveRequest, SolveResponse, UserProfileData, WarRoomDebate } from '@/lib/types';

export const dynamic = 'force-dynamic';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readLanguage(body: Partial<SolveRequest> | undefined, problem: string): string {
  const clientLang = typeof body?.language === 'string' ? body.language.trim() : '';
  if (clientLang && clientLang !== 'en' && clientLang !== 'auto') return clientLang;
  // Client didn't detect or defaulted — run server-side detection so the fallback
  // is the actual user input language, never hard-coded English.
  const detected = detectInputLanguage(problem);
  return detected;
}

function readContext(body: Partial<SolveRequest> | undefined): DecisionContext | undefined {
  return isRecord(body?.context) ? body.context as DecisionContext : undefined;
}

function readConversationHistory(body: Partial<SolveRequest> | undefined): Array<{ role: string; content: string }> {
  if (!Array.isArray(body?.conversationHistory)) return [];

  return body.conversationHistory
    .filter((turn) => isRecord(turn) && typeof turn.content === 'string' && turn.content.trim())
    .map((turn) => {
      const typedTurn = turn as { role?: string; content: string };
      return {
        role: typedTurn.role === 'assistant' ? 'assistant' : 'user',
        content: typedTurn.content.trim().replace(/\s+/g, ' ').slice(0, 1200),
      };
    })
    .slice(-12);
}

function readConversationContext(body: Partial<SolveRequest> | undefined): string {
  const turns = readConversationHistory(body);

  if (turns.length === 0) return '';

  return turns
    .map((turn) => {
      const role = turn.role === 'assistant' ? 'Prior SolveOS answer' : 'User';
      return `${role}: ${turn.content}`;
    })
    .join('\n');
}

function readConversationMemory(body: Partial<SolveRequest> | undefined): string {
  const memory = typeof body?.conversationMemory === 'string' ? body.conversationMemory.trim() : '';
  if (!memory) return '';
  return memory
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, 1800);
}

function isContextualFollowUp(problem: string): boolean {
  const text = problem.trim().toLowerCase();
  if (!text) return false;
  if (text.length <= 80) {
    return [
      /^why\??$/,
      /^why not\??$/,
      /^explain (it )?simpler\.?$/,
      /^simpler\.?$/,
      /^what if i fail\??$/,
      /^what if this fails\??$/,
      /^what would you do\??$/,
      /^what would u do\??$/,
      /^what if\b/,
      /^and if\b/,
      /^but if\b/,
      /^почему\??$/,
      /^почему нет\??$/,
      /^объясни проще\.?$/,
      /^проще\.?$/,
      /^а если я провалюсь\??$/,
      /^а если не получится\??$/,
      /^что бы ты сделал\??$/,
      /^что бы ты сделала\??$/,
      /^а если\b/,
      /^и если\b/,
      /^но если\b/,
      /^warum\??$/,
      /^warum nicht\??$/,
      /^einfacher\.?$/,
      /^erklär.*einfacher/,
      /^was wenn ich scheitere\??$/,
      /^was würdest du tun\??$/,
      /^was wuerdest du tun\??$/,
      /^was wenn\b/,
      /^und wenn\b/,
    ].some((pattern) => pattern.test(text));
  }
  return false;
}

function buildConversationMemoryNote(history: Array<{ role: string; content: string }>): string {
  if (history.length === 0) return '';

  const userTurns = history.filter((turn) => turn.role === 'user' && turn.content.trim());
  const assistantTurns = history.filter((turn) => turn.role === 'assistant' && turn.content.trim());
  const lastAssistant = assistantTurns.at(-1)?.content || '';
  const lastUser = userTurns.at(-1)?.content || '';
  const verdict = extractVerdictClass(lastAssistant);
  const repeatedUserThemes = userTurns
    .flatMap((turn) => turn.content.toLowerCase().match(/\b(runway|money|revenue|launch|shutdown|quit|fear|customers|time|team|risk|деньги|запуск|страх|клиенты|время|риск)\b/g) || [])
    .reduce<Record<string, number>>((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
  const themes = Object.entries(repeatedUserThemes)
    .filter(([, count]) => count >= 2)
    .map(([word]) => word)
    .slice(0, 5);

  return [
    'CONVERSATION MEMORY DIRECTIVE:',
    'Treat this as a continuing conversation, not a fresh isolated prompt.',
    lastUser ? `Most recent prior user concern: ${lastUser.slice(0, 500)}` : '',
    verdict ? `Previous answer verdict class: ${verdict}. Repeat it only if new reasoning makes it necessary.` : '',
    themes.length > 0 ? `Repeated user themes: ${themes.join(', ')}.` : '',
    'Do not restate old advice. Answer the new ask, update assumptions, and name what changed.',
  ].filter(Boolean).join('\n');
}

function buildPersistentMemoryInstruction(memory: string): string {
  if (!memory) return '';

  return [
    'PERSISTENT CONVERSATIONAL MEMORY:',
    memory,
    '',
    'Use this memory naturally, only when relevant.',
    'Do not dump the memory back to the user.',
    'Adapt to known goals, fears, constraints, business ideas, prior decisions, and unfinished actions.',
    'If the user has progressed, acknowledge the progression briefly: what changed, what is now the bottleneck, and what advice should no longer be repeated.',
    'Avoid repeating prior warnings or motivational framing unless the current message asks for a recap.',
  ].join('\n');
}

function buildFollowUpInstruction(problem: string, hasHistory: boolean): string {
  if (!hasHistory || !isContextualFollowUp(problem)) return '';

  return [
    'FOLLOW-UP MODE ACTIVE:',
    'The current user message is short and context-dependent.',
    'Resolve pronouns and missing details from the prior conversation before answering.',
    'Do not ask what topic they mean unless the prior thread is genuinely ambiguous.',
    'Answer the follow-up directly, then add only the new reasoning needed.',
  ].join('\n');
}

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function buildResponseStyleInstruction(problem: string, history: Array<{ role: string; content: string }>): string {
  const styles = [
    [
      'RESPONSE STYLE VARIANT: thesis-first.',
      'Open with the answer in one direct sentence, then explain the tradeoff and next action.',
      'Use short paragraphs. Do not use section labels unless clarity requires them.',
    ],
    [
      'RESPONSE STYLE VARIANT: contrast.',
      'Frame the answer around the real choice: what happens if they act versus wait or stop.',
      'Use compact bullets only if they make the contrast sharper.',
    ],
    [
      'RESPONSE STYLE VARIANT: constraint-first.',
      'Start from the hidden constraint, then show how it changes the recommendation.',
      'End with the smallest useful action and the condition that would change your mind.',
    ],
    [
      'RESPONSE STYLE VARIANT: advisor note.',
      'Sound like a calm senior advisor writing a concise private note.',
      'Name the risk respectfully, challenge weak assumptions, and avoid performance language.',
    ],
  ];
  const index = stableHash(`${problem}:${history.length}`) % styles.length;
  return styles[index].join('\n');
}

type UserMode = 'beginner' | 'analytical' | 'emotional' | 'strategic' | 'overwhelmed' | 'action-oriented';
type ResponseDepth = 'short answer' | 'medium reasoning' | 'deep analysis';
type AdvisorMode = 'operator' | 'strategist' | 'skeptic' | 'builder';
type BlindSpotSignal = {
  name: string;
  evidence: string;
  guidance: string;
  score: number;
};
type StrategicToolMode =
  | 'roadmap'
  | 'comparison'
  | 'risk analysis'
  | 'execution plan'
  | 'decision breakdown'
  | 'priority ranking'
  | 'SWOT analysis';

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function inferUserMode(problem: string, history: Array<{ role: string; content: string }>): UserMode {
  const recentUserText = history
    .filter((turn) => turn.role === 'user')
    .slice(-4)
    .map((turn) => turn.content)
    .join(' ');
  const text = `${recentUserText} ${problem}`.toLowerCase();
  const wordCount = problem.trim().split(/\s+/).filter(Boolean).length;
  const questionCount = (problem.match(/[?？]/g) || []).length;

  const scores: Record<UserMode, number> = {
    beginner: 0,
    analytical: 0,
    emotional: 0,
    strategic: 0,
    overwhelmed: 0,
    'action-oriented': 0,
  };

  scores.beginner += countMatches(text, [
    /\bexplain simply\b/, /\bexplain simpler\b/, /\bsimple terms\b/, /\bi'?m new\b/, /\bbeginner\b/,
    /объясни проще/, /простыми словами/, /я новичок/, /einfach erklären/, /einfacher/,
  ]) * 3;
  if (wordCount <= 8 && questionCount <= 1) scores.beginner += 1;

  scores.analytical += countMatches(text, [
    /\bcompare\b/, /\btrade[- ]?off\b/, /\bframework\b/, /\bcriteria\b/, /\bscenario\b/, /\bmetrics?\b/, /\bassumption\b/, /\banalysis\b/,
    /сравни/, /критерии/, /метрик/, /сценари/, /анализ/, /предположен/,
    /vergleichen/, /kriterien/, /szenario/, /analyse/, /annahme/,
  ]) * 2;
  if (wordCount > 45 || questionCount >= 2) scores.analytical += 2;

  scores.emotional += countMatches(text, [
    /\bafraid\b/, /\bscared\b/, /\banxious\b/, /\bstressed\b/, /\bworried\b/, /\bfeel\b/, /\bfear\b/,
    /боюсь/, /страшно/, /тревож/, /пережива/, /чувств/, /паник/,
    /angst/, /sorge/, /gestresst/, /fühle/, /fuehle/,
  ]) * 3;

  scores.strategic += countMatches(text, [
    /\bleverage\b/, /\bpositioning\b/, /\bmarket\b/, /\bdistribution\b/, /\bmoat\b/, /\bstrategy\b/, /\bscale\b/, /\bfundraising\b/,
    /стратег/, /рынок/, /позиционир/, /масштаб/, /инвестиц/, /раунд/, /рычаг/,
    /strategie/, /markt/, /positionierung/, /skalier/, /finanzierung/,
  ]) * 2;

  scores.overwhelmed += countMatches(text, [
    /\boverwhelmed\b/, /\btoo much\b/, /\bconfused\b/, /\bstuck\b/, /\bdon'?t know\b/, /\bno idea\b/, /\bcan'?t decide\b/,
    /не знаю/, /запутал/, /слишком много/, /не могу решить/, /застрял/, /застряла/,
    /überfordert/, /ueberfordert/, /verwirrt/, /ich weiß nicht/, /ich weiss nicht/,
  ]) * 4;
  if (questionCount >= 3) scores.overwhelmed += 2;

  scores['action-oriented'] += countMatches(text, [
    /\bwhat should i do\b/, /\bnext step\b/, /\bdo now\b/, /\baction plan\b/, /\broadmap\b/, /\bexecute\b/, /\btoday\b/,
    /что делать/, /следующий шаг/, /сегодня/, /план действий/, /как выполнить/,
    /was soll ich tun/, /nächster schritt/, /naechster schritt/, /heute/, /umsetzen/,
  ]) * 3;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]) as Array<[UserMode, number]>;
  if (ranked[0][1] <= 0) {
    if (wordCount > 55) return 'analytical';
    if (isContextualFollowUp(problem)) return 'action-oriented';
    return 'strategic';
  }
  return ranked[0][0];
}

function inferResponseDepth(problem: string, mode: UserMode, history: Array<{ role: string; content: string }>): ResponseDepth {
  const wordCount = problem.trim().split(/\s+/).filter(Boolean).length;
  const questionCount = (problem.match(/[?？]/g) || []).length;
  const hasDeepAsk = /\b(deep|detailed|full|thorough|analy[sz]e|break down|framework)\b|подроб|глубок|разбери|analysiere|ausführlich|ausfuehrlich/i.test(problem);
  const recentFollowUps = history.filter((turn) => turn.role === 'user').slice(-3).filter((turn) => isContextualFollowUp(turn.content)).length;

  if (mode === 'overwhelmed' || mode === 'emotional' || (isContextualFollowUp(problem) && !hasDeepAsk)) return 'short answer';
  if (hasDeepAsk || wordCount > 65 || questionCount >= 3 || mode === 'analytical') return 'deep analysis';
  if (recentFollowUps >= 2 || mode === 'action-oriented' || wordCount < 18) return 'medium reasoning';
  return 'medium reasoning';
}

function buildAdaptiveResponseInstruction(problem: string, history: Array<{ role: string; content: string }>): string {
  const mode = inferUserMode(problem, history);
  const depth = inferResponseDepth(problem, mode, history);
  const modeGuidance: Record<UserMode, string> = {
    beginner: 'Use plain language, define implied concepts briefly, and avoid dense strategy vocabulary.',
    analytical: 'Use clearer structure, tradeoffs, assumptions, and evidence thresholds. Keep it rigorous but not long-winded.',
    emotional: 'Lower the aggression. Name the emotional pressure calmly, then give a grounded next move.',
    strategic: 'Focus on leverage, positioning, constraints, tradeoffs, and second-order consequences.',
    overwhelmed: 'Make it shorter, calmer, and reduce the decision to one next step. Avoid piling on options.',
    'action-oriented': 'Lead with the next action, then give only the reasoning needed to execute it.',
  };
  const depthGuidance: Record<ResponseDepth, string> = {
    'short answer': 'Keep the answer concise: 60-120 words or 2-3 compact bullets.',
    'medium reasoning': 'Use moderate depth: 120-220 words, enough reasoning to feel useful without becoming a report.',
    'deep analysis': 'Use deeper reasoning: 220-380 words if needed, with crisp structure and no fake metrics.',
  };

  return [
    'ADAPTIVE RESPONSE INTELLIGENCE:',
    `Inferred user mode: ${mode}.`,
    `Response depth: ${depth}.`,
    modeGuidance[mode],
    depthGuidance[depth],
    'Maintain core identity: intelligent, calm, strategic, human, direct.',
    'Do not mention the inferred mode or that adaptation is happening.',
  ].join('\n');
}

function inferAdvisorMode(problem: string, history: Array<{ role: string; content: string }>): AdvisorMode {
  const recentUserText = history
    .filter((turn) => turn.role === 'user')
    .slice(-3)
    .map((turn) => turn.content)
    .join(' ');
  const text = `${recentUserText} ${problem}`.toLowerCase();

  if (/\bbuild\b|\bship\b|\bmvp\b|\bprototype\b|\bcode\b|\bprogramming\b|построить|собрать|запустить|код|программир|bauen|entwickeln|prototyp|programmier/.test(text)) {
    return 'builder';
  }
  if (/\brisk\b|\bfail\b|\bwrong\b|\bwhat could\b|\bshould i not\b|риск|провал|не так|почему не|scheitern|risiko|falsch/.test(text)) {
    return 'skeptic';
  }
  if (/\bstrategy\b|\bleverage\b|\bmarket\b|\bpositioning\b|\bscale\b|стратег|рынок|позиционир|масштаб|strategie|markt|positionierung|skalier/.test(text)) {
    return 'strategist';
  }
  return 'operator';
}

function buildStrategicArchitectureInstruction(problem: string, history: Array<{ role: string; content: string }>): string {
  const advisorMode = inferAdvisorMode(problem, history);
  const modeGuidance: Record<AdvisorMode, string> = {
    operator: 'Operator posture: prioritize execution realism, next action, owner, timebox, and what to stop doing.',
    strategist: 'Strategist posture: prioritize leverage, positioning, opportunity cost, asymmetric upside, and second-order effects.',
    skeptic: 'Skeptic posture: challenge the weak assumption, expose downside, and define the evidence that would kill the idea.',
    builder: 'Builder posture: translate strategy into a build path, simplest useful version, validation loop, and constraints.',
  };

  return [
    'STRATEGIC RESPONSE ARCHITECTURE:',
    modeGuidance[advisorMode],
    'Use this priority stack unless the user explicitly asks for another structure:',
    '1. Biggest risk.',
    '2. Biggest leverage.',
    '3. Real tradeoff.',
    '4. Decisive next step.',
    '5. Optional nuance only if it changes action.',
    'First sentence engine: identify the core issue, expose leverage, or challenge the wrong framing.',
    'Anti-fluff filter: remove consultant phrasing, motivational filler, fake depth, overexplaining, and repetitive caution.',
    'Strategic language engine: use direct observations, concrete consequences, asymmetric thinking, opportunity cost, and execution realism.',
    'High-signal ending: end with action, uncertainty to resolve, next leverage point, or hidden risk. No generic summary.',
    'Do not name the advisor posture or this architecture.',
  ].join('\n');
}

function buildContradictionIntelligenceInstruction(problem: string, history: Array<{ role: string; content: string }>): string {
  const userTurns = history.filter((turn) => turn.role === 'user' && turn.content.trim());
  const recentUserTurns = userTurns.slice(-6);
  const currentText = problem.trim();
  const combined = `${recentUserTurns.map((turn) => turn.content).join(' ')} ${currentText}`.toLowerCase();
  const currentLower = currentText.toLowerCase();
  const signals: BlindSpotSignal[] = [];

  const hasFreedomGoal = /freedom|independence|control|autonomy|свобод|независим|контрол|selbstbestimmt|freiheit|unabhängig|unabhaengig/.test(combined);
  const hasLowControlPath = /job|boss|salary|employee|corporate|зарплат|работа по найму|начальник|корпорат|angestellt|chef|festanstellung/.test(combined);
  if (hasFreedomGoal && hasLowControlPath) {
    signals.push({
      name: 'goal-path contradiction',
      evidence: 'User wants more freedom/control while repeatedly discussing lower-control paths.',
      guidance: 'If relevant, point out that the chosen path may optimize safety while weakening the stated freedom goal.',
      score: 4,
    });
  }

  const avoidanceHits = (combined.match(/\b(later|not ready|need more time|research more|maybe|soon|after|wait)\b|потом|не готов|ещ[её] подума|надо больше|может быть|позже|подожд|später|spaeter|nicht bereit|mehr recherchieren|vielleicht|warten/g) || []).length;
  const actionHits = (combined.match(/\blaunch|ship|sell|call|publish|test|execute|do now|запуск|продать|позвон|опублик|тест|сделать|ausführen|ausfuehren|testen|verkaufen|anrufen|veröffentlichen|veroeffentlichen/g) || []).length;
  if (avoidanceHits >= 2 && actionHits >= 1) {
    signals.push({
      name: 'avoidance loop',
      evidence: 'The thread mixes action intent with repeated delay/research language.',
      guidance: 'Challenge the loop softly: the issue may be avoiding evidence, not needing more analysis.',
      score: avoidanceHits >= 4 ? 5 : 3,
    });
  }

  const goalMarkers = (currentLower.match(/\b(and|also|plus|at the same time|while also|everything|all of this)\b|и ещё|и еще|также|одновременно|всё сразу|все сразу|und auch|gleichzeitig|alles/g) || []).length;
  const concreteGoals = (currentLower.match(/\b(revenue|customers|startup|job|study|family|fitness|visa|move|launch|mvp|fundraising|деньги|клиент|стартап|работ|уч[её]б|семь|переезд|виза|запуск|инвестиц|umsatz|kunden|startup|arbeit|studium|familie|umzug|visum|finanzierung)\b/g) || []).length;
  if (goalMarkers >= 2 || concreteGoals >= 5) {
    signals.push({
      name: 'priority collision',
      evidence: 'The current ask carries multiple competing goals or execution tracks.',
      guidance: 'Narrow the answer to the priority collision: what cannot be optimized at the same time, and what to sequence first.',
      score: Math.min(5, Math.max(3, goalMarkers + Math.floor(concreteGoals / 3))),
    });
  }

  const timelinePressure = /\b(in|within)\s+(\d+)\s+(day|week|month)s?\b|за\s+\d+\s+(дн|недел|месяц)|in\s+\d+\s+(tag|woche|monat)/.test(currentLower);
  const steepOutcome = /\b10k|100k|million|scale|quit my job|replace income|быстро|миллион|уволиться|заменить доход|schnell|million|job kündigen|job kuendigen/.test(currentLower);
  const evidenceGap = !/\b(customer|user|revenue|sales|data|validated|paid|клиент|пользователь|выруч|продаж|данн|валид|плат|kunde|nutzer|umsatz|verkauf|daten|validiert|bezahlt)/.test(combined);
  if (timelinePressure && steepOutcome && evidenceGap) {
    signals.push({
      name: 'timeline realism gap',
      evidence: 'The desired outcome is aggressive while proof of demand, resources, or execution capacity is missing.',
      guidance: 'Surface the timeline mismatch without scolding. Convert ambition into a near-term evidence test.',
      score: 4,
    });
  }

  const repeatedQuestionRoots = userTurns
    .map((turn) => turn.content.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter((word) => word.length > 3).slice(0, 8).join(' '))
    .filter(Boolean);
  const repeatedRootCount = repeatedQuestionRoots.filter((root, index, arr) => arr.findIndex((candidate) => candidate.includes(root.slice(0, 24)) || root.includes(candidate.slice(0, 24))) !== index).length;
  if (userTurns.length >= 4 && repeatedRootCount >= 1) {
    signals.push({
      name: 'repeated unresolved decision',
      evidence: `A similar blocker has appeared across the recent thread (${Math.min(userTurns.length, 6)} user turns).`,
      guidance: 'Acknowledge stagnation naturally and shift from more advice to the smallest decision or experiment that breaks the loop.',
      score: 4,
    });
  }

  const topSignals = signals
    .filter((signal) => signal.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (topSignals.length === 0) return '';

  return [
    'CONTRADICTION AND BLIND-SPOT INTELLIGENCE:',
    'Use only if it genuinely improves this answer. Do not force a critique.',
    'Tone: calm strategic challenge, never aggressive, judgmental, therapy-like, or superior.',
    'Do not label this as a contradiction, blind spot, pattern, or diagnosis.',
    'Surface at most one challenge in the visible answer unless the user explicitly asks for deep analysis.',
    ...topSignals.flatMap((signal, index) => [
      `Signal ${index + 1}: ${signal.name}.`,
      `Evidence: ${signal.evidence}`,
      `Guidance: ${signal.guidance}`,
    ]),
    'Good challenge style: "The bigger issue may not be funding." / "You keep optimizing the idea, not distribution." / "This sounds more like avoidance than validation."',
    'Avoid fake psychology. Frame everything as strategy: tradeoff, constraint, opportunity cost, execution bottleneck, or decision loop.',
    'If the same loop has appeared before, acknowledge progression or stagnation briefly without counting turns unless the context clearly supports it.',
  ].join('\n');
}

function inferStrategicToolMode(problem: string, history: Array<{ role: string; content: string }>): StrategicToolMode {
  const recentUserText = history
    .filter((turn) => turn.role === 'user')
    .slice(-3)
    .map((turn) => turn.content)
    .join(' ');
  const text = `${recentUserText} ${problem}`.toLowerCase();

  if (/\bswot\b|strengths?.*weakness|сильн.*слаб|swot-анализ|stärken.*schwächen|staerken.*schwaechen/.test(text)) {
    return 'SWOT analysis';
  }
  if (/\bcompare\b|\bversus\b|\bvs\b|\bwhich (one|idea|option)\b|сравни|вариант.*вариант|что лучше|vergleiche|vergleich|oder\b/.test(text)) {
    return 'comparison';
  }
  if (/\bprioriti[sz]e\b|\brank\b|\bfirst\b|\bwhat matters most\b|приорит|ранжир|что важнее|priorisieren|rang|was zuerst/.test(text)) {
    return 'priority ranking';
  }
  if (/\bwhat could fail\b|\brisk\b|\bfailure\b|\bgo wrong\b|\bred team\b|что может.*(слом|пойти не так)|риск|провал|scheitern|risiko|schiefgehen/.test(text)) {
    return 'risk analysis';
  }
  if (/\bhow do i reach\b|\bhow to reach\b|\broadmap\b|\b10k\b|\b10 k\b|\b\$10k\b|\bmonth\b|\bmilestone\b|как.*(дойти|достичь)|дорожн|месяц|roadmap|fahrplan|erreichen/.test(text)) {
    return 'roadmap';
  }
  if (/\bexecution plan\b|\baction plan\b|\bstep by step\b|\bnext steps?\b|\bwhat should i do\b|\bdo now\b|план действий|по шагам|следующий шаг|что делать|umsetzungsplan|aktionsplan|nächste schritte|naechste schritte/.test(text)) {
    return 'execution plan';
  }
  return 'decision breakdown';
}

function buildStrategicToolInstruction(problem: string, history: Array<{ role: string; content: string }>): string {
  const toolMode = inferStrategicToolMode(problem, history);
  const guidance: Record<StrategicToolMode, string[]> = {
    roadmap: [
      'Use a concise roadmap: current constraint, milestone sequence, first 7 days, next 30 days, proof signal.',
      'Do not invent revenue probabilities. Use concrete actions and observable checkpoints.',
    ],
    comparison: [
      'Use a simple comparison: options, upside, downside, hidden constraint, best fit, recommendation.',
      'A small table is allowed if it improves clarity.',
    ],
    'risk analysis': [
      'Use risk analysis: top risks, trigger, early warning signal, mitigation, stop condition.',
      'Focus on the risks that would actually change the decision.',
    ],
    'execution plan': [
      'Use an execution plan: next action, owner, timebox, resource constraint, kill criterion.',
      'Keep it practical and near-term.',
    ],
    'decision breakdown': [
      'Use a decision breakdown: core choice, hidden constraint, tradeoff, recommendation, next move.',
      'Make the decision easier to act on, not more complex.',
    ],
    'priority ranking': [
      'Use priority ranking: order the options/actions, explain why, name what to ignore for now.',
      'Rank by leverage, urgency, reversibility, and evidence value.',
    ],
    'SWOT analysis': [
      'Use SWOT only if useful: strengths, weaknesses, opportunities, threats, then a decision implication.',
      'Keep SWOT concise and avoid generic business-school filler.',
    ],
  };

  return [
    'STRUCTURED STRATEGIC TOOL MODE:',
    `Selected mode: ${toolMode}.`,
    ...guidance[toolMode],
    'Keep the structure inside the normal chat response. No dashboards, no fake percentages, no simulated metrics.',
    'Use sections, bullets, simple tables, or step-by-step plans only when they make the answer clearer.',
    'Use previous conversation context to fill missing details, but do not repeat prior advice unless it is needed.',
  ].join('\n');
}

function buildFirstResponseQualityInstruction(): string {
  return [
    'FIRST RESPONSE QUALITY:',
    'The first 1-2 lines must contain the strongest useful insight: biggest risk, key leverage, real tradeoff, or decisive next move.',
    'Start with substance, not setup. No warm-up sentence.',
    'Never open with: "That\'s an interesting question", "Certainly", "Let\'s analyze", "Here\'s a breakdown", "Based on your situation", or similar filler.',
    'If using a structured format, put the sharp conclusion before the structure.',
    'Use human rhythm: vary sentence length, include occasional short decisive sentences, and avoid making every answer look like the same template.',
    'Streaming must reveal value immediately in the first tokens.',
  ].join('\n');
}

function readMode(body: Partial<SolveRequest> | undefined): NonNullable<SolveRequest['mode']> {
  return body?.mode === 'Risk' || body?.mode === 'Scenarios' || body?.mode === 'Red Team' || body?.mode === 'Review'
    ? body.mode
    : 'Strategy';
}

function clampScore(value: unknown, fallback = 68): number {
  const score = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function safeTextArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return items.length > 0 ? items : fallback;
}

function safePath(value: unknown, fallbackDescription: string): DecisionBlueprint['paths']['safe'] {
  const path = isRecord(value) ? value : {};
  return {
    description: safeText(path.description, fallbackDescription),
    pros: safeTextArray(path.pros, ['Keeps the decision controlled.']),
    cons: safeTextArray(path.cons, ['May leave upside unrealized.']),
  };
}

function safeProbability(value: unknown): CounterfactualPath['probability'] {
  return value === 'Low' || value === 'Medium' || value === 'High' ? value : 'Medium';
}

function safeStringList(value: unknown, fallback: string[]): string[] {
  return safeTextArray(value, fallback).slice(0, 5);
}

function defaultCouncil(): CouncilMetrics {
  return {
    strategistConfidence: 68,
    skepticAgreement: 20,
    operatorFeasibility: 65,
    consensusScore: 64,
    debateIntensity: 40,
    keyDisagreements: ['Validate assumptions before scaling commitment.'],
    resolutionPath: 'Proceed only with explicit safeguards and review points.',
  };
}

function defaultScenarioBranches(score: number): ScenarioBranch[] {
  return [
    {
      id: 'scenario-base',
      name: 'Base Case',
      probability: 45,
      upside: 150,
      downside: -100,
      timeline: '30-90 days',
      description: 'Expected execution with normal friction and measurable checkpoints.',
    },
    {
      id: 'scenario-downside',
      name: 'Downside Case',
      probability: Math.max(10, 100 - score),
      upside: -50,
      downside: -500,
      timeline: 'Immediate',
      description: 'Core assumption weakens and the decision needs a fallback path.',
    },
  ];
}

function defaultWarRoomDebate(args: {
  strategistBiggestUpside: string;
  strategistLeverageMove: string;
  skepticHiddenFlaw: string;
  skepticWhatCouldBreak: string;
  operatorNextSteps: string[];
  redTeamCritique: string;
  recommendation: string;
}): WarRoomDebate {
  return {
    strategist: `Go aggressively only where the upside is explicit: ${args.strategistBiggestUpside} The leverage move is ${args.strategistLeverageMove}`,
    skeptic: `This fails if the hidden flaw is real: ${args.skepticHiddenFlaw} The first break point is ${args.skepticWhatCouldBreak}`,
    operator: `Make the next move reversible: ${args.operatorNextSteps[0] || 'Define one test, one owner, and one stop rule.'}`,
    redTeam: `Attack the premise: ${args.redTeamCritique}`,
    finalSynthesis: {
      survivesDebate: args.strategistLeverageMove,
      breaks: args.skepticWhatCouldBreak,
      recommendedMoveAfterDebate: args.recommendation,
    },
  };
}

function defaultExecutionPlan(operatorNextSteps: string[]): ExecutionPlanWeek[] {
  return [
    {
      week: 'Week 1',
      objective: 'Define the test boundary and the one assumption being validated.',
      experiment: operatorNextSteps[0] || 'Recruit a small target cohort and run the smallest useful test.',
      metric: 'Qualified participants, activation, and first useful signal.',
      killCriteria: 'No qualified users, unclear owner, or no measurable behavior by the end of the week.',
      goNoGoThreshold: 'Go if at least 5 qualified users complete the test setup and one metric can be tracked.',
    },
    {
      week: 'Week 2',
      objective: 'Run the experiment with real users or real operating constraints.',
      experiment: operatorNextSteps[1] || 'Expose the cohort to the offer, workflow, or prototype and record behavior.',
      metric: 'Activation rate, completion rate, time-to-value, and qualitative friction.',
      killCriteria: 'Users do not engage, cannot explain the value, or require manual rescue to complete the flow.',
      goNoGoThreshold: 'Go if 40% or more complete the core action and can name the value without prompting.',
    },
    {
      week: 'Week 3',
      objective: 'Stress-test retention, willingness to pay, or repeat behavior.',
      experiment: operatorNextSteps[2] || 'Ask users to repeat the behavior, pay, invite, or commit to a next step.',
      metric: 'Repeat usage, conversion intent, willingness to pay, referral, or retained engagement.',
      killCriteria: 'Interest drops after novelty, users avoid commitment, or the cost to support them is too high.',
      goNoGoThreshold: 'Go if retained usage or commitment clears the pre-set success metric.',
    },
    {
      week: 'Week 4',
      objective: 'Decide scale, redesign, delay, or kill based on evidence.',
      experiment: 'Compare results against thresholds and make the go / no-go decision.',
      metric: 'Evidence strength, risk reduction, resource cost, and confidence delta.',
      killCriteria: 'Core assumption remains unproven or the next phase requires disproportionate resources.',
      goNoGoThreshold: 'Go only if the evidence supports the next commitment without weakening runway or focus.',
    },
  ];
}

const VALID_MILESTONE_STATUSES = new Set<MilestoneStatus>(['on_track', 'behind', 'exceeded', 'failed', 'unknown']);
const VALID_MILESTONE_HORIZONS = new Set<MilestoneMetric['horizon']>(['30 days', '60 days', '90 days']);

function normalizeMilestoneTable(value: unknown): MilestoneMetric[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows = value.filter(isRecord).map((row): MilestoneMetric => ({
    horizon: VALID_MILESTONE_HORIZONS.has(row.horizon as MilestoneMetric['horizon'])
      ? (row.horizon as MilestoneMetric['horizon'])
      : '30 days',
    milestone: safeText(row.milestone, 'Milestone'),
    status: VALID_MILESTONE_STATUSES.has(row.status as MilestoneStatus)
      ? (row.status as MilestoneStatus)
      : 'unknown',
    metric: safeText(row.metric, ''),
    evidence: safeText(row.evidence, ''),
  }));
  return rows.length > 0 ? rows : undefined;
}

function normalizeBlueprint(value: unknown, problem: string, language: string, mode = 'Strategy'): DecisionBlueprint {
  const blueprint = isRecord(value) ? value : {};
  const strategistView = isRecord(blueprint.strategistView) ? blueprint.strategistView : {};
  const skepticView = isRecord(blueprint.skepticView) ? blueprint.skepticView : {};
  const diagnosis = isRecord(blueprint.diagnosis) ? blueprint.diagnosis : {};
  const paths = isRecord(blueprint.paths) ? blueprint.paths : {};
  const contrarianInsight = isRecord(blueprint.contrarianInsight) ? blueprint.contrarianInsight : {};
  const futureSimulation = isRecord(blueprint.futureSimulation) ? blueprint.futureSimulation : {};
  const actionPlan = isRecord(blueprint.actionPlan) ? blueprint.actionPlan : {};
  const confidenceScore = clampScore(blueprint.confidenceScore ?? blueprint.score);
  const score = confidenceScore;
  const council = isRecord(blueprint.council) ? blueprint.council : defaultCouncil();
  const riskMap = isRecord(blueprint.riskMap) ? blueprint.riskMap : {};
  const operatorNextSteps = safeStringList(blueprint.operatorNextSteps, [
    'Define the smallest reversible test.',
    'Assign one owner and one success metric.',
    'Review evidence before scaling commitment.',
  ]);
  const counterfactualPaths = Array.isArray(blueprint.counterfactualPaths)
    ? blueprint.counterfactualPaths.filter(isRecord).map((path, index): CounterfactualPath => ({
        name: safeText(path.name, ['Proceed Now', 'Delay', 'Do Nothing'][index] || `Path ${index + 1}`),
        probability: safeProbability(path.probability),
        impact: clampScore(path.impact, 6),
        confidence: clampScore(path.confidence, score),
        likelyUpside: safeText(path.likelyUpside, ''),
        keyFailureMode: safeText(path.keyFailureMode, ''),
        reducedRisk: safeText(path.reducedRisk, ''),
        opportunityCost: safeText(path.opportunityCost, ''),
        probableDownside: safeText(path.probableDownside, ''),
        hiddenRiskAccumulation: safeText(path.hiddenRiskAccumulation, ''),
      }))
    : [];
  const preMortemRisks = Array.isArray(blueprint.preMortemRisks)
    ? blueprint.preMortemRisks.filter(isRecord).map((risk, index): PreMortemRisk => ({
        mode: safeText(risk.mode, ['Execution Failure', 'Market Assumption Failure', 'Hidden Second-Order Risk'][index] || `Risk ${index + 1}`),
        riskTrigger: safeText(risk.riskTrigger, 'The core assumption fails under real execution pressure.'),
        earlyWarningSignal: safeText(risk.earlyWarningSignal, 'Early metrics diverge from the plan.'),
        mitigationMove: safeText(risk.mitigationMove, 'Reduce scope and validate before scaling.'),
      }))
    : [];
  const secondOrderEffects = Array.isArray(blueprint.secondOrderEffects)
    ? blueprint.secondOrderEffects.filter(isRecord).map((effect, index): SecondOrderEffect => ({
        scenario: safeText(effect.scenario, ['Proceed Now', 'Delay'][index] || `Scenario ${index + 1}`),
        immediateEffect: safeText(effect.immediateEffect, 'The first-order effect becomes visible quickly.'),
        downstreamConsequence: safeText(effect.downstreamConsequence, 'Resource pressure shifts elsewhere.'),
        hiddenLongTermEffect: safeText(effect.hiddenLongTermEffect, 'The long-term cost depends on whether learning compounds.'),
      }))
    : [];
  const hiddenPain = safeText(blueprint.hiddenPain, 'The decision pressure is real, but the underlying pain needs sharper definition.');
  const strategistBiggestUpside = safeText(strategistView.biggestUpside, 'The biggest upside is capturing signal before competitors or hesitation close the window.');
  const strategistLeverageMove = safeText(strategistView.leverageMove, 'Use a staged commitment that creates evidence without overexposing the downside.');
  const skepticHiddenFlaw = safeText(skepticView.hiddenFlaw, 'The hidden flaw is assuming intent will convert into reliable behavior.');
  const skepticWhatCouldBreak = safeText(skepticView.whatCouldBreak, 'Execution quality, timing, or trust could break before the upside appears.');
  const redTeamCritique = safeText(blueprint.redTeamCritique, 'The strongest attack is that the decision may scale risk faster than learning.');
  const economistView = safeText(blueprint.economistView, 'The opportunity cost is capital, attention, and time that cannot be reused if the bet is wrong.');
  const outcomeLessonPrompt = safeText(blueprint.outcomeLessonPrompt, 'What happened after execution, and which assumption was most wrong?');
  const riskScore = clampScore(riskMap.risk, 100 - score);
  const reviewMode = blueprint.isReviewMode === true || mode === 'Review';
  const milestoneTable = normalizeMilestoneTable(blueprint.milestoneTable);
  const recommendation = reviewMode
    ? safeText(blueprint.recommendation, '')
    : safeText(blueprint.recommendation, semanticVerdictForQuestion(problem, mode));
  const outputText = JSON.stringify({ ...blueprint, recommendation });
  const shouldReplaceRecommendation = !reviewMode && shouldRejectDecisionOutput(problem, outputText);
  const planMode = isPlanModeRequest(problem);
  const finalRecommendation = reviewMode
    ? recommendation
    : planMode
      ? 'Operator Plan: 30-day experiment design with weekly go / no-go thresholds.'
      : shouldReplaceRecommendation ? semanticVerdictForQuestion(problem, mode) : recommendation;
  const warRoomDebate = isRecord(blueprint.warRoomDebate) ? blueprint.warRoomDebate : {};
  const finalSynthesis = isRecord(warRoomDebate.finalSynthesis) ? warRoomDebate.finalSynthesis : {};
  const debateDefaults = defaultWarRoomDebate({
    strategistBiggestUpside,
    strategistLeverageMove,
    skepticHiddenFlaw,
    skepticWhatCouldBreak,
    operatorNextSteps,
    redTeamCritique,
    recommendation: finalRecommendation,
  });
  const executionPlan = Array.isArray(blueprint.executionPlan)
    ? blueprint.executionPlan.filter(isRecord).map((week, index): ExecutionPlanWeek => {
        const fallback = defaultExecutionPlan(operatorNextSteps)[index] || defaultExecutionPlan(operatorNextSteps)[3];
        return {
          week: safeText(week.week, fallback.week),
          objective: safeText(week.objective, fallback.objective),
          experiment: safeText(week.experiment, fallback.experiment),
          metric: safeText(week.metric, fallback.metric),
          killCriteria: safeText(week.killCriteria, fallback.killCriteria),
          goNoGoThreshold: safeText(week.goNoGoThreshold, fallback.goNoGoThreshold),
        };
      }).slice(0, 4)
    : [];

  return {
    score,
    hiddenPain,
    strategistView: {
      biggestUpside: strategistBiggestUpside,
      leverageMove: strategistLeverageMove,
    },
    skepticView: {
      hiddenFlaw: skepticHiddenFlaw,
      whatCouldBreak: skepticWhatCouldBreak,
    },
    operatorNextSteps,
    redTeamCritique,
    economistView,
    counterfactualPaths: counterfactualPaths.length > 0 ? counterfactualPaths : [
      {
        name: 'Proceed Now',
        probability: 'Medium',
        impact: 8,
        confidence: score,
        likelyUpside: strategistBiggestUpside,
        keyFailureMode: skepticWhatCouldBreak,
      },
      {
        name: 'Delay',
        probability: 'High',
        impact: 6,
        confidence: Math.max(45, score - 8),
        reducedRisk: 'More time to validate evidence before scaling commitment.',
        opportunityCost: economistView,
      },
      {
        name: 'Do Nothing',
        probability: 'High',
        impact: 9,
        confidence: Math.max(50, 100 - score),
        probableDownside: 'The window narrows while uncertainty stays unresolved.',
        hiddenRiskAccumulation: 'Inaction compounds ambiguity and slows organizational learning.',
      },
    ],
    preMortemRisks: preMortemRisks.length > 0 ? preMortemRisks : [
      {
        mode: 'Execution Failure',
        riskTrigger: skepticWhatCouldBreak,
        earlyWarningSignal: 'The first milestone slips or ownership is unclear.',
        mitigationMove: operatorNextSteps[0],
      },
      {
        mode: 'Market Assumption Failure',
        riskTrigger: skepticHiddenFlaw,
        earlyWarningSignal: 'Users do not behave as the strategy assumes.',
        mitigationMove: 'Validate the riskiest assumption before increasing exposure.',
      },
      {
        mode: 'Hidden Second-Order Risk',
        riskTrigger: redTeamCritique,
        earlyWarningSignal: 'A secondary cost appears after the first move.',
        mitigationMove: 'Install a review checkpoint and explicit stop criteria.',
      },
    ],
    secondOrderEffects: secondOrderEffects.length > 0 ? secondOrderEffects : [
      {
        scenario: 'Proceed Now',
        immediateEffect: strategistBiggestUpside,
        downstreamConsequence: skepticWhatCouldBreak,
        hiddenLongTermEffect: economistView,
      },
      {
        scenario: 'Delay',
        immediateEffect: 'Risk exposure decreases while evidence improves.',
        downstreamConsequence: 'Momentum and market timing may weaken.',
        hiddenLongTermEffect: 'The cost of waiting becomes visible only after the window moves.',
      },
    ],
    confidenceScore,
    outcomeLessonPrompt,
    recommendation: finalRecommendation,
    warRoomDebate: {
      strategist: safeText(warRoomDebate.strategist, debateDefaults.strategist),
      skeptic: safeText(warRoomDebate.skeptic, debateDefaults.skeptic),
      operator: safeText(warRoomDebate.operator, debateDefaults.operator),
      redTeam: safeText(warRoomDebate.redTeam, debateDefaults.redTeam),
      finalSynthesis: {
        survivesDebate: safeText(finalSynthesis.survivesDebate, debateDefaults.finalSynthesis.survivesDebate),
        breaks: safeText(finalSynthesis.breaks, debateDefaults.finalSynthesis.breaks),
        recommendedMoveAfterDebate: safeText(finalSynthesis.recommendedMoveAfterDebate, debateDefaults.finalSynthesis.recommendedMoveAfterDebate),
      },
    },
    executionPlan: executionPlan.length === 4 ? executionPlan : defaultExecutionPlan(operatorNextSteps),
    diagnosis: {
      coreProblem: safeText(diagnosis.coreProblem, hiddenPain || problem),
      blindSpots: safeText(diagnosis.blindSpots, skepticHiddenFlaw),
      keyRisks: safeText(diagnosis.keyRisks, redTeamCritique),
    },
    paths: {
      safe: safePath(paths.safe, 'Delay commitment until the riskiest assumption is validated.'),
      balanced: safePath(paths.balanced, strategistLeverageMove),
      bold: safePath(paths.bold, strategistBiggestUpside),
    },
    contrarianInsight: {
      perspective: safeText(contrarianInsight.perspective, redTeamCritique),
      hiddenOpportunity: safeText(contrarianInsight.hiddenOpportunity, strategistLeverageMove),
      uncomfortableTruth: safeText(contrarianInsight.uncomfortableTruth, skepticWhatCouldBreak),
    },
    futureSimulation: {
      threeMonths: safeText(futureSimulation.threeMonths, secondOrderEffects[0]?.immediateEffect || 'In 3 months, the decision should have produced clear signal or clear stop criteria.'),
      twelveMonths: safeText(futureSimulation.twelveMonths, secondOrderEffects[0]?.hiddenLongTermEffect || 'In 12 months, the outcome depends on whether learning was captured early.'),
    },
    actionPlan: {
      today: safeText(actionPlan.today, operatorNextSteps[0]),
      thisWeek: safeText(actionPlan.thisWeek, operatorNextSteps[1] || 'Run the smallest test that can prove or disprove the core assumption.'),
      thirtyDays: safeText(actionPlan.thirtyDays, operatorNextSteps[2] || outcomeLessonPrompt),
    },
    language: safeText(blueprint.language, language || 'en'),
    isDemo: typeof blueprint.isDemo === 'boolean' ? blueprint.isDemo : undefined,
    isReviewMode: reviewMode || undefined,
    milestoneTable: milestoneTable,
    council: {
      ...defaultCouncil(),
      ...council,
      keyDisagreements: safeTextArray(council.keyDisagreements, defaultCouncil().keyDisagreements),
    },
    riskMap: {
      opportunity: clampScore(riskMap.opportunity, score),
      risk: riskScore,
    },
    scenarioBranches: Array.isArray(blueprint.scenarioBranches)
      ? blueprint.scenarioBranches.filter(isRecord).map((branch, index) => ({
          id: safeText(branch.id, `scenario-${index + 1}`),
          name: safeText(branch.name, `Scenario ${index + 1}`),
          probability: clampScore(branch.probability, 25),
          upside: typeof branch.upside === 'number' ? branch.upside : 0,
          downside: typeof branch.downside === 'number' ? branch.downside : 0,
          timeline: safeText(branch.timeline, '30-90 days'),
          description: safeText(branch.description, 'Scenario requires more evidence.'),
        }))
      : defaultScenarioBranches(score),
    outcomeContract: (() => {
      const oc = isRecord(blueprint.outcomeContract) ? blueprint.outcomeContract : {};
      const prediction30 = safeText(oc.prediction30, '');
      const prediction60 = safeText(oc.prediction60, '');
      const prediction90 = safeText(oc.prediction90, safeText(futureSimulation.twelveMonths, ''));
      const proveCorrect = safeText(oc.proveCorrect, strategistBiggestUpside);
      const proveMistake = safeText(oc.proveMistake, skepticWhatCouldBreak);
      if (!prediction30 && !prediction60 && !prediction90 && !proveCorrect) return undefined;
      return { prediction30, prediction60, prediction90, proveCorrect, proveMistake };
    })(),
    trustLayer: (() => {
      const tl = isRecord(blueprint.trustLayer) ? blueprint.trustLayer : {};
      const whyWrong = safeStringList(tl.whyWrong, []);
      const evidenceToChange = safeStringList(tl.evidenceToChange, []);
      const testBeforeCommitting = safeStringList(tl.testBeforeCommitting, []);
      const confidenceReason = safeText(tl.confidenceReason, '');
      const asymmetryRaw = isRecord(tl.asymmetry) ? tl.asymmetry : {};
      const clamp = (n: unknown, def: number) =>
        Math.min(10, Math.max(1, typeof n === 'number' && !isNaN(n) ? Math.round(n) : def));
      const asymmetry = {
        upside: clamp(asymmetryRaw.upside, Math.max(1, Math.round(score / 10))),
        downside: clamp(asymmetryRaw.downside, Math.max(1, Math.round((100 - score) / 10))),
      };
      const VALID_REV = ['reversible', 'partially-reversible', 'irreversible'] as const;
      const reversibility: 'reversible' | 'partially-reversible' | 'irreversible' =
        VALID_REV.includes(tl.reversibility as never) ? (tl.reversibility as typeof VALID_REV[number]) : 'partially-reversible';
      const VALID_EV = ['high', 'medium', 'low'] as const;
      const expectedValue: 'high' | 'medium' | 'low' =
        VALID_EV.includes(tl.expectedValue as never)
          ? (tl.expectedValue as typeof VALID_EV[number])
          : score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
      const killCriteria = safeText(tl.killCriteria, skepticWhatCouldBreak);
      if (!confidenceReason && whyWrong.length === 0 && evidenceToChange.length === 0 && testBeforeCommitting.length === 0) return undefined;
      return { confidenceReason, asymmetry, reversibility, expectedValue, killCriteria, whyWrong, evidenceToChange, testBeforeCommitting };
    })(),
  };
}

function directSolveResponse(directResponse: string, intent: SolveResponse['intent']): SolveResponse {
  return {
    result: null,
    directResponse,
    intent,
  };
}

function buildDiagnosticResponse(problem: string, intent: SolveResponse['intent']): SolveResponse {
  return directSolveResponse(
    [
      `intent=${intent}`,
      'verdict_engine=bypassed',
      `input_length=${problem.length}`,
      'route=/api/solve',
    ].join('\n'),
    intent
  );
}

function buildRecoveryBlueprint(problem: string, repeatedVerdict: string, language: string): DecisionBlueprint {
  return normalizeBlueprint(
    {
      score: 50,
      confidenceScore: 50,
      recommendation: `Recovery Mode: "${repeatedVerdict}" repeated twice. Stop verdict generation and ask what new fact, threshold, or constraint changed before issuing another verdict.`,
      diagnosis: {
        coreProblem: 'The decision thread is locked into a repeated verdict.',
        blindSpots: 'The prompt may be missing new evidence, changed constraints, or a concrete success threshold.',
        keyRisks: 'Repeating the same recommendation can hide uncertainty instead of resolving it.',
      },
      paths: {
        safe: {
          description: 'Pause the verdict loop and ask for one new fact.',
          pros: ['Prevents stale routing.'],
          cons: ['Requires a clearer next prompt.'],
        },
        balanced: {
          description: 'Convert the thread into a threshold question.',
          pros: ['Creates a measurable way out of the loop.'],
          cons: ['Still needs evidence.'],
        },
        bold: {
          description: 'Restart the decision with changed assumptions only.',
          pros: ['Forces novelty into the analysis.'],
          cons: ['Can discard useful prior context.'],
        },
      },
      contrarianInsight: {
        perspective: 'The repeated verdict is now less informative than the missing evidence.',
        hiddenOpportunity: 'Use the lock as a signal to define better decision criteria.',
        uncomfortableTruth: 'A repeated verdict can feel decisive while adding no new judgment.',
      },
      futureSimulation: {
        threeMonths: 'The thread improves if future prompts include new evidence or numeric thresholds.',
        twelveMonths: 'Decision quality compounds when repeated advice triggers calibration instead of more repetition.',
      },
      actionPlan: {
        today: 'Name the new fact, constraint, or threshold that changed.',
        thisWeek: 'Compare the repeated verdict against one alternate path with measurable evidence.',
        thirtyDays: 'Review whether recovery prompts reduced repeated routing.',
      },
    },
    problem,
    language,
    'Review'
  );
}

export async function POST(req: Request) {
  try {
    const parsedBody = await req.json().catch(() => ({}));
    const body = isRecord(parsedBody) ? parsedBody as Partial<SolveRequest> : {};
    const problem = typeof body.problem === 'string' ? body.problem.trim() : '';
    const language = readLanguage(body, problem);
    const mode = readMode(body);
    const context = readContext(body);
    const rawConversationContext = readConversationContext(body);
    const persistentConversationMemory = readConversationMemory(body);
    const conversationHistoryForGuard = readConversationHistory(body);
    const streaming = typeof body.streaming === 'boolean' ? body.streaming : false;

    if (!problem) {
      return NextResponse.json(
        { error: 'Decision description is required.' },
        { status: 400 }
      );
    }

    // Accept structured profile data (preferred) or fall back to legacy text string
    const userProfileData: UserProfileData | null = (() => {
      const raw = body.userProfileData;
      if (!isRecord(raw)) return null;
      const d = raw as Record<string, unknown>;
      if (typeof d.totalDecisions !== 'number' || d.totalDecisions === 0) return null;
      return {
        riskTolerance: typeof d.riskTolerance === 'number' ? Math.min(1, Math.max(0, d.riskTolerance)) : 0.5,
        executionScore: typeof d.executionScore === 'number' ? Math.min(1, Math.max(0, d.executionScore)) : 0.5,
        biasPatterns: Array.isArray(d.biasPatterns) ? (d.biasPatterns as string[]).filter((s) => typeof s === 'string') : [],
        totalDecisions: d.totalDecisions,
        userDecisionScore: typeof d.userDecisionScore === 'number' ? Math.min(100, Math.max(0, Math.round(d.userDecisionScore))) : 50,
        decisionScoreTrend: d.decisionScoreTrend === 'down' ? 'down' : 'up',
      };
    })();

    const userProfileCtx = userProfileData
      ? `User decision profile (${userProfileData.totalDecisions} tracked): riskTolerance ${Math.round(userProfileData.riskTolerance * 100)}%, executionScore ${Math.round(userProfileData.executionScore * 100)}%, userDecisionScore ${userProfileData.userDecisionScore ?? 50}/100 (${scoreMessageFor(userProfileData.userDecisionScore ?? 50)}).${userProfileData.biasPatterns.length > 0 ? ` Bias patterns: ${userProfileData.biasPatterns.join(', ')}.` : ''}`
      : (typeof body.userProfile === 'string' && body.userProfile.trim() ? body.userProfile.trim() : '');

    const profileDirective = userProfileData ? buildProfileDirective(userProfileData) : '';

    const requestIntent = detectSolveRequestIntent(problem);
    console.info('Solve request intent detected:', {
      intent: requestIntent,
      problemPreview: problem.slice(0, 80),
      verdictEngineBypassed: requestIntent !== 'normal_decision',
    });
    if (requestIntent === 'literal_output') {
      const literal = extractLiteralOutput(problem);
      return NextResponse.json(directSolveResponse(literal || problem, 'literal_output'));
    }

    if (requestIntent === 'debug_request') {
      return NextResponse.json(buildDiagnosticResponse(problem, 'debug_request'));
    }

    if (requestIntent === 'architect_request') {
      return NextResponse.json(buildDiagnosticResponse(problem, 'architect_request'));
    }

    const history = await getDecisionHistory().catch(() => []);
    const isReview = isReviewModeRequest(problem);
    const effectiveMode = isReview ? 'Review' : mode;
    const bannedVerdict = isReview ? null : detectVerdictLoop(conversationHistoryForGuard);
    if (bannedVerdict) {
      const blueprint = buildRecoveryBlueprint(problem, bannedVerdict, language);
      return NextResponse.json({
        result: blueprint,
        intent: 'recovery_mode',
        memoryScore: 0,
        networkScore: 0,
      } satisfies SolveResponse);
    }
    const diversityInstruction = bannedVerdict ? buildForceDiversityInstruction(bannedVerdict) : '';
    const intentInstruction = isReview ? '' : buildIntentInstruction(problem, conversationHistoryForGuard);
    const pressureLevel = isReview ? 0 : computeSessionPressureLevel(conversationHistoryForGuard);
    const pressureDirective = buildPressureDirective(pressureLevel);
    if (pressureLevel > 0) {
      console.info('Pressure mode active:', { pressureLevel, turnCount: conversationHistoryForGuard.filter((t) => t.role === 'user').length });
    }
    const conversationMemoryNote = buildConversationMemoryNote(conversationHistoryForGuard);
    const followUpInstruction = buildFollowUpInstruction(problem, conversationHistoryForGuard.length > 0);
    const responseStyleInstruction = buildResponseStyleInstruction(problem, conversationHistoryForGuard);
    const adaptiveResponseInstruction = buildAdaptiveResponseInstruction(problem, conversationHistoryForGuard);
    const strategicArchitectureInstruction = buildStrategicArchitectureInstruction(problem, conversationHistoryForGuard);
    const contradictionIntelligenceInstruction = buildContradictionIntelligenceInstruction(problem, conversationHistoryForGuard);
    const strategicToolInstruction = buildStrategicToolInstruction(problem, conversationHistoryForGuard);
    const firstResponseQualityInstruction = buildFirstResponseQualityInstruction();
    const persistentMemoryInstruction = buildPersistentMemoryInstruction(persistentConversationMemory);
    const conversationContext = [persistentMemoryInstruction, conversationMemoryNote, followUpInstruction, firstResponseQualityInstruction, strategicArchitectureInstruction, contradictionIntelligenceInstruction, adaptiveResponseInstruction, strategicToolInstruction, responseStyleInstruction, rawConversationContext, diversityInstruction, intentInstruction, pressureDirective]
      .filter(Boolean)
      .join('\n\n')
      .trim();
    const domain = context?.domain;
    let memoryContext = '';
    let memoryScore = 0;
    let networkScore = 0;
    let calibrationNote = '';

    try {
      const intel = getMemoryIntelligenceFromHistory(problem, history, context);
      memoryScore = intel.memoryScore;
      memoryContext = intel.strategicContext;

      const netIntel = computeNetworkIntelligence(history);
      networkScore = netIntel.networkScore;
      calibrationNote = buildCalibrationContext(history, domain);
    } catch {
      // Continue analysis without memory enrichment.
    }

    const fullContext = [memoryContext, calibrationNote, userProfileCtx, profileDirective].filter(Boolean).join('\n\n');
    
    if (streaming) {
      const { streamingSolveDecision } = await import('@/lib/engine');
      const stream = await streamingSolveDecision(problem, language, fullContext, conversationContext, effectiveMode);
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
    }
    
    const { solveDecision } = await import('@/lib/engine');
    const rawBlueprint = await solveDecision(problem, language, fullContext, conversationContext, effectiveMode);
    const blueprint = normalizeBlueprint(rawBlueprint, problem, language, effectiveMode);

    // HARD ROUTING: Force Review Mode for detected review prompts
    if (isReview) {
      blueprint.isReviewMode = true;
      
      // Ensure recommendation starts with "Review:" and has no verdict classes
      const rec = String(blueprint.recommendation || '');
      const hasVerdictClass = ['Full Commit', 'Reversible Experiment', 'Delay', 'Kill The Idea']
        .some(cls => rec.includes(cls));
      if (hasVerdictClass || !rec.startsWith('Review:')) {
        blueprint.recommendation = 'Review: Milestone assessment — see scorecard below for 30/60/90-day checkpoint analysis.';
      }
      
      // Ensure milestoneTable is populated with 30/60/90 day structure
      if (!Array.isArray(blueprint.milestoneTable) || blueprint.milestoneTable.length === 0) {
        blueprint.milestoneTable = [
          {
            horizon: '30 days',
            milestone: 'Initial outcome signal',
            status: 'unknown',
            metric: 'Track against original assumptions',
            evidence: 'Validate if first-order metrics align with plan',
          },
          {
            horizon: '60 days',
            milestone: 'Pattern confirmation',
            status: 'unknown',
            metric: 'Confirm if trajectory holds or diverges',
            evidence: 'Early evidence about hidden assumption failures',
          },
          {
            horizon: '90 days',
            milestone: 'Decision verdict',
            status: 'unknown',
            metric: 'Final go / no-go checkpoint',
            evidence: 'Enough data to confirm or overturn original decision',
          },
        ];
      }
    }

    if (!isReview && bannedVerdict && extractVerdictClass(blueprint.recommendation) === bannedVerdict) {
      blueprint.recommendation = semanticVerdictExcluding(problem, effectiveMode, bannedVerdict);
    }
    const intentOverride = isReview ? null : enforceIntentRouting(problem, effectiveMode, blueprint.recommendation);
    if (intentOverride) blueprint.recommendation = intentOverride;
    const calibration = calibrateScore(blueprint.score, history, domain, problem, context);
    const riskPenalty =
      calibration.offset !== 0 && blueprint.riskMap && blueprint.riskMap.risk > 60
        ? -Math.min(8, Math.round((blueprint.riskMap.risk - 60) / 5))
        : 0;
    const finalConfidence = Math.round(
      Math.min(100, Math.max(0, calibration.calibratedScore + riskPenalty))
    );

    if (calibration.offset !== 0 || riskPenalty !== 0) {
      blueprint.score = finalConfidence;
      if (blueprint.riskMap) {
        blueprint.riskMap = {
          ...blueprint.riskMap,
          opportunity: finalConfidence,
        };
      }
    }

    blueprint.confidenceDrivers = {
      baseConfidence: calibration.rawScore,
      priorOutcomesAdjustment: calibration.offset,
      similarSuccessRate: calibration.similarSuccessRate,
      riskPenalty,
      finalConfidence: blueprint.score,
      sampleSize: calibration.sampleSize,
      evidence: calibration.evidence || [],
    };

    // Apply profile-driven adjustments deterministically after all other scoring.
    // This guarantees verdict, confidence, and next move reflect the user's tracked history
    // regardless of whether the model followed the prompt directive.
    const finalBlueprint = userProfileData
      ? applyProfileAdjustments(blueprint, userProfileData)
      : blueprint;
    if (!userProfileData) {
      finalBlueprint.decisionScore = 50;
      finalBlueprint.decisionScoreTrend = 'up';
      finalBlueprint.scoreMessage = scoreMessageFor(50);
    }

    const saved = await saveDecision({ problem, blueprint: finalBlueprint, context });
    const decisionAccuracy = computeDecisionAccuracy(history);
    const calibrationScore = computeCalibrationScore(history);

    const response: SolveResponse = {
      result: finalBlueprint,
      decisionId: saved.id,
      memoryScore,
      networkScore,
      calibratedScore: calibration.calibratedScore,
      calibrationOffset: calibration.offset,
      calibrationSampleSize: calibration.sampleSize,
      calibrationConfidence: calibration.confidence,
      decisionAccuracy,
      calibrationScore,
      sessionPressureLevel: pressureLevel,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while processing your decision.';
    console.error('API /api/solve error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
