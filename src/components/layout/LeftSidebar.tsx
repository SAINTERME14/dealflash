import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { sidebarStore, useSidebarOpen } from "./sidebarStore";

const CATEGORIES = [
  "Électronique & Informatique",
  "Électroménagers & Cuisine",
  "Meubles & Décoration",
  "Mode & Vêtements",
  "Sports & Plein air",
  "Bébé & Enfants",
  "Automobile & Pièces",
  "Jardin & Bricolage",
  "Livres, Films & Musique",
  "Épicerie & Alimentation",
  "Bijoux & Montres",
  "Jeux vidéo & Consoles",
  "Beauté & Santé",
  "Animalerie",
  "Services professionnels",
  "Rénovation & Construction",
  "Restauration & Traiteurs",
  "Tourisme & Voyages",
];

const ANNONCEURS = [
  "Particuliers",
  "Petites & moyennes entreprises (PME)",
  "Grandes enseignes",
  "Boutiques DealFlash officielles",
  "Affiliés certifiés DealFlash",
  "Organismes à but non lucratif (OBNL)",
];

interface ItemProps {
  to: string;
  icon: string;
  label: string;
}

function Item({ to, icon, label }: ItemProps) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={() => sidebarStore.set(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 border-l-4 transition-colors text-white text-[15px] ${
          isActive
            ? "border-[#FFD000] bg-[#1a1a1a] font-bold"
            : "border-transparent hover:border-[#FFD000] hover:bg-[#1a1a1a]"
        }`
      }
      style={{ padding: "14px 20px" }}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "et")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Accordion({ icon, label, items, basePath }: { icon: string; label: string; items: string[]; basePath: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 border-l-4 transition-colors text-white text-[15px] ${
          open ? "border-[#FFD000] bg-[#1a1a1a] font-bold" : "border-transparent hover:border-[#FFD000] hover:bg-[#1a1a1a]"
        }`}
        style={{ padding: "14px 20px" }}
      >
        <span className="text-lg leading-none">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="bg-[#0d0d0d]">
          {items.map((it) => (
            <NavLink
              key={it}
              to={`${basePath}/${slugify(it)}`}
              onClick={() => sidebarStore.set(false)}
              className="block text-[13px] text-[#cccccc] hover:text-[#FFD000] transition-colors"
              style={{ padding: "8px 20px 8px 44px" }}
            >
              {it}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeftSidebar() {
  const open = useSidebarOpen();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => sidebarStore.set(false)}
        className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100 z-[999] pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className="fixed top-0 left-0 h-screen overflow-y-auto transition-transform duration-300 ease-out"
        style={{
          width: 280,
          background: "#111111",
          borderRight: "2px solid #FFD000",
          zIndex: 1000,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <span className="text-2xl font-extrabold text-[#FFD000] tracking-tight">DealFlash</span>
          <button
            onClick={() => sidebarStore.set(false)}
            aria-label="Fermer"
            className="text-white hover:text-[#FFD000] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-col py-2">
          <Item to="/" icon="🏠" label="Accueil" />
          <Item to="/a-propos" icon="ℹ️" label="À propos" />
          <Accordion icon="📂" label="Catégories" items={CATEGORIES} basePath="/categorie" />
          <Accordion icon="🏷️" label="Typologie des annonceurs" items={ANNONCEURS} basePath="/annonceurs" />
          <Item to="/boutiques" icon="🏪" label="Nos boutiques" />
          <Item to="/support" icon="📞" label="Contactez-nous" />
          <Item to="/auth" icon="🔐" label="Connexion / Mon compte" />
        </nav>
      </aside>
    </>
  );
}
