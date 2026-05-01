import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { useSellerVerification } from "@/hooks/useSellerVerification";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Loader2 as Loader2Icon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";
import { BucketImageUploader } from "@/components/upload/BucketImageUploader";
import { PetitesAnnoncesFields, type PetitesAnnoncesAttributes, type PetitesAnnoncesSubSlug, type PetitesAnnoncesFieldErrors } from "@/components/listing/PetitesAnnoncesFields";
import { validatePetitesAnnonces } from "@/lib/petitesAnnoncesValidation";

interface Category { id: string; name: string; slug: string; parent_id: string | null; listing_type: string; }

const PETITES_ANNONCES_SLUG = "petites-annonces";
const PA_SUB_SLUGS: PetitesAnnoncesSubSlug[] = ["autos-occasion", "colocation-pa", "objets-divers"];

const PA_FIELD_ORDER: Record<PetitesAnnoncesSubSlug, string[]> = {
  "autos-occasion": ["year", "mileage_km", "transmission", "fuel", "vin"],
  "colocation-pa": ["budget_max", "room_type", "available_from", "furnished"],
  "objets-divers": ["condition", "brand"],
};

const PA_FIELD_LABELS: Record<string, string> = {
  year: "Année",
  mileage_km: "Kilométrage",
  transmission: "Transmission",
  fuel: "Carburant",
  vin: "VIN",
  budget_max: "Budget max",
  room_type: "Type de chambre",
  available_from: "Disponible à partir du",
  furnished: "Meublé",
  condition: "État",
  brand: "Marque",
};

const PA_LIVE_REGION_ID = "pa-errors-live";
const PA_SUMMARY_LIVE_REGION_ID = "pa-errors-summary-live";

function announcePaField(fieldId: string) {
  const region = document.getElementById(PA_LIVE_REGION_ID);
  if (!region) return;
  const label = PA_FIELD_LABELS[fieldId] ?? fieldId;
  // Reset then set so the same message re-triggers an SR announcement
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = `Champ en erreur : ${label}. Focus déplacé sur le champ.`;
  }, 50);
}

function focusPaField(fieldId: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof (el as HTMLElement).focus === "function") {
      try { (el as HTMLElement).focus({ preventScroll: true }); } catch { /* noop */ }
    }
    // Flash highlight: restart animation if class is already present
    const FLASH = "animate-field-flash";
    el.classList.remove(FLASH);
    // Force reflow so the animation can replay
    void (el as HTMLElement).offsetWidth;
    el.classList.add(FLASH);
    window.setTimeout(() => el.classList.remove(FLASH), 1300);
    // Screen-reader announcement
    announcePaField(fieldId);
  });
}

function scrollToFirstPaError(
  subSlug: PetitesAnnoncesSubSlug,
  fieldErrors: Record<string, string | undefined>,
) {
  const order = PA_FIELD_ORDER[subSlug];
  const firstKey = order.find((k) => fieldErrors[k]);
  if (firstKey) focusPaField(firstKey);
}

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canPublish, loading: verifLoading, verification } = useSellerVerification();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { request: requestGeo, loading: geoLoading } = useGeolocation();
  const [paAttributes, setPaAttributes] = useState<PetitesAnnoncesAttributes>({});
  const [paErrors, setPaErrors] = useState<PetitesAnnoncesFieldErrors>({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    subcategory_id: "",
    city: "",
    region: "QC",
    address: "",
    allows_booking: false,
    // Deal type (Point 2)
    deal_type: "standard" as "standard" | "flash" | "group_flash" | "prix_regulier",
    base_discount_percent: "",
    discount_cap_percent: "",
    ends_at: "",
    // Contact vendeur pour bon de commande (Point 1)
    seller_phone: "",
    seller_email: "",
    payment_methods: [] as string[],
    pickup_info: "",
    delivery_info: "",
  });

  useEffect(() => {
    document.title = "Publier une annonce — DealFlash";
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, listing_type")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  // Announce total Petites annonces error count to assistive tech on mount + on change
  useEffect(() => {
    const region = document.getElementById(PA_SUMMARY_LIVE_REGION_ID);
    if (!region) return;
    const count = Object.values(paErrors).filter(Boolean).length;
    let message = "";
    if (count === 0) {
      message = "Aucune erreur dans le formulaire Petites annonces.";
    } else if (count === 1) {
      message = "1 erreur à corriger dans le formulaire Petites annonces.";
    } else {
      message = `${count} erreurs à corriger dans le formulaire Petites annonces.`;
    }
    // Reset then set so SR re-announces even if message is identical
    region.textContent = "";
    const t = window.setTimeout(() => { region.textContent = message; }, 50);
    return () => window.clearTimeout(t);
  }, [paErrors]);

  const petitesAnnoncesParent = categories.find((c) => c.slug === PETITES_ANNONCES_SLUG && !c.parent_id);
  const isPetitesAnnonces = !!petitesAnnoncesParent && form.category_id === petitesAnnoncesParent.id;
  const paSubcategories = isPetitesAnnonces
    ? categories.filter((c) => c.parent_id === petitesAnnoncesParent!.id)
    : [];
  const selectedSub = paSubcategories.find((c) => c.id === form.subcategory_id);
  const selectedSubSlug = selectedSub && (PA_SUB_SLUGS as string[]).includes(selectedSub.slug)
    ? (selectedSub.slug as PetitesAnnoncesSubSlug)
    : null;

  // Top-level categories only for the main selector
  const topLevelCategories = categories.filter((c) => !c.parent_id);

  const handleUseLocation = async () => {
    try {
      const pos = await requestGeo();
      setCoords({ lat: pos.lat, lng: pos.lng });
      toast.success("Position enregistrée pour cette annonce");
    } catch {
      toast.error("Impossible d'obtenir votre position");
    }
  };

  // Block listing creation if not verified (admins bypass)
  if (verifLoading || adminLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !canPublish) {
    return (
      <div className="container max-w-2xl py-10 space-y-4">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Vérification requise</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Pour publier des annonces sur DealFlash, vous devez d'abord compléter votre dossier
              de vérification d'identité conforme aux exigences canadiennes.
            </p>
            <Button asChild>
              <Link to="/devenir-vendeur">
                {verification ? "Continuer mon dossier" : "Commencer la vérification"}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'active') => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.description || !form.price || !form.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Prix : doit être un nombre positif valide
    const priceNum = parseFloat(form.price);
    if (!Number.isFinite(priceNum) || priceNum < 0 || priceNum > 10_000_000) {
      toast.error("Prix invalide");
      return;
    }

    // Petites annonces : sous-catégorie obligatoire + validation Zod stricte
    let attributes: Record<string, string> = {};
    const listingType = selectedSub?.listing_type ?? topLevelCategories.find((c) => c.id === form.category_id)?.listing_type ?? "product";
    if (isPetitesAnnonces) {
      if (!form.subcategory_id || !selectedSubSlug) {
        toast.error("Veuillez choisir une sous-catégorie");
        requestAnimationFrame(() => {
          document.getElementById("subcategory")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return;
      }
      const result = validatePetitesAnnonces(selectedSubSlug, paAttributes as Record<string, unknown>);
      if (result.ok === false) {
        setPaErrors(result.fieldErrors);
        toast.error(result.error);
        scrollToFirstPaError(selectedSubSlug, result.fieldErrors);
        return;
      }
      setPaErrors({});
      attributes = result.data;
    }

    const isRabais = form.deal_type !== "prix_regulier";
    const paymentMethodsArr = form.payment_methods.filter(Boolean);

    setLoading(true);
    const { data, error } = await supabase.from("listings").insert({
      seller_id: user.id,
      category_id: form.category_id,
      subcategory_id: form.subcategory_id || null,
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      city: form.city || null,
      region: form.region || null,
      address: form.address || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      images,
      allows_booking: form.allows_booking,
      attributes: attributes as Record<string, string>,
      listing_type: listingType as "product" | "vehicle" | "rental" | "hotel" | "service",
      status,
      // Champs deal type (Point 2)
      deal_type: form.deal_type,
      base_discount_percent: isRabais && form.base_discount_percent ? parseFloat(form.base_discount_percent) : null,
      discount_cap_percent: isRabais && form.discount_cap_percent ? parseFloat(form.discount_cap_percent) : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      // Infos contact vendeur pour bon de commande (Point 1)
      seller_phone: form.seller_phone || null,
      seller_email: form.seller_email || null,
      payment_methods: paymentMethodsArr,
      pickup_info: form.pickup_info || null,
      delivery_info: form.delivery_info || null,
    }).select("id").single();
    setLoading(false);

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(status === 'active' ? "Annonce publiée !" : "Brouillon enregistré");
      navigate(`/annonce/${data.id}`);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-2">Publier une annonce</h1>
      <p className="text-muted-foreground mb-8">Décrivez votre article ou service en quelques étapes.</p>

      <form className="space-y-6">
        {/* Polite live region for screen readers when user activates "Corriger maintenant" */}
        <div
          id={PA_LIVE_REGION_ID}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        {/* Polite live region announcing the total number of Petites annonces errors */}
        <div
          id={PA_SUMMARY_LIVE_REGION_ID}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        {selectedSubSlug && Object.keys(paErrors).length > 0 && (() => {
          const order = PA_FIELD_ORDER[selectedSubSlug];
          const orderedErrors = order
            .filter((k) => paErrors[k as keyof typeof paErrors])
            .map((k) => ({ key: k, message: paErrors[k as keyof typeof paErrors] as string }));
          if (orderedErrors.length === 0) return null;
          return (
            <Alert variant="destructive" role="alert" aria-live="polite">
              <AlertTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {orderedErrors.length === 1
                    ? "1 champ à corriger"
                    : `${orderedErrors.length} champs à corriger`}
                </span>
                <button
                  type="button"
                  onClick={() => focusPaField(orderedErrors[0].key)}
                  aria-label={`Voir les ${orderedErrors.length} ${orderedErrors.length === 1 ? "erreur" : "erreurs"} Petites annonces et aller au premier champ en erreur : ${PA_FIELD_LABELS[orderedErrors[0].key] ?? orderedErrors[0].key}`}
                  className="text-sm font-medium underline underline-offset-2 hover:no-underline"
                >
                  Voir les erreurs ({orderedErrors.length})
                </button>
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {orderedErrors.map(({ key, message }) => (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => focusPaField(key)}
                        className="text-left underline underline-offset-2 hover:no-underline"
                      >
                        <span className="font-medium">{PA_FIELD_LABELS[key] ?? key}</span>
                        {" — "}
                        <span>{message}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="mt-3"
                  onClick={() => focusPaField(orderedErrors[0].key)}
                >
                  Corriger maintenant
                </Button>
              </AlertDescription>
            </Alert>
          );
        })()}
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">Titre de l'annonce *</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Honda Civic 2020 — 45 000 km" />
          </div>
          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => {
                setForm({ ...form, category_id: v, subcategory_id: "" });
                setPaAttributes({});
                setPaErrors({});
              }}
            >
              <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
              <SelectContent>
                {topLevelCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isPetitesAnnonces && (
            <div>
              <Label htmlFor="subcategory">Sous-catégorie *</Label>
              <Select
                value={form.subcategory_id}
                onValueChange={(v) => {
                  setForm({ ...form, subcategory_id: v });
                  setPaAttributes({});
                  setPaErrors({});
                }}
              >
                <SelectTrigger id="subcategory"><SelectValue placeholder="Auto, colocation, objet…" /></SelectTrigger>
                <SelectContent>
                  {paSubcategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedSubSlug && (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium mb-3">Détails spécifiques</p>
              <PetitesAnnoncesFields
                subSlug={selectedSubSlug}
                values={paAttributes}
                onChange={(next) => {
                  setPaAttributes(next);
                  if (Object.keys(paErrors).length > 0) setPaErrors({});
                }}
                errors={paErrors}
              />
            </div>
          )}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" rows={6} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décrivez votre article en détail…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Prix (CAD) *</Label>
              <Input id="price" type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Laval" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Adresse (optionnel)</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 rue Principale" />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleUseLocation} disabled={geoLoading} className="gap-2">
              {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {coords ? "Mettre à jour ma position" : "Utiliser ma position GPS"}
            </Button>
            {coords && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-accent" />
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Ajouter votre position GPS permet aux acheteurs de vous trouver sur la carte et de filtrer à proximité.
          </p>
        </Card>

        {/* ── Section : Type d'annonce (Point 2) ── */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="font-semibold mb-1">Type d'annonce</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Définit la structure de prix. Les points de fidélité ne s'appliquent
              <strong> jamais</strong> sur les annonces en rabais (anti-double-dipping).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { value: "standard", label: "Standard", desc: "Rabais fixe" },
                  { value: "flash", label: "Flash Deal", desc: "Durée & stock limités" },
                  { value: "group_flash", label: "Group-Flash", desc: "Rabais croissant" },
                  { value: "prix_regulier", label: "Prix régulier", desc: "Accepte les points" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, deal_type: opt.value })}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    form.deal_type === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {form.deal_type === "prix_regulier" && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Cette annonce accepte les <strong>points de fidélité DealFlash</strong> du vendeur.
                Aucun ticket de réservation requis. Les acheteurs paient directement au vendeur.
              </span>
            </div>
          )}

          {form.deal_type !== "prix_regulier" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="base_discount">Rabais de base (%)</Label>
                  <Input
                    id="base_discount"
                    type="number"
                    min="1"
                    max="99"
                    step="0.5"
                    placeholder="Ex : 20"
                    value={form.base_discount_percent}
                    onChange={(e) => setForm({ ...form, base_discount_percent: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="discount_cap">Plafond cumulé (%)</Label>
                  <Input
                    id="discount_cap"
                    type="number"
                    min="1"
                    max="99"
                    step="0.5"
                    placeholder="Ex : 35"
                    value={form.discount_cap_percent}
                    onChange={(e) => setForm({ ...form, discount_cap_percent: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Rabais max après bonus social + groupe
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="ends_at">Date de fin de l'annonce *</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Le ticket de réservation (2$) reste valide jusqu'à cette date.
                </p>
              </div>
            </>
          )}
        </Card>

        {/* ── Section : Contact vendeur (Point 1 — bon de commande) ── */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="font-semibold mb-1">Coordonnées de contact</h2>
            <p className="text-xs text-muted-foreground">
              Apparaissent sur le bon de commande signé remis à l'acheteur.
              Le paiement du produit se fait <strong>directement entre l'acheteur et vous</strong> —
              DealFlash est facilitateur et n'encaisse que le ticket (2$).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="seller_phone">Téléphone</Label>
              <Input
                id="seller_phone"
                type="tel"
                placeholder="514-XXX-XXXX"
                value={form.seller_phone}
                onChange={(e) => setForm({ ...form, seller_phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="seller_email">Courriel</Label>
              <Input
                id="seller_email"
                type="email"
                placeholder="vendeur@exemple.com"
                value={form.seller_email}
                onChange={(e) => setForm({ ...form, seller_email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Modes de paiement acceptés</Label>
            <div className="flex flex-wrap gap-2">
              {["Interac", "Virement", "Terminal", "Comptant", "PayPal", "Crypto"].map((m) => {
                const key = m.toLowerCase();
                const active = form.payment_methods.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        payment_methods: active
                          ? form.payment_methods.filter((x) => x !== key)
                          : [...form.payment_methods, key],
                      })
                    }
                    className={`rounded-full px-3 py-1 text-sm border transition-all ${
                      active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="pickup_info">Modalités de retrait (optionnel)</Label>
            <Input
              id="pickup_info"
              placeholder="Ex : sur rendez-vous du lundi au vendredi"
              value={form.pickup_info}
              onChange={(e) => setForm({ ...form, pickup_info: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="delivery_info">Modalités de livraison (optionnel)</Label>
            <Input
              id="delivery_info"
              placeholder="Ex : livraison locale 10$, Purolator disponible"
              value={form.delivery_info}
              onChange={(e) => setForm({ ...form, delivery_info: e.target.value })}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <Label>Photos (jusqu'à 8)</Label>
          {user && (
            <BucketImageUploader
              bucket="listings"
              userId={user.id}
              value={images}
              onChange={setImages}
              maxFiles={8}
            />
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="booking" className="cursor-pointer">Permettre la réservation de visites</Label>
              <p className="text-xs text-muted-foreground mt-1">Idéal pour logements, autos, motos, services.</p>
            </div>
            <Switch id="booking" checked={form.allows_booking} onCheckedChange={(v) => setForm({ ...form, allows_booking: v })} />
          </div>
          {form.allows_booking && (
            <p className="text-xs text-warning bg-warning/10 p-3 rounded-md">
              💡 Vous pourrez configurer vos créneaux de visite depuis votre tableau de bord après publication.
            </p>
          )}
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="button" onClick={(e) => handleSubmit(e, 'draft')} variant="outline" size="lg" className="flex-1" disabled={loading}>
            Enregistrer comme brouillon
          </Button>
          <Button type="button" onClick={(e) => handleSubmit(e, 'active')} variant="hero" size="lg" className="flex-1" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Publier l'annonce
          </Button>
        </div>
      </form>
    </div>
  );
}
