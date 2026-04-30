export interface SavedDecision {
  id: string;
  question: string;
  verdict: string;
  confidence?: number;
  keyRisks: string[];
  timestamp: string;
  status: 'pending' | 'worked' | 'failed';
  lesson?: string;
  forcedAction?: string;
  followedForcedAction?: boolean;
}

const STORAGE_KEY = 'solveos_saved_decisions';

export function getSavedDecisions(): SavedDecision[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDecision(decision: SavedDecision): void {
  const existing = getSavedDecisions();
  const withoutDupe = existing.filter((d) => d.id !== decision.id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([decision, ...withoutDupe]));
}

export function updateDecision(
  id: string,
  patch: Partial<Pick<SavedDecision, 'status' | 'lesson' | 'followedForcedAction'>>,
): void {
  const existing = getSavedDecisions();
  const updated = existing.map((d) => (d.id === id ? { ...d, ...patch } : d));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function isDecisionSaved(id: string): boolean {
  return getSavedDecisions().some((d) => d.id === id);
}
