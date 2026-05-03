"use client";

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookmarkCheck, BookmarkPlus, Check, Clipboard, Loader2, Send, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { detectSolveRequestIntent } from '@/lib/semantic-guards';
import type { UiCopy } from '@/lib/i18n';
import type { ProductSettings } from '@/lib/settings';
import type { ConversationTurn } from '@/lib/types';
import { getSavedDecisions, isDecisionSaved } from '@/lib/savedDecisions';
import { updateDecisionScoreOnActionCompletion, updateDecisionScoreOnActionSkip } from '@/lib/userProfile';
import {
  countFollowThrough,
  ensureActionReminder,
  formatCountdown,
  getActiveReminder,
  updateActionReminder,
  type ActionReminderRecord,
  type ActionReminderStore,
} from '@/lib/actionReminders';
import { generateIdentityLabel } from '@/lib/identityEngine';
import { delayPainLine, skipPainLine } from '@/lib/inactionPain';

interface DecisionConsoleProps {
  thread: ConversationTurn[];
  loading: boolean;
  onSubmit: (message: string, mode?: string) => void;
  onReset: () => void;
  copy: UiCopy;
  settings: ProductSettings;
  mode: string;
  onModeChange: (mode: string) => void;
  modesLoading?: Record<string, boolean>;
  loadedModes?: Set<string>;
  onSaveDecision?: (turnId: string) => void;
}

const modeOptions = ['Strategy', 'Risk', 'Scenarios', 'Red Team'];

function actionFromTurn(turn: ConversationTurn): string {
  const blueprint = turn.blueprint;
  if (!blueprint) return '';
  const forced = blueprint.forcedAction?.replace(/^Do this next:\s*/i, '').replace(/\s+/g, ' ').trim();
  const action = forced || blueprint.actionPlan?.today || blueprint.operatorNextSteps?.[0] || blueprint.actionPlan?.thisWeek || '';
  return action.replace(/\s+/g, ' ').trim();
}

function completionEmotion(streak: number): string {
  if (streak >= 10) return 'You are operating differently now';
  if (streak >= 5) return 'This is discipline';
  if (streak >= 2) return 'You are building momentum';
  return 'Good. You execute.';
}

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

function ExecutionPressure({ turn }: { turn: ConversationTurn }) {
  const action = actionFromTurn(turn);
  const [store, setStore] = useState<ActionReminderStore>(() => ensureActionReminder(turn.id, action));
  const [blocker, setBlocker] = useState(() => store[turn.id]?.blocker || '');
  const [painLine, setPainLine] = useState('');
  const record = store[turn.id];
  const status = record?.status || 'pending';
  const streak = countFollowThrough(store);
  const identity = generateIdentityLabel(store);
  const emotion = status === 'done'
    ? completionEmotion(streak)
    : status === 'blocked'
      ? 'You decided this was important. What changed?'
      : status === 'skipped'
        ? 'You are training yourself to ignore your own decisions'
        : '';

  const persist = useCallback((patch: Partial<ActionReminderRecord> & { action: string }) => {
    const next = updateActionReminder(turn.id, patch);
    setStore(next);
  }, [turn.id]);

  const markDone = useCallback(() => {
    if (!action) return;
    if (status !== 'done') updateDecisionScoreOnActionCompletion();
    persist({
      status: 'done',
      action,
      blocker: blocker.trim() || undefined,
      completedAt: new Date().toISOString(),
    });
    setPainLine('');
  }, [action, blocker, persist, status]);

  const markBlocked = useCallback(() => {
    if (!action) return;
    persist({
      status: 'blocked',
      action,
      blocker: blocker.trim() || undefined,
    });
    setPainLine(delayPainLine(streak));
  }, [action, blocker, persist, streak]);

  const updateBlocker = useCallback((value: string) => {
    setBlocker(value);
    if (status !== 'blocked' || !action) return;
    persist({
      status: 'blocked',
      action,
      blocker: value.trim() || undefined,
    });
  }, [action, persist, status]);

  if (!action) return null;

  return (
    <div className="mt-2 rounded-2xl border border-purple-500/20 bg-purple-500/[0.055] px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-purple-300">Do this within 24h</div>
          <div className="mt-1 text-[11px] font-semibold text-amber-200">{record?.dueAt ? formatCountdown(record.dueAt) : '24h left'}</div>
          <div className="mt-1 text-[11px] font-semibold text-slate-300">You followed through: {streak} times</div>
          <div className="mt-1 text-[11px] font-black text-white">Identity: {identity}</div>
          {painLine && <div className="mt-1 text-[11px] font-black text-rose-200">{painLine}</div>}
        </div>
        {status === 'done' ? (
          <div className="action-complete-pulse rounded-xl border border-emerald-500/25 bg-emerald-500/[0.1] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-200">
            {emotion}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Did you do this?</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={markDone}
                className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.1] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/[0.16]"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={markBlocked}
                className="rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/[0.14]"
              >
                Not yet
              </button>
            </div>
          </div>
        )}
      </div>
      {status === 'blocked' && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <div className="text-xs font-semibold text-slate-200">
            {emotion}
          </div>
          <input
            value={blocker}
            onChange={(event) => updateBlocker(event.target.value)}
            placeholder="Name the blocker..."
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-purple-400/35"
          />
        </div>
      )}
    </div>
  );
}

function AssistantMessage({ turn, isLatest, copy, onSaveDecision }: {
  turn: ConversationTurn;
  isLatest: boolean;
  copy: UiCopy;
  onSaveDecision?: (turnId: string) => void;
}) {
  const streamed = useStreamingText(turn.content, isLatest);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [saved, setSaved] = useState(() => isDecisionSaved(turn.id));

  const copySummary = useCallback(async () => {
    await navigator.clipboard?.writeText(turn.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, [turn.content]);

  const handleSave = useCallback(() => {
    onSaveDecision?.(turn.id);
    setSaved(true);
  }, [onSaveDecision, turn.id]);

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
        <div className="whitespace-pre-line rounded-2xl rounded-tl-md border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-100">
          {streamed}
          {isLatest && streamed !== turn.content && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-purple-300 align-middle" />
          )}
        </div>
        {turn.blueprint && (!isLatest || streamed === turn.content) && <ExecutionPressure turn={turn} />}
        <div className="mt-2 flex items-center gap-1.5 text-slate-500">
          <button
            type="button"
            onClick={() => void copySummary()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors hover:bg-white/[0.05] hover:text-slate-200"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
            {copied ? copy.copied : copy.copySummary}
          </button>
          <button
            type="button"
            onClick={() => setFeedback((current) => current === 'up' ? null : 'up')}
            className={`rounded-lg p-1.5 transition-colors hover:bg-white/[0.05] hover:text-slate-200 ${feedback === 'up' ? 'text-emerald-300' : ''}`}
            aria-label={copy.helpful}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFeedback((current) => current === 'down' ? null : 'down')}
            className={`rounded-lg p-1.5 transition-colors hover:bg-white/[0.05] hover:text-slate-200 ${feedback === 'down' ? 'text-rose-300' : ''}`}
            aria-label={copy.unhelpful}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
          {turn.blueprint && onSaveDecision && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors ${
                saved
                  ? 'text-purple-400 cursor-default'
                  : 'hover:bg-white/[0.05] hover:text-slate-200'
              }`}
            >
              {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              {saved ? 'Saved' : 'Save decision'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick, copy, showSuggestions }: { onPick: (prompt: string) => void; copy: UiCopy; showSuggestions: boolean }) {
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold text-slate-400">
        {copy.appName}
      </div>
      <h1 className="text-2xl font-medium tracking-tight text-[#F8FAFF] sm:text-3xl">
        {copy.onboardingTitle}
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
        {copy.onboardingSubtext}
      </p>
      {showSuggestions && <div className="mt-7 flex w-full flex-wrap justify-center gap-2">
        {copy.suggestions.map((example, index) => (
          <button
            key={example}
            type="button"
            onClick={() => onPick(copy.suggestionPrompts[index])}
            className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-sm text-slate-400 transition-colors hover:border-purple-400/25 hover:bg-white/[0.05] hover:text-slate-100"
          >
            {example}
          </button>
        ))}
      </div>}
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

function DecisionConsole({ thread, loading, onSubmit, copy, settings, mode, onModeChange, modesLoading, loadedModes, onSaveDecision }: DecisionConsoleProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [blockedReminder, setBlockedReminder] = useState<[string, ActionReminderRecord] | null>(null);
  const [skipMessage, setSkipMessage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const hasThread = thread.length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread.length, loading]);

  const submitText = useCallback((value: string) => {
    const text = value.trim();
    const intent = detectSolveRequestIntent(text);
    if (!text) {
      setError(copy.emptyPromptError);
      return;
    }
    if (intent === 'normal_decision' && text.length < 20) {
      setError(`${copy.shortPromptError} (${text.length}/20)`);
      return;
    }
    const active = getSavedDecisions().length > 0 ? getActiveReminder() : null;
    if (active) {
      setBlockedReminder(active);
      setSkipMessage(null);
      setError('Finish previous action first or explicitly skip it');
      return;
    }
    setError(null);
    setBlockedReminder(null);
    setInput('');
    onSubmit(text, mode);
  }, [copy.emptyPromptError, copy.shortPromptError, mode, onSubmit]);

  const skipBlockedReminder = useCallback(() => {
    if (!blockedReminder) return;
    const [id, reminder] = blockedReminder;
    updateActionReminder(id, {
      ...reminder,
      status: 'skipped',
      action: reminder.action,
      skippedAt: new Date().toISOString(),
    });
    updateDecisionScoreOnActionSkip();
    setBlockedReminder(null);
    setSkipMessage(`${skipPainLine()} · This decision will repeat again`);
    setError(null);
  }, [blockedReminder]);

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
          <EmptyState onPick={submitText} copy={copy} showSuggestions={settings.general.showSuggestions} />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {thread.map((turn, index) => (
              turn.role === 'user'
                ? <UserMessage key={turn.id} content={turn.content} />
                : <AssistantMessage key={turn.id} turn={turn} isLatest={index === thread.length - 1} copy={copy} onSaveDecision={onSaveDecision} />
            ))}
            {loading && <ThinkingMessage copy={copy} />}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-white/8 bg-[#090E1B]/94 px-4 py-5 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto max-w-4xl">
          {(error || skipMessage) && (
            <div className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-xs font-semibold text-rose-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {error || skipMessage}
              </div>
              {blockedReminder && (
                <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="line-clamp-2 text-slate-300">{blockedReminder[1].action}</span>
                  <button
                    type="button"
                    onClick={skipBlockedReminder}
                    className="rounded-lg border border-rose-400/25 bg-rose-400/[0.1] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-rose-200 hover:bg-rose-400/[0.16]"
                  >
                    Skip (I choose to ignore this)
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="rounded-[1.35rem] border border-white/10 bg-[#0B1020]/96 shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
            <textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (error) setError(null);
                if (skipMessage) setSkipMessage(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={copy.composerPlaceholder}
              rows={4}
              className={`max-h-56 w-full resize-none border-none bg-transparent px-5 py-5 text-[15px] leading-relaxed text-[#F8FAFF] placeholder-slate-600 outline-none ${settings.appearance.density === 'compact' ? 'min-h-20' : settings.appearance.density === 'calm' ? 'min-h-36' : 'min-h-28'}`}
            />
            <div className="flex flex-col gap-3 border-t border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-full rounded-xl border border-white/8 bg-white/[0.025] p-1 sm:w-auto">
                {modeOptions.map((option) => {
                  const isActive = mode === option;
                  const isLoading = modesLoading?.[option] === true;
                  const isLoaded = !isActive && loadedModes?.has(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onModeChange(option)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors sm:flex-none ${
                        isActive ? 'bg-white/[0.09] text-white' : 'text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      {isLoading
                        ? <Loader2 className="h-2.5 w-2.5 animate-spin flex-shrink-0" />
                        : isLoaded
                          ? <span className="w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />
                          : null}
                      {option}
                    </button>
                  );
                })}
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
