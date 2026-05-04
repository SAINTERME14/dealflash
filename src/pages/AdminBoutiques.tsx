import { useEffect, useMemo, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAdminBoutiques, saveAdminBoutiques, type AdminBoutique, type BoutiqueStatus } from "@/data/boutiquesData";

const ROWS_PER_PAGE = 20;

const STATUS_ORDER: BoutiqueStatus[] = ["active", "suspended", "pending"];
const STATUS_LABELS: Record<BoutiqueStatus, string> = {
  active: "Active",
  suspended: "Suspendue",
  pending: "En vérification",
};
const STATUS_COLORS: Record<BoutiqueStatus, string> = {
  active: "#22c55e",
  suspended: "#ef4444",
  pending: "#f59e0b",
};

const ALL_CATEGORIES = [
  "Immobilier", "Véhicules", "Électronique", "Informatique", "Mode", "Vêtements",
  "Meubles", "Maison", "Cuisine", "Électroménager", "Sport", "Plein air",
  "Bébé", "Enfants", "Livres", "Animaux", "Jardinage", "Divers",
];

function StatusPill({ status, onClick }: { status: BoutiqueStatus; onClick?: () => void }) {
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

function BadgePill({ official, onClick }: { official: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        background: official ? "#FFD00022" : "#003087",
        color: official ? "#FFD000" : "#93c5fd",
        border: `1px solid ${official ? "#FFD000" : "#1e40af"}`,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {official ? "✅ Officielle DealFlash" : "🤝 Affiliée"}
    </span>
  );
}

interface BoutiqueModalProps {
  item: Partial<AdminBoutique> | null;
  onSave: (data: Omit<AdminBoutique, "id">) => void;
  onClose: () => void;
}

function BoutiqueModal({ item, onSave, onClose }: BoutiqueModalProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [desc, setDesc] = useState(item?.desc ?? "");
  const [official, setOfficial] = useState(item?.official ?? false);
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [rating, setRating] = useState(String(item?.rating ?? "4.5"));
  const [logoUrl, setLogoUrl] = useState(item?.logoUrl ?? "");
  const [status, setStatus] = useState<BoutiqueStatus>(item?.status ?? "active");

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      desc,
      official,
      tags,
      rating: parseFloat(rating),
      reviews: item?.reviews ?? 0,
      emoji: item?.emoji ?? "🏪",
      bgColor: item?.bgColor ?? "#1a1a1a",
      logoUrl,
      status,
    });
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#1a1a1a", border: "1px solid #FFD000", borderRadius: 12, padding: 28, width: "min(540px, 95vw)", maxHeight: "90vh", overflowY: "auto", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{item?.id ? "Modifier la boutique" : "Ajouter une boutique"}</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            Nom de la boutique
            <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Description
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <label style={labelStyle}>
            Badge
            <select value={official ? "official" : "affiliated"} onChange={(e) => setOfficial(e.target.value === "official")} style={inputStyle}>
              <option value="official">✅ Officielle DealFlash</option>
              <option value="affiliated">🤝 Affiliée</option>
            </select>
          </label>
          <div>
            <p style={{ fontSize: 13, color: "#aaa", marginBottom: 8 }}>Catégories</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleTag(cat)}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: `1px solid ${tags.includes(cat) ? "#FFD000" : "#333"}`,
                    background: tags.includes(cat) ? "#FFD00022" : "#111",
                    color: tags.includes(cat) ? "#FFD000" : "#888",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Note initiale
              <input type="number" min="1" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              URL logo
              <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <label style={labelStyle}>
            Statut
            <select value={status} onChange={(e) => setStatus(e.target.value as BoutiqueStatus)} style={inputStyle}>
              <option value="active">Active</option>
              <option value="suspended">Suspendue</option>
              <option value="pending">En vérification</option>
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

export default function AdminBoutiques() {
  const [items, setItems] = useState<AdminBoutique[]>([]);
  const [search, setSearch] = useState("");
  const [badgeFilter, setBadgeFilter] = useState<"all" | "official" | "affiliated">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{ open: boolean; item: AdminBoutique | null }>({ open: false, item: null });
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Admin · Boutiques | DealFlash";
    setItems(getAdminBoutiques());
  }, []);

  const persist = (updated: AdminBoutique[]) => {
    setItems(updated);
    saveAdminBoutiques(updated);
  };

  const filtered = useMemo(() => {
    return items.filter((b) => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
      const matchBadge =
        badgeFilter === "all" || (badgeFilter === "official" ? b.official : !b.official);
      return matchSearch && matchBadge;
    });
  }, [items, search, badgeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const summary = useMemo(() => {
    const official = items.filter((b) => b.official).length;
    const affiliated = items.filter((b) => !b.official).length;
    const suspended = items.filter((b) => b.status === "suspended").length;
    return { total: items.length, official, affiliated, suspended };
  }, [items]);

  const toggleStatus = (id: number) => {
    persist(items.map((b) => {
      if (b.id !== id) return b;
      const idx = STATUS_ORDER.indexOf(b.status);
      return { ...b, status: STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] };
    }));
  };

  const toggleBadge = (id: number) => {
    persist(items.map((b) => (b.id === id ? { ...b, official: !b.official } : b)));
  };

  const deleteItem = (id: number) => {
    if (!confirm("Supprimer cette boutique ?")) return;
    persist(items.filter((b) => b.id !== id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    const ids = pageItems.map((b) => b.id);
    const all = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const s = new Set(prev);
      ids.forEach((id) => (all ? s.delete(id) : s.add(id)));
      return s;
    });
  };

  const openAdd = () => setModal({ open: true, item: null });
  const openEdit = (item: AdminBoutique) => setModal({ open: true, item });

  const handleSave = (data: Omit<AdminBoutique, "id">) => {
    if (modal.item) {
      persist(items.map((b) => (b.id === modal.item!.id ? { ...b, ...data } : b)));
    } else {
      const newId = Math.max(0, ...items.map((b) => b.id)) + 1;
      persist([...items, { id: newId, ...data }]);
    }
    setModal({ open: false, item: null });
  };

  return (
    <AdminLayout>
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🏪 Gestion des Boutiques</h1>
            <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
              Total : {summary.total} boutiques | Officielles : {summary.official} | Affiliées : {summary.affiliated} | Suspendues : {summary.suspended}
            </p>
          </div>
          <button onClick={openAdd} style={primaryBtnStyle}>+ Ajouter une boutique</button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="🔍 Rechercher une boutique..."
            style={{ ...inputStyle, maxWidth: 320 }}
          />
          <select
            value={badgeFilter}
            onChange={(e) => { setBadgeFilter(e.target.value as typeof badgeFilter); setCurrentPage(1); }}
            style={{ ...inputStyle, maxWidth: 200 }}
          >
            <option value="all">Tous les badges</option>
            <option value="official">Officielle DealFlash</option>
            <option value="affiliated">Affiliée</option>
          </select>
        </div>

        {selected.size > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: "10px 14px", background: "#1a1a1a", border: "1px solid #FFD000", borderRadius: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "#888", fontSize: 13 }}>{selected.size} sélectionné(s)</span>
            <button
              onClick={() => { persist(items.map((b) => (selected.has(b.id) ? { ...b, status: "active" } : b))); setSelected(new Set()); }}
              style={smallBtnStyle}
            >✅ Activer</button>
            <button
              onClick={() => { if (confirm(`Supprimer ${selected.size} boutique(s) ?`)) { persist(items.filter((b) => !selected.has(b.id))); setSelected(new Set()); } }}
              style={{ ...smallBtnStyle, background: "#7f1d1d", borderColor: "#ef4444", color: "#fca5a5" }}
            >🗑️ Supprimer la sélection</button>
          </div>
        )}

        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #2a2a2a" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                <th style={thStyle}><input type="checkbox" checked={pageItems.length > 0 && pageItems.every((b) => selected.has(b.id))} onChange={toggleSelectAll} /></th>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Logo</th>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Badge</th>
                <th style={thStyle}>Catégories</th>
                <th style={thStyle}>Note</th>
                <th style={thStyle}>Nb avis</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #1e1e1e", background: selected.has(b.id) ? "#1e1a00" : "#0f0f0f" }}>
                  <td style={tdStyle}><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} /></td>
                  <td style={{ ...tdStyle, color: "#555" }}>{b.id}</td>
                  <td style={tdStyle}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: b.bgColor, border: "2px solid #FFD000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {b.emoji}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "white", fontWeight: 500, maxWidth: 180 }}>{b.name}</td>
                  <td style={tdStyle}><BadgePill official={b.official} onClick={() => toggleBadge(b.id)} /></td>
                  <td style={{ ...tdStyle, maxWidth: 200 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {b.tags.slice(0, 2).map((t) => (
                        <span key={t} style={{ background: "#2a2a2a", color: "#FFD000", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{t}</span>
                      ))}
                      {b.tags.length > 2 && <span style={{ color: "#555", fontSize: 11 }}>+{b.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#FFD000" }}>★ {b.rating}</td>
                  <td style={{ ...tdStyle, color: "#aaa" }}>{b.reviews.toLocaleString("fr-CA")}</td>
                  <td style={tdStyle}><StatusPill status={b.status} onClick={() => toggleStatus(b.id)} /></td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(b)} style={actionBtnStyle} title="Modifier">✏️</button>
                      <button onClick={() => deleteItem(b.id)} style={{ ...actionBtnStyle, color: "#ef4444" }} title="Supprimer">🗑️</button>
                      <button onClick={() => window.alert(`Boutique : ${b.name}`)} style={actionBtnStyle} title="Voir la boutique">👁</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: "center", color: "#555", padding: 32 }}>Aucune boutique trouvée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination2
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          rowsPerPage={ROWS_PER_PAGE}
          onPageChange={(p) => {
            setCurrentPage(p);
            sectionRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {modal.open && (
          <BoutiqueModal
            item={modal.item}
            onSave={handleSave}
            onClose={() => setModal({ open: false, item: null })}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function AdminPagination2({ currentPage, totalPages, totalItems, rowsPerPage, onPageChange }: {
  currentPage: number; totalPages: number; totalItems: number; rowsPerPage: number; onPageChange: (p: number) => void;
}) {
  const [jump, setJump] = useState("");
  const [err, setErr] = useState(false);
  if (totalPages <= 1) return null;

  const doJump = () => {
    const n = parseInt(jump, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) { onPageChange(n); setJump(""); setErr(false); }
    else { setErr(true); setTimeout(() => setErr(false), 1000); }
  };

  const pages = buildPageList2(currentPage, totalPages);
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ color: "#888", fontSize: 13 }}>Affichage de {start} à {end} sur {totalItems}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          <PBtn2 disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>◀ Précédent</PBtn2>
          {pages.map((p, i) =>
            p === "..." ? <span key={`e${i}`} style={{ color: "#555", padding: "0 8px", alignSelf: "center" }}>...</span>
              : <PBtn2 key={p} active={p === currentPage} onClick={() => onPageChange(p as number)}>{p}</PBtn2>
          )}
          <PBtn2 disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Suivant ▶</PBtn2>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#888", fontSize: 13 }}>Page</span>
          <input type="number" value={jump} onChange={(e) => setJump(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doJump()}
            style={{ width: 60, height: 34, background: "#1a1a1a", border: `1px solid ${err ? "#ef4444" : "#333"}`, color: "white", textAlign: "center", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <button onClick={doJump} style={{ background: "#FFD000", color: "#111", border: "none", borderRadius: 6, height: 34, padding: "0 12px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Go →</button>
        </div>
      </div>
    </div>
  );
}

function PBtn2({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
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

function buildPageList2(current: number, total: number): (number | "...")[] {
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
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", fontSize: 13, color: "#aaa" };
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
const tdStyle: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle", color: "#ccc" };
const actionBtnStyle: React.CSSProperties = {
  background: "none", border: "1px solid #2a2a2a", borderRadius: 6, padding: "4px 8px",
  cursor: "pointer", fontSize: 14, color: "#aaa", fontFamily: "inherit",
};
