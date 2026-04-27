import { NextResponse } from 'next/server';
import { getDueReviews, getPendingReviews } from '@/lib/memory';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'due';

    const reviews = mode === 'all'
      ? await getPendingReviews()
      : await getDueReviews();

    return NextResponse.json({
      reviews: reviews.map(e => ({
        id: e.id,
        problem: e.problem,
        timestamp: e.timestamp,
        blueprintScore: e.blueprint.score,
        pendingReview: e.pendingReview,
      })),
      count: reviews.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /api/reviews error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
