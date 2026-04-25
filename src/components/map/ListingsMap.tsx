import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { userLocationIcon } from "./leaflet-setup";
import type { LatLngBoundsLiteral } from "leaflet";

export interface MapListing {
  id: string;
  title: string;
  price: number;
  currency?: string;
  city?: string | null;
  images?: string[];
  latitude: number;
  longitude: number;
}

interface Props {
  listings: MapListing[];
  userPosition?: { lat: number; lng: number } | null;
  radiusKm?: number;
  height?: string;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    const bounds = points as LatLngBoundsLiteral;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export function ListingsMap({
  listings,
  userPosition,
  radiusKm,
  height = "500px",
  center,
  zoom = 11,
  className,
}: Props) {
  // Default center: Montréal
  const defaultCenter: [number, number] = center ?? [45.5017, -73.5673];

  const points: [number, number][] = [
    ...listings.map((l) => [l.latitude, l.longitude] as [number, number]),
    ...(userPosition ? [[userPosition.lat, userPosition.lng] as [number, number]] : []),
  ];

  const fmt = (price: number, currency = "CAD") =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

  return (
    <div className={className} style={{ height, width: "100%", borderRadius: "0.75rem", overflow: "hidden" }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPosition && (
          <>
            <Marker position={[userPosition.lat, userPosition.lng]} icon={userLocationIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
            {radiusKm && (
              <Circle
                center={[userPosition.lat, userPosition.lng]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "hsl(var(--accent))",
                  fillColor: "hsl(var(--accent))",
                  fillOpacity: 0.08,
                  weight: 1.5,
                }}
              />
            )}
          </>
        )}

        {listings.map((l) => (
          <Marker key={l.id} position={[l.latitude, l.longitude]}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                {l.images?.[0] && (
                  <img
                    src={l.images[0]}
                    alt={l.title}
                    style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, marginBottom: 6 }}
                  />
                )}
                <div style={{ fontWeight: 700, color: "hsl(var(--primary))", fontSize: 14 }}>
                  {fmt(l.price, l.currency)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, margin: "2px 0" }}>{l.title}</div>
                {l.city && <div style={{ fontSize: 11, color: "#666" }}>{l.city}</div>}
                <Link
                  to={`/annonce/${l.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "hsl(var(--primary))",
                    textDecoration: "underline",
                  }}
                >
                  Voir l'annonce →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
