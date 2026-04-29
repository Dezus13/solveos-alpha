import { NextResponse } from 'next/server';
import { recordOutcome, getDecisionHistory, saveDecisionSnapshot, scheduleReview } from '@/lib/memory';
import { computeVerdictAccuracy } from '@/lib/semantic-guards';
import type { DecisionBlueprint, OutcomeStatus } from '@/lib/types';

function isOutcomeStatus(value: unknown): value is OutcomeStatus {
  return value === 'unknown' || value === 'better' || value === 'expected' || value === 'worse';
}

function inferOutcomeStatus(actualOutcome: string, scoreAccuracy: number): OutcomeStatus {
  const lower = actualOutcome.toLowerCase();
  if (lower.includes('succeeded') || lower.includes('better')) return 'better';
  if (lower.includes('failed') || lower.includes('worse')) return 'worse';
  if (lower.includes('partial') || lower.includes('expected')) return 'expected';
  if (scoreAccuracy >= 70) return 'better';
  if (scoreAccuracy < 35) return 'worse';
  return 'expected';
}

function isDecisionSnapshot(value: unknown): value is { id: string; problem: string; blueprint: DecisionBlueprint } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  const blueprint = snapshot.blueprint as Record<string, unknown> | undefined;
  return (
    typeof snapshot.id === 'string' &&
    typeof snapshot.problem === 'string' &&
    typeof blueprint === 'object' &&
    blueprint !== null &&
    typeof blueprint.score === 'number'
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { decisionId, outcome } = body;

    if (!decisionId || typeof decisionId !== 'string') {
      return NextResponse.json({ error: 'decisionId required' }, { status: 400 });
    }

    // ── Schedule a delayed review (outcome is "Too Early / Unknown") ───────────
    if (body.pendingReview) {
      const reviewType = body.pendingReview.reviewType;
      if (reviewType !== '30day' && reviewType !== '60day' && reviewType !== '90day') {
        return NextResponse.json(
          { error: 'reviewType must be "30day", "60day", or "90day"' },
          { status: 400 }
        );
      }
      const result = await scheduleReview(decisionId, reviewType);
      if (!result.ok) {
        const status = result.reason === 'not_found' ? 404 : 409;
        const error =
          result.reason === 'not_found'
            ? 'Decision not found'
            : result.reason === 'review_conflict'
            ? 'A different pending review is already scheduled for this decision'
            : 'Outcome already recorded for this decision';
        return NextResponse.json({ error }, { status });
      }
      return NextResponse.json({ success: true, scheduled: true });
    }

    // ── Record an actual outcome ───────────────────────────────────────────────
    if (
      !outcome ||
      typeof outcome.actualOutcome !== 'string' ||
      !outcome.actualOutcome.trim() ||
      typeof outcome.scoreAccuracy !== 'number' ||
      !Number.isFinite(outcome.scoreAccuracy) ||
      outcome.scoreAccuracy < 0 ||
      outcome.scoreAccuracy > 100
    ) {
      return NextResponse.json(
        { error: 'outcome with actualOutcome and scoreAccuracy between 0 and 100 required' },
        { status: 400 }
      );
    }

    // Look up the original recommendation to compute verdict accuracy.
    const history = await getDecisionHistory();
    const existing = history.find(e => e.id === decisionId);
    const originalRecommendation = existing?.blueprint?.recommendation || '';
    const verdictAccuracy = originalRecommendation
      ? computeVerdictAccuracy(originalRecommendation, outcome.scoreAccuracy)
      : undefined;

    let result = await recordOutcome(decisionId, {
      actualOutcome: outcome.actualOutcome,
      scoreAccuracy: outcome.scoreAccuracy,
      verdictAccuracy,
      outcomeStatus: isOutcomeStatus(outcome.outcomeStatus)
        ? outcome.outcomeStatus
        : inferOutcomeStatus(outcome.actualOutcome, outcome.scoreAccuracy),
      lessons: Array.isArray(outcome.lessons) ? outcome.lessons : [],
      recommendations: Array.isArray(outcome.recommendations) ? outcome.recommendations : [],
    });

    if (!result.ok && result.reason === 'not_found' && isDecisionSnapshot(body.decision)) {
      await saveDecisionSnapshot({
        id: decisionId,
        problem: body.decision.problem,
        blueprint: body.decision.blueprint,
      });
      result = await recordOutcome(decisionId, {
        actualOutcome: outcome.actualOutcome,
        scoreAccuracy: outcome.scoreAccuracy,
        verdictAccuracy: body.decision.blueprint.recommendation
          ? computeVerdictAccuracy(body.decision.blueprint.recommendation, outcome.scoreAccuracy)
          : verdictAccuracy,
        outcomeStatus: isOutcomeStatus(outcome.outcomeStatus)
          ? outcome.outcomeStatus
          : inferOutcomeStatus(outcome.actualOutcome, outcome.scoreAccuracy),
        lessons: Array.isArray(outcome.lessons) ? outcome.lessons : [],
        recommendations: Array.isArray(outcome.recommendations) ? outcome.recommendations : [],
      });
    }

    if (!result.ok) {
      const status = result.reason === 'not_found' ? 404 : result.reason === 'invalid_outcome' ? 400 : 409;
      const error =
        result.reason === 'not_found'
          ? 'Decision not found'
          : result.reason === 'invalid_outcome'
          ? 'Invalid outcome payload'
          : 'Outcome already logged for this decision';
      console.error('Outcome logging rejected:', {
        decisionId,
        reason: result.reason,
        status,
        hasDecisionSnapshot: isDecisionSnapshot(body.decision),
      });
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ success: true, decision: result.entry });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /api/outcomes error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const decisionId = searchParams.get('id');

    const history = await getDecisionHistory();

    if (decisionId) {
      const decision = history.find(e => e.id === decisionId);
      if (!decision) {
        return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
      }
      return NextResponse.json({
        decisionId: decision.id,
        outcome: decision.outcome ?? null,
        outcomeStatus: decision.outcomeStatus ?? 'unknown',
        learning: decision.learning ?? null,
        pendingReview: decision.pendingReview ?? null,
        reviewCheckpoints: decision.reviewCheckpoints ?? [],
        timestamp: decision.timestamp,
      });
    }

    const outcomes = history
      .filter(e => !!e.outcome && !e.blueprint.isDemo)
      .map(e => ({
        decisionId: e.id,
        outcome: e.outcome,
        outcomeStatus: e.outcomeStatus ?? 'unknown',
        learning: e.learning ?? null,
        reviewCheckpoints: e.reviewCheckpoints ?? [],
        originalScore: e.blueprint.score,
        problem: e.problem,
      }));

    return NextResponse.json({ outcomes, count: outcomes.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /api/outcomes error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
