export type SessionPressureLevel = 0 | 1 | 2;

const HEDGING_PHRASES = [
  'maybe', "i don't know", "i dont know", 'not sure', "i'm not sure",
  'possibly', 'could be', 'what if', 'but what about', 'on the other hand',
  'probably', 'i think', "i'm thinking", 'what else', 'tell me more',
  'not ready', 'let me think', 'should i', 'is it worth', "i'm hesitant",
  'afraid', 'scared', 'worried', 'not confident', 'unsure', 'hmm',
  'might', 'perhaps', 'kind of', 'sort of',
] as const;

const SEEKING_ANALYSIS_PHRASES = [
  'what do you think', 'what would you do', 'can you explain',
  'can you tell me more', 'what about', 'is there another',
  'what else', 'are there other options', 'give me more',
] as const;

function extractUserMessages(
  conversationHistory: Array<{ role: string; content: string }>
): string[] {
  return conversationHistory
    .filter((t) => t.role === 'user')
    .map((t) => t.content.trim());
}

export interface HesitationResult {
  score: number;
  signals: string[];
}

export function scoreHesitation(userMessages: string[]): HesitationResult {
  const signals: string[] = [];
  let score = 0;

  const turnCount = userMessages.length;

  if (turnCount >= 4) {
    score += 4;
    signals.push(`${turnCount} turns without resolution`);
  } else if (turnCount === 3) {
    score += 2;
    signals.push('3 turns without resolution');
  } else if (turnCount === 2) {
    score += 1;
    signals.push('2nd turn');
  }

  const lastMsg = (userMessages[turnCount - 1] ?? '').toLowerCase();

  const hedgeMatches = HEDGING_PHRASES.filter((phrase) => lastMsg.includes(phrase));
  if (hedgeMatches.length >= 2) {
    score += 3;
    signals.push(`hedging: "${hedgeMatches[0]}", "${hedgeMatches[1]}"`);
  } else if (hedgeMatches.length === 1) {
    score += 2;
    signals.push(`hedging: "${hedgeMatches[0]}"`);
  }

  const seekingMore = SEEKING_ANALYSIS_PHRASES.some((p) => lastMsg.includes(p));
  if (seekingMore) {
    score += 2;
    signals.push('seeking analysis instead of deciding');
  }

  if (turnCount > 1 && lastMsg.length < 45) {
    score += 1;
    signals.push('short follow-up without new information');
  }

  const questionCount = (lastMsg.match(/\?/g) ?? []).length;
  if (questionCount >= 2) {
    score += 2;
    signals.push('multiple questions, no commitment');
  }

  return { score, signals };
}

export function computeSessionPressureLevel(
  conversationHistory: Array<{ role: string; content: string }>
): SessionPressureLevel {
  const userMessages = extractUserMessages(conversationHistory);
  if (userMessages.length <= 1) return 0;

  const { score } = scoreHesitation(userMessages);

  if (score >= 7) return 2;
  if (score >= 3) return 1;
  return 0;
}

export function buildPressureDirective(level: SessionPressureLevel): string {
  if (level === 0) return '';

  if (level === 1) {
    return `PRESSURE MODE ACTIVE:
The user has submitted multiple turns without committing to a decision. Hesitation is the pattern.
Adjust tone and structure:
- Cut explanatory content by 50%. No warm-up, no context recap.
- Open with the decision, not the analysis: one sentence, verdict-first.
- Name exactly one cost of continued inaction — specific and time-bound.
- End with one executable action: a verb, a number, a deadline.
- Remove all hedging language: no "consider", "you might", "it depends", "on the other hand".
- No alternatives. One path.
The user does not need more analysis. They need a clear direction.`;
  }

  return `CONFRONTATIONAL MODE ACTIVE:
The user has been avoiding a decision across multiple turns. This is now a pattern, not uncertainty.
Adjust tone completely — this response must act as a mirror:
- Open with the real cost of inaction. Make it personal and specific. Do not soften it.
- State the verdict in one sentence. No explanation, no caveats.
- Name the exact action required: one verb, one number, one deadline. Nothing else.
- If the user has already received the same direction before, name it directly: "You have already been told to do X."
- Do not comfort. Do not explain. Do not offer alternatives.
The purpose of this response is to end the avoidance loop, not to satisfy curiosity.`;
}
