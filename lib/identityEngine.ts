import type { ActionReminderRecord, ActionReminderStore } from './actionReminders';
import { getProfile, getIdentityLabel } from './userProfile';

export interface IdentitySignals {
  executionStreak: number;
  completionRate: number;
  skipRate: number;
  delayRate: number;
  totalActions: number;
}

function recordTime(record: ActionReminderRecord): number {
  return new Date(record.updatedAt || record.createdAt).getTime();
}

export function computeIdentitySignals(store: ActionReminderStore, now = Date.now()): IdentitySignals {
  const records = Object.values(store);
  const totalActions = records.length;
  if (totalActions === 0) {
    return { executionStreak: 0, completionRate: 0, skipRate: 0, delayRate: 0, totalActions };
  }

  const completed = records.filter((record) => record.status === 'done').length;
  const skipped = records.filter((record) => record.status === 'skipped').length;
  const delayed = records.filter((record) => (
    record.status === 'blocked' ||
    (record.status === 'pending' && new Date(record.dueAt).getTime() <= now)
  )).length;

  let executionStreak = 0;
  const newestFirst = records.slice().sort((a, b) => recordTime(b) - recordTime(a));
  for (const record of newestFirst) {
    if (record.status !== 'done') break;
    executionStreak += 1;
  }

  return {
    executionStreak,
    completionRate: completed / totalActions,
    skipRate: skipped / totalActions,
    delayRate: delayed / totalActions,
    totalActions,
  };
}

export function identityLabel(signals: IdentitySignals): string {
  if (signals.totalActions === 0) return 'You have not proven follow-through yet';
  if (signals.skipRate >= 0.34) return 'You ignore your own decisions';
  if (signals.delayRate >= 0.34) return 'You hesitate';
  if (signals.completionRate >= 0.75 && signals.executionStreak >= 3) return 'You execute';
  if (signals.completionRate >= 0.5 && signals.executionStreak >= 2) return 'You are becoming consistent';
  if (signals.completionRate >= 0.6) return 'You act on decisions';
  return 'You hesitate under pressure';
}

export function generateIdentityLabel(): string {
  return getIdentityLabel(getProfile().userDecisionScore);
}
