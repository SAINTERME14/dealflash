import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Sparkles, Users, Receipt, History, UserPlus, FileText, ShieldCheck, KanbanSquare, Wallet, LifeBuoy, Package, Truck, Globe, ShoppingCart, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, end: true },
  { to: "/admin/contenu", label: "Contenu du site", icon: FileText },
  { to: "/admin/vedette", label: "Sélection sponsorisée", icon: Sparkles },
  { to: "/admin/utilisateurs", label: "Utilisateurs & rôles", icon: Users },
  { to: "/admin/tickets", label: "Tickets & revenus", icon: Receipt },
  { to: "/admin/finances", label: "Finances", icon: Wallet },
  { to: "/admin/support", label: "Support utilisateurs", icon: LifeBuoy },
  { to: "/admin/taches", label: "Tâches internes", icon: KanbanSquare },
  { to: "/admin/verifications", label: "Vérifications KYC", icon: ShieldCheck },
  { to: "/admin/demandes-vendeurs", label: "Demandes vendeurs", icon: UserPlus },
  { to: "/admin/dropshipping", label: "Dropshipping (vue)", icon: Boxes, end: true },
  { to: "/admin/dropshipping/catalogue", label: "Catalogue produits", icon: Package },
  { to: "/admin/dropship-orders", label: "Commandes fournisseurs", icon: ShoppingCart },
  { to: "/admin/fournisseurs", label: "Fournisseurs", icon: Truck },
  { to: "/admin/canaux", label: "Canaux de vente", icon: Globe },
  { to: "/admin/journal", label: "Journal d'audit", icon: History },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="container py-6">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside>
          <nav className="sticky top-20 space-y-1">
            <h2 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </h2>
            {items.map((item) => {
              const active = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
