"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ACTION_REMINDER_EVENT,
  formatCountdown,
  getActiveReminder,
  readActionReminders,
  updateActionReminder,
  type ActionReminderRecord,
} from '@/lib/actionReminders';
import { updateDecisionScoreOnActionCompletion } from '@/lib/userProfile';
import { generateIdentityLabel } from '@/lib/identityEngine';

function readActive(): [string, ActionReminderRecord] | null {
  try {
    const raw = localStorage.getItem("solveos_action_pressure_v1");
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

  const refresh = useCallback(() => {
    try {
      const data = readActive?.();
      if (data) setActive(data);
      setNow(Date.now());
    } catch (e) {
      console.error("refresh error", e);
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

  const overdue = useMemo(() => {
    if (!active) return false;
    return new Date(active[1].dueAt).getTime() <= now;
  }, [active, now]);

  useEffect(() => {
    if (!active || !overdue || active[1].status === 'done' || active[1].status === 'skipped') return;
    if (typeof Notification === 'undefined') return;
    const key = `solveos_action_notification_${active[0]}`;
    if (window.localStorage.getItem(key)) return;
    const showNotification = () => {
      new Notification("You're avoiding a decision you already made", {
        body: active[1].action,
      });
      window.localStorage.setItem(key, new Date().toISOString());
    };
    if (Notification.permission === 'granted') {
      showNotification();
    } else if (Notification.permission === 'default') {
      void Notification.requestPermission().then((permission) => {
        if (permission === 'granted') showNotification();
      });
    }
  }, [active, overdue]);

  const markDone = useCallback(() => {
    if (!active) return;
    updateDecisionScoreOnActionCompletion();
    updateActionReminder(active[0], {
      ...active[1],
      status: 'done',
      action: active[1].action,
      completedAt: new Date().toISOString(),
    });
    const doneCount = Object.values(readActionReminders()).filter((record) => record.status === 'done').length;
    setCompletionMessage(completionEmotion(doneCount));
    window.setTimeout(() => setCompletionMessage(null), 2200);
    refresh();
  }, [active, refresh]);

  if (!active && completionMessage) {
    return (
      <div className="fixed left-0 right-0 top-0 z-[120] border-b border-emerald-400/25 bg-[#07130D]/95 px-4 py-3 text-emerald-50 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl action-complete-pulse">
        <div className="mx-auto max-w-5xl text-sm font-black uppercase tracking-widest text-emerald-200">{completionMessage}</div>
      </div>
    );
  }

  if (!active) return null;

  const [, reminder] = active;
  const identity = generateIdentityLabel(readActionReminders(), now);

  return (
    <div className="fixed left-0 right-0 top-0 z-[120] border-b border-amber-400/25 bg-[#120F08]/95 px-4 py-3 text-amber-50 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              {overdue ? "You're avoiding a decision you already made" : 'You have a pending action'}
            </div>
            <div className="mt-1 line-clamp-2 text-sm font-semibold text-white">{reminder.action}</div>
            <div className="mt-1 text-[11px] font-black text-amber-100">Identity: {identity}</div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className={`rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${
            overdue
              ? 'border-rose-400/30 bg-rose-500/[0.12] text-rose-200'
              : 'border-amber-400/25 bg-amber-400/[0.08] text-amber-200'
          }`}>
            {formatCountdown(reminder.dueAt, now)}
          </div>
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
    </div>
  );
}
