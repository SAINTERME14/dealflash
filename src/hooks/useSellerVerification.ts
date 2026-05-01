import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

export type SellerVerification = Database["public"]["Tables"]["seller_verifications"]["Row"];
export type SellerVerificationStatus = Database["public"]["Enums"]["seller_verification_status"];

export function useSellerVerification() {
  const { user, loading: authLoading } = useAuth();
  const [verification, setVerification] = useState<SellerVerification | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVerification = useCallback(async () => {
    if (!user) {
      setVerification(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("seller_verifications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setVerification(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) fetchVerification();
  }, [authLoading, fetchVerification]);

  const canPublish = verification?.status === "approved";
  const isEditable =
    !verification ||
    verification.status === "draft" ||
    verification.status === "more_info_required";

  return {
    verification,
    loading: authLoading || loading,
    canPublish,
    isEditable,
    refresh: fetchVerification,
  };
}
