"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BookOpen, ChevronDown, Loader2, MessageSquare, Plus, Settings } from 'lucide-react';
import DecisionConsole from '@/components/DecisionConsole';
import SolveOSSymbol from '@/components/SolveOSSymbol';
import { detectInputLanguage, uiCopy } from '@/lib/i18n';
import { readSettings, type ProductSettings, writeSettings } from '@/lib/settings';
import { SETTINGS_UPDATED, type AppSettings } from '@/lib/settingsStore';
import type { IntelligenceSnapshot } from '@/components/IntelligenceRail';
import DecisionJournal from '@/components/DecisionJournal';
import type { ConversationTurn, DecisionBlueprint, SolveRequest } from '@/lib/types';
import { getSavedDecisions, saveDecision } from '@/lib/savedDecisions';
import { getProfile, getIdentityLabel } from '@/lib/userProfile';
import { generatePatternInsight } from '@/lib/patternInsight';
import { ensureActionReminder } from '@/lib/actionReminders';

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

const RailSkeleton = () => (
  <aside className="hidden xl:flex flex-col w-72 space-y-4 ml-6">
    {[0, 1, 2].map((item) => (
      <div key={item} className="rounded-2xl border border-white/10 bg-[#0B1020]/50 p-6">
        <div className="h-3 w-24 rounded-full bg-white/10" />
        <div className="mt-6 h-16 rounded-xl bg-white/[0.04]" />
      </div>
    ))}
  </aside>
);

const ResultsSkeleton = () => (
  <div className="mt-8 w-full rounded-3xl border border-white/10 bg-[#0B1020]/70 p-6">
    <div className="h-3 w-32 rounded-full bg-white/10" />
    <div className="mt-5 grid grid-cols-3 gap-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-20 rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  </div>
);

const IntelligenceRail = dynamic(() => import('@/components/IntelligenceRail'), {
  loading: () => <RailSkeleton />,
});

const SettingsModal = dynamic(() => import('@/components/SettingsModal'), {
  loading: () => null,
});

const SimulationResults = dynamic(() => import('@/components/SimulationResults'), {
  loading: () => <ResultsSkeleton />,
});

const idleSnapshot: IntelligenceSnapshot = {
  status: 'idle',
  successProbability: 0,
  downsideRisk: 0,
  blackSwanExposure: 0,
  recommendedPath: 'Run a simulation to unlock the recommended path.',
  verdict: 'Awaiting decision input.',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeClientLanguage = (value?: string) => {
  const language = typeof value === 'string' && value.trim() ? value.trim() : 'en';
  return language === 'auto' ? 'en' : language;
};

function readableThreadTitle(message: string): string {
  const cleaned = message
    .replace(/\s+/g, ' ')
    .replace(/^(should|can|could|would)\s+i\s+/i, '')
    .replace(/^(should|can|could|would)\s+we\s+/i, '')
    .replace(/[?.!]+$/g, '')
    .trim();
  if (!cleaned) return 'New decision';
  const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return title.length > 42 ? `${title.slice(0, 42)}...` : title;
}

const conciseLabels: Record<string, { verdict: string; why: string; next: string; score: string; identity: string; pattern: string; follow: string; ignore: string; deadline: string }> = {
  English: { verdict: 'Verdict', why: 'Why', next: 'Do this next', score: 'Score', identity: 'Identity', pattern: 'Pattern', follow: 'You follow through', ignore: 'You ignore your own rules', deadline: 'Deadline' },
  Russian: { verdict: 'Вердикт', why: 'Почему', next: 'Сделай дальше', score: 'Оценка', identity: 'Идентичность', pattern: 'Паттерн', follow: 'Ты доводишь до конца', ignore: 'Ты игнорируешь свои правила', deadline: 'Дедлайн' },
  German: { verdict: 'Urteil', why: 'Warum', next: 'Als Nächstes tun', score: 'Score', identity: 'Identität', pattern: 'Muster', follow: 'Du setzt konsequent um', ignore: 'Du ignorierst deine eigenen Regeln', deadline: 'Frist' },
  Spanish: { verdict: 'Veredicto', why: 'Por qué', next: 'Haz esto ahora', score: 'Puntuación', identity: 'Identidad', pattern: 'Patrón', follow: 'Cumples lo que decides', ignore: 'Ignoras tus propias reglas', deadline: 'Fecha límite' },
  Arabic: { verdict: 'الحكم', why: 'السبب', next: 'افعل هذا الآن', score: 'النتيجة', identity: 'الهوية', pattern: 'النمط', follow: 'أنت تلتزم بالتنفيذ', ignore: 'أنت تتجاهل قواعدك', deadline: 'الموعد النهائي' },
  Chinese: { verdict: '结论', why: '原因', next: '下一步', score: '分数', identity: '身份', pattern: '模式', follow: '你会执行到底', ignore: '你忽视自己的规则', deadline: '截止时间' },
};

function oneLine(value: string | undefined, max = 150): string {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const sentence = text.split(/(?<=[.!?。！？])\s+/)[0] || text;
  return sentence.length > max ? `${sentence.slice(0, max - 3).trim()}...` : sentence;
}

function actionText(blueprint: DecisionBlueprint, language: string): string {
  const forced = language === 'English'
    ? blueprint.forcedAction?.replace(/^Do this next:\s*/i, '').replace(/\s+/g, ' ').trim()
    : '';
  return oneLine(forced || blueprint.actionPlan?.today || blueprint.operatorNextSteps?.[0] || blueprint.actionPlan?.thisWeek, 120);
}

function buildAssistantAnswer(blueprint: DecisionBlueprint): string {
  const language = blueprint.language || 'English';
  const labels = conciseLabels[language] || conciseLabels.English;
  const verdict = oneLine(blueprint.recommendation || 'Decision analysis completed.', 150);
  const why = [
    oneLine(blueprint.diagnosis?.coreProblem, 110),
    oneLine(blueprint.diagnosis?.keyRisks || blueprint.skepticView?.whatCouldBreak, 110),
  ].filter(Boolean).slice(0, 2);
  const score = typeof blueprint.confidenceScore === 'number' || typeof blueprint.score === 'number'
    ? `${labels.score}: ${blueprint.confidenceScore ?? blueprint.score}/100`
    : '';
  const next = actionText(blueprint, language);

  return [
    score,
    `${labels.verdict}: ${verdict}`,
    why.length ? `${labels.why}: ${why.join(' ')}` : '',
    `${labels.next}: ${next || verdict}`,
    `${labels.deadline}: 24h`,
  ].filter(Boolean).join('\n');
}

function buildIntelligenceSnapshot(
  blueprint: DecisionBlueprint | null,
  status: IntelligenceSnapshot['status'],
): IntelligenceSnapshot {
  if (!blueprint) {
    return status === 'running'
      ? {
          status,
          successProbability: 42,
          downsideRisk: 34,
          blackSwanExposure: 28,
          recommendedPath: 'Running scenario branches...',
          verdict: 'Simulation is testing the obvious move against harder futures.',
        }
      : idleSnapshot;
  }

  const score = clamp(Number(blueprint.score) || 68, 0, 100);
  const downsideRisk = clamp(100 - score + 12, 8, 82);
  const blackSwanExposure = clamp(
    Math.round((downsideRisk + (blueprint.paths?.bold?.cons?.length || 1) * 9) / 2),
    6,
    76,
  );
  const pathName =
    score >= 82
      ? 'Bold path with staged safeguards'
      : score >= 58
        ? 'Balanced path with explicit kill criteria'
        : 'Safe path until evidence improves';

  return {
    status,
    successProbability: score,
    downsideRisk,
    blackSwanExposure,
    recommendedPath: pathName,
    verdict: blueprint.recommendation || 'Proceed only after validating the core assumption.',
  };
}

export default function HomeExperience() {
  const [thread, setThread] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ProductSettings>(() => readSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [intelligence, setIntelligence] = useState<IntelligenceSnapshot>(idleSnapshot);
  const [locales, setLocales] = useState<LocaleDictionary>(initialLocales);
  const [memoryScore, setMemoryScore] = useState(0);
  const [networkScore, setNetworkScore] = useState(0);
  const [calibratedScore, setCalibratedScore] = useState<number | undefined>(undefined);
  const [calibrationOffset, setCalibrationOffset] = useState<number | undefined>(undefined);
  const [calibrationSampleSize, setCalibrationSampleSize] = useState<number | undefined>(undefined);
  const [decisionAccuracy, setDecisionAccuracy] = useState<number | undefined>(undefined);
  const [calibrationScore, setCalibrationScore] = useState<number | undefined>(undefined);
  const [latestDecisionId, setLatestDecisionId] = useState<string | undefined>(undefined);
  const [activeMode, setActiveMode] = useState('Strategy');
  const [modeBlueprints, setModeBlueprints] = useState<Record<string, DecisionBlueprint>>({});
  const [modesLoading, setModesLoading] = useState<Record<string, boolean>>({});
  const [resetKey, setResetKey] = useState(0);
  const fetchGenRef = useRef(0);

  // Keep a stable ref to thread so handleSubmit always sees the latest value
  const threadRef = useRef<ConversationTurn[]>([]);
  useEffect(() => { threadRef.current = thread; }, [thread]);

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

  const latestBlueprint = useMemo(() => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === 'assistant' && thread[i].blueprint) return thread[i].blueprint!;
    }
    return null;
  }, [thread]);

  const latestUserMessage = useMemo(() => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === 'user') return thread[i].content;
    }
    return '';
  }, [thread]);

  const interfaceLanguage = settings.language.uiLanguage;
  const t = locales[interfaceLanguage as string] || locales.English;
  const copy = uiCopy[interfaceLanguage] || uiCopy.English;

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
    setIntelligence(idleSnapshot);
    setMemoryScore(0);
    setNetworkScore(0);
    setCalibratedScore(undefined);
    setCalibrationOffset(undefined);
    setCalibrationSampleSize(undefined);
    setLatestDecisionId(undefined);
    setActiveMode('Strategy');
    setModeBlueprints({});
    setModesLoading({});
    setAdvancedOpen(false);
    setResetKey((k) => k + 1);
  }, []);

  const handleSaveDecision = useCallback((turnId: string) => {
    const currentThread = threadRef.current;
    const turnIndex = currentThread.findIndex((t) => t.id === turnId);
    if (turnIndex === -1) return;
    const turn = currentThread[turnIndex];
    if (!turn.blueprint) return;
    // find the preceding user message
    let question = '';
    for (let i = turnIndex - 1; i >= 0; i--) {
      if (currentThread[i].role === 'user') { question = currentThread[i].content; break; }
    }
    const risks = [
      turn.blueprint.diagnosis?.keyRisks,
      turn.blueprint.skepticView?.hiddenFlaw,
      turn.blueprint.skepticView?.whatCouldBreak,
    ].filter((r): r is string => typeof r === 'string' && r.length > 0);

    saveDecision({
      id: turnId,
      question: question || 'Untitled decision',
      verdict: turn.blueprint.recommendation || '',
      confidence: turn.blueprint.confidenceScore ?? turn.blueprint.score,
      keyRisks: risks,
      timestamp: new Date(turn.timestamp).toISOString(),
      status: 'pending',
      forcedAction: turn.blueprint.forcedAction,
    });
  }, [threadRef]);

  const handleSubmit = useCallback(
    async (message: string, mode = 'Strategy') => {
      // Preload heavy chunks
      void import('@/components/SimulationResults');
      void import('@/components/DecisionBlueprint');
      void import('@/components/AgentEngine');

      const userTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      setThread((prev) => [...prev, userTurn]);
      setLoading(true);
      setIntelligence(buildIntelligenceSnapshot(null, 'running'));
      setModeBlueprints({});
      setModesLoading({});
      setActiveMode(mode);
      fetchGenRef.current += 1;
      const submitGen = fetchGenRef.current;

      try {
        const requestLanguage = detectInputLanguage(message, settings.language.uiLanguage);
        const currentProfile = getProfile();
        const body: SolveRequest = {
          problem: message,
          language: requestLanguage,
          mode: mode === 'Risk' || mode === 'Scenarios' || mode === 'Red Team' ? mode : 'Strategy',
          conversationHistory: threadRef.current.map((t) => ({
            role: t.role,
            content: t.role === 'assistant' ? (t.blueprint?.recommendation || t.content) : t.content,
          })),
          ...(currentProfile.totalDecisions > 0 ? {
            userProfileData: {
              riskTolerance: currentProfile.riskTolerance,
              executionScore: currentProfile.executionScore,
              biasPatterns: currentProfile.biasPatterns,
              totalDecisions: currentProfile.totalDecisions,
              userDecisionScore: currentProfile.userDecisionScore,
              decisionScoreTrend: currentProfile.decisionScoreTrend,
            },
          } : {}),
        };

        const response = await fetch('/api/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to generate solution');

        if (typeof data.directResponse === 'string') {
          const assistantTurn: ConversationTurn = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.directResponse,
            intent: data.intent,
            timestamp: Date.now(),
          };
          setThread((prev) => [...prev, assistantTurn]);
          setIntelligence(buildIntelligenceSnapshot(null, 'complete'));
          return;
        }

        const blueprint = data?.result as DecisionBlueprint | undefined;
        if (!blueprint) throw new Error(data?.error || 'Decision engine returned no result.');
        blueprint.language = blueprint.language || 'English';
        const insightResult = generatePatternInsight(getSavedDecisions(), blueprint.score);
        if (insightResult) {
          blueprint.patternInsight = insightResult.patternInsight;
          blueprint.forcedAction = insightResult.forcedAction;
        }
        const latestProfile = getProfile();
        blueprint.decisionScore = latestProfile.userDecisionScore;
        blueprint.decisionScoreTrend = latestProfile.decisionScoreTrend;
        blueprint.scoreMessage = latestProfile.userDecisionScore >= 50 ? 'You follow through' : 'You ignore your own rules';
        if (typeof data.decisionId === 'string') setLatestDecisionId(data.decisionId);
        if (blueprint.language) void ensureLocale(blueprint.language);
        setAdvancedOpen(settings.general.advancedByDefault);

        const assistantTurn: ConversationTurn = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: buildAssistantAnswer(blueprint),
          blueprint,
          timestamp: Date.now(),
        };

        setThread((prev) => [...prev, assistantTurn]);

        // Auto-save decision and trigger action reminder so the banner fires immediately
        const actionForReminder = actionText(blueprint, blueprint.language || 'English');
        const decisionRisks = [
          blueprint.diagnosis?.keyRisks,
          blueprint.skepticView?.hiddenFlaw,
          blueprint.skepticView?.whatCouldBreak,
        ].filter((r): r is string => typeof r === 'string' && r.length > 0);
        saveDecision({
          id: assistantTurn.id,
          question: message,
          verdict: blueprint.recommendation || '',
          confidence: blueprint.confidenceScore ?? blueprint.score,
          keyRisks: decisionRisks,
          timestamp: new Date(assistantTurn.timestamp).toISOString(),
          status: 'pending',
          forcedAction: actionForReminder || undefined,
        });
        if (actionForReminder) {
          ensureActionReminder(assistantTurn.id, actionForReminder, message);
        }

        if (!blueprint.isReviewMode && fetchGenRef.current === submitGen) {
          const normalMode = mode === 'Risk' || mode === 'Scenarios' || mode === 'Red Team' ? mode : 'Strategy';
          setModeBlueprints(prev => ({ ...prev, [normalMode]: blueprint }));
        }

        const snap = buildIntelligenceSnapshot(blueprint, 'complete');
        if (typeof data.memoryScore === 'number') {
          snap.memoryScore = data.memoryScore;
          setMemoryScore(data.memoryScore);
        }
        if (typeof data.networkScore === 'number') setNetworkScore(data.networkScore);
        if (typeof data.calibratedScore === 'number') setCalibratedScore(data.calibratedScore);
        if (typeof data.calibrationOffset === 'number') setCalibrationOffset(data.calibrationOffset);
        if (typeof data.calibrationSampleSize === 'number') setCalibrationSampleSize(data.calibrationSampleSize);
        if (typeof data.decisionAccuracy === 'number') setDecisionAccuracy(data.decisionAccuracy);
        if (typeof data.calibrationScore === 'number') setCalibrationScore(data.calibrationScore);
        setIntelligence(snap);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        const errorTurn: ConversationTurn = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message,
          isError: true,
          timestamp: Date.now(),
        };
        setThread((prev) => [...prev, errorTurn]);
        setIntelligence(idleSnapshot);
      } finally {
        setLoading(false);
      }
    },
    [ensureLocale, settings.general.advancedByDefault, settings.language.uiLanguage],
  );

  const fetchModeBlueprint = useCallback(async (problem: string, fetchMode: string) => {
    const gen = fetchGenRef.current;
    setModesLoading(prev => ({ ...prev, [fetchMode]: true }));
    try {
      const requestLanguage = detectInputLanguage(problem, settings.language.uiLanguage);
      const currentProfile = getProfile();
      const body: SolveRequest = {
        problem,
        language: requestLanguage,
        mode: fetchMode as SolveRequest['mode'],
        conversationHistory: threadRef.current.map((t) => ({
          role: t.role,
          content: t.role === 'assistant' ? (t.blueprint?.recommendation || t.content) : t.content,
        })),
        ...(currentProfile.totalDecisions > 0 ? {
          userProfileData: {
            riskTolerance: currentProfile.riskTolerance,
            executionScore: currentProfile.executionScore,
            biasPatterns: currentProfile.biasPatterns,
            totalDecisions: currentProfile.totalDecisions,
            userDecisionScore: currentProfile.userDecisionScore,
            decisionScoreTrend: currentProfile.decisionScoreTrend,
          },
        } : {}),
      };
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      if (data.result && fetchGenRef.current === gen) {
        const bp = data.result as DecisionBlueprint;
        bp.language = bp.language || 'English';
        const bpInsightResult = generatePatternInsight(getSavedDecisions(), bp.score);
        if (bpInsightResult) {
          bp.patternInsight = bpInsightResult.patternInsight;
          bp.forcedAction = bpInsightResult.forcedAction;
        }
        const latestProfile = getProfile();
        bp.decisionScore = latestProfile.userDecisionScore;
        bp.decisionScoreTrend = latestProfile.decisionScoreTrend;
        bp.scoreMessage = getIdentityLabel(latestProfile.userDecisionScore);
        setModeBlueprints(prev => ({ ...prev, [fetchMode]: bp }));
      }
    } catch {
      // silent — background mode fetch failure doesn't surface
    } finally {
      setModesLoading(prev => ({ ...prev, [fetchMode]: false }));
    }
  }, [settings.language.uiLanguage, threadRef]);

  const handleModeChange = useCallback((mode: string) => {
    setActiveMode(mode);
    let latestProblem = '';
    for (let i = threadRef.current.length - 1; i >= 0; i--) {
      if (threadRef.current[i].role === 'user') {
        latestProblem = threadRef.current[i].content;
        break;
      }
    }
    if (!latestProblem) return;
    setAdvancedOpen(true);
    if (!modeBlueprints[mode]) {
      void fetchModeBlueprint(latestProblem, mode);
    }
  }, [modeBlueprints, fetchModeBlueprint, threadRef]);

  const loadedModes = useMemo(() => new Set(Object.keys(modeBlueprints)), [modeBlueprints]);

  const resultKey = useMemo(
    () => `${latestUserMessage}-${latestBlueprint?.recommendation || ''}-${activeMode}`,
    [latestBlueprint?.recommendation, latestUserMessage, activeMode],
  );

  const conversationTitle = useMemo(() => {
    const firstUser = thread.find((turn) => turn.role === 'user')?.content;
    if (!firstUser) return 'New decision';
    return readableThreadTitle(firstUser);
  }, [thread]);

  return (
    <div className="solveos-app-shell relative z-10 flex h-screen w-full overflow-hidden">
      <aside className={`hidden flex-shrink-0 flex-col border-r border-white/10 bg-[#080D1A]/88 p-4 backdrop-blur-xl md:flex ${settings.appearance.density === 'compact' ? 'w-64' : 'w-72'}`}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SolveOSSymbol className="h-7 w-7" />
            <div>
              <div className="text-sm font-semibold text-white">{copy.appName}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {loading ? copy.statusThinking : copy.statusLive}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.06]"
        >
          <Plus className="h-4 w-4" />
          {copy.newChat}
        </button>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2">
          {/* Current conversation */}
          {thread.length > 0 && (
            <>
              <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">{copy.history}</div>
              <button
                type="button"
                className="mb-4 flex w-full items-start gap-2 rounded-xl bg-purple-500/[0.08] px-3 py-3 text-left text-sm text-slate-200"
              >
                <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-300" />
                <span className="line-clamp-2">{conversationTitle}</span>
              </button>
            </>
          )}

          {/* Decision Journal */}
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Decision Journal</span>
            <Link
              href="/journal"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-purple-300"
            >
              <BookOpen className="h-3 w-3" />
              View all
            </Link>
          </div>
          <DecisionJournal
            refreshTrigger={latestDecisionId}
            currentDecisionId={latestDecisionId}
            onReview={(problem) => void handleSubmit(`Revisit: ${problem}`)}
          />
        </div>

      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#090E1B]/86 px-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <SolveOSSymbol className="h-7 w-7" />
            <span className="font-semibold text-white">{copy.appName}</span>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400"
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </header>

        <DecisionConsole
          thread={thread}
          loading={loading}
          onSubmit={handleSubmit}
          onReset={handleReset}
          copy={copy}
          settings={settings}
          mode={activeMode}
          onModeChange={handleModeChange}
          modesLoading={modesLoading}
          loadedModes={loadedModes}
          onSaveDecision={handleSaveDecision}
          key={resetKey}
        />

        {latestBlueprint && (() => {
          const displayBlueprint = modeBlueprints[activeMode] ?? latestBlueprint;
          return (
          <div className="border-t border-white/10 bg-[#090E1B]/95">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 text-left sm:px-6"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">{copy.advancedAnalysis}</div>
                <div className="text-[11px] text-slate-500">
                  {activeMode !== 'Strategy' ? `${activeMode} synthesis` : copy.advancedSubtext}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </button>

            {advancedOpen && (
              <div className="max-h-[70vh] overflow-y-auto border-t border-white/10 px-4 pb-8 pt-5 sm:px-6">
                {modesLoading[activeMode] ? (
                  <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                    <span className="text-sm text-slate-400">Synthesizing {activeMode} view…</span>
                  </div>
                ) : (
                <div className="mx-auto max-w-5xl space-y-6">
                  <IntelligenceRail snapshot={intelligence} />
                  <SimulationResults
                    key={resultKey}
                    result={displayBlueprint}
                    intelligence={intelligence}
                    submittedProblem={latestUserMessage}
                    initialShowBoard={false}
                    t={t}
                    memoryScore={memoryScore}
                    networkScore={networkScore}
                    calibratedScore={calibratedScore}
                    calibrationOffset={calibrationOffset}
                    calibrationSampleSize={calibrationSampleSize}
                    decisionId={latestDecisionId}
                    decisionAccuracy={decisionAccuracy}
                    calibrationScore={calibrationScore}
                  />
                </div>
                )}
              </div>
            )}
          </div>
          );
        })()}
      </section>

      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSettingsChange={updateSettings}
          copy={copy}
          conversations={thread}
          onDeleteHistory={handleReset}
        />
      )}
    </div>
  );
}
