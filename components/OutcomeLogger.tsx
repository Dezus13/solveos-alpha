"use client";

import { memo, useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Clock, Loader2, BookOpen, Calendar } from 'lucide-react';
import type { DecisionBlueprint } from '@/lib/types';

type Choice = 'better' | 'expected' | 'worse' | 'unknown';
type Phase = 'idle' | 'open' | 'scheduling' | 'submitting' | 'done' | 'scheduled' | 'error';
type OutcomeStatus = 'better' | 'expected' | 'worse';

interface ChoiceDef {
  id: Choice;
  label: string;
  icon: React.ElementType;
  scoreAccuracy: number;
  ringColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

const CHOICES: ChoiceDef[] = [
  {
    id: 'better',
    label: 'Better',
    icon: CheckCircle2,
    scoreAccuracy: 85,
    ringColor: 'ring-emerald-500/60',
    textColor: 'text-emerald-300',
    bgColor: 'bg-emerald-500/[0.08]',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'expected',
    label: 'Expected',
    icon: MinusCircle,
    scoreAccuracy: 50,
    ringColor: 'ring-amber-500/60',
    textColor: 'text-amber-300',
    bgColor: 'bg-amber-500/[0.08]',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'worse',
    label: 'Worse',
    icon: XCircle,
    scoreAccuracy: 15,
    ringColor: 'ring-rose-500/60',
    textColor: 'text-rose-300',
    bgColor: 'bg-rose-500/[0.08]',
    borderColor: 'border-rose-500/30',
  },
  {
    id: 'unknown',
    label: 'Too Early',
    icon: Clock,
    scoreAccuracy: -1,
    ringColor: 'ring-slate-500/40',
    textColor: 'text-slate-400',
    bgColor: 'bg-white/[0.02]',
    borderColor: 'border-white/10',
  },
];

const OUTCOME_STATUS_BY_CHOICE: Record<Exclude<Choice, 'unknown'>, OutcomeStatus> = {
  better: 'better',
  expected: 'expected',
  worse: 'worse',
};

interface OutcomeLoggerProps {
  decisionId: string;
  blueprintScore: number;
  problem?: string;
  blueprint?: DecisionBlueprint;
  defaultOpen?: boolean;
}

function formatReviewDate(daysOut: number): string {
  const d = new Date(Date.now() + daysOut * 86_400_000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function OutcomeLogger({ decisionId, blueprintScore, problem, blueprint, defaultOpen = false }: OutcomeLoggerProps) {
  const [phase, setPhase] = useState<Phase>(defaultOpen ? 'open' : 'idle');
  const [choice, setChoice] = useState<Choice | null>(null);
  const [notes, setNotes] = useState('');
  const [loggedChoice, setLoggedChoice] = useState<Choice | null>(null);
  const [scheduledDays, setScheduledDays] = useState<30 | 60 | 90 | null>(null);

  const selected = CHOICES.find(c => c.id === choice);
  const logged = CHOICES.find(c => c.id === loggedChoice);

  const handleContinue = () => {
    if (!choice) return;
    if (choice === 'unknown') {
      setPhase('scheduling');
    } else {
      setPhase('submitting');
      void submitOutcome(choice);
    }
  };

  const submitOutcome = async (outcomeChoice: Exclude<Choice, 'unknown'>) => {
    try {
      const outcomeScore = outcomeChoice === 'expected'
        ? blueprintScore
        : CHOICES.find(c => c.id === outcomeChoice)!.scoreAccuracy;
      const res = await fetch('/api/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId,
          decision: problem && blueprint ? { id: decisionId, problem, blueprint } : undefined,
          outcome: {
            actualOutcome: notes.trim()
              ? `${outcomeChoice}: ${notes.trim()}`
              : outcomeChoice,
            scoreAccuracy: outcomeScore,
            outcomeStatus: OUTCOME_STATUS_BY_CHOICE[outcomeChoice],
            lessons: notes.trim() ? [notes.trim()] : [],
            recommendations: [],
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error('Outcome logging failed', {
          status: res.status,
          error,
          decisionId,
          outcomeChoice,
        });
        throw new Error(typeof error.error === 'string' ? error.error : 'Failed to log outcome');
      }

      setLoggedChoice(outcomeChoice);
      setPhase('done');
    } catch {
      setLoggedChoice(null);
      setPhase('error');
    }
  };

  const scheduleReview = async (days: 30 | 60 | 90) => {
    setScheduledDays(days);
    setPhase('submitting');
    try {
      const reviewType = days === 30 ? '30day' : days === 60 ? '60day' : '90day';
      const res = await fetch('/api/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId,
          pendingReview: { reviewType },
        }),
      });

      if (!res.ok) throw new Error('Failed to schedule review');
      setPhase('scheduled');
    } catch {
      setScheduledDays(null);
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('idle');
    setChoice(null);
    setNotes('');
  };

  // ── Done state ───────────────────────────────────────────────────────────────
  if (phase === 'done' && logged) {
    const Icon = logged.icon;
    return (
      <div className="relative z-20 mt-5 pt-5 border-t border-white/[0.04] pointer-events-auto">
        <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl ${logged.bgColor} border ${logged.borderColor}`}>
          <Icon className={`w-4 h-4 ${logged.textColor} flex-shrink-0`} />
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${logged.textColor}`}>
              Outcome Logged · {logged.label}
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5">
              Flywheel updated — calibration score and memory graph will factor this in future decisions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Scheduled state ──────────────────────────────────────────────────────────
  if (phase === 'scheduled' && scheduledDays) {
    return (
      <div className="relative z-20 mt-5 pt-5 border-t border-white/[0.04] pointer-events-auto">
        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-500/[0.06] border border-slate-500/20">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              Review Scheduled · {scheduledDays} Days
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5">
              Reminder set for {formatReviewDate(scheduledDays)} — visit Enterprise to log the outcome when ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Idle — just the trigger ──────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="relative z-20 mt-5 pt-5 border-t border-white/[0.04] flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-2 opacity-50">
          <div className="w-1 h-1 rounded-full bg-slate-500" />
          <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">
            Outcome not yet logged
          </span>
        </div>
        <button
          onClick={() => setPhase('open')}
          type="button"
          className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all group"
        >
          <BookOpen className="w-3 h-3 text-slate-400 group-hover:text-purple-300 transition-colors" />
          <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-purple-300 tracking-widest transition-colors">
            Log Outcome
          </span>
        </button>
      </div>
    );
  }

  // ── Scheduling state (unknown chosen) ────────────────────────────────────────
  if (phase === 'scheduling') {
    return (
      <div className="relative z-20 mt-5 pt-5 border-t border-white/[0.04] space-y-4 pointer-events-auto">
        <div>
          <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
            Schedule a review for when you can evaluate
          </span>
          <p className="text-[9px] text-slate-500 mt-1">
            We&apos;ll surface this decision in Enterprise when the review window opens.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => void scheduleReview(30)}
            className="flex flex-col items-start px-4 py-4 rounded-xl border border-slate-500/20 bg-white/[0.02] hover:bg-slate-500/[0.06] hover:border-slate-400/30 transition-all"
          >
            <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">30 Days</span>
            <span className="text-[9px] text-slate-500 mt-1">{formatReviewDate(30)}</span>
          </button>
          <button
            type="button"
            onClick={() => void scheduleReview(60)}
            className="flex flex-col items-start px-4 py-4 rounded-xl border border-slate-500/20 bg-white/[0.02] hover:bg-slate-500/[0.06] hover:border-slate-400/30 transition-all"
          >
            <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">60 Days</span>
            <span className="text-[9px] text-slate-500 mt-1">{formatReviewDate(60)}</span>
          </button>
          <button
            type="button"
            onClick={() => void scheduleReview(90)}
            className="flex flex-col items-start px-4 py-4 rounded-xl border border-slate-500/20 bg-white/[0.02] hover:bg-slate-500/[0.06] hover:border-slate-400/30 transition-all"
          >
            <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">90 Days</span>
            <span className="text-[9px] text-slate-500 mt-1">{formatReviewDate(90)}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // ── Open — picker + notes ────────────────────────────────────────────────────
  return (
    <div className="relative z-20 mt-5 pt-5 border-t border-white/[0.04] space-y-4 pointer-events-auto">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
          How did this decision play out?
        </span>
        <span className="text-[9px] font-mono text-slate-600 uppercase">
          Confidence was {blueprintScore}
        </span>
      </div>

      {/* Prediction context */}
      {blueprint?.outcomeContract && (() => {
        const oc = blueprint.outcomeContract!;
        const predictions = [
          { label: '30d', value: oc.prediction30 },
          { label: '60d', value: oc.prediction60 },
          { label: '90d', value: oc.prediction90 },
        ].filter(p => p.value);
        if (predictions.length === 0) return null;
        return (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 space-y-1.5">
            <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-2">What was predicted</div>
            {predictions.map(({ label, value }) => (
              <div key={label} className="grid grid-cols-[32px_1fr] gap-2 items-start">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{label}</span>
                <span className="text-[10px] text-slate-500 leading-snug">{value}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Choice grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CHOICES.map((c) => {
          const Icon = c.icon;
          const isSelected = choice === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setChoice(c.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all ${
                isSelected
                  ? `${c.bgColor} ${c.borderColor} ring-1 ${c.ringColor}`
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? c.textColor : 'text-slate-500'}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? c.textColor : 'text-slate-500'}`}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notes (not for unknown) */}
      {choice && choice !== 'unknown' && (
        <div className="bg-white/[0.015] border border-white/[0.06] rounded-xl px-4 py-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            readOnly={false}
            disabled={false}
            placeholder="What actually happened? What would you do differently? (optional)"
            rows={2}
            className="w-full bg-transparent text-[13px] text-slate-300 placeholder-slate-600 focus:outline-none resize-none font-medium leading-relaxed"
          />
        </div>
      )}

      {/* Unknown hint */}
      {choice === 'unknown' && (
        <p className="text-[9px] text-slate-500 leading-relaxed">
          You&apos;ll be asked to schedule a review date so this outcome can be captured later.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!choice || phase === 'submitting'}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30 ${
            selected
              ? `${selected.bgColor} ${selected.borderColor} border ${selected.textColor} hover:opacity-80`
              : 'bg-white/[0.03] border border-white/10 text-slate-500'
          }`}
        >
          {phase === 'submitting' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <span>{choice === 'unknown' ? 'Schedule Review →' : 'Log Outcome'}</span>
          )}
        </button>
        {phase === 'error' && (
          <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">
            Failed to save — try again
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(OutcomeLogger);
