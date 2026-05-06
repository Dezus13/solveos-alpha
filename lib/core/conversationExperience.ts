import type { DecisionMemoryEntry } from '../types';
import type { UserDecisionProfile } from '../userProfile';
import type { EnergyAssessment, EnergyState } from '../energyStateIntelligence';
import type { EmotionalState } from './trajectoryEngine';

// ─── Conversation Mode ────────────────────────────────────────────────────────

export type ConversationMode =
  | 'advisor'             // balanced, strategic, outcome-focused
  | 'strategist'          // long-horizon, analytical, challenges assumptions
  | 'stabilizer'          // emotional grounding, reduces pressure, widens perspective
  | 'execution_coach'     // accountability, action-bias, tracks follow-through
  | 'reflective_analyst'  // introspective, pattern-finding, slow and considered
  | 'momentum_builder';   // energy amplification, forward-motion, short wins

export type ConversationModeRationale =
  | 'energy:overload → stabilize'
  | 'energy:execution → coach'
  | 'energy:hesitation → advise'
  | 'energy:impulsive → strategize'
  | 'energy:recovery → stabilize'
  | 'energy:exploration → reflect'
  | 'trajectory:declining → build_momentum'
  | 'trajectory:ascending → coach'
  | 'session:new_user → advisor_default'
  | 'session:return_long_gap → stabilizer'
  | 'trust:fragile → stabilize'
  | 'trust:building → advisor'
  | 'trust:strong → strategist'
  | 'cognitive_load:high → stabilize'
  | 'override:user_intent';

// ─── Response Depth ───────────────────────────────────────────────────────────

export type ResponseDepthLevel =
  | 'short'           // 1–3 sentences, direct answer only
  | 'tactical'        // 1 paragraph with immediate action
  | 'analytical'      // structured analysis with supporting reasoning
  | 'deep_reasoning'; // full multi-angle exploration, long-horizon thinking

export type DepthTransitionSignal =
  | 'user_compressed'        // user is asking for shorter answers
  | 'overload_detected'      // session overload signal
  | 'high_stakes_escalation' // risk level jumped — go deeper
  | 'explicit_deep_request'  // user explicitly asked for depth
  | 'trust_expanded'         // trust level jumped → depth can increase
  | 'fatigue_signal'         // cognitive fatigue → compress
  | 'clarity_gap'            // user confused → decompress slowly
  | 'momentum_window';       // short wins window → keep it tactical

// ─── Emotional Tone Profile ───────────────────────────────────────────────────

export interface EmotionalToneProfile {
  warmth: number;             // 0–1 (0 = clinical, 1 = empathetic)
  directness: number;         // 0–1 (0 = exploratory, 1 = assertive)
  pressure: number;           // 0–1 (0 = none, 1 = firm accountability)
  validationRatio: number;    // 0–1 (0 = pure challenge, 1 = pure validation)
  energyLevel: 'low' | 'neutral' | 'elevated';
  allowHumor: boolean;
  allowSilence: boolean;      // OK to not over-explain; let space breathe
}

// ─── Conversational Pacing ────────────────────────────────────────────────────

export type PacingSignal =
  | 'slow_down'     // reduce complexity, one thing at a time
  | 'maintain'      // current pace is working
  | 'accelerate'    // user is ready for more, can handle more
  | 'pause';        // explicitly create breathing room before next move

export interface ConversationRhythm {
  pacing: PacingSignal;
  idealResponseLength: 'very_short' | 'short' | 'medium' | 'long';
  turnsBeforeActionPush: number;  // how many turns before pushing for commitment
  questionCadence: 'none' | 'one_per_response' | 'close_with_question';
  summaryFrequency: 'none' | 'end_of_exchange' | 'every_3_turns';
}

// ─── Trust Layer ──────────────────────────────────────────────────────────────

export type TrustLevel = 'building' | 'established' | 'strong' | 'fragile';

export interface TrustProfile {
  level: TrustLevel;
  score: number;              // 0–100 composite
  sessionCount: number;       // number of return visits (from decision history)
  lastSessionGap: number;     // days since last session
  consistencySignal: boolean; // user consistently returns
  truthSignal: boolean;       // system has been correct before (outcome accuracy)
  recoveryMode: boolean;      // trust was damaged (bad advice / ignored advice)
  trustMessage?: string;      // short message to embed in response framing
}

// ─── Cognitive Load ───────────────────────────────────────────────────────────

export type CognitiveLoadLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CognitiveLoadAssessment {
  level: CognitiveLoadLevel;
  signals: string[];
  turnCount: number;
  unresolved: number;         // unresolved threads in current session
  topicShifts: number;        // how many times the topic shifted mid-session
  overloadRisk: boolean;
  preventionActive: boolean;  // system has already applied load reduction
}

// ─── Attachment & Engagement ──────────────────────────────────────────────────

export interface AttachmentSignals {
  returnFrequency: 'first_time' | 'occasional' | 'regular' | 'habitual';
  engagementDepth: 'shallow' | 'moderate' | 'deep';
  openLoopCount: number;      // unresolved past decisions user hasn't returned to
  emotionalInvestment: boolean; // user has shared emotionally charged content
  trustIncidents: number;     // times user pushed back on a recommendation
}

// ─── Onboarding Intelligence ──────────────────────────────────────────────────

export type OnboardingPhase =
  | 'first_message'   // absolutely first interaction ever
  | 'calibrating'     // 2–5 messages, system is learning the user
  | 'oriented'        // user understands the system, 5–15 messages
  | 'established';    // user is fully acclimated, >15 messages

export interface OnboardingState {
  phase: OnboardingPhase;
  isFirstSession: boolean;
  messageCount: number;
  calibrationComplete: boolean;
  introductionNeeded: boolean;  // should system briefly explain what it's doing?
  framingHint: string;          // what to say / how to open this session
  expectationSignal: string;    // what the user seems to expect
}

// ─── Return User Continuity ───────────────────────────────────────────────────

export interface ReturnUserContext {
  isReturn: boolean;
  daysSinceLast: number;
  lastProblemSummary?: string;   // short summary of last main topic
  lastMoodSignal?: EmotionalState;
  openActionsCount: number;      // pending actions from last session
  continuityMessage?: string;    // optional bridge message ("Last time you were...")
  shouldAcknowledgeReturn: boolean;
  warmReconnect: boolean;        // long gap → acknowledge before diving in
}

// ─── Personality Stabilization Safeguards ────────────────────────────────────

export type PersonalityDriftRisk =
  | 'none'
  | 'sycophancy'          // excessive validation, agreeing with everything
  | 'over_mirroring'      // absorbing user's emotional state too deeply
  | 'pressure_creep'      // gradually applying too much pressure
  | 'guru_drift'          // taking on an elevated, wise-mentor affect
  | 'clinical_drift'      // becoming cold and robotic
  | 'mode_bleed'          // two modes bleeding into each other confusingly
  | 'identity_loss';      // no clear voice remaining

export interface PersonalityGuardrail {
  driftRisk: PersonalityDriftRisk;
  severity: 'low' | 'medium' | 'high';
  detectedIn: string;
  correction: string;
  suppressions: string[];
}

export interface PersonalityStabilizationResult {
  stable: boolean;
  guardrails: PersonalityGuardrail[];
  appliedCorrections: string[];
  overriddenMode?: ConversationMode;  // if mode was corrected
  safeguardMessage?: string;           // log-level note
}

// ─── Session Emotional Record (for analytics) ─────────────────────────────────

export interface SessionEmotionalRecord {
  sessionId: string;
  date: string;
  dominantMode: ConversationMode;
  dominantEmotionalState: EmotionalState;
  trustLevelAtEnd: TrustLevel;
  cognitiveLoad: CognitiveLoadLevel;
  depthReached: ResponseDepthLevel;
  stabilizationTriggered: boolean;
  overwhelmPrevented: boolean;
  onboardingPhase: OnboardingPhase;
}

// ─── Dashboard Emotional Analytics ───────────────────────────────────────────

export interface EmotionalAnalyticsDashboard {
  sessionCount: number;
  returnFrequency: AttachmentSignals['returnFrequency'];
  dominantModeHistory: ConversationMode[];
  emotionalStateHistory: EmotionalState[];
  trustProgression: TrustLevel[];
  avgCognitiveLoad: CognitiveLoadLevel;
  overwhelmIncidents: number;
  stabilizationEvents: number;
  attachmentScore: number;             // 0–100 composite engagement score
  onboardingComplete: boolean;
  mostUsedDepthLevel: ResponseDepthLevel;
  topInsights: string[];               // human-readable analytics summaries
}

// ─── Main Result ──────────────────────────────────────────────────────────────

export interface ConversationExperienceResult {
  mode: ConversationMode;
  modeRationale: ConversationModeRationale;
  toneProfile: EmotionalToneProfile;
  responseDepth: ResponseDepthLevel;
  rhythm: ConversationRhythm;
  trust: TrustProfile;
  cognitiveLoad: CognitiveLoadAssessment;
  onboarding: OnboardingState;
  returnContext: ReturnUserContext;
  attachment: AttachmentSignals;
  personalityStabilization: PersonalityStabilizationResult;
  depthTransitionSignals: DepthTransitionSignal[];
  experienceExplanation: ExperienceExplanation;
}

export interface ExperienceExplanation {
  summary: string;
  modeJustification: string;
  toneJustification: string;
  depthJustification: string;
  guardrailsApplied: string[];
  adaptationLevel: 'minimal' | 'moderate' | 'significant';
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface ConversationExperienceInput {
  conversationHistory: Array<{ role: string; content: string }>;
  decisions: DecisionMemoryEntry[];
  profile: UserDecisionProfile;
  energy: EnergyAssessment;
  currentProblem: string;
  sessionId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(v)));
}

function clampFloat(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function userTurns(history: Array<{ role: string; content: string }>): string[] {
  return history.filter((t) => t.role === 'user').map((t) => t.content);
}

function combinedText(history: Array<{ role: string; content: string }>, problem: string): string {
  return [...userTurns(history), problem].join(' ').toLowerCase();
}

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / MS_PER_DAY;
}

// ─── Onboarding Phase Detection ───────────────────────────────────────────────

function detectOnboardingPhase(
  decisions: DecisionMemoryEntry[],
  history: Array<{ role: string; content: string }>,
): OnboardingState {
  const totalDecisions = decisions.length;
  const totalMessages = history.length;

  const isFirstSession = totalDecisions === 0 && totalMessages <= 2;
  const messageCount = history.filter((t) => t.role === 'user').length;

  const phase: OnboardingPhase =
    totalDecisions === 0 && messageCount <= 1 ? 'first_message'
    : totalDecisions < 3 && messageCount < 5 ? 'calibrating'
    : totalDecisions < 10 ? 'oriented'
    : 'established';

  const calibrationComplete = phase === 'oriented' || phase === 'established';

  const introductionNeeded = phase === 'first_message';

  const framingHint =
    phase === 'first_message'
      ? 'Open with a grounding question to understand the scope of the problem before going deep.'
      : phase === 'calibrating'
      ? 'Keep responses shorter. Establish what kind of help the user is looking for.'
      : phase === 'oriented'
      ? 'User understands the system. Move at full depth when stakes warrant it.'
      : 'No special framing needed — user is fully oriented.';

  const firstUserText = history.find((t) => t.role === 'user')?.content ?? '';
  const expectationSignal =
    /\b(quick|fast|short|just tell me|simple|bullet|tl;?dr)\b/i.test(firstUserText)
      ? 'User wants brevity and speed'
      : /\b(deep|detail|explain|thorough|full analysis|everything)\b/i.test(firstUserText)
      ? 'User wants thorough analysis'
      : /\b(help|i don\'?t know|lost|confused|no idea)\b/i.test(firstUserText)
      ? 'User needs orientation and guidance'
      : 'User has a specific problem to work through';

  return {
    phase,
    isFirstSession,
    messageCount,
    calibrationComplete,
    introductionNeeded,
    framingHint,
    expectationSignal,
  };
}

// ─── Return User Context ──────────────────────────────────────────────────────

function buildReturnUserContext(decisions: DecisionMemoryEntry[]): ReturnUserContext {
  if (decisions.length === 0) {
    return {
      isReturn: false,
      daysSinceLast: 0,
      openActionsCount: 0,
      shouldAcknowledgeReturn: false,
      warmReconnect: false,
    };
  }

  const sorted = [...decisions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const last = sorted[0];
  const daysSinceLast = daysSince(last.timestamp);
  const isReturn = daysSinceLast > 0.1; // any gap > ~2.5 hours = return session

  const openActionsCount = decisions.filter((d) => !d.outcome).length;

  const shouldAcknowledgeReturn = daysSinceLast >= 3;
  const warmReconnect = daysSinceLast >= 14;

  // Infer last session emotional state from last decision
  const lastProblemSummary = last.problem.length > 80
    ? last.problem.slice(0, 77) + '…'
    : last.problem;

  const emotionMap: Record<string, EmotionalState> = {
    overwhelmed: 'overwhelmed', hesitant: 'hesitant', burned_out: 'burned_out',
    motivated: 'motivated', decisive: 'decisive',
  };
  const lastVerdict = (last.blueprint?.recommendation ?? '').toLowerCase();
  const lastMoodSignal: EmotionalState =
    Object.entries(emotionMap).find(([key]) => lastVerdict.includes(key))?.[1] as EmotionalState
    ?? 'stable';

  const continuityMessage = warmReconnect
    ? `It's been ${Math.round(daysSinceLast)} days. Last time: "${lastProblemSummary}".`
    : shouldAcknowledgeReturn && openActionsCount > 0
    ? `You have ${openActionsCount} open decision(s) from previous sessions.`
    : undefined;

  return {
    isReturn,
    daysSinceLast,
    lastProblemSummary,
    lastMoodSignal,
    openActionsCount,
    continuityMessage,
    shouldAcknowledgeReturn,
    warmReconnect,
  };
}

// ─── Trust Profile ────────────────────────────────────────────────────────────

function buildTrustProfile(
  decisions: DecisionMemoryEntry[],
  profile: UserDecisionProfile,
): TrustProfile {
  const sessionCount = Math.max(
    1,
    new Set(decisions.map((d) => d.timestamp.split('T')[0])).size,
  );

  const sorted = [...decisions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const lastSessionGap = sorted.length > 0 ? daysSince(sorted[0].timestamp) : 0;

  const consistencySignal = sessionCount >= 3 || profile.totalDecisions >= 5;

  const resolvedWithOutcome = decisions.filter((d) => d.outcome);
  const avgOutcomeAccuracy =
    resolvedWithOutcome.length > 0
      ? resolvedWithOutcome.reduce((s, d) => s + (d.outcome?.scoreAccuracy ?? 50), 0)
        / resolvedWithOutcome.length
      : 50;
  const truthSignal = avgOutcomeAccuracy >= 65;

  const badOutcomes = resolvedWithOutcome.filter(
    (d) => (d.outcome?.scoreAccuracy ?? 100) < 35,
  );
  const recoveryMode = badOutcomes.length >= 2;

  // Trust score
  let score = 50;
  score += Math.min(25, sessionCount * 4);       // +4 per session, max 25
  score += truthSignal ? 15 : -5;                // accuracy signal
  score += consistencySignal ? 10 : 0;           // returning user
  score -= recoveryMode ? 20 : 0;                // bad history
  score -= lastSessionGap > 60 ? 10 : 0;         // long absence
  score = clamp(score);

  const level: TrustLevel =
    recoveryMode ? 'fragile'
    : score >= 75 ? 'strong'
    : score >= 55 ? 'established'
    : 'building';

  const trustMessage: string | undefined =
    level === 'fragile'
      ? 'Acknowledge uncertainty without over-correcting. Rebuild through accuracy, not reassurance.'
      : level === 'building' && sessionCount <= 2
      ? 'First or second session — let the work speak. No relationship language.'
      : level === 'strong'
      ? 'User trusts the system. Can challenge directly without buffering.'
      : undefined;

  return {
    level,
    score,
    sessionCount,
    lastSessionGap,
    consistencySignal,
    truthSignal,
    recoveryMode,
    trustMessage,
  };
}

// ─── Cognitive Load Assessment ────────────────────────────────────────────────

function assessCognitiveLoad(
  history: Array<{ role: string; content: string }>,
  energy: EnergyAssessment,
  problem: string,
): CognitiveLoadAssessment {
  const turns = userTurns(history);
  const turnCount = turns.length;
  const text = combinedText(history, problem);

  const signals: string[] = [];

  // Count topic shifts (heuristic: sentences with "but also", "and also", "what about")
  const topicShiftMatches = text.match(/\b(but also|what about|and also|another thing|also,|one more|plus)\b/gi);
  const topicShifts = topicShiftMatches?.length ?? 0;
  if (topicShifts >= 3) signals.push(`${topicShifts} topic jumps detected`);

  // Unresolved thread count (questions asked without answers)
  const questionCount = (turns.join(' ').match(/\?/g) ?? []).length;
  const unresolved = Math.max(0, questionCount - Math.floor(turnCount / 2));
  if (unresolved >= 2) signals.push(`${unresolved} unresolved questions`);

  // Energy signals
  if (energy.state === 'OVERLOAD') signals.push('energy:overload');
  if (energy.state === 'HESITATION' && turnCount >= 4) signals.push('extended hesitation loop');
  if (turnCount >= 7) signals.push(`${turnCount} turn session — extended`);
  if (/\b(can'?t think|too much|brain|overwhelmed|too many|options|choices|confus)\b/.test(text)) {
    signals.push('explicit overload language');
  }

  let level: CognitiveLoadLevel;
  const loadScore = signals.length;
  if (loadScore >= 4 || energy.state === 'OVERLOAD') level = 'critical';
  else if (loadScore >= 2) level = 'high';
  else if (loadScore >= 1) level = 'medium';
  else level = 'low';

  const overloadRisk = level === 'high' || level === 'critical';
  const preventionActive = overloadRisk && energy.pacing === 'slower';

  return {
    level,
    signals,
    turnCount,
    unresolved,
    topicShifts,
    overloadRisk,
    preventionActive,
  };
}

// ─── Attachment Signals ───────────────────────────────────────────────────────

function assessAttachment(
  decisions: DecisionMemoryEntry[],
  history: Array<{ role: string; content: string }>,
): AttachmentSignals {
  const sessionDays = new Set(decisions.map((d) => d.timestamp.split('T')[0])).size;
  const totalDecisions = decisions.length;
  const text = combinedText(history, '');

  const returnFrequency: AttachmentSignals['returnFrequency'] =
    sessionDays === 0 ? 'first_time'
    : sessionDays <= 2 ? 'occasional'
    : sessionDays <= 8 ? 'regular'
    : 'habitual';

  const engagementDepth: AttachmentSignals['engagementDepth'] =
    totalDecisions < 3 ? 'shallow'
    : totalDecisions < 10 ? 'moderate'
    : 'deep';

  const openLoopCount = decisions.filter((d) => !d.outcome).length;

  const emotionalInvestment = /\b(i feel|i'm scared|i'm worried|hurts|terrified|afraid|i care|means a lot|matters to me|personal)\b/.test(text);

  const trustIncidents = (text.match(/\b(but wait|i disagree|that's wrong|not sure about that|i don'?t think so)\b/gi) ?? []).length;

  return {
    returnFrequency,
    engagementDepth,
    openLoopCount,
    emotionalInvestment,
    trustIncidents,
  };
}

// ─── Conversation Mode Selection ─────────────────────────────────────────────

const ENERGY_TO_MODE: Record<EnergyState, ConversationMode> = {
  EXECUTION: 'execution_coach',
  HESITATION: 'advisor',
  OVERLOAD: 'stabilizer',
  EXPLORATION: 'reflective_analyst',
  RECOVERY: 'stabilizer',
  IMPULSIVE: 'strategist',
  STABLE: 'advisor',
};

function selectConversationMode(
  energy: EnergyAssessment,
  trust: TrustProfile,
  cognitiveLoad: CognitiveLoadAssessment,
  onboarding: OnboardingState,
  returnContext: ReturnUserContext,
  profile: UserDecisionProfile,
): { mode: ConversationMode; rationale: ConversationModeRationale } {
  // Critical load override — always stabilize first
  if (cognitiveLoad.level === 'critical') {
    return { mode: 'stabilizer', rationale: 'cognitive_load:high → stabilize' };
  }

  // Fragile trust — stabilize before challenging
  if (trust.level === 'fragile') {
    return { mode: 'stabilizer', rationale: 'trust:fragile → stabilize' };
  }

  // Warm reconnect after long gap — stabilizer to re-establish connection
  if (returnContext.warmReconnect) {
    return { mode: 'stabilizer', rationale: 'session:return_long_gap → stabilizer' };
  }

  // New user — start as advisor
  if (onboarding.phase === 'first_message' || onboarding.phase === 'calibrating') {
    return { mode: 'advisor', rationale: 'session:new_user → advisor_default' };
  }

  // Declining execution score — build momentum
  if (profile.executionScore < 0.3 && profile.totalDecisions >= 3) {
    return { mode: 'momentum_builder', rationale: 'trajectory:declining → build_momentum' };
  }

  // Strong trust + stable energy → can go strategist
  if (trust.level === 'strong' && energy.state === 'STABLE') {
    return { mode: 'strategist', rationale: 'trust:strong → strategist' };
  }

  // High trust ascending → execution coach
  if (trust.level !== 'building' && energy.state === 'EXECUTION') {
    return { mode: 'execution_coach', rationale: 'trajectory:ascending → coach' };
  }

  // Base: map from energy state
  const mode = ENERGY_TO_MODE[energy.state];
  const rationale: ConversationModeRationale = `energy:${energy.state.toLowerCase()} → ${
    mode === 'stabilizer' ? 'stabilize'
    : mode === 'execution_coach' ? 'coach'
    : mode === 'advisor' ? 'advise'
    : mode === 'strategist' ? 'strategize'
    : 'reflect'
  }` as ConversationModeRationale;

  return { mode, rationale };
}

// ─── Emotional Tone Calibration ───────────────────────────────────────────────

function calibrateEmotionalTone(
  mode: ConversationMode,
  energy: EnergyAssessment,
  trust: TrustProfile,
  cognitiveLoad: CognitiveLoadAssessment,
): EmotionalToneProfile {
  const base: Record<ConversationMode, EmotionalToneProfile> = {
    advisor: {
      warmth: 0.5, directness: 0.65, pressure: 0.3,
      validationRatio: 0.4, energyLevel: 'neutral',
      allowHumor: false, allowSilence: true,
    },
    strategist: {
      warmth: 0.3, directness: 0.85, pressure: 0.5,
      validationRatio: 0.25, energyLevel: 'neutral',
      allowHumor: false, allowSilence: true,
    },
    stabilizer: {
      warmth: 0.8, directness: 0.4, pressure: 0.05,
      validationRatio: 0.7, energyLevel: 'low',
      allowHumor: false, allowSilence: true,
    },
    execution_coach: {
      warmth: 0.45, directness: 0.9, pressure: 0.7,
      validationRatio: 0.2, energyLevel: 'elevated',
      allowHumor: false, allowSilence: false,
    },
    reflective_analyst: {
      warmth: 0.55, directness: 0.5, pressure: 0.15,
      validationRatio: 0.5, energyLevel: 'low',
      allowHumor: false, allowSilence: true,
    },
    momentum_builder: {
      warmth: 0.6, directness: 0.75, pressure: 0.45,
      validationRatio: 0.5, energyLevel: 'elevated',
      allowHumor: true, allowSilence: false,
    },
  };

  const tone = { ...base[mode] };

  // Modulations
  if (trust.level === 'fragile') {
    tone.warmth = clampFloat(tone.warmth + 0.2);
    tone.pressure = clampFloat(tone.pressure - 0.2);
  }
  if (trust.level === 'strong') {
    tone.directness = clampFloat(tone.directness + 0.1);
    tone.pressure = clampFloat(tone.pressure + 0.1);
  }
  if (cognitiveLoad.level === 'high' || cognitiveLoad.level === 'critical') {
    tone.warmth = clampFloat(tone.warmth + 0.15);
    tone.pressure = clampFloat(tone.pressure - 0.3);
    tone.validationRatio = clampFloat(tone.validationRatio + 0.2);
    tone.energyLevel = 'low';
  }
  if (energy.state === 'IMPULSIVE') {
    tone.pressure = clampFloat(tone.pressure - 0.2);  // less pressure on impulsive user
    tone.directness = clampFloat(tone.directness + 0.15);
  }

  return tone;
}

// ─── Response Depth ───────────────────────────────────────────────────────────

function computeResponseDepth(
  mode: ConversationMode,
  energy: EnergyAssessment,
  cognitiveLoad: CognitiveLoadAssessment,
  onboarding: OnboardingState,
  history: Array<{ role: string; content: string }>,
  problem: string,
): { depth: ResponseDepthLevel; signals: DepthTransitionSignal[] } {
  const signals: DepthTransitionSignal[] = [];
  const text = combinedText(history, problem);

  // Explicit user requests
  if (/\b(brief|quick|short|just tell me|tl;?dr|simple|one line|one sentence)\b/i.test(text)) {
    signals.push('user_compressed');
  }
  if (/\b(deep|full|thorough|detailed|explain everything|walk me through|comprehensive|break it down)\b/i.test(problem)) {
    signals.push('explicit_deep_request');
  }

  // Overload → compress
  if (cognitiveLoad.level === 'critical' || cognitiveLoad.level === 'high') {
    signals.push('overload_detected');
  }

  // High stakes → go deeper
  if (
    /\b(quit|resign|fire|funding|debt|health|marriage|divorce|mortgage|lawsuit|visa|co-?founder|runway)\b/i.test(problem)
    && energy.state !== 'OVERLOAD'
  ) {
    signals.push('high_stakes_escalation');
  }

  // Trust expanded → depth unlocked
  // (Handled implicitly via mode — strategist mode unlocks deep_reasoning)

  // Fatigue signal
  if (
    energy.state === 'RECOVERY'
    || /\b(tired|fatigued|burnt.?out|exhausted|can'?t think|brain fog)\b/i.test(text)
  ) {
    signals.push('fatigue_signal');
  }

  // Calibration phase: momentum windows only
  if (onboarding.phase === 'calibrating' || onboarding.phase === 'first_message') {
    signals.push('momentum_window');
  }

  // Determine depth
  const compressed = signals.includes('user_compressed') || signals.includes('overload_detected') || signals.includes('fatigue_signal');
  const expanded = signals.includes('explicit_deep_request') || signals.includes('high_stakes_escalation');
  const earlySelf = signals.includes('momentum_window');

  const modeDepthMap: Record<ConversationMode, ResponseDepthLevel> = {
    advisor: 'tactical',
    strategist: 'deep_reasoning',
    stabilizer: 'short',
    execution_coach: 'tactical',
    reflective_analyst: 'analytical',
    momentum_builder: 'tactical',
  };

  let depth = modeDepthMap[mode];
  if (compressed) depth = 'short';
  else if (earlySelf && depth !== 'short') depth = 'tactical';
  else if (expanded && mode !== 'stabilizer') depth = 'deep_reasoning';

  return { depth, signals };
}

// ─── Conversational Rhythm ────────────────────────────────────────────────────

function computeConversationRhythm(
  mode: ConversationMode,
  cognitiveLoad: CognitiveLoadAssessment,
  depth: ResponseDepthLevel,
  onboarding: OnboardingState,
): ConversationRhythm {
  const pacing: PacingSignal =
    cognitiveLoad.level === 'critical' ? 'pause'
    : cognitiveLoad.level === 'high' ? 'slow_down'
    : depth === 'deep_reasoning' ? 'maintain'
    : onboarding.phase === 'first_message' ? 'slow_down'
    : 'maintain';

  const idealResponseLength =
    depth === 'short' ? 'very_short'
    : depth === 'tactical' ? 'short'
    : depth === 'analytical' ? 'medium'
    : 'long';

  // How many turns to let pass before pushing for commitment
  const turnsBeforeActionPush: number =
    mode === 'execution_coach' ? 1
    : mode === 'momentum_builder' ? 2
    : mode === 'stabilizer' ? 6
    : mode === 'reflective_analyst' ? 4
    : 3;

  const questionCadence: ConversationRhythm['questionCadence'] =
    mode === 'stabilizer' ? 'one_per_response'
    : mode === 'reflective_analyst' ? 'close_with_question'
    : onboarding.phase === 'calibrating' ? 'one_per_response'
    : 'none';

  const summaryFrequency: ConversationRhythm['summaryFrequency'] =
    cognitiveLoad.topicShifts >= 3 ? 'every_3_turns'
    : depth === 'deep_reasoning' ? 'end_of_exchange'
    : 'none';

  return {
    pacing,
    idealResponseLength,
    turnsBeforeActionPush,
    questionCadence,
    summaryFrequency,
  };
}

// ─── Personality Stabilization Safeguards ────────────────────────────────────

function checkPersonalityStabilization(
  mode: ConversationMode,
  tone: EmotionalToneProfile,
  energy: EnergyAssessment,
  cognitiveLoad: CognitiveLoadAssessment,
  history: Array<{ role: string; content: string }>,
): PersonalityStabilizationResult {
  const guardrails: PersonalityGuardrail[] = [];
  const appliedCorrections: string[] = [];
  let overriddenMode: ConversationMode | undefined;

  const assistantMessages = history.filter((t) => t.role === 'assistant').map((t) => t.content);
  const recentAssistant = assistantMessages.slice(-3).join(' ').toLowerCase();

  // Sycophancy: excessive validation in consecutive assistant turns
  const validationCount = (recentAssistant.match(/\b(great|excellent|perfect|brilliant|absolutely|definitely|of course|you'?re right|exactly)\b/g) ?? []).length;
  if (validationCount >= 4 || tone.validationRatio >= 0.85) {
    guardrails.push({
      driftRisk: 'sycophancy',
      severity: validationCount >= 6 ? 'high' : 'medium',
      detectedIn: 'recent assistant messages',
      correction: 'Reduce affirmation density. Re-introduce challenge.',
      suppressions: ['great', 'excellent', 'perfect', 'absolutely', 'of course'],
    });
    appliedCorrections.push('Reduced validation ratio');
  }

  // Over-mirroring: reflecting user's distress without grounding
  const distressCount = (recentAssistant.match(/\b(i understand how hard|that must be|i can imagine|that sounds really|it makes sense you feel)\b/g) ?? []).length;
  if (distressCount >= 3 && (energy.state === 'OVERLOAD' || energy.state === 'RECOVERY')) {
    guardrails.push({
      driftRisk: 'over_mirroring',
      severity: 'medium',
      detectedIn: 'empathy loop pattern',
      correction: 'Acknowledge once, then redirect to grounding and forward motion.',
      suppressions: ['i understand how hard', 'that must be so'],
    });
    appliedCorrections.push('Capped emotional mirroring depth');
  }

  // Pressure creep: execution coach mode with high cognitive load
  if (mode === 'execution_coach' && cognitiveLoad.level !== 'low') {
    guardrails.push({
      driftRisk: 'pressure_creep',
      severity: cognitiveLoad.level === 'critical' ? 'high' : 'low',
      detectedIn: 'mode:execution_coach + cognitive_load:high',
      correction: 'Reduce accountability pressure while cognitive load is elevated.',
      suppressions: ['you need to', 'you must', 'you have to'],
    });
    if (cognitiveLoad.level === 'critical') {
      overriddenMode = 'stabilizer';
      appliedCorrections.push('Overrode execution_coach → stabilizer due to critical load');
    }
  }

  // Guru drift: elevated wisdom language
  const guruPatterns = (recentAssistant.match(/\b(the truth is|what you really need|fundamentally|the key insight|the real issue here|deep down you know)\b/g) ?? []).length;
  if (guruPatterns >= 2) {
    guardrails.push({
      driftRisk: 'guru_drift',
      severity: 'medium',
      detectedIn: 'elevated wisdom framing',
      correction: 'Return to operational language. State facts, not revelations.',
      suppressions: ['the truth is', 'deep down you know', 'the real issue here'],
    });
    appliedCorrections.push('Suppressed guru framing language');
  }

  // Clinical drift: too cold in stabilizer mode
  if (mode === 'stabilizer' && tone.warmth < 0.5) {
    guardrails.push({
      driftRisk: 'clinical_drift',
      severity: 'low',
      detectedIn: 'stabilizer mode with low warmth',
      correction: 'Increase warmth in stabilizer mode — user needs grounding, not distance.',
      suppressions: [],
    });
    appliedCorrections.push('Applied warmth floor in stabilizer mode');
  }

  // Mode bleed: signals from two incompatible modes in last 2 responses
  const hasCoachSignals = /\b(accountability|follow through|commit|action|do it now)\b/.test(recentAssistant);
  const hasStabilizerSignals = /\b(it'?s okay|take your time|no rush|breathe|slow down)\b/.test(recentAssistant);
  if (hasCoachSignals && hasStabilizerSignals) {
    guardrails.push({
      driftRisk: 'mode_bleed',
      severity: 'medium',
      detectedIn: 'conflicting mode signals in consecutive responses',
      correction: 'Pick one mode and hold it for at least 2 turns before transitioning.',
      suppressions: [],
    });
    appliedCorrections.push('Flagged mode bleed for correction');
  }

  const stable = guardrails.filter((g) => g.severity !== 'low').length === 0;
  const safeguardMessage = guardrails.length > 0
    ? `${guardrails.length} stabilization guardrail(s) active: ${guardrails.map((g) => g.driftRisk).join(', ')}`
    : undefined;

  return {
    stable,
    guardrails,
    appliedCorrections,
    overriddenMode,
    safeguardMessage,
  };
}

// ─── Experience Explanation ───────────────────────────────────────────────────

function buildExperienceExplanation(
  mode: ConversationMode,
  modeRationale: ConversationModeRationale,
  tone: EmotionalToneProfile,
  depth: ResponseDepthLevel,
  guardrails: PersonalityGuardrail[],
  trust: TrustProfile,
  onboarding: OnboardingState,
): ExperienceExplanation {
  const summary =
    `Mode: ${mode} | Depth: ${depth} | Trust: ${trust.level} | Phase: ${onboarding.phase}.` +
    (guardrails.length > 0 ? ` ${guardrails.length} guardrail(s) active.` : '');

  const modeJustification = `Selected "${mode}" because: ${modeRationale.replace(/_/g, ' ')}.`;

  const toneJustification =
    `Warmth ${Math.round(tone.warmth * 100)}%, directness ${Math.round(tone.directness * 100)}%, ` +
    `pressure ${Math.round(tone.pressure * 100)}%.`;

  const depthJustification =
    depth === 'short' ? 'Compressed due to overload, fatigue, or user preference.'
    : depth === 'tactical' ? 'Tactical depth — one clear action, supporting reasoning only if needed.'
    : depth === 'analytical' ? 'Analytical — structured reasoning with multi-angle consideration.'
    : 'Full depth — high-stakes or explicit request warranting comprehensive analysis.';

  const guardrailsApplied = guardrails.map((g) => `${g.driftRisk}: ${g.correction}`);

  const adaptationLevel: ExperienceExplanation['adaptationLevel'] =
    guardrails.length >= 2 || mode === 'stabilizer' ? 'significant'
    : guardrails.length === 1 || mode !== 'advisor' ? 'moderate'
    : 'minimal';

  return {
    summary,
    modeJustification,
    toneJustification,
    depthJustification,
    guardrailsApplied,
    adaptationLevel,
  };
}

// ─── Dashboard Emotional Analytics ───────────────────────────────────────────

export function buildEmotionalDashboard(
  decisions: DecisionMemoryEntry[],
  sessionHistory: SessionEmotionalRecord[],
): EmotionalAnalyticsDashboard {
  const sessionCount = sessionHistory.length;

  const modeHistory = sessionHistory.map((s) => s.dominantMode);
  const emotionalStateHistory = sessionHistory.map((s) => s.dominantEmotionalState);
  const trustProgression = sessionHistory.map((s) => s.trustLevelAtEnd);

  const modeCounts: Record<ConversationMode, number> = {
    advisor: 0, strategist: 0, stabilizer: 0,
    execution_coach: 0, reflective_analyst: 0, momentum_builder: 0,
  };
  for (const m of modeHistory) modeCounts[m]++;

  const depthCounts: Record<ResponseDepthLevel, number> = {
    short: 0, tactical: 0, analytical: 0, deep_reasoning: 0,
  };
  for (const s of sessionHistory) depthCounts[s.depthReached]++;
  const mostUsedDepthLevel = (Object.entries(depthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'tactical') as ResponseDepthLevel;

  const cognitiveLoadCounts: Record<CognitiveLoadLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const s of sessionHistory) cognitiveLoadCounts[s.cognitiveLoad]++;
  const avgCognitiveLoad = (Object.entries(cognitiveLoadCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'medium') as CognitiveLoadLevel;

  const overwhelmIncidents = sessionHistory.filter((s) => s.overwhelmPrevented).length;
  const stabilizationEvents = sessionHistory.filter((s) => s.stabilizationTriggered).length;
  const onboardingComplete = sessionHistory.some((s) => s.onboardingPhase === 'established');

  const sessionDays = new Set(decisions.map((d) => d.timestamp.split('T')[0])).size;
  const returnFrequency: AttachmentSignals['returnFrequency'] =
    sessionDays === 0 ? 'first_time'
    : sessionDays <= 2 ? 'occasional'
    : sessionDays <= 8 ? 'regular'
    : 'habitual';

  // Attachment score
  let attachmentScore = 30;
  attachmentScore += Math.min(30, sessionCount * 5);
  attachmentScore += onboardingComplete ? 15 : 0;
  attachmentScore += returnFrequency === 'habitual' ? 15 : returnFrequency === 'regular' ? 10 : 0;
  attachmentScore += stabilizationEvents > 0 && stabilizationEvents < 4 ? 10 : 0;
  attachmentScore = clamp(attachmentScore);

  const topInsights: string[] = [];
  if (modeCounts.stabilizer > modeCounts.advisor + modeCounts.strategist) {
    topInsights.push('User frequently enters sessions in high-stress states — stabilizer mode is dominant.');
  }
  if (emotionalStateHistory.filter((e) => e === 'burned_out').length >= 2) {
    topInsights.push('Burnout state detected across multiple sessions — reduce pressure consistently.');
  }
  if (trustProgression.at(-1) === 'strong') {
    topInsights.push('Trust is strong — system can challenge more directly.');
  }
  if (overwhelmIncidents >= 3) {
    topInsights.push('Repeat overload incidents — consider proactive load reduction earlier in sessions.');
  }
  if (decisions.filter((d) => !d.outcome).length > decisions.length * 0.7) {
    topInsights.push('High proportion of unresolved decisions — push for outcome logging.');
  }

  return {
    sessionCount,
    returnFrequency,
    dominantModeHistory: modeHistory,
    emotionalStateHistory,
    trustProgression,
    avgCognitiveLoad,
    overwhelmIncidents,
    stabilizationEvents,
    attachmentScore,
    onboardingComplete,
    mostUsedDepthLevel,
    topInsights,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function assessConversationExperience(
  input: ConversationExperienceInput,
): ConversationExperienceResult {
  const { conversationHistory, decisions, profile, energy, currentProblem } = input;

  // Sequential pipeline
  const onboarding = detectOnboardingPhase(decisions, conversationHistory);
  const returnContext = buildReturnUserContext(decisions);
  const trust = buildTrustProfile(decisions, profile);
  const cognitiveLoad = assessCognitiveLoad(conversationHistory, energy, currentProblem);
  const attachment = assessAttachment(decisions, conversationHistory);

  const { mode: rawMode, rationale: modeRationale } = selectConversationMode(
    energy, trust, cognitiveLoad, onboarding, returnContext, profile,
  );

  const toneProfile = calibrateEmotionalTone(rawMode, energy, trust, cognitiveLoad);

  const { depth: rawDepth, signals: depthSignals } = computeResponseDepth(
    rawMode, energy, cognitiveLoad, onboarding, conversationHistory, currentProblem,
  );

  const personalityStabilization = checkPersonalityStabilization(
    rawMode, toneProfile, energy, cognitiveLoad, conversationHistory,
  );

  // Apply overrides from guardrails
  const mode = personalityStabilization.overriddenMode ?? rawMode;
  const responseDepth = rawDepth;

  const rhythm = computeConversationRhythm(mode, cognitiveLoad, responseDepth, onboarding);

  const experienceExplanation = buildExperienceExplanation(
    mode, modeRationale, toneProfile, responseDepth,
    personalityStabilization.guardrails, trust, onboarding,
  );

  return {
    mode,
    modeRationale,
    toneProfile,
    responseDepth,
    rhythm,
    trust,
    cognitiveLoad,
    onboarding,
    returnContext,
    attachment,
    personalityStabilization,
    depthTransitionSignals: depthSignals,
    experienceExplanation,
  };
}
