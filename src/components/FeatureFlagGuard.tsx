import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface Props {
  flag: string;
  fallback?: ReactNode;
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Bloque le rendu d'une route/section si le feature flag est désactivé.
 * Par défaut, redirige vers la home. Sinon, affiche un fallback.
 */
export function FeatureFlagGuard({ flag, fallback, redirectTo = "/", children }: Props) {
  const enabled = useFeatureFlag(flag, true);
  if (!enabled) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
