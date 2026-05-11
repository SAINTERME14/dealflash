import { useEffect, useMemo, useState, type DragEvent } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, CalendarDays, User2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["admin_tasks"]["Row"];
type Status = Database["public"]["Enums"]["admin_task_status"];
type Priority = Database["public"]["Enums"]["admin_task_priority"];

const STATUS_COLUMNS: { key: Status; label: string }[] = [
  { key: "todo", label: "À faire" },
  { key: "in_progress", label: "En cours" },
  { key: "done", label: "Fait" },
  { key: "archived", label: "Archivé" },
];

const PRIORITY_LABEL: Record<Priority, { label: string; variant: "secondary" | "outline" | "default" | "destructive" }> = {
  low: { label: "Basse", variant: "secondary" },
  normal: { label: "Normale", variant: "outline" },
  high: { label: "Haute", variant: "default" },
  urgent: { label: "Urgente", variant: "destructive" },
};

interface TaskFormState {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee_id: string;
  due_date: string;
}

const EMPTY_FORM: TaskFormState = {
  title: "",
  description: "",
  status: "todo",
  priority: "normal",
  assignee_id: "",
  due_date: "",
};

interface AdminMember {
  user_id: string;
  display_name: string | null;
}

export default function AdminTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Tâches internes — Admin Boardeal";
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_tasks")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erreur de chargement : " + error.message);
    } else {
      setTasks((data ?? []) as Task[]);
    }
    setLoading(false);
  };

  const loadAdmins = async () => {
    // List of admin users for assignee dropdown
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (ids.length === 0) {
      setAdmins([]);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", ids);
    setAdmins((profiles ?? []) as AdminMember[]);
  };

  useEffect(() => {
    loadTasks();
    loadAdmins();
  }, []);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<Status, Task[]> = { todo: [], in_progress: [], done: [], archived: [] };
    for (const t of tasks) grouped[t.status].push(t);
    return grouped;
  }, [tasks]);

  const adminLabel = (id: string | null) => {
    if (!id) return "Non assigné";
    const a = admins.find((m) => m.user_id === id);
    return a?.display_name?.trim() || "Admin";
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      priority: t.priority,
      assignee_id: t.assignee_id ?? "",
      due_date: t.due_date ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    const title = form.title.trim();
    if (!title) {
      toast.error("Le titre est obligatoire");
      return;
    }
    setSaving(true);
    const payload = {
      title,
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
    };
    if (editingId) {
      const { error } = await supabase.from("admin_tasks").update(payload).eq("id", editingId);
      if (error) toast.error("Erreur : " + error.message);
      else toast.success("Tâche mise à jour");
    } else {
      const { error } = await supabase
        .from("admin_tasks")
        .insert({ ...payload, created_by: user.id });
      if (error) toast.error("Erreur : " + error.message);
      else toast.success("Tâche créée");
    }
    setSaving(false);
    setDialogOpen(false);
    await loadTasks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("admin_tasks").delete().eq("id", id);
    if (error) toast.error("Erreur : " + error.message);
    else {
      toast.success("Tâche supprimée");
      await loadTasks();
    }
  };

  const moveTask = async (taskId: string, newStatus: Status) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === newStatus) return;
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    const { error } = await supabase
      .from("admin_tasks")
      .update({ status: newStatus })
      .eq("id", taskId);
    if (error) {
      toast.error("Erreur de déplacement : " + error.message);
      await loadTasks();
    }
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, status: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (id) moveTask(id, status);
    setDraggingId(null);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tâches internes</h1>
          <p className="text-sm text-muted-foreground">
            Tableau Kanban pour suivre le travail de l'équipe admin.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle tâche
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_COLUMNS.map((col) => (
            <div
              key={col.key}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.key)}
              className="flex flex-col rounded-lg border border-border bg-muted/30 p-3 min-h-[400px]"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.label}
                </h2>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                  {tasksByStatus[col.key].length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {tasksByStatus[col.key].length === 0 ? (
                  <p className="px-2 py-8 text-center text-xs text-muted-foreground">
                    Aucune tâche
                  </p>
                ) : (
                  tasksByStatus[col.key].map((t) => {
                    const overdue =
                      t.due_date &&
                      t.status !== "done" &&
                      t.status !== "archived" &&
                      new Date(t.due_date) < new Date(new Date().toDateString());
                    return (
                      <Card
                        key={t.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, t.id)}
                        className="cursor-grab active:cursor-grabbing p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-medium leading-snug">{t.title}</h3>
                          <Badge variant={PRIORITY_LABEL[t.priority].variant} className="shrink-0">
                            {PRIORITY_LABEL[t.priority].label}
                          </Badge>
                        </div>
                        {t.description && (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {t.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User2 className="h-3 w-3" />
                            {adminLabel(t.assignee_id)}
                          </span>
                          {t.due_date && (
                            <span
                              className={`flex items-center gap-1 ${overdue ? "text-destructive font-medium" : ""}`}
                            >
                              <CalendarDays className="h-3 w-3" />
                              {new Date(t.due_date).toLocaleDateString("fr-CA")}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(t)}
                            aria-label="Modifier la tâche"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Supprimer la tâche"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la tâche ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(t.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
            <DialogDescription>
              Décrivez la tâche, son assignation et son échéance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="task-title">Titre *</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex : Réviser dossier KYC #123"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Détails, contexte, liens utiles…"
                maxLength={5000}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="task-status">Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger id="task-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_COLUMNS.map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-priority">Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY_LABEL[p].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="task-assignee">Assigné à</Label>
                <Select
                  value={form.assignee_id || "__none__"}
                  onValueChange={(v) => setForm({ ...form, assignee_id: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger id="task-assignee"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Non assigné</SelectItem>
                    {admins.map((a) => (
                      <SelectItem key={a.user_id} value={a.user_id}>
                        {a.display_name?.trim() || "Admin"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-due">Échéance</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
