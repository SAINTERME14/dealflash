import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { sb } from "@/integrations/supabase/untyped";
import { useAuth } from "@/hooks/useAuth";

/**
 * Rôles applicatifs Boardeal (alignés sur l'ENUM public.app_role).
 * - acheteur / vendeur_b2c / vendeur_c2c : rôles historiques (buyer / merchant).
 * - closer / influencer / promoter : familles d'affiliés (table affiliate_profiles.kind).
 * - professional / employer : marketplace emploi.
 * - admin / moderateur : administration (gérés séparément via /admin/v2).
 */
export type AppRole =
  | "acheteur"
  | "vendeur_b2c"
  | "vendeur_c2c"
  | "closer"
  | "influencer"
  | "promoter"
  | "professional"
  | "employer"
  | "admin"
  | "moderateur";

/** Rôles utilisateurs exposés dans l'espace /mon-compte (admin exclu). */
export type AccountRole =
  | "buyer"
  | "merchant"
  | "closer"
  | "influencer"
  | "promoter"
  | "professional"
  | "employer";

export const ACCOUNT_ROLES: AccountRole[] = [
  "buyer",
  "merchant",
  "closer",
  "influencer",
  "promoter",
  "professional",
  "employer",
];

export type UserRolesState = {
  loading: boolean;
  roles: AppRole[];
  accountRoles: AccountRole[];
  has: (r: AccountRole | AppRole) => boolean;
  isMerchant: boolean;
  isAffiliate: boolean;
  isProfessional: boolean;
  isEmployer: boolean;
};

function mapToAccountRoles(
  appRoles: AppRole[],
  flags: {
    hasMerchantProfile: boolean;
    affiliateKinds: string[];
    hasProfessionalProfile: boolean;
    hasEmployerProfile: boolean;
  }
): AccountRole[] {
  const set = new Set<AccountRole>();
  // Tout user authentifié est buyer par défaut
  set.add("buyer");

  if (
    appRoles.includes("vendeur_b2c") ||
    appRoles.includes("vendeur_c2c") ||
    flags.hasMerchantProfile
  ) {
    set.add("merchant");
  }
  if (appRoles.includes("closer") || flags.affiliateKinds.includes("closer")) set.add("closer");
  if (appRoles.includes("influencer") || flags.affiliateKinds.includes("influencer"))
    set.add("influencer");
  if (appRoles.includes("promoter") || flags.affiliateKinds.includes("promoter"))
    set.add("promoter");
  if (appRoles.includes("professional") || flags.hasProfessionalProfile) set.add("professional");
  if (appRoles.includes("employer") || flags.hasEmployerProfile) set.add("employer");

  return ACCOUNT_ROLES.filter((r) => set.has(r));
}

export function useUserRoles(): UserRolesState {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [accountRoles, setAccountRoles] = useState<AccountRole[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        if (!cancelled) {
          setRoles([]);
          setAccountRoles([]);
          setLoading(false);
        }
        return;
      }

      const [rolesRes, merchantRes, affiliatesRes, proRes, employerRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        sb.from("merchant_profiles").select("id").eq("user_id", user.id).maybeSingle(),
        sb.from("affiliate_profiles").select("kind, is_active").eq("user_id", user.id),
        sb.from("professional_profiles").select("id").eq("user_id", user.id).maybeSingle(),
        sb.from("employer_profiles").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      const appRoles = ((rolesRes.data ?? []) as Array<{ role: AppRole }>).map((r) => r.role);
      const affiliateKinds = ((affiliatesRes.data ?? []) as Array<{ kind: string; is_active: boolean }>)
        .filter((a) => a.is_active)
        .map((a) => a.kind);

      const account = mapToAccountRoles(appRoles, {
        hasMerchantProfile: !!merchantRes.data,
        affiliateKinds,
        hasProfessionalProfile: !!proRes.data,
        hasEmployerProfile: !!employerRes.data,
      });

      if (!cancelled) {
        setRoles(appRoles);
        setAccountRoles(account);
        setLoading(false);
      }
    }
    if (!authLoading) {
      setLoading(true);
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  const has = (r: AccountRole | AppRole) =>
    (accountRoles as string[]).includes(r) || (roles as string[]).includes(r);

  return {
    loading: authLoading || loading,
    roles,
    accountRoles,
    has,
    isMerchant: accountRoles.includes("merchant"),
    isAffiliate:
      accountRoles.includes("closer") ||
      accountRoles.includes("influencer") ||
      accountRoles.includes("promoter"),
    isProfessional: accountRoles.includes("professional"),
    isEmployer: accountRoles.includes("employer"),
  };
}
