import { useEffect, useMemo, useRef, useState } from "react";
import { Pagination } from "./Pagination";

interface FlashItem {
  id: number;
  name: string;
  image: string;
  regular: number;
  flash: number;
  discount: number;
  seconds: number;
  stock: number;
}

const BASE: Omit<FlashItem, "id">[] = [
  { name: "Samsung 55\" QLED 4K UHD", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f4bce4?w=400&q=80", regular: 1299, flash: 699, discount: 46, seconds: 4*3600+32*60+17, stock: 2 },
  { name: "Instant Pot Duo 7-en-1 8L", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80", regular: 249, flash: 89, discount: 64, seconds: 11*3600+5*60+42, stock: 7 },
  { name: "Vélo électrique pliant 250W", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80", regular: 1899, flash: 949, discount: 50, seconds: 47*60+33, stock: 1 },
  { name: "AirPods Pro 2e génération", image: "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=400&q=80", regular: 329, flash: 199, discount: 39, seconds: 23*3600+15*60+8, stock: 12 },
  { name: "Canapé 3 places en velours", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80", regular: 1499, flash: 749, discount: 50, seconds: 7*3600+20*60+55, stock: 3 },
  { name: "Machine à expresso 19 bars", image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80", regular: 599, flash: 279, discount: 53, seconds: 2*3600+10*60+22, stock: 5 },
  { name: "Trottinette électrique 500W", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", regular: 899, flash: 449, discount: 50, seconds: 16*3600+44*60+10, stock: 4 },
  { name: "Apple iPad 10e génération", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80", regular: 679, flash: 429, discount: 37, seconds: 9*3600+58*60+1, stock: 9 },
];

const VARIANTS = ["Édition 2025", "Pro", "Max", "Lite", "Plus", "Mini", "Ultra", "Eco", "Premium", "XL", "Compact", "V2"];

function rand(seed: number) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }

const ALL_ITEMS: FlashItem[] = Array.from({ length: 200 }, (_, i) => {
  const b = BASE[i % BASE.length];
  if (i < BASE.length) return { ...b, id: i + 1 };
  const v = VARIANTS[Math.floor(rand(i) * VARIANTS.length)];
  const priceMul = 0.7 + rand(i + 1) * 0.8;
  const flash = Math.round(b.flash * priceMul);
  const regular = Math.round(b.regular * priceMul);
  return {
    id: i + 1,
    name: `${b.name.split(" ").slice(0, 3).join(" ")} ${v}`,
    image: BASE[i % BASE.length].image,
    regular,
    flash,
    discount: Math.round(((regular - flash) / regular) * 100),
    seconds: 1800 + Math.floor(rand(i + 2) * (86399 - 1800)),
    stock: 1 + Math.floor(rand(i + 3) * 15),
  };
});

const PER_PAGE = 8;

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

export function FlashSalesSection() {
  const [page, setPage] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const totalPages = Math.ceil(ALL_ITEMS.length / PER_PAGE);

  const pageItems = useMemo(
    () => ALL_ITEMS.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [page]
  );

  const [times, setTimes] = useState<number[]>(pageItems.map((i) => i.seconds));

  useEffect(() => {
    setTimes(pageItems.map((i) => i.seconds));
  }, [pageItems]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimes((prev) => prev.map((t) => (t > 0 ? t - 1 : 0)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handlePage = (p: number) => {
    setPage(p);
    setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 px-4"
      style={{ background: "#0a0a0a", borderTop: "3px solid #FFD000", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">⚡ VENTES FLASH</h2>
          <p className="text-white/70 mt-2">Offres à durée limitée — prix en chute libre !</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pageItems.map((item, i) => {
            const t = times[i] ?? item.seconds;
            const expired = t <= 0;
            return (
              <div
                key={item.id}
                className="rounded-xl overflow-hidden transition-all flex flex-col"
                style={{
                  background: "#1a1a1a", border: "1px solid #2a2a2a",
                  opacity: expired ? 0.5 : 1, filter: expired ? "grayscale(1)" : "none",
                }}
                onMouseEnter={(e) => { if (!expired) e.currentTarget.style.borderColor = "#FFD000"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; }}
              >
                <div className="relative" style={{ width: "100%", height: 180 }}>
                  <img src={item.image} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span className="absolute" style={{ top: 8, right: 8, background: "#e74c3c", color: "#fff", fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>
                    -{item.discount}%
                  </span>
                  {expired && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
                      <span style={{ color: "#FFD000", fontWeight: 800, fontSize: 24, letterSpacing: 2 }}>EXPIRÉ</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col" style={{ padding: 14 }}>
                  <h3 className="text-white font-bold line-clamp-2 mb-2" style={{ fontSize: 14, minHeight: 38 }}>{item.name}</h3>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span style={{ fontSize: 13, color: "#888", textDecoration: "line-through" }}>{item.regular.toLocaleString("fr-CA")} $</span>
                  </div>
                  <div style={{ color: "#FFD000", fontSize: 26, fontWeight: 900, lineHeight: 1, animation: expired ? "none" : "flashPrice 1.2s ease-in-out infinite" }}>
                    {item.flash.toLocaleString("fr-CA")} $
                  </div>
                  <div className="mt-3" style={{ fontSize: 11, color: "#888" }}>⏱ Expire dans :</div>
                  <div className="inline-block mt-1 self-start" style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 16, color: "#FFD000", background: "#0d0d0d", padding: "4px 10px", borderRadius: 6, border: "1px solid #2a2a2a" }}>
                    {fmt(t)}
                  </div>
                  <div className="mt-2" style={{ fontSize: 12, color: "#e67e22" }}>🔥 {item.stock} restant{item.stock > 1 ? "s" : ""}</div>
                  <button
                    disabled={expired}
                    className="w-full font-bold transition-transform"
                    style={{ marginTop: 10, background: expired ? "#444" : "#FFD000", color: expired ? "#888" : "#111", borderRadius: 8, padding: "10px 0", fontSize: 14, cursor: expired ? "not-allowed" : "pointer" }}
                    onMouseEnter={(e) => { if (!expired) { e.currentTarget.style.background = "#e6bc00"; e.currentTarget.style.transform = "scale(1.02)"; } }}
                    onMouseLeave={(e) => { if (!expired) { e.currentTarget.style.background = "#FFD000"; e.currentTarget.style.transform = "scale(1)"; } }}
                  >
                    🛒 Acheter maintenant
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePage}
          totalItems={ALL_ITEMS.length}
          itemsPerPage={PER_PAGE}
        />
      </div>

      <style>{`
        @keyframes flashPrice { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </section>
  );
}
