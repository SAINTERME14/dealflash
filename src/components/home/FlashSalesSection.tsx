import { useEffect, useState } from "react";
import { Camera } from "lucide-react";

interface FlashItem {
  name: string;
  desc: string;
  regular: number;
  flash: number;
  discount: number;
  seconds: number;
  stock: number;
}

const ITEMS: FlashItem[] = [
  { name: "TV Samsung 55\" 4K", desc: "Smart TV UHD HDR", regular: 1299, flash: 699, discount: 46, seconds: 4*3600+32*60+17, stock: 2 },
  { name: "Robot cuiseur Instant Pot", desc: "Multifonction 7-en-1", regular: 249, flash: 89, discount: 64, seconds: 11*3600+5*60+42, stock: 7 },
  { name: "Vélo électrique pliable", desc: "Autonomie 60 km", regular: 1899, flash: 949, discount: 50, seconds: 47*60+33, stock: 1 },
  { name: "AirPods Pro 2e gén.", desc: "Réduction de bruit active", regular: 329, flash: 199, discount: 39, seconds: 23*3600+15*60+8, stock: 12 },
  { name: "Canapé 3 places", desc: "Tissu gris confort", regular: 1499, flash: 749, discount: 50, seconds: 7*3600+20*60+55, stock: 3 },
  { name: "Machine à expresso", desc: "Broyeur intégré", regular: 599, flash: 279, discount: 53, seconds: 2*3600+10*60+22, stock: 5 },
  { name: "Trottinette électrique", desc: "Vitesse max 25 km/h", regular: 899, flash: 449, discount: 50, seconds: 16*3600+44*60+10, stock: 4 },
  { name: "iPad 10e génération", desc: "WiFi 64 Go bleu", regular: 679, flash: 429, discount: 37, seconds: 9*3600+58*60+1, stock: 9 },
];

function format(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

export function FlashSalesSection() {
  const [times, setTimes] = useState<number[]>(ITEMS.map(i => i.seconds));

  useEffect(() => {
    const id = setInterval(() => {
      setTimes(prev => prev.map(t => (t > 0 ? t - 1 : 0)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="py-16 px-4"
      style={{ background: "#0d0d0d", borderTop: "3px solid #FFD000" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            ⚡ VENTES FLASH
          </h2>
          <p className="text-white/70 mt-2">Offres limitées — Prix en chute libre !</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ITEMS.map((item, i) => {
            const t = times[i];
            const expired = t <= 0;
            return (
              <div
                key={item.name}
                className="relative rounded-xl overflow-hidden flex flex-col"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  opacity: expired ? 0.5 : 1,
                }}
              >
                {/* Image */}
                <div className="relative" style={{ aspectRatio: "4/3", background: "#222" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-10 w-10 text-white/30" />
                  </div>
                  <span
                    className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold"
                    style={{ background: "#dc2626", color: "#fff" }}
                  >
                    -{item.discount}%
                  </span>
                  {expired && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <span className="text-2xl font-extrabold text-[#FFD000]">EXPIRÉ</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{item.name}</h3>
                  <p className="text-xs text-white/60 truncate mb-3">{item.desc}</p>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span style={{ textDecoration: "line-through", color: "#888", fontSize: 14 }}>
                      {item.regular} $
                    </span>
                  </div>
                  <div
                    style={{
                      color: "#FFD000",
                      fontSize: 28,
                      fontWeight: 800,
                      lineHeight: 1,
                      animation: expired ? "none" : "flashBlink 1.2s ease-in-out infinite",
                    }}
                  >
                    {item.flash} $
                  </div>

                  <div
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full self-start"
                    style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                  >
                    <span className="text-[10px] text-white/60">Expire dans :</span>
                    <span style={{ fontFamily: "ui-monospace, monospace", color: "#FFD000", fontWeight: 700, fontSize: 13 }}>
                      {format(t)}
                    </span>
                  </div>

                  <div className="mt-2 text-xs" style={{ color: "#fb923c" }}>
                    🔥 {item.stock} restant{item.stock > 1 ? "s" : ""}
                  </div>

                  <button
                    disabled={expired}
                    className="mt-4 w-full rounded-lg py-2.5 font-bold text-sm transition-transform"
                    style={{
                      background: expired ? "#444" : "#FFD000",
                      color: expired ? "#888" : "#111",
                      cursor: expired ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => { if (!expired) e.currentTarget.style.transform = "scale(1.02)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    {expired ? "Indisponible" : "Acheter maintenant"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes flashBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
