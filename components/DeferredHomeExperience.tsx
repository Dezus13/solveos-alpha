"use client";

import { memo, startTransition, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ExperienceSkeleton = memo(function ExperienceSkeleton() {
  return (
    <div className="relative z-10 flex h-screen w-full">
      <aside className="hidden w-72 border-r border-white/10 bg-[#080D1A]/80 p-4 md:block">
        <div className="h-10 rounded-xl bg-white/[0.04]" />
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-14 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-white/10 p-4">
          <div className="mx-auto h-8 max-w-3xl rounded-xl bg-white/[0.04]" />
        </div>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end px-4 pb-6">
          <div className="space-y-4">
            <div className="h-16 w-3/4 rounded-2xl bg-white/[0.035]" />
            <div className="ml-auto h-14 w-2/3 rounded-2xl bg-purple-500/[0.08]" />
          </div>
          <div className="mt-8 h-24 rounded-2xl border border-white/10 bg-[#0B1020]/80" />
        </div>
      </section>
    </div>
  );
});

const HomeExperience = dynamic(() => import('@/components/HomeExperience'), {
  ssr: false,
  loading: () => <ExperienceSkeleton />,
});

export default function DeferredHomeExperience() {
  const [ready, setReady] = useState(false);
  const loadExperience = useCallback(() => {
    startTransition(() => setReady(true));
  }, []);

  useEffect(() => {
    const idleId = 'requestIdleCallback' in window
      ? window.requestIdleCallback(loadExperience, { timeout: 500 })
      : globalThis.setTimeout(loadExperience, 250);

    return () => {
      if ('cancelIdleCallback' in window && typeof idleId === 'number') {
        window.cancelIdleCallback(idleId);
      } else {
        globalThis.clearTimeout(idleId);
      }
    };
  }, [loadExperience]);

  return ready ? <HomeExperience /> : <ExperienceSkeleton />;
}
