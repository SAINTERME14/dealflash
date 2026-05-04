const SPONSORS = [
  "RONA", "Canadian Tire", "Dollarama", "Bureau en Gros", "Structube",
  "Brault & Martineau", "Corbeil", "Surplus RD", "Déco Découverte", "Brick",
];

export function SponsorTicker() {
  const list = [...SPONSORS, ...SPONSORS];
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        height: 72,
        background: "#111111",
        borderTop: "2px solid #FFD000",
        borderBottom: "2px solid #FFD000",
      }}
    >
      <div
        className="absolute left-0 top-0 h-full flex items-center px-4 z-10"
        style={{ background: "#111111" }}
      >
        <span className="text-[10px] font-bold tracking-widest text-[#FFD000] uppercase border border-[#FFD000]/50 rounded px-2 py-1">
          Nos partenaires
        </span>
      </div>
      <div
        className="flex items-center h-full whitespace-nowrap"
        style={{ animation: "scrollLeft 30s linear infinite", paddingLeft: 180 }}
      >
        {list.map((name, i) => (
          <div key={i} className="flex items-center" style={{ marginRight: 40 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 120,
                height: 40,
                border: "1px solid #333",
                borderRadius: 6,
                color: "#FFD000",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {name}
            </div>
            <span style={{ color: "#FFD000", marginLeft: 40, fontWeight: 700 }}>|</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
