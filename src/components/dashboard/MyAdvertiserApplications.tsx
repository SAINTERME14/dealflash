import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

interface App {
  id: string;
  advertiser_profile: string | null;
  listing_type: string;
  status: string;
  admin_response: string | null;
  admin_response_at: string | null;
  ai_review: { summary?: string; decision?: string } | null;
  ai_attempts: number;
  created_at: string;
  updated_at: string;
}

const STATUS: Record<string, { label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "En attente d'analyse", icon: Clock, variant: "secondary" },
  contacted: { label: "Validation finale en cours", icon: CheckCircle2, variant: "default" },
  suspended: { label: "Revue manuelle", icon: AlertTriangle, variant: "outline" },
  approved: { label: "Approuvé", icon: CheckCircle2, variant: "default" },
  rejected: { label: "Rejeté", icon: XCircle, variant: "destructive" },
};

export function MyAdvertiserApplications() {
  const { user } = useAuth();
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("seller_applications")
        .select("id,advertiser_profile,listing_type,status,admin_response,admin_response_at,ai_review,ai_attempts,created_at,updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) setApps((data ?? []) as App[]);
    };
    load();

    const channel = supabase
      .channel(`advertiser-apps-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seller_applications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  if (!apps.length) return null;

  return (
    <Card className="p-5 mb-6">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        Mes candidatures d'annonceur
      </h2>
      <div className="space-y-3">
        {apps.map((app) => {
          const s = STATUS[app.status] ?? STATUS.new;
          const Icon = s.icon;
          return (
            <div key={app.id} className="rounded-lg border border-border p-4 bg-background">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={s.variant} className="gap-1">
                  <Icon className="h-3 w-3" /> {s.label}
                </Badge>
                <Badge variant="outline">{app.advertiser_profile ?? app.listing_type}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  Mis à jour {new Date(app.updated_at).toLocaleDateString("fr-CA")}
                </span>
              </div>
              {app.ai_review?.summary && (
                <p className="text-xs text-muted-foreground mb-2 inline-flex items-start gap-1.5">
                  <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                  IA ({app.ai_attempts}/2) : {app.ai_review.summary}
                </p>
              )}
              {app.admin_response && (
                <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                  <p className="font-semibold text-xs mb-1 inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Message de l'équipe Boardeal
                  </p>
                  <p className="whitespace-pre-wrap">{app.admin_response}</p>
                  {app.admin_response_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(app.admin_response_at).toLocaleString("fr-CA")}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
