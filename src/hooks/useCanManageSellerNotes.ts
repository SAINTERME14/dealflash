import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns true if the current user has the right to manage internal notes
 * on seller applications (admin, B2C seller, or moderator).
 * Source of truth remains the database RLS — this is just a UI hint.
 *
 * IMPORTANT: on transient query errors we keep the previous value instead of
 * flipping to `false`, otherwise the route guard would redirect the user and
 * make it look like a logout.
 */
export function useCanManageSellerNotes() {
  const { user, loading: authLoading } = useAuth();
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkPermissions() {
      if (!user) {
        if (active) {
          setCanManage(false);
          setErrored(false);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "vendeur_b2c", "moderateur"]);

      if (!active) return;

      if (error) {
        // Do NOT downgrade permissions on transient errors — keep last value.
        console.warn("useCanManageSellerNotes: query error", error);
        setErrored(true);
      } else {
        setCanManage(!!data && data.length > 0);
        setErrored(false);
      }
      setLoading(false);
    }

    if (!authLoading) {
      setLoading(true);
      void checkPermissions();
    }

    return () => {
      active = false;
    };
    // Depend on user id (stable) instead of user object (new ref on every refresh).
  }, [user?.id, authLoading]);

  return { canManage, loading: authLoading || loading, errored };
}
