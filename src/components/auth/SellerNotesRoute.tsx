import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCanManageSellerNotes } from "@/hooks/useCanManageSellerNotes";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Restricts access to users authorized to manage seller applications
 * and their internal notes (admins, B2C sellers, moderators).
 *
 * Behavior:
 * - While auth/role data is loading: show spinner (prevents the "flash + redirect" feeling).
 * - If not logged in: send to /auth.
 * - If logged in but no permission: send home.
 * - If the role check errored transiently: keep the user on the page rather than logging
 *   them out via redirect — the underlying RLS will still protect the data.
 */
export function SellerNotesRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { canManage, loading, errored } = useCanManageSellerNotes();

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!canManage && !errored) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
