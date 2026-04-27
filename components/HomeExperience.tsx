"use client";

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import DecisionConsole from '@/components/DecisionConsole';
import type { IntelligenceSnapshot } from '@/components/IntelligenceRail';
import type { DecisionBlueprint } from '@/lib/types';

import en from '@/locales/en/common.json';

type LocaleDictionary = Record<string, Record<string, string>>;

const initialLocales: LocaleDictionary = {
  auto: en,
  English: en
};

const localeLoaders: Record<string, () => Promise<Record<string, string>>> = {
  Russian: () => import('@/locales/ru/common.json').then((module) => module.default),
  Arabic: () => import('@/locales/ar/common.json').then((module) => module.default),
  German: () => import('@/locales/de/common.json').then((module) => module.default),
  Spanish: () => import('@/locales/es/common.json').then((module) => module.default),
  Chinese: () => import('@/locales/zh/common.json').then((module) => module.default)
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
  loading: () => <RailSkeleton />
});

const SettingsModal = dynamic(() => import('@/components/SettingsModal'), {
  loading: () => null
});

const SimulationResults = dynamic(() => import('@/components/SimulationResults'), {
  loading: () => <ResultsSkeleton />
});

const idleSnapshot: IntelligenceSnapshot = {
  status: 'idle',
  successProbability: 0,
  downsideRisk: 0,
  blackSwanExposure: 0,
  recommendedPath: 'Run a simulation to unlock the recommended path.',
  verdict: 'Awaiting decision input.'
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function buildIntelligenceSnapshot(blueprint: DecisionBlueprint | null, status: IntelligenceSnapshot['status']): IntelligenceSnapshot {
  if (!blueprint) {
    return status === 'running'
      ? {
          status,
          successProbability: 42,
          downsideRisk: 34,
          blackSwanExposure: 28,
          recommendedPath: 'Running scenario branches...',
          verdict: 'Simulation is testing the obvious move against harder futures.'
        }
      : idleSnapshot;
  }

  const score = clamp(Number(blueprint.score) || 68, 0, 100);
  const downsideRisk = clamp(100 - score + 12, 8, 82);
  const blackSwanExposure = clamp(Math.round((downsideRisk + (blueprint.paths?.bold?.cons?.length || 1) * 9) / 2), 6, 76);
  const pathName = score >= 82 ? 'Bold path with staged safeguards' : score >= 58 ? 'Balanced path with explicit kill criteria' : 'Safe path until evidence improves';

  return {
    status,
    successProbability: score,
    downsideRisk,
    blackSwanExposure,
    recommendedPath: pathName,
    verdict: blueprint.recommendation || 'Proceed only after validating the core assumption.'
  };
}

export default function HomeExperience() {
  const [submittedProblem, setSubmittedProblem] = useState('');
  const [language, setLanguage] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecisionBlueprint | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [intelligence, setIntelligence] = useState<IntelligenceSnapshot>(idleSnapshot);
  const [locales, setLocales] = useState<LocaleDictionary>(initialLocales);

  const currentLang = result?.language || language;
  const t = locales[currentLang as string] || locales.English;

  const ensureLocale = useCallback(async (nextLanguage: string) => {
    if (nextLanguage === 'auto' || locales[nextLanguage]) return;

    const loadLocale = localeLoaders[nextLanguage];
    if (!loadLocale) return;

    const dictionary = await loadLocale();
    setLocales((currentLocales) => currentLocales[nextLanguage]
      ? currentLocales
      : { ...currentLocales, [nextLanguage]: dictionary }
    );
  }, [locales]);

  const handleLanguageChange = useCallback(async (nextLanguage: string) => {
    await ensureLocale(nextLanguage);
    setLanguage(nextLanguage);
  }, [ensureLocale]);

  const onSimulationStart = useCallback(() => {
    setIntelligence(buildIntelligenceSnapshot(null, 'running'));
    void import('@/components/SimulationResults');
    void import('@/components/DecisionBlueprint');
    void import('@/components/AgentEngine');
  }, []);

  const onSimulationError = useCallback(() => {
    setIntelligence(idleSnapshot);
  }, []);

  const onResetResult = useCallback(() => {
    setResult(null);
    setShowBoard(false);
  }, []);

  const onSimulationResult = useCallback((blueprint: DecisionBlueprint, problem: string, autoBoard: boolean) => {
    if (blueprint.language) {
      void ensureLocale(blueprint.language);
    }

    setSubmittedProblem(problem);
    setResult(blueprint);
    setIntelligence(buildIntelligenceSnapshot(blueprint, 'complete'));
    setShowBoard(autoBoard);
  }, [ensureLocale]);

  const handleOpenSettings = useCallback(() => {
    void import('@/components/SettingsModal');
    setSettingsOpen(true);
  }, []);

  const resultKey = useMemo(() => `${submittedProblem}-${result?.recommendation || ''}`, [result?.recommendation, submittedProblem]);

  return (
    <>
      <Navbar onOpenSettings={handleOpenSettings} isLoading={loading} />

      <div className="w-full max-w-5xl flex flex-col items-center relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 mb-16 bg-[#0B1020]/70 border border-white/10 px-8 sm:px-12 py-3 rounded-full backdrop-blur-3xl shadow-[0_24px_80px_rgba(0,0,0,0.35),0_0_40px_rgba(168,85,247,0.06)]">
          {[
            { name: t.agent_strategist, color: 'text-emerald-500', glow: 'bg-emerald-500' },
            { name: t.agent_skeptic, color: 'text-rose-500', glow: 'bg-rose-500' },
            { name: t.agent_operator, color: 'text-blue-500', glow: 'bg-blue-500' }
          ].map((agent, i) => (
            <div key={i} className="flex items-center space-x-3 group">
              <div className={`w-1.5 h-1.5 rounded-full ${agent.glow} ${loading ? 'opacity-100 shadow-[0_0_10px_rgba(168,85,247,0.35)]' : 'opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.1)]'} transition-all group-hover:opacity-100 group-hover:scale-125`} />
              <span className={`text-[10px] font-black uppercase ${agent.color} ${loading ? 'opacity-100' : 'opacity-75'} transition-all group-hover:opacity-100`}>{agent.name}</span>
            </div>
          ))}
        </div>

        <div className="w-full flex items-start">
          <DecisionConsole
            language={language}
            loading={loading}
            onLoadingChange={setLoading}
            onResetResult={onResetResult}
            onResult={onSimulationResult}
            onSimulationError={onSimulationError}
            onSimulationStart={onSimulationStart}
          />

          <IntelligenceRail snapshot={intelligence} />
        </div>

        {result && (
          <SimulationResults
            key={resultKey}
            result={result}
            intelligence={intelligence}
            submittedProblem={submittedProblem}
            initialShowBoard={showBoard}
            t={t}
          />
        )}
      </div>

      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
          locales={locales}
        />
      )}
    </>
  );
}
