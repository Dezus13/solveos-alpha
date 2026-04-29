import type { SupportedLanguage } from './i18n';

export type UiLanguage = Exclude<SupportedLanguage, 'auto'>;
export type DecisionLanguageMode = 'detected' | 'ui' | 'custom';
export type ThemeMode = 'system' | 'dark' | 'midnight';
export type AccentColor = 'purple' | 'blue' | 'emerald' | 'rose';
export type DensityMode = 'compact' | 'balanced' | 'calm';
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
    theme: 'midnight',
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
