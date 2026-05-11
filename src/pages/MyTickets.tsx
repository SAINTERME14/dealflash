import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, FileText, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BonDeCommande, type BonDeCommandeData } from "@/components/booking/BonDeCommande";

interface Ticket {
  id: string;
  listing_id: string;
  status: string;
  flash_price: number;
  platform_fee: number;
  final_price: number | null;
  total_discount_percent: number | null;
  final_discount_percent: number | null;
  currency: string;
  confirmation_code: string;
  order_confirmed_at: string | null;
  expires_at: string;
  created_at: string;
  listings: { id: string; title: string; images: string[] } | null;
}

const STATUS_UI: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  paid: { label: "Payé — à confirmer", icon: <Clock className="h-3.5 w-3.5" />, variant: "default" },
  validated: { label: "Validé", icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "secondary" },
  expired: { label: "Expiré", icon: <XCircle className="h-3.5 w-3.5" />, variant: "outline" },
  refunded: { label: "Remboursé", icon: <AlertCircle className="h-3.5 w-3.5" />, variant: "outline" },
  cancelled: { label: "Annulé", icon: <XCircle className="h-3.5 w-3.5" />, variant: "destructive" },
  pending: { label: "En attente", icon: <Clock className="h-3.5 w-3.5" />, variant: "secondary" },
};

const fmt = (amount: number, currency = "CAD") =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [bon, setBon] = useState<BonDeCommandeData | null>(null);
  const [bonOpen, setBonOpen] = useState(false);

  useEffect(() => {
    document.title = "Mes tickets Boardeal";
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, listings(id, title, images)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setTickets((data ?? []) as unknown as Ticket[]);
      setLoading(false);
    })();
  }, [user]);

  const handleConfirm = async (ticketId: string) => {
    setConfirming(ticketId);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-order", {
        body: { ticket_id: ticketId },
      });
      if (error || data?.error) {
        toast.error(data?.error ?? error?.message ?? "Erreur lors de la confirmation");
        return;
      }
      setBon(data.bon as BonDeCommandeData);
      setBonOpen(true);
      // Rafraîchir la liste
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                order_confirmed_at: data.bon.confirmed_at,
                final_price: data.bon.final_price,
                final_discount_percent: data.bon.total_discount_percent,
              }
            : t
        )
      );
    } finally {
      setConfirming(null);
    }
  };

  const handleViewBon = async (ticketId: string) => {
    setConfirming(ticketId);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-order", {
        body: { ticket_id: ticketId },
      });
      if (error || data?.error) {
        toast.error(data?.error ?? error?.message ?? "Erreur");
        return;
      }
      setBon(data.bon as BonDeCommandeData);
      setBonOpen(true);
    } finally {
      setConfirming(null);
    }
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p className="mb-4">Connectez-vous pour voir vos tickets.</p>
        <Button asChild><Link to="/auth">Se connecter</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Mes tickets Boardeal</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Chaque ticket verrouille votre droit au rabais pour toute la durée de l'annonce.
        Cliquez « Confirmer ma commande » pour geler votre rabais et obtenir votre bon.
      </p>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <p className="mb-4">Vous n'avez aucun ticket pour l'instant.</p>
          <Button asChild variant="default"><Link to="/">Explorer les deals</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const ui = STATUS_UI[t.status] ?? STATUS_UI.pending;
            const isExpired = new Date(t.expires_at) < new Date();
            const canConfirm = t.status === "paid" && !t.order_confirmed_at && !isExpired;
            const alreadyConfirmed = !!t.order_confirmed_at;

            return (
              <Card key={t.id} className="p-4 flex flex-col sm:flex-row gap-4">
                {t.listings?.images?.[0] && (
                  <Link to={`/annonce/${t.listings.id}`} className="shrink-0">
                    <img
                      src={t.listings.images[0]}
                      alt=""
                      className="w-full sm:w-24 h-20 rounded-lg object-cover"
                    />
                  </Link>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <Link
                      to={`/annonce/${t.listings?.id ?? t.listing_id}`}
                      className="font-medium hover:text-primary line-clamp-1 flex-1"
                    >
                      {t.listings?.title ?? "Annonce supprimée"}
                    </Link>
                    <Badge variant={ui.variant} className="gap-1 shrink-0">
                      {ui.icon} {ui.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm mt-1">
                    <span className="text-muted-foreground">
                      Ticket payé :{" "}
                      <strong className="text-foreground">{fmt(t.platform_fee, t.currency)}</strong>
                    </span>
                    {t.final_price != null ? (
                      <span className="text-green-700 font-medium">
                        Prix produit figé : {fmt(t.final_price, t.currency)}
                        {t.final_discount_percent != null && t.final_discount_percent > 0 && (
                          <span className="ml-1 text-xs">
                            (−{t.final_discount_percent.toFixed(1)} %)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Prix produit : {fmt(t.flash_price, t.currency)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    Code : {t.confirmation_code}
                    {" · "}
                    Expire le{" "}
                    {new Date(t.expires_at).toLocaleDateString("fr-CA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {alreadyConfirmed && (
                    <p className="text-xs text-green-700 mt-1">
                      ✅ Bon de commande généré le{" "}
                      {new Date(t.order_confirmed_at!).toLocaleDateString("fr-CA")}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 sm:flex-col sm:items-end shrink-0">
                  {canConfirm && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="gap-1"
                      disabled={confirming === t.id}
                      onClick={() => handleConfirm(t.id)}
                    >
                      {confirming === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      Confirmer ma commande
                    </Button>
                  )}
                  {alreadyConfirmed && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={confirming === t.id}
                      onClick={() => handleViewBon(t.id)}
                    >
                      {confirming === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      Voir le bon
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal bon de commande */}
      <Dialog open={bonOpen} onOpenChange={setBonOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bon de commande Boardeal</DialogTitle>
          </DialogHeader>
          {bon && <BonDeCommande bon={bon} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
