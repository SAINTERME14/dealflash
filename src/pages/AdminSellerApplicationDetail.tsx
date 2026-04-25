import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  StickyNote,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCanManageSellerNotes } from "@/hooks/useCanManageSellerNotes";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type ApplicationStatus = "new" | "contacted" | "approved" | "rejected";
type ListingType = "product" | "vehicle" | "rental" | "hotel" | "service";
type AppRole = "admin" | "vendeur_b2c" | "vendeur_c2c" | "acheteur";

interface Application {
  id: string;
  name: string;
  email: string;
  listing_type: ListingType;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditEntry {
  id: string;
  application_id: string;
  actor_id: string | null;
  actor_role: AppRole | null;
  action: string;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus | null;
  notes_changed: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<ListingType, string> = {
  product: "Produit",
  vehicle: "Véhicule",
  rental: "Location",
  hotel: "Hébergement",
  service: "Service",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const STATUS_VARIANTS: Record<ApplicationStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  contacted: "secondary",
  approved: "outline",
  rejected: "destructive",
};

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrateur",
  vendeur_b2c: "Vendeur pro",
  vendeur_c2c: "Vendeur particulier",
  acheteur: "Acheteur",
};

const ACTION_LABELS: Record<string, string> = {
  created: "Candidature reçue",
  status_changed: "Statut modifié",
  notes_updated: "Notes mises à jour",
};

const STATUS_ACTIONS: { value: ApplicationStatus; label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "outline" | "destructive" }[] = [
  { value: "contacted", label: "Marquer contacté", icon: Mail, variant: "secondary" },
  { value: "approved", label: "Approuver", icon: CheckCircle2, variant: "default" },
  { value: "rejected", label: "Rejeter", icon: XCircle, variant: "destructive" },
];

export default function AdminSellerApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManage } = useCanManageSellerNotes();
  const { isAdmin } = useIsAdmin();

  const [app, setApp] = useState<Application | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<ApplicationStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    document.title = "Admin · Détail candidature | DealFlash";
  }, []);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [appRes, auditRes] = await Promise.all([
      supabase.from("seller_applications").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("seller_application_audit_log")
        .select("*")
        .eq("application_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (appRes.error || !appRes.data) {
      toast.error("Candidature introuvable");
      navigate("/admin/demandes-vendeurs");
      return;
    }
    setApp(appRes.data as Application);
    setNotes(appRes.data.notes ?? "");
    setAudit((auditRes.data ?? []) as AuditEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const changeStatus = async (next: ApplicationStatus) => {
    if (!app || !canManage) return;
    if (next === app.status) return;
    setSavingStatus(next);
    const { error } = await supabase
      .from("seller_applications")
      .update({ status: next })
      .eq("id", app.id);
    setSavingStatus(null);
    if (error) {
      toast.error("Mise à jour impossible");
      return;
    }
    toast.success(`Statut mis à jour : ${STATUS_LABELS[next]}`);
    await load();
  };

  const saveNotes = async () => {
    if (!app || !canManage) return;
    setSavingNotes(true);
    const trimmed = notes.trim();
    const value = trimmed.length === 0 ? null : trimmed.slice(0, 2000);
    const { error } = await supabase
      .from("seller_applications")
      .update({ notes: value })
      .eq("id", app.id);
    setSavingNotes(false);
    if (error) {
      toast.error("Enregistrement impossible");
      return;
    }
    toast.success("Notes enregistrées");
    await load();
  };

  const remove = async () => {
    if (!app || !isAdmin) return;
    if (!confirm("Supprimer définitivement cette candidature ?")) return;
    const { error } = await supabase.from("seller_applications").delete().eq("id", app.id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    toast.success("Candidature supprimée");
    navigate("/admin/demandes-vendeurs");
  };

  if (loading || !app) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-1">
              <Link to="/admin/demandes-vendeurs">
                <ArrowLeft className="h-4 w-4" />
                Retour à la liste
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{app.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={STATUS_VARIANTS[app.status]}>{STATUS_LABELS[app.status]}</Badge>
              <Badge variant="outline">{TYPE_LABELS[app.listing_type]}</Badge>
              <span className="text-xs text-muted-foreground">
                Reçue le{" "}
                {new Date(app.created_at).toLocaleDateString("fr-CA", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={remove} className="text-destructive gap-1.5">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Contact card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Coordonnées du demandeur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${app.email}`} className="text-primary hover:underline">
                    {app.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Non renseigné dans le formulaire
                </div>
              </CardContent>
            </Card>

            {/* Status actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Changer le statut</CardTitle>
              </CardHeader>
              <CardContent>
                {!canManage ? (
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Vous n'êtes pas autorisé à modifier le statut.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {STATUS_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        const isCurrent = app.status === action.value;
                        const isSaving = savingStatus === action.value;
                        return (
                          <Button
                            key={action.value}
                            variant={isCurrent ? action.variant : "outline"}
                            disabled={isCurrent || savingStatus !== null}
                            onClick={() => changeStatus(action.value)}
                            className="gap-1.5 justify-start"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                            {action.label}
                            {isCurrent && (
                              <Badge variant="secondary" className="ml-auto text-[10px]">
                                actuel
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                    {app.status !== "new" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        disabled={savingStatus !== null}
                        onClick={() => changeStatus("new")}
                      >
                        Réinitialiser à « Nouveau »
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Internal notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes internes
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    Privé
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!canManage ? (
                  <div className="rounded-md border bg-muted/50 p-3 text-sm whitespace-pre-wrap min-h-[80px]">
                    {app.notes ?? (
                      <span className="text-muted-foreground italic">Aucune note pour le moment.</span>
                    )}
                  </div>
                ) : (
                  <>
                    <Label htmlFor="notes" className="sr-only">
                      Notes internes
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                      maxLength={2000}
                      placeholder="Ex. : déjà contacté par téléphone, profil intéressant pour B2C…"
                      disabled={savingNotes}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {notes.length} / 2000
                      </span>
                      <Button
                        size="sm"
                        onClick={saveNotes}
                        disabled={savingNotes || (notes ?? "") === (app.notes ?? "")}
                      >
                        {savingNotes ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enregistrement…
                          </>
                        ) : (
                          "Enregistrer les notes"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Audit timeline */}
          <Card className="self-start">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Historique des actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune action enregistrée.</p>
              ) : (
                <ol className="relative border-l border-border space-y-4 ml-2">
                  {audit.map((entry) => (
                    <li key={entry.id} className="ml-4">
                      <div className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="text-sm font-medium">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </div>
                      {entry.action === "status_changed" && (
                        <div className="text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                          {entry.old_status && (
                            <Badge variant="outline" className="text-[10px]">
                              {STATUS_LABELS[entry.old_status]}
                            </Badge>
                          )}
                          <span className="text-muted-foreground">→</span>
                          {entry.new_status && (
                            <Badge
                              variant={STATUS_VARIANTS[entry.new_status]}
                              className="text-[10px]"
                            >
                              {STATUS_LABELS[entry.new_status]}
                            </Badge>
                          )}
                        </div>
                      )}
                      {entry.action === "notes_updated" && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Notes internes modifiées
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <ShieldCheck className="h-3 w-3" />
                        {entry.actor_role
                          ? ROLE_LABELS[entry.actor_role]
                          : entry.action === "created"
                          ? "Demandeur (formulaire public)"
                          : "Système"}
                        <span>·</span>
                        <span>
                          {new Date(entry.created_at).toLocaleString("fr-CA", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
