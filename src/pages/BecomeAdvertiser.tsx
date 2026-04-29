import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, ArrowLeft, User, Briefcase, Store, BadgeCheck,
} from "lucide-react";

type ProfileSlug = "particulier" | "pro-occasionnel" | "commerce" | "pro-reglemente";

const PROFILE_TO_DB: Record<ProfileSlug, "particulier" | "pro_occasionnel" | "commerce" | "pro_reglemente"> = {
  "particulier": "particulier",
  "pro-occasionnel": "pro_occasionnel",
  "commerce": "commerce",
  "pro-reglemente": "pro_reglemente",
};

const PROFILES = {
  "particulier": {
    title: "Particulier",
    icon: User,
    color: "bg-primary/10 text-primary",
    badge: "1️⃣ PARTICULIERS",
    intro:
      "Vendez vos articles, meubles, autos, prestations ponctuelles ou louez votre logement entre particuliers.",
    requirements: [
      "3 à 8 photos claires de l'article",
      "Description détaillée et révélation des défauts",
      "Vérification d'identité requise après acceptation",
    ],
    listingTypes: [
      { value: "product", label: "Produit / objet" },
      { value: "vehicle", label: "Véhicule" },
      { value: "rental", label: "Location" },
      { value: "service", label: "Service ponctuel" },
    ],
    extraFields: [] as Array<"business_name" | "neq" | "profession" | "license">,
  },
  "pro-occasionnel": {
    title: "Vendeur professionnel occasionnel",
    icon: Briefcase,
    color: "bg-primary/10 text-primary",
    badge: "2️⃣ PRO OCCASIONNEL",
    intro:
      "Un seul article ou service à proposer ? Format identique aux particuliers, mais vous devez révéler votre statut professionnel.",
    requirements: [
      "Mêmes exigences photos / description que les particuliers",
      "Indiquez votre nom commercial ou raison sociale",
      "Vérification de statut professionnel requise",
    ],
    listingTypes: [
      { value: "product", label: "Produit" },
      { value: "vehicle", label: "Véhicule" },
      { value: "service", label: "Service" },
      { value: "rental", label: "Location" },
    ],
    extraFields: ["business_name"] as Array<"business_name" | "neq" | "profession" | "license">,
  },
  "commerce": {
    title: "Commerce ou service multi-articles",
    icon: Store,
    color: "bg-accent/10 text-accent",
    badge: "3️⃣ COMMERCES & SERVICES",
    intro:
      "Lancez des campagnes d'articles multiples, des ventes FLASH (rabais minimum 10 %) et synchronisez votre calendrier de rendez-vous.",
    requirements: [
      "Articles FLASH : rabais minimum 10 % vs prix régulier",
      "Calendrier de disponibilités synchronisé",
      "Vérification d'entreprise (NEQ) requise",
    ],
    listingTypes: [
      { value: "product", label: "Produits (boutique)" },
      { value: "service", label: "Services" },
      { value: "hotel", label: "Hébergement" },
      { value: "rental", label: "Location" },
    ],
    extraFields: ["business_name", "neq"] as Array<"business_name" | "neq" | "profession" | "license">,
  },
  "pro-reglemente": {
    title: "Professionnel réglementé",
    icon: BadgeCheck,
    color: "bg-success/10 text-success",
    badge: "4️⃣ PROFESSIONNEL RÉGLEMENTÉ",
    intro:
      "Médecins, avocats, plombiers, électriciens, esthéticiennes, etc. Affichez vos prix du marché et vos prix promotionnels avec une licence vérifiée.",
    requirements: [
      "Certifié conforme à votre autorité de tutelle (Ordre, RBQ, CMEQ…)",
      "Prix du marché + prix promotionnel affichés",
      "Vérification de licence professionnelle requise",
    ],
    listingTypes: [
      { value: "service", label: "Service professionnel" },
      { value: "product", label: "Produit professionnel" },
    ],
    extraFields: ["profession", "license"] as Array<"business_name" | "neq" | "profession" | "license">,
  },
} as const;

const baseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(100),
  listing_type: z.enum(["product", "vehicle", "rental", "hotel", "service"]),
  main_category: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10).max(2000),
  business_name: z.string().trim().max(150).optional().or(z.literal("")),
  neq_number: z.string().trim().max(30).optional().or(z.literal("")),
  profession: z.string().trim().max(100).optional().or(z.literal("")),
  license_number: z.string().trim().max(60).optional().or(z.literal("")),
});

export default function BecomeAdvertiser() {
  const { profile } = useParams<{ profile: ProfileSlug }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const cfg = profile ? PROFILES[profile] : undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [listingType, setListingType] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [message, setMessage] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [neq, setNeq] = useState("");
  const [profession, setProfession] = useState("");
  const [license, setLicense] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (cfg) document.title = `Devenir ${cfg.title} — DealFlash`;
  }, [cfg]);

  // Pre-fill from profile
  useEffect(() => {
    if (!user) return;
    setEmail((prev) => prev || user.email || "");
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, city")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setName((p) => p || data.display_name || "");
        setPhone((p) => p || data.phone || "");
        setCity((p) => p || data.city || "");
      }
    })();
  }, [user]);

  const extras = useMemo(() => new Set(cfg?.extraFields ?? []), [cfg]);

  if (!cfg) return <Navigate to="/" replace />;

  // Auth gate
  if (!authLoading && !user) {
    const redirectTo = `/devenir-annonceur/${profile}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  const Icon = cfg.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = baseSchema.safeParse({
      name, email, phone, city,
      listing_type: listingType,
      main_category: mainCategory,
      message,
      business_name: businessName,
      neq_number: neq,
      profession,
      license_number: license,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    // Conditional required
    if (extras.has("business_name") && !parsed.data.business_name) {
      toast.error("Nom de l'entreprise requis");
      return;
    }
    if (extras.has("neq") && !parsed.data.neq_number) {
      toast.error("Numéro NEQ requis");
      return;
    }
    if (extras.has("profession") && !parsed.data.profession) {
      toast.error("Profession requise");
      return;
    }
    if (extras.has("license") && !parsed.data.license_number) {
      toast.error("Numéro de licence requis");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("seller_applications").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      listing_type: parsed.data.listing_type,
      user_id: user.id,
      advertiser_profile: PROFILE_TO_DB[profile as ProfileSlug],
      phone: parsed.data.phone,
      city: parsed.data.city,
      main_category: parsed.data.main_category,
      message: parsed.data.message,
      business_name: parsed.data.business_name || null,
      neq_number: parsed.data.neq_number || null,
      profession: parsed.data.profession || null,
      license_number: parsed.data.license_number || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'envoyer la demande. Réessayez.");
      return;
    }
    toast.success("Demande envoyée ! Notre équipe vous contactera bientôt.");
    setSubmitted(true);
  };

  return (
    <div className="container max-w-3xl py-10">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </Button>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="gradient-primary p-8 text-primary-foreground">
          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-foreground/15 mb-3`}>
            <Icon className="h-6 w-6" />
          </div>
          <Badge variant="secondary" className="mb-2">{cfg.badge}</Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Devenir {cfg.title}</h1>
          <p className="text-primary-foreground/90 text-sm md:text-base">{cfg.intro}</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 rounded-lg bg-secondary/40 border border-border p-4">
            <p className="text-sm font-semibold mb-2">Exigences pour ce profil :</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {cfg.requirements.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-success">✓</span> {r}
                </li>
              ))}
            </ul>
          </div>

          {submitted ? (
            <div className="text-center py-10">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="font-bold text-lg mb-2">Merci ! Demande envoyée</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Notre équipe examine votre profil <strong>{cfg.title}</strong> et vous
                contactera sous 24 h pour finaliser votre vérification.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="default"><Link to="/">Retour à l'accueil</Link></Button>
                <Button asChild variant="outline"><Link to="/tableau-de-bord">Mon espace</Link></Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Courriel *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} placeholder="514-555-1234" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required maxLength={100} placeholder="Montréal" />
                </div>
              </div>

              {extras.has("business_name") && (
                <div className="space-y-2">
                  <Label htmlFor="business">Nom de l'entreprise / raison sociale *</Label>
                  <Input id="business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required maxLength={150} />
                </div>
              )}

              {extras.has("neq") && (
                <div className="space-y-2">
                  <Label htmlFor="neq">Numéro NEQ (Registre des entreprises QC) *</Label>
                  <Input id="neq" value={neq} onChange={(e) => setNeq(e.target.value)} required maxLength={30} placeholder="1234567890" />
                </div>
              )}

              {extras.has("profession") && (
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession / corps de métier *</Label>
                  <Input id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} required maxLength={100} placeholder="Plombier, Médecin, Avocat…" />
                </div>
              )}

              {extras.has("license") && (
                <div className="space-y-2">
                  <Label htmlFor="license">Numéro de licence / membre d'ordre *</Label>
                  <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} required maxLength={60} placeholder="RBQ 1234-5678-90" />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ltype">Type d'annonce principal *</Label>
                  <Select value={listingType} onValueChange={setListingType} required>
                    <SelectTrigger id="ltype"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                    <SelectContent>
                      {cfg.listingTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat">Catégorie principale *</Label>
                  <Input id="cat" value={mainCategory} onChange={(e) => setMainCategory(e.target.value)} required maxLength={80} placeholder="Auto, Mode, Santé…" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="msg">Présentez-vous et décrivez ce que vous comptez vendre *</Label>
                <Textarea
                  id="msg" value={message} onChange={(e) => setMessage(e.target.value)}
                  required minLength={10} maxLength={2000} rows={5}
                  placeholder="Décrivez votre activité, les articles ou services prévus, le volume estimé, vos disponibilités…"
                />
                <p className="text-xs text-muted-foreground">{message.length}/2000</p>
              </div>

              <Button type="submit" variant="default" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Envoi…</> : "Envoyer ma demande"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                En soumettant, vous acceptez d'être recontacté par DealFlash et de
                fournir les pièces justificatives demandées pour la vérification.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
