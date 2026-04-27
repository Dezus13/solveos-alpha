"use client";

import { memo, startTransition, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ExperienceSkeleton = memo(function ExperienceSkeleton() {
  return (
  <div className="w-full max-w-5xl flex flex-col items-center relative z-10">
    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 mb-16 bg-[#0B1020]/70 border border-white/10 px-8 sm:px-12 py-3 rounded-full backdrop-blur-3xl">
      {['Strategist', 'Skeptic', 'Operator'].map((agent) => (
        <div key={agent} className="flex items-center space-x-3">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50" />
          <span className="text-[10px] font-black uppercase text-slate-400">{agent}</span>
        </div>
      ))}
    </div>

    <div className="w-full rounded-[32px] border border-white/10 bg-[#0B1020]/70 p-6 sm:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.3)]">
      <div className="flex gap-8 border-b border-white/5">
        {['Strategy', 'Risk', 'Scenarios', 'Red Team'].map((tab) => (
          <div key={tab} className="pb-4 text-[11px] font-black uppercase text-slate-500">{tab}</div>
        ))}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-xl border border-white/5 bg-white/[0.015]" />
        ))}
      </div>
      <div className="mt-10 h-32 rounded-2xl border border-white/5 bg-white/[0.015]" />
      <div className="mt-10 h-20 rounded-2xl bg-[#0A0F1F]" />
    </div>
  </div>
  );
});

const HomeExperience = dynamic(() => import('@/components/HomeExperience'), {
  ssr: false,
  loading: () => <ExperienceSkeleton />
});

export default function DeferredHomeExperience() {
  const [ready, setReady] = useState(false);
  const loadExperience = useCallback(() => {
    startTransition(() => setReady(true));
  }, []);

  useEffect(() => {
    const warmExperience = () => {
      void import('@/components/HomeExperience');
      loadExperience();
    };

    const idleId = 'requestIdleCallback' in window
      ? window.requestIdleCallback(warmExperience, { timeout: 1800 })
      : globalThis.setTimeout(warmExperience, 1200);

    const onScroll = () => {
      if (window.scrollY > 80) loadExperience();
    };

    window.addEventListener('scroll', onScroll, { passive: true, once: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if ('cancelIdleCallback' in window && typeof idleId === 'number') {
        window.cancelIdleCallback(idleId);
      } else {
        globalThis.clearTimeout(idleId);
      }
    };
  }, [loadExperience]);

  return (
    <div onPointerEnter={loadExperience} onPointerDown={loadExperience} onFocusCapture={loadExperience}>
      {ready ? <HomeExperience /> : <ExperienceSkeleton />}
    </div>
  );
}
