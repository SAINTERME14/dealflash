import { useEffect, useMemo, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminFlashItems, saveAdminFlashItems, type AdminFlashItem, type FlashStatus } from "@/data/flashItems";

const ROWS_PER_PAGE = 20;

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function parseHMS(str: string): number {
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

const STATUS_ORDER: FlashStatus[] = ["active", "expired", "pending"];
const STATUS_LABELS: Record<FlashStatus, string> = {
  active: "Actif",
  expired: "Expiré",
  pending: "En attente",
};
const STATUS_COLORS: Record<FlashStatus, string> = {
  active: "#22c55e",
  expired: "#ef4444",
  pending: "#6b7280",
};

function StatusPill({ status, onClick }: { status: FlashStatus; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        background: STATUS_COLORS[status] + "22",
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}`,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

interface FlashModalProps {
  item: Partial<AdminFlashItem> | null;
  onSave: (item: Omit<AdminFlashItem, "id">) => void;
  onClose: () => void;
}

function FlashModal({ item, onSave, onClose }: FlashModalProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [regular, setRegular] = useState(String(item?.regularPrice ?? ""));
  const [flash, setFlash] = useState(String(item?.flashPrice ?? ""));
  const [duration, setDuration] = useState(item?.timerSeconds ? fmt(item.timerSeconds) : "01:00:00");
  const [stock, setStock] = useState(String(item?.stock ?? "1"));
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [status, setStatus] = useState<FlashStatus>(item?.status ?? "active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reg = parseFloat(regular);
    const fl = parseFloat(flash);
    const discount = reg > 0 ? Math.round(((reg - fl) / reg) * 100) : 0;
    onSave({
      name,
      regularPrice: reg,
      flashPrice: fl,
      discount,
      timerSeconds: parseHMS(duration),
      stock: parseInt(stock, 10) || 1,
      imageUrl,
      status,
    });
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#1a1a1a", border: "1px solid #FFD000", borderRadius: 12, padding: 28, width: "min(520px, 95vw)", maxHeight: "90vh", overflowY: "auto", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {item?.id ? "Modifier la vente flash" : "Ajouter une vente flash"}
          </h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            Nom du produit
            <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Prix régulier ($)
              <input type="number" min="0" step="0.01" value={regular} onChange={(e) => setRegular(e.target.value)} required style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Prix flash ($)
              <input type="number" min="0" step="0.01" value={flash} onChange={(e) => setFlash(e.target.value)} required style={inputStyle} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Durée (HH:MM:SS)
              <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="01:00:00" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Stock
              <input type="number" min="1" value={stock} onChange={(e) => setStock(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <label style={labelStyle}>
            URL image
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Statut
            <select value={status} onChange={(e) => setStatus(e.target.value as FlashStatus)} style={inputStyle}>
              <option value="active">Actif</option>
              <option value="expired">Expiré</option>
              <option value="pending">En attente</option>
            </select>
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>Annuler</button>
            <button type="submit" style={primaryBtnStyle}>Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFlashSales() {
  const [items, setItems] = useState<AdminFlashItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{ open: boolean; item: AdminFlashItem | null }>({ open: false, item: null });
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Admin · Ventes Flash | Boardeal";
    setItems(getAdminFlashItems());
  }, []);

  const persist = (updated: AdminFlashItem[]) => {
    setItems(updated);
    saveAdminFlashItems(updated);
  };

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const summary = useMemo(() => {
    const active = items.filter((i) => i.status === "active").length;
    const expired = items.filter((i) => i.status === "expired").length;
    const pending = items.filter((i) => i.status === "pending").length;
    return { total: items.length, active, expired, pending };
  }, [items]);

  const toggleStatus = (id: number) => {
    persist(
      items.map((item) => {
        if (item.id !== id) return item;
        const idx = STATUS_ORDER.indexOf(item.status);
        return { ...item, status: STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] };
      })
    );
  };

  const deleteItem = (id: number) => {
    if (!confirm("Supprimer cette vente flash ?")) return;
    persist(items.filter((i) => i.id !== id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  const pauseItem = (id: number) => {
    persist(items.map((i) => (i.id === id ? { ...i, status: "pending" } : i)));
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = pageItems.map((i) => i.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const s = new Set(prev);
      pageIds.forEach((id) => (allSelected ? s.delete(id) : s.add(id)));
      return s;
    });
  };

  const bulkSetStatus = (status: FlashStatus) => {
    persist(items.map((i) => (selected.has(i.id) ? { ...i, status } : i)));
    setSelected(new Set());
  };

  const bulkDelete = () => {
    if (!confirm(`Supprimer ${selected.size} vente(s) flash ?`)) return;
    persist(items.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
  };

  const openAdd = () => setModal({ open: true, item: null });
  const openEdit = (item: AdminFlashItem) => setModal({ open: true, item });

  const handleSave = (data: Omit<AdminFlashItem, "id">) => {
    if (modal.item) {
      persist(items.map((i) => (i.id === modal.item!.id ? { ...i, ...data } : i)));
    } else {
      const newId = Math.max(0, ...items.map((i) => i.id)) + 1;
      persist([...items, { id: newId, ...data }]);
    }
    setModal({ open: false, item: null });
  };

  return (
    <AdminLayout>
      <div ref={sectionRef} style={{ fontFamily: "Inter, system-ui, sans-serif", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>⚡ Gestion des Ventes Flash</h1>
            <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
              Total : {summary.total} ventes | Actives : {summary.active} | Expirées : {summary.expired} | En attente : {summary.pending}
            </p>
          </div>
          <button onClick={openAdd} style={primaryBtnStyle}>+ Ajouter une vente flash</button>
        </div>

        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="🔍 Rechercher par nom de produit..."
          style={{ ...inputStyle, width: "100%", marginBottom: 16, maxWidth: 400 }}
        />

        {selected.size > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: "10px 14px", background: "#1a1a1a", border: "1px solid #FFD000", borderRadius: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "#888", fontSize: 13 }}>{selected.size} sélectionné(s)</span>
            <button onClick={() => bulkSetStatus("active")} style={smallBtnStyle}>✅ Activer tout</button>
            <button onClick={() => bulkSetStatus("pending")} style={smallBtnStyle}>⏸ Désactiver tout</button>
            <button onClick={bulkDelete} style={{ ...smallBtnStyle, background: "#7f1d1d", borderColor: "#ef4444", color: "#fca5a5" }}>🗑️ Supprimer la sélection</button>
          </div>
        )}

        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #2a2a2a" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                <th style={thStyle}>
                  <input
                    type="checkbox"
                    checked={pageItems.length > 0 && pageItems.every((i) => selected.has(i.id))}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Image</th>
                <th style={thStyle}>Nom du produit</th>
                <th style={thStyle}>Prix rég.</th>
                <th style={thStyle}>Prix flash</th>
                <th style={thStyle}>Rabais %</th>
                <th style={thStyle}>Timer</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #1e1e1e", background: selected.has(item.id) ? "#1e1a00" : "#0f0f0f" }}>
                  <td style={tdStyle}>
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  <td style={{ ...tdStyle, color: "#555" }}>{item.id}</td>
                  <td style={tdStyle}>
                    <img src={item.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #2a2a2a" }} />
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 200 }}>
                    <span style={{ color: "white", fontWeight: 500 }}>{item.name}</span>
                  </td>
                  <td style={{ ...tdStyle, color: "#888", textDecoration: "line-through" }}>{item.regularPrice.toLocaleString("fr-CA")} $</td>
                  <td style={{ ...tdStyle, color: "#FFD000", fontWeight: 700 }}>{item.flashPrice.toLocaleString("fr-CA")} $</td>
                  <td style={{ ...tdStyle, color: "#e74c3c", fontWeight: 700 }}>-{item.discount}%</td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", color: "#aaa" }}>{fmt(item.timerSeconds)}</td>
                  <td style={{ ...tdStyle, color: item.stock <= 2 ? "#e67e22" : "#aaa" }}>{item.stock}</td>
                  <td style={tdStyle}>
                    <StatusPill status={item.status} onClick={() => toggleStatus(item.id)} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button onClick={() => openEdit(item)} style={actionBtnStyle} title="Modifier">✏️</button>
                      <button onClick={() => deleteItem(item.id)} style={{ ...actionBtnStyle, color: "#ef4444" }} title="Supprimer">🗑️</button>
                      <button onClick={() => pauseItem(item.id)} style={{ ...actionBtnStyle, color: "#f59e0b" }} title="Mettre en pause">⏸</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", color: "#555", padding: 32 }}>Aucune vente flash trouvée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={(p) => {
            setCurrentPage(p);
            sectionRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {modal.open && (
          <FlashModal
            item={modal.item}
            onSave={handleSave}
            onClose={() => setModal({ open: false, item: null })}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function AdminPagination({ currentPage, totalPages, totalItems, onPageChange }: {
  currentPage: number; totalPages: number; totalItems: number; onPageChange: (p: number) => void;
}) {
  const [jump, setJump] = useState("");
  const [err, setErr] = useState(false);
  if (totalPages <= 1) return null;

  const doJump = () => {
    const n = parseInt(jump, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) { onPageChange(n); setJump(""); setErr(false); }
    else { setErr(true); setTimeout(() => setErr(false), 1000); }
  };

  const pages = buildPageList(currentPage, totalPages);
  const start = (currentPage - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(currentPage * ROWS_PER_PAGE, totalItems);

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ color: "#888", fontSize: 13 }}>Affichage de {start} à {end} sur {totalItems}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          <PBtn disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>◀ Précédent</PBtn>
          {pages.map((p, i) =>
            p === "..." ? <span key={`e${i}`} style={{ color: "#555", padding: "0 8px", alignSelf: "center" }}>...</span>
              : <PBtn key={p} active={p === currentPage} onClick={() => onPageChange(p as number)}>{p}</PBtn>
          )}
          <PBtn disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Suivant ▶</PBtn>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#888", fontSize: 13 }}>Page</span>
          <input type="number" value={jump} onChange={(e) => setJump(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doJump()}
            style={{ width: 60, height: 34, background: "#1a1a1a", border: `1px solid ${err ? "#ef4444" : "#333"}`, color: "white", textAlign: "center", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "inherit", animation: err ? "dfShake 0.5s ease" : "none" }} />
          <button onClick={doJump} style={{ background: "#FFD000", color: "#111", border: "none", borderRadius: 6, height: 34, padding: "0 12px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Go →</button>
        </div>
      </div>
      <style>{`
        @keyframes dfShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        input[type=number]::-webkit-inner-spin-button{display:none}
        input[type=number]{-moz-appearance:textfield}
      `}</style>
    </div>
  );
}

function PBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  const s: React.CSSProperties = active
    ? { height: 34, minWidth: 34, fontSize: 13, background: "#FFD000", color: "#111", fontWeight: 700, borderRadius: 6, border: "1px solid #FFD000", cursor: "default", padding: "0 8px", fontFamily: "inherit" }
    : disabled
    ? { height: 34, minWidth: 34, fontSize: 13, background: "#1a1a1a", color: "#555", borderRadius: 6, border: "1px solid #2a2a2a", cursor: "not-allowed", opacity: 0.4, padding: "0 8px", fontFamily: "inherit" }
    : { height: 34, minWidth: 34, fontSize: 13, background: "#1a1a1a", color: "#ccc", borderRadius: 6, border: "1px solid #2a2a2a", cursor: "pointer", padding: "0 8px", fontFamily: "inherit" };
  return <button onClick={onClick} disabled={disabled || active} style={s}
    onMouseEnter={(e) => { if (!active && !disabled) { e.currentTarget.style.borderColor = "#FFD000"; e.currentTarget.style.color = "#FFD000"; } }}
    onMouseLeave={(e) => { if (!active && !disabled) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; } }}
  >{children}</button>;
}

function buildPageList(current: number, total: number): (number | "...")[] {
  const s = new Set<number>();
  s.add(1); if (total >= 2) s.add(2); if (total >= 3) s.add(total - 1); s.add(total);
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) s.add(i);
  const sorted = Array.from(s).sort((a, b) => a - b);
  const r: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) r.push("...");
    r.push(sorted[i]);
  }
  return r;
}

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", background: "#111", border: "1px solid #333", color: "white",
  borderRadius: 6, padding: "8px 12px", fontSize: 13, marginTop: 4, fontFamily: "inherit", outline: "none",
};
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", fontSize: 13, color: "#aaa", gap: 0 };
const primaryBtnStyle: React.CSSProperties = {
  background: "#FFD000", color: "#111", border: "none", borderRadius: 8, height: 38,
  padding: "0 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
};
const secondaryBtnStyle: React.CSSProperties = {
  background: "#2a2a2a", color: "#ccc", border: "1px solid #333", borderRadius: 8, height: 38,
  padding: "0 16px", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
};
const smallBtnStyle: React.CSSProperties = {
  background: "#1a3a1a", color: "#86efac", border: "1px solid #166534", borderRadius: 6,
  padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
};
const closeBtnStyle: React.CSSProperties = {
  background: "none", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer", lineHeight: 1,
};
const thStyle: React.CSSProperties = {
  padding: "10px 12px", textAlign: "left", color: "#666", fontWeight: 600, fontSize: 12,
  textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle", color: "#ccc", whiteSpace: "nowrap" };
const actionBtnStyle: React.CSSProperties = {
  background: "none", border: "1px solid #2a2a2a", borderRadius: 6, padding: "4px 8px",
  cursor: "pointer", fontSize: 14, color: "#aaa", fontFamily: "inherit",
};
