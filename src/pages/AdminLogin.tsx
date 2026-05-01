import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

/**
 * Page de connexion réservée aux administrateurs.
 * URL volontairement non liée publiquement : /admin/connexion
 * Après authentification, vérifie le rôle 'admin' avant de rediriger.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Connexion admin · DealFlash";
    // Empêcher l'indexation de cette page
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Si déjà connecté, vérifier le rôle et rediriger
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data) {
        navigate("/admin", { replace: true });
      } else {
        toast.error("Ce compte ne possède pas les droits administrateur.");
        await supabase.auth.signOut();
      }
    })();
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));

    const { data: signIn, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !signIn.user) {
      setLoading(false);
      toast.error(
        error?.message === "Invalid login credentials"
          ? "Identifiants invalides"
          : error?.message ?? "Connexion impossible"
      );
      return;
    }

    // Vérifier le rôle admin
    const { data: hasAdmin, error: adminCheckError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", signIn.user.id)
      .eq("role", "admin")
      .maybeSingle();

    setLoading(false);
    if (!adminCheckError && hasAdmin) {
      toast.success("Bienvenue, administrateur");
      navigate("/admin", { replace: true });
    } else {
      await supabase.auth.signOut();
      toast.error("Accès refusé : ce compte n'est pas administrateur.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Console administrateur</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Accès réservé au personnel autorisé de DealFlash.
          </p>
        </div>

        <Card className="p-6 shadow-elevated">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Courriel administrateur</Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@dealflash.ca"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Mot de passe</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Se connecter à la console
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Toute tentative d'accès non autorisée est journalisée.
        </p>
      </div>
    </div>
  );
}
