import { Card } from "@/components/ui/card";
import { Seo } from "@/components/seo/Seo";
import { Link } from "react-router-dom";
import { BadgeCheck, Briefcase, ShieldCheck, Store, Ticket, User, AlertTriangle, ArrowRight } from "lucide-react";

export default function About() {
  return (
    <div className="container py-10 max-w-4xl">
      <Seo
        title="À propos — DealFlash"
        description="DealFlash est la plateforme québécoise qui met en relation des acheteurs sérieux avec des vendeurs et professionnels vérifiés."
        canonical="https://dealflash.ca/a-propos"
      />

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-3">DealFlash — Connectez-vous avec les bons acheteurs ou vendeurs</h1>
        <p className="text-lg text-muted-foreground">
          La plateforme locale du Québec qui met en relation des acheteurs sérieux avec des vendeurs
          et professionnels vérifiés.
        </p>
      </header>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" /> Comment ça marche
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="font-semibold mb-2">Pour les Vendeurs & Professionnels</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>✓ Créez une annonce vérifiée (identité confirmée)</li>
              <li>✓ Publiez 3-8 photos et une description détaillée</li>
              <li>✓ Définissez vos conditions (rabais, spécialités, certifications)</li>
              <li>✓ Acceptez automatiquement ou manuellement les demandes de contact</li>
              <li>✓ Gérez vos rendez-vous sur votre calendrier</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Pour les Acheteurs & Intéressés</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>✓ Trouvez des annonces vérifiées près de chez vous</li>
              <li>✓ Voyez la distance du vendeur/professionnel</li>
              <li>✓ Payez un ticket d'entrée en contact (Stripe ou Interac QR)</li>
              <li>✓ Recevez votre billet avec rendez-vous QR</li>
              <li>✓ Discutez via messagerie sécurisée</li>
              <li>✓ Synchronisez votre agenda avec le vendeur</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Sécurité
        </h2>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• Tous les vendeurs et professionnels sont vérifiés</li>
          <li>• Aucune information personnelle visible publiquement</li>
          <li>• Paiements sécurisés pour les tickets de rendez-vous</li>
          <li>• Messagerie intégrée et traçable</li>
        </ul>
      </Card>

      <h2 className="text-2xl font-bold mb-4 mt-10">4 types d'annonceurs</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <User className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold mb-1">1️⃣ Particuliers</h3>
          <p className="text-sm text-muted-foreground">
            Vendez vos articles, meubles, autos, services ou locations. 3-8 photos,
            description détaillée, défauts révélés. Vérification d'identité requise.
          </p>
        </Card>
        <Card className="p-5">
          <Briefcase className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold mb-1">2️⃣ Vendeurs Professionnels (occasionnels)</h3>
          <p className="text-sm text-muted-foreground">
            Un seul article à vendre ? Même format que les particuliers. Identité
            professionnelle révélée. Vérification de statut professionnel requise.
          </p>
        </Card>
        <Card className="p-5">
          <Store className="h-6 w-6 text-accent mb-2" />
          <h3 className="font-semibold mb-1">3️⃣ Commerces & Services</h3>
          <p className="text-sm text-muted-foreground">
            Lancez des campagnes d'articles multiples. Articles FLASH avec rabais
            min. 10%. Calendrier synchronisé. Vérification d'entreprise requise.
          </p>
        </Card>
        <Card className="p-5">
          <BadgeCheck className="h-6 w-6 text-success mb-2" />
          <h3 className="font-semibold mb-1">4️⃣ Professionnels réglementés</h3>
          <p className="text-sm text-muted-foreground">
            Médecins, avocats, plombiers, électriciens, etc. Certifié conforme à
            votre autorité de tutelle. Prix du marché + prix promotionnel affichés.
            Vérification de licence professionnelle requise.
          </p>
        </Card>
      </div>

      <Card className="p-5 border-accent/30 bg-accent/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>DealFlash est une plateforme de connexion.</strong> Les transactions
            (vente, location, prestations de services) se complètent entre l'acheteur et
            le vendeur. Les acheteurs paient un ticket pour entrer en contact.
          </p>
        </div>
      </Card>
    </div>
  );
}
