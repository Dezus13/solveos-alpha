"use client";

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { DecisionMemoryEntry } from '@/lib/types';

interface DecisionJournalProps {
  refreshTrigger?: string;
  currentDecisionId?: string;
  onReview: (problem: string) => void;
}

function extractVerdictClass(recommendation: string): string {
  const r = (recommendation || '').trim().toLowerCase();
  if (r.startsWith('full commit')) return 'FC';
  if (r.startsWith('reversible experiment')) return 'RE';
  if (r.startsWith('delay')) return 'D';
  if (r.startsWith('kill the idea')) return 'KI';
  if (r.startsWith('review')) return 'RV';
  return '—';
}

const VERDICT_COLORS: Record<string, string> = {
  FC: 'text-emerald-400',
  RE: 'text-blue-400',
  D: 'text-amber-400',
  KI: 'text-rose-400',
  RV: 'text-purple-400',
  '—': 'text-slate-600',
};

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
}

function StatusDot({ status, reviewDue }: { status: string; reviewDue: boolean }) {
  if (reviewDue) return <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0 mt-[5px]" />;
  const cls =
    status === 'better' ? 'bg-emerald-400' :
    status === 'worse'  ? 'bg-rose-400'    :
    status === 'expected' ? 'bg-amber-400' :
    'bg-slate-600';
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px] ${cls}`} />;
}

export default function DecisionJournal({ refreshTrigger, currentDecisionId, onReview }: DecisionJournalProps) {
  const [entries, setEntries] = useState<DecisionMemoryEntry[]>([]);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/memory')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { decisions?: DecisionMemoryEntry[] }) => {
        if (cancelled) return;
        const all: DecisionMemoryEntry[] = Array.isArray(data.decisions) ? data.decisions : [];
        setEntries(all.filter(e => !e.blueprint?.isDemo).slice(0, 20));
        setFetchedAt(new Date().getTime()); // wall-clock ms set in effect, safe to read in render
      })
      .catch(() => {/* silent — journal is non-critical */})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-1 mt-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-8 rounded-lg bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <p className="text-[10px] text-slate-600 px-2 py-1">No decisions recorded yet.</p>;
  }

  const now = fetchedAt;

  return (
    <div className="space-y-0.5 overflow-y-auto max-h-60">
      {entries.map(entry => {
        const isCurrent = entry.id === currentDecisionId;
        const reviewDue =
          !!entry.pendingReview &&
          !entry.outcome &&
          new Date(entry.pendingReview.scheduledFor).getTime() <= now;
        const vc = extractVerdictClass(entry.blueprint?.recommendation || '');
        const problem =
          entry.problem.length > 34
            ? `${entry.problem.slice(0, 34)}…`
            : entry.problem;

        return (
          <div
            key={entry.id}
            className={`group flex items-start gap-2 px-2 py-2 rounded-xl transition-colors ${
              isCurrent
                ? 'bg-purple-500/[0.08] border border-purple-500/15'
                : 'hover:bg-white/[0.025]'
            }`}
          >
            <StatusDot status={entry.outcomeStatus || 'unknown'} reviewDue={reviewDue} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-slate-300 leading-snug truncate">{problem}</span>
                <span className="text-[9px] text-slate-600 flex-shrink-0 font-mono">{relativeDate(entry.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[8px] font-black uppercase tracking-wider ${VERDICT_COLORS[vc]}`}>{vc}</span>
                {reviewDue && (
                  <span className="text-[8px] font-black uppercase tracking-wider text-purple-400">review due</span>
                )}
                {entry.outcome && entry.outcomeStatus && entry.outcomeStatus !== 'unknown' && (
                  <span className={`text-[8px] font-black uppercase tracking-wider ${
                    entry.outcomeStatus === 'better' ? 'text-emerald-500' :
                    entry.outcomeStatus === 'worse'  ? 'text-rose-500'    : 'text-amber-500'
                  }`}>{entry.outcomeStatus}</span>
                )}
              </div>
            </div>
            {!entry.outcome && (
              <button
                type="button"
                onClick={() => onReview(entry.problem)}
                title="Open review"
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-purple-300"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
