import { Card } from "@/components/ui/card";
import { Seo } from "@/components/seo/Seo";
import { Building2, Globe, Infinity as InfinityIcon, Package, ShieldCheck } from "lucide-react";

export default function About() {
  return (
    <div className="container py-10 max-w-4xl">
      <Seo
        title="À propos — DealFlash"
        description="DealFlash est une plateforme de commerce électronique, marketplace, marketing numérique, dropshipping et distribution multi-canal."
        canonical="https://dealflash.ca/a-propos"
      />

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-3">À propos de DealFlash</h1>
        <p className="text-lg text-muted-foreground">
          Une plateforme tout-en-un pour acheter, vendre et faire grandir le commerce numérique au Canada et au-delà.
        </p>
      </header>

      <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="flex items-start gap-3 mb-3">
          <Building2 className="h-6 w-6 text-primary mt-1 shrink-0" />
          <h2 className="text-xl font-semibold">Définition juridique</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed italic">
          « DealFlash est une plateforme de commerce électronique et d'un marché en ligne, de services de marketing
          numériques, de publicités, de promotions et de référencement payant, de mise en relation de vendeurs et
          d'acheteurs, de vente au détail en ligne de marchandises diverses, d'importation, de distribution et
          commercialisation de produits et de toute autre activité connexe. »
        </p>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <Package className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Marketplace + dropshipping</h3>
          <p className="text-sm text-muted-foreground">
            Vendeurs particuliers et entreprises côtoient les produits officiels DealFlash, distribués via des
            fournisseurs internationaux de confiance (CJ Dropshipping, AliExpress, Alibaba et autres).
          </p>
        </Card>
        <Card className="p-5">
          <Globe className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Distribution multi-canal</h3>
          <p className="text-sm text-muted-foreground">
            Les produits DealFlash peuvent également être diffusés sur d'autres marketplaces (Amazon, Temu, eBay,
            Walmart) pour maximiser la portée.
          </p>
        </Card>
        <Card className="p-5">
          <InfinityIcon className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Capacité illimitée</h3>
          <p className="text-sm text-muted-foreground">
            Le nombre de vendeurs et d'acheteurs sur DealFlash est illimité. Notre infrastructure cloud évolue
            automatiquement avec la demande.
          </p>
        </Card>
        <Card className="p-5">
          <ShieldCheck className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Vérification & confiance</h3>
          <p className="text-sm text-muted-foreground">
            Les vendeurs professionnels passent par un processus de vérification KYC complet. Paiements sécurisés
            via Stripe, support utilisateur intégré.
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Nos activités</h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <li>• Marketplace en ligne (B2C et C2C)</li>
          <li>• Marketing numérique et référencement payant</li>
          <li>• Publicité et promotions ciblées</li>
          <li>• Mise en relation acheteurs / vendeurs</li>
          <li>• Vente au détail en ligne</li>
          <li>• Importation et distribution de marchandises</li>
          <li>• Dropshipping multi-fournisseurs</li>
          <li>• Diffusion multi-canal vers marketplaces externes</li>
        </ul>
      </Card>
    </div>
  );
}
