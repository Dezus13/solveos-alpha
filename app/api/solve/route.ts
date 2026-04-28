import { NextResponse } from 'next/server';
import { saveDecision, getDecisionHistory } from '@/lib/memory';
import { getMemoryIntelligenceFromHistory } from '@/lib/memory-graph';
import { computeNetworkIntelligence, calibrateScore, buildCalibrationContext } from '@/lib/benchmarks';
import type { CouncilMetrics, CounterfactualPath, DecisionBlueprint, DecisionContext, PreMortemRisk, ScenarioBranch, SecondOrderEffect, SolveRequest, SolveResponse } from '@/lib/types';

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

function clampScore(value: unknown, fallback = 68): number {
  const score = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function safeTextArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return items.length > 0 ? items : fallback;
}

function safePath(value: unknown, fallbackDescription: string): DecisionBlueprint['paths']['safe'] {
  const path = isRecord(value) ? value : {};
  return {
    description: safeText(path.description, fallbackDescription),
    pros: safeTextArray(path.pros, ['Keeps the decision controlled.']),
    cons: safeTextArray(path.cons, ['May leave upside unrealized.']),
  };
}

function safeProbability(value: unknown): CounterfactualPath['probability'] {
  return value === 'Low' || value === 'Medium' || value === 'High' ? value : 'Medium';
}

function safeStringList(value: unknown, fallback: string[]): string[] {
  return safeTextArray(value, fallback).slice(0, 5);
}

function defaultCouncil(): CouncilMetrics {
  return {
    strategistConfidence: 68,
    skepticAgreement: 20,
    operatorFeasibility: 65,
    consensusScore: 64,
    debateIntensity: 40,
    keyDisagreements: ['Validate assumptions before scaling commitment.'],
    resolutionPath: 'Proceed only with explicit safeguards and review points.',
  };
}

function defaultScenarioBranches(score: number): ScenarioBranch[] {
  return [
    {
      id: 'scenario-base',
      name: 'Base Case',
      probability: 45,
      upside: 150,
      downside: -100,
      timeline: '30-90 days',
      description: 'Expected execution with normal friction and measurable checkpoints.',
    },
    {
      id: 'scenario-downside',
      name: 'Downside Case',
      probability: Math.max(10, 100 - score),
      upside: -50,
      downside: -500,
      timeline: 'Immediate',
      description: 'Core assumption weakens and the decision needs a fallback path.',
    },
  ];
}

function normalizeBlueprint(value: unknown, problem: string, language: string): DecisionBlueprint {
  const blueprint = isRecord(value) ? value : {};
  const strategistView = isRecord(blueprint.strategistView) ? blueprint.strategistView : {};
  const skepticView = isRecord(blueprint.skepticView) ? blueprint.skepticView : {};
  const diagnosis = isRecord(blueprint.diagnosis) ? blueprint.diagnosis : {};
  const paths = isRecord(blueprint.paths) ? blueprint.paths : {};
  const contrarianInsight = isRecord(blueprint.contrarianInsight) ? blueprint.contrarianInsight : {};
  const futureSimulation = isRecord(blueprint.futureSimulation) ? blueprint.futureSimulation : {};
  const actionPlan = isRecord(blueprint.actionPlan) ? blueprint.actionPlan : {};
  const confidenceScore = clampScore(blueprint.confidenceScore ?? blueprint.score);
  const score = confidenceScore;
  const council = isRecord(blueprint.council) ? blueprint.council : defaultCouncil();
  const riskMap = isRecord(blueprint.riskMap) ? blueprint.riskMap : {};
  const operatorNextSteps = safeStringList(blueprint.operatorNextSteps, [
    'Define the smallest reversible test.',
    'Assign one owner and one success metric.',
    'Review evidence before scaling commitment.',
  ]);
  const counterfactualPaths = Array.isArray(blueprint.counterfactualPaths)
    ? blueprint.counterfactualPaths.filter(isRecord).map((path, index): CounterfactualPath => ({
        name: safeText(path.name, ['Proceed Now', 'Delay', 'Do Nothing'][index] || `Path ${index + 1}`),
        probability: safeProbability(path.probability),
        impact: clampScore(path.impact, 6),
        confidence: clampScore(path.confidence, score),
        likelyUpside: safeText(path.likelyUpside, ''),
        keyFailureMode: safeText(path.keyFailureMode, ''),
        reducedRisk: safeText(path.reducedRisk, ''),
        opportunityCost: safeText(path.opportunityCost, ''),
        probableDownside: safeText(path.probableDownside, ''),
        hiddenRiskAccumulation: safeText(path.hiddenRiskAccumulation, ''),
      }))
    : [];
  const preMortemRisks = Array.isArray(blueprint.preMortemRisks)
    ? blueprint.preMortemRisks.filter(isRecord).map((risk, index): PreMortemRisk => ({
        mode: safeText(risk.mode, ['Execution Failure', 'Market Assumption Failure', 'Hidden Second-Order Risk'][index] || `Risk ${index + 1}`),
        riskTrigger: safeText(risk.riskTrigger, 'The core assumption fails under real execution pressure.'),
        earlyWarningSignal: safeText(risk.earlyWarningSignal, 'Early metrics diverge from the plan.'),
        mitigationMove: safeText(risk.mitigationMove, 'Reduce scope and validate before scaling.'),
      }))
    : [];
  const secondOrderEffects = Array.isArray(blueprint.secondOrderEffects)
    ? blueprint.secondOrderEffects.filter(isRecord).map((effect, index): SecondOrderEffect => ({
        scenario: safeText(effect.scenario, ['Proceed Now', 'Delay'][index] || `Scenario ${index + 1}`),
        immediateEffect: safeText(effect.immediateEffect, 'The first-order effect becomes visible quickly.'),
        downstreamConsequence: safeText(effect.downstreamConsequence, 'Resource pressure shifts elsewhere.'),
        hiddenLongTermEffect: safeText(effect.hiddenLongTermEffect, 'The long-term cost depends on whether learning compounds.'),
      }))
    : [];
  const hiddenPain = safeText(blueprint.hiddenPain, 'The decision pressure is real, but the underlying pain needs sharper definition.');
  const strategistBiggestUpside = safeText(strategistView.biggestUpside, 'The biggest upside is capturing signal before competitors or hesitation close the window.');
  const strategistLeverageMove = safeText(strategistView.leverageMove, 'Use a staged commitment that creates evidence without overexposing the downside.');
  const skepticHiddenFlaw = safeText(skepticView.hiddenFlaw, 'The hidden flaw is assuming intent will convert into reliable behavior.');
  const skepticWhatCouldBreak = safeText(skepticView.whatCouldBreak, 'Execution quality, timing, or trust could break before the upside appears.');
  const redTeamCritique = safeText(blueprint.redTeamCritique, 'The strongest attack is that the decision may scale risk faster than learning.');
  const economistView = safeText(blueprint.economistView, 'The opportunity cost is capital, attention, and time that cannot be reused if the bet is wrong.');
  const outcomeLessonPrompt = safeText(blueprint.outcomeLessonPrompt, 'What happened after execution, and which assumption was most wrong?');

  return {
    score,
    hiddenPain,
    strategistView: {
      biggestUpside: strategistBiggestUpside,
      leverageMove: strategistLeverageMove,
    },
    skepticView: {
      hiddenFlaw: skepticHiddenFlaw,
      whatCouldBreak: skepticWhatCouldBreak,
    },
    operatorNextSteps,
    redTeamCritique,
    economistView,
    counterfactualPaths: counterfactualPaths.length > 0 ? counterfactualPaths : [
      {
        name: 'Proceed Now',
        probability: 'Medium',
        impact: 8,
        confidence: score,
        likelyUpside: strategistBiggestUpside,
        keyFailureMode: skepticWhatCouldBreak,
      },
      {
        name: 'Delay',
        probability: 'High',
        impact: 6,
        confidence: Math.max(45, score - 8),
        reducedRisk: 'More time to validate evidence before scaling commitment.',
        opportunityCost: economistView,
      },
      {
        name: 'Do Nothing',
        probability: 'High',
        impact: 9,
        confidence: Math.max(50, 100 - score),
        probableDownside: 'The window narrows while uncertainty stays unresolved.',
        hiddenRiskAccumulation: 'Inaction compounds ambiguity and slows organizational learning.',
      },
    ],
    preMortemRisks: preMortemRisks.length > 0 ? preMortemRisks : [
      {
        mode: 'Execution Failure',
        riskTrigger: skepticWhatCouldBreak,
        earlyWarningSignal: 'The first milestone slips or ownership is unclear.',
        mitigationMove: operatorNextSteps[0],
      },
      {
        mode: 'Market Assumption Failure',
        riskTrigger: skepticHiddenFlaw,
        earlyWarningSignal: 'Users do not behave as the strategy assumes.',
        mitigationMove: 'Validate the riskiest assumption before increasing exposure.',
      },
      {
        mode: 'Hidden Second-Order Risk',
        riskTrigger: redTeamCritique,
        earlyWarningSignal: 'A secondary cost appears after the first move.',
        mitigationMove: 'Install a review checkpoint and explicit stop criteria.',
      },
    ],
    secondOrderEffects: secondOrderEffects.length > 0 ? secondOrderEffects : [
      {
        scenario: 'Proceed Now',
        immediateEffect: strategistBiggestUpside,
        downstreamConsequence: skepticWhatCouldBreak,
        hiddenLongTermEffect: economistView,
      },
      {
        scenario: 'Delay',
        immediateEffect: 'Risk exposure decreases while evidence improves.',
        downstreamConsequence: 'Momentum and market timing may weaken.',
        hiddenLongTermEffect: 'The cost of waiting becomes visible only after the window moves.',
      },
    ],
    confidenceScore,
    outcomeLessonPrompt,
    recommendation: safeText(blueprint.recommendation, 'Proceed with staged validation before committing fully.'),
    diagnosis: {
      coreProblem: safeText(diagnosis.coreProblem, hiddenPain || problem),
      blindSpots: safeText(diagnosis.blindSpots, skepticHiddenFlaw),
      keyRisks: safeText(diagnosis.keyRisks, redTeamCritique),
    },
    paths: {
      safe: safePath(paths.safe, 'Delay commitment until the riskiest assumption is validated.'),
      balanced: safePath(paths.balanced, strategistLeverageMove),
      bold: safePath(paths.bold, strategistBiggestUpside),
    },
    contrarianInsight: {
      perspective: safeText(contrarianInsight.perspective, redTeamCritique),
      hiddenOpportunity: safeText(contrarianInsight.hiddenOpportunity, strategistLeverageMove),
      uncomfortableTruth: safeText(contrarianInsight.uncomfortableTruth, skepticWhatCouldBreak),
    },
    futureSimulation: {
      threeMonths: safeText(futureSimulation.threeMonths, secondOrderEffects[0]?.immediateEffect || 'In 3 months, the decision should have produced clear signal or clear stop criteria.'),
      twelveMonths: safeText(futureSimulation.twelveMonths, secondOrderEffects[0]?.hiddenLongTermEffect || 'In 12 months, the outcome depends on whether learning was captured early.'),
    },
    actionPlan: {
      today: safeText(actionPlan.today, operatorNextSteps[0]),
      thisWeek: safeText(actionPlan.thisWeek, operatorNextSteps[1] || 'Run the smallest test that can prove or disprove the core assumption.'),
      thirtyDays: safeText(actionPlan.thirtyDays, operatorNextSteps[2] || outcomeLessonPrompt),
    },
    language: safeText(blueprint.language, language || 'en'),
    isDemo: typeof blueprint.isDemo === 'boolean' ? blueprint.isDemo : undefined,
    council: {
      ...defaultCouncil(),
      ...council,
      keyDisagreements: safeTextArray(council.keyDisagreements, defaultCouncil().keyDisagreements),
    },
    riskMap: {
      opportunity: clampScore(riskMap.opportunity, score),
      risk: clampScore(riskMap.risk, 100 - score),
    },
    scenarioBranches: Array.isArray(blueprint.scenarioBranches)
      ? blueprint.scenarioBranches.filter(isRecord).map((branch, index) => ({
          id: safeText(branch.id, `scenario-${index + 1}`),
          name: safeText(branch.name, `Scenario ${index + 1}`),
          probability: clampScore(branch.probability, 25),
          upside: typeof branch.upside === 'number' ? branch.upside : 0,
          downside: typeof branch.downside === 'number' ? branch.downside : 0,
          timeline: safeText(branch.timeline, '30-90 days'),
          description: safeText(branch.description, 'Scenario requires more evidence.'),
        }))
      : defaultScenarioBranches(score),
  };
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
    const rawBlueprint = await solveDecision(problem, language, fullContext, conversationContext);
    const blueprint = normalizeBlueprint(rawBlueprint, problem, language);
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
