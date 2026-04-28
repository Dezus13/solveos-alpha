import { NextResponse } from 'next/server';
import { saveDecision, getDecisionHistory } from '@/lib/memory';
import { getMemoryIntelligenceFromHistory } from '@/lib/memory-graph';
import { computeNetworkIntelligence, calibrateScore, buildCalibrationContext } from '@/lib/benchmarks';
import type { DecisionContext, SolveRequest, SolveResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readLanguage(body: Partial<SolveRequest> | undefined): string {
  const language = typeof body?.language === 'string' && body.language.trim()
    ? body.language.trim()
    : 'en';
  return language;
}

function readContext(body: Partial<SolveRequest> | undefined): DecisionContext | undefined {
  return isRecord(body?.context) ? body.context as DecisionContext : undefined;
}

function readConversationContext(body: Partial<SolveRequest> | undefined): string {
  if (!Array.isArray(body?.conversationHistory)) return '';

  return body.conversationHistory
    .filter((turn) => isRecord(turn) && typeof turn.content === 'string')
    .map((turn, i) => `${i % 2 === 0 ? 'User' : 'Prior analysis'}: ${(turn as { content: string }).content}`)
    .join('\n');
}

export async function POST(req: Request) {
  try {
    const parsedBody = await req.json().catch(() => ({}));
    const body = isRecord(parsedBody) ? parsedBody as Partial<SolveRequest> : {};
    const problem = typeof body.problem === 'string' ? body.problem.trim() : '';
    const language = readLanguage(body);
    const context = readContext(body);

    if (!problem) {
      return NextResponse.json(
        { error: 'Decision description is required.' },
        { status: 400 }
      );
    }

    if (problem.length < 20) {
      return NextResponse.json(
        { error: `Decision details must be at least 20 characters. Current: ${problem.length} characters.` },
        { status: 400 }
      );
    }

    const history = await getDecisionHistory().catch(() => []);
    const conversationContext = readConversationContext(body);
    const domain = context?.domain;
    let memoryContext = '';
    let memoryScore = 0;
    let networkScore = 0;
    let calibrationNote = '';

    try {
      const intel = getMemoryIntelligenceFromHistory(problem, history, context);
      memoryScore = intel.memoryScore;
      memoryContext = intel.strategicContext;

      const netIntel = computeNetworkIntelligence(history);
      networkScore = netIntel.networkScore;
      calibrationNote = buildCalibrationContext(history, domain);
    } catch {
      // Continue analysis without memory enrichment.
    }

    const fullContext = [memoryContext, calibrationNote].filter(Boolean).join('\n\n');
    const { solveDecision } = await import('@/lib/engine');
    const blueprint = await solveDecision(problem, language, fullContext, conversationContext);
    const calibration = calibrateScore(blueprint.score, history, domain, problem, context);
    const riskPenalty =
      calibration.offset !== 0 && blueprint.riskMap && blueprint.riskMap.risk > 60
        ? -Math.min(8, Math.round((blueprint.riskMap.risk - 60) / 5))
        : 0;
    const finalConfidence = Math.round(
      Math.min(100, Math.max(0, calibration.calibratedScore + riskPenalty))
    );

    if (calibration.offset !== 0 || riskPenalty !== 0) {
      blueprint.score = finalConfidence;
      if (blueprint.riskMap) {
        blueprint.riskMap = {
          ...blueprint.riskMap,
          opportunity: finalConfidence,
        };
      }
    }

    blueprint.confidenceDrivers = {
      baseConfidence: calibration.rawScore,
      priorOutcomesAdjustment: calibration.offset,
      similarSuccessRate: calibration.similarSuccessRate,
      riskPenalty,
      finalConfidence: blueprint.score,
      sampleSize: calibration.sampleSize,
      evidence: calibration.evidence || [],
    };

    const saved = await saveDecision({ problem, blueprint, context });

    const response: SolveResponse = {
      result: blueprint,
      decisionId: saved.id,
      memoryScore,
      networkScore,
      calibratedScore: calibration.calibratedScore,
      calibrationOffset: calibration.offset,
      calibrationSampleSize: calibration.sampleSize,
      calibrationConfidence: calibration.confidence,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while processing your decision.';
    console.error('API /api/solve error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
