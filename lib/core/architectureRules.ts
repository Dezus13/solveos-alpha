export type ArchitectureLayer =
  | 'input'
  | 'intent'
  | 'memory'
  | 'identity'
  | 'pressure'
  | 'execution'
  | 'risk'
  | 'orchestration'
  | 'synthesis'
  | 'debug'
  | 'output';

export type ArchitectureRuleId =
  | 'no-direct-intelligence-calls'
  | 'centralized-routing'
  | 'centralized-synthesis'
  | 'controlled-memory-access'
  | 'passive-pipeline-inspector'
  | 'deterministic-response-modules';

export type ArchitectureIssueSeverity = 'info' | 'warning' | 'critical';
export type ArchitectureHealthStatus = 'stable' | 'watch' | 'unstable';

export interface ArchitectureRule {
  id: ArchitectureRuleId;
  statement: string;
  rationale: string;
}

export interface ArchitectureModuleNode {
  id: string;
  layer: ArchitectureLayer;
  responsibilities: string[];
  calls?: string[];
  controlsRouting?: boolean;
  controlsSynthesis?: boolean;
  accessesMemory?: boolean;
  memoryAccessControlled?: boolean;
  passive?: boolean;
  deterministic?: boolean;
  escalationLevel?: 'none' | 'low' | 'medium' | 'high';
  escalationControlled?: boolean;
}

export interface ArchitectureValidationIssue {
  id: string;
  ruleId: ArchitectureRuleId;
  severity: ArchitectureIssueSeverity;
  modules: string[];
  message: string;
  recommendation: string;
}

export interface ArchitectureHealthScore {
  modularityScore: number;
  orchestrationComplexityScore: number;
  synthesisStabilityScore: number;
  pipelineSafetyScore: number;
  overallScore: number;
}

export interface SystemHealthReport {
  generatedAt: string;
  status: ArchitectureHealthStatus;
  rules: ArchitectureRule[];
  scores: ArchitectureHealthScore;
  issues: ArchitectureValidationIssue[];
  summary: string;
}

export const ARCHITECTURE_RULES: ArchitectureRule[] = [
  {
    id: 'no-direct-intelligence-calls',
    statement: 'No intelligence may directly call another intelligence.',
    rationale: 'Peer-to-peer intelligence calls create hidden ordering, duplicated diagnostics, and circular reasoning risk.',
  },
  {
    id: 'centralized-routing',
    statement: 'All routing must pass through the orchestration engine.',
    rationale: 'Intent, memory, pressure, execution, and risk signals need one authoritative priority decision.',
  },
  {
    id: 'centralized-synthesis',
    statement: 'The synthesis layer must stay centralized.',
    rationale: 'Only one module should own final framing, depth, tone, compression, and contradiction filtering.',
  },
  {
    id: 'controlled-memory-access',
    statement: 'Memory access must be controlled.',
    rationale: 'Memory should influence responses only when arbitration and orchestration allow relevance and safe callback behavior.',
  },
  {
    id: 'passive-pipeline-inspector',
    statement: 'The pipeline inspector must remain passive.',
    rationale: 'Observability can explain pipeline decisions, but it must never steer, route, or rewrite a response.',
  },
  {
    id: 'deterministic-response-modules',
    statement: 'Response modules must stay deterministic.',
    rationale: 'Final response behavior should come from normalized decisions, not competing ad hoc module side effects.',
  },
];

export const DEFAULT_ARCHITECTURE_MODULES: ArchitectureModuleNode[] = [
  {
    id: 'intent-differentiation',
    layer: 'intent',
    responsibilities: ['intent classification'],
    calls: [],
    deterministic: true,
    escalationLevel: 'low',
    escalationControlled: true,
  },
  {
    id: 'memory-decay',
    layer: 'memory',
    responsibilities: ['memory relevance'],
    calls: [],
    accessesMemory: true,
    memoryAccessControlled: true,
    deterministic: true,
    escalationLevel: 'low',
    escalationControlled: true,
  },
  {
    id: 'identity-kernel',
    layer: 'identity',
    responsibilities: ['identity stability'],
    calls: [],
    deterministic: true,
    escalationLevel: 'medium',
    escalationControlled: true,
  },
  {
    id: 'pressure-engine',
    layer: 'pressure',
    responsibilities: ['pressure evaluation'],
    calls: [],
    deterministic: true,
    escalationLevel: 'medium',
    escalationControlled: true,
  },
  {
    id: 'energy-state-intelligence',
    layer: 'execution',
    responsibilities: ['execution state'],
    calls: [],
    deterministic: true,
    escalationLevel: 'medium',
    escalationControlled: true,
  },
  {
    id: 'trust-calibration',
    layer: 'risk',
    responsibilities: ['risk calibration'],
    calls: [],
    deterministic: true,
    escalationLevel: 'high',
    escalationControlled: true,
  },
  {
    id: 'intelligence-arbitration',
    layer: 'orchestration',
    responsibilities: ['pre-orchestration arbitration'],
    calls: [],
    controlsRouting: false,
    deterministic: true,
    escalationLevel: 'medium',
    escalationControlled: true,
  },
  {
    id: 'orchestration-engine',
    layer: 'orchestration',
    responsibilities: ['centralized routing', 'intelligence activation', 'conflict prevention'],
    calls: [],
    controlsRouting: true,
    deterministic: true,
    escalationLevel: 'high',
    escalationControlled: true,
  },
  {
    id: 'response-synthesizer',
    layer: 'synthesis',
    responsibilities: ['centralized synthesis', 'response framing', 'response depth'],
    calls: [],
    controlsSynthesis: true,
    deterministic: true,
    escalationLevel: 'medium',
    escalationControlled: true,
  },
  {
    id: 'self-evaluation',
    layer: 'output',
    responsibilities: ['private quality pass'],
    calls: [],
    deterministic: true,
    escalationLevel: 'low',
    escalationControlled: true,
  },
  {
    id: 'pipeline-inspector',
    layer: 'debug',
    responsibilities: ['pipeline observability'],
    calls: [],
    passive: true,
    deterministic: true,
    escalationLevel: 'none',
    escalationControlled: true,
  },
];

function issue(
  ruleId: ArchitectureRuleId,
  severity: ArchitectureIssueSeverity,
  modules: string[],
  message: string,
  recommendation: string,
): ArchitectureValidationIssue {
  return {
    id: `${ruleId}:${modules.join('+') || 'system'}`,
    ruleId,
    severity,
    modules,
    message,
    recommendation,
  };
}

function moduleIds(modules: ArchitectureModuleNode[]): Set<string> {
  return new Set(modules.map((item) => item.id));
}

function isIntelligence(node: ArchitectureModuleNode): boolean {
  return !['orchestration', 'synthesis', 'debug', 'input', 'output'].includes(node.layer);
}

function findCycles(modules: ArchitectureModuleNode[]): string[][] {
  const ids = moduleIds(modules);
  const graph = new Map(modules.map((item) => [item.id, (item.calls ?? []).filter((target) => ids.has(target))]));
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string, path: string[]) => {
    if (visiting.has(id)) {
      const start = path.indexOf(id);
      if (start >= 0) cycles.push([...path.slice(start), id]);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of graph.get(id) ?? []) {
      visit(next, [...path, next]);
    }
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of graph.keys()) {
    visit(id, [id]);
  }

  return cycles;
}

export function detectCircularOrchestration(modules: ArchitectureModuleNode[]): ArchitectureValidationIssue[] {
  return findCycles(modules).map((cycle) => issue(
    'centralized-routing',
    'critical',
    Array.from(new Set(cycle)),
    `Circular orchestration path detected: ${cycle.join(' -> ')}.`,
    'Break the cycle and move routing ownership back to orchestration-engine.',
  ));
}

export function detectDuplicatedResponsibility(modules: ArchitectureModuleNode[]): ArchitectureValidationIssue[] {
  const owners = new Map<string, string[]>();
  for (const node of modules) {
    for (const responsibility of node.responsibilities) {
      const key = responsibility.toLowerCase();
      owners.set(key, [...(owners.get(key) ?? []), node.id]);
    }
  }

  return Array.from(owners.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([responsibility, ids]) => issue(
      'no-direct-intelligence-calls',
      'warning',
      ids,
      `Duplicated responsibility detected: "${responsibility}".`,
      'Assign one owner and convert the other modules into signal providers or suppressed supporting frames.',
    ));
}

export function detectConflictingSynthesisAuthority(modules: ArchitectureModuleNode[]): ArchitectureValidationIssue[] {
  const synthesisOwners = modules.filter((node) => node.controlsSynthesis).map((node) => node.id);
  if (synthesisOwners.length <= 1) return [];
  return [
    issue(
      'centralized-synthesis',
      'critical',
      synthesisOwners,
      'Multiple modules claim final synthesis authority.',
      'Keep response-synthesizer as the only synthesis authority and downgrade other modules to input signals.',
    ),
  ];
}

export function detectUncontrolledEscalation(modules: ArchitectureModuleNode[]): ArchitectureValidationIssue[] {
  return modules
    .filter((node) => node.escalationLevel === 'high' && !node.escalationControlled)
    .map((node) => issue(
      'centralized-routing',
      'critical',
      [node.id],
      `${node.id} can escalate without orchestration control.`,
      'Route escalation through orchestration-engine and require an explicit priority/confidence decision.',
    ));
}

export function detectRecursiveOrchestrationLoops(modules: ArchitectureModuleNode[]): ArchitectureValidationIssue[] {
  const byId = new Map(modules.map((node) => [node.id, node]));
  const orchestrator = byId.get('orchestration-engine');
  if (!orchestrator) {
    return [
      issue(
        'centralized-routing',
        'critical',
        ['orchestration-engine'],
        'No orchestration-engine module is registered.',
        'Register a single orchestration-engine as the authoritative routing owner.',
      ),
    ];
  }

  const orchestratorCalls = new Set(orchestrator.calls ?? []);
  return modules
    .filter((node) => node.id !== 'orchestration-engine')
    .filter((node) => (node.calls ?? []).includes('orchestration-engine') && orchestratorCalls.has(node.id))
    .map((node) => issue(
      'centralized-routing',
      'critical',
      ['orchestration-engine', node.id],
      `Recursive orchestration loop detected between orchestration-engine and ${node.id}.`,
      'Keep orchestration one-way: modules may provide signals, but must not call the orchestrator during routing.',
    ));
}

export function detectArchitectureRuleViolations(modules: ArchitectureModuleNode[]): ArchitectureValidationIssue[] {
  const directIntelligenceCalls = modules.flatMap((node) => {
    if (!isIntelligence(node)) return [];
    const directCalls = modules.filter((target) => (node.calls ?? []).includes(target.id) && isIntelligence(target));
    return directCalls.map((target) => issue(
      'no-direct-intelligence-calls',
      'critical',
      [node.id, target.id],
      `${node.id} directly calls intelligence ${target.id}.`,
      'Move the dependency into orchestration-engine activation and pass normalized signals instead.',
    ));
  });
  const routingOwners = modules.filter((node) => node.controlsRouting).map((node) => node.id);
  const routingIssues = routingOwners.length === 1 && routingOwners[0] === 'orchestration-engine'
    ? []
    : [
      issue(
        'centralized-routing',
        'critical',
        routingOwners.length ? routingOwners : ['orchestration-engine'],
        'Routing authority is not centralized in orchestration-engine.',
        'Keep exactly one routing owner: orchestration-engine.',
      ),
    ];
  const memoryIssues = modules
    .filter((node) => node.accessesMemory && !node.memoryAccessControlled)
    .map((node) => issue(
      'controlled-memory-access',
      'warning',
      [node.id],
      `${node.id} accesses memory without a controlled relevance gate.`,
      'Require arbitration/orchestration approval before memory affects visible response framing.',
    ));
  const inspectorIssues = modules
    .filter((node) => node.id === 'pipeline-inspector' && !node.passive)
    .map((node) => issue(
      'passive-pipeline-inspector',
      'critical',
      [node.id],
      'pipeline-inspector is not marked passive.',
      'Inspector must only record sanitized events and must not modify routing, synthesis, or output.',
    ));
  const deterministicIssues = modules
    .filter((node) => ['synthesis', 'output'].includes(node.layer) && node.deterministic === false)
    .map((node) => issue(
      'deterministic-response-modules',
      'warning',
      [node.id],
      `${node.id} is a response module without deterministic behavior.`,
      'Use normalized orchestration/synthesis decisions instead of ad hoc response side effects.',
    ));

  return [
    ...directIntelligenceCalls,
    ...routingIssues,
    ...detectCircularOrchestration(modules),
    ...detectDuplicatedResponsibility(modules),
    ...detectConflictingSynthesisAuthority(modules),
    ...detectUncontrolledEscalation(modules),
    ...detectRecursiveOrchestrationLoops(modules),
    ...memoryIssues,
    ...inspectorIssues,
    ...deterministicIssues,
  ];
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function penaltyFor(issue: ArchitectureValidationIssue): number {
  if (issue.severity === 'critical') return 18;
  if (issue.severity === 'warning') return 8;
  return 2;
}

export function scoreArchitectureHealth(
  issues: ArchitectureValidationIssue[],
  modules: ArchitectureModuleNode[],
): ArchitectureHealthScore {
  const penalty = (ruleIds: ArchitectureRuleId[]) => issues
    .filter((item) => ruleIds.includes(item.ruleId))
    .reduce((total, item) => total + penaltyFor(item), 0);
  const moduleCountPenalty = Math.max(0, modules.length - 16) * 2;
  const modularityScore = clampScore(100 - penalty(['no-direct-intelligence-calls']) - moduleCountPenalty);
  const orchestrationComplexityScore = clampScore(100 - penalty(['centralized-routing']) - moduleCountPenalty);
  const synthesisStabilityScore = clampScore(100 - penalty(['centralized-synthesis', 'deterministic-response-modules']));
  const pipelineSafetyScore = clampScore(100 - penalty(['controlled-memory-access', 'passive-pipeline-inspector']));
  const overallScore = clampScore(
    (modularityScore + orchestrationComplexityScore + synthesisStabilityScore + pipelineSafetyScore) / 4,
  );

  return {
    modularityScore,
    orchestrationComplexityScore,
    synthesisStabilityScore,
    pipelineSafetyScore,
    overallScore,
  };
}

function statusFor(score: number, issues: ArchitectureValidationIssue[]): ArchitectureHealthStatus {
  if (issues.some((item) => item.severity === 'critical') || score < 70) return 'unstable';
  if (issues.length > 0 || score < 90) return 'watch';
  return 'stable';
}

export function buildSystemHealthReport(
  modules: ArchitectureModuleNode[] = DEFAULT_ARCHITECTURE_MODULES,
): SystemHealthReport {
  const issues = detectArchitectureRuleViolations(modules);
  const scores = scoreArchitectureHealth(issues, modules);
  const status = statusFor(scores.overallScore, issues);
  const criticalCount = issues.filter((item) => item.severity === 'critical').length;
  const warningCount = issues.filter((item) => item.severity === 'warning').length;

  return {
    generatedAt: new Date().toISOString(),
    status,
    rules: ARCHITECTURE_RULES,
    scores,
    issues,
    summary: `Architecture health is ${status}: ${scores.overallScore}/100 overall, ${criticalCount} critical issue(s), ${warningCount} warning(s).`,
  };
}
