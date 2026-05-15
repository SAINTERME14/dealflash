import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, Wallet, MousePointerClick, TrendingUp, Copy, Check } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const LANGS = [
  { code: "FR", flag: "🇫🇷" },
  { code: "EN", flag: "🇬🇧" },
  { code: "ES", flag: "🇪🇸" },
  { code: "PT", flag: "🇵🇹" },
];

const monthlyData = [
  { month: "Jan", clics: 120, revenus: 240 },
  { month: "Fév", clics: 180, revenus: 360 },
  { month: "Mar", clics: 240, revenus: 520 },
  { month: "Avr", clics: 320, revenus: 680 },
  { month: "Mai", clics: 280, revenus: 590 },
  { month: "Juin", clics: 410, revenus: 880 },
];

const sampleLinks = [
  { id: 1, name: "Page d'accueil", url: "https://boardeal.ca/?aff=AFF_JULUS_ABC123", clicks: 0, conversions: 0, revenue: 0 },
  { id: 2, name: "Ventes Flash", url: "https://boardeal.ca/ventes-flash?aff=AFF_JULUS_ABC123", clicks: 0, conversions: 0, revenue: 0 },
  { id: 3, name: "Devenir Vendeur", url: "https://boardeal.ca/devenir-vendeur?aff=AFF_JULUS_ABC123", clicks: 0, conversions: 0, revenue: 0 },
];

export default function AffiliateDashboard() {
  const [lang, setLang] = useState("FR");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-800 to-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-blue-900/80 border-b border-blue-700/50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Tableau de Bord Affilié
          </h1>
          <div className="flex items-center gap-1 bg-blue-800/50 rounded-lg p-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-2 py-1 rounded text-sm transition-colors ${
                  lang === l.code ? "bg-white text-blue-900" : "text-white hover:bg-blue-700/50"
                }`}
                aria-label={l.code}
              >
                <span className="mr-1">{l.flag}</span>
                <span className="hidden sm:inline">{l.code}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* STATS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<DollarSign className="h-6 w-6" />} label="Gains Total" value="€0.00" color="bg-green-500" />
          <StatCard icon={<Wallet className="h-6 w-6" />} label="En Attente" value="€0.00" color="bg-blue-500" />
          <StatCard icon={<MousePointerClick className="h-6 w-6" />} label="Clics Total" value="0" color="bg-purple-500" />
          <StatCard icon={<TrendingUp className="h-6 w-6" />} label="Conversions" value="0" color="bg-orange-500" />
        </section>

        {/* TABS */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-md border border-white/20 grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-white">Analytics</TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-white">Mes Liens</TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-white">Profil</TabsTrigger>
          </TabsList>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader><CardTitle>Évolution des Clics</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="clics" stroke="#2563eb" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="bg-white/95">
                <CardHeader><CardTitle>Revenus Mensuels (€)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenus" fill="#1e40af" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Links */}
          <TabsContent value="links" className="space-y-4">
            {sampleLinks.map((link) => (
              <Card key={link.id} className="bg-white/95">
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{link.name}</h3>
                      <p className="text-sm text-muted-foreground truncate font-mono">{link.url}</p>
                    </div>
                    <Button
                      onClick={() => handleCopy(link.id, link.url)}
                      variant={copiedId === link.id ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {copiedId === link.id ? (
                        <><Check className="mr-1" /> Copié!</>
                      ) : (
                        <><Copy className="mr-1" /> Copier</>
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                    <MiniStat label="Clics" value={link.clicks} />
                    <MiniStat label="Conversions" value={link.conversions} />
                    <MiniStat label="Revenus" value={`€${link.revenue.toFixed(2)}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            <Card className="bg-white/95 max-w-2xl">
              <CardHeader><CardTitle>Informations Affilié</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ProfileRow label="Code Affilié">
                  <code className="bg-slate-100 px-3 py-1 rounded font-mono text-sm">AFF_JULUS_ABC123</code>
                </ProfileRow>
                <ProfileRow label="Statut">
                  <Badge className="bg-green-500 hover:bg-green-600">✓ Actif</Badge>
                </ProfileRow>
                <ProfileRow label="Niveau">
                  <Badge variant="outline" className="border-amber-700 text-amber-700">🥉 Bronze</Badge>
                </ProfileRow>
                <ProfileRow label="Taux de Commission">
                  <span className="text-2xl font-bold text-blue-700">5%</span>
                </ProfileRow>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Email de paiement</h4>
                  <Input type="email" placeholder="votre@email.com" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Commission Tiers */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Niveaux de Commission</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TierCard emoji="🥉" name="Bronze" rate="5%" />
            <TierCard emoji="🥈" name="Silver" rate="8%" />
            <TierCard emoji="🥇" name="Gold" rate="12%" />
            <TierCard emoji="💎" name="Platinum" rate="15%" />
          </div>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Vos Avantages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BenefitCard emoji="💰" title="Commissions Élevées" desc="Jusqu'à 15%" />
            <BenefitCard emoji="📊" title="Analytics Complet" desc="Suivez tout en temps réel" />
            <BenefitCard emoji="🚀" title="Croissance Rapide" desc="Évoluez de niveau facilement" />
            <BenefitCard emoji="💳" title="Paiements Rapides" desc="Recevez vos gains vite" />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="bg-white/95 backdrop-blur-md hover:shadow-xl transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`${color} text-white p-3 rounded-xl shadow-md`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-blue-800">{value}</p>
    </div>
  );
}

function ProfileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function TierCard({ emoji, name, rate }: { emoji: string; name: string; rate: string }) {
  return (
    <Card className="bg-white/95 hover:scale-105 transition-transform">
      <CardContent className="p-5 text-center">
        <div className="text-4xl mb-2">{emoji}</div>
        <h3 className="font-bold">{name}</h3>
        <p className="text-2xl font-bold text-blue-700 mt-1">{rate}</p>
      </CardContent>
    </Card>
  );
}

function BenefitCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <Card className="bg-white/95 hover:shadow-xl transition-shadow">
      <CardContent className="p-5">
        <div className="text-3xl mb-2">{emoji}</div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}
