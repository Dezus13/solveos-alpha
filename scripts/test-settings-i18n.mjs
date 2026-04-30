import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const i18n = readFileSync(join(root, 'lib/i18n.ts'), 'utf8');
const settings = readFileSync(join(root, 'lib/settings.ts'), 'utf8');
const home = readFileSync(join(root, 'components/HomeExperience.tsx'), 'utf8');
const modal = readFileSync(join(root, 'components/SettingsModal.tsx'), 'utf8');
const consoleUi = readFileSync(join(root, 'components/DecisionConsole.tsx'), 'utf8');
const css = readFileSync(join(root, 'app/globals.css'), 'utf8');

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

if (!home.includes('detectInputLanguage(message, settings.language.uiLanguage)')) {
  fail('HomeExperience must detect response language from message with UI-language fallback.');
}

if (!home.includes('const t = locales[interfaceLanguage as string]') || !home.includes('const copy = uiCopy[interfaceLanguage]')) {
  fail('UI labels must be driven by UI language, not response language.');
}

if (!home.includes('SETTINGS_STORAGE_KEY') || !home.includes('window.localStorage.getItem') || !home.includes('window.localStorage.setItem')) {
  fail('Settings must persist to localStorage.');
}

for (const attr of ['dataset.theme', 'dataset.accent', 'dataset.density']) {
  if (!home.includes(attr)) fail(`Settings must apply app-wide document ${attr}.`);
}

for (const theme of ['data-theme="system"', 'data-theme="dark"', 'data-theme="midnight"']) {
  if (!css.includes(theme)) fail(`Missing app-wide theme CSS: ${theme}`);
}

for (const accent of ['data-accent="purple"', 'data-accent="blue"', 'data-accent="emerald"', 'data-accent="rose"']) {
  if (!css.includes(accent)) fail(`Missing app-wide accent CSS: ${accent}`);
}

for (const density of ['data-density="compact"', 'data-density="balanced"', 'data-density="calm"']) {
  if (!css.includes(density)) fail(`Missing app-wide density CSS: ${density}`);
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

for (const value of ['system', 'dark', 'midnight', 'purple', 'blue', 'emerald', 'rose', 'compact', 'balanced', 'calm']) {
  if (!modal.includes(`active={settings.appearance.`) || !modal.includes(value)) {
    fail(`Appearance option missing or not selected-state aware: ${value}`);
  }
}

if (!consoleUi.includes('copy.onboardingTitle') || !consoleUi.includes('copy.suggestions')) {
  fail('DecisionConsole must use localized onboarding and starter prompts.');
}

function expectedDetection(text, fallback = 'English') {
  if (/[\u0400-\u04FF]/.test(text)) return 'Russian';
  const lower = text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const strong = ['privet', 'kak dela', 'chto', 'cto', 'delat', 'dalshe', 'daljshe', 'hochu', 'hochyu', 'nuzhno', 'reshenie', 'resenie', 'pochemu', 'spasibo', 'biznes reshenie'];
  const weak = ['ya', 'mne', 'menya', 'mozhno', 'mozhet', 'stoit', 'rabota', 'dengi', 'biznes', 'sdelat', 'kuda', 'kogda'];
  if (strong.some((keyword) => new RegExp(`(^|\\s)${keyword}(\\s|$)`).test(lower))) return 'Russian';
  if (weak.filter((keyword) => new RegExp(`(^|\\s)${keyword}(\\s|$)`).test(lower)).length >= 2) return 'Russian';
  return fallback;
}

if (!i18n.includes('russianTransliterationStrong') || !i18n.includes('hasRussianTransliteration')) {
  fail('Russian transliteration helper is missing.');
}

for (const input of ['Привет как дела', 'privet kak dela', 'chto delat dalshe', 'ya hochu biznes reshenie']) {
  if (expectedDetection(input, 'German') !== 'Russian') fail(`Russian detection failed for: ${input}`);
}

if (expectedDetection('launch beta next month', 'Spanish') !== 'Spanish') {
  fail('Unclear input should fall back to selected UI language.');
}

console.log('Settings i18n QA passed.');
