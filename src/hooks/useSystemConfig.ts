import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/customClient";

export function useSystemConfig<T = unknown>(key: string) {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("system_config" as never)
      .select("value")
      .eq("key", key)
      .maybeSingle();
    setValue(((data as { value: T } | null)?.value as T) ?? null);
    setLoading(false);
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async (newValue: T) => {
      const { error } = await supabase
        .from("system_config" as never)
        .update({ value: newValue as never, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (!error) setValue(newValue);
      return { error };
    },
    [key]
  );

  return { value, loading, reload, update };
}
