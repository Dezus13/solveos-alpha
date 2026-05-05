"use client";

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookmarkCheck, BookmarkPlus, Check, Clipboard, Loader2, Send, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { uiCopy, type UiCopy } from '@/lib/i18n';
import type { ProductSettings } from '@/lib/settings';
import type { ConversationTurn } from '@/lib/types';
import { isDecisionSaved } from '@/lib/savedDecisions';
import { updateDecisionScoreOnActionCompletion, updateDecisionScoreOnActionSkip, getProfile, getIdentityLabel, PROFILE_UPDATED_EVENT } from '@/lib/userProfile';
import {
  ACTION_REMINDER_EVENT,
  countFollowThrough,
  ensureActionReminder,
  formatCountdown,
  generateSmallerAction,
  getActiveReminder,
  getPressureState,
  restartWithSmallerAction,
  updateActionReminder,
  type ActionReminderRecord,
  type ActionReminderStore,
  type BlockerCategory,
} from '@/lib/actionReminders';
import { skipPainLine } from '@/lib/inactionPain';


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

function completionEmotion(streak: number, copy: UiCopy): string {
  if (streak >= 10) return copy.completionOperating;
  if (streak >= 5) return copy.completionDiscipline;
  if (streak >= 2) return copy.completionMomentum;
  return copy.completionDefault;
}

function resolveCopy(blueprintLanguage: string | undefined, fallback: UiCopy): UiCopy {
  if (!blueprintLanguage) return fallback;
  const key = blueprintLanguage as keyof typeof uiCopy;
  return uiCopy[key] ?? fallback;
}

function pressureMessageFromCopy(state: 'normal' | 'pressure_2h' | 'pressure_12h' | 'overdue', copy: UiCopy): string {
  if (state === 'pressure_2h') return copy.pressureStillNotDone;
  if (state === 'pressure_12h') return copy.pressureAvoiding;
  if (state === 'overdue') return copy.pressureMissedDeadline;
  return copy.pressureLabel;
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

function categoryLabels(copy: UiCopy): Record<BlockerCategory, string> {
  return {
    fear: copy.executionBlockerFear,
    unclear: copy.executionBlockerUnclear,
    lazy: copy.executionBlockerNoEnergy,
    external: copy.executionBlockerExternal,
  };
}

function ExecutionPressure({ turn, copy }: { turn: ConversationTurn; copy: UiCopy }) {
  const action = actionFromTurn(turn);
  const [store, setStore] = useState<ActionReminderStore>(() => ensureActionReminder(turn.id, action));
  const [category, setCategory] = useState<BlockerCategory | null>(() => store[turn.id]?.blockerCategory || null);
  const [showNotYetReasons, setShowNotYetReasons] = useState(() => store[turn.id]?.status === 'blocked');
  const [score, setScore] = useState(() => getProfile().userDecisionScore);
  const record = store[turn.id];
  const status = record?.status || 'not yet';
  const streak = countFollowThrough(store);
  const pressureState = record ? getPressureState(record) : 'normal' as const;

  useEffect(() => {
    const refresh = () => setScore(getProfile().userDecisionScore);
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
  }, []);
  const pressureLabel = pressureMessageFromCopy(pressureState, copy);

  const persist = useCallback((patch: Partial<ActionReminderRecord> & { action: string }) => {
    const next = updateActionReminder(turn.id, patch);
    setStore(next);
  }, [turn.id]);

  const markDone = useCallback(() => {
    if (!action) return;
    if (status !== 'done') updateDecisionScoreOnActionCompletion();
    persist({ status: 'done', action, completedAt: new Date().toISOString() });
    setCategory(null);
    setShowNotYetReasons(false);
  }, [action, persist, status]);

  const markBlocked = useCallback(() => {
    if (!action) return;
    setShowNotYetReasons(true);
    persist({ status: 'not yet', action });
  }, [action, persist]);

  const handlePickCategory = useCallback((cat: BlockerCategory) => {
    setCategory(cat);
    setShowNotYetReasons(true);
    persist({ status: 'not yet', action, blockerCategory: cat });
  }, [action, persist]);

  const handleRestartSmaller = useCallback(() => {
    if (!category) return;
    const next = restartWithSmallerAction(turn.id, action, category);
    setStore(next);
    setCategory(null);
    setShowNotYetReasons(false);
  }, [action, category, turn.id]);

  if (!action) return null;

  const smallerPreview = category ? generateSmallerAction(action, category) : null;
  const isOverdue = pressureState === 'overdue';
  const labelColor = isOverdue ? 'text-rose-300' : pressureState === 'pressure_12h' ? 'text-orange-300' : 'text-purple-300';

  return (
    <div className="mt-2 rounded-2xl border border-purple-500/20 bg-purple-500/[0.055] px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>{pressureLabel}</div>
          <div className="mt-1 text-[11px] font-semibold text-amber-200">
            {record?.dueAt ? formatCountdown(record.dueAt) : '24h'}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-300">Score: <span className={score >= 70 ? 'text-emerald-300' : score >= 40 ? 'text-amber-300' : 'text-rose-300'}>{score}</span>/100</div>
          <div className="mt-1 text-[11px] font-semibold text-slate-400">{getIdentityLabel(score)}</div>
        </div>
        {status === 'done' ? (
          <div className="action-complete-pulse rounded-xl border border-emerald-500/25 bg-emerald-500/[0.1] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-200">
            {completionEmotion(streak, copy)}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">{copy.pressureDidYou}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={markDone}
                className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.1] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/[0.16]"
              >
                {copy.pressureYes}
              </button>
              {!showNotYetReasons && status !== 'blocked' && (
                <button
                  type="button"
                  onClick={markBlocked}
                  className="rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2 text-[11px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/[0.14]"
                >
                  {copy.pressureNotYet}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Why not done? — category selection */}
      {(showNotYetReasons || status === 'blocked') && !category && status !== 'done' && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{copy.pressureWhyNotDone}</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(categoryLabels(copy)) as BlockerCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handlePickCategory(cat)}
                className="rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/[0.13]"
              >
                {categoryLabels(copy)[cat]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Smaller action after category picked */}
      {(showNotYetReasons || status === 'blocked') && smallerPreview && status !== 'done' && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{copy.pressureSmallerStep}</div>
          <div className="text-sm font-semibold text-white">{smallerPreview}</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleRestartSmaller}
              className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.1] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-200 hover:bg-emerald-500/[0.16]"
            >
              {copy.pressureIllDoThis}
            </button>
            <button
              type="button"
              onClick={() => setCategory(null)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-200"
            >
              {copy.pressureBack}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionGate({ turn, copy }: { turn: ConversationTurn; copy: UiCopy }) {
  const [unlocked, setUnlocked] = useState(false);
  const blueprint = turn.blueprint;
  if (!blueprint) return null;

  const hiddenPain = blueprint.hiddenPain;
  const whatCouldBreak = blueprint.skepticView?.whatCouldBreak;

  if (!hiddenPain && !whatCouldBreak) return <ExecutionPressure turn={turn} copy={copy} />;

  if (!unlocked) {
    return (
      <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] px-4 py-4">
        <p className="text-sm font-semibold text-slate-200">
          {copy.gateHeadline}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
          {copy.gateSubtext}
        </p>
        <button
          type="button"
          onClick={() => setUnlocked(true)}
          className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.1] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-amber-200 transition-colors hover:bg-amber-400/[0.18]"
        >
          {copy.gateButton}
        </button>
        <p className="mt-2 text-[11px] text-slate-500">
          {copy.gateHelper}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {(hiddenPain || whatCouldBreak) && (
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3 space-y-3">
          {hiddenPain && (
            <div>
              <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
                {copy.gateWhatAvoiding}
              </div>
              <div className="text-sm leading-snug text-slate-200">{hiddenPain}</div>
            </div>
          )}
          {whatCouldBreak && (
            <div>
              <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-rose-400">
                {copy.gateWhatCouldBreak}
              </div>
              <div className="text-sm leading-snug text-slate-200">{whatCouldBreak}</div>
            </div>
          )}
        </div>
      )}
      <ExecutionPressure turn={turn} copy={copy} />
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
  const turnCopy = resolveCopy(turn.blueprint?.language, copy);
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
        {turn.blueprint && (!isLatest || streamed === turn.content) && <DecisionGate turn={turn} copy={turnCopy} />}
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
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">SolveOS</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {copy.onboardingTitle}
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
        {copy.onboardingSubtext}
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


function OpenCommitmentView({
  reminder,
  pressureState,
  nowTs,
  done,
  onDone,
  copy,
}: {
  reminder: ActionReminderRecord | null;
  pressureState: 'normal' | 'pressure_2h' | 'pressure_12h' | 'overdue';
  nowTs: number;
  done: boolean;
  onDone: () => void;
  copy: UiCopy;
}) {
  if (done) {
    return (
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="text-[11px] font-black uppercase tracking-widest text-emerald-300">{copy.pressureDone}</div>
          <div className="mt-3 text-xs text-slate-500">{copy.pressureNext}</div>
        </div>
      </div>
    );
  }

  if (!reminder) return null;

  const isOverdue = pressureState === 'overdue';
  const headerMsg = pressureState === 'normal'
    ? copy.pressureOpenCommitment
    : pressureMessageFromCopy(pressureState, copy);
  const msgColor =
    isOverdue ? 'text-rose-300'
    : pressureState === 'pressure_12h' ? 'text-orange-300'
    : pressureState === 'pressure_2h' ? 'text-amber-300'
    : 'text-slate-500';

  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full space-y-5">
        <div className="space-y-2">
          <div className={`text-[10px] font-black uppercase tracking-widest ${msgColor}`}>
            {headerMsg}
          </div>
          <div className="text-base font-semibold leading-snug text-slate-200">
            {reminder.action}
          </div>
          {pressureState !== 'normal' && (
            <div className="text-[11px] font-semibold text-slate-600">
              {formatCountdown(reminder.dueAt, nowTs)}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-400/[0.14]"
        >
          {copy.pressureDone}
        </button>
      </div>
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

  const [activeCommitment, setActiveCommitment] = useState<[string, ActionReminderRecord] | null>(null);
  const [commitmentNow, setCommitmentNow] = useState(0);
  const [commitmentDone, setCommitmentDone] = useState(false);

  useEffect(() => {
    const read = () => {
      setActiveCommitment(getActiveReminder());
      setCommitmentNow(Date.now());
    };
    read();
    window.addEventListener(ACTION_REMINDER_EVENT, read);
    const id = window.setInterval(read, 60_000);
    return () => {
      window.removeEventListener(ACTION_REMINDER_EVENT, read);
      window.clearInterval(id);
    };
  }, []);

  const commitmentPressureState = activeCommitment
    ? getPressureState(activeCommitment[1], commitmentNow)
    : 'normal' as const;

  const handleCommitmentDone = useCallback(() => {
    if (!activeCommitment) return;
    updateDecisionScoreOnActionCompletion();
    updateActionReminder(activeCommitment[0], {
      ...activeCommitment[1],
      status: 'done',
      action: activeCommitment[1].action,
      completedAt: new Date().toISOString(),
    });
    setCommitmentDone(true);
    window.setTimeout(() => {
      setCommitmentDone(false);
    }, 2000);
  }, [activeCommitment]);

  const submitText = useCallback((value: string) => {
    const text = value.trim();
    if (!text) {
      setError(copy.emptyPromptError);
      return;
    }
    const active = getActiveReminder();
    if (active) {
      setBlockedReminder(active);
      setSkipMessage(null);
      const pState = getPressureState(active[1]);
      setError(`${pressureMessageFromCopy(pState, copy)} — ${copy.pressureFinishFirst}`);
      return;
    }
    setError(null);
    setBlockedReminder(null);
    setInput('');
    onSubmit(text, mode);
  }, [copy, mode, onSubmit]);

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

  const isOpenCommitment = !hasThread && (!!activeCommitment || commitmentDone);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-6 sm:px-6">
        {isOpenCommitment ? (
          <OpenCommitmentView
            reminder={activeCommitment?.[1] ?? null}
            pressureState={commitmentPressureState}
            nowTs={commitmentNow}
            done={commitmentDone}
            onDone={handleCommitmentDone}
            copy={copy}
          />
        ) : !hasThread && !loading ? (
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

      {!isOpenCommitment && <div className="sticky bottom-0 border-t border-white/8 bg-[#090E1B]/94 px-4 py-5 backdrop-blur-2xl sm:px-6">
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
                        isActive ? 'border border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.14)] text-white' : 'text-slate-500 hover:text-slate-200'
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
                className="inline-flex h-10 w-10 items-center justify-center self-end rounded-xl bg-[var(--accent)] text-white shadow-[0_0_24px_rgba(var(--accent-rgb),0.22)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
                aria-label="Send prompt"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>}
    </section>
  );
}

export default memo(DecisionConsole);
