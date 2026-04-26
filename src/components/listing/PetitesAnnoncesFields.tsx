import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type PetitesAnnoncesSubSlug = "autos-occasion" | "colocation-pa" | "objets-divers";

export interface PetitesAnnoncesAttributes {
  // Autos d'occasion
  year?: string;
  mileage_km?: string;
  transmission?: string;
  fuel?: string;
  vin?: string;
  // Colocation
  budget_max?: string;
  room_type?: string;
  available_from?: string;
  furnished?: string;
  // Objets divers
  condition?: string;
  brand?: string;
}

interface Props {
  subSlug: PetitesAnnoncesSubSlug;
  values: PetitesAnnoncesAttributes;
  onChange: (next: PetitesAnnoncesAttributes) => void;
}

export function PetitesAnnoncesFields({ subSlug, values, onChange }: Props) {
  const set = (patch: Partial<PetitesAnnoncesAttributes>) => onChange({ ...values, ...patch });

  if (subSlug === "autos-occasion") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="year">Année *</Label>
            <Input
              id="year"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              placeholder="2020"
              value={values.year ?? ""}
              onChange={(e) => set({ year: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="mileage_km">Kilométrage (km) *</Label>
            <Input
              id="mileage_km"
              type="number"
              min="0"
              placeholder="45000"
              value={values.mileage_km ?? ""}
              onChange={(e) => set({ mileage_km: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="transmission">Transmission</Label>
            <Select value={values.transmission ?? ""} onValueChange={(v) => set({ transmission: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuelle</SelectItem>
                <SelectItem value="automatic">Automatique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fuel">Carburant</Label>
            <Select value={values.fuel ?? ""} onValueChange={(v) => set({ fuel: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gasoline">Essence</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="hybrid">Hybride</SelectItem>
                <SelectItem value="electric">Électrique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="vin">VIN (optionnel)</Label>
          <Input
            id="vin"
            maxLength={17}
            placeholder="1HGBH41JXMN109186"
            value={values.vin ?? ""}
            onChange={(e) => set({ vin: e.target.value.toUpperCase() })}
          />
        </div>
      </div>
    );
  }

  if (subSlug === "colocation-pa") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="budget_max">Budget max / mois (CAD) *</Label>
            <Input
              id="budget_max"
              type="number"
              min="0"
              step="0.01"
              placeholder="800"
              value={values.budget_max ?? ""}
              onChange={(e) => set({ budget_max: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="room_type">Type de chambre *</Label>
            <Select value={values.room_type ?? ""} onValueChange={(v) => set({ room_type: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privée</SelectItem>
                <SelectItem value="shared">Partagée</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="available_from">Disponible à partir du</Label>
            <Input
              id="available_from"
              type="date"
              value={values.available_from ?? ""}
              onChange={(e) => set({ available_from: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="furnished">Meublé</Label>
            <Select value={values.furnished ?? ""} onValueChange={(v) => set({ furnished: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Oui</SelectItem>
                <SelectItem value="no">Non</SelectItem>
                <SelectItem value="partial">Partiellement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  // objets-divers
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="condition">État *</Label>
          <Select value={values.condition ?? ""} onValueChange={(v) => set({ condition: v })}>
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Neuf</SelectItem>
              <SelectItem value="like_new">Comme neuf</SelectItem>
              <SelectItem value="good">Bon état</SelectItem>
              <SelectItem value="fair">État moyen</SelectItem>
              <SelectItem value="for_parts">Pour pièces</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="brand">Marque (optionnel)</Label>
          <Input
            id="brand"
            placeholder="Ex : Ikea, Sony..."
            value={values.brand ?? ""}
            onChange={(e) => set({ brand: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
