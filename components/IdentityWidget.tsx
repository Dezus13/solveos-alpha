"use client";

import { useEffect, useState } from 'react';
import { getProfile, getIdentityLabel, PROFILE_UPDATED_EVENT } from '@/lib/userProfile';

export default function IdentityWidget() {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const read = () => setScore(getProfile().userDecisionScore);
    read();
    window.addEventListener(PROFILE_UPDATED_EVENT, read);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, read);
  }, []);

  if (score === null) return null;

  const label = getIdentityLabel(score);
  const barColor =
    score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <div className="mt-auto pt-3 border-t border-white/[0.06]">
      <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
          Behavior Score
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black tabular-nums text-white">{score}</span>
          <span className="text-[11px] font-semibold text-slate-500">/100</span>
        </div>
        <div className="my-2 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="text-[11px] font-semibold text-slate-400">{label}</div>
      </div>
    </div>
  );
}
