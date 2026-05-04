import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const sidebarStore = {
  get: () => open,
  set: (v: boolean) => { open = v; emit(); },
  toggle: () => { open = !open; emit(); },
  subscribe: (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
};

export function useSidebarOpen() {
  return useSyncExternalStore(sidebarStore.subscribe, sidebarStore.get, sidebarStore.get);
}
