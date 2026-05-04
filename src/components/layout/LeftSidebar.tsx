import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Info, LayoutGrid, Users, Store, Zap, Phone, Lock, Menu, X } from "lucide-react";

const items = [
  { to: "/", label: "Accueil", Icon: Home },
  { to: "/a-propos", label: "À propos", Icon: Info },
  { to: "/recherche", label: "Catégories des articles", Icon: LayoutGrid },
  { to: "/devenir-annonceur/particulier", label: "Typologie des annonceurs", Icon: Users },
  { to: "/boutiques", label: "Nos boutiques", Icon: Store },
  { to: "/ventes-flash", label: "Ventes Flash", Icon: Zap },
  { to: "/support", label: "Contactez-nous", Icon: Phone },
  { to: "/auth", label: "Connexion / Mon compte", Icon: Lock },
];

export function LeftSidebar() {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col py-4">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-[14px] text-white border-l-4 transition-colors ${
              isActive
                ? "border-[#FFD000] bg-white/5 font-bold"
                : "border-transparent hover:border-[#FFD000] hover:bg-white/5"
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="text-sm">{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        className="md:hidden fixed top-3 left-3 z-[60] flex items-center justify-center h-10 w-10 rounded-lg bg-[#111] text-[#FFD000] border border-[#FFD000]/40"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[240px] bg-[#111111] border-r border-[#FFD000]/20 z-50 overflow-y-auto transform transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-6 border-b border-white/10">
          <NavLink to="/" className="block text-2xl font-extrabold text-[#FFD000] tracking-tight">
            DealFlash
          </NavLink>
          <p className="text-xs text-white/60 mt-1">Marketplace local QC</p>
        </div>
        {nav}
      </aside>
    </>
  );
}
