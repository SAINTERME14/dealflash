import { Store, Star } from "lucide-react";

const BOUTIQUES = [
  { name: "TechDeal Store", official: true, desc: "Électronique reconditionnée à prix imbattables.", tags: ["Électronique"], rating: 4.9, reviews: 312 },
  { name: "MeubleFlash", official: true, desc: "Meubles et décoration pour tous les styles.", tags: ["Meubles", "Déco"], rating: 4.7, reviews: 248 },
  { name: "ModaPlus", official: false, desc: "Vêtements et accessoires tendance.", tags: ["Mode"], rating: 4.6, reviews: 189 },
  { name: "CuisineXpress", official: false, desc: "Électroménagers livrés rapidement.", tags: ["Électroménagers"], rating: 4.8, reviews: 421 },
  { name: "SportDeal", official: true, desc: "Articles de sport pour tous niveaux.", tags: ["Sport"], rating: 4.5, reviews: 156 },
  { name: "BébéFlash", official: false, desc: "Puériculture et jouets pour enfants.", tags: ["Puériculture", "Jouets"], rating: 4.9, reviews: 367 },
];

export function BoutiquesSection() {
  return (
    <section className="py-16 px-4" style={{ background: "#111111" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            ⚡ Boutiques DealFlash
          </h2>
          <p className="text-white/70 mt-2">
            Achetez directement auprès de nos boutiques officielles et affiliées
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BOUTIQUES.map((b) => (
            <div
              key={b.name}
              className="rounded-xl p-5 transition-all hover:-translate-y-1"
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 12px 32px rgba(255,208,0,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)")}
            >
              <div className="mb-3">
                {b.official ? (
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#FFD000", color: "#111" }}>
                    🏆 Officielle DealFlash
                  </span>
                ) : (
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#3b82f6", color: "#fff" }}>
                    🤝 Affiliée
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{ width: 80, height: 80, background: "#2a2a2a" }}
                >
                  <Store className="h-8 w-8 text-white/40" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{b.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-white/80">
                    <Star className="h-4 w-4 fill-[#FFD000] text-[#FFD000]" />
                    <span className="font-semibold">{b.rating}</span>
                    <span className="text-white/50">— {b.reviews} avis</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/70 mb-3 line-clamp-2">{b.desc}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {b.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded" style={{ background: "#2a2a2a", color: "#FFD000" }}>
                    {t}
                  </span>
                ))}
              </div>
              <button
                className="w-full rounded-lg py-2.5 font-bold text-sm transition-colors"
                style={{ background: "#FFD000", color: "#111" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e6bc00")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFD000")}
              >
                Visiter la boutique →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
