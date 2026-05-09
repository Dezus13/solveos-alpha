"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Settings, Sparkles } from 'lucide-react';
import ArchitectureDashboard from '@/components/dashboard/ArchitectureDashboard';
import DecisionConsole from '@/components/DecisionConsole';
import SolveOSSymbol from '@/components/SolveOSSymbol';
import { getActionMetrics, getHistoryRecords, type ActionReminderRecord } from '@/lib/actionReminders';
import { detectInputLanguage, uiCopy, type SupportedLanguage } from '@/lib/i18n';
import { getSavedDecisions } from '@/lib/savedDecisions';
import { readSettings, type ProductSettings, writeSettings } from '@/lib/settings';
import { SETTINGS_UPDATED, type AppSettings } from '@/lib/settingsStore';
import type { ConversationTurn, DecisionBlueprint, SolveRequest, SolveResponse } from '@/lib/types';

import en from '@/locales/en/common.json';
import ar from '@/locales/ar/common.json';
import de from '@/locales/de/common.json';
import es from '@/locales/es/common.json';
import ru from '@/locales/ru/common.json';
import zh from '@/locales/zh/common.json';

type LocaleDictionary = Record<string, Record<string, string>>;

const initialLocales: LocaleDictionary = {
  auto: en,
  en,
  English: en,
  Arabic: ar,
  German: de,
  Spanish: es,
  Russian: ru,
  Chinese: zh,
};

const localeLoaders: Record<string, () => Promise<Record<string, string>>> = {
  Russian: () => import('@/locales/ru/common.json').then((m) => m.default),
  Arabic: () => import('@/locales/ar/common.json').then((m) => m.default),
  German: () => import('@/locales/de/common.json').then((m) => m.default),
  Spanish: () => import('@/locales/es/common.json').then((m) => m.default),
  Chinese: () => import('@/locales/zh/common.json').then((m) => m.default),
};

const ResultsSkeleton = () => (
  <div className="w-full rounded-2xl border border-white/10 bg-white/[0.025] p-6">
    <div className="h-3 w-32 rounded-full bg-white/10" />
    <div className="mt-5 space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-16 rounded-xl bg-white/[0.04]" />
      ))}
    </div>
  </div>
);

const SimulationResults = dynamic(() => import('@/components/SimulationResults'), {
  loading: () => <ResultsSkeleton />,
});

const SettingsModal = dynamic(() => import('@/components/SettingsModal'), {
  loading: () => null,
});

const CONVERSATION_STORAGE_KEY = 'solveos.conversation.v1';
const MAX_STORED_TURNS = 60;
const MAX_CONTEXT_TURNS = 12;

const normalizeClientLanguage = (value?: string) => {
  const language = typeof value === 'string' && value.trim() ? value.trim() : 'en';
  return language === 'auto' ? 'en' : language;
};

type ConcreteLanguage = Exclude<SupportedLanguage, 'auto'>;

const languageUx: Record<ConcreteLanguage, {
  failedGenerate: string;
  failedAdvanced: string;
  noBody: string;
  deepAnalysis: string;
  loadingDeep: string;
  emptyDeep: string;
}> = {
  English: {
    failedGenerate: 'Failed to generate response.',
    failedAdvanced: 'Failed to generate deeper analysis.',
    noBody: 'Failed to generate response.',
    deepAnalysis: 'Deep analysis',
    loadingDeep: 'Loading deep analysis...',
    emptyDeep: 'Deep analysis will appear here once ready.',
  },
  German: {
    failedGenerate: 'Antwort konnte nicht generiert werden.',
    failedAdvanced: 'Tiefe Analyse konnte nicht generiert werden.',
    noBody: 'Antwort konnte nicht generiert werden.',
    deepAnalysis: 'Tiefe Analyse',
    loadingDeep: 'Tiefe Analyse wird geladen...',
    emptyDeep: 'Die tiefe Analyse erscheint hier, sobald sie bereit ist.',
  },
  Russian: {
    failedGenerate: 'Не удалось сгенерировать ответ.',
    failedAdvanced: 'Не удалось сгенерировать глубокий анализ.',
    noBody: 'Не удалось сгенерировать ответ.',
    deepAnalysis: 'Глубокий анализ',
    loadingDeep: 'Загружаю глубокий анализ...',
    emptyDeep: 'Глубокий анализ появится здесь, когда будет готов.',
  },
  Arabic: {
    failedGenerate: 'تعذر إنشاء الرد.',
    failedAdvanced: 'تعذر إنشاء التحليل العميق.',
    noBody: 'تعذر إنشاء الرد.',
    deepAnalysis: 'تحليل عميق',
    loadingDeep: 'جار تحميل التحليل العميق...',
    emptyDeep: 'سيظهر التحليل العميق هنا عندما يكون جاهزًا.',
  },
  Spanish: {
    failedGenerate: 'No se pudo generar la respuesta.',
    failedAdvanced: 'No se pudo generar el análisis profundo.',
    noBody: 'No se pudo generar la respuesta.',
    deepAnalysis: 'Análisis profundo',
    loadingDeep: 'Cargando análisis profundo...',
    emptyDeep: 'El análisis profundo aparecerá aquí cuando esté listo.',
  },
  Chinese: {
    failedGenerate: '无法生成回复。',
    failedAdvanced: '无法生成深度分析。',
    noBody: '无法生成回复。',
    deepAnalysis: '深度分析',
    loadingDeep: '正在加载深度分析...',
    emptyDeep: '深度分析准备好后会显示在这里。',
  },
};

async function readSolveError(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return fallback;
    const data = await response.json() as Partial<SolveResponse>;
    return typeof data.error === 'string' && data.error.trim() ? data.error.trim() : fallback;
  } catch {
    return fallback;
  }
}

function isStoredConversationTurn(value: unknown): value is ConversationTurn {
  if (!value || typeof value !== 'object') return false;
  const turn = value as Partial<ConversationTurn>;
  return (
    typeof turn.id === 'string' &&
    (turn.role === 'user' || turn.role === 'assistant') &&
    typeof turn.content === 'string' &&
    typeof turn.timestamp === 'number'
  );
}

function readStoredConversation(): ConversationTurn[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isStoredConversationTurn)
      .filter((turn) => turn.content.trim())
      .slice(-MAX_STORED_TURNS);
  } catch {
    return [];
  }
}

function persistConversation(turns: ConversationTurn[]): void {
  if (typeof window === 'undefined') return;

  const compactTurns = turns
    .filter((turn) => turn.content.trim())
    .slice(-MAX_STORED_TURNS)
    .map((turn) => ({
      id: turn.id,
      role: turn.role,
      content: turn.content,
      isError: turn.isError,
      timestamp: turn.timestamp,
    }));

  if (compactTurns.length === 0) {
    window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(compactTurns));
}

function recentContextTurns(turns: ConversationTurn[]): SolveRequest['conversationHistory'] {
  return turns
    .filter((turn) => !turn.isError && turn.content.trim())
    .slice(-MAX_CONTEXT_TURNS)
    .map((turn) => ({
      role: turn.role,
      content: turn.content,
    }));
}

function uniqueLimited(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const compact = item.replace(/\s+/g, ' ').trim();
    if (!compact || seen.has(compact.toLowerCase())) continue;
    seen.add(compact.toLowerCase());
    result.push(compact.length > 180 ? `${compact.slice(0, 177).trim()}...` : compact);
    if (result.length >= limit) break;
  }
  return result;
}

function matchingSnippets(turns: ConversationTurn[], patterns: RegExp[], limit: number, role: ConversationTurn['role'] = 'user'): string[] {
  const snippets = turns
    .filter((turn) => turn.role === role && !turn.isError)
    .flatMap((turn) => turn.content.split(/(?<=[.!?。！？])\s+|\n+/))
    .filter((text) => patterns.some((pattern) => pattern.test(text.toLowerCase())));
  return uniqueLimited(snippets, limit);
}

function buildConversationMemory(turns: ConversationTurn[]): string {
  const cleanTurns = turns.filter((turn) => !turn.isError && turn.content.trim()).slice(-MAX_STORED_TURNS);
  if (cleanTurns.length === 0) return '';

  const userTurns = cleanTurns.filter((turn) => turn.role === 'user');
  const assistantTurns = cleanTurns.filter((turn) => turn.role === 'assistant');
  const goals = matchingSnippets(userTurns, [
    /\bgoal\b/, /\bi want\b/, /\bi need\b/, /\breach\b/, /\bgrow\b/, /\bearn\b/, /\brevenue\b/, /\b10k\b/,
    /цель/, /хочу/, /нужно/, /достичь/, /заработ/, /выручк/, /доход/,
    /ziel/, /ich will/, /ich möchte/, /ich moechte/, /erreichen/, /umsatz/,
  ], 3);
  const fears = matchingSnippets(userTurns, [
    /\bfear\b/, /\bafraid\b/, /\bscared\b/, /\bworried\b/, /\bfail\b/, /\bpressure\b/,
    /боюсь/, /страшно/, /пережива/, /провал/, /давлен/,
    /angst/, /sorge/, /scheiter/, /druck/,
  ], 3);
  const constraints = matchingSnippets(userTurns, [
    /\bbudget\b/, /\bmoney\b/, /\bno cash\b/, /\blimited\b/, /\btime\b/, /\bfamily\b/, /\baustria\b/, /\bjob\b/, /\bvisa\b/,
    /бюджет/, /денег/, /нет денег/, /огранич/, /время/, /семь/, /австри/, /работ/, /виза/,
    /budget/, /geld/, /wenig/, /zeit/, /familie/, /österreich/, /oesterreich/, /job/, /visum/,
  ], 4);
  const businessIdeas = matchingSnippets(userTurns, [
    /\bbusiness\b/, /\bstartup\b/, /\bidea\b/, /\bproduct\b/, /\bapp\b/, /\bagency\b/, /\bsaas\b/,
    /бизнес/, /стартап/, /иде/, /продукт/, /прилож/, /агентств/,
    /geschäft/, /geschaeft/, /startup/, /idee/, /produkt/, /app/, /agentur/,
  ], 4);
  const actionSignals = matchingSnippets(assistantTurns, [
    /\bnext\b/, /\btoday\b/, /\bdo this\b/, /\btest\b/, /\bvalidate\b/, /\bcall\b/, /\bship\b/,
    /следующ/, /сегодня/, /сделай/, /проверь/, /тест/, /запусти/,
    /nächste/, /naechste/, /heute/, /testen/, /validier/, /starte/,
  ], 3, 'assistant');
  const experiments = matchingSnippets(userTurns, [
    /\btested\b/, /\bvalidated\b/, /\bexperiment\b/, /\binterview\b/, /\blaunched\b/, /\bshipped\b/,
    /проверил/, /проверила/, /валидир/, /эксперимент/, /интервью/, /запустил/, /запустила/,
    /getestet/, /validiert/, /experiment/, /interview/, /gestartet/,
  ], 3);
  const winsFailures = matchingSnippets(userTurns, [
    /\bworked\b/, /\bwon\b/, /\bsuccess\b/, /\bfailed\b/, /\bdidn'?t work\b/, /\bno one\b/, /\brejected\b/,
    /получилось/, /сработало/, /успех/, /провал/, /не сработало/, /отказ/,
    /funktioniert/, /erfolg/, /gescheitert/, /hat nicht funktioniert/, /abgelehnt/,
  ], 3);
  const currentStage = matchingSnippets(userTurns, [
    /\bnow\b/, /\bcurrently\b/, /\bat this stage\b/, /\bthis month\b/, /\bnext month\b/,
    /сейчас/, /теперь/, /на этом этапе/, /в этом месяце/, /следующий месяц/,
    /jetzt/, /aktuell/, /in dieser phase/, /diesen monat/, /nächsten monat/, /naechsten monat/,
  ], 2);
  const decisions = assistantTurns
    .map((turn) => turn.content.split(/\n/)[0] || turn.content)
    .filter((line) => /^(Full Commit|Reversible Experiment|Delay|Kill The Idea|Review|Обратимый|Отлож|Запускай|Не делай|Reversibles|Verzögere|Stoppe)/i.test(line.trim()));
  const recurringThemes = uniqueLimited(
    ['budget', 'family pressure', 'Austria', 'learning programming', 'execution speed', 'market validation', 'fear of failure']
      .filter((theme) => cleanTurns.map((turn) => turn.content.toLowerCase()).join(' ').includes(theme.toLowerCase())),
    5
  );

  const outcomeLearning = buildLocalOutcomeMemory();
  const lines = [
    goals.length ? `Goals: ${goals.join(' | ')}` : '',
    fears.length ? `Fears/pressure: ${fears.join(' | ')}` : '',
    constraints.length ? `Constraints: ${constraints.join(' | ')}` : '',
    businessIdeas.length ? `Business ideas/context: ${businessIdeas.join(' | ')}` : '',
    experiments.length ? `Experiments already tried: ${experiments.join(' | ')}` : '',
    winsFailures.length ? `Wins/failures: ${winsFailures.join(' | ')}` : '',
    currentStage.length ? `Current stage: ${currentStage.join(' | ')}` : '',
    decisions.length ? `Decisions already advised: ${uniqueLimited(decisions, 3).join(' | ')}` : '',
    actionSignals.length ? `Unfinished or proposed actions: ${actionSignals.join(' | ')}` : '',
    recurringThemes.length ? `Recurring themes: ${recurringThemes.join(', ')}` : '',
    outcomeLearning,
  ].filter(Boolean);

  return lines.length ? lines.join('\n').slice(0, 1800) : '';
}

function actionStatusSummary(record: ActionReminderRecord): string {
  const action = record.action.replace(/\s+/g, ' ').trim();
  const clipped = action.length > 90 ? `${action.slice(0, 87).trim()}...` : action;
  if (record.status === 'done') return `completed: ${clipped}`;
  if (record.status === 'skipped') return `abandoned/skipped: ${clipped}`;
  if (record.status === 'overdue') return `missed/overdue: ${clipped}`;
  if (record.status === 'blocked') return `blocked: ${record.blockerCategory || 'unknown'} -> ${clipped}`;
  return `pending: ${clipped}`;
}

function buildLocalOutcomeMemory(): string {
  if (typeof window === 'undefined') return '';

  const actionHistory = getHistoryRecords().slice(0, 8);
  const savedDecisions = getSavedDecisions().slice(0, 8);
  if (actionHistory.length === 0 && savedDecisions.length === 0) return '';

  const metrics = getActionMetrics();
  const done = actionHistory.filter(([, record]) => record.status === 'done').length;
  const weak = actionHistory.filter(([, record]) => (
    record.status === 'skipped' || record.status === 'overdue' || record.status === 'blocked'
  )).length;
  const pending = actionHistory.filter(([, record]) => (
    record.status === 'not yet' || record.status === 'pending'
  )).length;
  const workedDecisions = savedDecisions.filter((decision) => decision.status === 'worked').length;
  const failedDecisions = savedDecisions.filter((decision) => decision.status === 'failed').length;

  const tendencies = [
    actionHistory.length >= 3 && done >= weak + pending ? 'Execution pattern: completed actions are common; advice can assume practical follow-through.' : '',
    actionHistory.length >= 3 && weak >= done ? 'Execution pattern: skipped/blocked/overdue actions appear often; compress future advice into one smaller action.' : '',
    metrics.streak >= 2 ? `Execution pattern: current completion streak ${metrics.streak}; rapid validation advice can be useful.` : '',
    savedDecisions.length >= 3 && failedDecisions > workedDecisions ? 'Decision outcome pattern: failed outcomes outnumber worked ones; stress-test assumptions and distribution earlier.' : '',
    savedDecisions.length >= 3 && workedDecisions >= 2 ? 'Decision outcome pattern: prior completed decisions have produced wins; move toward higher-leverage next steps when evidence is similar.' : '',
  ].filter(Boolean);

  const recentActions = actionHistory
    .slice(0, 4)
    .map(([, record]) => actionStatusSummary(record));
  const recentDecisions = savedDecisions
    .filter((decision) => decision.status !== 'pending')
    .slice(0, 3)
    .map((decision) => `${decision.status}: ${decision.question.slice(0, 90)}${decision.lesson ? ` -> ${decision.lesson.slice(0, 90)}` : ''}`);

  return [
    'Decision outcome learning:',
    tendencies.join(' '),
    recentActions.length ? `Recent action outcomes: ${recentActions.join(' | ')}` : '',
    recentDecisions.length ? `Recent decision outcomes: ${recentDecisions.join(' | ')}` : '',
    'Use this subtly. Do not mention tracking, scores, analytics, or labels.',
  ].filter(Boolean).join('\n');
}

export default function HomeExperience() {
  const [thread, setThread] = useState<ConversationTurn[]>(() => readStoredConversation());
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [settings, setSettings] = useState<ProductSettings>(() => readSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [locales, setLocales] = useState<LocaleDictionary>(initialLocales);
  const [latestBlueprint, setLatestBlueprint] = useState<DecisionBlueprint | null>(null);
  const [pipelineReport, setPipelineReport] = useState<unknown>(undefined);
  const [pipelineLatencyMs, setPipelineLatencyMs] = useState<number | undefined>(undefined);
  const [pipelineUpdatedAt, setPipelineUpdatedAt] = useState<number | undefined>(undefined);
  const [activeLanguage, setActiveLanguage] = useState<ConcreteLanguage>(() => readSettings().language.uiLanguage);
  const [resetKey, setResetKey] = useState(0);
  const fetchGenRef = useRef(0);

  // Keep a stable ref to thread so handleSubmit always sees the latest value
  const threadRef = useRef<ConversationTurn[]>([]);
  useEffect(() => { threadRef.current = thread; }, [thread]);

  useEffect(() => {
    persistConversation(thread);
  }, [thread]);

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);

  useEffect(() => {
    const syncAppearance = (event: Event) => {
      const next = (event as CustomEvent<AppSettings>).detail;
      if (!next) return;
      setSettings((current) => {
        if (
          current.appearance.theme === next.theme &&
          current.appearance.accent === next.accent &&
          current.appearance.density === next.density
        ) {
          return current;
        }
        return { ...current, appearance: next };
      });
    };
    window.addEventListener(SETTINGS_UPDATED, syncAppearance);
    return () => window.removeEventListener(SETTINGS_UPDATED, syncAppearance);
  }, []);

  const latestUserMessage = useMemo(() => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === 'user') return thread[i].content;
    }
    return '';
  }, [thread]);

  const interfaceLanguage = settings.language.uiLanguage;
  const t = locales[interfaceLanguage as string] || locales.English;
  const interfaceCopy = uiCopy[interfaceLanguage] || uiCopy.English;
  const activeCopy = uiCopy[activeLanguage] || uiCopy[interfaceLanguage] || uiCopy.English;
  const ux = languageUx[activeLanguage] || languageUx.English;

  const ensureLocale = useCallback(
    async (next: string) => {
      const normalized = normalizeClientLanguage(next);
      if (locales[normalized]) return;
      const loader = localeLoaders[next];
      if (!loader) return;
      const dict = await loader();
      setLocales((prev) => (prev[normalized] ? prev : { ...prev, [normalized]: dict }));
    },
    [locales],
  );

  const updateSettings = useCallback((next: ProductSettings) => {
    setSettings(next);
    void ensureLocale(next.language.uiLanguage);
    void ensureLocale(next.language.customDecisionLanguage);
  }, [ensureLocale]);

  const handleReset = useCallback(() => {
    setThread([]);
    setLatestBlueprint(null);
    setPipelineReport(undefined);
    setPipelineLatencyMs(undefined);
    setPipelineUpdatedAt(undefined);
    setAdvancedOpen(false);
    setResetKey((k) => k + 1);
  }, []);

  const handleSubmit = useCallback(
    async (message: string, mode = 'Strategy') => {
      const userTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      setThread((prev) => [...prev, userTurn]);
      setLatestBlueprint(null);
      setPipelineReport(undefined);
      setPipelineLatencyMs(undefined);
      setAnalysisError(null);
      setAdvancedOpen(false);
      setLoading(true);
      setStreaming(true);
      fetchGenRef.current += 1;
      const requestLanguage = detectInputLanguage(message, settings.language.uiLanguage);
      const requestUx = languageUx[requestLanguage] || languageUx.English;
      setActiveLanguage(requestLanguage);
      void ensureLocale(requestLanguage);

      try {
        const requestStartedAt = performance.now();
        const body: SolveRequest = {
          problem: message,
          language: requestLanguage,
          mode: mode === 'Risk' || mode === 'Scenarios' || mode === 'Red Team' ? mode : 'Strategy',
          conversationHistory: recentContextTurns(threadRef.current),
          conversationMemory: buildConversationMemory(threadRef.current),
          streaming: true,
        };

        const response = await fetch('/api/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(await readSolveError(response, requestUx.failedGenerate));
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error(requestUx.noBody);

        let assistantContent = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          
          // Update the thread with the current content
          setThread((prev) => {
            const last = prev[prev.length - 1];
            if (last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: assistantContent,
                  timestamp: Date.now(),
                },
              ];
            }

            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: assistantContent,
                timestamp: Date.now(),
              },
            ];
          });
        }

        if (!assistantContent.trim()) {
          throw new Error(requestUx.failedGenerate);
        }

        // Finalize
        setPipelineLatencyMs(performance.now() - requestStartedAt);
        setPipelineUpdatedAt(Date.now());
        setStreaming(false);
      } catch (err) {
        const message = err instanceof Error && err.message ? err.message : requestUx.failedGenerate;
        const errorTurn: ConversationTurn = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message,
          isError: true,
          timestamp: Date.now(),
        };
        setThread((prev) => [...prev, errorTurn]);
        setStreaming(false);
      } finally {
        setLoading(false);
      }
    },
    [ensureLocale, settings.language.uiLanguage],
  );

  const handleLoadAdvancedAnalysis = useCallback(async () => {
    if (!latestUserMessage) return;
    setAnalysisError(null);
    setAdvancedOpen(true);
    if (latestBlueprint) return;
    setAnalysisLoading(true);
    setPipelineLatencyMs(undefined);
    const requestLanguage = detectInputLanguage(latestUserMessage, settings.language.uiLanguage);
    const requestUx = languageUx[requestLanguage] || languageUx.English;
    setActiveLanguage(requestLanguage);
    void ensureLocale(requestLanguage);

    try {
      const requestStartedAt = performance.now();
      const body: SolveRequest = {
        problem: latestUserMessage,
        language: requestLanguage,
        mode: 'Risk',
        conversationHistory: recentContextTurns(threadRef.current),
        conversationMemory: buildConversationMemory(threadRef.current),
        debugPipeline: true,
      };

      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null) as SolveResponse | null;
      if (!response.ok || !data?.result) {
        const apiMessage = data?.error || await readSolveError(response, requestUx.failedAdvanced);
        throw new Error(apiMessage);
      }

      const blueprint = data.result as DecisionBlueprint;
      blueprint.language = requestLanguage;
      setLatestBlueprint(blueprint);
      setPipelineReport(data.debug?.pipeline);
      setPipelineLatencyMs(performance.now() - requestStartedAt);
      setPipelineUpdatedAt(Date.now());
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : requestUx.failedAdvanced;
      setAnalysisError(message);
    } finally {
      setAnalysisLoading(false);
    }
  }, [ensureLocale, latestBlueprint, latestUserMessage, settings.language.uiLanguage]);

  const resultKey = useMemo(
    () => `${latestUserMessage}-${latestBlueprint?.recommendation || ''}`,
    [latestBlueprint?.recommendation, latestUserMessage],
  );

  const hasAssistantResponse = useMemo(
    () => thread.some((turn) => turn.role === 'assistant'),
    [thread],
  );

  return (
    <div className="solveos-app-shell relative z-10 flex h-screen w-full overflow-hidden bg-[#080D1A]">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#090E1B]/86 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <SolveOSSymbol className="h-7 w-7" />
            <span className="font-semibold text-white">SolveOS</span>
          </div>
          <div className="flex items-center gap-2">
            {thread.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {activeCopy.newChat}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        <DecisionConsole
          thread={thread}
          loading={loading}
          streaming={streaming}
          onSubmit={handleSubmit}
          copy={activeCopy}
          settings={settings}
          key={resetKey}
        />

        {hasAssistantResponse && (
          <div className="border-t border-white/10 bg-[#090E1B]/95 px-4 py-4">
            <div className="mx-auto max-w-3xl text-center">
              <button
                type="button"
                onClick={handleLoadAdvancedAnalysis}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <Sparkles className="h-4 w-4" />
                {analysisLoading ? ux.loadingDeep : ux.deepAnalysis}
              </button>
              {analysisError && (
                <p className="mt-2 text-sm text-rose-300">{analysisError}</p>
              )}
            </div>
          </div>
        )}

        {advancedOpen && (
          <div className="border-t border-white/10 bg-[#090E1B]/95">
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-8 pt-5">
              <div className="mx-auto max-w-5xl space-y-6">
                {analysisLoading && !latestBlueprint ? (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-8 text-center text-sm text-slate-400">
                    {ux.loadingDeep}
                  </div>
                ) : latestBlueprint ? (
                  <>
                    <SimulationResults
                      key={resultKey}
                      result={latestBlueprint}
                      submittedProblem={latestUserMessage}
                      initialShowBoard={false}
                      t={t}
                    />
                  </>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-8 text-center text-sm text-slate-400">
                    {ux.emptyDeep}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSettingsChange={updateSettings}
          copy={interfaceCopy}
          conversations={thread}
          onDeleteHistory={handleReset}
        />
      )}

      <div className="hidden xl:block">
        <ArchitectureDashboard
          pipeline={pipelineReport}
          loading={loading || analysisLoading}
          streaming={streaming}
          latencyMs={pipelineLatencyMs}
          lastUpdatedAt={pipelineUpdatedAt}
        />
      </div>
    </div>
  );
}
