export type ServiceStatus = "active" | "suspended" | "pending";

export interface ServiceItem {
  id: number;
  title: string;
  sellerName: string;
  category: string;
  price: number;
  location: string;
  status: ServiceStatus;
  createdAt: string;
}

const SERVICE_STORAGE_KEY = "df_admin_services";

function seeded(n: number): number {
  return Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;
}

const CATEGORIES = [
  "Plomberie", "Électricité", "Peinture", "Menuiserie", "Jardinage",
  "Informatique", "Comptabilité", "Déménagement", "Nettoyage", "Rénovation",
];

const LOCATIONS = [
  "Montréal, QC", "Québec, QC", "Laval, QC", "Longueuil, QC", "Gatineau, QC",
  "Sherbrooke, QC", "Lévis, QC", "Saguenay, QC", "Trois-Rivières, QC", "Terrebonne, QC",
];

const SELLERS = [
  "Jean-Marc Tremblay", "Sophie Gagnon", "Marc Bouchard", "Julie Côté", "Patrick Fortin",
  "Isabelle Roy", "François Leblanc", "Nathalie Morin", "Éric Pelletier", "Caroline Martin",
  "Alain Bergeron", "Marie-Ève Girard", "Claude Ouellet", "Sylvie Lavoie", "Denis Bélanger",
  "Lucie Thibault", "Roger Caron", "Andrée Simard", "Michel Paquin", "Johanne Bédard",
];

const TITLES: Record<string, string[]> = {
  Plomberie: ["Réparation de fuite d'eau", "Installation robinets", "Débouchage drain", "Remplacement chauffe-eau", "Inspection plomberie"],
  Électricité: ["Installation prise électrique", "Remplacement panneau", "Câblage luminaire", "Inspection électrique", "Installation thermopompe"],
  Peinture: ["Peinture intérieure salon", "Peinture extérieure maison", "Application enduit", "Peinture chambre enfant", "Décapage et peinture"],
  Menuiserie: ["Fabrication armoires cuisine", "Installation plancher bois", "Réparation meuble", "Construction deck", "Pose de portes"],
  Jardinage: ["Entretien pelouse", "Taille arbres et haies", "Aménagement paysager", "Installation irrigation", "Déneigement entrée"],
  Informatique: ["Réparation ordinateur", "Configuration réseau", "Récupération données", "Installation logiciels", "Cours informatique"],
  Comptabilité: ["Déclaration impôts", "Tenue de livres", "Audit financier", "Conseil fiscal", "Gestion paie"],
  Déménagement: ["Déménagement local", "Transport meubles", "Emballage professionnel", "Déménagement long distance", "Stockage temporaire"],
  Nettoyage: ["Nettoyage résidentiel", "Nettoyage commercial", "Lavage vitres", "Nettoyage après travaux", "Désinfection locaux"],
  Rénovation: ["Rénovation cuisine", "Rénovation salle de bain", "Rénovation sous-sol", "Pose carreaux", "Isolation thermique"],
};

const STATUSES: ServiceStatus[] = ["active", "active", "active", "pending", "suspended"];

function makeDate(n: number): string {
  const d = new Date(2024, Math.floor(seeded(n * 7) * 12), Math.floor(seeded(n * 11) * 28) + 1);
  return d.toISOString().split("T")[0];
}

const SEED_SERVICES: ServiceItem[] = Array.from({ length: 50 }, (_, i) => {
  const s = seeded(i + 1);
  const cat = CATEGORIES[Math.floor(s * CATEGORIES.length)];
  const titles = TITLES[cat];
  const titleIdx = Math.floor(seeded(i + 50) * titles.length);
  const price = Math.round((seeded(i + 100) * 490 + 10) / 5) * 5;
  return {
    id: i + 1,
    title: titles[titleIdx],
    sellerName: SELLERS[Math.floor(seeded(i + 200) * SELLERS.length)],
    category: cat,
    price,
    location: LOCATIONS[Math.floor(seeded(i + 300) * LOCATIONS.length)],
    status: STATUSES[Math.floor(seeded(i + 400) * STATUSES.length)],
    createdAt: makeDate(i),
  };
});

export function getAdminServices(): ServiceItem[] {
  try {
    const raw = localStorage.getItem(SERVICE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ServiceItem[];
  } catch {
    // ignore
  }
  return SEED_SERVICES;
}

export function saveAdminServices(items: ServiceItem[]): void {
  localStorage.setItem(SERVICE_STORAGE_KEY, JSON.stringify(items));
}
