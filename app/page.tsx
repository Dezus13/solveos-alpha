import DeferredHomeExperience from '@/components/DeferredHomeExperience';

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[#F8FAFF] selection:bg-purple-500/30 font-sans bg-terminal-notes overflow-hidden relative">
      <div className="absolute inset-0 neural-grid opacity-10 pointer-events-none" />
      <div className="absolute inset-0 neural-constellation opacity-15 pointer-events-none" />
      <DeferredHomeExperience />
    </main>
  );
}
