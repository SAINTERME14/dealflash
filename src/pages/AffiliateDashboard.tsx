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

type Lang = "FR" | "EN" | "ES" | "PT";

const LANGS: { code: Lang; flag: string }[] = [
  { code: "FR", flag: "🇫🇷" },
  { code: "EN", flag: "🇬🇧" },
  { code: "ES", flag: "🇪🇸" },
  { code: "PT", flag: "🇵🇹" },
];

const T: Record<Lang, Record<string, string>> = {
  FR: {
    title: "Tableau de Bord Affilié",
    totalEarnings: "Gains Total", pending: "En Attente", totalClicks: "Clics Total", conversions: "Conversions",
    analytics: "Analytics", links: "Mes Liens", profile: "Profil",
    clicksEvolution: "Évolution des Clics", monthlyRevenue: "Revenus Mensuels (€)",
    home: "Page d'accueil", flashSales: "Ventes Flash", becomeSeller: "Devenir Vendeur",
    copy: "Copier", copied: "Copié!", clicks: "Clics", revenue: "Revenus",
    affiliateInfo: "Informations Affilié", affiliateCode: "Code Affilié", status: "Statut", active: "✓ Actif",
    tier: "Niveau", commissionRate: "Taux de Commission",
    paymentEmail: "Email de paiement", emailPlaceholder: "votre@email.com",
    commissionTiers: "Niveaux de Commission",
    benefits: "Vos Avantages",
    bHighTitle: "Commissions Élevées", bHighDesc: "Jusqu'à 15%",
    bAnalyticsTitle: "Analytics Complet", bAnalyticsDesc: "Suivez tout en temps réel",
    bGrowthTitle: "Croissance Rapide", bGrowthDesc: "Évoluez de niveau facilement",
    bPayoutTitle: "Paiements Rapides", bPayoutDesc: "Recevez vos gains vite",
    jan: "Jan", feb: "Fév", mar: "Mar", apr: "Avr", may: "Mai", jun: "Juin",
  },
  EN: {
    title: "Affiliate Dashboard",
    totalEarnings: "Total Earnings", pending: "Pending", totalClicks: "Total Clicks", conversions: "Conversions",
    analytics: "Analytics", links: "My Links", profile: "Profile",
    clicksEvolution: "Clicks Over Time", monthlyRevenue: "Monthly Revenue (€)",
    home: "Homepage", flashSales: "Flash Sales", becomeSeller: "Become a Seller",
    copy: "Copy", copied: "Copied!", clicks: "Clicks", revenue: "Revenue",
    affiliateInfo: "Affiliate Info", affiliateCode: "Affiliate Code", status: "Status", active: "✓ Active",
    tier: "Tier", commissionRate: "Commission Rate",
    paymentEmail: "Payment Email", emailPlaceholder: "your@email.com",
    commissionTiers: "Commission Tiers",
    benefits: "Your Benefits",
    bHighTitle: "High Commissions", bHighDesc: "Up to 15%",
    bAnalyticsTitle: "Complete Analytics", bAnalyticsDesc: "Track everything in real time",
    bGrowthTitle: "Fast Growth", bGrowthDesc: "Level up easily",
    bPayoutTitle: "Quick Payouts", bPayoutDesc: "Get paid fast",
    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
  },
  ES: {
    title: "Panel de Afiliado",
    totalEarnings: "Ganancias Totales", pending: "Pendiente", totalClicks: "Clics Totales", conversions: "Conversiones",
    analytics: "Analítica", links: "Mis Enlaces", profile: "Perfil",
    clicksEvolution: "Evolución de Clics", monthlyRevenue: "Ingresos Mensuales (€)",
    home: "Página de inicio", flashSales: "Ventas Flash", becomeSeller: "Hazte Vendedor",
    copy: "Copiar", copied: "¡Copiado!", clicks: "Clics", revenue: "Ingresos",
    affiliateInfo: "Información del Afiliado", affiliateCode: "Código de Afiliado", status: "Estado", active: "✓ Activo",
    tier: "Nivel", commissionRate: "Tasa de Comisión",
    paymentEmail: "Email de pago", emailPlaceholder: "tu@email.com",
    commissionTiers: "Niveles de Comisión",
    benefits: "Tus Ventajas",
    bHighTitle: "Comisiones Altas", bHighDesc: "Hasta 15%",
    bAnalyticsTitle: "Analítica Completa", bAnalyticsDesc: "Sigue todo en tiempo real",
    bGrowthTitle: "Crecimiento Rápido", bGrowthDesc: "Sube de nivel fácilmente",
    bPayoutTitle: "Pagos Rápidos", bPayoutDesc: "Recibe tus ganancias rápido",
    jan: "Ene", feb: "Feb", mar: "Mar", apr: "Abr", may: "May", jun: "Jun",
  },
  PT: {
    title: "Painel de Afiliado",
    totalEarnings: "Ganhos Totais", pending: "Pendente", totalClicks: "Cliques Totais", conversions: "Conversões",
    analytics: "Análise", links: "Meus Links", profile: "Perfil",
    clicksEvolution: "Evolução dos Cliques", monthlyRevenue: "Receita Mensal (€)",
    home: "Página Inicial", flashSales: "Promoções Flash", becomeSeller: "Tornar-se Vendedor",
    copy: "Copiar", copied: "Copiado!", clicks: "Cliques", revenue: "Receita",
    affiliateInfo: "Informações do Afiliado", affiliateCode: "Código de Afiliado", status: "Status", active: "✓ Ativo",
    tier: "Nível", commissionRate: "Taxa de Comissão",
    paymentEmail: "Email de pagamento", emailPlaceholder: "seu@email.com",
    commissionTiers: "Níveis de Comissão",
    benefits: "Seus Benefícios",
    bHighTitle: "Comissões Altas", bHighDesc: "Até 15%",
    bAnalyticsTitle: "Análise Completa", bAnalyticsDesc: "Acompanhe tudo em tempo real",
    bGrowthTitle: "Crescimento Rápido", bGrowthDesc: "Suba de nível facilmente",
    bPayoutTitle: "Pagamentos Rápidos", bPayoutDesc: "Receba seus ganhos rapidamente",
    jan: "Jan", feb: "Fev", mar: "Mar", apr: "Abr", may: "Mai", jun: "Jun",
  },
};

export default function AffiliateDashboard() {
  const [lang, setLang] = useState<Lang>("FR");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const t = T[lang];

  const monthlyData = [
    { month: t.jan, clics: 120, revenus: 240 },
    { month: t.feb, clics: 180, revenus: 360 },
    { month: t.mar, clics: 240, revenus: 520 },
    { month: t.apr, clics: 320, revenus: 680 },
    { month: t.may, clics: 280, revenus: 590 },
    { month: t.jun, clics: 410, revenus: 880 },
  ];

  const sampleLinks = [
    { id: 1, name: t.home, url: "https://boardeal.ca/?aff=AFF_JULUS_ABC123", clicks: 0, conversions: 0, revenue: 0 },
    { id: 2, name: t.flashSales, url: "https://boardeal.ca/ventes-flash?aff=AFF_JULUS_ABC123", clicks: 0, conversions: 0, revenue: 0 },
    { id: 3, name: t.becomeSeller, url: "https://boardeal.ca/devenir-vendeur?aff=AFF_JULUS_ABC123", clicks: 0, conversions: 0, revenue: 0 },
  ];

  const handleCopy = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-800 to-slate-900">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-blue-900/80 border-b border-blue-700/50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-white">{t.title}</h1>
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
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<DollarSign className="h-6 w-6" />} label={t.totalEarnings} value="€0.00" color="bg-green-500" />
          <StatCard icon={<Wallet className="h-6 w-6" />} label={t.pending} value="€0.00" color="bg-blue-500" />
          <StatCard icon={<MousePointerClick className="h-6 w-6" />} label={t.totalClicks} value="0" color="bg-purple-500" />
          <StatCard icon={<TrendingUp className="h-6 w-6" />} label={t.conversions} value="0" color="bg-orange-500" />
        </section>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-md border border-white/20 grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-white">{t.analytics}</TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-white">{t.links}</TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-white">{t.profile}</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95">
                <CardHeader><CardTitle>{t.clicksEvolution}</CardTitle></CardHeader>
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
                <CardHeader><CardTitle>{t.monthlyRevenue}</CardTitle></CardHeader>
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
            <div className="bg-white/95 rounded-lg p-1">
              <AffiliateLeadsPanel />
            </div>
          </TabsContent>

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
                        <><Check className="mr-1" /> {t.copied}</>
                      ) : (
                        <><Copy className="mr-1" /> {t.copy}</>
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                    <MiniStat label={t.clicks} value={link.clicks} />
                    <MiniStat label={t.conversions} value={link.conversions} />
                    <MiniStat label={t.revenue} value={`€${link.revenue.toFixed(2)}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="profile">
            <Card className="bg-white/95 max-w-2xl">
              <CardHeader><CardTitle>{t.affiliateInfo}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ProfileRow label={t.affiliateCode}>
                  <code className="bg-slate-100 px-3 py-1 rounded font-mono text-sm">AFF_JULUS_ABC123</code>
                </ProfileRow>
                <ProfileRow label={t.status}>
                  <Badge className="bg-green-500 hover:bg-green-600">{t.active}</Badge>
                </ProfileRow>
                <ProfileRow label={t.tier}>
                  <Badge variant="outline" className="border-amber-700 text-amber-700">🥉 Bronze</Badge>
                </ProfileRow>
                <ProfileRow label={t.commissionRate}>
                  <span className="text-2xl font-bold text-blue-700">5%</span>
                </ProfileRow>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">{t.paymentEmail}</h4>
                  <Input type="email" placeholder={t.emailPlaceholder} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">{t.commissionTiers}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TierCard emoji="🥉" name="Bronze" rate="5%" />
            <TierCard emoji="🥈" name="Silver" rate="8%" />
            <TierCard emoji="🥇" name="Gold" rate="12%" />
            <TierCard emoji="💎" name="Platinum" rate="15%" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">{t.benefits}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BenefitCard emoji="💰" title={t.bHighTitle} desc={t.bHighDesc} />
            <BenefitCard emoji="📊" title={t.bAnalyticsTitle} desc={t.bAnalyticsDesc} />
            <BenefitCard emoji="🚀" title={t.bGrowthTitle} desc={t.bGrowthDesc} />
            <BenefitCard emoji="💳" title={t.bPayoutTitle} desc={t.bPayoutDesc} />
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
