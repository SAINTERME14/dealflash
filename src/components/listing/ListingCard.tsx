import { Link } from "react-router-dom";
import { MapPin, Calendar, Sparkles, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ListingCardData {
  id: string;
  title: string;
  price: number;
  currency?: string;
  city?: string | null;
  images: string[];
  category_name?: string;
  allows_booking?: boolean;
  is_featured?: boolean;
  original_price?: number | null;
  discount_percent?: number | null;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const cover = listing.images?.[0];
  const currency = listing.currency || "CAD";
  const fmt = (v: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);

  const hasDiscount =
    listing.original_price != null &&
    listing.discount_percent != null &&
    listing.discount_percent >= 10;

  return (
    <Link to={`/annonce/${listing.id}`} className="group block">
      <Card className="overflow-hidden border-border shadow-card hover:shadow-elevated transition-smooth group-hover:-translate-y-1">
        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
          {cover ? (
            <img
              src={cover}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-smooth"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
              Pas d'image
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
            {listing.is_featured && (
              <Badge className="bg-primary text-primary-foreground border-0 shadow-primary gap-1">
                <Sparkles className="h-3 w-3" /> Vedette
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-destructive text-destructive-foreground border-0 gap-1">
                <Flame className="h-3 w-3" /> -{Math.round(listing.discount_percent!)}%
              </Badge>
            )}
            {listing.allows_booking && (
              <Badge className="bg-accent text-accent-foreground border-0 shadow-flash gap-1">
                <Calendar className="h-3 w-3" /> Visite
              </Badge>
            )}
          </div>
        </div>
        <div className="p-4 space-y-1.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            {hasDiscount ? (
              <>
                <p className="font-bold text-lg animate-flash-price">{fmt(listing.price)}</p>
                <p className="text-sm text-muted-foreground line-through">
                  {fmt(listing.original_price!)}
                </p>
              </>
            ) : (
              <p className="font-bold text-lg text-primary">{fmt(listing.price)}</p>
            )}
          </div>
          <h3 className="font-medium line-clamp-2 text-sm leading-snug">{listing.title}</h3>
          {listing.city && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{listing.city}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
