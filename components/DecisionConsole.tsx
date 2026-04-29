"use client";

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Send, Sparkles } from 'lucide-react';
import { detectSolveRequestIntent } from '@/lib/semantic-guards';
import type { ConversationTurn } from '@/lib/types';

interface DecisionConsoleProps {
  thread: ConversationTurn[];
  loading: boolean;
  onSubmit: (message: string, mode?: string) => void;
  onReset: () => void;
}

const modeOptions = ['Strategy', 'Risk', 'Scenarios', 'Red Team'];

function useStreamingText(text: string, active: boolean, speed = 18): string {
  const [displayed, setDisplayed] = useState(active ? '' : text);

  useEffect(() => {
    if (!active) return;
    const words = text.split(' ');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setDisplayed(words.slice(0, i).join(' '));
      if (i >= words.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [active, speed, text]);

  return active ? displayed : text;
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[82%] rounded-2xl rounded-br-md border border-purple-400/15 bg-purple-500/[0.09] px-4 py-3 text-sm font-medium leading-relaxed text-[#F8FAFF]">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({ turn, isLatest }: { turn: ConversationTurn; isLatest: boolean }) {
  const streamed = useStreamingText(turn.content, isLatest);

  if (turn.isError) {
    return (
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-4 w-4 flex-shrink-0 text-rose-400" />
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm leading-relaxed text-rose-200">
          {turn.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
        <Sparkles className="h-3.5 w-3.5 text-purple-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-100">
          {streamed}
          {isLatest && streamed !== turn.content && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-purple-300 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  const examples = [
    'Launch beta?',
    'Find hidden risks',
    '30-day scorecard',
  ];
  const prompts = [
    'Should we launch to 300 beta users next month?',
    'What risks could break our current growth plan?',
    'Give me a 30-day review scorecard with kill criteria.',
  ];

  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold text-slate-400">
        SolveOS
      </div>
      <h1 className="text-2xl font-medium tracking-tight text-[#F8FAFF] sm:text-3xl">
        What should we decide?
      </h1>
      <div className="mt-7 flex w-full flex-wrap justify-center gap-2">
        {examples.map((example, index) => (
          <button
            key={example}
            type="button"
            onClick={() => onPick(prompts[index])}
            className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-sm text-slate-400 transition-colors hover:border-purple-400/25 hover:bg-white/[0.05] hover:text-slate-100"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingMessage() {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
      <span>SolveOS is reasoning...</span>
    </div>
  );
}

function DecisionConsole({ thread, loading, onSubmit }: DecisionConsoleProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('Strategy');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const hasThread = thread.length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread.length, loading]);

  const submitText = useCallback((value: string) => {
    const text = value.trim();
    const intent = detectSolveRequestIntent(text);
    if (!text) {
      setError('Type a decision or direct request first.');
      return;
    }
    if (intent === 'normal_decision' && text.length < 20) {
      setError(`Decision details too brief (${text.length}/20). Add stakes, constraints, or timeline.`);
      return;
    }
    setError(null);
    setInput('');
    onSubmit(text, mode);
  }, [mode, onSubmit]);

  const handleSubmit = useCallback(() => {
    submitText(input);
  }, [input, submitText]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-6 sm:px-6">
        {!hasThread && !loading ? (
          <EmptyState onPick={submitText} />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {thread.map((turn, index) => (
              turn.role === 'user'
                ? <UserMessage key={turn.id} content={turn.content} />
                : <AssistantMessage key={turn.id} turn={turn} isLatest={index === thread.length - 1} />
            ))}
            {loading && <ThinkingMessage />}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-white/8 bg-[#090E1B]/94 px-4 py-5 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto max-w-4xl">
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-xs font-semibold text-rose-200">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="rounded-[1.35rem] border border-white/10 bg-[#0B1020]/96 shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
            <textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask SolveOS..."
              rows={4}
              className="max-h-56 min-h-28 w-full resize-none border-none bg-transparent px-5 py-5 text-[15px] leading-relaxed text-[#F8FAFF] placeholder-slate-600 outline-none"
            />
            <div className="flex flex-col gap-3 border-t border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-full rounded-xl border border-white/8 bg-white/[0.025] p-1 sm:w-auto">
                {modeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option)}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors sm:flex-none ${
                      mode === option ? 'bg-white/[0.09] text-white' : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || input.trim().length === 0}
                className="inline-flex h-10 w-10 items-center justify-center self-end rounded-xl bg-[#F8FAFF] text-[#0B1020] transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
                aria-label="Send prompt"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(DecisionConsole);
