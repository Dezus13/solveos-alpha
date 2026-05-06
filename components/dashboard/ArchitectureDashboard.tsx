"use client";

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  Clock3,
  Eye,
  Gauge,
  LayoutDashboard,
  LineChart,
  ListFilter,
  Network,
  RadioTower,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

type DashboardMode = 'normal' | 'debug' | 'explainability' | 'pipeline';
type DashboardLayout = 'compact' | 'enterprise';

interface PipelineEvent {
  name?: string;
  stage?: string;
  timestamp?: string;
  decisions?: Record<string, unknown>;
  reasoningMetadata?: Record<string, unknown>;
  suppressionMetadata?: Record<string, unknown>;
}

interface ArchitecturePipelineReport {
  createdAt?: string;
  completedAt?: string;
  pipelineStages?: string[];
  decisions?: {
    activatedIntelligences?: string[];
    suppressedIntelligences?: string[];
    orchestrationPriority?: Record<string, unknown>;
    priorityArbitration?: Record<string, unknown>;
    explainability?: Record<string, unknown>;
    synthesis?: Record<string, unknown>;
  };
  reasoningMetadata?: Record<string, unknown>;
  duplicatePreventionTriggers?: string[];
  systemHealth?: {
    status?: string;
    scores?: {
      modularityScore?: number;
      orchestrationComplexityScore?: number;
      synthesisStabilityScore?: number;
      pipelineSafetyScore?: number;
      overallScore?: number;
    };
    summary?: string;
  };
  events?: PipelineEvent[];
}

export interface ArchitectureDashboardProps {
  pipeline?: unknown;
  loading?: boolean;
  streaming?: boolean;
  latencyMs?: number;
  lastUpdatedAt?: number;
}

const MODE_OPTIONS: Array<{ id: DashboardMode; label: string; icon: LucideIcon }> = [
  { id: 'normal', label: 'Normal', icon: LayoutDashboard },
  { id: 'debug', label: 'Debug', icon: ListFilter },
  { id: 'explainability', label: 'Explain', icon: Eye },
  { id: 'pipeline', label: 'Pipeline', icon: Workflow },
];

const FLOW_STAGES = [
  'input',
  'intent',
  'memory',
  'arbitration',
  'synthesis',
  'output',
];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown, fallback = 'none'): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizePipeline(value: unknown): ArchitecturePipelineReport | undefined {
  const direct = asRecord(value);
  if (!direct) return undefined;
  const wrappedDebug = asRecord(direct.debug);
  const wrappedPipeline = wrappedDebug ? asRecord(wrappedDebug.pipeline) : undefined;
  return (wrappedPipeline ?? direct) as ArchitecturePipelineReport;
}

function metricTone(value: number): string {
  if (value >= 85) return 'text-emerald-300';
  if (value >= 70) return 'text-amber-300';
  return 'text-rose-300';
}

function stageLabel(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function timeAgo(timestamp?: number): string {
  if (!timestamp) return 'Awaiting trace';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 4) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

function Panel({
  title,
  icon: Icon,
  children,
  accent = 'border-white/10',
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section className={`rounded-2xl border ${accent} bg-[#0B1020]/72 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-300" />
        <h3 className="text-[9px] font-black uppercase text-slate-300"> {title}</h3>
      </div>
      {children}
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-[8px] font-black uppercase text-slate-500">
        <span>{label}</span>
        <span className={metricTone(value)}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-300 transition-[width] duration-700"
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function ToggleGroup({
  mode,
  setMode,
}: {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1">
      {MODE_OPTIONS.map((item) => {
        const Icon = item.icon;
        const active = item.id === mode;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`flex h-9 items-center justify-center rounded-lg transition-colors ${active ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'}`}
            title={item.label}
            aria-label={`${item.label} mode`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

function OrchestrationFlow({ running, stages }: { running: boolean; stages: string[] }) {
  const visibleStages = stages.length ? stages.slice(0, 7) : FLOW_STAGES;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-hidden">
        {visibleStages.map((stage, index) => (
          <div key={stage} className="flex min-w-0 flex-1 items-center gap-2">
            <motion.div
              className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-xl border px-2 text-[8px] font-black uppercase ${
                running ? 'border-cyan-300/30 bg-cyan-300/[0.06] text-cyan-100' : 'border-white/10 bg-white/[0.025] text-slate-300'
              }`}
              animate={running ? { opacity: [0.45, 1, 0.45] } : { opacity: 1 }}
              transition={{ duration: 1.5, repeat: running ? Infinity : 0, delay: index * 0.12 }}
            >
              <span className="truncate">{stage}</span>
            </motion.div>
            {index < visibleStages.length - 1 && (
              <div className="h-px w-4 flex-shrink-0 bg-white/15" />
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        The flow shows the visible product path from input classification to final response synthesis.
      </p>
    </div>
  );
}

function EmptyTrace({ running }: { running: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center">
      <RadioTower className={`mx-auto mb-3 h-6 w-6 ${running ? 'text-cyan-300' : 'text-slate-600'}`} />
      <p className="text-sm font-semibold text-slate-300">
        {running ? 'Pipeline is collecting live signals' : 'No inspector trace captured yet'}
      </p>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Debug and explainability panels populate from the safe pipeline inspector report.
      </p>
    </div>
  );
}

function ArchitectureDashboard({
  pipeline,
  loading = false,
  streaming = false,
  latencyMs,
  lastUpdatedAt,
}: ArchitectureDashboardProps) {
  const [mode, setMode] = useState<DashboardMode>('normal');
  const [layout, setLayout] = useState<DashboardLayout>('compact');
  const report = useMemo(() => normalizePipeline(pipeline), [pipeline]);
  const decisions = report?.decisions;
  const orchestration = decisions?.orchestrationPriority ?? {};
  const arbitration = decisions?.priorityArbitration ?? {};
  const explainability = decisions?.explainability ?? {};
  const synthesis = decisions?.synthesis ?? {};
  const suppressed = decisions?.suppressedIntelligences ?? [];
  const systemScores = report?.systemHealth?.scores;
  const events = report?.events ?? [];
  const stages = report?.pipelineStages ?? [];
  const running = loading || streaming;
  const overallScore = asNumber(systemScores?.overallScore, report ? 100 : 0);
  const dominant = asString(arbitration.winningIntelligence, asString(explainability.selectedIntelligence, 'stable baseline'));
  const riskLevel = asString(orchestration.riskLevel, running ? 'evaluating' : 'unknown');
  const synthesisMode = asString(synthesis.selectedMode, running ? 'pending' : 'none');
  const latencyLabel = typeof latencyMs === 'number' ? `${Math.max(0, Math.round(latencyMs))}ms` : running ? 'live' : 'n/a';

  return (
    <aside className="flex h-full w-full flex-col border-l border-white/10 bg-[#070B16]/95 text-slate-100 xl:w-[430px]">
      <div className="flex-shrink-0 border-b border-white/10 p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Network className="h-4 w-4 text-cyan-300" />
              <h2 className="text-sm font-black uppercase text-white">Architecture Console</h2>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Orchestration, synthesis, explainability, and health as product-visible AI operations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLayout((current) => current === 'compact' ? 'enterprise' : 'compact')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
            title={layout === 'compact' ? 'Enterprise layout' : 'Compact layout'}
            aria-label="Toggle dashboard layout"
          >
            <LineChart className="h-4 w-4" />
          </button>
        </div>
        <ToggleGroup mode={mode} setMode={setMode} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className={layout === 'enterprise' ? 'space-y-4' : 'space-y-3'}>
          <Panel title="System Health" icon={ShieldCheck} accent={overallScore >= 85 ? 'border-emerald-400/20' : 'border-amber-400/20'}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className={`font-mono text-5xl font-black leading-none ${metricTone(overallScore)}`}>
                  {overallScore || (running ? '...' : 0)}
                </div>
                <p className="mt-1 text-[9px] font-black uppercase text-slate-500">
                  {asString(report?.systemHealth?.status, running ? 'running' : 'standby')}
                </p>
              </div>
              <div className="flex-1 space-y-2">
                <ScoreBar label="Modularity" value={asNumber(systemScores?.modularityScore, running ? 64 : 0)} />
                <ScoreBar label="Synthesis" value={asNumber(systemScores?.synthesisStabilityScore, running ? 72 : 0)} />
                {layout === 'enterprise' && (
                  <>
                    <ScoreBar label="Orchestration" value={asNumber(systemScores?.orchestrationComplexityScore, running ? 68 : 0)} />
                    <ScoreBar label="Pipeline Safety" value={asNumber(systemScores?.pipelineSafetyScore, running ? 75 : 0)} />
                  </>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Orchestration Flow" icon={Workflow}>
            <OrchestrationFlow running={running} stages={asStringArray(explainability.routingPath).length ? asStringArray(explainability.routingPath) : stages} />
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <Panel title="Selected Intelligence" icon={BrainCircuit} accent="border-cyan-300/20">
              <p className="break-words text-lg font-black leading-tight text-cyan-100">{dominant}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                {asString(arbitration.why, running ? 'Priority arbitration is evaluating active signals.' : 'No arbitration winner available.')}
              </p>
            </Panel>
            <Panel title="Latency" icon={Clock3}>
              <div className="font-mono text-3xl font-black text-white">{latencyLabel}</div>
              <p className="mt-2 text-[10px] text-slate-500">{timeAgo(lastUpdatedAt)}</p>
            </Panel>
          </div>

          {(mode === 'debug' || mode === 'explainability' || mode === 'pipeline' || layout === 'enterprise') && (
            <Panel title="Confidence Metrics" icon={Gauge}>
              {asRecord(arbitration.confidenceBreakdown) ? (
                <div className="space-y-2">
                  {Object.entries(asRecord(arbitration.confidenceBreakdown) ?? {}).map(([key, value]) => (
                    <ScoreBar key={key} label={stageLabel(key)} value={asNumber(value)} />
                  ))}
                </div>
              ) : (
                <EmptyTrace running={running} />
              )}
            </Panel>
          )}

          {(mode === 'debug' || mode === 'pipeline' || layout === 'enterprise') && (
            <Panel title="Suppressed Intelligences" icon={ListFilter}>
              {suppressed.length ? (
                <div className="space-y-2">
                  {suppressed.slice(0, layout === 'enterprise' ? 10 : 5).map((item) => (
                    <div key={item} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                      <span className="truncate text-[10px] font-semibold text-slate-300">{item}</span>
                      <span className="rounded-full border border-rose-300/20 bg-rose-300/[0.06] px-2 py-0.5 text-[8px] font-black uppercase text-rose-200">
                        suppressed
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyTrace running={running} />
              )}
            </Panel>
          )}

          {(mode === 'explainability' || layout === 'enterprise') && (
            <Panel title="Reasoning Trace" icon={Eye} accent="border-purple-300/20">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[8px] font-black uppercase text-slate-500">Arbitration</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
                    {asString(asRecord(explainability.arbitrationOutcome)?.why, asString(arbitration.why, 'Awaiting explainability trace.'))}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[8px] font-black uppercase text-slate-500">Synthesis</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
                    {synthesisMode} / {asString(synthesis.finalTone, 'tone pending')} / {asString(synthesis.compressionLevel, 'compression pending')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {asStringArray(explainability.escalationTriggers).slice(0, 5).map((item) => (
                    <span key={item} className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2 py-1 text-[8px] font-black uppercase text-amber-100">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {(mode === 'pipeline' || layout === 'enterprise') && (
            <Panel title="Pipeline Inspector" icon={Activity} accent="border-blue-300/20">
              {events.length ? (
                <div className="space-y-2">
                  {events.slice(-8).map((event, index) => (
                    <div key={`${event.name}-${index}`} className="grid grid-cols-[8px_1fr] gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.7)]" />
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-[10px] font-black uppercase text-slate-300">{stageLabel(asString(event.name, 'event'))}</span>
                          <span className="text-[8px] font-mono text-slate-600">{asString(event.stage, 'stage')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyTrace running={running} />
              )}
            </Panel>
          )}

          <Panel title="Response Authority" icon={BadgeCheck}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[8px] font-black uppercase text-slate-500">Frame</div>
                <div className="mt-1 truncate text-[10px] font-bold text-white">{asString(orchestration.primaryFrame, 'pending')}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[8px] font-black uppercase text-slate-500">Risk</div>
                <div className="mt-1 truncate text-[10px] font-bold text-white">{riskLevel}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[8px] font-black uppercase text-slate-500">Mode</div>
                <div className="mt-1 truncate text-[10px] font-bold text-white">{synthesisMode}</div>
              </div>
            </div>
          </Panel>

          {mode === 'normal' && !report && !running && (
            <EmptyTrace running={false} />
          )}
        </div>
      </div>
    </aside>
  );
}

export default memo(ArchitectureDashboard);
