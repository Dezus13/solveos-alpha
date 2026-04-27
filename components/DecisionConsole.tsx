"use client";

import { memo, useCallback, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Play, ShieldQuestion } from 'lucide-react';
import SolveOSSymbol from '@/components/SolveOSSymbol';
import type { DecisionBlueprint } from '@/lib/types';

const decisionSteps = [
  { label: 'Define', description: 'Clarify the decision, constraints, and stakes.', icon: FileText },
  { label: 'Simulate', description: 'Run safe, balanced, and bold futures.', icon: Play },
  { label: 'Pressure Test', description: 'Expose risk, downside, and fragile assumptions.', icon: ShieldQuestion },
  { label: 'Recommended Move', description: 'Collapse the analysis into a next move.', icon: CheckCircle2 }
];

const quickScenarios = [
  {
    label: 'Quit job',
    text: 'Should I quit my job and go all-in on my startup within the next 60 days?'
  },
  {
    label: 'Relocate',
    text: 'Should I relocate to a new city for a role with higher upside but less stability?'
  },
  {
    label: 'Invest',
    text: 'Should I invest more capital into a product launch before the first sales cycle closes?'
  }
];

interface DecisionConsoleProps {
  language: string;
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
  onResult: (
    result: DecisionBlueprint,
    problem: string,
    autoBoard: boolean,
    memoryScore?: number,
    networkScore?: number,
    calibratedScore?: number,
    calibrationOffset?: number,
  ) => void;
  onResetResult: () => void;
  onSimulationStart: () => void;
  onSimulationError: () => void;
}

function DecisionConsole({
  language,
  loading,
  onLoadingChange,
  onResult,
  onResetResult,
  onSimulationStart,
  onSimulationError
}: DecisionConsoleProps) {
  const [problem, setProblem] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [terminalTab, setTerminalTab] = useState('Strategy');
  const [workflowStep, setWorkflowStep] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const handleSolve = useCallback(async (overrideProblem?: string, autoBoard = false) => {
    const currentProblem = overrideProblem ?? problem;
    const isScenarioRun = typeof overrideProblem === 'string';

    if (!currentProblem.trim()) {
      setError('Please describe your decision to enable simulation.');
      return;
    }
    
    if (currentProblem.trim().length < 20) {
      setError(`Decision details too brief (${currentProblem.trim().length}/20 characters minimum). Provide more context about stakes, constraints, and timeline.`);
      return;
    }

    onLoadingChange(true);
    setError(null);
    onResetResult();
    setWorkflowStep(1);
    onSimulationStart();
    if (!isScenarioRun) {
      setSelectedScenario(null);
    }

    try {
      setWorkflowStep(2);
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

      const blueprint = data.result as DecisionBlueprint;
      setWorkflowStep(3);
      onResult(
        blueprint,
        currentProblem,
        autoBoard,
        data.memoryScore as number | undefined,
        data.networkScore as number | undefined,
        data.calibratedScore as number | undefined,
        data.calibrationOffset as number | undefined,
      );
      setWorkflowStep(4);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setWorkflowStep(0);
      onSimulationError();
    } finally {
      onLoadingChange(false);
    }
  }, [language, onLoadingChange, onResetResult, onResult, onSimulationError, onSimulationStart, problem]);

  return (
    <div className="flex-1 relative z-10">
      <div className="bg-[#0B1020]/78 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.45),0_0_80px_rgba(168,85,247,0.08)] overflow-hidden">
        <div className="flex items-center px-10 pt-8 space-x-8 border-b border-white/5">
          {['Strategy', 'Risk', 'Scenarios', 'Red Team'].map((tab) => (
            <button
              key={tab}
              onClick={() => setTerminalTab(tab)}
              className={`pb-4 text-[11px] font-black uppercase transition-all ${terminalTab === tab ? 'text-[#F8FAFF] border-b-2 border-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]' : 'text-slate-500 hover:text-slate-200'
                }`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto pb-4 flex items-center space-x-2 opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.8)]" />
            <span className="text-[9px] font-black uppercase text-purple-200">Decision Core Active</span>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full border border-purple-300 bg-purple-500/40 shadow-[0_0_16px_rgba(168,85,247,0.8)]" />
              <span className="text-[9px] font-black uppercase text-slate-300">
                Primary Simulation Interface
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-[8px] font-mono text-slate-500 uppercase">
                <span>Input Telemetry: Active</span>
              </div>
              <div className="w-1 h-3 bg-white/5 rounded-full" />
              <div className="hidden sm:flex items-center space-x-2 text-[8px] font-mono text-slate-500 uppercase">
                <span>Encrypted: AES-256</span>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-4">
            {decisionSteps.map((step, index) => {
              const stepNumber = index + 1;
              const StepIcon = step.icon;
              const isComplete = workflowStep > stepNumber;
              const isCurrent = workflowStep === stepNumber || (!workflowStep && stepNumber === 1);

              return (
                <div
                  key={step.label}
                  className={`rounded-xl border p-4 transition-all ${
                    isComplete
                      ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                      : isCurrent
                        ? 'border-purple-500/40 bg-purple-500/[0.05]'
                        : 'border-white/5 bg-white/[0.015]'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <StepIcon className={`h-4 w-4 ${isCurrent || isComplete ? 'text-[#F8FAFF]' : 'text-slate-500'}`} />
                    <span className="font-mono text-[9px] text-slate-500">0{stepNumber}</span>
                  </div>
                  <div className="text-[10px] font-black uppercase text-[#F8FAFF]">{step.label}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{step.description}</p>
                </div>
              );
            })}
          </div>

          <textarea
            value={problem}
            onChange={(e) => {
              setProblem(e.target.value);
              if (error) setError(null);
            }}
            placeholder="What decision must survive reality?"
            className="w-full h-32 sm:h-48 bg-transparent text-xl sm:text-2xl lg:text-3xl text-[#F8FAFF] placeholder-slate-600 focus:outline-none resize-none font-medium leading-relaxed px-0 border-none selection:bg-purple-500/30"
          />

          <div className="mt-12 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase">
                Baseline Scenarios
              </span>
              <div className="text-slate-500 text-[8px] font-mono uppercase">
                Payload: {problem.length} / 5000 bytes
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickScenarios.map((sample) => (
                <button
                  key={sample.label}
                  onClick={() => {
                    setSelectedScenario(sample.label);
                    setProblem(sample.text);
                    handleSolve(sample.text, true);
                  }}
                  disabled={loading}
                  className={`flex items-center space-x-3 text-[9px] border px-4 py-2 rounded-xl transition-all duration-300 font-bold uppercase disabled:opacity-50 ${
                    selectedScenario === sample.label
                      ? 'bg-purple-500/15 border-purple-400/40 text-[#F8FAFF] shadow-[0_0_24px_rgba(168,85,247,0.12)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-300 hover:text-[#F8FAFF]'
                  }`}
                >
                  <Play className="h-3 w-3" />
                  <span>{sample.label}</span>
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-white/15 to-purple-500/50" />
              <div className="relative flex h-20 w-full items-center justify-center rounded-[15px] bg-[#0A0F1F] transition-all group-hover:bg-[#101936]">
                {loading ? (
                  <div className="flex items-center space-x-6 text-white">
                    <SolveOSSymbol active className="loading-core-mark" />
                    <span className="text-[10px] font-black uppercase">
                      Processing Dialectic Simulation
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4 text-white">
                    <span className="text-base font-black uppercase group-hover:text-purple-300 transition-colors">
                      PRESSURE TEST DECISION →
                    </span>
                  </div>
                )}
              </div>
            </button>
            <div className="mt-4 flex items-center justify-center space-x-4 opacity-20">
              <div className="h-[1px] flex-1 bg-white" />
              <span className="text-[8px] font-black uppercase">Active Decision Core v2.0</span>
              <div className="h-[1px] flex-1 bg-white" />
            </div>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center">
            <AlertTriangle className="w-4 h-4 mr-3" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(DecisionConsole);
