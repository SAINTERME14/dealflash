import { useState, useCallback } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(() => {
    try {
      const saved = localStorage.getItem("dealflash_geo");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Géolocalisation non supportée par ce navigateur.");
      return Promise.reject(new Error("unsupported"));
    }
    setLoading(true);
    setError(null);
    return new Promise<GeoPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p: GeoPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(p);
          setLoading(false);
          try { localStorage.setItem("dealflash_geo", JSON.stringify(p)); } catch { /* ignore quota errors */ }
          resolve(p);
        },
        (err) => {
          setLoading(false);
          const msg = err.code === 1
            ? "Permission refusée. Activez la localisation dans votre navigateur."
            : "Impossible d'obtenir votre position.";
          setError(msg);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  const clear = useCallback(() => {
    setPosition(null);
    try { localStorage.removeItem("dealflash_geo"); } catch { /* ignore */ }
  }, []);

  return { position, loading, error, request, clear };
}

/** Haversine distance in kilometers */
export function haversineKm(a: GeoPosition, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
