import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useUserRoles, type AccountRole } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  /** Au moins un de ces rôles doit être présent dans le compte. */
  roles: AccountRole[];
  /** Optionnel : passer une UI custom si le rôle manque (sinon redirige vers /mon-compte/roles). */
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Garde UX (pas de sécurité — la sécurité repose sur les RLS Supabase).
 * Bloque l'accès à un sous-espace /mon-compte/<role>/* si le user n'a pas activé ce rôle.
 * Redirige vers /mon-compte/roles?activate=<role> pour lancer l'onboarding.
 */
export function RoleGuard({ roles, fallback, children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { accountRoles, loading } = useUserRoles();
  const location = useLocation();

  if (authLoading || loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  const hasOne = roles.some((r) => accountRoles.includes(r));
  if (!hasOne) {
    if (fallback !== undefined) return <>{fallback}</>;
    const target = roles[0];
    return <Navigate to={`/mon-compte/roles?activate=${target}`} replace />;
  }

  return <>{children}</>;
}
