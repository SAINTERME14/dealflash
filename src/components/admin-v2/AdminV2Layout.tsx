import { ReactNode, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Sparkles, Bell, KanbanSquare, ShoppingBag, Package,
  Users, UserCog, Wallet, DollarSign, Megaphone, BarChart3, LifeBuoy,
  HeartHandshake, Scale, Plug, FileText, Settings, ShieldAlert,
  Menu, X, Search, ChevronDown, ChevronRight, LogOut, User as UserIcon,
  KeyRound, Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Item = { to?: string; label: string; soon?: boolean };
type Section = { key: string; title: string; items: Item[]; defaultOpen?: boolean };

const SECTIONS: Section[] = [
  { key: "pilotage", title: "Pilotage", defaultOpen: true, items: [
    { to: "/admin/v2", label: "Tableau de bord exécutif" },
    { to: "/admin/v2/centre-controle", label: "Centre de contrôle" },
    { label: "Alertes & monitoring", soon: true },
    { to: "/admin/taches", label: "Tâches internes" },
  ]},
  { key: "marketplace", title: "Marketplace", items: [
    { to: "/admin/vedette", label: "Sélection sponsorisée" },
    { to: "/admin/tickets", label: "Tickets & revenus" },
    { label: "Annonces", soon: true },
    { label: "Boutiques", soon: true },
    { label: "Ventes Flash", soon: true },
    { label: "Rendez-vous", soon: true },
    { label: "Catégories", soon: true },
  ]},
  { key: "dropshipping", title: "Dropshipping", items: [
    { to: "/admin/dropshipping", label: "Vue d'ensemble" },
    { to: "/admin/dropshipping/catalogue", label: "Catalogue produits" },
    { to: "/admin/dropship-orders", label: "Commandes fournisseurs" },
    { to: "/admin/fournisseurs", label: "Fournisseurs" },
    { to: "/admin/canaux", label: "Canaux de vente" },
  ]},
  { key: "utilisateurs", title: "Utilisateurs", items: [
    { to: "/admin/utilisateurs", label: "Tous les utilisateurs" },
    { label: "Vendeurs & Boutiques", soon: true },
    { to: "/admin/v2/equipe", label: "Équipe & rôles admin" },
    { to: "/admin/demandes-vendeurs", label: "Demandes vendeurs" },
    { to: "/admin/verifications", label: "Vérifications KYC" },
    { label: "Avis & réputation", soon: true },
    { label: "Sanctions & bans", soon: true },
  ]},
  { key: "comptabilite", title: "Comptabilité & Finances", items: [
    { to: "/admin/finances", label: "Vue d'ensemble" },
    { label: "Factures & paiements", soon: true },
    { label: "Rapprochements", soon: true },
  ]},
  { key: "monetisation", title: "Monétisation", items: [
    { label: "Abonnements & plans", soon: true },
    { label: "Promotions & coupons", soon: true },
  ]},
  { key: "marketing", title: "Marketing", items: [
    { label: "Plateforme — campagnes", soon: true },
    { label: "Clients — segments", soon: true },
  ]},
  { key: "croissance", title: "Croissance & Analytics", items: [
    { label: "KPI produit", soon: true },
    { label: "Acquisition & rétention", soon: true },
  ]},
  { key: "support", title: "Support & Qualité", items: [
    { to: "/admin/support", label: "Tickets de support" },
    { label: "FAQ & base de connaissances", soon: true },
  ]},
  { key: "rh", title: "Ressources humaines", items: [
    { label: "Équipe interne", soon: true },
    { label: "Contrats & paie", soon: true },
  ]},
  { key: "juridique", title: "Juridique & Conformité", items: [
    { label: "RGPD / Loi 25", soon: true },
    { label: "CGU & politiques", soon: true },
  ]},
  { key: "integrations", title: "Intégrations & API", items: [
    { label: "Webhooks", soon: true },
    { label: "Clés API", soon: true },
  ]},
  { key: "contenu", title: "Contenu & Communication", items: [
    { to: "/admin/contenu", label: "Contenu du site" },
    { label: "Notifications & emails", soon: true },
  ]},
  { key: "configuration", title: "Configuration", items: [
    { label: "Apparence", soon: true },
    { label: "Navigation", soon: true },
    { label: "Réglages généraux", soon: true },
  ]},
  { key: "systeme", title: "Système & Sécurité", items: [
    { to: "/admin/v2/journal", label: "Journal d'audit" },
    { to: "/admin/v2/securite", label: "Sécurité & sessions" },
    { label: "Backups", soon: true },
    { label: "Performance & uptime", soon: true },
    { to: "/admin/v2/centre-controle", label: "Maintenance" },
  ]},
];

const STORAGE_KEY = "admin_v2_sidebar_open";

function loadOpenState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const init: Record<string, boolean> = {};
  SECTIONS.forEach((s) => (init[s.key] = !!s.defaultOpen));
  return init;
}

function ICONS(key: string) {
  const map: Record<string, typeof LayoutDashboard> = {
    pilotage: LayoutDashboard, marketplace: ShoppingBag, dropshipping: Package,
    utilisateurs: Users, comptabilite: Wallet, monetisation: DollarSign,
    marketing: Megaphone, croissance: BarChart3, support: LifeBuoy,
    rh: HeartHandshake, juridique: Scale, integrations: Plug,
    contenu: FileText, configuration: Settings, systeme: ShieldAlert,
  };
  return map[key] ?? LayoutDashboard;
}

function EnvBanner() {
  const isTest = typeof window !== "undefined" &&
    (window.location.hostname.includes("lovable.app") ||
     window.location.hostname.includes("staging") ||
     window.location.hostname === "localhost");
  return (
    <div className={cn(
      "text-center text-[11px] font-semibold tracking-wider py-1 text-white",
      isTest ? "bg-orange-500" : "bg-emerald-600"
    )}>
      {isTest ? "ENVIRONNEMENT DE TEST" : "PRODUCTION"}
    </div>
  );
}

function MaintenanceBanner() {
  const { value } = useSystemConfig<{ enabled: boolean; message: string | null }>("maintenance_mode");
  if (!value?.enabled) return null;
  return (
    <div className="bg-destructive text-destructive-foreground text-center text-sm py-2 font-semibold">
      MODE MAINTENANCE ACTIVÉ {value.message ? `— ${value.message}` : ""}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>(loadOpenState);
  const { pathname } = useLocation();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(open));
  }, [open]);

  return (
    <nav className="space-y-1 p-3">
      {SECTIONS.map((section) => {
        const Icon = ICONS(section.key);
        const isOpen = open[section.key];
        return (
          <div key={section.key}>
            <button
              onClick={() => setOpen((s) => ({ ...s, [section.key]: !s[section.key] }))}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                {section.title}
              </span>
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {isOpen && (
              <div className="ml-2 mt-0.5 space-y-0.5 border-l border-border pl-2">
                {section.items.map((item, idx) => {
                  if (item.soon || !item.to) {
                    return (
                      <div key={idx} className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-muted-foreground/60 cursor-not-allowed">
                        {item.label}
                        <Badge variant="outline" className="text-[9px] h-4 px-1">Bientôt</Badge>
                      </div>
                    );
                  }
                  const active = pathname === item.to ||
                    (item.to !== "/admin/v2" && pathname.startsWith(item.to));
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/admin/v2"}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded px-2 py-1.5 text-sm transition",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function Header() {
  const { user, signOut } = useAuth();
  const { admin } = useAdminUser();
  const navigate = useNavigate();
  const initial = (user?.email ?? "A").slice(0, 1).toUpperCase();

  return (
    <header className="h-14 border-b bg-background flex items-center gap-3 px-4 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-orange-500 text-white font-bold flex items-center justify-center">D</div>
        <span className="font-semibold text-sm">Admin</span>
      </div>
      <div className="flex-1 max-w-xl mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher utilisateur, annonce, ID..."
          className="pl-9 h-9"
          disabled
        />
      </div>
      <button className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:bg-muted rounded-full p-1 pr-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initial}</AvatarFallback>
            </Avatar>
            {admin && (
              <Badge variant="outline" className="text-[10px] hidden md:inline-flex">
                {admin.role}
              </Badge>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => navigate("/profil")}>
            <UserIcon className="h-4 w-4 mr-2" /> Mon profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/admin/v2/securite")}>
            <Monitor className="h-4 w-4 mr-2" /> Sessions actives
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/admin/v2/securite/2fa")}>
            <KeyRound className="h-4 w-4 mr-2" />
            {admin?.two_fa_enabled ? "Gérer le 2FA" : "Activer le 2FA"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export function AdminV2Layout({ children }: { children?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <EnvBanner />
      <MaintenanceBanner />
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-64 border-r bg-background overflow-y-auto sticky top-14 h-[calc(100vh-3.5rem)]">
          <SidebarContent />
        </aside>

        {/* Mobile trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed bottom-4 left-4 z-30 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="relative w-72 max-w-[85vw] bg-background overflow-y-auto">
              <div className="flex items-center justify-between p-3 border-b">
                <span className="font-semibold">Menu admin</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Fermer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 md:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
