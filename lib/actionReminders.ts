"use client";

export const ACTION_REMINDER_KEY = 'solveos_action_pressure_v1';
export const ACTION_REMINDER_EVENT = 'solveos-action-reminders-updated';
export const ACTION_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ActionStatus = 'pending' | 'done' | 'blocked' | 'skipped';

export interface ActionReminderRecord {
  status: ActionStatus;
  action: string;
  blocker?: string;
  createdAt: string;
  dueAt: string;
  completedAt?: string;
  skippedAt?: string;
  updatedAt: string;
}

export type ActionReminderStore = Record<string, ActionReminderRecord>;

export function readActionReminders(): ActionReminderStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ACTION_REMINDER_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as ActionReminderStore : {};
  } catch {
    return {};
  }
}

export function writeActionReminders(store: ActionReminderStore): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTION_REMINDER_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(ACTION_REMINDER_EVENT));
}

export function createReminderRecord(action: string, status: ActionStatus = 'pending'): ActionReminderRecord {
  const now = new Date();
  const createdAt = now.toISOString();
  return {
    status,
    action,
    createdAt,
    dueAt: new Date(now.getTime() + ACTION_REMINDER_WINDOW_MS).toISOString(),
    updatedAt: createdAt,
  };
}

export function ensureActionReminder(id: string, action: string): ActionReminderStore {
  const store = readActionReminders();
  if (!action || store[id]) return store;
  const next = { ...store, [id]: createReminderRecord(action) };
  writeActionReminders(next);
  return next;
}

export function updateActionReminder(id: string, patch: Partial<ActionReminderRecord> & { action: string }): ActionReminderStore {
  const store = readActionReminders();
  const existing = store[id] || createReminderRecord(patch.action);
  const now = new Date().toISOString();
  const next = {
    ...store,
    [id]: {
      ...existing,
      ...patch,
      action: patch.action,
      updatedAt: now,
    },
  };
  writeActionReminders(next);
  return next;
}

export function isIncompleteAction(record: ActionReminderRecord): boolean {
  return record.status === 'pending' || record.status === 'blocked';
}

export function getActiveReminder(store = readActionReminders()): [string, ActionReminderRecord] | null {
  const active = Object.entries(store)
    .filter(([, record]) => isIncompleteAction(record))
    .sort((a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime());
  return active[0] || null;
}

export function countFollowThrough(store = readActionReminders()): number {
  return Object.values(store).filter((record) => record.status === 'done').length;
}

export function formatCountdown(dueAt: string, now = Date.now()): string {
  const remaining = new Date(dueAt).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return 'Overdue';
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.max(0, Math.floor((remaining % 3_600_000) / 60_000));
  return `${hours}h ${minutes}m left`;
}
