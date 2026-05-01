import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

const getErrorMessage = (msg: string): string => {
  if (msg.includes("Invalid login credentials")) return "Courriel ou mot de passe incorrect.";
  if (msg.includes("Email not confirmed")) return "Courriel non confirmé. Vérifiez votre boîte de réception.";
  if (msg.includes("User already registered")) return "Un compte existe déjà avec ce courriel.";
  if (msg.includes("Password should be at least")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (msg.includes("Unable to validate email address")) return "Adresse courriel invalide.";
  if (msg.includes("Email rate limit exceeded") || msg.includes("over_email_send_rate_limit"))
    return "Trop de tentatives. Attendez quelques minutes avant de réessayer.";
  if (msg.includes("signup_disabled")) return "Les inscriptions sont temporairement désactivées.";
  return msg;
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tab, setTab] = useState(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get("redirect");
      navigate(redirect && redirect.startsWith("/") ? redirect : "/", { replace: true });
    }
  }, [user, navigate, searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmedEmail(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setUnconfirmedEmail(email);
      }
      toast.error(getErrorMessage(error.message));
    }
    // Ne pas naviguer ici — useEffect va détecter user et naviguer
  };

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setLoading(false);
    if (error) {
      toast.error(getErrorMessage(error.message));
    } else {
      toast.success("Courriel de confirmation renvoyé !");
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const displayName = String(fd.get("display_name"));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { display_name: displayName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(getErrorMessage(error.message));
    } else if (data.user && !data.session) {
      toast.success("Compte créé ! Vérifiez votre courriel pour confirmer votre adresse.");
      setUnconfirmedEmail(email);
      setTab("login");
    }
    // Si data.session existe, useEffect va naviguer automatiquement
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setLoading(false);
    if (error) {
      toast.error(getErrorMessage(error.message));
    } else {
      toast.success("Courriel de réinitialisation envoyé !");
      setResetMode(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 gradient-subtle">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-accent shadow-flash">
              <span className="text-accent-foreground font-bold text-xl">D</span>
            </div>
            <span className="font-bold text-2xl">
              Deal<span className="text-accent">Flash</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold">{resetMode ? "Réinitialiser le mot de passe" : "Bienvenue"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {resetMode
              ? "Entrez votre courriel pour recevoir un lien de réinitialisation"
              : "Connectez-vous pour acheter, vendre et réserver"}
          </p>
        </div>

        <Card className="p-6 shadow-elevated">
          {resetMode ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Courriel</Label>
                <Input id="reset-email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Envoyer le lien
              </Button>
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour à la connexion
              </button>
            </form>
          ) : (
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v);
                setUnconfirmedEmail(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Se connecter</TabsTrigger>
                <TabsTrigger value="signup">S'inscrire</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Courriel</Label>
                    <Input id="login-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Se connecter
                  </Button>
                  <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center mt-1"
                  >
                    Mot de passe oublié ?
                  </button>
                </form>

                {unconfirmedEmail && (
                  <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800">Courriel non confirmé</p>
                        <p className="text-amber-700 mt-1">
                          Vérifiez votre boîte pour <strong>{unconfirmedEmail}</strong>.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2 text-amber-700 border-amber-300 hover:bg-amber-100"
                          onClick={handleResendConfirmation}
                          disabled={loading}
                        >
                          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                          Renvoyer le courriel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom d'affichage</Label>
                    <Input id="signup-name" name="display_name" required minLength={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Courriel</Label>
                    <Input id="signup-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Créer mon compte
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}
