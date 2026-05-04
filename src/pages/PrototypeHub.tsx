import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Sparkles, Store, Megaphone, ShoppingBag } from "lucide-react";
import { ListingsShowcase } from "@/components/home/ListingsShowcase";

interface Props {
  kind: "annonceurs" | "boutique" | "boutiques-list";
}

const LABELS: Record<string, string> = {
  particuliers: "Particuliers",
  "petites-et-moyennes-entreprises-pme": "Petites & moyennes entreprises (PME)",
  "grandes-enseignes": "Grandes enseignes",
  "boutiques-dealflash-officielles": "Boutiques DealFlash officielles",
  "affilies-certifies-dealflash": "Affiliés certifiés DealFlash",
  "organismes-a-but-non-lucratif-obnl": "Organismes à but non lucratif (OBNL)",
};

function unslug(s: string) {
  return LABELS[s] ?? s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function MockGrid({ titlePrefix, count = 6 }: { titlePrefix: string; count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        name: `${titlePrefix} #${i + 1}`,
        boost: i < 2,
      })),
    [titlePrefix, count]
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((it) => (
        <div
          key={it.id}
          className="rounded-xl overflow-hidden"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        >
          <div className="aspect-[4/3] flex items-center justify-center" style={{ background: "#222" }}>
            <Store className="h-10 w-10 text-white/40" />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{it.name}</h3>
              {it.boost && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFD000", color: "#111" }}>
                  <Sparkles className="inline h-3 w-3 mr-0.5" />Boosté
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 mt-1">Emplacement réservé — disponible dès l'inscription des annonceurs.</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PrototypeHub({ kind }: Props) {
  const { slug } = useParams();
  const label = slug ? unslug(slug) : kind === "boutiques-list" ? "Toutes les boutiques" : "";

  useEffect(() => {
    document.title = `${label} — DealFlash`;
  }, [label]);

  const intro =
    kind === "annonceurs"
      ? `Annonceurs de la catégorie « ${label} ». Les profils boostés apparaissent en premier.`
      : kind === "boutique"
      ? `Boutique « ${label} » — vitrine, ventes flash et catalogue.`
      : `Découvrez toutes les boutiques DealFlash. Les boutiques boostées sont mises en avant.`;

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      <header className="py-12 px-4 text-center" style={{ background: "linear-gradient(180deg,#111 0%,#0d0d0d 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#FFD000] mb-2">DealFlash</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">{label}</h1>
          <p className="text-white/70 mt-3 max-w-2xl mx-auto">{intro}</p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full" style={{ background: "#1a1a1a", color: "#FFD000", border: "1px solid #2a2a2a" }}>
            <Megaphone className="h-3 w-3" /> Prototype — sera remplacé par les vrais annonceurs après inscription.
          </div>
        </div>
      </header>

      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-[#FFD000]" />
            <h2 className="text-2xl font-bold text-white">En vedette (boostés)</h2>
          </div>
          <MockGrid titlePrefix={`${label} Premium`} count={3} />
        </div>
      </section>

      <ListingsShowcase
        title="Ventes flash"
        subtitle="Promotions limitées dans cette section"
        emoji="⚡"
        listingTypes={["product", "service"]}
        perPage={3}
      />

      <section className="py-12 px-4" style={{ background: "#0a0a0a" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingBag className="h-5 w-5 text-[#FFD000]" />
            <h2 className="text-2xl font-bold text-white">Autres annonceurs</h2>
          </div>
          <MockGrid titlePrefix={label} count={6} />
        </div>
      </section>

      <div className="py-10 text-center">
        <Link to="/" className="text-[#FFD000] hover:underline text-sm">← Retour à l'accueil</Link>
      </div>
    </div>
  );
}
