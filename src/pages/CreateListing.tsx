import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSellerVerification } from "@/hooks/useSellerVerification";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Loader2 as Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
        return;
      }
      const result = validatePetitesAnnonces(selectedSubSlug, paAttributes as Record<string, unknown>);
      if (result.ok === false) {
        setPaErrors(result.fieldErrors);
        toast.error(result.error);
        return;
      }
      setPaErrors({});
      attributes = result.data;
    }

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
                }}
              >
                <SelectTrigger><SelectValue placeholder="Auto, colocation, objet…" /></SelectTrigger>
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
                onChange={setPaAttributes}
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
