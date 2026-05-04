export type BoutiqueStatus = "active" | "suspended" | "pending";
export type BoutiqueBadge = "official" | "affiliated";

export interface Boutique {
  id: number;
  name: string;
  emoji: string;
  bgColor: string;
  official: boolean;
  desc: string;
  tags: string[];
  rating: number;
  reviews: number;
}

export interface AdminBoutique extends Boutique {
  status: BoutiqueStatus;
  logoUrl: string;
}

const BASE_BOUTIQUES: Omit<Boutique, "id">[] = [
  {
    name: "TechDeal Store",
    emoji: "🖥️",
    bgColor: "#1e3a8a",
    official: true,
    desc: "Électronique reconditionnée & remis à neuf",
    tags: ["Électronique", "Informatique"],
    rating: 4.9,
    reviews: 847,
  },
  {
    name: "MeubleFlash Montréal",
    emoji: "🛋️",
    bgColor: "#7c2d12",
    official: true,
    desc: "Meubles neufs et en liquidation",
    tags: ["Meubles", "Déco", "Maison"],
    rating: 4.7,
    reviews: 523,
  },
  {
    name: "ModaPlus Québec",
    emoji: "👗",
    bgColor: "#9d174d",
    official: false,
    desc: "Vêtements, chaussures et accessoires",
    tags: ["Mode", "Femme", "Homme"],
    rating: 4.6,
    reviews: 312,
  },
  {
    name: "CuisineXpress",
    emoji: "🍳",
    bgColor: "#854d0e",
    official: false,
    desc: "Électroménagers neufs & reconditionnés",
    tags: ["Cuisine", "Électroménager"],
    rating: 4.8,
    reviews: 634,
  },
  {
    name: "SportDeal Laval",
    emoji: "🏋️",
    bgColor: "#166534",
    official: true,
    desc: "Équipements sportifs à prix cassés",
    tags: ["Sport", "Plein air", "Fitness"],
    rating: 4.5,
    reviews: 289,
  },
  {
    name: "BébéFlash",
    emoji: "🍼",
    bgColor: "#0e7490",
    official: false,
    desc: "Puériculture, jouets et vêtements enfants",
    tags: ["Bébé", "Enfants", "Jouets"],
    rating: 4.9,
    reviews: 412,
  },
];

const NAME_SUFFIX_GROUPS: string[][] = [
  ["", " Laval", " Rive-Sud", " Québec", " Ottawa", " Sherbrooke", " Gatineau", " Brossard", " Anjou", " Longueuil", " Repentigny", " Terrebonne", " Saint-Laurent", " Westmount", " Verdun", " LaSalle", " Côte-des-Neiges", " Rosemont", " Villeray", " Mercier"],
  ["", " Rive-Nord", " Brossard", " Laval", " Terrebonne", " Longueuil", " Repentigny", " Drummondville", " Granby", " Joliette", " Mirabel", " Blainville", " Mascouche", " Sainte-Julie", " Saint-Eustache", " Boisbriand", " Deux-Montagnes", " Lachenaie", " Rosemère", " Lorraine"],
  ["", " Laval", " Brossard", " Anjou", " Saint-Laurent", " Boucherville", " Vaudreuil", " Châteauguay", " Sainte-Thérèse", " Saint-Jean", " Salaberry", " Chambly", " Beloeil", " Varennes", " Candiac", " Delson", " Laprairie", " Kahnawake", " Mercier", " Napierville"],
  [" Pro", " Plus", " Sud", " Nord", " Prestige", " Experts", " Express", " Direct", " Discount", " Entrepôt", " Outlet", " Factory", " Center", " Maison", " Premium", " Deluxe", " Market", " Boutique", " Depot", " Online"],
  ["", " Montréal", " Québec", " Sherbrooke", " Laval", " Longueuil", " Trois-Rivières", " Saguenay", " Lévis", " Drummondville", " Saint-Jean", " Rimouski", " Rouyn", " Val-d'Or", " Alma", " Baie-Comeau", " Chicoutimi", " Joliette", " Saint-Hyacinthe", " Sorel"],
  [" Plus", " Pro", " Boutique", " Prestige", " Experts", " Express", " Famille", " Santé", " Nature", " Bien-être", " Confort", " Couture", " Tendresse", " Premium", " Direct", " Discount", " Maison", " Online", " Créations", " Design"],
];

const EMOJIS = ["🖥️", "🛋️", "👗", "🍳", "🏋️", "🍼"];
const BG_COLORS = ["#1e3a8a", "#7c2d12", "#9d174d", "#854d0e", "#166534", "#0e7490"];

const TAG_GROUPS: string[][] = [
  ["Électronique", "Informatique", "Téléphonie", "Photo", "Audio"],
  ["Meubles", "Déco", "Maison", "Literie", "Jardin"],
  ["Mode", "Femme", "Homme", "Chaussures", "Accessoires"],
  ["Cuisine", "Électroménager", "Arts de table", "Robot", "Café"],
  ["Sport", "Plein air", "Fitness", "Vélos", "Randonnée"],
  ["Bébé", "Enfants", "Jouets", "Puériculture", "Éducatif"],
];

function seeded(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateBoutiques(): Boutique[] {
  const boutiques: Boutique[] = [];
  for (let i = 0; i < 120; i++) {
    const baseIdx = i % 6;
    const suffixIdx = Math.floor(i / 6);
    const base = BASE_BOUTIQUES[baseIdx];
    const suffixes = NAME_SUFFIX_GROUPS[baseIdx];
    const name = base.name + (suffixes[suffixIdx % suffixes.length] ?? ` ${suffixIdx}`);

    // alternating official for auto-generated beyond first 6
    const official = i < 6 ? base.official : i % 2 === 0;

    const ratingBase = base.rating;
    const ratingVariant = (seeded(i * 11 + 2) - 0.5) * 0.4;
    const rating = Math.max(3.5, Math.min(5.0, Math.round((ratingBase + ratingVariant) * 10) / 10));
    const reviews = Math.floor(50 + seeded(i * 13 + 7) * 950);

    boutiques.push({
      id: i + 1,
      name,
      emoji: EMOJIS[baseIdx],
      bgColor: BG_COLORS[baseIdx],
      official,
      desc: base.desc,
      tags: TAG_GROUPS[baseIdx].slice(0, 2 + Math.floor(seeded(i * 3) * 3)),
      rating,
      reviews,
    });
  }
  return boutiques;
}

export const ALL_BOUTIQUES: Boutique[] = generateBoutiques();

const SUSPENDED_IDS = new Set([15, 48, 93]);
const ADMIN_BOUTIQUES_STORAGE_KEY = "df_admin_boutiques";

export function getAdminBoutiques(): AdminBoutique[] {
  try {
    const stored = localStorage.getItem(ADMIN_BOUTIQUES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AdminBoutique[];
  } catch {
    // ignore
  }
  return ALL_BOUTIQUES.map((b) => ({
    ...b,
    status: SUSPENDED_IDS.has(b.id) ? "suspended" : "active",
    logoUrl: "",
  }));
}

export function saveAdminBoutiques(items: AdminBoutique[]): void {
  localStorage.setItem(ADMIN_BOUTIQUES_STORAGE_KEY, JSON.stringify(items));
}
