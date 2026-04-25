import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true if the current user has the right to manage internal notes
 * on seller applications (admin or B2C seller).
 * Source of truth remains the database RLS — this is just a UI hint.
 */
export function useCanManageSellerNotes() {
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        if (active) {
          setCanManage(false);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "vendeur_b2c"]);
      if (active) {
        setCanManage(!error && !!data && data.length > 0);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { canManage, loading };
}
