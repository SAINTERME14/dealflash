import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListingCard, ListingCardData } from "@/components/listing/ListingCard";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Search, Home, Hotel, Car, Bike, ShoppingBasket, PawPrint,
  Shirt, Smartphone, Sofa, Wrench, MapPin, ShieldCheck, Zap, Calendar,
  LayoutDashboard, Users, Ticket, Sparkles, History, ArrowRight,
  User, Store, Briefcase, BadgeCheck, QrCode, MessageSquare, CalendarCheck, AlertTriangle,
} from "lucide-react";
import heroImage from "@/assets/hero-marketplace.jpg";
import { SellerApplicationForm } from "@/components/home/SellerApplicationForm";

const ICONS: Record<string, typeof Home> = {
  Home, Hotel, Car, Bike, ShoppingBasket, PawPrint, Shirt, Smartphone, Sofa, Wrench,
};

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

export default function Index() {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<ListingCardData[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "DealFlash — Marketplace local du Québec";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Achetez, vendez et réservez des visites partout au Québec : autos, logements, services et plus sur DealFlash.");
  }, []);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, slug, name, icon")
        .eq("is_active", true)
        .order("display_order");
      if (cats) setCategories(cats);

      // La logique featured_until est maintenant gérée côté base de données
      // par la fonction expire_featured_listings() et le cron pg_cron.
      // On récupère is_featured tel quel depuis la DB — toujours à jour.
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, price, currency, city, images, allows_booking, is_featured, featured_until, original_price, discount_percent, categories(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);

      if (listings) {
        setRecent(
          listings.map((l) => {
            const { categories, ...rest } = l as typeof l & { categories: { name: string } | null };
            return {
              ...rest,
              category_name: (categories as { name: string } | null)?.name,
            };
          })
        );
      }
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/recherche${search ? `?q=${encodeURIComponent(search)}` : ""}`);
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover"
            width={1920}
            height={1024}
          />
          <div className="absolute inset-0 gradient-hero opacity-90" />
        </div>
        <div className="relative container py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary-foreground animate-fade-in">
            Trouvez les bons deals, avec les bonnes personnes
          </h1>
          <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto animate-fade-in">
            Une plateforme vérifiée pour acheter, vendre, louer et réserver auprès de vendeurs et professionnels de confiance. Connectez-vous en quelques clics, payez votre ticket, et rencontrez en personne.
          </p>

          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex gap-2 animate-scale-in">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Que cherchez-vous ?"
                className="h-14 pl-12 pr-4 text-base bg-background border-0 rounded-full shadow-elevated"
              />
            </div>
            <Button type="submit" variant="accent" size="xl" className="rounded-full">
              Rechercher
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-primary-foreground/80">
            <MapPin className="h-4 w-4" /> Laval · Montréal · Québec
          </div>
        </div>
      </section>

      {/* ADMIN QUICK ACCESS (admins only) */}
      {isAdmin && (
        <section className="container -mt-8 relative z-10">
          <div className="rounded-2xl border border-primary/20 bg-card/95 backdrop-blur shadow-elevated p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base">Espace administrateur</h2>
                    <Badge variant="secondary" className="text-[10px]">admin</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Accès rapide aux outils de gestion DealFlash.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Button asChild size="sm" variant="default" className="gap-1.5">
                  <Link to="/admin"><LayoutDashboard className="h-3.5 w-3.5" />Tableau de bord</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to="/admin/utilisateurs"><Users className="h-3.5 w-3.5" />Utilisateurs</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to="/admin/tickets"><Ticket className="h-3.5 w-3.5" />Tickets</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to="/admin/vedette"><Sparkles className="h-3.5 w-3.5" />Vedettes</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5 col-span-2 sm:col-span-1">
                  <Link to="/admin/journal"><History className="h-3.5 w-3.5" />Journal</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SUMMARY */}
      <section className="container py-16">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">À propos</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            DealFlash — Connectez-vous avec les bons acheteurs ou vendeurs
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            DealFlash est la plateforme locale du Québec qui met en relation des
            <strong className="text-foreground"> acheteurs sérieux</strong> avec des
            <strong className="text-foreground"> vendeurs et professionnels vérifiés</strong>.
            Payez un ticket d'entrée en contact, recevez votre billet QR avec rendez-vous,
            puis rencontrez votre interlocuteur en personne.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            <Badge variant="outline">Tickets sécurisés via Stripe</Badge>
            <Badge variant="outline">Messagerie sécurisée acheteur/vendeur</Badge>
            <Badge variant="outline">Calendrier synchronisé pour rendez-vous</Badge>
            <Badge variant="outline">Articles FLASH (rabais min. 10%)</Badge>
            <Badge variant="outline">Billets QR à scanner</Badge>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="default" size="lg" className="gap-2">
              <Link to="/recherche">Explorer les annonces <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#devenir-vendeur">Devenir vendeur</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 4 TYPES D'ANNONCEURS */}
      <section className="bg-secondary/30 py-16 border-y border-border">
        <div className="container">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <Badge variant="secondary" className="mb-3">4 profils</Badge>
            <h2 className="text-3xl font-bold">4 types d'annonceurs sur DealFlash</h2>
            <p className="text-muted-foreground mt-2">Chaque profil a ses exigences de vérification pour garantir la confiance.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/devenir-annonceur/particulier" className="group text-left rounded-xl bg-card border border-border p-6 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-smooth">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <User className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-primary mb-1">1️⃣ PARTICULIERS</div>
              <h3 className="font-bold mb-2">Vendez vos articles, meubles, autos, services ou locations</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>📋 3-8 photos, description détaillée</li>
                <li>📋 Révéler les défauts</li>
                <li>✓ Vérification d'identité requise</li>
              </ul>
              <div className="mt-4 text-xs font-semibold text-primary inline-flex items-center gap-1">
                Devenir particulier <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
            <Link to="/devenir-annonceur/pro-occasionnel" className="group text-left rounded-xl bg-card border border-border p-6 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-smooth">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-primary mb-1">2️⃣ VENDEURS PROFESSIONNELS (Occasionnels)</div>
              <h3 className="font-bold mb-2">Un seul article à vendre ? Même format que les particuliers</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>📋 Révélez votre identité professionnelle</li>
                <li>✓ Vérification de statut professionnel requise</li>
              </ul>
              <div className="mt-4 text-xs font-semibold text-primary inline-flex items-center gap-1">
                Devenir pro occasionnel <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
            <Link to="/devenir-annonceur/commerce" className="group text-left rounded-xl bg-card border border-border p-6 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-smooth">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4 group-hover:scale-110 transition-transform">
                <Store className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-accent mb-1">3️⃣ COMMERCES & SERVICES</div>
              <h3 className="font-bold mb-2">Lancez des campagnes d'articles multiples</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>🔥 Articles FLASH : rabais min. 10%</li>
                <li>📅 Calendrier de disponibilités synchronisé</li>
                <li>✓ Vérification d'entreprise requise</li>
              </ul>
              <div className="mt-4 text-xs font-semibold text-accent inline-flex items-center gap-1">
                Devenir commerce <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
            <Link to="/devenir-annonceur/pro-reglemente" className="group text-left rounded-xl bg-card border border-border p-6 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-smooth">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success mb-4 group-hover:scale-110 transition-transform">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-success mb-1">4️⃣ PROFESSIONNELS RÉGLEMENTÉS</div>
              <h3 className="font-bold mb-2">Médecins, avocats, plombiers, électriciens, etc.</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Certifié conforme à votre autorité de tutelle</li>
                <li>💰 Prix du marché + prix promotionnel affichés</li>
                <li>✓ Vérification de licence professionnelle requise</li>
              </ul>
              <div className="mt-4 text-xs font-semibold text-success inline-flex items-center gap-1">
                Devenir pro réglementé <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* COMMENT ACHETER / COMMENT VENDRE */}
      <section className="container py-16">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-accent text-accent-foreground">
                <Ticket className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">Comment acheter</h3>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="font-bold text-accent">1.</span><span>Trouvez l'annonce ou le service qui vous intéresse</span></li>
              <li className="flex gap-3"><span className="font-bold text-accent">2.</span><span>Cliquez sur <strong>« Entrer en contact »</strong></span></li>
              <li className="flex gap-3"><span className="font-bold text-accent">3.</span><span>Payez votre ticket d'accès (Stripe ou Interac QR)</span></li>
              <li className="flex gap-3"><span className="font-bold text-accent">4.</span><span>Recevez votre billet avec rendez-vous</span></li>
              <li className="flex gap-3"><span className="font-bold text-accent">5.</span><span>Discutez et planifiez la rencontre</span></li>
              <li className="flex gap-3"><span className="font-bold text-accent">6.</span><span>Complétez votre transaction <strong>en personne</strong></span></li>
            </ol>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">Comment vendre</h3>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="font-bold text-primary">1.</span><span>Choisissez votre catégorie (particulier, commerce, professionnel, etc.)</span></li>
              <li className="flex gap-3"><span className="font-bold text-primary">2.</span><span>Vérifiez votre identité ou licence professionnelle</span></li>
              <li className="flex gap-3"><span className="font-bold text-primary">3.</span><span>Publiez votre annonce avec photos et description détaillée</span></li>
              <li className="flex gap-3"><span className="font-bold text-primary">4.</span><span>Définissez vos conditions (prix, rabais, horaires)</span></li>
              <li className="flex gap-3"><span className="font-bold text-primary">5.</span><span>Recevez les demandes de contact des acheteurs sérieux</span></li>
              <li className="flex gap-3"><span className="font-bold text-primary">6.</span><span>Synchronisez votre calendrier et confirmez les rendez-vous</span></li>
              <li className="flex gap-3"><span className="font-bold text-primary">7.</span><span>Rencontrez vos acheteurs qualifiés</span></li>
            </ol>
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <strong>DealFlash est une plateforme de connexion.</strong> Les transactions
            (vente, location, prestations de services) se complètent entre l'acheteur et le vendeur.
            Les acheteurs paient un ticket pour entrer en contact.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Explorer par catégorie</h2>
          <p className="text-muted-foreground mt-2">10 verticales pour trouver exactement ce qu'il vous faut</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = ICONS[cat.icon] || Home;
            return (
              <Link
                key={cat.id}
                to={`/categorie/${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:-translate-y-1 transition-smooth"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary group-hover:gradient-accent group-hover:text-accent-foreground transition-smooth">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="font-medium text-sm text-center">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* WHY DEALFLASH */}
      <section className="bg-secondary/40 py-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full gradient-accent text-accent-foreground shadow-flash mb-4">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg mb-2">Rapide comme l'éclair</h3>
              <p className="text-sm text-muted-foreground">Publiez une annonce en moins de 2 minutes et touchez instantanément les acheteurs autour de vous.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-primary mb-4">
                <Calendar className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg mb-2">Réservez vos visites</h3>
              <p className="text-sm text-muted-foreground">Logements, voitures, essais routiers : choisissez votre créneau et confirmez en 4 étapes.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground mb-4">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg mb-2">Vendeurs vérifiés</h3>
              <p className="text-sm text-muted-foreground">Profils vérifiés, avis et messagerie intégrée pour des transactions en toute confiance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT LISTINGS */}
      {recent.length > 0 && (
        <section className="container py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Annonces récentes</h2>
              <p className="text-muted-foreground mt-2">Les nouveautés près de chez vous</p>
            </div>
            <Link to="/recherche" className="text-sm font-medium text-primary hover:underline hidden sm:inline">
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {recent.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* SELLER APPLICATION FORM */}
      <div id="devenir-vendeur">
        <SellerApplicationForm />
      </div>

      {/* CTA SELLERS */}
      <section className="container py-16">
        <div className="rounded-2xl gradient-hero p-10 md:p-14 text-center shadow-elevated overflow-hidden relative">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Vous avez quelque chose à vendre ?</h2>
          <p className="text-primary-foreground/90 max-w-xl mx-auto mb-6">
            Particulier ou commerçant : créez votre annonce gratuitement et atteignez des milliers d'acheteurs au Québec.
          </p>
          <Button asChild variant="accent" size="xl" className="rounded-full">
            <Link to="/vendre">Publier mon annonce</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
