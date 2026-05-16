import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, ScanLine, Target, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

type Lead = {
  id: string;
  status: "scanned" | "converted" | "cancelled";
  scanned_at: string;
  converted_at: string | null;
  channel: string | null;
  amount_cents: number | null;
  currency: string | null;
  notes: string | null;
  affiliate_user_id: string | null;
  qr_id: string | null;
  listing_id: string | null;
};

export default function MerchantLeads() {
  const { user } = useAuth();
  const leadsEnabled = useFeatureFlag("leads_enabled", true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    document.title = "Mes leads | Boardeal";
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel("leads-merchant")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads", filter: `merchant_user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("merchant_user_id", user.id)
      .order("scanned_at", { ascending: false })
      .limit(200);
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }

  async function scanQr() {
    if (!user || !qrCode.trim()) return;
    setScanning(true);

    // 1. Trouver le QR
    const { data: qr } = await supabase
      .from("qr_codes")
      .select("id, owner_user_id, owner_role, target_id, target_type, is_active")
      .eq("code", qrCode.trim())
      .maybeSingle();

    if (!qr || !qr.is_active) {
      setScanning(false);
      return toast.error("QR code introuvable ou inactif");
    }

    // 2. Enregistrer la visite
    const { data: visit } = await supabase
      .from("qr_visits")
      .insert({
        qr_id: qr.id,
        user_agent: navigator.userAgent,
        referrer: "merchant-scan",
      } as never)
      .select("id")
      .maybeSingle();

    // 3. Créer le lead
    const affiliateId =
      qr.owner_role && ["closer", "influencer", "promoter", "advertiser"].includes(qr.owner_role)
        ? qr.owner_user_id
        : null;

    const { error } = await supabase.from("leads").insert({
      merchant_user_id: user.id,
      affiliate_user_id: affiliateId,
      qr_id: qr.id,
      qr_visit_id: (visit as { id: number } | null)?.id ?? null,
      listing_id: qr.target_type === "product" || qr.target_type === "service" ? qr.target_id : null,
      channel: qr.owner_role,
      status: "scanned",
    });

    setScanning(false);
    if (error) return toast.error(error.message);
    toast.success("Lead enregistré");
    setQrCode("");
    load();
  }

  async function setStatus(lead: Lead, status: "converted" | "cancelled") {
    const patch: Partial<Lead> = { status };
    if (status === "converted") patch.converted_at = new Date().toISOString();
    const { error } = await supabase.from("leads").update(patch).eq("id", lead.id);
    if (error) return toast.error(error.message);
    toast.success(status === "converted" ? "Lead converti" : "Lead annulé");
  }

  const stats = useMemo(() => {
    const scanned = leads.filter((l) => l.status === "scanned").length;
    const converted = leads.filter((l) => l.status === "converted").length;
    const total = leads.length;
    const rate = total ? Math.round((converted / total) * 100) : 0;
    return { scanned, converted, total, rate };
  }, [leads]);

  if (!leadsEnabled) {
    return (
      <div className="container py-10 max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            La fonction leads est désactivée par l'administrateur.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mes leads</h1>
          <p className="text-sm text-muted-foreground">
            Clients activés via le QR de rabais d'un affilié.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="En attente" value={stats.scanned} />
        <Stat label="Convertis" value={stats.converted} accent />
        <Stat label="Taux de conversion" value={`${stats.rate}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scanner un QR de rabais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Coller ou saisir le code QR"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scanQr()}
            />
            <Button onClick={scanQr} disabled={scanning || !qrCode.trim()}>
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activer"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Astuce : branchez un lecteur QR USB ou utilisez la caméra mobile pour copier le code dans ce champ.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucun lead pour l'instant.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">
                      {new Date(l.scanned_at).toLocaleString("fr-CA")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.channel ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === "converted"
                            ? "default"
                            : l.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {l.amount_cents != null
                        ? (l.amount_cents / 100).toLocaleString("fr-CA", {
                            style: "currency",
                            currency: l.currency || "CAD",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {l.status === "scanned" && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setStatus(l, "converted")}>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setStatus(l, "cancelled")}>
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${accent ? "text-success" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
