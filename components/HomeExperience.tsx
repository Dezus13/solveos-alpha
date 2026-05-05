"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Settings, Sparkles } from 'lucide-react';
import DecisionConsole from '@/components/DecisionConsole';
import SolveOSSymbol from '@/components/SolveOSSymbol';
import { detectInputLanguage, uiCopy } from '@/lib/i18n';
import { readSettings, type ProductSettings, writeSettings } from '@/lib/settings';
import { SETTINGS_UPDATED, type AppSettings } from '@/lib/settingsStore';
import type { IntelligenceSnapshot } from '@/components/IntelligenceRail';
import type { ConversationTurn, DecisionBlueprint, SolveRequest } from '@/lib/types';

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

const SimulationResults = dynamic(() => import('@/components/SimulationResults'), {
  loading: () => <ResultsSkeleton />,
});

const SettingsModal = dynamic(() => import('@/components/SettingsModal'), {
  loading: () => null,
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
  const [streaming, setStreaming] = useState(false);
  const [settings, setSettings] = useState<ProductSettings>(() => readSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [locales, setLocales] = useState<LocaleDictionary>(initialLocales);
  const [latestBlueprint, setLatestBlueprint] = useState<DecisionBlueprint | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligenceSnapshot>(idleSnapshot);
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
    setLatestBlueprint(null);
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
      setAnalysisError(null);
      setAdvancedOpen(false);
      setLoading(true);
      setStreaming(true);
      fetchGenRef.current += 1;

      try {
        const requestLanguage = detectInputLanguage(message, settings.language.uiLanguage);
        const body: SolveRequest = {
          problem: message,
          language: requestLanguage,
          mode: mode === 'Risk' || mode === 'Scenarios' || mode === 'Red Team' ? mode : 'Strategy',
          conversationHistory: threadRef.current.map((t) => ({
            role: t.role,
            content: t.content,
          })),
          streaming: true,
        };

        const response = await fetch('/api/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error('Failed to generate solution');

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        let assistantContent = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          
          // Update the thread with the current content
          setThread((prev) => {
            const newPrev = [...prev];
            const last = newPrev[newPrev.length - 1];
            if (last.role === 'assistant') {
              last.content = assistantContent;
            } else {
              newPrev.push({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: assistantContent,
                timestamp: Date.now(),
              });
            }
            return newPrev;
          });
        }

        // Finalize
        setStreaming(false);
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
        setStreaming(false);
      } finally {
        setLoading(false);
      }
    },
    [settings.language.uiLanguage],
  );

  const handleLoadAdvancedAnalysis = useCallback(async () => {
    if (!latestUserMessage) return;
    setAnalysisError(null);
    setAdvancedOpen(true);
    if (latestBlueprint) return;
    setAnalysisLoading(true);

    try {
      const requestLanguage = detectInputLanguage(latestUserMessage, settings.language.uiLanguage);
      const body: SolveRequest = {
        problem: latestUserMessage,
        language: requestLanguage,
        mode: 'Risk',
        conversationHistory: threadRef.current.map((t) => ({
          role: t.role,
          content: t.content,
        })),
      };

      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || !data.result) {
        throw new Error(data.error || 'Failed to fetch deeper analysis');
      }

      const blueprint = data.result as DecisionBlueprint;
      blueprint.language = blueprint.language || 'English';
      setLatestBlueprint(blueprint);
      setIntelligence(buildIntelligenceSnapshot(blueprint, 'complete'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load deeper analysis.';
      setAnalysisError(message);
    } finally {
      setAnalysisLoading(false);
    }
  }, [latestBlueprint, latestUserMessage, settings.language.uiLanguage]);

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
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </header>

        <DecisionConsole
          thread={thread}
          loading={loading}
          streaming={streaming}
          onSubmit={handleSubmit}
          copy={copy}
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
                {analysisLoading ? 'Loading deeper analysis…' : 'Want deeper analysis?'}
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
                    Loading deeper analysis…
                  </div>
                ) : latestBlueprint ? (
                  <>
                    <IntelligenceRail snapshot={intelligence} />
                    <SimulationResults
                      key={resultKey}
                      result={latestBlueprint}
                      intelligence={intelligence}
                      submittedProblem={latestUserMessage}
                      initialShowBoard={false}
                      t={t}
                    />
                  </>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-8 text-center text-sm text-slate-400">
                    Deeper analysis will appear here once ready.
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
          copy={copy}
          conversations={thread}
          onDeleteHistory={handleReset}
        />
      )}
    </div>
  );
}
