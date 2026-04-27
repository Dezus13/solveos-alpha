"use client";

import { memo, useMemo } from 'react';
import { BarChart3, Zap, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { DecisionBlueprint, ScenarioBranch } from '@/lib/types';

interface WarRoomDashboardProps {
  blueprint: DecisionBlueprint;
}

const MeterGauge = memo(function MeterGauge({
  label,
  value,
  max = 100,
  color = 'text-emerald-400',
  bgColor = 'bg-emerald-500/20',
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  bgColor?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase text-slate-300">{label}</span>
        <span className={`text-lg font-black ${color}`}>{value}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${bgColor.replace('bg-', 'bg-').replace('/20', '')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

const ScenarioCard = memo(function ScenarioCard({
  scenario,
  isHighlight = false,
}: {
  scenario: ScenarioBranch;
  isHighlight?: boolean;
}) {
  const isProbableUpside = scenario.upside > 0;
  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isHighlight
          ? 'border-purple-400/50 bg-purple-500/[0.08] shadow-[0_0_24px_rgba(168,85,247,0.15)]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-xs font-bold uppercase text-[#F8FAFF]">{scenario.name}</h4>
        <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-slate-300">
          {scenario.probability}%
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mb-4">{scenario.description}</p>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Upside/Downside (bps)</span>
          <span className={`font-bold ${isProbableUpside ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProbableUpside ? '+' : ''}{scenario.upside} / {scenario.downside}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Timeline</span>
          <span className="text-[#F8FAFF]">{scenario.timeline}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"
            style={{
              width: `${Math.min(100, Math.max(0, 50 + scenario.upside / 20))}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
});

const RiskMap = memo(function RiskMap({
  opportunity,
  risk,
}: {
  opportunity: number;
  risk: number;
}) {
  const position = {
    left: `${Math.max(5, Math.min(95, opportunity))}%`,
    top: `${Math.max(5, Math.min(95, risk))}%`,
  };

  return (
    <div className="relative w-full h-64 bg-white/[0.02] border border-white/10 rounded-xl p-6 overflow-hidden">
      {/* Quadrant labels */}
      <div className="absolute top-2 left-3 text-[8px] font-bold uppercase text-slate-500">
        Low Risk
      </div>
      <div className="absolute bottom-2 left-3 text-[8px] font-bold uppercase text-slate-500">
        High Risk
      </div>
      <div className="absolute top-2 right-3 text-[8px] font-bold uppercase text-slate-500">
        High Opp
      </div>
      <div className="absolute bottom-2 right-3 text-[8px] font-bold uppercase text-slate-500">
        Low Opp
      </div>

      {/* Grid lines */}
      <div className="absolute inset-6 border border-white/5" />
      <div className="absolute top-1/2 left-6 right-6 h-px bg-white/5" />
      <div className="absolute left-1/2 top-6 bottom-6 w-px bg-white/5" />

      {/* Position indicator */}
      <div
        className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-[0_0_16px_rgba(168,85,247,0.6)] border border-purple-300 transition-all"
        style={{
          left: position.left,
          top: position.top,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Axes labels */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] font-bold text-slate-500 uppercase">
        Opportunity →
      </div>
      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 rotate-180 text-[8px] font-bold text-slate-500 uppercase">
        Risk →
      </div>
    </div>
  );
});

export default function WarRoomDashboard({ blueprint }: WarRoomDashboardProps) {
  const council = blueprint.council;
  const riskMap = blueprint.riskMap;
  const scenarios = blueprint.scenarioBranches || [];

  const metrics = useMemo(() => {
    if (!council) return null;

    return [
      {
        label: 'Strategist Confidence',
        value: council.strategistConfidence,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
      },
      {
        label: 'Skeptic Agreement',
        value: Math.max(0, council.skepticAgreement),
        max: 100,
        color: council.skepticAgreement > 50 ? 'text-emerald-400' : 'text-amber-400',
        bgColor:
          council.skepticAgreement > 50 ? 'bg-emerald-500/20' : 'bg-amber-500/20',
      },
      {
        label: 'Operator Feasibility',
        value: council.operatorFeasibility,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
      },
    ];
  }, [council]);

  const consensusColor =
    council && council.consensusScore > 70
      ? 'text-emerald-400'
      : council && council.consensusScore > 50
        ? 'text-amber-400'
        : 'text-rose-400';

  return (
    <div className="w-full max-w-5xl space-y-8">
      {/* War Room Header */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-6 shadow-[0_0_32px_rgba(168,85,247,0.1)]">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
          <span className="text-[9px] font-black uppercase text-slate-300">
            Strategic War Room
          </span>
        </div>
        <h2 className="text-3xl font-black text-[#F8FAFF] mb-3">Council Consensus</h2>
        <p className="text-sm text-slate-300">{council?.resolutionPath}</p>
      </div>

      {/* Council Metrics */}
      {council && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <MeterGauge
                label={metric.label}
                value={metric.value}
                max={metric.max || 100}
                color={metric.color}
                bgColor={metric.bgColor}
              />
            </div>
          ))}

          {/* Consensus Score - Large */}
          <div className="md:col-span-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col items-center justify-center">
            <div className={`text-4xl font-black ${consensusColor}`}>
              {council.consensusScore}
            </div>
            <span className="text-[9px] font-bold uppercase text-slate-400 mt-2">
              Consensus Score
            </span>
          </div>
        </div>
      )}

      {/* Key Disagreements & Debate Intensity */}
      {council && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase text-[#F8FAFF]">
                Key Disagreements
              </h3>
            </div>
            {council.keyDisagreements.length > 0 ? (
              <ul className="space-y-2">
                {council.keyDisagreements.map((disagreement, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>{disagreement}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No major disagreements detected.</p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold uppercase text-[#F8FAFF]">
                Debate Intensity
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                      style={{ width: `${council.debateIntensity}%` }}
                    />
                  </div>
                </div>
                <span className="text-lg font-black text-purple-400">
                  {council.debateIntensity}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {council.debateIntensity > 70
                  ? 'Intense debate among agents'
                  : council.debateIntensity > 40
                    ? 'Moderate discussion points'
                    : 'General alignment achieved'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Map */}
      {riskMap && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase text-[#F8FAFF]">
              Risk vs. Opportunity Matrix
            </h3>
          </div>
          <RiskMap opportunity={riskMap.opportunity} risk={riskMap.risk} />
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-bold">Opportunity Score</span>
              <div className={`text-2xl font-black ${riskMap.opportunity > 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {riskMap.opportunity}
              </div>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold">Risk Score</span>
              <div className={`text-2xl font-black ${riskMap.risk < 40 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {riskMap.risk}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Branches */}
      {scenarios.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold uppercase text-[#F8FAFF]">
              Scenario Branches
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isHighlight={scenario.probability >= 35}
              />
            ))}
          </div>

          {/* Probability Distribution */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">
              Probability Distribution
            </h4>
            <div className="flex h-12 rounded-lg overflow-hidden border border-white/10">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex-1 bg-white/[0.05] border-r border-white/5 last:border-r-0 flex flex-col items-center justify-center group relative hover:bg-white/10 transition-colors"
                  style={{
                    backgroundColor: `rgba(168, 85, 247, ${scenario.probability / 100 * 0.3})`,
                  }}
                  title={`${scenario.name}: ${scenario.probability}%`}
                >
                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">
                    {scenario.probability}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Summary */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
        <div className="flex items-center space-x-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase text-emerald-300">Recommended Approach</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {blueprint.recommendation}
        </p>
      </div>
    </div>
  );
}
