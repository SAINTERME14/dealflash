import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { ListingCard } from "@/components/listing/ListingCard";
import { ListingsMap, MapListing } from "@/components/map/ListingsMap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search as SearchIcon, Loader2, MapPin, LocateFixed, X, Sparkles, Flame } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRankedListings, DealType, DEAL_TYPE_LABELS } from "@/hooks/useRankedListings";
import { DealTypeFilter } from "@/components/search/DealTypeFilter";
import { toast } from "sonner";

export default function Search() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = params.slug;
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [appliedQuery, setAppliedQuery] = useState(searchParams.get("q") ?? "");
  const [dealType, setDealType] = useState<DealType | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  const { position, loading: geoLoading, error: geoError, request, clear } = useGeolocation();

  useEffect(() => {
    document.title = categoryName ? `${categoryName} — Boardeal` : "Rechercher — Boardeal";
  }, [categoryName]);

  // Resolve category slug → id
  useEffect(() => {
    (async () => {
      if (!categorySlug) {
        setCategoryId(null);
        setCategoryName(null);
        return;
      }
      const { data: cat } = await supabase
        .from("categories")
        .select("id, name")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (cat) {
        setCategoryId(cat.id);
        setCategoryName(cat.name);
      }
    })();
  }, [categorySlug]);

  const { items, loading, hasMore, loadMore, error } = useRankedListings({
    q: appliedQuery,
    dealType,
    categoryId,
    lat: nearbyOnly && position ? position.lat : null,
    lng: nearbyOnly && position ? position.lng : null,
    radiusKm: nearbyOnly && position ? radiusKm : null,
    pageSize: 24,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedQuery(query);
    setSearchParams(query ? { q: query } : {});
  };

  const requestLocation = async () => {
    try {
      await request();
      setNearbyOnly(true);
      toast.success("Position obtenue");
    } catch {
      /* error handled by hook */
    }
  };

  const mapListings: MapListing[] = useMemo(
    () =>
      items
        .filter((l) => l.latitude != null && l.longitude != null)
        .map((l) => ({
          id: l.id,
          title: l.title,
          price: l.price,
          currency: l.currency,
          city: l.city,
          images: l.images,
          latitude: l.latitude as number,
          longitude: l.longitude as number,
        })),
    [items]
  );

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">{categoryName ?? "Toutes les annonces"}</h1>
        <form onSubmit={handleSubmit} className="relative max-w-xl mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un deal, une boutique, une ville…"
            className="pl-10"
          />
        </form>

        <div className="mb-4">
          <DealTypeFilter value={dealType} onChange={setDealType} />
        </div>

        {/* Geolocation controls */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-secondary/40 border border-border">
          <div className="flex flex-wrap items-center gap-3">
            {!position ? (
              <Button type="button" onClick={requestLocation} variant="default" size="sm" disabled={geoLoading} className="gap-2">
                {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                Utiliser ma position
              </Button>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <MapPin className="h-4 w-4" /> Position activée
                </div>
                <Button type="button" variant={nearbyOnly ? "default" : "outline"} size="sm" onClick={() => setNearbyOnly((v) => !v)}>
                  {nearbyOnly ? "Filtre actif" : "Filtrer à proximité"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { clear(); setNearbyOnly(false); }} className="gap-1">
                  <X className="h-3 w-3" /> Effacer
                </Button>
              </>
            )}
          </div>

          {position && nearbyOnly && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Rayon : <span className="font-semibold text-foreground">{radiusKm} km</span>
              </span>
              <Slider value={[radiusKm]} onValueChange={(v) => setRadiusKm(v[0])} min={1} max={200} step={1} className="max-w-xs" />
            </div>
          )}

          {geoError && <p className="text-xs text-destructive">{geoError}</p>}
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "list" | "map")} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading && items.length === 0 ? "Chargement…" : `${items.length} annonce${items.length > 1 ? "s" : ""}${hasMore ? "+" : ""}`}
          </p>
          <TabsList>
            <TabsTrigger value="list">Liste</TabsTrigger>
            <TabsTrigger value="map">Carte</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          {loading && items.length === 0 ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">Aucune annonce trouvée.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map((l) => (
                  <div key={l.id} className="relative">
                    <ListingCard listing={l as any} />
                    <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                      {l.has_active_flash && (
                        <span className="px-2 py-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold flex items-center gap-1">
                          <Flame className="h-3 w-3" /> Flash
                        </span>
                      )}
                      {l.is_featured && (
                        <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Boosté
                        </span>
                      )}
                      {l.distance_km != null && (
                        <span className="px-2 py-1 rounded-full bg-background/95 text-xs font-semibold shadow-card flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-accent" />
                          {l.distance_km < 1
                            ? `${Math.round(l.distance_km * 1000)} m`
                            : `${l.distance_km.toFixed(1)} km`}
                        </span>
                      )}
                    </div>
                    {l.deal_type && (
                      <span className="absolute bottom-16 left-2 z-10 px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-[10px] font-semibold">
                        {DEAL_TYPE_LABELS[l.deal_type]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button onClick={loadMore} disabled={loading} variant="outline">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Charger plus
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="map">
          {loading && items.length === 0 ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : mapListings.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">Aucune annonce géolocalisée à afficher.</div>
          ) : (
            <ListingsMap listings={mapListings} userPosition={position} radiusKm={nearbyOnly ? radiusKm : undefined} height="600px" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
