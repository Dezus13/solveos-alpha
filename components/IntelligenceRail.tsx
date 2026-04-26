import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Target, Cpu, ShieldAlert, GitBranch, Users } from 'lucide-react';

export default function IntelligenceRail() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="hidden xl:flex flex-col w-72 space-y-4 ml-6"
    >
      {/* Probability Engine */}
      <div className="glass-module p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500">Probability Engine</span>
          </div>
          <div className="text-[8px] font-mono text-emerald-500/70 tracking-widest">ACTIVE_SYNC</div>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Market Vectors', value: '98.2', unit: '%' },
            { label: 'Risk Index', value: '0.14', unit: 'σ' },
            { label: 'Confidence', value: '0.87', unit: 'P' }
          ].map((stat, i) => (
            <div key={i} className="flex justify-between items-end border-b border-white/[0.02] pb-3 last:border-0">
              <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">{stat.label}</span>
              <div className="flex items-baseline space-x-0.5">
                 <span className="text-xs font-mono font-black text-white">{stat.value}</span>
                 <span className="text-[8px] font-mono text-neutral-600">{stat.unit}</span>
              </div>
            </div>
          ))}
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '87%' }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-purple-500/50"
            />
          </div>
        </div>
      </div>

      {/* Risk Exposure */}
      <div className="glass-module p-6 rounded-3xl border border-white/5 bg-black/40">
        <div className="flex items-center space-x-2 mb-6">
          <ShieldAlert className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500">Risk Exposure</span>
        </div>
        <div className="flex items-center justify-between">
           <div className="space-y-1">
              <p className="text-2xl font-black text-white tracking-tighter">14.2%</p>
              <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest">Nominal Threshold</p>
           </div>
           <div className="flex space-x-1.5 items-end h-8">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-1 rounded-full ${i === 0 ? 'bg-purple-500 h-full' : 'bg-white/5 h-1/2'}`} />
              ))}
           </div>
        </div>
      </div>

      {/* Scenario Branches */}
      <div className="glass-module p-6 rounded-3xl border border-white/5">
        <div className="flex items-center space-x-2 mb-6">
          <GitBranch className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500">Simulation Paths</span>
        </div>
        <div className="space-y-3">
          {['Alpha_Core', 'Beta_Variance', 'Gamma_Risk'].map((path, i) => (
            <div key={i} className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center">
                 <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-tighter">{path}</span>
                 <span className="text-[8px] font-mono text-neutral-500">{(0.8 - i*0.1).toFixed(2)}</span>
              </div>
              <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-white/10 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Consensus */}
      <div className="glass-module p-6 rounded-3xl border border-white/5">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500">Consensus Model</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
           {[0, 1, 2, 3, 4].map((i) => (
             <div key={i} className="aspect-square rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-center">
                <div className={`w-1 h-1 rounded-full ${i < 4 ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`} />
             </div>
           ))}
        </div>
        <p className="text-[8px] text-neutral-700 mt-4 font-bold uppercase tracking-widest text-center">Dialectic Convergence: 0.82</p>
      </div>

      {/* Decision Score */}
      <div className="glass-module p-6 rounded-3xl border border-white/10 relative overflow-hidden bg-white/[0.01]">
        <div className="flex items-center space-x-2 mb-6 relative z-10">
          <Target className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/80">System Confidence</span>
        </div>
        <div className="flex items-baseline space-x-2 relative z-10">
          <span className="text-5xl font-black text-white tracking-tighter">87</span>
          <span className="text-xs font-mono text-neutral-700 tracking-widest">/100</span>
        </div>
        <div className="mt-6 flex items-center space-x-2 relative z-10 border-t border-white/5 pt-4">
          <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
          <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Simulation Complete</span>
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="mt-auto px-6 pb-4">
        <div className="flex items-center justify-between opacity-20">
          <Cpu className="w-3.5 h-3.5 text-neutral-600" />
          <div className="flex space-x-1 items-end h-3">
            {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
              <motion.div 
                key={i} 
                animate={{ height: [`${h*100}%`, `${(1-h)*100}%`, `${h*100}%`] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-0.5 bg-neutral-600 rounded-full" 
              />
            ))}
          </div>
          <span className="text-[7px] font-mono text-neutral-600 tracking-tighter uppercase">Kernel_v2.1.0_Stable</span>
        </div>
      </div>
    </motion.div>
  );
}
