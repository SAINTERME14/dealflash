import { Link, useNavigate } from "react-router-dom";
import boardealLogo from "@/assets/boardeal-logo.jpeg";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Plus, User, LogOut, Search, Sparkles, ShieldCheck, Menu } from "lucide-react";
import { sidebarStore } from "./sidebarStore";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const ticketsEnabled = useFeatureFlag("tickets_enabled", true);
  const leadsEnabled = useFeatureFlag("leads_enabled", true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <button
          onClick={() => sidebarStore.toggle()}
          aria-label="Ouvrir le menu"
          className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-secondary transition-colors shrink-0"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Boardeal">
          <img src={boardealLogo} alt="Boardeal" className="h-14 w-auto drop-shadow-lg" />
        </Link>

        <Link
          to="/recherche"
          className="flex-1 max-w-md flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-smooth"
        >
          <Search className="h-4 w-4" />
          <span>Rechercher au Québec…</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex gap-1.5">
            <Link to="/vedette" aria-label="En vedette">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Vedette</span>
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Link to="/favoris" aria-label="Favoris"><Heart className="h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Link to="/messages" aria-label="Messages"><MessageCircle className="h-5 w-5" /></Link>
              </Button>
              <NotificationsBell />
              <Button asChild variant="accent" size="sm" className="gap-1.5">
                <Link to="/vendre"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Vendre</span></Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Mon compte">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <DropdownMenuItem asChild><Link to="/tableau-de-bord">Tableau de bord</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/mes-annonces">Mes annonces</Link></DropdownMenuItem>
                  {ticketsEnabled && (
                    <DropdownMenuItem asChild><Link to="/mes-tickets">Mes tickets</Link></DropdownMenuItem>
                  )}
                  {leadsEnabled && (
                    <DropdownMenuItem asChild><Link to="/mes-leads">Mes leads</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild><Link to="/affilie/qr-codes">Mes QR d'affiliation</Link></DropdownMenuItem>
                  {false && (
                  )}
                  <DropdownMenuItem asChild><Link to="/mes-reservations">Mes réservations</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/profil">Mon profil</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/support">Support & aide</Link></DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <ShieldCheck className="h-4 w-4 mr-2 text-accent" />
                          Console admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Se connecter</Link>
              </Button>
              <Button asChild variant="accent" size="sm">
                <Link to="/auth?mode=signup">S'inscrire</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
