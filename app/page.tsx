"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, AlertTriangle } from 'lucide-react';
import DecisionBlueprintBoard from '@/components/DecisionBlueprint';
import AgentEngine from '@/components/AgentEngine';
import Navbar from '@/components/Navbar';
import SettingsModal from '@/components/SettingsModal';
import IntelligenceRail from '@/components/IntelligenceRail';

import type { DecisionBlueprint } from '../lib/types';

import en from '@/locales/en/common.json';
import ru from '@/locales/ru/common.json';
import ar from '@/locales/ar/common.json';
import de from '@/locales/de/common.json';
import es from '@/locales/es/common.json';
import zh from '@/locales/zh/common.json';

const locales: Record<string, Record<string, string>> = { 
  auto: en, // Default to en for auto UI before detection
  English: en, 
  Russian: ru, 
  Arabic: ar, 
  German: de, 
  Spanish: es, 
  Chinese: zh 
};

export default function Home() {
  const [problem, setProblem] = useState('');
  const [language, setLanguage] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'debate' | 'action'>('blueprint');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [terminalTab, setTerminalTab] = useState('Strategy');

  // Determine current translation set based on selected language
  // Use result.language if available (auto-detected), otherwise use selection state
  const currentLang = result?.language || language;
  const t = locales[currentLang as string] || locales.English;


  const handleSolve = async (overrideProblem?: unknown, autoBoard: boolean = false) => {
    const currentProblem = typeof overrideProblem === 'string' ? overrideProblem : problem;

    if (currentProblem.trim().length < 10) {
      setError('Please provide a bit more detail (at least 10 characters).');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setShowBoard(false);

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem: currentProblem, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate solution');
      }

      setResult(data.result as Record<string, unknown>);
      if (autoBoard) {
        setShowBoard(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-neutral-800 flex flex-col items-center py-6 sm:py-10 px-6 font-sans bg-terminal-notes overflow-x-hidden relative">
      {/* Cinematic OS Background */}
      <div className="absolute inset-0 neural-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 neural-constellation opacity-30 animate-neural-drift pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-purple-500/5 blur-[120px] rounded-full animate-neural pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full animate-float pointer-events-none" />

      <Navbar currentLanguage={language} onOpenSettings={() => setSettingsOpen(true)} isLoading={loading} />
      
      <div className="w-full max-w-5xl flex flex-col items-center relative z-10">

        {/* Header */}
        <div className="text-center mb-12 mt-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setDebugMode(!debugMode)}
            className="inline-flex items-center space-x-2 mb-8 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-colors"
          >
            <span className="text-[9px] text-neutral-600 font-bold tracking-[0.3em] uppercase">{t.system_badge || 'ALPHA • DECISION OS'}</span>
            {debugMode && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded ml-1 font-bold tracking-tighter uppercase">Debug</span>}
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center text-6xl sm:text-7xl lg:text-[7rem] font-medium tracking-tighter text-white brand-wordmark mb-2"
          >
            <span>SOLVE</span>
            <div className={`mx-4 w-[0.7em] h-[0.7em] flex items-center justify-center active-core-ring ${loading ? 'animate-active-core border-purple-500/50' : 'border-white/10'}`}>
               <div className={`w-2 h-2 rounded-full bg-purple-500 ${loading ? 'animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'opacity-20'}`} />
            </div>
            <span>S</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-neutral-500 font-bold tracking-[0.4em] uppercase mb-1"
          >
            {t.tagline}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center mt-2"
          >
            <p className="text-[9px] text-neutral-700 font-black uppercase tracking-[0.6em]">
              Precision Intelligence for High-Stakes Decisions
            </p>
          </motion.div>
        </div>

        {/* Agent Thinking Strip */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center space-x-6 mb-12 bg-white/[0.01] border border-white/5 px-6 py-2 rounded-full backdrop-blur-xl"
        >
          {[
            { name: t.agent_strategist, color: 'text-emerald-500/80', glow: 'bg-emerald-500' },
            { name: t.agent_skeptic, color: 'text-rose-500/80', glow: 'bg-rose-500' },
            { name: t.agent_operator, color: 'text-blue-500/80', glow: 'bg-blue-500' },
            { name: 'Contrarian', color: 'text-amber-500/80', glow: 'bg-amber-500' },
            { name: 'Black Swan', color: 'text-purple-500/80', glow: 'bg-purple-500' }
          ].map((agent, i) => (
            <div key={i} className="flex items-center space-x-2 border-r border-white/5 pr-6 last:border-0 last:pr-0">
              <div className={`w-1 h-1 rounded-full ${agent.glow} ${loading ? 'animate-pulse' : 'opacity-20'}`} />
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${agent.color} ${loading ? 'opacity-100' : 'opacity-40'}`}>{agent.name}</span>
            </div>
          ))}
        </motion.div>

        {/* Main Console Layout */}
        <div className="w-full flex items-start">
          {/* Decision Briefing Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 relative z-10"
          >
            <div className="bg-neutral-900/60 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8),0_0_80px_rgba(168,85,247,0.05)] overflow-hidden">
              {/* Terminal Tabs */}
              <div className="flex items-center px-10 pt-8 space-x-8 border-b border-white/5">
                {['Strategy', 'Risk', 'Scenarios', 'Red Team'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTerminalTab(tab)}
                    className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all ${
                      terminalTab === tab ? 'text-white border-b-2 border-purple-500' : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <div className="ml-auto pb-4 flex items-center space-x-2 opacity-30">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-telemetry" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Terminal Active</span>
                </div>
              </div>

              <div className="p-6 sm:p-10">
                <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
                      Primary Simulation Interface
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                     <div className="hidden sm:flex items-center space-x-2 text-[8px] font-mono text-neutral-700 uppercase tracking-widest">
                        <span>Input Telemetry: Active</span>
                     </div>
                     <div className="w-1 h-3 bg-white/5 rounded-full" />
                     <div className="hidden sm:flex items-center space-x-2 text-[8px] font-mono text-neutral-700 uppercase tracking-widest">
                        <span>Encrypted: AES-256</span>
                     </div>
                  </div>
                </div>
                
                <textarea
                  value={problem}
                  onChange={(e) => {
                    setProblem(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter the parameters of your high-stakes decision for mission-critical analysis..."
                  className="w-full h-32 sm:h-48 bg-transparent text-xl sm:text-2xl lg:text-3xl text-white placeholder-neutral-800 focus:outline-none resize-none font-medium leading-relaxed px-0 border-none selection:bg-purple-500/30"
                />

                <div className="mt-12 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.3em]">
                      Baseline Scenarios
                    </span>
                    <div className="text-neutral-800 text-[8px] font-mono tracking-widest uppercase">
                      Payload: {problem.length} / 5000 bytes
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { text: t.scenario_quit, key: 'scenario_quit' },
                      { text: t.scenario_move, key: 'scenario_move' },
                      { text: t.scenario_invest, key: 'scenario_invest' }
                    ].map((sample, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setProblem(sample.text);
                          handleSolve(sample.text, true);
                        }}
                        className="flex items-center space-x-3 text-[9px] bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-neutral-600 hover:text-white px-4 py-2 rounded-xl transition-all duration-300 font-bold uppercase tracking-wider"
                      >
                        <span>{sample.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/[0.03]">
                  <button
                    onClick={() => handleSolve()}
                    disabled={loading || problem.trim().length === 0}
                    className="group relative w-full overflow-hidden rounded-2xl p-[1px] transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-30 shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-white/10" />
                    <div className="relative flex h-20 w-full items-center justify-center rounded-[15px] bg-neutral-900 transition-all group-hover:bg-neutral-800">
                      {loading ? (
                        <div className="flex items-center space-x-6 text-white">
                          <div className="flex space-x-2">
                             {[0, 1, 2, 3].map((i) => (
                               <motion.div 
                                 key={i}
                                 animate={{ 
                                   height: [4, 12, 4],
                                   opacity: [0.3, 1, 0.3]
                                 }}
                                 transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                 className="w-1 bg-purple-500 rounded-full"
                               />
                             ))}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.6em]">
                             Processing Dialectic Simulation
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4 text-white">
                          <span className="text-base font-black uppercase tracking-[0.5em] group-hover:text-purple-400 transition-colors">
                            PRESSURE TEST DECISION →
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="mt-4 flex items-center justify-center space-x-4 opacity-20">
                     <div className="h-[1px] flex-1 bg-white" />
                     <span className="text-[8px] font-black uppercase tracking-[0.5em]">Active Decision Core v2.0</span>
                     <div className="h-[1px] flex-1 bg-white" />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="m-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center"
                  >
                    <AlertTriangle className="w-4 h-4 mr-3" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <IntelligenceRail />
        </div>

        {/* Result Area */}
        {result && (
          <div className="w-full flex flex-col items-center mt-12">
            {/* Tabs */}
            <div className="flex space-x-1 bg-white/5 p-1 rounded-2xl mb-8 border border-white/10 backdrop-blur-md">
              {[
                { id: 'blueprint', label: t.tab_blueprint || 'Blueprint' },
                { id: 'debate', label: t.tab_debate || 'War Room' },
                { id: 'action', label: t.tab_action || 'Action Plan' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-white/10 text-white shadow-xl border border-white/10' 
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'blueprint' && (
                <motion.div
                  key="blueprint"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full flex flex-col items-center"
                >
                  <DecisionBlueprintBoard data={result as unknown as DecisionBlueprint} />
                </motion.div>
              )}

              {activeTab === 'debate' && (
                <motion.div
                  key="debate"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full flex flex-col items-center"
                >
                  {!showBoard ? (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setShowBoard(true)}
                      className="mt-16 px-10 py-5 bg-neutral-900/80 backdrop-blur-md hover:bg-neutral-800 border border-purple-500/30 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_50px_rgba(168,85,247,0.3)] group"
                    >
                      <Crown className="w-6 h-6 text-purple-400 group-hover:scale-110 group-hover:-rotate-12 transition-transform" />
                      <span>{t.run_ai_board || 'Run AI Board'}</span>
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] uppercase px-2 py-0.5 rounded-full ml-2 border border-purple-500/20">{t.premium || 'Premium'}</span>
                    </motion.button>
                  ) : (
                    <AgentEngine problem={problem} initialSolution={result!} />
                  )}
                </motion.div>
              )}

              {activeTab === 'action' && (
                <motion.div
                  key="action"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="w-full max-w-3xl bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 mt-8">
                     <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                       <Sparkles className="w-6 h-6 mr-3 text-amber-400" />
                       {t.tab_action || 'Action Plan'}
                     </h3>
                     <div className="space-y-8">
                        {[
                          { label: t.today, content: (result as unknown as DecisionBlueprint).actionPlan?.today },
                          { label: t.this_week, content: (result as unknown as DecisionBlueprint).actionPlan?.thisWeek },
                          { label: t.thirty_days, content: (result as unknown as DecisionBlueprint).actionPlan?.thirtyDays }
                        ].map((step, i) => (
                          <div key={i} className="flex space-x-6">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-sm">
                                {i + 1}
                              </div>
                              {i < 2 && <div className="w-0.5 h-full bg-white/5 mt-2" />}
                            </div>
                            <div className="pb-8">
                              <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-2">{step.label}</h4>
                              <p className="text-white text-lg font-light leading-relaxed">{step.content || '...'}</p>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        currentLanguage={language}
        onLanguageChange={setLanguage}
        locales={locales}
      />
    </main>
  );
}
