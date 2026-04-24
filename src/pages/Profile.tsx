import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ display_name: "", phone: "", city: "", bio: "" });

  useEffect(() => {
    document.title = "Mon profil — DealFlash";
    if (!user) return;
    supabase.from("profiles").select("display_name, phone, city, bio").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setForm({
          display_name: data.display_name ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          bio: data.bio ?? "",
        });
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profil mis à jour");
  };

  return (
    <div className="container max-w-xl py-8">
      <h1 className="text-3xl font-bold mb-6">Mon profil</h1>
      <Card className="p-6">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Courriel</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label htmlFor="display_name">Nom d'affichage</Label>
            <Input id="display_name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="bio">À propos</Label>
            <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </form>
      </Card>
    </div>
  );
}
