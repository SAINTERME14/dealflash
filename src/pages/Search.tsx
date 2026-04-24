import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, ListingCardData } from "@/components/listing/ListingCard";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2 } from "lucide-react";

export default function Search() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = params.slug;
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    document.title = categoryName
      ? `${categoryName} — DealFlash`
      : "Rechercher — DealFlash";
  }, [categoryName]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let categoryId: string | null = null;
      if (categorySlug) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id, name")
          .eq("slug", categorySlug)
          .maybeSingle();
        if (cat) {
          categoryId = cat.id;
          setCategoryName(cat.name);
        }
      } else {
        setCategoryName(null);
      }

      let req = supabase
        .from("listings")
        .select("id, title, price, currency, city, images, allows_booking")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(48);

      if (categoryId) req = req.eq("category_id", categoryId);
      const q = searchParams.get("q");
      if (q) req = req.ilike("title", `%${q}%`);

      const { data } = await req;
      setListings(data || []);
      setLoading(false);
    })();
  }, [categorySlug, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">
          {categoryName ?? "Toutes les annonces"}
        </h1>
        <form onSubmit={handleSubmit} className="relative max-w-xl">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="pl-10"
          />
        </form>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          Aucune annonce trouvée.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
