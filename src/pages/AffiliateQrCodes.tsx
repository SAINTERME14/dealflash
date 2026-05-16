import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, QrCode, Trash2 } from "lucide-react";

type QrTarget = "shop" | "product" | "service" | "campaign";
type QrRow = {
  id: string;
  code: string;
  target_type: QrTarget;
  target_id: string | null;
  discount_pct: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

const TARGET_LABELS: Record<QrTarget, string> = {
  product: "Produit / annonce",
  shop: "Boutique",
  service: "Service",
  campaign: "Campagne",
};

function randomCode(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export default function AffiliateQrCodes() {
  const { user } = useAuth();
  const [rows, setRows] = useState<QrRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerRole, setOwnerRole] = useState<string>("closer");
  const [targetType, setTargetType] = useState<QrTarget>("product");
  const [targetId, setTargetId] = useState("");
  const [discount, setDiscount] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("qr_codes")
      .select("id, code, target_type, target_id, discount_pct, expires_at, is_active, created_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
    else setRows((data ?? []) as QrRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    // Pré-remplit le rôle propriétaire depuis affiliate_profiles
    supabase
      .from("affiliate_profiles")
      .select("kind")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.kind) setOwnerRole(String(data.kind));
      });
    load();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const payload: any = {
      owner_user_id: user.id,
      owner_role: ownerRole,
      target_type: targetType,
      target_id: targetId.trim() || null,
      discount_pct: discount ? Number(discount) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      code: randomCode(),
      is_active: true,
    };
    const { error } = await supabase.from("qr_codes").insert(payload);
    setSubmitting(false);
    if (error) {
      toast({ title: "Création impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "QR créé", description: "Partagez le lien à vos prospects." });
    setTargetId("");
    setDiscount("");
    setExpiresAt("");
    load();
  };

  const toggleActive = async (row: QrRow) => {
    const { error } = await supabase
      .from("qr_codes")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else load();
  };

  const remove = async (row: QrRow) => {
    if (!confirm("Supprimer ce QR ?")) return;
    const { error } = await supabase.from("qr_codes").delete().eq("id", row.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else load();
  };

  const copyLink = async (code: string) => {
    const url = `${window.location.origin}/qr/${code}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Lien copié", description: url });
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes QR d'affiliation</h1>
        <p className="text-sm text-muted-foreground">
          Générez un QR signé par produit ou boutique. Chaque scan crée un lead traçable.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Créer un nouveau QR</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Mon rôle</Label>
              <Select value={ownerRole} onValueChange={setOwnerRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="closer">Closer</SelectItem>
                  <SelectItem value="influencer">Influenceur</SelectItem>
                  <SelectItem value="promoter">Promoteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type de cible</Label>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as QrTarget)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TARGET_LABELS) as QrTarget[]).map((k) => (
                    <SelectItem key={k} value={k}>{TARGET_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>ID de la cible (UUID de l'annonce ou de la boutique)</Label>
              <Input
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="ex: 11111111-2222-3333-4444-555555555555"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rabais (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.5"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="ex: 10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiration (optionnel)</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                <QrCode className="h-4 w-4 mr-2" />
                {submitting ? "Création…" : "Générer le QR"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mes QR ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun QR pour l'instant.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-0.5 text-sm">{r.code}</code>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant="outline">{TARGET_LABELS[r.target_type]}</Badge>
                      {r.discount_pct != null && <Badge variant="outline">-{r.discount_pct}%</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cible : {r.target_id ?? "—"} · Expire :{" "}
                      {r.expires_at ? new Date(r.expires_at).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyLink(r.code)}>
                      <Copy className="h-4 w-4 mr-1" /> Copier le lien
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
                      {r.is_active ? "Désactiver" : "Activer"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
