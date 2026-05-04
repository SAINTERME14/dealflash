import { useMemo, useRef, useState } from "react";
import { Pagination } from "./Pagination";

interface Service {
  id: number;
  name: string;
  emoji: string;
  bgColor: string;
  certified: boolean;
  desc: string;
  tags: string[];
  rating: number;
  reviews: number;
}

const BASE: Omit<Service, "id">[] = [
  { name: "Salon Élégance", emoji: "💇", bgColor: "#9d174d", certified: true, desc: "Coiffure, coloration et soins capillaires", tags: ["Coiffure", "Beauté"], rating: 4.9, reviews: 421 },
  { name: "Spa Zen Détente", emoji: "💆", bgColor: "#0e7490", certified: true, desc: "Massages, soins du visage et bien-être", tags: ["Spa", "Massage", "Bien-être"], rating: 4.8, reviews: 312 },
  { name: "Immobilier Prestige", emoji: "🏘️", bgColor: "#1e3a8a", certified: true, desc: "Achat, vente et location de propriétés", tags: ["Immobilier", "Courtier"], rating: 4.7, reviews: 198 },
  { name: "Hôtel Boréal", emoji: "🏨", bgColor: "#7c2d12", certified: true, desc: "Séjours, réservations et événements", tags: ["Hôtel", "Hébergement"], rating: 4.6, reviews: 587 },
  { name: "Auto Mécanique Pro", emoji: "🔧", bgColor: "#854d0e", certified: false, desc: "Réparation et entretien automobile", tags: ["Mécanique", "Auto"], rating: 4.5, reviews: 264 },
  { name: "Clinique Dentaire Sourire", emoji: "🦷", bgColor: "#166534", certified: true, desc: "Soins dentaires généraux et esthétiques", tags: ["Dentiste", "Santé"], rating: 4.9, reviews: 356 },
  { name: "Avocats Tremblay & Co", emoji: "⚖️", bgColor: "#374151", certified: true, desc: "Droit civil, familial et commercial", tags: ["Juridique", "Avocat"], rating: 4.7, reviews: 142 },
  { name: "Comptables Plus", emoji: "📊", bgColor: "#0f766e", certified: true, desc: "Comptabilité, fiscalité et impôts", tags: ["Comptable", "Fiscalité"], rating: 4.8, reviews: 203 },
  { name: "Restaurant Saveurs", emoji: "🍽️", bgColor: "#b91c1c", certified: false, desc: "Cuisine fusion et traiteur événementiel", tags: ["Restaurant", "Traiteur"], rating: 4.6, reviews: 489 },
  { name: "École de Conduite Route+", emoji: "🚗", bgColor: "#1d4ed8", certified: true, desc: "Cours théoriques et pratiques", tags: ["Auto-école", "Formation"], rating: 4.7, reviews: 178 },
  { name: "Photo Studio Lumière", emoji: "📸", bgColor: "#6d28d9", certified: false, desc: "Mariages, portraits et événementiel", tags: ["Photo", "Événement"], rating: 4.9, reviews: 245 },
  { name: "Plomberie Express", emoji: "🚿", bgColor: "#0891b2", certified: true, desc: "Dépannage 24/7 et installations", tags: ["Plombier", "Urgence"], rating: 4.5, reviews: 312 },
  { name: "Électricien Volt Pro", emoji: "⚡", bgColor: "#ca8a04", certified: true, desc: "Installation et mise aux normes", tags: ["Électricien", "RBQ"], rating: 4.8, reviews: 234 },
  { name: "Rénovation Maison+", emoji: "🔨", bgColor: "#7c2d12", certified: true, desc: "Cuisine, salle de bain et extensions", tags: ["Rénovation", "Construction"], rating: 4.6, reviews: 187 },
  { name: "Vétérinaire Animo Care", emoji: "🐾", bgColor: "#15803d", certified: true, desc: "Soins, vaccinations et chirurgie", tags: ["Vétérinaire", "Animaux"], rating: 4.9, reviews: 521 },
  { name: "Garderie Petits Pas", emoji: "🧸", bgColor: "#db2777", certified: true, desc: "Garde éducative 0-5 ans", tags: ["Garderie", "Enfants"], rating: 4.8, reviews: 167 },
  { name: "Coach Fitness Energy", emoji: "💪", bgColor: "#dc2626", certified: false, desc: "Entraînement personnalisé et nutrition", tags: ["Fitness", "Coach"], rating: 4.7, reviews: 298 },
  { name: "Déménagement Rapide", emoji: "📦", bgColor: "#4338ca", certified: true, desc: "Local, longue distance et entreposage", tags: ["Déménagement"], rating: 4.5, reviews: 412 },
  { name: "Paysagiste Verdure", emoji: "🌿", bgColor: "#16a34a", certified: false, desc: "Aménagement et entretien paysager", tags: ["Paysagiste", "Jardin"], rating: 4.6, reviews: 189 },
  { name: "Couvreur Toit-Sûr", emoji: "🏠", bgColor: "#78350f", certified: true, desc: "Toiture, bardeaux et imperméabilisation", tags: ["Couvreur", "Toiture"], rating: 4.8, reviews: 156 },
];

const CITIES = ["Laval", "Montréal", "Québec", "Sherbrooke", "Gatineau", "Trois-Rivières", "Longueuil", "Brossard"];

function rand(s: number) { const x = Math.sin(s) * 10000; return x - Math.floor(x); }

const ALL_SERVICES: Service[] = Array.from({ length: 80 }, (_, i) => {
  const b = BASE[i % BASE.length];
  if (i < BASE.length) return { ...b, id: i + 1 };
  const city = CITIES[Math.floor(rand(i) * CITIES.length)];
  return {
    ...b,
    id: i + 1,
    name: `${b.name} ${city}`,
    certified: i % 3 !== 0,
    rating: Math.round((4 + rand(i + 1)) * 10) / 10,
    reviews: 80 + Math.floor(rand(i + 2) * 800),
  };
});

const PER_PAGE = 6;

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span style={{ color: "#FFD000", letterSpacing: 1 }}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

export function ServicesSection() {
  const [page, setPage] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const totalPages = Math.ceil(ALL_SERVICES.length / PER_PAGE);

  const pageItems = useMemo(
    () => ALL_SERVICES.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [page]
  );

  const handlePage = (p: number) => {
    setPage(p);
    setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <section ref={sectionRef} className="py-16 px-4" style={{ background: "#0a0a0a", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white">🛠️ Services professionnels</h2>
          <p className="text-white/70 mt-2">Réservez auprès de professionnels vérifiés près de chez vous</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map((b) => (
            <div
              key={b.id}
              className="rounded-xl transition-all"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", padding: 20 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#FFD000";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(255,208,0,0.18)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2a2a2a";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="mb-3">
                {b.certified ? (
                  <span style={{ background: "#FFD000", color: "#111", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                    ✅ Pro Certifié
                  </span>
                ) : (
                  <span style={{ background: "#003087", color: "#fff", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                    🤝 Partenaire
                  </span>
                )}
              </div>
              <div className="flex justify-center mb-3">
                <div className="flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: b.bgColor, border: "2px solid #FFD000", fontSize: 28, color: "#fff" }}>
                  {b.emoji}
                </div>
              </div>
              <h3 className="font-bold text-white text-center mb-2" style={{ fontSize: 18 }}>{b.name}</h3>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {b.tags.map((t) => (
                  <span key={t} style={{ background: "#2a2a2a", color: "#FFD000", fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>{t}</span>
                ))}
              </div>
              <p className="text-center mb-3 line-clamp-2" style={{ color: "#aaa", fontSize: 13 }}>{b.desc}</p>
              <div className="flex items-center justify-center gap-2 mb-4 text-sm">
                <Stars rating={b.rating} />
                <span style={{ color: "#aaa" }}>{b.rating} ({b.reviews} avis)</span>
              </div>
              <button
                className="w-full font-bold transition-colors"
                style={{ background: "#FFD000", color: "#111", borderRadius: 8, padding: "10px 0", fontSize: 14 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e6bc00")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFD000")}
              >
                Voir la page du pro →
              </button>
            </div>
          ))}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePage}
          totalItems={ALL_SERVICES.length}
          itemsPerPage={PER_PAGE}
        />
      </div>
    </section>
  );
}
