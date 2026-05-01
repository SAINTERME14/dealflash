import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { useSellerVerification } from "@/hooks/useSellerVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  ShieldCheck,
  Upload,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ProfileType = Database["public"]["Enums"]["seller_profile_type"];
type DocType = Database["public"]["Enums"]["kyc_document_type"];

const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

const baseSchema = z.object({
  profile_type: z.enum(["individual", "self_employed", "corporation"]),
  legal_first_name: z.string().trim().min(2).max(100),
  legal_last_name: z.string().trim().min(2).max(100),
  legal_business_name: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  address_line1: z.string().trim().min(3).max(200),
  address_line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100),
  province: z.string().min(2).max(2),
  postal_code: z.string().trim().min(5).max(10),
  neq_number: z.string().trim().max(50).optional().or(z.literal("")),
  business_number: z.string().trim().max(50).optional().or(z.literal("")),
  gst_number: z.string().trim().max(50).optional().or(z.literal("")),
  qst_number: z.string().trim().max(50).optional().or(z.literal("")),
  consent_terms: z.boolean(),
  consent_data_processing: z.boolean(),
});

type FormState = z.infer<typeof baseSchema>;

interface RequiredDoc {
  type: DocType;
  label: string;
  description: string;
}

function getRequiredDocs(profile: ProfileType): RequiredDoc[] {
  const base: RequiredDoc[] = [
    { type: "gov_id_front", label: "Pièce d'identité (recto)", description: "Permis de conduire, passeport ou carte d'identité émise par le gouvernement" },
    { type: "gov_id_back", label: "Pièce d'identité (verso)", description: "Verso du même document" },
    { type: "selfie_with_id", label: "Selfie avec votre pièce d'identité", description: "Photo de vous tenant votre pièce d'identité visible à côté de votre visage" },
    { type: "proof_of_address", label: "Preuve d'adresse", description: "Facture de service public, relevé bancaire ou bail de moins de 3 mois" },
  ];
  if (profile === "self_employed") {
    base.push({
      type: "work_authorization",
      label: "Autorisation de travail",
      description: "Citoyenneté, résidence permanente ou permis de travail valide",
    });
  }
  if (profile === "corporation") {
    base.push(
      { type: "business_registration", label: "Certificat d'incorporation", description: "Document officiel d'enregistrement de l'entreprise" },
      { type: "tax_certificate_neq", label: "Attestation NEQ ou BN", description: "Numéro d'entreprise du Québec ou numéro fédéral" },
    );
  }
  return base;
}

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  submitted: { label: "Soumis", variant: "outline" },
  under_review: { label: "En cours d'examen", variant: "outline" },
  more_info_required: { label: "Informations requises", variant: "destructive" },
  approved: { label: "Approuvé", variant: "default" },
  rejected: { label: "Refusé", variant: "destructive" },
};

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

interface UploadedDoc {
  id: string;
  document_type: DocType;
  storage_path: string;
  file_name: string | null;
  status: "pending" | "accepted" | "rejected";
  review_note: string | null;
}

export default function SellerVerification() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { verification, refresh, isEditable } = useSellerVerification();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<DocType | null>(null);
  const [form, setForm] = useState<FormState>({
    profile_type: "individual",
    legal_first_name: "",
    legal_last_name: "",
    legal_business_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    province: "QC",
    postal_code: "",
    neq_number: "",
    business_number: "",
    gst_number: "",
    qst_number: "",
    consent_terms: false,
    consent_data_processing: false,
  });

  useEffect(() => {
    document.title = "Devenir vendeur professionnel — DealFlash";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Hydrate form from existing verification
  useEffect(() => {
    if (verification) {
      setForm({
        profile_type: verification.profile_type,
        legal_first_name: verification.legal_first_name ?? "",
        legal_last_name: verification.legal_last_name ?? "",
        legal_business_name: verification.legal_business_name ?? "",
        email: verification.email ?? user?.email ?? "",
        phone: verification.phone ?? "",
        address_line1: verification.address_line1 ?? "",
        address_line2: verification.address_line2 ?? "",
        city: verification.city ?? "",
        province: verification.province ?? "QC",
        postal_code: verification.postal_code ?? "",
        neq_number: verification.neq_number ?? "",
        business_number: verification.business_number ?? "",
        gst_number: verification.gst_number ?? "",
        qst_number: verification.qst_number ?? "",
        consent_terms: verification.consent_terms,
        consent_data_processing: verification.consent_data_processing,
      });
    } else if (user?.email) {
      setForm((f) => ({ ...f, email: user.email ?? "" }));
    }
  }, [verification, user]);

  // Load uploaded docs
  useEffect(() => {
    if (!verification) return;
    supabase
      .from("seller_verification_documents")
      .select("id, document_type, storage_path, file_name, status, review_note")
      .eq("verification_id", verification.id)
      .then(({ data }) => setDocs(data ?? []));
  }, [verification]);

  const requiredDocs = useMemo(() => getRequiredDocs(form.profile_type), [form.profile_type]);
  const docsByType = useMemo(() => {
    const map = new Map<DocType, UploadedDoc>();
    docs.forEach((d) => map.set(d.document_type, d));
    return map;
  }, [docs]);
  const allDocsUploaded = requiredDocs.every((d) => docsByType.has(d.type));

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const ensureVerificationRow = async (): Promise<string | null> => {
    if (!user) return null;
    if (verification) {
      // Update fields
      const { error } = await supabase
        .from("seller_verifications")
        .update({
          profile_type: form.profile_type,
          legal_first_name: form.legal_first_name || null,
          legal_last_name: form.legal_last_name || null,
          legal_business_name: form.legal_business_name || null,
          email: form.email,
          phone: form.phone || null,
          address_line1: form.address_line1 || null,
          address_line2: form.address_line2 || null,
          city: form.city || null,
          province: form.province || null,
          postal_code: form.postal_code || null,
          neq_number: form.neq_number || null,
          business_number: form.business_number || null,
          gst_number: form.gst_number || null,
          qst_number: form.qst_number || null,
          consent_terms: form.consent_terms,
          consent_data_processing: form.consent_data_processing,
        })
        .eq("id", verification.id);
      if (error) {
        toast.error("Échec de la sauvegarde");
        return null;
      }
      return verification.id;
    }
    // Create
    const { data, error } = await supabase
      .from("seller_verifications")
      .insert({
        user_id: user.id,
        profile_type: form.profile_type,
        email: form.email || user.email || "",
        legal_first_name: form.legal_first_name || null,
        legal_last_name: form.legal_last_name || null,
        legal_business_name: form.legal_business_name || null,
        phone: form.phone || null,
        address_line1: form.address_line1 || null,
        city: form.city || null,
        province: form.province || null,
        postal_code: form.postal_code || null,
        consent_terms: form.consent_terms,
        consent_data_processing: form.consent_data_processing,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Impossible de créer le dossier");
      return null;
    }
    await refresh();
    return data.id;
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    const id = await ensureVerificationRow();
    setSubmitting(false);
    if (id) toast.success("Brouillon enregistré");
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocType) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!ACCEPTED_MIME.includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WEBP ou PDF uniquement)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Fichier trop volumineux (max 8 Mo)");
      return;
    }
    setUploadingDoc(docType);
    const verifId = await ensureVerificationRow();
    if (!verifId) {
      setUploadingDoc(null);
      return;
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${verifId}/${docType}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (uploadErr) {
      toast.error("Échec du téléversement");
      setUploadingDoc(null);
      return;
    }

    // Replace any existing doc of same type
    const existing = docsByType.get(docType);
    if (existing) {
      await supabase.storage.from("kyc-documents").remove([existing.storage_path]);
      await supabase.from("seller_verification_documents").delete().eq("id", existing.id);
    }

    const { data, error } = await supabase
      .from("seller_verification_documents")
      .insert({
        verification_id: verifId,
        user_id: user.id,
        document_type: docType,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select("id, document_type, storage_path, file_name, status, review_note")
      .single();
    setUploadingDoc(null);
    if (error || !data) {
      toast.error("Échec de l'enregistrement du document");
      return;
    }
    setDocs((prev) => [...prev.filter((d) => d.document_type !== docType), data]);
    toast.success("Document téléversé");
  };

  const handleRemoveDoc = async (doc: UploadedDoc) => {
    await supabase.storage.from("kyc-documents").remove([doc.storage_path]);
    await supabase.from("seller_verification_documents").delete().eq("id", doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const handleSubmit = async () => {
    const parsed = baseSchema.safeParse(form);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first ?? "Formulaire invalide");
      return;
    }
    if (!form.consent_terms || !form.consent_data_processing) {
      toast.error("Veuillez accepter les conditions et le traitement des données");
      return;
    }
    if (!allDocsUploaded) {
      toast.error("Tous les documents requis doivent être téléversés");
      return;
    }

    setSubmitting(true);
    const id = await ensureVerificationRow();
    if (!id) {
      setSubmitting(false);
      return;
    }
    const { error } = await supabase
      .from("seller_verifications")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSubmitting(false);
    if (error) {
      toast.error("Échec de la soumission");
      return;
    }
    toast.success("Dossier soumis ! Notre équipe l'examinera sous 48 h.");
    refresh();
    setStep(1);
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Status banner if not editable
  const statusBadge = verification ? STATUS_LABEL[verification.status] : null;
  const showReadOnly = verification && !isEditable;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Devenir vendeur professionnel</h1>
        </div>
        <p className="text-muted-foreground">
          Pour publier des annonces, vous devez compléter cette vérification d'identité conforme aux
          exigences canadiennes et provinciales.
        </p>
        {statusBadge && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Statut :</span>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
        )}
      </header>

      {verification?.status === "rejected" && verification.rejection_reason && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dossier refusé</AlertTitle>
          <AlertDescription>{verification.rejection_reason}</AlertDescription>
        </Alert>
      )}

      {verification?.status === "more_info_required" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Informations supplémentaires requises</AlertTitle>
          <AlertDescription>
            {verification.internal_notes ?? "Veuillez compléter les informations ou documents demandés puis re-soumettre."}
          </AlertDescription>
        </Alert>
      )}

      {verification?.status === "approved" && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Compte vérifié</AlertTitle>
          <AlertDescription>
            Vous pouvez maintenant publier des annonces.{" "}
            <button
              type="button"
              className="underline font-medium"
              onClick={() => navigate("/vendre")}
            >
              Créer une annonce
            </button>
          </AlertDescription>
        </Alert>
      )}

      {(verification?.status === "submitted" || verification?.status === "under_review") && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Examen en cours</AlertTitle>
          <AlertDescription>
            Votre dossier est en cours d'examen. Nous vous recontacterons sous 48 h.
          </AlertDescription>
        </Alert>
      )}

      {/* Stepper */}
      {!showReadOnly && (
        <div className="flex items-center gap-2 text-sm">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(n)}
                className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {n}
              </button>
              {n < 4 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
          <span className="ml-3 text-muted-foreground">
            {step === 1 && "Type de profil"}
            {step === 2 && "Coordonnées"}
            {step === 3 && "Documents"}
            {step === 4 && "Récapitulatif"}
          </span>
        </div>
      )}

      <Card className="p-6 space-y-6">
        {/* STEP 1: profile type */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Quel type de vendeur êtes-vous ?</h2>
              <p className="text-sm text-muted-foreground">
                Cela détermine les documents que nous vous demanderons.
              </p>
            </div>
            <RadioGroup
              value={form.profile_type}
              onValueChange={(v) => update("profile_type", v as ProfileType)}
              disabled={!isEditable}
              className="space-y-3"
            >
              {[
                { v: "individual", title: "Particulier", desc: "Vente occasionnelle d'objets personnels" },
                { v: "self_employed", title: "Travailleur autonome", desc: "Services professionnels offerts à votre compte" },
                { v: "corporation", title: "Entreprise / personne morale", desc: "Société incorporée, OBNL ou autre entité légale" },
              ].map((opt) => (
                <Label
                  key={opt.v}
                  className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <RadioGroupItem value={opt.v} className="mt-1" />
                  <div>
                    <div className="font-medium">{opt.title}</div>
                    <div className="text-sm text-muted-foreground">{opt.desc}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!isEditable}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: contact info */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Coordonnées légales</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fname">Prénom légal *</Label>
                <Input
                  id="fname"
                  value={form.legal_first_name}
                  onChange={(e) => update("legal_first_name", e.target.value)}
                  disabled={!isEditable}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lname">Nom légal *</Label>
                <Input
                  id="lname"
                  value={form.legal_last_name}
                  onChange={(e) => update("legal_last_name", e.target.value)}
                  disabled={!isEditable}
                  maxLength={100}
                />
              </div>
              {form.profile_type === "corporation" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bname">Raison sociale *</Label>
                  <Input
                    id="bname"
                    value={form.legal_business_name ?? ""}
                    onChange={(e) => update("legal_business_name", e.target.value)}
                    disabled={!isEditable}
                    maxLength={200}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Courriel *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  disabled={!isEditable}
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  disabled={!isEditable}
                  placeholder="+1 514 555 0123"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addr1">Adresse *</Label>
                <Input
                  id="addr1"
                  value={form.address_line1}
                  onChange={(e) => update("address_line1", e.target.value)}
                  disabled={!isEditable}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addr2">Adresse (ligne 2)</Label>
                <Input
                  id="addr2"
                  value={form.address_line2 ?? ""}
                  onChange={(e) => update("address_line2", e.target.value)}
                  disabled={!isEditable}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  disabled={!isEditable}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prov">Province *</Label>
                <Select
                  value={form.province}
                  onValueChange={(v) => update("province", v)}
                  disabled={!isEditable}
                >
                  <SelectTrigger id="prov">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal">Code postal *</Label>
                <Input
                  id="postal"
                  value={form.postal_code}
                  onChange={(e) => update("postal_code", e.target.value.toUpperCase())}
                  disabled={!isEditable}
                  maxLength={10}
                  placeholder="H2X 1Y4"
                />
              </div>
            </div>

            {(form.profile_type === "self_employed" || form.profile_type === "corporation") && (
              <div className="pt-4 border-t border-border space-y-4">
                <h3 className="font-medium">Identifiants fiscaux</h3>
                <p className="text-sm text-muted-foreground">
                  Renseignez ceux qui s'appliquent à votre situation.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="neq">NEQ (Québec)</Label>
                    <Input
                      id="neq"
                      value={form.neq_number ?? ""}
                      onChange={(e) => update("neq_number", e.target.value)}
                      disabled={!isEditable}
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bn">Numéro d'entreprise (BN)</Label>
                    <Input
                      id="bn"
                      value={form.business_number ?? ""}
                      onChange={(e) => update("business_number", e.target.value)}
                      disabled={!isEditable}
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst">Numéro TPS</Label>
                    <Input
                      id="gst"
                      value={form.gst_number ?? ""}
                      onChange={(e) => update("gst_number", e.target.value)}
                      disabled={!isEditable}
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qst">Numéro TVQ</Label>
                    <Input
                      id="qst"
                      value={form.qst_number ?? ""}
                      onChange={(e) => update("qst_number", e.target.value)}
                      disabled={!isEditable}
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft} disabled={submitting || !isEditable}>
                  Enregistrer
                </Button>
                <Button onClick={() => setStep(3)} disabled={!isEditable}>
                  Continuer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: documents */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Documents requis</h2>
              <p className="text-sm text-muted-foreground">
                Formats acceptés : JPG, PNG, WEBP ou PDF (max 8 Mo). Vos documents sont stockés de
                façon chiffrée et ne sont visibles que par notre équipe d'examen.
              </p>
            </div>

            <div className="space-y-3">
              {requiredDocs.map((d) => {
                const uploaded = docsByType.get(d.type);
                return (
                  <div
                    key={d.type}
                    className="rounded-lg border border-border p-4 flex items-start gap-4"
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        uploaded
                          ? uploaded.status === "rejected"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {uploaded ? (
                        uploaded.status === "rejected" ? (
                          <X className="h-5 w-5" />
                        ) : (
                          <FileCheck2 className="h-5 w-5" />
                        )
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{d.label}</span>
                        {uploaded?.status === "accepted" && (
                          <Badge variant="default">Accepté</Badge>
                        )}
                        {uploaded?.status === "rejected" && (
                          <Badge variant="destructive">Rejeté</Badge>
                        )}
                        {uploaded?.status === "pending" && (
                          <Badge variant="secondary">En attente</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{d.description}</p>
                      {uploaded?.file_name && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          📎 {uploaded.file_name}
                        </p>
                      )}
                      {uploaded?.review_note && (
                        <p className="text-xs text-destructive mt-1">{uploaded.review_note}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <input
                        type="file"
                        id={`file-${d.type}`}
                        className="hidden"
                        accept={ACCEPTED_MIME.join(",")}
                        onChange={(e) => handleUploadDoc(e, d.type)}
                        disabled={!isEditable}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant={uploaded ? "outline" : "default"}
                        onClick={() => document.getElementById(`file-${d.type}`)?.click()}
                        disabled={!isEditable || uploadingDoc === d.type}
                      >
                        {uploadingDoc === d.type ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : uploaded ? (
                          "Remplacer"
                        ) : (
                          "Téléverser"
                        )}
                      </Button>
                      {uploaded && uploaded.status !== "accepted" && isEditable && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveDoc(uploaded)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button onClick={() => setStep(4)} disabled={!allDocsUploaded}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: review and submit */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Récapitulatif et consentement</h2>

            <div className="rounded-lg border border-border p-4 text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Profil :</span>{" "}
                <span className="font-medium">
                  {form.profile_type === "individual" && "Particulier"}
                  {form.profile_type === "self_employed" && "Travailleur autonome"}
                  {form.profile_type === "corporation" && "Entreprise"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Nom :</span>{" "}
                <span className="font-medium">
                  {form.legal_first_name} {form.legal_last_name}
                </span>
              </div>
              {form.legal_business_name && (
                <div>
                  <span className="text-muted-foreground">Entreprise :</span>{" "}
                  <span className="font-medium">{form.legal_business_name}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Adresse :</span>{" "}
                <span className="font-medium">
                  {form.address_line1}, {form.city}, {form.province} {form.postal_code}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Documents :</span>{" "}
                <span className="font-medium">
                  {docs.length} / {requiredDocs.length} téléversés
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={form.consent_terms}
                  onCheckedChange={(v) => update("consent_terms", v === true)}
                  disabled={!isEditable}
                />
                <span className="text-sm leading-relaxed">
                  J'accepte les conditions d'utilisation de DealFlash et certifie que les
                  informations et documents fournis sont exacts et authentiques.
                </span>
              </Label>
              <Label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={form.consent_data_processing}
                  onCheckedChange={(v) => update("consent_data_processing", v === true)}
                  disabled={!isEditable}
                />
                <span className="text-sm leading-relaxed">
                  J'autorise DealFlash à conserver et traiter mes données personnelles aux fins de
                  vérification d'identité, conformément à la Loi 25 (Québec) et à la LPRPDE.
                </span>
              </Label>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !isEditable ||
                  !form.consent_terms ||
                  !form.consent_data_processing ||
                  !allDocsUploaded
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  "Soumettre pour examen"
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
