"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const JournalView = dynamic(() => import('./JournalView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
    </div>
  ),
});

export default function JournalClientWrapper() {
  return <JournalView />;
}
