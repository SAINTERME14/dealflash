import { useEffect, useState, useCallback } from "react";
import { sb } from "@/integrations/supabase/untyped";

export function useSystemConfig<T = unknown>(key: string) {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await sb
      .from("system_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    setValue((data?.value as T) ?? null);
    setLoading(false);
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async (newValue: T) => {
      const { error } = await sb
        .from("system_config")
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (!error) setValue(newValue);
      return { error };
    },
    [key]
  );

  return { value, loading, reload, update };
}
