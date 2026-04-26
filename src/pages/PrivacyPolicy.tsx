import { Seo } from "@/components/seo/Seo";
import { Card } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Seo
        title="Politique de confidentialité — DealFlash"
        description="Politique de confidentialité de DealFlash conforme à la Loi 25 du Québec."
        canonical="https://www.dealflash.ca/politique-confidentialite"
      />
      <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-muted-foreground mb-8">
        En vigueur depuis le 26 avril 2026 — Conforme à la Loi 25 du Québec
      </p>

      <Card className="p-6 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Responsable du traitement</h2>
          <p>
            DealFlash Inc., dont le siège social est situé au Québec, Canada, est responsable du
            traitement des renseignements personnels collectés via la plateforme
            <strong> www.dealflash.ca</strong>. Pour toute question, contactez notre responsable de la
            protection des renseignements personnels : <a className="text-accent underline" href="mailto:privacy@dealflash.ca">privacy@dealflash.ca</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Renseignements collectés</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Informations de compte : nom, courriel, mot de passe (chiffré).</li>
            <li>Profil : photo, ville, biographie, numéro de téléphone (optionnel).</li>
            <li>Vérification vendeur (KYC) : pièces d'identité, adresse, numéros fiscaux.</li>
            <li>Transactions : historique d'achat, billets, réservations.</li>
            <li>Données techniques : adresse IP, type de navigateur, témoins.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Finalités</h2>
          <p>Vos renseignements sont utilisés pour :</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Fournir et améliorer les services de la marketplace.</li>
            <li>Vérifier l'identité des vendeurs (obligation légale).</li>
            <li>Traiter les paiements et prévenir la fraude.</li>
            <li>Vous notifier de l'état de vos commandes et messages.</li>
            <li>Respecter nos obligations légales et fiscales.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Communication à des tiers</h2>
          <p>
            Nous partageons des renseignements uniquement avec : Stripe (paiements), nos
            fournisseurs de dropshipping (livraison), et les autorités compétentes lorsque la loi
            l'exige. Aucune vente de données à des fins publicitaires.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Conservation</h2>
          <p>
            Les données de compte sont conservées tant que votre compte est actif. Les documents KYC
            sont conservés 7 ans après la dernière transaction (obligation fiscale). Vous pouvez
            demander la suppression à tout moment.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Vos droits (Loi 25)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Accès</strong> : obtenir une copie de vos renseignements.</li>
            <li><strong>Rectification</strong> : corriger des données inexactes.</li>
            <li><strong>Suppression</strong> : demander l'effacement (sauf obligations légales).</li>
            <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré.</li>
            <li><strong>Retrait du consentement</strong> : à tout moment.</li>
            <li><strong>Plainte</strong> : déposer une plainte auprès de la
              <a className="text-accent underline ml-1" href="https://www.cai.gouv.qc.ca/" target="_blank" rel="noopener">Commission d'accès à l'information du Québec</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Sécurité</h2>
          <p>
            Nous appliquons des mesures techniques et organisationnelles : chiffrement TLS,
            authentification renforcée, RLS sur la base de données, journalisation des accès aux
            données sensibles, et vérification des mots de passe contre les fuites connues.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Témoins (cookies)</h2>
          <p>
            Nous utilisons des témoins essentiels (session, sécurité). Aucun témoin de suivi
            publicitaire tiers. Voir notre bandeau de consentement lors de votre première visite.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Modifications</h2>
          <p>
            Cette politique peut être mise à jour. Toute modification importante vous sera notifiée
            par courriel ou via l'application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Contact</h2>
          <p>
            Responsable de la protection des renseignements personnels :<br />
            <a className="text-accent underline" href="mailto:privacy@dealflash.ca">privacy@dealflash.ca</a>
          </p>
        </section>
      </Card>
    </div>
  );
}
