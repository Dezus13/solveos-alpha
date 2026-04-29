#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outcomeLogger = readFileSync(join(root, 'components/OutcomeLogger.tsx'), 'utf8');
const simulationResults = readFileSync(join(root, 'components/SimulationResults.tsx'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  !simulationResults.includes("['Outcome better', 'Outcome expected', 'Outcome worse']"),
  'SimulationResults must not render inert outcome option divs.'
);
assert(
  simulationResults.includes('<OutcomeLogger') && simulationResults.includes('defaultOpen'),
  'SimulationResults should render the real OutcomeLogger in the Outcome Logging section.'
);
assert(
  outcomeLogger.includes("onClick={() => setChoice(c.id)}"),
  'Outcome option buttons must select state on click.'
);
assert(
  outcomeLogger.includes('onChange={(e) => setNotes(e.target.value)}'),
  'Lesson textarea must update editable notes state.'
);
assert(
  outcomeLogger.includes('onClick={handleContinue}'),
  'Record Outcome button must call the submit handler.'
);
assert(
  outcomeLogger.includes("fetch('/api/outcomes'"),
  'OutcomeLogger must submit through the existing outcome logging API.'
);

console.log('Outcome Logger interaction QA passed.');
