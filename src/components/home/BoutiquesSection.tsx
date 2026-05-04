import { useRef, useState } from "react";
import { ALL_BOUTIQUES } from "@/data/boutiquesData";
import { Pagination } from "./Pagination";

const ITEMS_PER_PAGE = 6;
const TOTAL_PAGES = Math.ceil(ALL_BOUTIQUES.length / ITEMS_PER_PAGE);

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span style={{ color: "#FFD000", letterSpacing: 1 }}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

export function BoutiquesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageItems = ALL_BOUTIQUES.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 px-4"
      style={{ background: "#0d0d0d", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white">🏪 Boutiques DealFlash</h2>
          <p className="text-white/70 mt-2">Achetez directement auprès de nos marchands officiels et affiliés</p>
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
                {b.official ? (
                  <span
                    style={{
                      background: "#FFD000",
                      color: "#111",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    ✅ Officielle DealFlash
                  </span>
                ) : (
                  <span
                    style={{
                      background: "#003087",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    🤝 Affiliée
                  </span>
                )}
              </div>
              <div className="flex justify-center mb-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 64,
                    height: 64,
                    background: b.bgColor,
                    border: "2px solid #FFD000",
                    fontSize: 28,
                    color: "#fff",
                  }}
                >
                  {b.emoji}
                </div>
              </div>
              <h3 className="font-bold text-white text-center mb-2" style={{ fontSize: 18 }}>
                {b.name}
              </h3>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {b.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      background: "#2a2a2a",
                      color: "#FFD000",
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-center mb-3 line-clamp-2" style={{ color: "#aaa", fontSize: 13 }}>
                {b.desc}
              </p>
              <div className="flex items-center justify-center gap-2 mb-4 text-sm">
                <Stars rating={b.rating} />
                <span style={{ color: "#aaa" }}>
                  {b.rating} ({b.reviews} avis)
                </span>
              </div>
              <button
                className="w-full font-bold transition-colors"
                style={{
                  background: "#FFD000",
                  color: "#111",
                  borderRadius: 8,
                  padding: "10px 0",
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e6bc00")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFD000")}
              >
                Visiter la boutique →
              </button>
            </div>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={TOTAL_PAGES}
          totalItems={ALL_BOUTIQUES.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
        />
      </div>
    </section>
  );
}
