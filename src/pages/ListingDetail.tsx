import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Heart, MessageCircle, ChevronLeft, ChevronRight, Info, FileText } from "lucide-react";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { ListingsMap } from "@/components/map/ListingsMap";
import { ReviewList } from "@/components/reviews/ReviewList";
import { StarRating } from "@/components/reviews/StarRating";
import { useListingRatingStats, useSellerRatingStats } from "@/hooks/useReviews";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BonDeCommande, type BonDeCommandeData } from "@/components/booking/BonDeCommande";
import { SocialShareButtons } from "@/components/listing/SocialShareButtons";
import { LoyaltyPointsPanel } from "@/components/listing/LoyaltyPointsPanel";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string | null;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  allows_booking: boolean;
  seller_id: string;
  attributes: Record<string, unknown>;
  deal_type: string | null;
  accepts_loyalty_points: boolean | null;
  categories: { name: string; slug: string } | null;
  profiles: { display_name: string | null; city: string | null; is_verified: boolean } | null;
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<{ id: string; confirmed: boolean } | null>(null);
  const [bonOpen, setBonOpen] = useState(false);
  const [bon, setBon] = useState<BonDeCommandeData | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const { data: listingStats } = useListingRatingStats(listing?.id);
  const { data: sellerStats } = useSellerRatingStats(listing?.seller_id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, categories(name, slug), profiles!listings_seller_id_fkey(display_name, city, is_verified)")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        setListing(data as unknown as Listing);
        document.title = `${data.title} — DealFlash`;
        supabase.from("listings").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", id).then();
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("favorites").select("id").eq("user_id", user.id).eq("listing_id", id).maybeSingle()
      .then(({ data }) => setIsFav(!!data));
    // Vérifie si l'acheteur a déjà un ticket actif sur cette annonce
    supabase
      .from("tickets")
      .select("id, order_confirmed_at")
      .eq("buyer_id", user.id)
      .eq("listing_id", id)
      .in("status", ["paid", "validated"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: t }: any) => {
        if (t) setActiveTicket({ id: t.id, confirmed: !!t.order_confirmed_at });
      });
  }, [user, id]);

  const toggleFav = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!listing) return;
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, listing_id: listing.id });
      setIsFav(true);
      toast.success("Ajouté aux favoris");
    }
  };

  const handleContact = () => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${listing?.seller_id}&listing=${listing?.id}`);
  };

  const handleBook = () => {
    if (!user) { navigate("/auth"); return; }
    setBookingOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!activeTicket) return;
    setConfirmingOrder(true);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-order", {
        body: { ticket_id: activeTicket.id },
      });
      if (error || data?.error) {
        toast.error(data?.error ?? error?.message ?? "Erreur");
        return;
      }
      setBon(data.bon as BonDeCommandeData);
      setBonOpen(true);
      setActiveTicket((prev) => prev ? { ...prev, confirmed: true } : prev);
    } finally {
      setConfirmingOrder(false);
    }
  };

  if (loading) return <div className="container py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!listing) return <div className="container py-20 text-center"><p>Annonce introuvable.</p><Button asChild variant="link"><Link to="/">Retour à l'accueil</Link></Button></div>;

  const formattedPrice = new Intl.NumberFormat("fr-CA", { style: "currency", currency: listing.currency, maximumFractionDigits: 0 }).format(listing.price);
  const images = listing.images?.length ? listing.images : ["/placeholder.svg"];

  return (
    <div className="container py-6 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Accueil</Link>
        {listing.categories && <> / <Link to={`/categorie/${listing.categories.slug}`} className="hover:underline">{listing.categories.name}</Link></>}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Gallery + content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden shadow-card">
            <img src={images[imgIdx]} alt={listing.title} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 flex items-center justify-center shadow-card hover:bg-background transition-smooth"
                  aria-label="Image précédente"
                ><ChevronLeft className="h-5 w-5" /></button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 flex items-center justify-center shadow-card hover:bg-background transition-smooth"
                  aria-label="Image suivante"
                ><ChevronRight className="h-5 w-5" /></button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`h-2 rounded-full transition-smooth ${i === imgIdx ? 'w-6 bg-accent' : 'w-2 bg-background/70'}`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{listing.title}</h1>
            {listing.city && (
              <div className="flex items-center gap-1 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" /> {listing.city}{listing.region ? `, ${listing.region}` : ''}
              </div>
            )}
            <Card className="p-6">
              <h2 className="font-semibold mb-3">Description</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{listing.description}</p>
            </Card>

            {listing.attributes && Object.keys(listing.attributes).length > 0 && (
              <Card className="p-6 mt-4">
                <h2 className="font-semibold mb-3">Caractéristiques</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(listing.attributes).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</dt>
                      <dd className="font-medium">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}

            {listing.latitude != null && listing.longitude != null && (
              <Card className="p-6 mt-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" /> Emplacement
                </h2>
                <ListingsMap
                  listings={[{
                    id: listing.id,
                    title: listing.title,
                    price: listing.price,
                    currency: listing.currency,
                    city: listing.city,
                    images: listing.images,
                    latitude: listing.latitude,
                    longitude: listing.longitude,
                  }]}
                  height="320px"
                  zoom={14}
                />
                {listing.address && (
                  <p className="text-xs text-muted-foreground mt-3">{listing.address}</p>
                )}
              </Card>
            )}

            <Card className="p-6 mt-4" id="avis">
              <h2 className="font-semibold mb-4">Avis des acheteurs</h2>
              <ReviewList listingId={listing.id} sellerId={listing.seller_id} />
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-6 shadow-elevated lg:sticky lg:top-20">
            <p className="text-3xl font-bold text-primary">{formattedPrice}</p>
            {listing.categories && <Badge variant="secondary" className="mt-2">{listing.categories.name}</Badge>}
            {listingStats && listingStats.total > 0 && (
              <a href="#avis" className="mt-3 flex items-center gap-2 text-sm hover:underline">
                <StarRating value={listingStats.avg} size="sm" />
                <span className="font-medium">{listingStats.avg.toFixed(1)}</span>
                <span className="text-muted-foreground">({listingStats.total} avis)</span>
              </a>
            )}

            {/* Bandeau facilitateur */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-xs text-amber-800">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>DealFlash est facilitateur.</strong> Seul le ticket de réservation est encaissé par DealFlash. Le paiement du produit se fait directement au vendeur.
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {/* Si ticket actif : bouton confirmer commande */}
              {activeTicket && !activeTicket.confirmed && (
                <Button
                  onClick={handleConfirmOrder}
                  variant="hero"
                  size="lg"
                  className="w-full gap-2"
                  disabled={confirmingOrder}
                >
                  {confirmingOrder
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FileText className="h-4 w-4" />}
                  Confirmer ma commande
                </Button>
              )}
              {activeTicket && activeTicket.confirmed && (
                <Button
                  onClick={handleConfirmOrder}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                  disabled={confirmingOrder}
                >
                  {confirmingOrder
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FileText className="h-4 w-4" />}
                  Voir mon bon de commande
                </Button>
              )}

              {listing.allows_booking && (
                <Button onClick={handleBook} variant={activeTicket ? "outline" : "hero"} size="lg" className="w-full gap-2">
                  <Calendar className="h-4 w-4" /> Réserver une visite
                </Button>
              )}
              <Button onClick={handleContact} variant="default" size="lg" className="w-full gap-2">
                <MessageCircle className="h-4 w-4" /> Contacter le vendeur
              </Button>
              <Button onClick={toggleFav} variant="outline" size="lg" className="w-full gap-2">
                <Heart className={`h-4 w-4 ${isFav ? 'fill-accent text-accent' : ''}`} />
                {isFav ? 'Dans vos favoris' : 'Ajouter aux favoris'}
              </Button>
            </div>

            {/* Partage social (Point 3 — earn points) */}
            <div className="mt-6 pt-6 border-t border-border">
              <SocialShareButtons
                listingId={listing.id}
                listingTitle={listing.title}
                dealType={listing.deal_type ?? "standard"}
                listingUrl={window.location.href}
              />
            </div>

            {/* Points de fidélité (Point 3 — spend, uniquement prix_regulier) */}
            {listing.accepts_loyalty_points && (
              <div className="mt-4">
                <LoyaltyPointsPanel
                  listingId={listing.id}
                  vendorId={listing.seller_id}
                  regularPrice={listing.price}
                  currency={listing.currency}
                />
              </div>
            )}

            {listing.profiles && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Vendeur</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                    {(listing.profiles.display_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-1">
                      {listing.profiles.display_name ?? 'Vendeur'}
                      {listing.profiles.is_verified && <Badge variant="secondary" className="text-xs">✓ Vérifié</Badge>}
                    </p>
                    {listing.profiles.city && <p className="text-xs text-muted-foreground">{listing.profiles.city}</p>}
                    {sellerStats && sellerStats.total > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <StarRating value={sellerStats.avg} size="sm" />
                        <span className="text-xs text-muted-foreground">{sellerStats.avg.toFixed(1)} · {sellerStats.total} avis</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </aside>
      </div>

      {listing.allows_booking && (
        <BookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          listing={listing}
        />
      )}

      <Dialog open={bonOpen} onOpenChange={setBonOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bon de commande DealFlash</DialogTitle>
          </DialogHeader>
          {bon && <BonDeCommande bon={bon} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
