import type { DecisionBlueprint } from './types';

function sourceText(problem: string | undefined, blueprint?: DecisionBlueprint): string {
  return [
    problem,
    blueprint?.recommendation,
    blueprint?.diagnosis?.coreProblem,
    blueprint?.actionPlan?.today,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function costOfInaction(problem?: string, blueprint?: DecisionBlueprint): string {
  const text = sourceText(problem, blueprint);

  if (/\b(launch|ship|release|beta|product|users?)\b/.test(text)) {
    return 'No launch -> no validation -> wasted time';
  }
  if (/\b(customer|client|sales|revenue|sell|market)\b/.test(text)) {
    return 'No outreach -> no signal -> no revenue';
  }
  if (/\b(job|career|quit|role|offer|promotion|work)\b/.test(text)) {
    return 'No move -> no leverage -> same position';
  }
  if (/\b(hire|team|delegate|operator|capacity)\b/.test(text)) {
    return 'No owner -> no execution -> no result';
  }
  if (/\b(validate|test|experiment|interview|feedback)\b/.test(text)) {
    return 'No test -> no feedback -> no clarity';
  }
  if (/\b(invest|money|fund|budget|capital)\b/.test(text)) {
    return 'No action -> no data -> bad capital allocation';
  }

  return 'No action -> no feedback -> no growth';
}

export function delayPainLine(streak: number): string {
  if (streak > 0) return 'You are breaking your own streak';
  return 'Delay = lost momentum';
}

export function skipPainLine(): string {
  return 'You are choosing comfort over progress';
}
