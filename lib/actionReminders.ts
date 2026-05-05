"use client";

export const ACTION_REMINDER_KEY = 'solveos_action_pressure_v1';
export const ACTION_REMINDER_EVENT = 'solveos-action-reminders-updated';
export const ACTION_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ActionStatus = 'not yet' | 'done' | 'skipped' | 'overdue' | 'pending' | 'blocked';
export type ActionResultStatus = 'done' | 'not yet' | 'skipped' | 'overdue';
export type BlockerCategory = 'fear' | 'unclear' | 'lazy' | 'external';
export type PressureState = 'normal' | 'pressure_2h' | 'pressure_12h' | 'overdue';

export interface ActionReminderRecord {
  status: ActionStatus;
  action: string;
  decisionText?: string;
  language?: string;
  blocker?: string;
  blockerCategory?: BlockerCategory;
  smallerAction?: string;
  createdAt: string;
  dueAt: string;
  completedAt?: string;
  skippedAt?: string;
  updatedAt: string;
  overdueScorePenaltyApplied?: boolean;
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

export function createReminderRecord(action: string, status: ActionStatus = 'not yet', decisionText?: string, language?: string): ActionReminderRecord {
  const now = new Date();
  const createdAt = now.toISOString();
  return {
    status,
    action,
    decisionText,
    language,
    createdAt,
    dueAt: new Date(now.getTime() + ACTION_REMINDER_WINDOW_MS).toISOString(),
    updatedAt: createdAt,
  };
}

export function ensureActionReminder(id: string, action: string, decisionText?: string, language?: string): ActionReminderStore {
  const store = readActionReminders();
  if (!action || store[id]) return store;
  const next = { ...store, [id]: createReminderRecord(action, 'not yet', decisionText, language) };
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
  return record.status === 'not yet' || record.status === 'pending' || record.status === 'blocked' || record.status === 'overdue';
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

export function getPressureState(record: ActionReminderRecord, now = Date.now()): PressureState {
  if (record.status === 'overdue') return 'overdue';
  const elapsedHours = (now - new Date(record.createdAt).getTime()) / 3_600_000;
  if (elapsedHours >= 24) return 'overdue';
  if (elapsedHours >= 12) return 'pressure_12h';
  if (elapsedHours >= 2) return 'pressure_2h';
  return 'normal';
}

export function getPressureMessage(state: PressureState): string {
  switch (state) {
    case 'overdue': return 'You missed your deadline. Why?';
    case 'pressure_12h': return 'You are avoiding this';
    case 'pressure_2h': return 'Still not done?';
    default: return 'You have a pending action';
  }
}

export function generateSmallerAction(action: string, category: BlockerCategory): string {
  const text = action.length > 80 ? `${action.slice(0, 80)}...` : action;
  switch (category) {
    case 'fear': return `5 minutes only: ${text}`;
    case 'unclear': return `Write what is unclear about: ${text}`;
    case 'lazy': return `First step only: ${text}`;
    case 'external': return `Name what is blocking: ${text}`;
  }
}

export function restartWithSmallerAction(id: string, originalAction: string, category: BlockerCategory): ActionReminderStore {
  const smaller = generateSmallerAction(originalAction, category);
  const now = new Date();
  return updateActionReminder(id, {
    action: smaller,
    smallerAction: smaller,
    blockerCategory: category,
    status: 'not yet',
    createdAt: now.toISOString(),
    dueAt: new Date(now.getTime() + ACTION_REMINDER_WINDOW_MS).toISOString(),
  });
}

export function getHistoryRecords(store = readActionReminders()): [string, ActionReminderRecord][] {
  return Object.entries(store)
    .sort((a, b) => new Date(getActionResultTimestamp(b[1])).getTime() - new Date(getActionResultTimestamp(a[1])).getTime());
}

export function getActionMetrics(store = readActionReminders()): { successRate: number; streak: number } {
  const history = getHistoryRecords(store);
  const last7 = history.slice(0, 7);
  const doneCount = last7.filter(([, r]) => r.status === 'done').length;
  const successRate = last7.length > 0 ? Math.round((doneCount / last7.length) * 100) : 0;

  let streak = 0;
  for (const [, record] of history) {
    if (record.status === 'done') streak++;
    else break;
  }

  return { successRate, streak };
}

export function getActionResultStatus(record: ActionReminderRecord, now = Date.now()): ActionResultStatus {
  if (record.status === 'done') return 'done';
  if (record.status === 'skipped') return 'skipped';
  if (record.status === 'overdue' || new Date(record.dueAt).getTime() <= now) return 'overdue';
  return 'not yet';
}

export function getActionResultTimestamp(record: ActionReminderRecord): string {
  return record.completedAt || record.skippedAt || record.updatedAt || record.createdAt;
}

export function formatTimeAgo(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return minutes >= 1 ? `${minutes}m ago` : 'just now';
}
