import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";

export function useIsSuperAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) {
        if (!cancelled) {
          setIsSuperAdmin(false);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setIsSuperAdmin(!error && !!data);
        setLoading(false);
      }
    }
    if (!authLoading) {
      setLoading(true);
      check();
    }
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isSuperAdmin, loading: authLoading || loading };
}
