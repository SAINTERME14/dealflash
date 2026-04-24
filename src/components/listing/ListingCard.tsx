import { Link } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
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
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const cover = listing.images?.[0];
  const formattedPrice = new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: listing.currency || "CAD",
    maximumFractionDigits: 0,
  }).format(listing.price);

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
          {listing.allows_booking && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground border-0 shadow-flash gap-1">
              <Calendar className="h-3 w-3" /> Visite
            </Badge>
          )}
        </div>
        <div className="p-4 space-y-1.5">
          <p className="font-bold text-lg text-primary">{formattedPrice}</p>
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
