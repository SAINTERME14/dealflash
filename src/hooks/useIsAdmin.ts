import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!cancelled) {
          if (error) {
            console.error("useIsAdmin error:", error);
            setIsAdmin(false);
          } else {
            setIsAdmin(!!data);
          }
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      setLoading(true);
      void check();
    }
    return () => {
      cancelled = true;
    };
    // Depend on user id (stable) instead of user object (new ref on every token refresh).
  }, [user?.id, authLoading]);

  return { isAdmin, loading: authLoading || loading };
}
