"use client";

import { useEffect } from 'react';
import { applySettings, readSettings } from '@/lib/settings';

export default function SettingsHydrator() {
  useEffect(() => {
    applySettings(readSettings());
  }, []);

  return null;
}
