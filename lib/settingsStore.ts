export type ThemeSetting = 'system' | 'dark' | 'midnight';
export type AccentSetting = 'purple' | 'blue' | 'emerald' | 'rose';
export type DensitySetting = 'compact' | 'balanced' | 'calm';

export interface AppSettings {
  theme: ThemeSetting;
  accent: AccentSetting;
  density: DensitySetting;
}

export const SETTINGS_STORAGE_KEY = 'solveos_settings';
export const SETTINGS_UPDATED = 'solveos-settings-updated';

export const defaultAppSettings: AppSettings = {
  theme: 'system',
  accent: 'purple',
  density: 'balanced',
};

const themeValues = new Set<ThemeSetting>(['system', 'dark', 'midnight']);
const accentValues = new Set<AccentSetting>(['purple', 'blue', 'emerald', 'rose']);
const densityValues = new Set<DensitySetting>(['compact', 'balanced', 'calm']);

function normalizeSettings(value: unknown): AppSettings {
  const incoming = value && typeof value === 'object' ? value as Partial<AppSettings> : {};
  return {
    theme: themeValues.has(incoming.theme as ThemeSetting) ? incoming.theme as ThemeSetting : defaultAppSettings.theme,
    accent: accentValues.has(incoming.accent as AccentSetting) ? incoming.accent as AccentSetting : defaultAppSettings.accent,
    density: densityValues.has(incoming.density as DensitySetting) ? incoming.density as DensitySetting : defaultAppSettings.density,
  };
}

function readLegacyAppearance(): Partial<AppSettings> {
  try {
    const raw = window.localStorage.getItem('solveos.productSettings.v1');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { appearance?: Partial<AppSettings> };
    return parsed.appearance || {};
  } catch {
    return {};
  }
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultAppSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return normalizeSettings(JSON.parse(raw));
    return normalizeSettings(readLegacyAppearance());
  } catch {
    return defaultAppSettings;
  }
}

export function applySettingsToDocument(settings: AppSettings = getSettings()): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.accent = settings.accent;
  document.documentElement.dataset.density = settings.density;
}

export function saveSettings(settings: AppSettings): AppSettings {
  const next = normalizeSettings(settings);
  if (typeof window === 'undefined') return next;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  applySettingsToDocument(next);
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED, { detail: next }));
  return next;
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  return saveSettings({ ...getSettings(), ...patch });
}
