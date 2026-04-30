"use client";

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { getSavedDecisions, updateDecision, type SavedDecision } from '@/lib/savedDecisions';
import { getProfile, updateProfileOnOutcome, type UserDecisionProfile } from '@/lib/userProfile';

type Status = SavedDecision['status'];

const STATUS_LABELS: Record<Status, string> = {
  pending: 'Pending',
  worked: 'Worked',
  failed: 'Did not work',
};

const STATUS_STYLES: Record<Status, string> = {
  pending: 'text-slate-400 border-slate-700 bg-white/[0.03]',
  worked: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/[0.07]',
  failed: 'text-rose-400 border-rose-500/25 bg-rose-500/[0.07]',
};

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
      {status === 'pending' && <Circle className="h-2.5 w-2.5" />}
      {status === 'worked' && <CheckCircle2 className="h-2.5 w-2.5" />}
      {status === 'failed' && <XCircle className="h-2.5 w-2.5" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

function ProfileCard({ profile }: { profile: UserDecisionProfile }) {
  if (profile.totalDecisions === 0) return null;
  const decisionScore = profile.userDecisionScore ?? 50;
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Personal Decision Model</p>
        <span className="text-[10px] text-slate-600">{profile.totalDecisions} tracked</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-28">Risk tolerance</span>
          <ScoreBar value={profile.riskTolerance} color="bg-purple-400/60" />
          <span className="text-[11px] text-slate-500 tabular-nums w-8 text-right">{Math.round(profile.riskTolerance * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-28">Execution score</span>
          <ScoreBar value={profile.executionScore} color="bg-emerald-400/60" />
          <span className="text-[11px] text-slate-500 tabular-nums w-8 text-right">{Math.round(profile.executionScore * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-28">Decision score</span>
          <ScoreBar value={decisionScore / 100} color={decisionScore >= 50 ? 'bg-blue-400/60' : 'bg-rose-400/60'} />
          <span className="text-[11px] text-slate-500 tabular-nums w-8 text-right">{decisionScore}</span>
        </div>
      </div>
      <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] font-semibold text-slate-400">
        {profile.decisionScoreTrend === 'down' ? '↓' : '↑'} {decisionScore >= 50 ? 'You follow through' : 'You ignore your own rules'}
      </p>
      {profile.biasPatterns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500/70 mb-1.5">Detected patterns</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.biasPatterns.map((b) => (
              <span key={b} className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function DecisionCard({ decision, onUpdate }: {
  decision: SavedDecision;
  onUpdate: (id: string, patch: { status?: Status; lesson?: string; followedForcedAction?: boolean }) => void;
}) {
  const [lesson, setLesson] = useState(decision.lesson ?? '');
  const [lessonDirty, setLessonDirty] = useState(false);
  const [followedForcedAction, setFollowedForcedAction] = useState(decision.followedForcedAction === true);

  const saveLesson = useCallback(() => {
    onUpdate(decision.id, { lesson });
    setLessonDirty(false);
  }, [decision.id, lesson, onUpdate]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#F8FAFF] leading-snug line-clamp-2">{decision.question}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{formatDate(decision.timestamp)}</p>
        </div>
        <StatusBadge status={decision.status} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">Verdict</p>
        <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{decision.verdict}</p>
      </div>

      {decision.keyRisks.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1.5">Key risks</p>
          <ul className="space-y-0.5">
            {decision.keyRisks.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-slate-400">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-600" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {decision.confidence !== undefined && (
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Confidence</p>
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-purple-400/60" style={{ width: `${decision.confidence}%` }} />
          </div>
          <span className="text-[11px] text-slate-500 tabular-nums">{decision.confidence}%</span>
        </div>
      )}

      {decision.status === 'pending' && (
        <div className="space-y-3">
          {decision.forcedAction && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <input
                type="checkbox"
                checked={followedForcedAction}
                onChange={(e) => setFollowedForcedAction(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent accent-purple-500"
              />
              <span>
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Followed forced action</span>
                <span className="mt-1 line-clamp-2 block text-[11px] leading-snug text-slate-400">{decision.forcedAction}</span>
              </span>
            </label>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdate(decision.id, { status: 'worked', followedForcedAction })}
              className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-[12px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/[0.14]"
            >
              Worked
            </button>
            <button
              type="button"
              onClick={() => onUpdate(decision.id, { status: 'failed', followedForcedAction })}
              className="flex-1 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-3 py-2 text-[12px] font-semibold text-rose-400 transition-colors hover:bg-rose-500/[0.14]"
            >
              Did not work
            </button>
          </div>
        </div>
      )}

      {decision.status !== 'pending' && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
            What did you learn?
          </label>
          <textarea
            value={lesson}
            onChange={(e) => { setLesson(e.target.value); setLessonDirty(true); }}
            placeholder="Write your takeaway…"
            rows={2}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[13px] text-slate-200 placeholder-slate-600 outline-none focus:border-purple-400/30 transition-colors"
          />
          {lessonDirty && (
            <button
              type="button"
              onClick={saveLesson}
              className="rounded-lg bg-purple-500/[0.15] border border-purple-500/20 px-3 py-1.5 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/[0.25] transition-colors"
            >
              Save note
            </button>
          )}
          {!lessonDirty && lesson && (
            <p className="text-[11px] text-slate-500 italic">{lesson}</p>
          )}
        </div>
      )}
    </div>
  );
}

const FILTERS: Array<{ label: string; value: Status | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Worked', value: 'worked' },
  { label: 'Did not work', value: 'failed' },
];

export default function JournalView() {
  // This component is loaded with ssr:false — localStorage is always available here
  const [decisions, setDecisions] = useState<SavedDecision[]>(() => getSavedDecisions());
  const [profile, setProfile] = useState<UserDecisionProfile | null>(() => getProfile());
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const handleUpdate = useCallback((id: string, patch: { status?: Status; lesson?: string; followedForcedAction?: boolean }) => {
    updateDecision(id, patch);
    const updated = getSavedDecisions();
    setDecisions(updated);

    // Update profile when a status outcome is recorded
    if (patch.status === 'worked' || patch.status === 'failed') {
      const changed = updated.find((d) => d.id === id);
      if (changed) {
        const newProfile = updateProfileOnOutcome(updated, changed, patch.status);
        setProfile(newProfile);
      }
    }
  }, []);

  const visible = filter === 'all' ? decisions : decisions.filter((d) => d.status === filter);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-semibold text-slate-400 transition-colors hover:text-white hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[#F8FAFF]">Decision Journal</h1>
          <p className="text-[12px] text-slate-500">{decisions.length} saved decision{decisions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center">
          <p className="text-sm text-slate-400">No saved decisions yet.</p>
          <p className="mt-1 text-[12px] text-slate-600">Use the &ldquo;Save decision&rdquo; button after any analysis to track it here.</p>
        </div>
      ) : (
        <>
          {profile && <ProfileCard profile={profile} />}

          <div className="mb-6 inline-flex rounded-xl border border-white/8 bg-white/[0.025] p-1 gap-0.5">
            {FILTERS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  filter === value ? 'bg-white/[0.09] text-white' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-slate-500 px-1">No decisions match this filter.</p>
          ) : (
            <div className="space-y-4">
              {visible.map((d) => (
                <DecisionCard key={d.id} decision={d} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
