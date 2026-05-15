import { useSyncExternalStore } from "react";
import type { AccountRole } from "@/hooks/useUserRoles";

const STORAGE_KEY = "boardeal:active-role";

function readInitial(): AccountRole | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? (v as AccountRole) : null;
  } catch {
    return null;
  }
}

let active: AccountRole | null = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const activeRoleStore = {
  get: () => active,
  set: (v: AccountRole | null) => {
    active = v;
    try {
      if (v) localStorage.setItem(STORAGE_KEY, v);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    emit();
  },
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};

export function useActiveRole(): AccountRole | null {
  return useSyncExternalStore(activeRoleStore.subscribe, activeRoleStore.get, activeRoleStore.get);
}
