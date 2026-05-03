"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ACTION_REMINDER_EVENT,
  formatCountdown,
  generateSmallerAction,
  getActiveReminder,
  getPressureMessage,
  getPressureState,
  readActionReminders,
  restartWithSmallerAction,
  updateActionReminder,
  type ActionReminderRecord,
  type BlockerCategory,
} from '@/lib/actionReminders';
import { updateDecisionScoreOnActionCompletion, updateDecisionScoreOnActionOverdue } from '@/lib/userProfile';
import { generateIdentityLabel } from '@/lib/identityEngine';

const CATEGORY_LABELS: Record<BlockerCategory, string> = {
  fear: 'Fear',
  unclear: 'Not clear',
  lazy: 'No energy',
  external: 'Blocked externally',
};

function readActive(): [string, ActionReminderRecord] | null {
  try {
    const raw = localStorage.getItem('solveos_action_pressure_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return getActiveReminder(parsed);
  } catch {
    return null;
  }
}

function completionEmotion(streak: number): string {
  if (streak >= 10) return 'You are operating differently now';
  if (streak >= 5) return 'This is discipline';
  if (streak >= 2) return 'You are building momentum';
  return 'Good. You execute.';
}

export default function PersistentActionBanner() {
  const [active, setActive] = useState<[string, ActionReminderRecord] | null>(() => readActive());
  const [now, setNow] = useState(() => Date.now());
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  // Keyed by reminder ID so it resets automatically when the active reminder changes
  const [categoryById, setCategoryById] = useState<{ id: string; category: BlockerCategory } | null>(null);
  const selectedCategory = categoryById !== null && categoryById.id === active?.[0] ? categoryById.category : null;

  const refresh = useCallback(() => {
    try {
      setActive(readActive());
      setNow(Date.now());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'solveos_action_pressure_v1') refresh();
    };
    window.addEventListener(ACTION_REMINDER_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    const id = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener(ACTION_REMINDER_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(id);
    };
  }, [refresh]);

  const pressureState = useMemo(() => {
    if (!active) return 'normal' as const;
    return getPressureState(active[1], now);
  }, [active, now]);

  const isOverdue = pressureState === 'overdue';

  useEffect(() => {
    if (!isOverdue || !active) return;
    const [id, reminder] = active;
    if (reminder.overdueScorePenaltyApplied) return;
    updateDecisionScoreOnActionOverdue();
    updateActionReminder(id, { ...reminder, action: reminder.action, overdueScorePenaltyApplied: true });
  }, [isOverdue, active]);

  const markDone = useCallback(() => {
    if (!active) return;
    updateDecisionScoreOnActionCompletion();
    updateActionReminder(active[0], {
      ...active[1],
      status: 'done',
      action: active[1].action,
      completedAt: new Date().toISOString(),
    });
    const doneCount = Object.values(readActionReminders()).filter((r) => r.status === 'done').length;
    setCompletionMessage(completionEmotion(doneCount));
    window.setTimeout(() => setCompletionMessage(null), 2200);
    refresh();
  }, [active, refresh]);

  const handlePickCategory = useCallback((category: BlockerCategory) => {
    if (!active) return;
    setCategoryById({ id: active[0], category });
  }, [active]);

  const handleRestartSmaller = useCallback(() => {
    if (!active || !selectedCategory) return;
    const next = restartWithSmallerAction(active[0], active[1].action, selectedCategory);
    setActive(getActiveReminder(next));
    setCategoryById(null);
  }, [active, selectedCategory]);

  const handleBackCategory = useCallback(() => {
    setCategoryById(null);
  }, []);

  if (!active && completionMessage) {
    return (
      <div className="fixed left-0 right-0 top-0 z-[120] border-b border-emerald-400/25 bg-[#07130D]/95 px-4 py-3 text-emerald-50 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl action-complete-pulse">
        <div className="mx-auto max-w-5xl text-sm font-black uppercase tracking-widest text-emerald-200">{completionMessage}</div>
      </div>
    );
  }

  if (!active) return null;

  const [, reminder] = active;
  const identity = generateIdentityLabel();
  const headerMessage = getPressureMessage(pressureState);

  const bannerBg = isOverdue
    ? 'bg-[#1A0810]/96 border-rose-500/30'
    : pressureState === 'pressure_12h'
      ? 'bg-[#160B08]/96 border-orange-500/25'
      : 'bg-[#120F08]/95 border-amber-400/25';

  const labelColor = isOverdue
    ? 'text-rose-300'
    : pressureState === 'pressure_12h'
      ? 'text-orange-300'
      : 'text-amber-300';

  const countdownColor = isOverdue
    ? 'border-rose-400/30 bg-rose-500/[0.12] text-rose-200'
    : pressureState === 'pressure_12h'
      ? 'border-orange-400/25 bg-orange-400/[0.08] text-orange-200'
      : 'border-amber-400/25 bg-amber-400/[0.08] text-amber-200';

  const smallerPreview = selectedCategory
    ? generateSmallerAction(reminder.action, selectedCategory)
    : null;

  return (
    <div className={`fixed left-0 right-0 top-0 z-[120] border-b px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl ${bannerBg}`}>
      <div className="mx-auto max-w-5xl space-y-3">
        {/* Top row: label + action + Done */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${labelColor}`} />
            <div className="min-w-0">
              <div className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>
                {headerMessage}
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-semibold text-white">{reminder.action}</div>
              {!isOverdue && (
                <div className="mt-1 text-[11px] font-black text-amber-100/70">Identity: {identity}</div>
              )}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {!isOverdue && (
              <div className={`rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${countdownColor}`}>
                {formatCountdown(reminder.dueAt, now)}
              </div>
            )}
            <button
              type="button"
              onClick={markDone}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.1] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-200 hover:bg-emerald-400/[0.16]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </button>
          </div>
        </div>

        {/* Overdue: "Why not done?" category buttons */}
        {isOverdue && !smallerPreview && (
          <div className="border-t border-white/[0.07] pt-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-rose-300">
              Why not done?
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as BlockerCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handlePickCategory(cat)}
                  className="rounded-lg border border-rose-400/20 bg-rose-500/[0.08] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-rose-200 hover:bg-rose-500/[0.14]"
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Smaller action preview */}
        {isOverdue && smallerPreview && (
          <div className="border-t border-white/[0.07] pt-3">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-rose-300">
              Smaller step
            </div>
            <div className="text-sm font-semibold text-white">{smallerPreview}</div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleRestartSmaller}
                className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.1] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-200 hover:bg-emerald-500/[0.16]"
              >
                I&apos;ll do this now
              </button>
              <button
                type="button"
                onClick={handleBackCategory}
                className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-200"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
