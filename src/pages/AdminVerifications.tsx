import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Loader2, ShieldCheck, Eye } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Verification = Database["public"]["Tables"]["seller_verifications"]["Row"];
type Status = Database["public"]["Enums"]["seller_verification_status"];

const STATUS_LABEL: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  submitted: { label: "Soumis", variant: "outline" },
  under_review: { label: "En examen", variant: "outline" },
  more_info_required: { label: "Info requise", variant: "destructive" },
  approved: { label: "Approuvé", variant: "default" },
  rejected: { label: "Refusé", variant: "destructive" },
};

const PROFILE_LABEL = {
  individual: "Particulier",
  self_employed: "Travailleur autonome",
  corporation: "Entreprise",
};

export default function AdminVerifications() {
  const [items, setItems] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    document.title = "Vérifications vendeurs — Admin";
    supabase
      .from("seller_verifications")
      .select("*")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  const pending = items.filter(
    (i) => i.status === "submitted" || i.status === "under_review" || i.status === "more_info_required",
  );
  const list = tab === "pending" ? pending : items;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Vérifications vendeurs (KYC)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Examinez les dossiers d'identité soumis par les vendeurs.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{pending.length} en attente</Badge>
            <Badge variant="secondary">{items.length} total</Badge>
          </div>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "all")}>
          <TabsList>
            <TabsTrigger value="pending">À examiner ({pending.length})</TabsTrigger>
            <TabsTrigger value="all">Tous ({items.length})</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : list.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                Aucun dossier {tab === "pending" ? "à examiner" : ""}.
              </Card>
            ) : (
              <div className="space-y-3">
                {list.map((v) => {
                  const status = STATUS_LABEL[v.status];
                  return (
                    <Card key={v.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {v.legal_first_name || v.legal_business_name || "Sans nom"}{" "}
                            {v.legal_last_name ?? ""}
                          </span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Badge variant="outline">{PROFILE_LABEL[v.profile_type]}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 truncate">
                          {v.email} · {v.city ?? "—"}, {v.province ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Soumis :{" "}
                          {v.submitted_at
                            ? new Date(v.submitted_at).toLocaleString("fr-CA")
                            : "—"}
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link to={`/admin/verifications/${v.id}`}>
                          <Eye className="h-4 w-4" />
                          Examiner
                        </Link>
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
