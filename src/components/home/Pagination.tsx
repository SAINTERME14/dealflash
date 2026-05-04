import { useState, KeyboardEvent } from "react";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

function buildPages(current: number, total: number): (number | "...")[] {
  const pages = new Set<number>();
  [1, 2, total - 1, total].forEach((p) => { if (p >= 1 && p <= total) pages.add(p); });
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push("...");
  }
  return out;
}

const pageBtnBase: React.CSSProperties = {
  height: 36, minWidth: 36, padding: "0 10px", fontSize: 14,
  borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: Props) {
  const [jumpVal, setJumpVal] = useState("");
  const [shake, setShake] = useState(false);

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  const goto = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    onPageChange(p);
  };

  const handleJump = () => {
    const n = parseInt(jumpVal, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n);
      setJumpVal("");
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 1000);
    }
  };

  const pages = buildPages(currentPage, totalPages);

  const inactive: React.CSSProperties = {
    ...pageBtnBase,
    background: "#1a1a1a", color: "#ccc", border: "1px solid #2a2a2a",
  };
  const active: React.CSSProperties = {
    ...pageBtnBase,
    background: "#FFD000", color: "#111", border: "1px solid #FFD000",
    fontWeight: 700, cursor: "default",
  };

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <div style={{ color: "#888", fontSize: 13 }}>
        Affichage de {from} à {to} sur {totalItems} résultats
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          style={{ ...inactive, opacity: currentPage === 1 ? 0.3 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
          disabled={currentPage === 1}
          onClick={() => goto(currentPage - 1)}
          onMouseEnter={(e) => { if (currentPage !== 1) { e.currentTarget.style.borderColor = "#FFD000"; e.currentTarget.style.color = "#FFD000"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; }}
        >◀ Précédent</button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} style={{ color: "#555", padding: "0 8px" }}>...</span>
          ) : (
            <button
              key={p}
              style={p === currentPage ? active : inactive}
              onClick={() => goto(p)}
              onMouseEnter={(e) => { if (p !== currentPage) { e.currentTarget.style.borderColor = "#FFD000"; e.currentTarget.style.color = "#FFD000"; } }}
              onMouseLeave={(e) => { if (p !== currentPage) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; } }}
            >{p}</button>
          )
        )}

        <button
          style={{ ...inactive, opacity: currentPage === totalPages ? 0.3 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
          disabled={currentPage === totalPages}
          onClick={() => goto(currentPage + 1)}
          onMouseEnter={(e) => { if (currentPage !== totalPages) { e.currentTarget.style.borderColor = "#FFD000"; e.currentTarget.style.color = "#FFD000"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; }}
        >Suivant ▶</button>
      </div>

      <div className="flex items-center gap-2">
        <span style={{ color: "#888", fontSize: 13 }}>Page</span>
        <input
          value={jumpVal}
          onChange={(e) => setJumpVal(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleJump(); }}
          style={{
            width: 60, height: 36, background: "#1a1a1a",
            border: `1px solid ${shake ? "#e74c3c" : "#333"}`,
            color: "#fff", textAlign: "center", borderRadius: 6,
            animation: shake ? "shakeX 0.4s" : "none",
          }}
        />
        <button
          onClick={handleJump}
          style={{ height: 36, padding: "0 12px", background: "#FFD000", color: "#111", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
        >Go →</button>
      </div>
      <style>{`
        @keyframes shakeX {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
      `}</style>
    </div>
  );
}
