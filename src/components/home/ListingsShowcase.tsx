import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { Pagination } from "./Pagination";
import { Sparkles } from "lucide-react";

interface Item {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  city: string | null;
  images: string[] | null;
  is_featured: boolean;
  featured_priority: number;
}

interface Props {
  title: string;
  subtitle: string;
  emoji: string;
  /** filter by listing_type */
  listingTypes: string[];
  perPage?: number;
  bgColor?: string;
}

export function ListingsShowcase({ title, subtitle, emoji, listingTypes, perPage = 6, bgColor = "#0d0d0d" }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    (async () => {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      const { data, count } = await supabase
        .from("listings")
        .select("id,title,price,currency,city,images,is_featured,featured_priority", { count: "exact" })
        .eq("status", "active")
        .in("listing_type", listingTypes as any)
        .order("is_featured", { ascending: false })
        .order("featured_priority", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);
      setItems((data ?? []) as Item[]);
      setTotal(count ?? 0);
    })();
  }, [page, listingTypes.join(","), perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const handlePage = (p: number) => {
    setPage(p);
    setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <section ref={sectionRef} className="py-16 px-4" style={{ background: bgColor, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white">{emoji} {title}</h2>
          <p className="text-white/70 mt-2">{subtitle}</p>
        </div>
        {items.length === 0 ? (
          <p className="text-center text-white/60">Aucune annonce pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (
              <Link
                key={it.id}
                to={`/annonce/${it.id}`}
                className="rounded-xl transition-all block overflow-hidden"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
              >
                <div className="relative aspect-[4/3] bg-[#111]">
                  {it.images?.[0] && (
                    <img src={it.images[0]} alt={it.title} className="h-full w-full object-cover" loading="lazy" />
                  )}
                  {it.is_featured && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: "#FFD000", color: "#111" }}>
                      <Sparkles className="h-3 w-3" /> Boosté
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-base line-clamp-1">{it.title}</h3>
                  <p className="text-xs text-white/60 mt-1">{it.city ?? "—"}</p>
                  {it.price != null && (
                    <p className="mt-2 font-bold" style={{ color: "#FFD000" }}>
                      {it.price} {it.currency ?? "CAD"}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePage}
            totalItems={total}
            itemsPerPage={perPage}
          />
        )}
      </div>
    </section>
  );
}
