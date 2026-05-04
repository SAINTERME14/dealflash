import { useEffect, useState } from "react";
import { sb } from "@/integrations/supabase/untyped";
import { useAuth } from "@/hooks/useAuth";

export type AdminRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "support"
  | "marketing"
  | "accountant"
  | "hr"
  | "analyst";

export type AdminUser = {
  id: string;
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  two_fa_enabled: boolean;
  last_login_at: string | null;
};

export function useAdminUser() {
  const { user, loading: authLoading } = useAuth();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        if (!cancelled) {
          setAdmin(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await sb
        .from("admin_users")
        .select("id, user_id, role, is_active, two_fa_enabled, last_login_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (!cancelled) {
        setAdmin((data as AdminUser | null) ?? null);
        setLoading(false);
      }
    }
    if (!authLoading) {
      setLoading(true);
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return {
    admin,
    isAdmin: !!admin,
    isSuperAdmin: admin?.role === "super_admin",
    role: admin?.role ?? null,
    loading: authLoading || loading,
  };
}
