import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/NotFound";

/**
 * Garde du panel admin v2.
 * - Pas authentifié OU pas dans admin_users actif → 404 (on ne révèle rien).
 * - Si non super_admin et 2FA non activé → redirection /admin/v2/securite/2fa (sauf si déjà sur cette page).
 */
export function AdminV2Route({ children }: { children: ReactNode }) {
  const { admin, isAdmin, isSuperAdmin, loading } = useAdminUser();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin || !admin) return <NotFound />;

  // 2FA obligatoire sauf super_admin
  const on2faSetup = pathname.startsWith("/admin/v2/securite/2fa");
  if (!isSuperAdmin && !admin.two_fa_enabled && !on2faSetup) {
    window.location.replace("/admin/v2/securite/2fa");
    return null;
  }

  return <>{children}</>;
}
