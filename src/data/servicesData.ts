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

const SERVICE_CATEGORIES = [
  "Plomberie", "Électricité", "Peinture", "Menuiserie", "Jardinage",
  "Informatique", "Comptabilité", "Déménagement", "Nettoyage", "Rénovation",
];

const SERVICE_TITLES: string[][] = [
  ["Débouchage canalisation urgence", "Installation robinetterie", "Réparation fuite d'eau", "Remplacement chauffe-eau"],
  ["Installation tableau électrique", "Mise aux normes électriques", "Pose de prises et interrupteurs", "Dépannage électrique"],
  ["Peinture intérieure appartement", "Peinture façade maison", "Enduit et peinture salon", "Ravalement de façade"],
  ["Fabrication meuble sur mesure", "Pose de parquet flottant", "Réparation meubles anciens", "Installation cuisine"],
  ["Tonte de pelouse régulière", "Taille de haies et arbustes", "Création jardin paysager", "Entretien espaces verts"],
  ["Dépannage informatique domicile", "Installation réseau WiFi", "Récupération données disque dur", "Formation informatique"],
  ["Déclaration impôts particuliers", "Comptabilité PME mensuelle", "Bilan comptable annuel", "Conseil fiscal entreprise"],
  ["Déménagement local appartement", "Déménagement longue distance", "Emballage et protection meubles", "Transport objets fragiles"],
  ["Nettoyage fin de bail appartement", "Nettoyage après travaux", "Entretien bureaux hebdomadaire", "Nettoyage vitres en hauteur"],
  ["Rénovation salle de bain complète", "Pose carrelage sol et mur", "Isolation thermique combles", "Réfection toiture partielle"],
];

const SELLER_NAMES = [
  "Martin Dupont", "Sophie Tremblay", "Jean-François Côté", "Marie Lavoie",
  "Pierre Gagnon", "Isabelle Roy", "Michel Bouchard", "Nathalie Fortin",
  "François Leblanc", "Caroline Morin",
];

const LOCATIONS = [
  "Montréal", "Laval", "Longueuil", "Québec", "Sherbrooke",
  "Gatineau", "Terrebonne", "Brossard", "Repentigny", "Lévis",
];

function seeded(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateServices(): ServiceItem[] {
  const items: ServiceItem[] = [];
  for (let i = 0; i < 50; i++) {
    const catIdx = i % 10;
    const titleIdx = Math.floor(seeded(i * 7 + 1) * 4);
    const price = Math.round((50 + seeded(i * 11 + 2) * 450) / 5) * 5;
    const sellerIdx = Math.floor(seeded(i * 13 + 3) * 10);
    const locationIdx = Math.floor(seeded(i * 17 + 5) * 10);
    const daysAgo = Math.floor(seeded(i * 3 + 7) * 90);
    const date = new Date(Date.now() - daysAgo * 86400000);

    let status: ServiceStatus = "active";
    if (i === 12 || i === 27 || i === 38) status = "suspended";
    else if (i >= 46) status = "pending";

    items.push({
      id: i + 1,
      title: SERVICE_TITLES[catIdx][titleIdx],
      sellerName: SELLER_NAMES[sellerIdx],
      category: SERVICE_CATEGORIES[catIdx],
      price,
      location: LOCATIONS[locationIdx],
      status,
      createdAt: date.toISOString().slice(0, 10),
    });
  }
  return items;
}

export const ALL_SERVICES: ServiceItem[] = generateServices();

const SERVICES_STORAGE_KEY = "df_admin_services";

export function getAdminServices(): ServiceItem[] {
  try {
    const stored = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as ServiceItem[];
  } catch {
    // ignore
  }
  return ALL_SERVICES.map((s) => ({ ...s }));
}

export function saveAdminServices(items: ServiceItem[]): void {
  localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(items));
}
