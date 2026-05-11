import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getPartners, savePartners, type Partner } from "@/data/partnersData";

interface PartnerModalProps {
  item: Partial<Partner> | null;
  onSave: (data: Omit<Partner, "id">) => void;
  onClose: () => void;
}

function PartnerModal({ item, onSave, onClose }: PartnerModalProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [color, setColor] = useState(item?.color ?? "#FFD000");
  const [order, setOrder] = useState(String(item?.order ?? "1"));
  const [visible, setVisible] = useState(item?.visible ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, color, order: parseInt(order, 10) || 1, visible });
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#1a1a1a", border: "1px solid #FFD000", borderRadius: 12, padding: 28, width: "min(420px, 95vw)", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{item?.id ? "Modifier le partenaire" : "Ajouter un partenaire"}</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            Nom du partenaire
            <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Couleur de marque (#hex)
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
              <input value={color} onChange={(e) => setColor(e.target.value)} style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: color, border: "2px solid #333", flexShrink: 0 }} />
            </div>
          </label>
          <label style={labelStyle}>
            Ordre d'affichage
            <input type="number" min="1" value={order} onChange={(e) => setOrder(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ ...labelStyle, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} style={{ width: 16, height: 16 }} />
            <span>Affiché dans le ticker</span>
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

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [modal, setModal] = useState<{ open: boolean; item: Partner | null }>({ open: false, item: null });
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  useEffect(() => {
    document.title = "Admin · Partenaires | Boardeal";
    setPartners(getPartners().sort((a, b) => a.order - b.order));
  }, []);

  const persist = (updated: Partner[]) => {
    const reordered = updated.map((p, i) => ({ ...p, order: i + 1 }));
    setPartners(reordered);
    savePartners(reordered);
  };

  const toggleVisible = (id: number) => {
    persist(partners.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)));
  };

  const deletePartner = (id: number) => {
    if (!confirm("Supprimer ce partenaire ?")) return;
    persist(partners.filter((p) => p.id !== id));
  };

  const openAdd = () => setModal({ open: true, item: null });
  const openEdit = (item: Partner) => setModal({ open: true, item });

  const handleSave = (data: Omit<Partner, "id">) => {
    if (modal.item) {
      persist(partners.map((p) => (p.id === modal.item!.id ? { ...p, ...data } : p)));
    } else {
      const newId = Math.max(0, ...partners.map((p) => p.id)) + 1;
      persist([...partners, { id: newId, ...data }]);
    }
    setModal({ open: false, item: null });
  };

  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); dragOverIdx.current = idx; };

  const handleDrop = () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) return;
    const next = [...partners];
    const [removed] = next.splice(dragIdx.current, 1);
    next.splice(dragOverIdx.current, 0, removed);
    persist(next);
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  const visibleCount = partners.filter((p) => p.visible).length;

  return (
    <AdminLayout>
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🤝 Gestion des Partenaires</h1>
            <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
              Total : {partners.length} partenaires | Affichés : {visibleCount} | Masqués : {partners.length - visibleCount}
            </p>
          </div>
          <button onClick={openAdd} style={primaryBtnStyle}>+ Ajouter un partenaire</button>
        </div>

        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#888" }}>
          💡 Glissez-déposez les lignes pour changer l'ordre d'affichage dans le ticker.
        </div>

        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #2a2a2a" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                <th style={thStyle}>⠇</th>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Couleur de marque</th>
                <th style={thStyle}>Ordre</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p, idx) => (
                <tr
                  key={p.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  style={{ borderBottom: "1px solid #1e1e1e", background: "#0f0f0f", cursor: "grab", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#0f0f0f")}
                >
                  <td style={{ ...tdStyle, color: "#444", fontSize: 18, cursor: "grab", userSelect: "none" }}>⠇</td>
                  <td style={{ ...tdStyle, color: "#555" }}>{p.order}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, display: "inline-block", border: "1px solid #333" }} />
                      {p.name}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 4, background: p.color, display: "inline-block", border: "1px solid #333" }} />
                      <span style={{ color: "#aaa", fontFamily: "monospace" }}>{p.color}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#aaa" }}>{p.order}</td>
                  <td style={tdStyle}>
                    <span
                      onClick={() => toggleVisible(p.id)}
                      style={{
                        background: p.visible ? "#22c55e22" : "#6b728022",
                        color: p.visible ? "#22c55e" : "#6b7280",
                        border: `1px solid ${p.visible ? "#22c55e" : "#6b7280"}`,
                        borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", userSelect: "none",
                      }}
                    >
                      {p.visible ? "Affiché" : "Masqué"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(p)} style={actionBtnStyle} title="Modifier">✏️</button>
                      <button onClick={() => deletePartner(p.id)} style={{ ...actionBtnStyle, color: "#ef4444" }} title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "#555", padding: 32 }}>Aucun partenaire</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#aaa" }}>Aperçu du ticker</h3>
          <div style={{ background: "#111", border: "2px solid #FFD000", borderRadius: 8, height: 60, overflow: "hidden", position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ minWidth: 120, padding: "0 16px", borderRight: "1px solid #333", color: "#FFD000", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, flexShrink: 0 }}>
              PARTENAIRES ▶
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 16, padding: "0 12px", overflowX: "auto" }}>
                {partners.filter((p) => p.visible).map((p) => (
                  <span
                    key={p.id}
                    style={{ background: "#1a1a1a", border: `1px solid ${p.color}`, borderRadius: 6, padding: "6px 14px", color: p.color, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}
                  >
                    <span style={{ color: p.color }}>●</span> {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {modal.open && (
          <PartnerModal item={modal.item} onSave={handleSave} onClose={() => setModal({ open: false, item: null })} />
        )}
      </div>
    </AdminLayout>
  );
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
