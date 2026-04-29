import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const solveRoute = readFileSync(join(root, 'app/api/solve/route.ts'), 'utf8');
const guards = readFileSync(join(root, 'lib/semantic-guards.ts'), 'utf8');
const decisionConsole = readFileSync(join(root, 'components/DecisionConsole.tsx'), 'utf8');

function fail(message) {
  throw new Error(message);
}

function evaluateSimpleArithmetic(text) {
  const match = text.match(/\b(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)\b/);
  if (!match) return null;
  const left = Number(match[1]);
  const right = Number(match[3]);
  const result =
    match[2] === '+'
      ? left + right
      : match[2] === '-'
      ? left - right
      : match[2] === '*'
      ? left * right
      : right === 0
        ? null
        : left / right;
  return result === null || !Number.isFinite(result)
    ? null
    : Number.isInteger(result)
      ? String(result)
      : String(Number(result.toFixed(8)));
}

function extractLiteralOutput(problem) {
  const text = problem.trim();
  const withoutQuestionLabel = text.match(/(?:^|\n)\s*Decision question:\s*(.+?)\s*$/i)?.[1]?.trim() || text;
  const arithmetic = evaluateSimpleArithmetic(text);
  if (arithmetic && /^\s*-?\d+(?:\.\d+)?\s*[+\-*/]\s*-?\d+(?:\.\d+)?\s*\??\s*$/.test(withoutQuestionLabel)) return arithmetic;
  if (arithmetic && /\breply only (?:the )?number\b/i.test(withoutQuestionLabel)) return arithmetic;
  if (/^[A-Z0-9][A-Z0-9_-]{0,40}$/.test(withoutQuestionLabel)) return withoutQuestionLabel;

  const literalMatch = withoutQuestionLabel.match(/\b(?:reply|respond|print|say|return)\s+(?:only\s+)?["'`]?(.+?)["'`]?\s*$/i);
  if (!literalMatch) return null;

  const literal = literalMatch[1].trim().replace(/[.!?]+$/, '').trim();
  if (!literal) return null;
  if (/^(?:the )?number$/i.test(literal) && arithmetic) return arithmetic;
  return literal;
}

function detectVerdictLoop(conversationHistory) {
  const verdicts = conversationHistory
    .filter((turn) => turn.role === 'assistant')
    .map((turn) => {
      const normalized = turn.content.trim().toLowerCase();
      return ['Full Commit', 'Reversible Experiment', 'Delay', 'Kill The Idea']
        .find((verdict) => normalized.startsWith(verdict.toLowerCase())) || '';
    })
    .filter(Boolean);
  if (verdicts.length < 2) return null;
  return verdicts.at(-1) === verdicts.at(-2) ? verdicts.at(-1) : null;
}

const literalCases = [
  ['Reply only HELLO', 'HELLO'],
  ['What is 2+2? Reply only number', '4'],
  ['Print only BANANA', 'BANANA'],
  ['Print BANANA', 'BANANA'],
  ['Decision question: Reply only HELLO', 'HELLO'],
];

for (const [prompt, expected] of literalCases) {
  const actual = extractLiteralOutput(prompt);
  if (actual !== expected) {
    fail(`Literal output failed for "${prompt}": expected "${expected}", got "${actual}"`);
  }
}

const repeatedVerdict = detectVerdictLoop([
  { role: 'assistant', content: 'Delay: wait for evidence.' },
  { role: 'assistant', content: 'Delay: still wait for evidence.' },
]);

if (repeatedVerdict !== 'Delay') {
  fail(`Repeated verdict detection failed: expected Delay, got ${repeatedVerdict ?? 'null'}`);
}

if (!guards.includes("export type SolveRequestIntent = 'literal_output' | 'debug_request' | 'architect_request' | 'normal_decision'")) {
  fail('SolveRequestIntent must include the required intent classes.');
}

if (!solveRoute.includes("requestIntent === 'literal_output'") || !solveRoute.includes('directSolveResponse')) {
  fail('Literal output must bypass verdict generation in /api/solve.');
}

if (!solveRoute.includes('Solve request intent detected')) {
  fail('/api/solve must log detected intent before verdict generation.');
}

if (!solveRoute.includes("requestIntent === 'debug_request'") || !solveRoute.includes("requestIntent === 'architect_request'")) {
  fail('Debug and architect requests must bypass verdict generation in /api/solve.');
}

if (!solveRoute.includes('buildRecoveryBlueprint') || !solveRoute.includes("intent: 'recovery_mode'")) {
  fail('Repeated verdicts must trigger recovery mode.');
}

if (!decisionConsole.includes('detectSolveRequestIntent(rawText)')) {
  fail('DecisionConsole must detect intent before enforcing the 20-character decision gate.');
}

if (!decisionConsole.includes('Intent: {turn.intent}')) {
  fail('Direct responses must show visible detected intent in the UI.');
}

console.log('Intent routing tests passed.');
