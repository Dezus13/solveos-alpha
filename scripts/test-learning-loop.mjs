#!/usr/bin/env node

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = process.cwd();
const outDir = '/private/tmp/solveos-learning-loop-test';
const outLib = join(outDir, 'lib');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outLib, { recursive: true });

for (const file of ['types.ts', 'benchmarks.ts']) {
  const source = readFileSync(join(root, 'lib', file), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  writeFileSync(join(outLib, file.replace('.ts', '.js')), output);
}

const require = createRequire(import.meta.url);
const { computeLearningResult } = require(join(outLib, 'benchmarks.js'));

function entry(outcomeStatus, scoreAccuracy, confidence = 70) {
  return {
    id: `test-${outcomeStatus}`,
    timestamp: '2026-04-29T00:00:00.000Z',
    problem: 'Should we ship this decision?',
    confidence,
    outcomeStatus,
    tags: [],
    blueprint: {
      score: confidence,
      recommendation: 'Reversible Experiment: ship only after validation.',
      diagnosis: { coreProblem: '', blindSpots: '', keyRisks: '' },
      paths: {
        safe: { description: '', pros: [], cons: [] },
        balanced: { description: '', pros: [], cons: [] },
        bold: { description: '', pros: [], cons: [] },
      },
      contrarianInsight: { perspective: '', hiddenOpportunity: '', uncomfortableTruth: '' },
      futureSimulation: { threeMonths: '', twelveMonths: '' },
      actionPlan: { today: '', thisWeek: '', thirtyDays: '' },
    },
    outcome: {
      decisionId: `test-${outcomeStatus}`,
      actualOutcome: outcomeStatus,
      scoreAccuracy,
      outcomeStatus,
      timestamp: '2026-04-29T00:00:00.000Z',
      lessons: [],
      recommendations: [],
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const better = computeLearningResult(entry('better', 88, 70));
assert(better.decisionAccuracy >= 75, 'better outcome should improve decision accuracy');
assert(better.calibrationScore > 60, 'better outcome should keep calibration positive enough to learn from');
assert(better.learningInsight.includes('beat expectations'), 'better outcome should produce positive learning insight');

const worse = computeLearningResult(entry('worse', 35, 70));
assert(worse.decisionAccuracy <= 45, 'worse outcome should lower decision accuracy');
assert(worse.calibrationScore < better.calibrationScore, 'worse outcome should lower calibration vs better outcome');
assert(worse.learningInsight.includes('underperformed'), 'worse outcome should produce underperformance insight');

const expected = computeLearningResult(entry('expected', 70, 70));
assert(expected.decisionAccuracy >= 60 && expected.decisionAccuracy <= 80, 'expected outcome should keep accuracy neutral');
assert(expected.calibrationScore === 100, 'expected outcome should keep calibration neutral');
assert(expected.learningInsight.includes('Calibration stays neutral'), 'expected outcome should produce neutral insight');

console.log('Decision Learning Loop tests passed.');
