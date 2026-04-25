import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCanManageSellerNotes } from "@/hooks/useCanManageSellerNotes";
import { Loader2 } from "lucide-react";

/**
 * Restricts access to users authorized to manage seller applications
 * and their internal notes (admins + B2C sellers).
 */
export function SellerNotesRoute({ children }: { children: ReactNode }) {
  const { canManage, loading } = useCanManageSellerNotes();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManage) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
