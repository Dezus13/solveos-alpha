import type { SupportedLanguage } from './i18n';
import {
  applySettingsToDocument,
  getSettings,
  saveSettings,
  type AccentSetting,
  type DensitySetting,
  type ThemeSetting,
} from './settingsStore';

export type UiLanguage = Exclude<SupportedLanguage, 'auto'>;
export type DecisionLanguageMode = 'detected' | 'ui' | 'custom';
export type ThemeMode = ThemeSetting;
export type AccentColor = AccentSetting;
export type DensityMode = DensitySetting;
export type NotificationLevel = 'none' | 'critical' | 'all';
export type ModelProvider = 'openai' | 'anthropic' | 'local';

export interface ProductSettings {
  general: {
    autoSave: boolean;
    advancedByDefault: boolean;
    showSuggestions: boolean;
  };
  language: {
    uiLanguage: UiLanguage;
    decisionMode: DecisionLanguageMode;
    customDecisionLanguage: UiLanguage;
  };
  appearance: {
    theme: ThemeMode;
    accent: AccentColor;
    density: DensityMode;
  };
  notifications: {
    enabled: boolean;
    level: NotificationLevel;
    reviewReminders: boolean;
    outcomePrompts: boolean;
  };
  data: {
    storeHistory: boolean;
    includeMemory: boolean;
    privateMode: boolean;
  };
  security: {
    sessionLock: boolean;
    maskApiKeys: boolean;
    provider: ModelProvider;
    apiKeyLabel: string;
  };
}

export const defaultSettings: ProductSettings = {
  general: {
    autoSave: true,
    advancedByDefault: false,
    showSuggestions: true,
  },
  language: {
    uiLanguage: 'English',
    decisionMode: 'detected',
    customDecisionLanguage: 'English',
  },
  appearance: {
    theme: 'system',
    accent: 'purple',
    density: 'balanced',
  },
  notifications: {
    enabled: true,
    level: 'critical',
    reviewReminders: true,
    outcomePrompts: true,
  },
  data: {
    storeHistory: true,
    includeMemory: true,
    privateMode: false,
  },
  security: {
    sessionLock: false,
    maskApiKeys: true,
    provider: 'openai',
    apiKeyLabel: '',
  },
};

export const SETTINGS_STORAGE_KEY = 'solveos.productSettings.v1';

export function mergeSettings(value: unknown): ProductSettings {
  if (!value || typeof value !== 'object') return defaultSettings;
  const incoming = value as Partial<ProductSettings>;
  const legacyLanguage = (incoming.language as Partial<ProductSettings['language']> & {
    selected?: SupportedLanguage;
    responseMode?: 'detected' | 'chosen';
  }) || {};
  const legacyConcrete = legacyLanguage.selected && legacyLanguage.selected !== 'auto'
    ? legacyLanguage.selected
    : defaultSettings.language.uiLanguage;

  return {
    general: { ...defaultSettings.general, ...incoming.general },
    language: {
      ...defaultSettings.language,
      ...incoming.language,
      uiLanguage: legacyLanguage.uiLanguage || legacyConcrete,
      decisionMode: legacyLanguage.decisionMode || (legacyLanguage.responseMode === 'chosen' ? 'custom' : 'detected'),
      customDecisionLanguage: legacyLanguage.customDecisionLanguage || legacyConcrete,
    },
    appearance: { ...defaultSettings.appearance, ...incoming.appearance },
    notifications: { ...defaultSettings.notifications, ...incoming.notifications },
    data: { ...defaultSettings.data, ...incoming.data },
    security: { ...defaultSettings.security, ...incoming.security },
  };
}

export function readSettings(): ProductSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return { ...(stored ? mergeSettings(JSON.parse(stored)) : defaultSettings), appearance: getSettings() };
  } catch {
    return { ...defaultSettings, appearance: getSettings() };
  }
}

export function applySettings(settings: ProductSettings): void {
  applySettingsToDocument(settings.appearance);
}

export function writeSettings(settings: ProductSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  saveSettings(settings.appearance);
}
