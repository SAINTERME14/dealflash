import { useEffect, useState } from "react";
import { getPartners, type Partner } from "@/data/partnersData";

export function SponsorTicker() {
  const [partners, setPartners] = useState<Partner[]>(() =>
    getPartners()
      .filter((p) => p.visible)
      .sort((a, b) => a.order - b.order)
  );

  useEffect(() => {
    const refresh = () => {
      setPartners(
        getPartners()
          .filter((p) => p.visible)
          .sort((a, b) => a.order - b.order)
      );
    };
    window.addEventListener("df_partners_updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("df_partners_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const list = [...partners, ...partners];

  return (
    <section
      className="relative w-full overflow-hidden flex items-center"
      style={{
        height: 80,
        background: "#111111",
        borderTop: "2px solid #FFD000",
        borderBottom: "2px solid #FFD000",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        className="flex items-center justify-center h-full shrink-0"
        style={{
          minWidth: 160,
          padding: "0 16px",
          borderRight: "1px solid #333",
          background: "#111111",
          color: "#FFD000",
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 700,
          zIndex: 2,
        }}
      >
        NOS PARTENAIRES ▶
      </div>
      <div className="flex-1 overflow-hidden">
        <div
          className="flex items-center whitespace-nowrap"
          style={{ animation: "scrollTicker 35s linear infinite" }}
        >
          {list.map((s, i) => (
            <div
              key={`${s.id}-${i}`}
              style={{
                background: "#1a1a1a",
                border: `1px solid ${s.color}`,
                borderRadius: 8,
                padding: "8px 20px",
                margin: "0 20px",
                color: s.color,
                fontWeight: 700,
                fontSize: 15,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: s.color }}>●</span>
              {s.name}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes scrollTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
