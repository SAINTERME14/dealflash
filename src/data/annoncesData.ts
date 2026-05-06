export type AnnonceStatus = "active" | "suspended" | "pending" | "sold";

export interface AnnonceItem {
  id: number;
  title: string;
  sellerName: string;
  category: string;
  price: number;
  location: string;
  status: AnnonceStatus;
  createdAt: string;
}

const ANNONCE_CATEGORIES = [
  "Immobilier", "Véhicules", "Électronique", "Meubles", "Mode",
  "Outils", "Sports", "Livres", "Animaux", "Divers",
];

const ANNONCE_TITLES: string[][] = [
  ["Appartement 3½ à louer", "Condo 4½ à vendre", "Maison unifamiliale à vendre", "Studio meublé disponible"],
  ["Honda Civic 2019 à vendre", "Toyota Corolla 2021", "VUS Hyundai Tucson 2020", "Camion Ford F-150 2018"],
  ["iPhone 14 Pro Max 256Go", "MacBook Pro M2 2022", "Samsung Galaxy S23 Ultra", "iPad Pro 11 pouces M2"],
  ["Canapé 3 places en cuir", "Table de salle à manger", "Lit queen avec sommier", "Armoire penderie IKEA"],
  ["Manteau d'hiver North Face", "Chaussures Nike Air Max", "Sac à main Louis Vuitton", "Vêtements femme taille M"],
  ["Perceuse Dewalt 18V kit", "Scie circulaire Bosch", "Marteau Makita + accessoires", "Caisse à outils complète"],
  ["Vélo de montagne Trek", "Skis Rossignol + fixations", "Raquettes de tennis Wilson", "Tapis de yoga + blocs"],
  ["Collection Harry Potter FR", "Manuel d'ingénierie 3e éd.", "Romans policiers lot 20 livres", "Bandes dessinées Astérix"],
  ["Chiot Labrador 8 semaines", "Chaton Bengal à adopter", "Cage perroquet + accessoires", "Aquarium 100L complet"],
  ["Instruments de musique lot", "Jeux de société collection", "Articles de cuisine pro", "Matériel photo Canon"],
];

const SELLER_NAMES = [
  "Alex Bergeron", "Julie Perron", "Marc-Antoine Denis", "Sandra Poulin",
  "Kevin Simard", "Mélanie Gauthier", "Stéphane Cloutier", "Annie Grenier",
  "Patrick Auger", "Valérie Charron",
];

const LOCATIONS = [
  "Montréal", "Laval", "Québec", "Longueuil", "Sherbrooke",
  "Ottawa", "Gatineau", "Brossard", "Repentigny", "Saint-Jean",
];

function seeded(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateAnnonces(): AnnonceItem[] {
  const items: AnnonceItem[] = [];
  for (let i = 0; i < 60; i++) {
    const catIdx = i % 10;
    const titleIdx = Math.floor(seeded(i * 5 + 2) * 4);
    const price = Math.round((25 + seeded(i * 9 + 3) * 1975) / 5) * 5;
    const sellerIdx = Math.floor(seeded(i * 11 + 4) * 10);
    const locationIdx = Math.floor(seeded(i * 13 + 6) * 10);
    const daysAgo = Math.floor(seeded(i * 7 + 1) * 60);
    const date = new Date(Date.now() - daysAgo * 86400000);

    let status: AnnonceStatus = "active";
    if (i === 8 || i === 23 || i === 45) status = "suspended";
    else if (i === 15 || i === 31 || i === 52) status = "sold";
    else if (i >= 56) status = "pending";

    items.push({
      id: i + 1,
      title: ANNONCE_TITLES[catIdx][titleIdx],
      sellerName: SELLER_NAMES[sellerIdx],
      category: ANNONCE_CATEGORIES[catIdx],
      price,
      location: LOCATIONS[locationIdx],
      status,
      createdAt: date.toISOString().slice(0, 10),
    });
  }
  return items;
}

export const ALL_ANNONCES: AnnonceItem[] = generateAnnonces();

const ANNONCES_STORAGE_KEY = "df_admin_annonces";

export function getAdminAnnonces(): AnnonceItem[] {
  try {
    const stored = localStorage.getItem(ANNONCES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AnnonceItem[];
  } catch {
    // ignore
  }
  return ALL_ANNONCES.map((a) => ({ ...a }));
}

export function saveAdminAnnonces(items: AnnonceItem[]): void {
  localStorage.setItem(ANNONCES_STORAGE_KEY, JSON.stringify(items));
}
