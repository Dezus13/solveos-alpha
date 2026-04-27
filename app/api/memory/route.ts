import { NextResponse } from 'next/server';
import {
  getDecisionHistory,
  searchDecisions,
  findSimilarDecisions,
  getDecisionPatterns,
  getMemoryGraph,
} from '@/lib/memory';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'search') {
      // Search decisions with filters
      const domain = searchParams.get('domain');
      const tags = searchParams.getAll('tags');
      const hasOutcome = searchParams.get('hasOutcome') === 'true';
      const minScore = searchParams.get('minScore');

      const results = await searchDecisions({
        domain: domain || undefined,
        tags: tags.length > 0 ? tags : undefined,
        hasOutcome: hasOutcome || undefined,
        minScore: minScore ? parseInt(minScore) : undefined,
      });

      return NextResponse.json({ results, count: results.length });
    } else if (action === 'similar') {
      // Find similar decisions to a given problem
      const problem = searchParams.get('problem');
      const domain = searchParams.get('domain');
      const limit = parseInt(searchParams.get('limit') || '5');

      if (!problem) {
        return NextResponse.json(
          { error: 'Problem parameter required' },
          { status: 400 }
        );
      }

      const results = await findSimilarDecisions(
        problem,
        domain ? { domain, stakeholders: [], timeHorizon: '', constraints: [] } : undefined,
        limit
      );

      return NextResponse.json({ results, count: results.length });
    } else if (action === 'patterns') {
      // Get decision patterns and insights
      const patterns = await getDecisionPatterns();
      return NextResponse.json({ patterns });
    } else if (action === 'graph') {
      // Build and return the full memory graph
      const graph = await getMemoryGraph();
      return NextResponse.json({ graph });
    } else {
      // Default: return full history
      const history = await getDecisionHistory();
      return NextResponse.json({
        decisions: history,
        count: history.length,
        latest: history[0] || null,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /api/memory error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
