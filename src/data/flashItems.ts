export interface FlashItem {
  id: number;
  name: string;
  regularPrice: number;
  flashPrice: number;
  discount: number;
  imageUrl: string;
  timerSeconds: number;
  stock: number;
}

export type FlashStatus = "active" | "expired" | "pending";

export interface AdminFlashItem extends FlashItem {
  status: FlashStatus;
}

const IMAGES = [
  "https://images.unsplash.com/photo-1593359677879-a4bb92f4bce4?w=400&q=80",
  "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80",
  "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80",
  "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=400&q=80",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
  "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80",
];

const NAME_VARIANTS: string[][] = [
  [
    'Samsung 55" QLED 4K UHD', 'Samsung 65" QLED 4K', 'Samsung 75" QLED 8K',
    'Samsung 85" Neo QLED', 'Samsung 43" Crystal UHD', 'Samsung 50" OLED 4K',
    'Samsung 70" QLED 4K', 'Samsung 32" Full HD', 'Samsung 58" AU7000',
    'Samsung 77" S95C OLED', 'Samsung 65" QN85B Neo', 'Samsung 75" QN90B',
    'Samsung 55" Frame QLED', 'Samsung 43" Q60B QLED', 'Samsung 85" QN900C',
    'Samsung 65" S90C OLED', 'Samsung 50" QN90C Neo', 'Samsung 75" Frame QLED',
    'Samsung 32" Smart TV HD', 'Samsung 43" QLED 4K', 'Samsung 55" Neo QLED 8K',
    'Samsung 65" Q80B QLED', 'Samsung 75" QN85C Neo', 'Samsung 85" Q60B QLED',
    'Samsung 50" TU8000 Crystal',
  ],
  [
    'Instant Pot Duo 7-en-1 8L', 'Instant Pot Max 9-en-1 6L', 'Instant Pot Pro 10-en-1 8L',
    'Instant Pot Duo 7-en-1 6L', 'Instant Pot Crisp 11-en-1', 'Instant Pot Ultra 10-en-1',
    'Instant Pot Viva 9-en-1', 'Instant Pot Rio 7-en-1', 'Instant Pot Duo Plus 9-en-1',
    'Instant Pot Duo Gourmet 5L', 'Instant Pot Pro Plus 10-en-1', 'Instant Pot Duo Nova 6L',
    'Instant Pot Max 9-en-1 8L', 'Instant Pot Smart WiFi', 'Instant Pot Duo Evo Plus',
    'Instant Pot Lux 6-en-1 8L', 'Instant Pot Gem 8-en-1', 'Instant Pot Ace Plus',
    'Instant Pot Air Fryer 6L', 'Instant Pot Duo 3L Mini', 'Instant Pot Pro 8L XL',
    'Instant Pot Duo SV Sous Vide', 'Instant Pot Max 6L Premium', 'Instant Pot Crisp 8L',
    'Instant Pot Duo Plus 8L',
  ],
  [
    'Vélo électrique pliant 250W', 'Vélo électrique urbain 500W', 'Vélo électrique montagne 750W',
    'Vélo électrique cargo 350W', 'Vélo électrique pliant 350W', 'Vélo électrique route 250W',
    'Vélo électrique VTT 500W', 'Vélo électrique hybride 400W', 'Vélo électrique city 300W',
    'Vélo électrique cargo lourd 500W', 'Vélo électrique pliable 250W sport', 'Vélo électrique femme 350W',
    'Vélo électrique gravel 500W', 'Vélo électrique fat bike 750W', 'Vélo électrique pliant 500W',
    'Vélo électrique tout-terrain 600W', 'Vélo électrique trekking 250W', 'Vélo électrique BMX 500W',
    'Vélo électrique classique 250W', 'Vélo électrique premium 1000W', 'Vélo électrique pliable mini 200W',
    'Vélo électrique downhill 750W', 'Vélo électrique commuter 400W', 'Vélo électrique rétro 350W',
    'Vélo électrique longtail cargo 500W',
  ],
  [
    'AirPods Pro 2e génération', 'AirPods 3e génération', 'AirPods Max casque',
    'AirPods Pro USB-C', 'AirPods 2e génération', 'AirPods Pro blanc',
    'AirPods Max bleu minuit', 'AirPods Max gris sidéral', 'AirPods Max lumière stellaire',
    'AirPods Pro MagSafe', 'AirPods 3e gen Lightning', 'AirPods Max vert',
    'AirPods Pro 1re génération', 'AirPods Max rose', 'AirPods 1re génération',
    'AirPods Pro black edition', 'AirPods Max space grey', 'AirPods Pro transparents',
    'AirPods 3e gen boîtier MagSafe', 'AirPods Max bleu ciel', 'AirPods Pro avec étui',
    'AirPods Max premium pack', 'AirPods Pro refurb certifié', 'AirPods 3e gen refurb',
    'AirPods Max minuit',
  ],
  [
    'Canapé 3 places en velours', "Canapé d'angle en cuir", 'Canapé 2 places convertible',
    'Canapé panoramique 5 places', 'Canapé 3 places tissu gris', 'Canapé-lit en velours bleu',
    'Canapé modulable gris', 'Canapé Chesterfield vert', 'Canapé 3 places en lin',
    "Canapé d'angle XL 6 places", 'Canapé 2 places cuir brun', 'Canapé U en tissu',
    'Canapé convertible 3 places', 'Canapé relax électrique', 'Canapé Chesterfield beige',
    'Canapé en velours ocre', 'Canapé moderne scandinave', 'Canapé-lit ouverture rapide',
    'Canapé 4 places en microfibre', 'Canapé vintage cuir caramel', 'Canapé XL 7 places modulable',
    'Canapé sectionnel gris', 'Canapé 3 places rotin naturel', 'Canapé relax manuel 2 places',
    'Canapé club 2 places en cuir',
  ],
  [
    'Machine à expresso 19 bars', 'Machine à café automatique', 'Machine à capsules Nespresso',
    'Machine à expresso manuelle', 'Cafetière à piston 1L', 'Machine Dolce Gusto 15 bars',
    'Machine à expresso 20 bars', 'Cafetière filtre programmable', 'Machine à café grain broyeur',
    'Machine expresso semi-automatique', 'Machine à café percolateur', 'Machine Nespresso Vertuo',
    'Broyeur à café conique', 'Machine à café professionnelle', 'Cafetière italienne Bialetti',
    'Machine expresso chromée rétro', 'Cafetière Chemex 6 tasses', 'Machine Nespresso Lattissima',
    'Machine café en grains compacte', 'Expresso bar 15 bars chromé', 'Machine à café design',
    'Cafetière filtre inox 1.5L', 'Machine Dolce Gusto Infinissima', 'Machine expresso mousse',
    'Machine café super-automatique',
  ],
  [
    'Trottinette électrique 500W', 'Trottinette électrique 800W', 'Trottinette électrique 1000W',
    'Trottinette adulte 350W', 'Trottinette tout-terrain 500W', 'Trottinette pliable 600W',
    'Trottinette pro 800W', 'Trottinette enfant 200W', 'Trottinette double moteur 1600W',
    'Trottinette électrique sport 1200W', 'Trottinette pliante longue portée', 'Trottinette fat tire 1000W',
    'Trottinette hors-route 2400W', 'Trottinette urbaine 400W', 'Trottinette compacte 350W',
    'Trottinette électrique premium 1500W', 'Trottinette adolescent 300W', 'Trottinette trail 750W',
    'Trottinette électrique pliable 500W', 'Trottinette cargo 600W', 'Trottinette booster 800W',
    'Trottinette tout-terrain 1200W', 'Trottinette ultralight 250W', 'Trottinette pro 1000W sport',
    'Trottinette électrique longue portée 700W',
  ],
  [
    'Apple iPad 10e génération', 'Apple iPad Air 5e génération', 'Apple iPad Mini 6e génération',
    'Apple iPad Pro 11"', 'Apple iPad Pro 12.9"', 'Apple iPad 9e génération',
    'Apple iPad Air M1', 'Apple iPad Mini M1', 'Apple iPad Pro 11" M2',
    'Apple iPad Pro 12.9" M2', 'Apple iPad 10e gen WiFi+Cell', 'Apple iPad Air M2',
    'Apple iPad Mini 7e génération', 'Apple iPad 8e génération', 'Apple iPad Pro 11" M4',
    'Apple iPad Pro 13" M4', 'Apple iPad Air 11" M2', 'Apple iPad Air 13" M2',
    'Apple iPad 10e gen 256Go', 'Apple iPad Air 5e gen 256Go', 'Apple iPad Mini 6 256Go',
    'Apple iPad Pro 12.9" 512Go', 'Apple iPad 9e gen 64Go', 'Apple iPad Air 4e génération',
    'Apple iPad Pro 11" 1To',
  ],
];

const BASE_PRICES = [
  { regular: 1299, flash: 699, discount: 46 },
  { regular: 249, flash: 89, discount: 64 },
  { regular: 1899, flash: 949, discount: 50 },
  { regular: 329, flash: 199, discount: 39 },
  { regular: 1499, flash: 749, discount: 50 },
  { regular: 599, flash: 279, discount: 53 },
  { regular: 899, flash: 449, discount: 50 },
  { regular: 679, flash: 429, discount: 37 },
];

const BASE_TIMERS = [
  4 * 3600 + 32 * 60 + 17,
  11 * 3600 + 5 * 60 + 42,
  47 * 60 + 33,
  23 * 3600 + 15 * 60 + 8,
  7 * 3600 + 20 * 60 + 55,
  2 * 3600 + 10 * 60 + 22,
  16 * 3600 + 44 * 60 + 10,
  9 * 3600 + 58 * 60 + 1,
];

const BASE_STOCKS = [2, 7, 1, 12, 3, 5, 4, 9];

function seeded(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateFlashItems(): FlashItem[] {
  const items: FlashItem[] = [];
  for (let i = 0; i < 200; i++) {
    const baseIdx = i % 8;
    const variantIdx = Math.floor(i / 8);
    const names = NAME_VARIANTS[baseIdx];
    const name = names[variantIdx % names.length];
    const bp = BASE_PRICES[baseIdx];

    let regularPrice: number;
    let flashPrice: number;
    let discount: number;
    let timerSeconds: number;
    let stock: number;

    if (i < 8) {
      regularPrice = bp.regular;
      flashPrice = bp.flash;
      discount = bp.discount;
      timerSeconds = BASE_TIMERS[baseIdx];
      stock = BASE_STOCKS[baseIdx];
    } else {
      const mult = 0.8 + seeded(i * 7 + 1) * 0.7;
      regularPrice = Math.round((bp.regular * mult) / 5) * 5;
      flashPrice = Math.round((bp.flash * mult) / 5) * 5;
      discount = Math.round(((regularPrice - flashPrice) / regularPrice) * 100);
      timerSeconds = Math.floor(1800 + seeded(i * 13 + 3) * (86399 - 1800));
      stock = Math.floor(1 + seeded(i * 17 + 5) * 15);
    }

    items.push({
      id: i + 1,
      name,
      regularPrice,
      flashPrice,
      discount,
      imageUrl: IMAGES[baseIdx],
      timerSeconds,
      stock,
    });
  }
  return items;
}

export const ALL_FLASH_ITEMS: FlashItem[] = generateFlashItems();

const FLASH_STATUS: FlashStatus[] = [
  ...Array(156).fill("active"),
  ...Array(32).fill("expired"),
  ...Array(12).fill("pending"),
];

const FLASH_STATUS_KEY = "df_admin_flash_items";

export function getAdminFlashItems(): AdminFlashItem[] {
  try {
    const stored = localStorage.getItem(FLASH_STATUS_KEY);
    if (stored) return JSON.parse(stored) as AdminFlashItem[];
  } catch {
    // ignore
  }
  return ALL_FLASH_ITEMS.map((item, i) => ({
    ...item,
    status: FLASH_STATUS[i],
  }));
}

export function saveAdminFlashItems(items: AdminFlashItem[]): void {
  localStorage.setItem(FLASH_STATUS_KEY, JSON.stringify(items));
}
