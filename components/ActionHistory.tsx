"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  ACTION_REMINDER_EVENT,
  formatTimeAgo,
  getActionMetrics,
  getActionResultStatus,
  getActionResultTimestamp,
  getHistoryRecords,
  type ActionReminderRecord,
} from '@/lib/actionReminders';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  done: { label: 'Done', color: 'text-emerald-400' },
  'not yet': { label: 'Not yet', color: 'text-amber-300' },
  skipped: { label: 'Skipped', color: 'text-rose-400' },
  overdue: { label: 'Overdue', color: 'text-rose-400' },
};

function resolvedStatus(record: ActionReminderRecord): { label: string; color: string } {
  return STATUS_CONFIG[getActionResultStatus(record)] ?? STATUS_CONFIG.skipped;
}

export default function ActionHistory() {
  const [records, setRecords] = useState<[string, ActionReminderRecord][]>(() => getHistoryRecords());
  const [metrics, setMetrics] = useState(() => getActionMetrics());

  const refresh = useCallback(() => {
    setRecords(getHistoryRecords());
    setMetrics(getActionMetrics());
  }, []);

  useEffect(() => {
    window.addEventListener(ACTION_REMINDER_EVENT, refresh);
    return () => window.removeEventListener(ACTION_REMINDER_EVENT, refresh);
  }, [refresh]);

  if (records.length === 0) {
    return (
      <div className="px-1 py-2 text-[11px] text-slate-600">No actions tracked yet.</div>
    );
  }

  const rateColor = metrics.successRate >= 70
    ? 'text-emerald-400'
    : metrics.successRate >= 40
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="space-y-1.5">
      {/* Metrics row */}
      <div className="flex items-center gap-3 px-1 pb-0.5">
        <span className="text-[11px] text-slate-500">
          Last 7: <span className={`font-black ${rateColor}`}>{metrics.successRate}%</span>
        </span>
        {metrics.streak > 0 && (
          <span className="text-[11px] text-slate-500">
            Streak: <span className="font-black text-purple-400">{metrics.streak}×</span>
          </span>
        )}
      </div>

      {/* Action list */}
      {records.slice(0, 8).map(([id, record]) => {
        const { label, color } = resolvedStatus(record);
        const timestamp = getActionResultTimestamp(record);
        return (
          <div key={id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            {record.decisionText && (
              <div className="mb-0.5 line-clamp-1 text-[10px] text-slate-600">{record.decisionText}</div>
            )}
            <div className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-300">
              Result: {record.action}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${color}`}>{label}</span>
              <span className="text-[10px] text-slate-600">{formatTimeAgo(timestamp)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
