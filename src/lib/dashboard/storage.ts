import type { DashboardLayout } from "./types";
import { presetLayouts, layoutForRole, type Role } from "./presets";

const STORAGE_KEY = "frameos:dashboard:v2";

interface PersistedState {
  layouts: DashboardLayout[];
  activeId: string;
  role?: Role;
  onboarded: boolean;
}

const empty: PersistedState = {
  layouts: presetLayouts,
  activeId: presetLayouts[0].id,
  onboarded: true,
};

export function loadState(): PersistedState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.layouts?.length) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

export function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function applyRole(role: Role): PersistedState {
  const layout = layoutForRole(role);
  const state: PersistedState = {
    layouts: [layout, ...presetLayouts.filter(l => l.id !== layout.id)],
    activeId: layout.id,
    role,
    onboarded: true,
  };
  saveState(state);
  return state;
}

export type { PersistedState };
