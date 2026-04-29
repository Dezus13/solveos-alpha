import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const i18n = readFileSync(join(root, 'lib/i18n.ts'), 'utf8');
const settings = readFileSync(join(root, 'lib/settings.ts'), 'utf8');
const home = readFileSync(join(root, 'components/HomeExperience.tsx'), 'utf8');
const modal = readFileSync(join(root, 'components/SettingsModal.tsx'), 'utf8');
const consoleUi = readFileSync(join(root, 'components/DecisionConsole.tsx'), 'utf8');

function fail(message) {
  throw new Error(message);
}

for (const language of ['English', 'German', 'Russian', 'Arabic', 'Spanish', 'Chinese']) {
  if (!i18n.includes(`${language}: {`)) fail(`Missing UI copy for ${language}`);
}

for (const key of ['onboardingTitle', 'composerPlaceholder', 'verdict', 'reasoningHeading', 'redTeamChallenge']) {
  if (!i18n.includes(key)) fail(`Missing i18n key: ${key}`);
}

for (const field of ['uiLanguage', 'decisionMode', 'customDecisionLanguage']) {
  if (!settings.includes(field)) fail(`Settings must include separate language field: ${field}`);
}

if (!home.includes('detectInputLanguage(message)') || !home.includes('settings.language.decisionMode')) {
  fail('HomeExperience must route response language through detection/settings.');
}

if (!home.includes('settings.language.uiLanguage') || !home.includes('settings.language.customDecisionLanguage')) {
  fail('UI language and custom decision language must be independent.');
}

if (!home.includes('SETTINGS_STORAGE_KEY') || !home.includes('window.localStorage.setItem')) {
  fail('Settings must persist to localStorage.');
}

for (const section of ['general', 'language', 'appearance', 'notifications', 'data', 'security']) {
  if (!modal.includes(`id: '${section}'`) && !modal.includes(`activeTab === '${section}'`)) {
    fail(`Settings section is not functional: ${section}`);
  }
}

for (const control of ['Export conversations', 'Delete history', 'Session lock', 'Model provider', 'UI Language', 'Decision Language', 'Always use UI language', 'Custom language']) {
  if (!modal.includes(control)) fail(`Missing settings control: ${control}`);
}

if (!modal.includes('settings.language.uiLanguage') || !modal.includes('settings.language.customDecisionLanguage')) {
  fail('Settings modal must render separate UI and decision language controls.');
}

if (!consoleUi.includes('copy.onboardingTitle') || !consoleUi.includes('copy.suggestions')) {
  fail('DecisionConsole must use localized onboarding and starter prompts.');
}

console.log('Settings i18n QA passed.');
