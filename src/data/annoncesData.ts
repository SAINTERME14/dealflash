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

const ANNONCE_STORAGE_KEY = "df_admin_annonces";

function seeded(n: number): number {
  return Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;
}

const CATEGORIES = [
  "Immobilier", "Véhicules", "Électronique", "Meubles", "Mode",
  "Outils", "Sports", "Livres", "Animaux", "Divers",
];

const LOCATIONS = [
  "Montréal, QC", "Québec, QC", "Laval, QC", "Longueuil, QC", "Gatineau, QC",
  "Sherbrooke, QC", "Lévis, QC", "Saguenay, QC", "Trois-Rivières, QC", "Brossard, QC",
  "Saint-Jean-sur-Richelieu, QC", "Repentigny, QC", "Drummondville, QC", "Saint-Jérôme, QC", "Granby, QC",
];

const SELLERS = [
  "Annie Bouchard", "Stéphane Nadeau", "Karine Vachon", "Bruno Poirier", "Mélissa Lévesque",
  "Thierry Archambault", "Véronique Dion", "Maxime Lachance", "Christine Gauthier", "Alexandre Mercier",
  "Valérie Chartrand", "Gabriel Hébert", "Sandrine Vermette", "Olivier Desrochers", "Émilie Rousseau",
  "Nicolas Bélisle", "Laura Hamelin", "Philippe Desmarais", "Marie-Claude Picard", "Frédéric Dumont",
];

const TITLES: Record<string, string[]> = {
  Immobilier: ["Condo 2 chambres à vendre", "Maison unifamiliale", "Terrain constructible", "Duplex revenu", "Studio meublé à louer", "Chalet bord du lac"],
  Véhicules: ["Toyota Corolla 2019", "Honda Civic 2021", "Ford F-150 2018", "Subaru Outback 2020", "Moto Yamaha 650cc", "VTT Arctic Cat 450"],
  Électronique: ["iPhone 15 Pro Max", "MacBook Pro M3", "Samsung TV 65 po", "PlayStation 5", "AirPods Pro 2e gén", "Tablette iPad Pro"],
  Meubles: ["Sofa cuir brun", "Table de salle à manger", "Lit queen avec tête", "Bureau de travail", "Bibliothèque en pin", "Chaise de bureau ergonomique"],
  Mode: ["Manteau Canada Goose", "Sac Louis Vuitton", "Jordans Air 1 neuves", "Montre Seiko automatique", "Robe de soirée taille S", "Veston Hugo Boss"],
  Outils: ["Perceuse Dewalt 18V", "Scie circulaire Makita", "Compresseur 60L", "Coffre à outils complet", "Niveau laser rotatif", "Ponceuse orbitale"],
  Sports: ["Vélo de montagne Trek", "Skis Rossignol 170cm", "Kayak double", "Appareil elliptique", "Raquettes de tennis Wilson", "Équipement hockey complet"],
  Livres: ["Collection Harry Potter", "Romans policiers lot 20", "Atlas géographique 2023", "Livres de cuisine québécoise", "BD Tintin complet", "Encyclopédie Larousse"],
  Animaux: ["Labrador 3 mois", "Cage perroquet grande", "Aquarium 100L équipé", "Chattière automatique", "Harnais pour chien", "Nourriture chat premium"],
  Divers: ["Planète d'enfant jouets", "Machine espresso Breville", "Véhicule électrique jouet", "Instruments de musique", "Matériel photographie", "Articles de jardinage"],
};

const STATUSES: AnnonceStatus[] = ["active", "active", "active", "pending", "sold", "suspended"];

function makeDate(n: number): string {
  const d = new Date(2024, Math.floor(seeded(n * 13) * 12), Math.floor(seeded(n * 17) * 28) + 1);
  return d.toISOString().split("T")[0];
}

const SEED_ANNONCES: AnnonceItem[] = Array.from({ length: 60 }, (_, i) => {
  const s = seeded(i + 1);
  const cat = CATEGORIES[Math.floor(s * CATEGORIES.length)];
  const titles = TITLES[cat];
  const titleIdx = Math.floor(seeded(i + 60) * titles.length);
  const price = Math.round((seeded(i + 120) * 4900 + 10) / 5) * 5;
  return {
    id: i + 1,
    title: titles[titleIdx],
    sellerName: SELLERS[Math.floor(seeded(i + 240) * SELLERS.length)],
    category: cat,
    price,
    location: LOCATIONS[Math.floor(seeded(i + 360) * LOCATIONS.length)],
    status: STATUSES[Math.floor(seeded(i + 480) * STATUSES.length)],
    createdAt: makeDate(i),
  };
});

export function getAdminAnnonces(): AnnonceItem[] {
  try {
    const raw = localStorage.getItem(ANNONCE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AnnonceItem[];
  } catch {
    // ignore
  }
  return SEED_ANNONCES;
}

export function saveAdminAnnonces(items: AnnonceItem[]): void {
  localStorage.setItem(ANNONCE_STORAGE_KEY, JSON.stringify(items));
}
