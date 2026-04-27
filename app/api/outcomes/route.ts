import { NextResponse } from 'next/server';
import { recordOutcome, getDecisionHistory } from '@/lib/memory';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { decisionId, outcome } = body;

    if (!decisionId || !outcome) {
      return NextResponse.json(
        { error: 'decisionId and outcome required' },
        { status: 400 }
      );
    }

    if (!outcome.actualOutcome || outcome.scoreAccuracy === undefined) {
      return NextResponse.json(
        { error: 'actualOutcome and scoreAccuracy required' },
        { status: 400 }
      );
    }

    const updated = await recordOutcome(decisionId, {
      actualOutcome: outcome.actualOutcome,
      scoreAccuracy: outcome.scoreAccuracy,
      lessons: outcome.lessons || [],
      recommendations: outcome.recommendations || [],
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      decision: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /api/outcomes error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const decisionId = searchParams.get('id');

    if (decisionId) {
      // Get specific decision outcome
      const history = await getDecisionHistory();
      const decision = history.find(e => e.id === decisionId);

      if (!decision) {
        return NextResponse.json(
          { error: 'Decision not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        decision: decision.id,
        outcome: decision.outcome || null,
        timestamp: decision.timestamp,
      });
    } else {
      // Get all outcomes
      const history = await getDecisionHistory();
      const outcomes = history
        .filter(e => !!e.outcome)
        .map(e => ({
          decisionId: e.id,
          outcome: e.outcome,
          originalScore: e.blueprint.score,
          problem: e.problem,
        }));

      return NextResponse.json({
        outcomes,
        count: outcomes.length,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /api/outcomes error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
