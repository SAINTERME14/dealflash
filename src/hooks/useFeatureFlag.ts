import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";

type FlagRow = { key: string; enabled: boolean };

const cache = new Map<string, boolean>();
const listeners = new Set<() => void>();

async function loadAll() {
  const { data } = await supabase.from("feature_flags").select("key, enabled");
  cache.clear();
  (data ?? []).forEach((r: FlagRow) => cache.set(r.key, r.enabled));
  listeners.forEach((l) => l());
}

let loaded = false;
function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  loadAll();
  supabase
    .channel("feature_flags-rt")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "feature_flags" },
      () => loadAll()
    )
    .subscribe();
}

export function useFeatureFlag(key: string, fallback = false): boolean {
  ensureLoaded();
  const [value, setValue] = useState<boolean>(cache.get(key) ?? fallback);
  useEffect(() => {
    const cb = () => setValue(cache.get(key) ?? fallback);
    listeners.add(cb);
    cb();
    return () => {
      listeners.delete(cb);
    };
  }, [key, fallback]);
  return value;
}

export async function setFeatureFlag(key: string, enabled: boolean) {
  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled })
    .eq("key", key);
  if (error) throw error;
  await loadAll();
}

export function useAllFeatureFlags() {
  ensureLoaded();
  const [list, setList] = useState<FlagRow[]>([]);
  useEffect(() => {
    const cb = () =>
      setList(
        Array.from(cache.entries())
          .map(([key, enabled]) => ({ key, enabled }))
          .sort((a, b) => a.key.localeCompare(b.key))
      );
    listeners.add(cb);
    cb();
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return list;
}
