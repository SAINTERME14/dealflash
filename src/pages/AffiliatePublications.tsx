import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Publication = {
  id: string;
  channel: string;
  content: string | null;
  external_url: string | null;
  posted_at: string | null;
  listing_id: string | null;
};

const CHANNELS = ["facebook", "instagram", "tiktok", "youtube", "x", "linkedin", "whatsapp", "other"];

export default function AffiliatePublications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("instagram");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [listingId, setListingId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    document.title = "Mes publications | Boardeal";
    if (user) load();
  }, [user]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("publications")
      .select("id,channel,content,external_url,posted_at,listing_id")
      .order("posted_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setItems((data as Publication[]) ?? []);
    setLoading(false);
  }

  async function create() {
    if (!user) return;
    if (!url.trim()) return toast.error("URL de la publication requise");
    setCreating(true);
    const { error } = await supabase.from("publications").insert({
      affiliate_user_id: user.id,
      channel,
      content: content.trim() || null,
      external_url: url.trim(),
      listing_id: listingId.trim() || null,
      posted_at: new Date().toISOString(),
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Publication enregistrée");
    setContent(""); setUrl(""); setListingId("");
    load();
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes publications</h1>
          <p className="text-sm text-muted-foreground">
            Déclarez vos publications multi-canal pour traçage et statistiques.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouvelle publication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="URL de la publication" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <Input placeholder="ID du produit (optionnel)" value={listingId} onChange={(e) => setListingId(e.target.value)} />
            <Textarea placeholder="Contenu (optionnel)" value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
            <Button onClick={create} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : items.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune publication.</p>
            ) : (
              <div className="divide-y">
                {items.map((p) => (
                  <div key={p.id} className="p-4 flex items-start gap-3">
                    <Badge variant="outline">{p.channel}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{p.content || <em className="text-muted-foreground">Sans description</em>}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {p.posted_at ? new Date(p.posted_at).toLocaleString() : "—"}
                      </div>
                    </div>
                    {p.external_url && (
                      <a href={p.external_url} target="_blank" rel="noreferrer" className="text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
