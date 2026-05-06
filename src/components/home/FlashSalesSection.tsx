import { useEffect, useRef, useState, useCallback } from "react";
import { ALL_FLASH_ITEMS } from "@/data/flashItems";
import { Pagination } from "./Pagination";

const ITEMS_PER_PAGE = 8;
const TOTAL_PAGES = Math.ceil(ALL_FLASH_ITEMS.length / ITEMS_PER_PAGE);

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function FlashSalesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const getPageItems = useCallback(
    (page: number) => ALL_FLASH_ITEMS.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    []
  );

  const [timers, setTimers] = useState(() => getPageItems(1).map((i) => i.timerSeconds));

  useEffect(() => {
    setTimers(getPageItems(currentPage).map((i) => i.timerSeconds));
  }, [currentPage, getPageItems]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimers((prev) => prev.map((t) => (t > 0 ? t - 1 : 0)));
    }, 1000);
    return () => clearInterval(id);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const pageItems = getPageItems(currentPage);

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
            const t = timers[i] ?? 0;
            const expired = t <= 0;
            return (
              <div
                key={item.id}
                className="rounded-xl overflow-hidden transition-all flex flex-col"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  opacity: expired ? 0.5 : 1,
                  filter: expired ? "grayscale(1)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!expired) e.currentTarget.style.borderColor = "#FFD000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2a2a2a";
                }}
              >
                <div className="relative" style={{ width: "100%", height: 180 }}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    className="absolute"
                    style={{
                      top: 8,
                      right: 8,
                      background: "#e74c3c",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                    }}
                  >
                    -{item.discount}%
                  </span>
                  {expired && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.7)" }}
                    >
                      <span style={{ color: "#FFD000", fontWeight: 800, fontSize: 24, letterSpacing: 2 }}>
                        EXPIRÉ
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col" style={{ padding: 14 }}>
                  <h3
                    className="text-white font-bold line-clamp-2 mb-2"
                    style={{ fontSize: 14, minHeight: 38 }}
                  >
                    {item.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span style={{ fontSize: 13, color: "#888", textDecoration: "line-through" }}>
                      {item.regularPrice.toLocaleString("fr-CA")} $
                    </span>
                  </div>
                  <div
                    style={{
                      color: "#FFD000",
                      fontSize: 26,
                      fontWeight: 900,
                      lineHeight: 1,
                      animation: expired ? "none" : "flashPrice 1.2s ease-in-out infinite",
                    }}
                  >
                    {item.flashPrice.toLocaleString("fr-CA")} $
                  </div>

                  <div className="mt-3" style={{ fontSize: 11, color: "#888" }}>⏱ Expire dans :</div>
                  <div
                    className="inline-block mt-1 self-start"
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, monospace",
                      fontSize: 16,
                      color: "#FFD000",
                      background: "#0d0d0d",
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #2a2a2a",
                    }}
                  >
                    {fmt(t)}
                  </div>

                  <div className="mt-2" style={{ fontSize: 12, color: "#e67e22" }}>
                    🔥 {item.stock} restant{item.stock > 1 ? "s" : ""}
                  </div>

                  <button
                    disabled={expired}
                    className="w-full font-bold transition-transform"
                    style={{
                      marginTop: 10,
                      background: expired ? "#444" : "#FFD000",
                      color: expired ? "#888" : "#111",
                      borderRadius: 8,
                      padding: "10px 0",
                      fontSize: 14,
                      cursor: expired ? "not-allowed" : "pointer",
                      border: "none",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      if (!expired) {
                        e.currentTarget.style.background = "#e6bc00";
                        e.currentTarget.style.transform = "scale(1.02)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!expired) {
                        e.currentTarget.style.background = "#FFD000";
                        e.currentTarget.style.transform = "scale(1)";
                      }
                    }}
                  >
                    🛒 Acheter maintenant
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={TOTAL_PAGES}
          totalItems={ALL_FLASH_ITEMS.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
        />
      </div>

      <style>{`
        @keyframes flashPrice {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </section>
  );
}
