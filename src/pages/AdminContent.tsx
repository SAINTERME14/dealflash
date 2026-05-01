import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/customClient";
import { useAllSiteContent, type SiteContentRow } from "@/hooks/useSiteContent";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CATEGORY_LABELS: Record<string, string> = {
  announcement: "Bande défilante (annonce)",
  hero: "Bannière d'accueil",
  home: "Page d'accueil",
  footer: "Pied de page",
  cta: "Appels à l'action",
  general: "Général",
};

export default function AdminContent() {
  const { data, isLoading } = useAllSiteContent();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const getValue = (row: SiteContentRow): string => {
    if (drafts[row.key] !== undefined) return drafts[row.key];
    const v = row.value;
    return typeof v === "string" ? v : v == null ? "" : String(v);
  };

  const isDirty = (row: SiteContentRow): boolean => {
    if (drafts[row.key] === undefined) return false;
    const original = typeof row.value === "string" ? row.value : String(row.value ?? "");
    return drafts[row.key] !== original;
  };

  const handleSave = async (row: SiteContentRow) => {
    setSaving(row.key);
    const newValue = drafts[row.key];
    const { error } = await supabase
      .from("site_content")
      .update({ value: newValue as unknown as never })
      .eq("id", row.id);
    setSaving(null);

    if (error) {
      toast({
        title: "Erreur d'enregistrement",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Texte mis à jour",
      description: `« ${row.key} » a été enregistré.`,
    });

    setDrafts((d) => {
      const next = { ...d };
      delete next[row.key];
      return next;
    });
    queryClient.invalidateQueries({ queryKey: ["site_content"] });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const rows = data ?? [];
  const categories = Array.from(new Set(rows.map((r) => r.category)));
  const orderedCategories = ["announcement", "hero", "home", "footer", "cta", "general"].filter((c) =>
    categories.includes(c)
  );
  // ajoute toute catégorie inattendue à la fin
  categories.forEach((c) => {
    if (!orderedCategories.includes(c)) orderedCategories.push(c);
  });

  return (
    <AdminLayout>
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Contenu du site</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Modifiez les textes affichés publiquement sans toucher au code. Les changements
          sont visibles immédiatement après enregistrement.
        </p>
      </header>

      <Tabs defaultValue={orderedCategories[0]} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          {orderedCategories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {CATEGORY_LABELS[cat] ?? cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {orderedCategories.map((cat) => (
          <TabsContent key={cat} value={cat} className="space-y-4">
            {rows
              .filter((r) => r.category === cat)
              .map((row) => {
                const value = getValue(row);
                const dirty = isDirty(row);
                const isLong = value.length > 80 || value.includes("\n");
                return (
                  <Card key={row.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base font-mono">{row.key}</CardTitle>
                          {row.description && (
                            <CardDescription className="mt-1">
                              {row.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSave(row)}
                          disabled={!dirty || saving === row.key}
                          variant={dirty ? "default" : "outline"}
                        >
                          {saving === row.key ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1.5" />
                              Enregistrer
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Label htmlFor={`content-${row.id}`} className="sr-only">
                        Contenu pour {row.key}
                      </Label>
                      {isLong ? (
                        <Textarea
                          id={`content-${row.id}`}
                          value={value}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [row.key]: e.target.value }))
                          }
                          rows={3}
                          className="font-normal"
                        />
                      ) : (
                        <Input
                          id={`content-${row.id}`}
                          value={value}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [row.key]: e.target.value }))
                          }
                        />
                      )}
                      {dirty && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Modification non enregistrée
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>
        ))}
      </Tabs>
    </AdminLayout>
  );
}
