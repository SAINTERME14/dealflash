import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock, Mail, Settings2, ShieldCheck, StickyNote, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useCanManageSellerNotes } from "@/hooks/useCanManageSellerNotes";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type ApplicationStatus = "new" | "contacted" | "approved" | "rejected";
type ListingType = "product" | "vehicle" | "rental" | "hotel" | "service";

interface Application {
  id: string;
  name: string;
  email: string;
  listing_type: ListingType;
  status: ApplicationStatus;
  notes: string | null;
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

export default function AdminSellerApplications() {
  const { canManage } = useCanManageSellerNotes();
  const { isAdmin } = useIsAdmin();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  useEffect(() => {
    document.title = "Admin · Demandes vendeurs | DealFlash";
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("seller_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erreur de chargement");
    } else {
      setApps((data ?? []) as Application[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const { error } = await supabase
      .from("seller_applications")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Mise à jour impossible");
      return;
    }
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success("Statut mis à jour");
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette demande ?")) return;
    const { error } = await supabase.from("seller_applications").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    setApps((prev) => prev.filter((a) => a.id !== id));
    toast.success("Demande supprimée");
  };

  const saveNotes = async (id: string, notes: string) => {
    const trimmed = notes.trim();
    const value = trimmed.length === 0 ? null : trimmed.slice(0, 2000);
    const { error } = await supabase
      .from("seller_applications")
      .update({ notes: value })
      .eq("id", id);
    if (error) {
      toast.error("Enregistrement impossible");
      return false;
    }
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, notes: value } : a)));
    toast.success("Notes internes enregistrées");
    return true;
  };

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);
  const counts = apps.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    { new: 0, contacted: 0, approved: 0, rejected: 0 } as Record<ApplicationStatus, number>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Demandes vendeurs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Soumissions du formulaire « Devenir vendeur » de la page d'accueil.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Votre rôle : <span className="font-medium text-foreground">{isAdmin ? "Administrateur" : "Vendeur professionnel"}</span>
            {!isAdmin && <span>· suppression réservée aux admins</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["new", "contacted", "approved", "rejected"] as ApplicationStatus[]).map((s) => (
            <Card key={s}>
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {STATUS_LABELS[s]}
                </div>
                <div className="text-2xl font-bold mt-1">{counts[s]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Liste des demandes</CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v as ApplicationStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="contacted">Contacté</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Aucune demande {filter !== "all" ? `« ${STATUS_LABELS[filter as ApplicationStatus]} »` : ""}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Courriel</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(app.created_at).toLocaleDateString("fr-CA", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>
                          <a
                            href={`mailto:${app.email}`}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            {app.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{TYPE_LABELS[app.listing_type]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={app.status}
                            onValueChange={(v) => updateStatus(app.id, v as ApplicationStatus)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue>
                                <Badge variant={STATUS_VARIANTS[app.status]} className="text-[10px]">
                                  {STATUS_LABELS[app.status]}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">Nouveau</SelectItem>
                              <SelectItem value="contacted">Contacté</SelectItem>
                              <SelectItem value="approved">Approuvé</SelectItem>
                              <SelectItem value="rejected">Rejeté</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <NotesCell app={app} onSave={saveNotes} canEdit={canManage} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
                              <Link to={`/admin/demandes-vendeurs/${app.id}`}>
                                <Settings2 className="h-3.5 w-3.5" />
                                Gérer
                              </Link>
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(app.id)}
                                className="h-8 w-8 text-destructive"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function NotesCell({
  app,
  onSave,
  canEdit,
}: {
  app: Application;
  onSave: (id: string, notes: string) => Promise<boolean>;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(app.notes ?? "");
  const [saving, setSaving] = useState(false);
  const hasNotes = !!app.notes && app.notes.trim().length > 0;

  const handleOpenChange = (next: boolean) => {
    if (next) setValue(app.notes ?? "");
    setOpen(next);
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("Vous n'avez pas l'autorisation de modifier les notes.");
      return;
    }
    setSaving(true);
    const ok = await onSave(app.id, value);
    setSaving(false);
    if (ok) setOpen(false);
  };

  // Read-only state for users without permission
  if (!canEdit) {
    if (!hasNotes) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Lecture seule
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground max-w-[220px]"
        title={app.notes ?? ""}
      >
        <Lock className="h-3 w-3 shrink-0" />
        <span className="truncate">{app.notes}</span>
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={hasNotes ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 max-w-[220px]"
        >
          <StickyNote className="h-3.5 w-3.5 shrink-0" />
          {hasNotes ? (
            <span className="truncate text-xs">{app.notes}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Ajouter</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes internes — {app.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <Lock className="h-3 w-3" />
            Visible uniquement par l'équipe DealFlash autorisée. Le demandeur ne verra jamais ce contenu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex. : déjà contacté par téléphone, profil intéressant pour B2C…"
            rows={6}
            maxLength={2000}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground text-right">
            {value.length} / 2000
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
