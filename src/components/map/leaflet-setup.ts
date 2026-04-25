import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in bundlers (Leaflet uses image URLs that break with Vite)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error — internal Leaflet API
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const userLocationIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;border-radius:9999px;
    background:hsl(var(--accent));
    border:3px solid hsl(var(--background));
    box-shadow:0 0 0 2px hsl(var(--accent)/0.4), 0 4px 12px hsl(var(--accent)/0.5);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export { L };
