import React, { memo, useMemo } from 'react';
import { Activity, Target, Cpu, ShieldAlert, GitBranch, Route } from 'lucide-react';

export interface IntelligenceSnapshot {
  status: 'idle' | 'running' | 'complete';
  successProbability: number;
  downsideRisk: number;
  blackSwanExposure: number;
  recommendedPath: string;
  verdict: string;
}

interface IntelligenceRailProps {
  snapshot: IntelligenceSnapshot;
}

const formatPercent = (value: number) => `${Math.round(value)}%`;

const matrixCells = Array.from({ length: 12 }, (_, i) => i);
const confidenceBars = Array.from({ length: 12 }, (_, i) => i);

function IntelligenceRail({ snapshot }: IntelligenceRailProps) {
  const isActive = snapshot.status !== 'idle';
  const activeCells = Math.ceil(snapshot.successProbability / 9);
  const stats = useMemo(() => [
    { label: 'Success Probability', value: snapshot.successProbability, color: 'bg-emerald-500/70' },
    { label: 'Downside Risk', value: snapshot.downsideRisk, color: 'bg-rose-500/70' },
    { label: 'Black Swan Exposure', value: snapshot.blackSwanExposure, color: 'bg-amber-500/70' }
  ], [snapshot.blackSwanExposure, snapshot.downsideRisk, snapshot.successProbability]);

  return (
    <aside className="hidden xl:flex flex-col w-72 space-y-4 ml-6">
      {/* Probability Vectors */}
      <div className="bg-[#0B1020]/72 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden group shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-[9px] font-black uppercase text-slate-300">Probability Signals</span>
          </div>
          <span className={`text-[8px] font-mono ${isActive ? 'text-purple-200' : 'text-slate-500'}`}>
            {snapshot.status === 'complete' ? 'SIMULATED' : snapshot.status === 'running' ? 'RUNNING' : 'STANDBY'}
          </span>
        </div>
        <div className="space-y-5">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 uppercase">
                 <span>{stat.label}</span>
                 <span className="text-[#F8FAFF]">{formatPercent(stat.value)}</span>
              </div>
              <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${stat.color} transition-[width] duration-500 ease-out`} style={{ width: `${stat.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Matrix */}
      <div className="bg-[#0B1020]/72 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
        <div className="flex items-center space-x-2 mb-6">
          <GitBranch className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[9px] font-black uppercase text-slate-300">Scenario Matrix</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
           {matrixCells.map((i) => (
             <div key={i} className="aspect-square rounded border border-white/5 bg-white/[0.01] flex items-center justify-center relative overflow-hidden">
                <div className={`w-1.5 h-1.5 rounded-full ${isActive && i < activeCells ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.7)]' : 'bg-white/10'}`} />
             </div>
           ))}
        </div>
      </div>

      {/* Live Risk Ticker */}
      <div className="bg-[#0B1020]/72 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
        <div className="flex items-center space-x-2 mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
          <span className="text-[9px] font-black uppercase text-slate-300">Risk Ticker</span>
        </div>
        <div className="h-12 flex flex-col justify-center border-l-2 border-rose-500/30 pl-4 bg-rose-500/[0.02]">
           <span className="text-2xl font-mono font-black text-rose-500 tracking-tighter">{formatPercent(snapshot.downsideRisk)}</span>
           <span className="text-[8px] font-mono text-rose-300/70 uppercase">Downside Failure Band</span>
        </div>
      </div>

      <div className="bg-[#0B1020]/72 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
        <div className="flex items-center space-x-2 mb-4">
          <Route className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-[9px] font-black uppercase text-slate-300">Recommended Path</span>
        </div>
        <p className="text-sm text-[#F8FAFF] font-semibold leading-relaxed">{snapshot.recommendedPath}</p>
        <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">{snapshot.verdict}</p>
      </div>

      {/* Decision Consensus */}
      <div className="bg-[#0B1020]/72 backdrop-blur-xl p-6 rounded-2xl border border-purple-400/20 relative overflow-hidden group shadow-[0_0_36px_rgba(168,85,247,0.08)]">
        <div className="flex items-center space-x-2 mb-6 relative z-10">
          <Target className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-[9px] font-black uppercase text-[#F8FAFF]">Decision Confidence</span>
        </div>
        <div className="flex items-baseline space-x-2 relative z-10 mb-6">
          <span className="text-6xl font-mono font-black text-[#F8FAFF] tracking-tighter">{Math.round(snapshot.successProbability)}</span>
          <span className="text-xs font-mono text-slate-500">%</span>
        </div>
        <div className="flex space-x-1 items-end h-6 relative z-10 border-t border-white/5 pt-4">
           {confidenceBars.map((i) => (
             <div
               key={i}
               style={{ height: `${24 + ((i + Math.round(snapshot.successProbability / 10)) % 5) * 13}%` }}
               className="flex-1 bg-white/[0.06] rounded-full"
             />
           ))}
        </div>
      </div>

      {/* Kernel Footer */}
      <div className="mt-auto px-6 pb-4">
        <div className="flex items-center justify-between opacity-20">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <div className="text-[8px] font-mono text-slate-500 uppercase text-right">
             SolveOS_Kernel_v2.2.4_Stable<br />
             Telemetry_Pulse: 84ms
          </div>
        </div>
      </div>
    </aside>
  );
}

export default memo(IntelligenceRail);
