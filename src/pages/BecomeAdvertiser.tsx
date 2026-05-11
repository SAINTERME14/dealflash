import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, ArrowLeft, User, Briefcase, Store, BadgeCheck,
  Sparkles, AlertTriangle, RefreshCw,
} from "lucide-react";
import { AdvertiserUploader } from "@/components/upload/AdvertiserUploader";

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
    badge: "1️⃣ PARTICULIERS",
    intro: "Vendez vos articles, meubles, autos, prestations ponctuelles ou louez votre logement entre particuliers.",
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
    needsDocs: false,
  },
  "pro-occasionnel": {
    title: "Vendeur professionnel occasionnel",
    icon: Briefcase,
    badge: "2️⃣ PRO OCCASIONNEL",
    intro: "Un seul article ou service à proposer ? Format identique aux particuliers, mais vous devez révéler votre statut professionnel.",
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
    needsDocs: false,
  },
  "commerce": {
    title: "Commerce ou service multi-articles",
    icon: Store,
    badge: "3️⃣ COMMERCES & SERVICES",
    intro: "Lancez des campagnes d'articles multiples, des ventes FLASH (rabais minimum 10 %) et synchronisez votre calendrier de rendez-vous.",
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
    needsDocs: true,
  },
  "pro-reglemente": {
    title: "Professionnel réglementé",
    icon: BadgeCheck,
    badge: "4️⃣ PROFESSIONNEL RÉGLEMENTÉ",
    intro: "Médecins, avocats, plombiers, électriciens, esthéticiennes, etc. Affichez vos prix du marché et vos prix promotionnels avec une licence vérifiée.",
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
    needsDocs: true,
  },
} as const;

const baseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(100),
  listing_type: z.enum(["product", "vehicle", "rental", "hotel", "service"]),
  main_category: z.string().trim().min(2).max(80),
  message: z.string().trim().min(40, "Description trop courte (min 40 caractères)").max(2000),
  business_name: z.string().trim().max(150).optional().or(z.literal("")),
  neq_number: z.string().trim().max(30).optional().or(z.literal("")),
  profession: z.string().trim().max(100).optional().or(z.literal("")),
  license_number: z.string().trim().max(60).optional().or(z.literal("")),
});

interface AiReview {
  decision: "accept" | "needs_more" | "reject";
  summary: string;
  description_score: number;
  description_rewrite?: string;
  photo_issues?: string[];
  document_issues?: string[];
  missing_items?: string[];
  action_items: string[];
}

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);
  const [aiReview, setAiReview] = useState<AiReview | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [finalStatus, setFinalStatus] = useState<string | null>(null);

  useEffect(() => { if (cfg) document.title = `Devenir ${cfg.title} — Boardeal`; }, [cfg]);

  useEffect(() => {
    if (!user) return;
    setEmail((p) => p || user.email || "");
    (async () => {
      const { data } = await supabase
        .from("profiles").select("display_name, phone, city")
        .eq("user_id", user.id).maybeSingle();
      if (data) {
        setName((p) => p || data.display_name || "");
        setPhone((p) => p || data.phone || "");
        setCity((p) => p || data.city || "");
      }
    })();
  }, [user]);

  const extras = useMemo(() => new Set(cfg?.extraFields ?? []), [cfg]);

  if (!cfg) return <Navigate to="/" replace />;
  if (!authLoading && !user) {
    const redirectTo = `/devenir-annonceur/${profile}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  const Icon = cfg.icon;

  const validate = () => {
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
      return null;
    }
    if (extras.has("business_name") && !parsed.data.business_name) { toast.error("Nom de l'entreprise requis"); return null; }
    if (extras.has("neq") && !parsed.data.neq_number) { toast.error("Numéro NEQ requis"); return null; }
    if (extras.has("profession") && !parsed.data.profession) { toast.error("Profession requise"); return null; }
    if (extras.has("license") && !parsed.data.license_number) { toast.error("Numéro de licence requis"); return null; }
    if (photos.length < 1) { toast.error("Au moins 1 photo requise"); return null; }
    if (cfg.needsDocs && documents.length < 1) { toast.error("Au moins 1 document de vérification requis"); return null; }
    return parsed.data;
  };

  const upsertApplication = async (data: z.infer<typeof baseSchema>) => {
    if (!user) return null;
    const payload = {
      name: data.name,
      full_name: data.name,
      shop_name: data.business_name || data.name,
      email: data.email,
      listing_type: data.listing_type,
      user_id: user.id,
      advertiser_profile: PROFILE_TO_DB[profile as ProfileSlug],
      phone: data.phone,
      city: data.city,
      main_category: data.main_category,
      message: data.message,
      business_name: data.business_name || null,
      neq_number: data.neq_number || null,
      profession: data.profession || null,
      license_number: data.license_number || null,
      photos,
      documents,
    };
    if (appId) {
      const { error } = await supabase.from("seller_applications").update(payload).eq("id", appId);
      if (error) { toast.error("Mise à jour impossible"); return null; }
      return appId;
    }
    const { data: ins, error } = await supabase
      .from("seller_applications").insert(payload).select("id").single();
    if (error || !ins) { toast.error("Envoi impossible"); return null; }
    setAppId(ins.id);
    return ins.id;
  };

  const runAI = async (id: string) => {
    setAiBusy(true);
    const { data, error } = await supabase.functions.invoke("review-application", {
      body: { application_id: id },
    });
    setAiBusy(false);
    if (error) {
      const msg = (error as { message?: string }).message ?? "";
      if (msg.includes("MAX_ATTEMPTS")) {
        toast.warning("Limite atteinte. Votre dossier passe en revue manuelle.");
        setFinalStatus("suspended");
        return;
      }
      toast.error("Analyse IA indisponible.");
      return;
    }
    if (data?.review) {
      setAiReview(data.review as AiReview);
      setAttempts(data.attempts ?? 0);
      setFinalStatus(data.status ?? null);
      if (data.review.decision === "accept") {
        toast.success("Conforme ! Votre dossier passe en validation finale.");
      } else if (data.review.decision === "needs_more") {
        toast.info("Quelques ajustements à apporter (voir rapport ci-dessous).");
      } else {
        toast.warning("Non conforme. Voir détails du rapport.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const data = validate();
    if (!data) return;
    setSubmitting(true);
    const id = await upsertApplication(data);
    setSubmitting(false);
    if (id) await runAI(id);
  };

  const isFinal = finalStatus === "suspended" || aiReview?.decision === "accept";

  return (
    <div className="container max-w-3xl py-10">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </Button>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="gradient-primary p-8 text-primary-foreground">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-foreground/15 mb-3">
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
                <li key={r} className="flex gap-2"><span className="text-success">✓</span> {r}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Une assistance IA examinera votre dossier en direct (2 tentatives max avant revue humaine).
            </p>
          </div>

          {isFinal ? (
            <ResultPanel
              aiReview={aiReview}
              status={finalStatus}
              cfgTitle={cfg.title}
              attempts={attempts}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <Field id="name" label="Nom complet *" value={name} onChange={setName} max={100} />
                <Field id="email" label="Courriel *" type="email" value={email} onChange={setEmail} max={255} />
                <Field id="phone" label="Téléphone *" value={phone} onChange={setPhone} max={30} placeholder="514-555-1234" />
                <Field id="city" label="Ville *" value={city} onChange={setCity} max={100} placeholder="Montréal" />
              </div>

              {extras.has("business_name") && (
                <Field id="business" label="Nom de l'entreprise / raison sociale *" value={businessName} onChange={setBusinessName} max={150} />
              )}
              {extras.has("neq") && (
                <Field id="neq" label="Numéro NEQ *" value={neq} onChange={setNeq} max={30} placeholder="1234567890" />
              )}
              {extras.has("profession") && (
                <Field id="profession" label="Profession / corps de métier *" value={profession} onChange={setProfession} max={100} placeholder="Plombier, Médecin…" />
              )}
              {extras.has("license") && (
                <Field id="license" label="Numéro de licence / membre d'ordre *" value={license} onChange={setLicense} max={60} placeholder="RBQ 1234-5678-90" />
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
                <Field id="cat" label="Catégorie principale *" value={mainCategory} onChange={setMainCategory} max={80} placeholder="Auto, Mode, Santé…" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="msg">Description détaillée de votre offre *</Label>
                <Textarea
                  id="msg" value={message} onChange={(e) => setMessage(e.target.value)}
                  required minLength={40} maxLength={2000} rows={6}
                  placeholder="Décrivez clairement ce que vous vendez/louez/offrez : état, marque, dimensions, conditions, garanties, délais…"
                />
                <p className="text-xs text-muted-foreground">{message.length}/2000 (minimum 40)</p>
              </div>

              <AdvertiserUploader
                kind="photo"
                paths={photos}
                onChange={setPhotos}
                label="Photos de votre offre * (1 à 8)"
              />

              {cfg.needsDocs && (
                <AdvertiserUploader
                  kind="document"
                  paths={documents}
                  onChange={setDocuments}
                  label="Documents de vérification * (NEQ, licence, attestation…)"
                />
              )}

              {aiReview && aiReview.decision !== "accept" && (
                <AiReviewBlock review={aiReview} attempts={attempts} />
              )}

              <Button type="submit" variant="default" size="lg" className="w-full" disabled={submitting || aiBusy}>
                {submitting || aiBusy ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {aiBusy ? "Analyse IA en cours…" : "Envoi…"}</>
                ) : aiReview ? (
                  <><RefreshCw className="h-4 w-4 mr-2" /> Renvoyer pour nouvelle analyse ({attempts}/2)</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Soumettre pour analyse IA</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                En soumettant, vous acceptez d'être recontacté par Boardeal pour finaliser votre vérification.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, value, onChange, max, type = "text", placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; max: number;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required maxLength={max} placeholder={placeholder} />
    </div>
  );
}

function AiReviewBlock({ review, attempts }: { review: AiReview; attempts: number }) {
  return (
    <Card className="p-4 border-warning/40 bg-warning/5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-warning" />
        <p className="font-semibold text-sm">Rapport de l'assistante IA — tentative {attempts}/2</p>
        <Badge variant="outline" className="ml-auto">
          Description : {review.description_score}/10
        </Badge>
      </div>
      <p className="text-sm">{review.summary}</p>

      {review.action_items?.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1 inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> À corriger :
          </p>
          <ul className="text-sm space-y-1 list-disc pl-5">
            {review.action_items.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {review.description_rewrite && (
        <div>
          <p className="text-xs font-semibold mb-1">Suggestion de réécriture :</p>
          <p className="text-sm italic bg-background/80 rounded p-3 border">
            {review.description_rewrite}
          </p>
        </div>
      )}

      {(review.photo_issues?.length || 0) > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">Photos :</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-5">
            {review.photo_issues!.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {(review.document_issues?.length || 0) > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">Documents :</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-5">
            {review.document_issues!.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ResultPanel({
  aiReview, status, cfgTitle, attempts,
}: { aiReview: AiReview | null; status: string | null; cfgTitle: string; attempts: number }) {
  const accepted = aiReview?.decision === "accept";
  return (
    <div className="text-center py-8">
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full mb-4 ${
        accepted ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
      }`}>
        {accepted ? <CheckCircle2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
      </div>
      <h2 className="font-bold text-lg mb-2">
        {accepted
          ? "Dossier conforme ! Validation finale par notre équipe"
          : "Dossier transmis à notre équipe"}
      </h2>
      <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
        {accepted
          ? `Votre profil ${cfgTitle} a été validé par l'IA. Un membre de l'équipe finalise l'approbation sous 24 h.`
          : `Après ${attempts} tentative(s), votre dossier passe en revue manuelle. L'équipe vous écrira directement avec les corrections à apporter.`}
      </p>
      {aiReview && <AiReviewBlock review={aiReview} attempts={attempts} />}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <Button asChild variant="default"><Link to="/tableau-de-bord">Mon espace</Link></Button>
        <Button asChild variant="outline"><Link to="/">Retour à l'accueil</Link></Button>
      </div>
    </div>
  );
}
