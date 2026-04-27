import { StateGraph, START, END } from '@langchain/langgraph';
import OpenAI from 'openai';
import { 
  buildStrategistPrompt, 
  buildSkepticPrompt, 
  buildOperatorPrompt, 
  buildSynthesizerPrompt 
} from './prompts';
import { DecisionBlueprint, CouncilMetrics, ScenarioBranch } from './types';
import { getMockBlueprint } from './mocks';

// Define the state shape
interface AgentState {
  problem: string;
  language: string;
  memoryContext: string; // injected from decision history
  strategistAnalysis: string;
  skepticAnalysis: string;
  operatorAnalysis: string;
  finalBlueprint: DecisionBlueprint | null;
}

const openai = new OpenAI();

/**
 * Calculate council metrics from agent analyses
 * Measures confidence, agreement, feasibility, and debate intensity
 */
function calculateCouncilMetrics(
  strategistAnalysis: string,
  skepticAnalysis: string,
  operatorAnalysis: string
): CouncilMetrics {
  // Heuristic scoring: longer, more confident analyses score higher
  const strategistConfidence = Math.min(100, 40 + (strategistAnalysis.length / 50));
  
  // Agreement: measure of skeptic challenging strategist (simulated)
  const disagreementIndicators = ['but', 'however', 'risk', 'problem', 'fail', 'unlikely'];
  const disagreementCount = disagreementIndicators.filter(
    word => skepticAnalysis.toLowerCase().includes(word)
  ).length;
  const skepticAgreement = Math.max(-50, 50 - disagreementCount * 10);
  
  // Feasibility: measure of operator confidence in execution
  const feasibilityIndicators = ['can', 'achieve', 'implement', 'deliver', 'execute', 'timeline'];
  const feasibilityCount = feasibilityIndicators.filter(
    word => operatorAnalysis.toLowerCase().includes(word)
  ).length;
  const operatorFeasibility = Math.min(100, 30 + feasibilityCount * 15);
  
  // Consensus: average of above (normalized to 0-100)
  const consensusScore = Math.round(
    (strategistConfidence + Math.max(0, skepticAgreement) + operatorFeasibility) / 3
  );
  
  // Debate intensity: based on skeptic's pushback
  const debateIntensity = Math.min(100, Math.abs(skepticAgreement) * 2);
  
  // Extract key disagreements
  const keyDisagreements: string[] = [];
  if (skepticAgreement < -20) {
    keyDisagreements.push('Skeptic questions core assumptions');
  }
  if (operatorFeasibility < 40) {
    keyDisagreements.push('Operator flags execution complexity');
  }
  if (debateIntensity > 60) {
    keyDisagreements.push('Significant debate on risk/reward');
  }

  return {
    strategistConfidence: Math.round(strategistConfidence),
    skepticAgreement: Math.round(skepticAgreement),
    operatorFeasibility: Math.round(operatorFeasibility),
    consensusScore,
    debateIntensity: Math.round(debateIntensity),
    keyDisagreements,
    resolutionPath: buildResolutionPath(consensusScore, debateIntensity),
  };
}

/**
 * Build a resolution path based on council metrics
 */
function buildResolutionPath(consensus: number, intensity: number): string {
  if (consensus > 75) {
    return 'Strong agreement across council: Proceed with confidence.';
  } else if (consensus > 50 && intensity < 50) {
    return 'Moderate agreement with manageable risks: Pilot with safeguards.';
  } else if (consensus > 50 && intensity > 50) {
    return 'Consensus exists but significant debate: Require explicit risk acknowledgment.';
  } else {
    return 'Weak consensus: Recommend extended deliberation before commitment.';
  }
}

/**
 * Generate scenario branches for risk mapping and planning
 */
function generateScenarioBranches(score: number): ScenarioBranch[] {
  const branches: ScenarioBranch[] = [
    {
      id: 'scenario-bull',
      name: 'Bull Case (Best Execution)',
      probability: Math.round((score / 100) * 40),
      upside: 500, // 5% upside in basis points
      downside: -50,
      timeline: '6-12 months',
      description: 'Everything goes right: team executes perfectly, market tailwinds, first-mover advantage',
    },
    {
      id: 'scenario-base',
      name: 'Base Case (Plan)',
      probability: 40,
      upside: 150,
      downside: -100,
      timeline: '3-6 months',
      description: 'Normal execution with expected challenges and market headwinds',
    },
    {
      id: 'scenario-bear',
      name: 'Bear Case (Stress Test)',
      probability: 20 - Math.round((score / 100) * 15),
      upside: -200,
      downside: -800,
      timeline: '1-3 months',
      description: 'Key assumption breaks: market rejects solution, team churn, competitive response',
    },
    {
      id: 'scenario-tail',
      name: 'Tail Risk (Black Swan)',
      probability: Math.max(1, 10 - Math.round((score / 100) * 8)),
      upside: -1000,
      downside: -5000,
      timeline: 'Immediate',
      description: 'Catastrophic failure: regulatory ban, security breach, founder departure',
    },
  ];

  return branches.filter(b => b.probability > 0);
}

/**
 * Calculate risk map coordinates (opportunity vs risk)
 */
function calculateRiskMap(score: number, skepticAgreement: number): { opportunity: number; risk: number } {
  const opportunity = Math.round((score / 100) * 100); // 0-100 based on score
  const risk = Math.round(Math.max(0, 100 - (skepticAgreement + 100) / 2)); // 0-100 based on skeptic
  return { opportunity, risk };
}

// Node functions
async function detectionNode(state: AgentState): Promise<Partial<AgentState>> {
  if (state.language && state.language !== 'English') {
    return { language: state.language };
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ 
      role: 'system', 
      content: 'Identify the language of the user input. Respond with ONLY the language name in English (e.g., "Russian", "English", "Spanish", "German").' 
    }, { 
      role: 'user', 
      content: state.problem 
    }],
    temperature: 0,
  });
  const language = response.choices[0]?.message?.content?.trim() || 'English';
  return { language };
}

async function strategistNode(state: AgentState): Promise<Partial<AgentState>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: buildStrategistPrompt(state.problem, state.language, state.memoryContext || undefined) }],
    temperature: 0.7,
  });
  return { strategistAnalysis: response.choices[0]?.message?.content || '' };
}

async function skepticNode(state: AgentState): Promise<Partial<AgentState>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: buildSkepticPrompt(state.problem, state.strategistAnalysis, state.language) }],
    temperature: 0.7,
  });
  return { skepticAnalysis: response.choices[0]?.message?.content || '' };
}

async function operatorNode(state: AgentState): Promise<Partial<AgentState>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: buildOperatorPrompt(state.problem, state.strategistAnalysis, state.skepticAnalysis, state.language) }],
    temperature: 0.7,
  });
  return { operatorAnalysis: response.choices[0]?.message?.content || '' };
}

async function synthesizerNode(state: AgentState): Promise<Partial<AgentState>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: buildSynthesizerPrompt(
        state.problem,
        state.strategistAnalysis,
        state.skepticAnalysis,
        state.operatorAnalysis,
        state.language,
        state.memoryContext || undefined
      )
    }],
    temperature: 0.5,
  });
  
  const rawContent = response.choices[0]?.message?.content || '{}';
  const blueprint = JSON.parse(rawContent);
  blueprint.language = state.language;
  
  // Add enterprise features
  const council = calculateCouncilMetrics(
    state.strategistAnalysis,
    state.skepticAnalysis,
    state.operatorAnalysis
  );
  
  blueprint.council = council;
  blueprint.scenarioBranches = generateScenarioBranches(blueprint.score);
  blueprint.riskMap = calculateRiskMap(blueprint.score, council.skepticAgreement);
  
  return { finalBlueprint: blueprint };
}

// Build the graph
const workflow = new StateGraph<AgentState>({
  channels: {
    problem: { value: (_a, b) => b, default: () => '' },
    language: { value: (_a, b) => b, default: () => 'English' },
    memoryContext: { value: (_a, b) => b, default: () => '' },
    strategistAnalysis: { value: (_a, b) => b, default: () => '' },
    skepticAnalysis: { value: (_a, b) => b, default: () => '' },
    operatorAnalysis: { value: (_a, b) => b, default: () => '' },
    finalBlueprint: { value: (_a, b) => b, default: () => null },
  }
})
  .addNode('detect', detectionNode)
  .addNode('strategist', strategistNode)
  .addNode('skeptic', skepticNode)
  .addNode('operator', operatorNode)
  .addNode('synthesizer', synthesizerNode)
  .addEdge(START, 'detect')
  .addEdge('detect', 'strategist')
  .addEdge('strategist', 'skeptic')
  .addEdge('skeptic', 'operator')
  .addEdge('operator', 'synthesizer')
  .addEdge('synthesizer', END);

export const engine = workflow.compile();

export async function solveDecision(
  problem: string,
  overrideLanguage?: string,
  memoryContext?: string
): Promise<DecisionBlueprint> {
  try {
    const startLanguage = (overrideLanguage && overrideLanguage !== 'auto') ? overrideLanguage : 'English';

    const result = await engine.invoke({
      problem,
      language: startLanguage,
      memoryContext: memoryContext || '',
      strategistAnalysis: '',
      skepticAnalysis: '',
      operatorAnalysis: '',
      finalBlueprint: null
    }) as unknown as AgentState;

    if (overrideLanguage && overrideLanguage !== 'auto' && result.finalBlueprint) {
      result.finalBlueprint.language = overrideLanguage;
    }
    
    if (!result.finalBlueprint) {
      throw new Error('Engine failed to generate a final blueprint.');
    }
    
    return result.finalBlueprint;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Real Engine failed, falling back to Demo Mode:', errorMessage);
    
    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      console.warn('OPENAI QUOTA EXCEEDED: Engaging Demo Simulation Mode.');
    }
    
    const finalLanguage = (overrideLanguage && overrideLanguage !== 'auto') ? overrideLanguage : 'English';
    return getMockBlueprint(problem, finalLanguage);
  }
}
