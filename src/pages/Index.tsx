import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard, ListingCardData } from "@/components/listing/ListingCard";
import {
  Search, Home, Hotel, Car, Bike, ShoppingBasket, PawPrint,
  Shirt, Smartphone, Sofa, Wrench, MapPin, ShieldCheck, Zap, Calendar,
} from "lucide-react";
import heroImage from "@/assets/hero-marketplace.jpg";

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

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, price, currency, city, images, allows_booking, is_featured, featured_until, original_price, discount_percent, categories(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);
      if (listings) {
        const now = Date.now();
        setRecent(
          listings.map((l) => {
            const { categories, featured_until, ...rest } = l as typeof l & { categories: { name: string } | null };
            const expired = featured_until && new Date(featured_until).getTime() <= now;
            return {
              ...rest,
              is_featured: expired ? false : rest.is_featured,
              category_name: categories?.name,
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
            Les meilleurs deals, en un éclair.
          </h1>
          <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto animate-fade-in">
            Achetez, vendez et réservez des visites — autos, logements, services et plus, près de chez vous.
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

      {/* CATEGORIES */}
      <section className="container py-16">
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
