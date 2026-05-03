"use client";

import { useEffect } from 'react';
import { applySettingsToDocument, getSettings, SETTINGS_UPDATED, type AppSettings } from '@/lib/settingsStore';

export default function SettingsHydrator() {
  useEffect(() => {
    applySettingsToDocument(getSettings());
    const handleSettingsUpdated = (event: Event) => {
      applySettingsToDocument((event as CustomEvent<AppSettings>).detail || getSettings());
    };
    window.addEventListener(SETTINGS_UPDATED, handleSettingsUpdated);
    return () => window.removeEventListener(SETTINGS_UPDATED, handleSettingsUpdated);
  }, []);

  return null;
}
