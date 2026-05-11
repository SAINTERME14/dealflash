import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/customClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, Store } from "lucide-react";

const LISTING_TYPES = [
  { value: "product", label: "Produit" },
  { value: "vehicle", label: "Véhicule" },
  { value: "rental", label: "Location" },
  { value: "hotel", label: "Hébergement" },
  { value: "service", label: "Service" },
] as const;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères" })
    .max(100, { message: "Le nom doit faire moins de 100 caractères" }),
  email: z
    .string()
    .trim()
    .email({ message: "Adresse courriel invalide" })
    .max(255, { message: "Le courriel doit faire moins de 255 caractères" }),
  listing_type: z.enum(["product", "vehicle", "rental", "hotel", "service"], {
    required_error: "Sélectionnez un type d'annonce",
  }),
});

export function SellerApplicationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [listingType, setListingType] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, listing_type: listingType });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first ?? "Formulaire invalide");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("seller_applications").insert({
      name: parsed.data.name,
      full_name: parsed.data.name,
      shop_name: parsed.data.name,
      email: parsed.data.email,
      city: "",
      listing_type: parsed.data.listing_type,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'envoyer la demande. Réessayez.");
      return;
    }

    toast.success("Demande envoyée ! Notre équipe vous contactera bientôt.");
    setSubmitted(true);
    setName("");
    setEmail("");
    setListingType("");
  };

  return (
    <section className="container py-16">
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="grid md:grid-cols-[1fr_1.2fr]">
          {/* Left visual panel */}
          <div className="gradient-primary p-8 md:p-10 text-primary-foreground flex flex-col justify-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/15 mb-4">
              <Store className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="w-fit mb-3">
              Devenir vendeur
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Lancez-vous en 30 secondes
            </h2>
            <p className="text-primary-foreground/90 text-sm md:text-base leading-relaxed">
              Laissez vos coordonnées : un membre de l'équipe Boardeal vous accompagne
              pour publier votre première annonce.
            </p>
            <div className="mt-6 space-y-2 text-sm text-primary-foreground/90">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Aucune carte requise
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Réponse sous 24 h
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 md:p-10">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success mb-4">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">Merci pour votre intérêt !</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Votre demande a bien été transmise au backoffice. Nous reviendrons
                  vers vous très bientôt.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Envoyer une autre demande
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seller-name">Nom complet</Label>
                  <Input
                    id="seller-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Tremblay"
                    maxLength={100}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seller-email">Courriel</Label>
                  <Input
                    id="seller-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    maxLength={255}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seller-type">Type d'annonce</Label>
                  <Select
                    value={listingType}
                    onValueChange={setListingType}
                    disabled={submitting}
                  >
                    <SelectTrigger id="seller-type">
                      <SelectValue placeholder="Choisir un type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {LISTING_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    "Envoyer ma demande"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  En soumettant, vous acceptez d'être recontacté par Boardeal.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
