"use client";

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { uiCopy, type UiCopy } from '@/lib/i18n';
import type { ProductSettings } from '@/lib/settings';
import type { ConversationTurn } from '@/lib/types';

interface DecisionConsoleProps {
  thread: ConversationTurn[];
  loading: boolean;
  streaming: boolean;
  onSubmit: (message: string) => void;
  copy: UiCopy;
  settings: ProductSettings;
}

function useStreamingText(text: string, active: boolean, speed = 18): string {
  const [displayed, setDisplayed] = useState(active ? '' : text);

  useEffect(() => {
    if (!active) {
      setDisplayed(text);
      return;
    }

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

function AssistantMessage({ turn, isLatest, streaming, copy }: {
  turn: ConversationTurn;
  isLatest: boolean;
  streaming: boolean;
  copy: UiCopy;
}) {
  const streamed = useStreamingText(turn.content, isLatest && streaming);

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
        <Sparkles className="h-3.5 w-3.5 text-purple-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="whitespace-pre-line rounded-2xl rounded-tl-md border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-100">
          {streamed}
          {isLatest && streaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-purple-300 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick, copy, showSuggestions }: { onPick: (prompt: string) => void; copy: UiCopy; showSuggestions: boolean }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">SolveOS</span>
      </div>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
        Describe your decision and get clear guidance.
      </p>
      {showSuggestions && (
        <div className="mt-8 flex w-full flex-wrap justify-center gap-2">
          {copy.suggestions.map((example, index) => (
            <button
              key={example}
              type="button"
              onClick={() => onPick(copy.suggestionPrompts[index])}
              className="rounded-full border border-white/8 bg-white/[0.025] px-4 py-2 text-sm text-slate-400 transition-colors hover:border-[rgba(var(--accent-rgb),0.28)] hover:bg-white/[0.05] hover:text-slate-100"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingMessage({ copy }: { copy: UiCopy }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
      <span>{copy.reasoning}</span>
    </div>
  );
}

function DecisionConsole({ thread, loading, streaming, onSubmit, copy, settings }: DecisionConsoleProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread.length, loading]);

  const submitText = useCallback((value: string) => {
    const text = value.trim();
    if (!text) {
      setError(copy.emptyPromptError);
      return;
    }

    setError(null);
    setInput('');
    onSubmit(text);
  }, [copy.emptyPromptError, onSubmit]);

  const handleSubmit = useCallback(() => {
    submitText(input);
  }, [input, submitText]);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-6 sm:px-6">
        {!thread.length && !loading ? (
          <EmptyState onPick={submitText} copy={copy} showSuggestions={settings.general.showSuggestions} />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {thread.map((turn, index) => (
              turn.role === 'user'
                ? <UserMessage key={turn.id} content={turn.content} />
                : <AssistantMessage key={turn.id} turn={turn} isLatest={index === thread.length - 1} streaming={streaming} copy={copy} />
            ))}
            {loading && <ThinkingMessage copy={copy} />}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-white/8 bg-[#090E1B]/94 px-4 py-5 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto max-w-4xl">
          {error && (
            <div className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-xs font-semibold text-rose-200">
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
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={copy.composerPlaceholder}
              rows={4}
              className={`max-h-56 w-full resize-none border-none bg-transparent px-5 py-5 text-[15px] leading-relaxed text-[#F8FAFF] placeholder-slate-600 outline-none ${settings.appearance.density === 'compact' ? 'min-h-20' : settings.appearance.density === 'calm' ? 'min-h-36' : 'min-h-28'}`}
            />
            <div className="flex items-center justify-end border-t border-white/[0.06] px-4 py-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || input.trim().length === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-[0_0_24px_rgba(var(--accent-rgb),0.22)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
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
