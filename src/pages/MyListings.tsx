import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, Calendar as CalIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { AvailabilityDialog } from "@/components/booking/AvailabilityDialog";

interface MyListing {
  id: string;
  title: string;
  price: number;
  status: string;
  images: string[];
  view_count: number;
  allows_booking: boolean;
  created_at: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "En ligne", variant: "default" },
  draft: { label: "Brouillon", variant: "secondary" },
  paused: { label: "En pause", variant: "outline" },
  sold: { label: "Vendu", variant: "secondary" },
  archived: { label: "Archivé", variant: "outline" },
};

export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [availFor, setAvailFor] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("listings")
      .select("id, title, price, status, images, view_count, allows_booking, created_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    setListings(data ?? []);
    setLoading(false);
  };

  useEffect(() => { document.title = "Mes annonces — Boardeal"; load(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Annonce supprimée"); load(); }
  };

  const togglePublish = async (l: MyListing) => {
    const newStatus = l.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("listings").update({ status: newStatus }).eq("id", l.id);
    if (error) toast.error(error.message);
    else { toast.success(newStatus === "active" ? "Annonce publiée" : "Annonce mise en pause"); load(); }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mes annonces</h1>
        <Button asChild variant="hero"><Link to="/vendre"><Plus className="h-4 w-4" /> Nouvelle annonce</Link></Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : listings.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Vous n'avez encore publié aucune annonce.</p>
          <Button asChild variant="hero"><Link to="/vendre">Publier ma première annonce</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <Card key={l.id} className="p-4 flex flex-col sm:flex-row gap-4">
              <Link to={`/annonce/${l.id}`} className="shrink-0">
                <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-muted">
                  {l.images?.[0] ? (
                    <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Pas d'image</div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <Link to={`/annonce/${l.id}`} className="font-medium hover:text-primary line-clamp-1 flex-1">{l.title}</Link>
                  <Badge variant={statusLabels[l.status]?.variant ?? "secondary"}>{statusLabels[l.status]?.label ?? l.status}</Badge>
                </div>
                <p className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(l.price)}
                </p>
                <p className="text-xs text-muted-foreground">{l.view_count} vues</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                {l.allows_booking && (
                  <Button onClick={() => setAvailFor(l.id)} variant="outline" size="sm" className="gap-1">
                    <CalIcon className="h-3 w-3" /> Créneaux
                  </Button>
                )}
                <Button onClick={() => togglePublish(l)} variant="outline" size="sm">
                  {l.status === "active" ? "Mettre en pause" : "Publier"}
                </Button>
                <Button onClick={() => handleDelete(l.id)} variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {availFor && (
        <AvailabilityDialog
          listingId={availFor}
          open={!!availFor}
          onOpenChange={(o) => !o && setAvailFor(null)}
        />
      )}
    </div>
  );
}
