import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Verification = Database["public"]["Tables"]["seller_verifications"]["Row"];
type Doc = Database["public"]["Tables"]["seller_verification_documents"]["Row"];
type Status = Database["public"]["Enums"]["seller_verification_status"];

const STATUS_LABEL: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  submitted: { label: "Soumis", variant: "outline" },
  under_review: { label: "En examen", variant: "outline" },
  more_info_required: { label: "Info requise", variant: "destructive" },
  approved: { label: "Approuvé", variant: "default" },
  rejected: { label: "Refusé", variant: "destructive" },
};

const DOC_LABEL: Record<string, string> = {
  gov_id_front: "Pièce d'identité (recto)",
  gov_id_back: "Pièce d'identité (verso)",
  selfie_with_id: "Selfie avec pièce",
  proof_of_address: "Preuve d'adresse",
  business_registration: "Certificat d'incorporation",
  tax_certificate_neq: "NEQ / BN",
  tax_certificate_bn: "Numéro d'entreprise",
  tax_certificate_gst_qst: "TPS / TVQ",
  work_authorization: "Autorisation de travail",
  professional_license: "Licence professionnelle",
  other: "Autre",
};

const PROFILE_LABEL = {
  individual: "Particulier",
  self_employed: "Travailleur autonome",
  corporation: "Entreprise",
};

export default function AdminVerificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    document.title = "Détail vérification — Admin";
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: v }, { data: d }] = await Promise.all([
        supabase.from("seller_verifications").select("*").eq("id", id).maybeSingle(),
        supabase.from("seller_verification_documents").select("*").eq("verification_id", id),
      ]);
      if (cancelled) return;
      setVerification(v);
      setDocs(d ?? []);
      setInternalNotes(v?.internal_notes ?? "");
      setRejectionReason(v?.rejection_reason ?? "");

      // Generate signed URLs for each doc (1h)
      if (d && d.length) {
        const urls: Record<string, string> = {};
        await Promise.all(
          d.map(async (doc) => {
            const { data: signed } = await supabase.storage
              .from("kyc-documents")
              .createSignedUrl(doc.storage_path, 3600);
            if (signed?.signedUrl) urls[doc.id] = signed.signedUrl;
          }),
        );
        if (!cancelled) setDocUrls(urls);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateStatus = async (newStatus: Status) => {
    if (!verification) return;
    if (newStatus === "rejected" && !rejectionReason.trim()) {
      toast.error("Veuillez indiquer la raison du refus");
      return;
    }
    if (newStatus === "more_info_required" && !internalNotes.trim()) {
      toast.error("Veuillez préciser les informations manquantes");
      return;
    }

    setActing(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("seller_verifications")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
        internal_notes: internalNotes || null,
        rejection_reason: newStatus === "rejected" ? rejectionReason : null,
      })
      .eq("id", verification.id);
    setActing(false);
    if (error) {
      toast.error("Échec de la mise à jour");
      return;
    }
    toast.success("Statut mis à jour");
    setVerification({ ...verification, status: newStatus });
  };

  const updateDocStatus = async (doc: Doc, status: "accepted" | "rejected", note?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("seller_verification_documents")
      .update({
        status,
        review_note: note ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq("id", doc.id);
    if (error) {
      toast.error("Échec");
      return;
    }
    setDocs((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status, review_note: note ?? null } : d)),
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!verification) {
    return (
      <AdminLayout>
        <Card className="p-8 text-center text-muted-foreground">Dossier introuvable.</Card>
      </AdminLayout>
    );
  }

  const status = STATUS_LABEL[verification.status];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/verifications">
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>

        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">
              {verification.legal_first_name || verification.legal_business_name}{" "}
              {verification.legal_last_name ?? ""}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline">{PROFILE_LABEL[verification.profile_type]}</Badge>
              {verification.submitted_at && (
                <span className="text-sm text-muted-foreground">
                  Soumis le {new Date(verification.submitted_at).toLocaleString("fr-CA")}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Coordonnées */}
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Coordonnées
            </h2>
            <Separator />
            <dl className="space-y-2 text-sm">
              <Field label="Courriel" value={verification.email} />
              <Field label="Téléphone" value={verification.phone} />
              <Field
                label="Adresse"
                value={[
                  verification.address_line1,
                  verification.address_line2,
                  verification.city,
                  verification.province,
                  verification.postal_code,
                ].filter(Boolean).join(", ")}
              />
              {verification.legal_business_name && (
                <Field label="Raison sociale" value={verification.legal_business_name} />
              )}
            </dl>
          </Card>

          {/* Identifiants fiscaux */}
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold">Identifiants fiscaux</h2>
            <Separator />
            <dl className="space-y-2 text-sm">
              <Field label="NEQ" value={verification.neq_number} />
              <Field label="BN (fédéral)" value={verification.business_number} />
              <Field label="TPS" value={verification.gst_number} />
              <Field label="TVQ" value={verification.qst_number} />
            </dl>
          </Card>
        </div>

        {/* Documents */}
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Documents ({docs.length})</h2>
          <Separator />
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun document téléversé.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {docs.map((doc) => (
                <div key={doc.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{DOC_LABEL[doc.document_type]}</span>
                    <Badge
                      variant={
                        doc.status === "accepted"
                          ? "default"
                          : doc.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {doc.status === "accepted" && "Accepté"}
                      {doc.status === "rejected" && "Rejeté"}
                      {doc.status === "pending" && "En attente"}
                    </Badge>
                  </div>
                  {doc.file_name && (
                    <div className="text-xs text-muted-foreground truncate">📎 {doc.file_name}</div>
                  )}
                  <div className="flex gap-2">
                    {docUrls[doc.id] && (
                      <Button asChild size="sm" variant="outline">
                        <a href={docUrls[doc.id]} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          Voir
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateDocStatus(doc, "accepted")}
                      disabled={doc.status === "accepted"}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const note = window.prompt("Raison du rejet :", doc.review_note ?? "");
                        if (note !== null) updateDocStatus(doc, "rejected", note);
                      }}
                      disabled={doc.status === "rejected"}
                    >
                      <XCircle className="h-3 w-3" />
                      Rejeter
                    </Button>
                  </div>
                  {doc.review_note && (
                    <p className="text-xs text-destructive">{doc.review_note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Decision */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Décision</h2>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes / informations à demander</Label>
            <Textarea
              id="notes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              placeholder="Visible par le vendeur si vous demandez plus d'infos."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reject">Raison du refus (si applicable)</Label>
            <Textarea
              id="reject"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => updateStatus("under_review")}
              disabled={acting || verification.status === "under_review"}
            >
              Marquer en examen
            </Button>
            <Button
              variant="outline"
              onClick={() => updateStatus("more_info_required")}
              disabled={acting}
            >
              <AlertCircle className="h-4 w-4" />
              Demander des infos
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateStatus("rejected")}
              disabled={acting}
            >
              <XCircle className="h-4 w-4" />
              Refuser
            </Button>
            <Button onClick={() => updateStatus("approved")} disabled={acting}>
              <CheckCircle2 className="h-4 w-4" />
              Approuver
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="font-medium text-right break-all">{value || "—"}</dd>
    </div>
  );
}
