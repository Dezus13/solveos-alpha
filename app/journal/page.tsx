import JournalClientWrapper from '@/components/JournalClientWrapper';

export const metadata = { title: 'Decision Journal — SolveOS' };

export default function JournalPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[#F8FAFF] font-sans">
      <JournalClientWrapper />
    </main>
  );
}
