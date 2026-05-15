import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { z } from "zod";
import { Check, CreditCard, DollarSign, Building2, TrendingUp, BarChart3, Headphones, Wallet, ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";

const step1Schema = z.object({
  website: z.string().trim().url({ message: "URL invalide (ex: https://exemple.com)" }).max(255),
  bio: z.string().trim().min(20, { message: "Minimum 20 caractères" }).max(500, { message: "Maximum 500 caractères" }),
});

const step2Schema = z.object({
  method: z.enum(["stripe", "paypal", "virement"], { required_error: "Choisissez une méthode" }),
  paymentEmail: z.string().trim().email({ message: "Email invalide" }).max(255),
});

type PaymentMethod = "stripe" | "paypal" | "virement";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  virement: "Virement Bancaire",
};

export default function AffiliateOnboarding() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [paymentEmail, setPaymentEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const next1 = () => {
    const r = step1Schema.safeParse({ website, bio });
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const next2 = () => {
    const r = step2Schema.safeParse({ method, paymentEmail });
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    setStep(3);
  };

  const submit = () => {
    if (!accepted) {
      setErrors({ terms: "Vous devez accepter les conditions" });
      return;
    }
    setDone(true);
    toast.success("Compte affilié créé avec succès !");
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white/95">
          <CardContent className="p-10 text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Bienvenue dans le programme !</h2>
            <p className="text-muted-foreground">
              Votre compte affilié a été créé. Accédez à votre tableau de bord pour générer vos premiers liens.
            </p>
            <Button className="w-full" size="lg" onClick={() => (window.location.href = "/affilie")}>
              Aller au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-800 to-slate-900">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 border-b border-blue-700/50 shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Devenir Affilié</h1>
          <p className="text-blue-100 mt-2">Rejoignez notre programme et commencez à gagner dès aujourd'hui</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: benefits */}
          <aside className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Pourquoi nous rejoindre ?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BenefitCard icon={<DollarSign />} title="💰 Commissions" desc="Jusqu'à 15% par vente" />
              <BenefitCard icon={<BarChart3 />} title="📊 Analytics" desc="Suivi en temps réel" />
              <BenefitCard icon={<Headphones />} title="🎧 Support" desc="Équipe dédiée 7j/7" />
              <BenefitCard icon={<Wallet />} title="💳 Paiements" desc="Versements rapides" />
            </div>

            <Card className="bg-white/95">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Niveaux de Commission</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <TierRow emoji="🥉" name="Bronze" rate="5%" />
                <TierRow emoji="🥈" name="Silver" rate="8%" />
                <TierRow emoji="🥇" name="Gold" rate="12%" />
                <TierRow emoji="💎" name="Platinum" rate="15%" />
              </CardContent>
            </Card>
          </aside>

          {/* RIGHT: wizard */}
          <section>
            <Card className="bg-white/95">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center flex-1 last:flex-none">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                          step >= n ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {step > n ? <Check className="h-5 w-5" /> : n}
                      </div>
                      {n < 3 && (
                        <div className={`flex-1 h-1 mx-2 rounded ${step > n ? "bg-blue-600" : "bg-slate-200"}`} />
                      )}
                    </div>
                  ))}
                </div>
                <CardTitle>
                  {step === 1 && "Étape 1 — Informations de base"}
                  {step === 2 && "Étape 2 — Méthode de paiement"}
                  {step === 3 && "Étape 3 — Confirmation"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="website">Site web <span className="text-red-500">*</span></Label>
                      <Input
                        id="website"
                        placeholder="https://monsite.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                      {errors.website && <p className="text-sm text-red-600">{errors.website}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biographie <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="bio"
                        placeholder="Parlez-nous de vous et de votre audience..."
                        value={bio}
                        maxLength={500}
                        rows={5}
                        onChange={(e) => setBio(e.target.value)}
                      />
                      <div className="flex justify-between text-xs">
                        {errors.bio ? <p className="text-red-600">{errors.bio}</p> : <span />}
                        <span className="text-muted-foreground">{bio.length}/500</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={next1}>Suivant <ArrowRight className="ml-1" /></Button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="space-y-3">
                      <PayOption value="stripe" current={method} icon={<CreditCard className="h-5 w-5 text-blue-600" />} label="Stripe" desc="Paiements rapides via carte" />
                      <PayOption value="paypal" current={method} icon={<DollarSign className="h-5 w-5 text-blue-600" />} label="PayPal" desc="Versement vers votre compte PayPal" />
                      <PayOption value="virement" current={method} icon={<Building2 className="h-5 w-5 text-blue-600" />} label="Virement Bancaire" desc="Versement SEPA/IBAN" />
                    </RadioGroup>
                    {errors.method && <p className="text-sm text-red-600">{errors.method}</p>}

                    <div className="space-y-2">
                      <Label htmlFor="payEmail">Email de paiement <span className="text-red-500">*</span></Label>
                      <Input
                        id="payEmail"
                        type="email"
                        placeholder="paiement@email.com"
                        value={paymentEmail}
                        onChange={(e) => setPaymentEmail(e.target.value)}
                      />
                      {errors.paymentEmail && <p className="text-sm text-red-600">{errors.paymentEmail}</p>}
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-1" /> Précédent</Button>
                      <Button onClick={next2}>Suivant <ArrowRight className="ml-1" /></Button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold">Récapitulatif</h3>
                      <SummaryRow label="Site web" value={website} />
                      <SummaryRow label="Biographie" value={bio.length > 80 ? bio.slice(0, 80) + "…" : bio} />
                      <SummaryRow label="Méthode de paiement" value={method ? METHOD_LABEL[method as PaymentMethod] : ""} />
                      <SummaryRow label="Email de paiement" value={paymentEmail} />
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox id="terms" checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} />
                      <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                        J'accepte les <a href="#" className="text-blue-600 underline">conditions générales</a> et la{" "}
                        <a href="#" className="text-blue-600 underline">politique de confidentialité</a>.
                      </label>
                    </div>
                    {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-1" /> Précédent</Button>
                      <Button onClick={submit} className="bg-green-600 hover:bg-green-700">
                        <Check className="mr-1" /> Créer Mon Compte
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="bg-white/95 hover:shadow-xl transition-shadow">
      <CardContent className="p-4">
        <div className="text-blue-600 mb-2">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}

function TierRow({ emoji, name, rate }: { emoji: string; name: string; rate: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
      <span className="flex items-center gap-2"><span className="text-xl">{emoji}</span><span className="font-medium">{name}</span></span>
      <Badge variant="outline" className="border-blue-600 text-blue-700">{rate}</Badge>
    </div>
  );
}

function PayOption({ value, current, icon, label, desc }: { value: string; current: string; icon: React.ReactNode; label: string; desc: string }) {
  const active = current === value;
  return (
    <label
      htmlFor={value}
      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
        active ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <RadioGroupItem value={value} id={value} />
      {icon}
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right break-all">{value || "—"}</span>
    </div>
  );
}
