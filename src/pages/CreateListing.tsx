import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Category { id: string; name: string; }

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { request: requestGeo, loading: geoLoading } = useGeolocation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    city: "",
    region: "QC",
    address: "",
    allows_booking: false,
  });

  const handleUseLocation = async () => {
    try {
      const pos = await requestGeo();
      setCoords({ lat: pos.lat, lng: pos.lng });
      toast.success("Position enregistrée pour cette annonce");
    } catch {
      toast.error("Impossible d'obtenir votre position");
    }
  };

  useEffect(() => {
    document.title = "Publier une annonce — DealFlash";
    supabase.from("categories").select("id, name").eq("is_active", true).order("display_order")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(e.target.files).slice(0, 8 - images.length)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("listings").upload(path, file);
      if (error) {
        toast.error(`Erreur upload : ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("listings").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setImages([...images, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (idx: number) => setImages(images.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'active') => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.description || !form.price || !form.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("listings").insert({
      seller_id: user.id,
      category_id: form.category_id,
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
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-border group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth" aria-label="Retirer">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 8 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 cursor-pointer transition-smooth">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground">Ajouter</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </div>
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
