import { useState, useRef, useCallback, CSSProperties } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 0) return [];
  if (total === 1) return [1];

  const pageSet = new Set<number>();
  pageSet.add(1);
  if (total >= 2) pageSet.add(2);
  if (total >= 3) pageSet.add(total - 1);
  pageSet.add(total);
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pageSet.add(i);
  }

  const sorted = Array.from(pageSet).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
}

const BASE_BTN: CSSProperties = {
  height: 36,
  minWidth: 36,
  fontSize: 14,
  cursor: "pointer",
  transition: "border-color 0.2s, color 0.2s",
  border: "1px solid #2a2a2a",
  borderRadius: 6,
  background: "#1a1a1a",
  color: "#ccc",
  padding: "0 8px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
};

const ACTIVE_BTN: CSSProperties = {
  ...BASE_BTN,
  background: "#FFD000",
  color: "#111",
  fontWeight: 700,
  borderColor: "#FFD000",
  cursor: "default",
};

const DISABLED_BTN: CSSProperties = {
  ...BASE_BTN,
  opacity: 0.3,
  cursor: "not-allowed",
};

function PageButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const style = active ? ACTIVE_BTN : disabled ? DISABLED_BTN : BASE_BTN;
  return (
    <button
      onClick={onClick}
      disabled={disabled || active}
      style={style}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.borderColor = "#FFD000";
          e.currentTarget.style.color = "#FFD000";
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.borderColor = "#2a2a2a";
          e.currentTarget.style.color = "#ccc";
        }
      }}
    >
      {children}
    </button>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const [jumpValue, setJumpValue] = useState("");
  const [jumpError, setJumpError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handleJump = useCallback(() => {
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n);
      setJumpValue("");
      setJumpError(false);
    } else {
      setJumpError(true);
      setTimeout(() => setJumpError(false), 1000);
    }
  }, [jumpValue, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);

  return (
    <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ color: "#888", fontSize: 13 }}>
        Affichage de {startItem} à {endItem} sur {totalItems} résultats
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          <PageButton disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            ◀ Précédent
          </PageButton>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`e${idx}`} style={{ color: "#555", padding: "0 8px", fontSize: 14 }}>
                ...
              </span>
            ) : (
              <PageButton
                key={p}
                active={p === currentPage}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </PageButton>
            )
          )}

          <PageButton disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
            Suivant ▶
          </PageButton>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#888", fontSize: 14 }}>Page</span>
          <input
            ref={inputRef}
            type="number"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJump()}
            min={1}
            max={totalPages}
            placeholder="—"
            style={{
              width: 60,
              height: 36,
              background: "#1a1a1a",
              border: `1px solid ${jumpError ? "#e74c3c" : "#333"}`,
              color: "white",
              textAlign: "center",
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
              animation: jumpError ? "dfShake 0.5s ease" : "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={handleJump}
            style={{
              background: "#FFD000",
              color: "#111",
              borderRadius: 6,
              height: 36,
              padding: "0 12px",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Go →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dfShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
