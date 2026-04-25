import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, ListingCardData } from "@/components/listing/ListingCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Flame, MapPin, Loader2 } from "lucide-react";
import { useGeolocation, haversineKm } from "@/hooks/useGeolocation";

interface Category {
  id: string;
  slug: string;
  name: string;
}

type Row = ListingCardData & {
  category_id: string;
  latitude: number | null;
  longitude: number | null;
  is_featured: boolean;
};

const NEAR_KM = 50;

export default function Featured() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("all");
  const { position, loading: geoLoading, error: geoError, request } = useGeolocation();

  useEffect(() => {
    document.title = "En vedette — DealFlash";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Découvrez les annonces en vedette et les rabais exclusifs sur DealFlash.");
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      const [catsRes, listRes] = await Promise.all([
        supabase.from("categories").select("id, slug, name").eq("is_active", true).order("display_order"),
        supabase
          .from("listings")
          .select(
            "id, title, price, currency, city, images, allows_booking, is_featured, featured_until, original_price, discount_percent, latitude, longitude, category_id, categories(name)"
          )
          .eq("status", "active")
          // Exclude expired boosts: keep rows where featured_until is null OR still in the future,
          // OR where the row qualifies via discount only (is_featured=false handled by the OR below).
          .or(`featured_until.is.null,featured_until.gt.${nowIso}`)
          .or("is_featured.eq.true,discount_percent.gte.10")
          .order("is_featured", { ascending: false })
          .order("featured_priority", { ascending: false })
          .order("discount_percent", { ascending: false, nullsFirst: false })
          .limit(60),
      ]);
      if (catsRes.data) setCategories(catsRes.data);
      if (listRes.data) {
        const now = Date.now();
        setListings(
          listRes.data
            .map((l) => {
              const { categories, ...rest } = l as typeof l & { categories: { name: string } | null };
              const expired =
                rest.featured_until && new Date(rest.featured_until).getTime() <= now;
              return {
                ...rest,
                // Defensive: strip the boost flag client-side too if expired.
                is_featured: expired ? false : rest.is_featured,
                category_name: categories?.name,
              } as Row;
            })
            // Only keep rows that still qualify: boosted (non-expired) OR discount ≥ 10%.
            .filter((l) => l.is_featured || (l.discount_percent ?? 0) >= 10)
        );
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (activeCat === "all") return listings;
    return listings.filter((l) => l.category_id === activeCat);
  }, [listings, activeCat]);

  const adminBoosted = filtered.filter((l) => l.is_featured);
  const discounted = filtered.filter((l) => !l.is_featured && (l.discount_percent ?? 0) >= 10);

  const nearMe = useMemo(() => {
    if (!position) return [];
    return filtered
      .filter((l) => l.latitude != null && l.longitude != null)
      .map((l) => ({
        ...l,
        _km: haversineKm(position, { lat: Number(l.latitude), lng: Number(l.longitude) }),
      }))
      .filter((l) => l._km <= NEAR_KM)
      .sort((a, b) => a._km - b._km)
      .slice(0, 12);
  }, [filtered, position]);

  return (
    <div className="container py-10 space-y-12">
      <header className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">Vedette &amp; promos éclair</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Les meilleurs deals, en vedette.
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Annonces sponsorisées par nos commerçants partenaires et rabais d'au moins 10% — la philosophie DealFlash : vendre rapide.
        </p>
      </header>

      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant={activeCat === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCat("all")}
          className="rounded-full"
        >
          Toutes
        </Button>
        {categories.map((c) => (
          <Button
            key={c.id}
            variant={activeCat === c.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCat(c.id)}
            className="rounded-full"
          >
            {c.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Near me */}
          <section>
            <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" /> Près de toi
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Annonces en vedette et rabais à moins de {NEAR_KM} km
                </p>
              </div>
              {!position && (
                <Button onClick={() => request().catch(() => {})} disabled={geoLoading} size="sm" variant="outline">
                  {geoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                  Activer ma position
                </Button>
              )}
            </div>
            {!position ? (
              <div className="text-center py-10 rounded-xl bg-secondary/40 border border-border">
                <p className="text-muted-foreground text-sm">
                  Active la géolocalisation pour voir les promos autour de toi.
                </p>
                {geoError && <p className="text-destructive text-xs mt-2">{geoError}</p>}
              </div>
            ) : nearMe.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Aucune offre à moins de {NEAR_KM} km pour l'instant.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {nearMe.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </section>

          {/* Admin boosted */}
          {adminBoosted.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Sélection sponsorisée</h2>
                <Badge className="bg-primary/10 text-primary border-0">Partenaires</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {adminBoosted.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            </section>
          )}

          {/* Discounted */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-6 w-6 text-destructive" />
              <h2 className="text-2xl font-bold">Rabais éclair (≥ 10%)</h2>
            </div>
            {discounted.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Aucun rabais actif dans cette catégorie pour l'instant.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {discounted.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </section>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Aucune annonce en vedette pour le moment.</p>
              <Button asChild variant="accent">
                <Link to="/recherche">Explorer toutes les annonces</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
