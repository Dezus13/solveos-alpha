"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, MessageSquare, Plus, Settings } from 'lucide-react';
import DecisionConsole from '@/components/DecisionConsole';
import SolveOSSymbol from '@/components/SolveOSSymbol';
import { detectInputLanguage, uiCopy, type SupportedLanguage, type UiCopy } from '@/lib/i18n';
import { defaultSettings, SETTINGS_STORAGE_KEY, type ProductSettings } from '@/lib/settings';
import type { IntelligenceSnapshot } from '@/components/IntelligenceRail';
import type { ConversationTurn, DecisionBlueprint, SolveRequest } from '@/lib/types';

import en from '@/locales/en/common.json';

type LocaleDictionary = Record<string, Record<string, string>>;

const initialLocales: LocaleDictionary = {
  auto: en,
  en,
  English: en,
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

function mergeSettings(value: unknown): ProductSettings {
  if (!value || typeof value !== 'object') return defaultSettings;
  const incoming = value as Partial<ProductSettings>;
  const legacyLanguage = (incoming.language as Partial<ProductSettings['language']> & {
    selected?: SupportedLanguage;
    responseMode?: 'detected' | 'chosen';
  }) || {};
  const legacyConcrete = legacyLanguage.selected && legacyLanguage.selected !== 'auto'
    ? legacyLanguage.selected
    : defaultSettings.language.uiLanguage;
  return {
    general: { ...defaultSettings.general, ...incoming.general },
    language: {
      ...defaultSettings.language,
      ...incoming.language,
      uiLanguage: legacyLanguage.uiLanguage || legacyConcrete,
      decisionMode: legacyLanguage.decisionMode || (legacyLanguage.responseMode === 'chosen' ? 'custom' : 'detected'),
      customDecisionLanguage: legacyLanguage.customDecisionLanguage || legacyConcrete,
    },
    appearance: { ...defaultSettings.appearance, ...incoming.appearance },
    notifications: { ...defaultSettings.notifications, ...incoming.notifications },
    data: { ...defaultSettings.data, ...incoming.data },
    security: { ...defaultSettings.security, ...incoming.security },
  };
}

function buildAssistantAnswer(blueprint: DecisionBlueprint, copy: UiCopy): string {
  const verdict = blueprint.recommendation || 'Decision analysis completed.';
  const reasoningTree = [
    blueprint.diagnosis?.coreProblem ? `1. Core decision: ${blueprint.diagnosis.coreProblem}` : '',
    blueprint.strategistView?.biggestUpside ? `2. Upside case: ${blueprint.strategistView.biggestUpside}` : '',
    blueprint.strategistView?.leverageMove ? `3. Leverage point: ${blueprint.strategistView.leverageMove}` : '',
    blueprint.economistView ? `4. Opportunity cost: ${blueprint.economistView}` : '',
    blueprint.contrarianInsight?.uncomfortableTruth ? `5. Hard truth: ${blueprint.contrarianInsight.uncomfortableTruth}` : '',
  ].filter(Boolean).join('\n');
  const riskTree = [
    blueprint.diagnosis?.keyRisks ? `- Primary risk: ${blueprint.diagnosis.keyRisks}` : '',
    blueprint.skepticView?.hiddenFlaw ? `- Hidden flaw: ${blueprint.skepticView.hiddenFlaw}` : '',
    blueprint.skepticView?.whatCouldBreak ? `- First break point: ${blueprint.skepticView.whatCouldBreak}` : '',
    blueprint.preMortemRisks?.[0]?.earlyWarningSignal ? `- Early warning signal: ${blueprint.preMortemRisks[0].earlyWarningSignal}` : '',
  ].filter(Boolean).join('\n');
  const nextMove = blueprint.actionPlan?.today || blueprint.operatorNextSteps?.[0] || blueprint.actionPlan?.thisWeek;
  const nextMoveDetail = [
    nextMove ? `Do this first: ${nextMove}` : '',
    blueprint.actionPlan?.thisWeek ? `This week: ${blueprint.actionPlan.thisWeek}` : '',
    blueprint.executionPlan?.[0]?.metric ? `Measure: ${blueprint.executionPlan[0].metric}` : '',
    blueprint.executionPlan?.[0]?.goNoGoThreshold ? `Decision threshold: ${blueprint.executionPlan[0].goNoGoThreshold}` : '',
  ].filter(Boolean).join('\n');
  const redTeam = blueprint.redTeamCritique || blueprint.contrarianInsight?.perspective;
  const expansion = [
    blueprint.counterfactualPaths?.[0]?.keyFailureMode ? `Ask next for a deeper expansion on the failure mode: ${blueprint.counterfactualPaths[0].keyFailureMode}` : '',
    blueprint.executionPlan?.length ? 'Or ask for a full 30-day execution plan with owners, metrics, and kill criteria.' : '',
  ].filter(Boolean).join('\n');

  return [
    `${copy.verdict}\n${verdict}`,
    reasoningTree ? `${copy.reasoningHeading}\n${reasoningTree}` : '',
    riskTree ? `${copy.risks}\n${riskTree}` : '',
    redTeam ? `${copy.redTeamChallenge}\n${redTeam}` : '',
    nextMoveDetail ? `${copy.nextMove}\n${nextMoveDetail}` : '',
    expansion ? `Deeper expansion\n${expansion}` : '',
  ].filter(Boolean).join('\n\n');
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
  const [settings, setSettings] = useState<ProductSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      return stored ? mergeSettings(JSON.parse(stored)) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
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

  // Keep a stable ref to thread so handleSubmit always sees the latest value
  const threadRef = useRef<ConversationTurn[]>([]);
  useEffect(() => { threadRef.current = thread; }, [thread]);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.appearance.theme;
    document.documentElement.dataset.accent = settings.appearance.accent;
    document.documentElement.dataset.density = settings.appearance.density;
  }, [settings]);

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
  const currentLang = latestBlueprint?.language || interfaceLanguage;
  const t = locales[currentLang as string] || locales.English;
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
    setAdvancedOpen(false);
  }, []);

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

      try {
        const detected = detectInputLanguage(message);
        const requestLanguage = settings.language.decisionMode === 'detected'
          ? detected
          : settings.language.decisionMode === 'ui'
            ? settings.language.uiLanguage
            : settings.language.customDecisionLanguage;
        const body: SolveRequest = {
          problem: message,
          language: requestLanguage,
          mode: mode === 'Risk' || mode === 'Scenarios' || mode === 'Red Team' ? mode : 'Strategy',
          conversationHistory: threadRef.current.map((t) => ({
            role: t.role,
            content: t.role === 'assistant' ? (t.blueprint?.recommendation || t.content) : t.content,
          })),
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
        if (typeof data.decisionId === 'string') setLatestDecisionId(data.decisionId);
        if (blueprint.language) void ensureLocale(blueprint.language);
        setAdvancedOpen(settings.general.advancedByDefault);

        const assistantTurn: ConversationTurn = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: buildAssistantAnswer(blueprint, uiCopy[requestLanguage] || copy),
          blueprint,
          timestamp: Date.now(),
        };

        setThread((prev) => [...prev, assistantTurn]);

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
    [copy, ensureLocale, settings.general.advancedByDefault, settings.language.customDecisionLanguage, settings.language.decisionMode, settings.language.uiLanguage],
  );

  const resultKey = useMemo(
    () => `${latestUserMessage}-${latestBlueprint?.recommendation || ''}`,
    [latestBlueprint?.recommendation, latestUserMessage],
  );

  const conversationTitle = useMemo(() => {
    const firstUser = thread.find((turn) => turn.role === 'user')?.content;
    if (!firstUser) return 'New decision';
    return readableThreadTitle(firstUser);
  }, [thread]);

  return (
    <div className="relative z-10 flex h-screen w-full overflow-hidden">
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

        <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">{copy.history}</div>
        <div className="space-y-1 overflow-y-auto">
          {thread.length > 0 ? (
            <button
              type="button"
              className="flex w-full items-start gap-2 rounded-xl bg-purple-500/[0.08] px-3 py-3 text-left text-sm text-slate-200"
            >
              <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-300" />
              <span className="line-clamp-2">{conversationTitle}</span>
            </button>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-sm text-slate-500">
              {copy.noDecisions}
            </div>
          )}
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
        />

        {latestBlueprint && (
          <div className="border-t border-white/10 bg-[#090E1B]/95">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 text-left sm:px-6"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">{copy.advancedAnalysis}</div>
                <div className="text-[11px] text-slate-500">{copy.advancedSubtext}</div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </button>

            {advancedOpen && (
              <div className="max-h-[70vh] overflow-y-auto border-t border-white/10 px-4 pb-8 pt-5 sm:px-6">
                <div className="mx-auto max-w-5xl space-y-6">
                  <IntelligenceRail snapshot={intelligence} />
                  <SimulationResults
                    key={resultKey}
                    result={latestBlueprint}
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
              </div>
            )}
          </div>
        )}
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
