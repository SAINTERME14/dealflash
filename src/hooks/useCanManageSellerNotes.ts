import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns true if the current user has the right to manage internal notes
 * on seller applications (admin or B2C seller).
 * Source of truth remains the database RLS — this is just a UI hint.
 */
export function useCanManageSellerNotes() {
  const { user, loading: authLoading } = useAuth();
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkPermissions() {
      if (!user) {
        if (active) {
          setCanManage(false);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "vendeur_b2c"]);

      if (active) {
        setCanManage(!error && !!data && data.length > 0);
        setLoading(false);
      }
    }

    if (!authLoading) {
      setLoading(true);
      void checkPermissions();
    }

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return { canManage, loading: authLoading || loading };
}
