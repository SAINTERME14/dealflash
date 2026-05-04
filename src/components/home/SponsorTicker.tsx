const SPONSORS: { name: string; color: string; textColor?: string }[] = [
  { name: "RONA", color: "#E31837" },
  { name: "Canadian Tire", color: "#cc0000" },
  { name: "Dollarama", color: "#FFD100" },
  { name: "Bureau en Gros", color: "#cc0000" },
  { name: "Brault & Martineau", color: "#003087" },
  { name: "Structube", color: "#FFD000", textColor: "#FFD000" },
  { name: "Corbeil", color: "#005baa" },
  { name: "Surplus RD", color: "#e8890c" },
  { name: "Déco Découverte", color: "#6ab04c" },
  { name: "The Brick", color: "#003087" },
  { name: "Sports Experts", color: "#d62b2b" },
  { name: "Simons", color: "#FFD000", textColor: "#FFD000" },
];

export function SponsorTicker() {
  const list = [...SPONSORS, ...SPONSORS];
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
          {list.map((s, i) => {
            const txt = s.textColor ?? s.color;
            return (
              <div
                key={i}
                style={{
                  background: "#1a1a1a",
                  border: `1px solid ${s.color}`,
                  borderRadius: 8,
                  padding: "8px 20px",
                  margin: "0 20px",
                  color: txt,
                  fontWeight: 700,
                  fontSize: 15,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: txt }}>●</span>
                {s.name}
              </div>
            );
          })}
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
