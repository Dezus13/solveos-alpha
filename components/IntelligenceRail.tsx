import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Layers, Target, Cpu, Zap } from 'lucide-react';

export default function IntelligenceRail() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="hidden xl:flex flex-col w-64 space-y-4 ml-6"
    >
      {/* Probability Engine */}
      <div className="glass-module p-4 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3 text-purple-400 animate-telemetry" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Probability Engine</span>
          </div>
          <div className="text-[10px] font-mono text-purple-500">v4.2</div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Market Sync', value: '98.2%' },
            { label: 'Risk Vector', value: 'Low' },
            { label: 'Confidence', value: 'High' }
          ].map((stat, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-500">{stat.label}</span>
              <span className="text-[10px] font-mono text-white">{stat.value}</span>
            </div>
          ))}
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              className="h-full bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Scenario Matrix */}
      <div className="glass-module p-4 rounded-2xl border border-white/5">
        <div className="flex items-center space-x-2 mb-4">
          <Layers className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Scenario Matrix</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`h-6 rounded-sm ${i === 4 ? 'bg-emerald-500/40 border border-emerald-500/50' : 'bg-white/5'}`} />
          ))}
        </div>
        <p className="text-[9px] text-neutral-600 mt-3 text-center uppercase tracking-tighter">9 Concurrent Paths Simulated</p>
      </div>

      {/* Decision Score */}
      <div className="glass-module p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-transparent">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Decision Score</span>
        </div>
        <div className="flex items-end space-x-2">
          <span className="text-4xl font-black text-white tracking-tighter">87</span>
          <span className="text-sm text-neutral-500 mb-1">/100</span>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-500 uppercase">Optimal Threshold Reached</span>
        </div>
      </div>

      {/* Telemetry */}
      <div className="mt-auto px-4 pb-2">
        <div className="flex items-center space-x-4 opacity-30">
          <Cpu className="w-3 h-3 text-neutral-500" />
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-1 h-3 bg-neutral-500 rounded-full" />
            ))}
          </div>
          <Zap className="w-3 h-3 text-neutral-500" />
        </div>
      </div>
    </motion.div>
  );
}
