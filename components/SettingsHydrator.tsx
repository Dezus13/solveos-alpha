"use client";

import { useEffect } from 'react';
import { applySettingsToDocument, getSettings } from '@/lib/settingsStore';

export default function SettingsHydrator() {
  useEffect(() => {
    applySettingsToDocument(getSettings());
  }, []);

  return null;
}
