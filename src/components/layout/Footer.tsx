import { Link } from "react-router-dom";
import { useSiteText } from "@/hooks/useSiteContent";

export function Footer() {
  const tagline = useSiteText(
    "footer.tagline",
    "Le marketplace québécois pour acheter, vendre et réserver près de chez vous."
  );
  return (
    <footer className="border-t border-border bg-secondary/30 mt-20">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent">
              <span className="text-accent-foreground font-bold">D</span>
            </div>
            <span className="font-bold text-lg">
              Deal<span className="text-accent">Flash</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{tagline}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Marketplace</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/recherche" className="hover:text-foreground transition-smooth">Toutes les annonces</Link></li>
            <li><Link to="/categorie/immobilier" className="hover:text-foreground transition-smooth">Immobilier</Link></li>
            <li><Link to="/categorie/autos" className="hover:text-foreground transition-smooth">Autos</Link></li>
            <li><Link to="/categorie/services" className="hover:text-foreground transition-smooth">Services</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Vendeurs</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/vendre" className="hover:text-foreground transition-smooth">Publier une annonce</Link></li>
            <li><Link to="/devenir-vendeur" className="hover:text-foreground transition-smooth">Devenir vendeur pro</Link></li>
            <li><Link to="/tableau-de-bord" className="hover:text-foreground transition-smooth">Tableau de bord</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Aide</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/aide" className="hover:text-foreground transition-smooth">Centre d'aide</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-smooth">Nous contacter</Link></li>
            <li><Link to="/installer" className="hover:text-foreground transition-smooth">Installer l'app</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-6 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} DealFlash Inc. — Laval, Québec, Canada</p>
          <div className="flex gap-4">
            <Link to="/conditions" className="hover:text-foreground transition-smooth">Conditions</Link>
            <Link to="/confidentialite" className="hover:text-foreground transition-smooth">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
