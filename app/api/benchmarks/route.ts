import { NextResponse } from 'next/server';
import { getDecisionHistory } from '@/lib/memory';
import { computeNetworkIntelligence } from '@/lib/benchmarks';

export async function GET() {
  try {
    const history = await getDecisionHistory();
    const intelligence = computeNetworkIntelligence(history);
    return NextResponse.json({ intelligence });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API /api/benchmarks error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
