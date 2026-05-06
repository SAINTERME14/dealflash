export interface Partner {
  id: number;
  name: string;
  color: string;
  order: number;
  visible: boolean;
}

const DEFAULT_PARTNERS: Partner[] = [
  { id: 1, name: "RONA", color: "#E31837", order: 1, visible: true },
  { id: 2, name: "Canadian Tire", color: "#cc0000", order: 2, visible: true },
  { id: 3, name: "Dollarama", color: "#FFD100", order: 3, visible: true },
  { id: 4, name: "Bureau en Gros", color: "#cc0000", order: 4, visible: true },
  { id: 5, name: "Brault & Martineau", color: "#003087", order: 5, visible: true },
  { id: 6, name: "Structube", color: "#FFD000", order: 6, visible: true },
  { id: 7, name: "Corbeil", color: "#005baa", order: 7, visible: true },
  { id: 8, name: "Surplus RD", color: "#e8890c", order: 8, visible: true },
  { id: 9, name: "Déco Découverte", color: "#6ab04c", order: 9, visible: true },
  { id: 10, name: "The Brick", color: "#003087", order: 10, visible: true },
  { id: 11, name: "Sports Experts", color: "#d62b2b", order: 11, visible: true },
  { id: 12, name: "Simons", color: "#FFD000", order: 12, visible: true },
];

const PARTNERS_STORAGE_KEY = "df_admin_partners";

export function getPartners(): Partner[] {
  try {
    const stored = localStorage.getItem(PARTNERS_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Partner[];
  } catch {
    // ignore
  }
  return DEFAULT_PARTNERS.map((p) => ({ ...p }));
}

export function savePartners(partners: Partner[]): void {
  localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners));
  window.dispatchEvent(new CustomEvent("df_partners_updated"));
}
