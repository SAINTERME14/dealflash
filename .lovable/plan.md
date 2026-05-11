# Transformation Dealflash → Boardeal — Plan méthodique

Vu l'ampleur (rebrand global + 6 nouveaux rôles + moteur QR/commissions + module emploi + refonte vitrine), je propose un découpage en **7 phases livrables**, chacune testable et déployable indépendamment. Cette approche évite l'effet « big bang » et préserve le panel admin déjà construit.

---

## Phase 0 — Rebrand visuel & identité (rapide, ~1 itération)

**But :** changer le nom et le logo partout, sans toucher aux fonctionnalités.

- Intégrer le logo **Boardeal** (`src/assets/boardeal-logo.jpeg`) dans Header, Footer, favicon, manifest PWA, emails, page Auth, sitemap.
- Mettre à jour la palette : **navy `#1e3a8a`** (principal) + **vert `#10b981`** (accent, du logo) + blanc. L'orange Dealflash devient secondaire ou est retiré (à confirmer).
- Mise à jour `index.css` (tokens HSL), `tailwind.config.ts`, `index.html` (title, meta, OG), `manifest.json`, `README.md`.
- Remplacer toutes occurrences textuelles « Dealflash » → « Boardeal » (≈ recherche `rg -i dealflash`).
- Mettre à jour copy de la page d'accueil avec la **vision** : « Trouver et faire un bon deal en toute sécurité ».

**Livrable :** site visuellement Boardeal, aucune régression fonctionnelle.

---

## Phase 1 — Fondations base de données (rôles étendus + RBAC)

**But :** poser le schéma pour les 6 nouveaux rôles sans casser l'existant.

Nouveaux ENUMs et tables (migrations Supabase) :

```text
ENUM user_type: buyer | merchant | closer | influencer | promoter | professional | employer
                (admin reste séparé via admin_users existant)

Tables nouvelles :
- merchant_profiles      (lié à un user, infos boutique étendues)
- affiliate_profiles     (closer/influencer/promoter — KYC, statut validé)
- professional_profiles  (CV public, compétences, dispo)
- employer_profiles      (entreprise, secteur)
- shop_affiliations      (qui est affilié à quelle boutique, statut)
- qr_codes               (id, owner_user_id, owner_role, target_type[shop|product|service|campaign],
                         target_id, code unique, discount_pct, is_active)
- qr_visits              (qr_id, visitor_fingerprint, ip_country, ts) — pour points
- qr_conversions         (qr_id, order_id, gross_amount, commission_total, ts)
- commissions            (qr_conversion_id, beneficiary_user_id, role, pct, amount, status)
- points_ledger          (user_id, delta, source, ref_id) — wallet de points
- payouts                (user_id, amount, method, status, period)
- subscription_plans     (code, name, price_cents, target_role, features jsonb)
- user_subscriptions     (user_id, plan_code, status, current_period_end, stripe_sub_id)
- job_tickets            (employer_id, professional_id, subject, status) + job_ticket_messages
- commission_rules       (table paramétrable : type_affilié, pct_platform, pct_affiliate,
                         points_per_visit, points_to_money_threshold, points_to_money_rate)
```

RLS strict par rôle. Helper SQL `has_role(user, role)` étendu. Table `user_roles` existante conservée et alignée avec l'ENUM.

**Livrable :** schéma complet, types TS régénérés, aucune UI changée.

---

## Phase 2 — Moteur QR + tracking + commissions (cœur métier)

**But :** rendre opérationnel le tracking multi-sided.

- **Génération QR** : edge function `qr-create` (vérifie rôle + affiliation), stockage en base, image générée côté client (`qrcode` lib déjà présente).
- **Page de redirection** `/qr/:code` :
  1. Log dans `qr_visits` (fingerprint anonyme, géo via Cloudflare trace).
  2. Crédit points dans `points_ledger` selon `commission_rules`.
  3. Applique cookie d'attribution (30 j) avant redirect vers la cible (boutique/produit).
- **Webhook commande** : à la confirmation d'un achat, lookup cookie/session → crée `qr_conversions` + `commissions` selon règles paramétrables (par défaut 50/50).
- **Cas visiteur direct vitrine** : QR téléchargé sans affilié → 100 % plateforme.
- **Restriction « pas de contact direct »** : ListingCard et fiche produit n'exposent **jamais** email/tel/URL externe du commerçant ; tout passe par bouton « Obtenir le QR ».

**Livrable :** un closer peut s'affilier, générer son QR, le partager, et voir ses points/commissions s'accumuler en temps réel.

---

## Phase 3 — Refonte vitrine Boardeal (ranking & filtres)

**But :** moteur de tri intelligent.

- Nouveau champ `listing.deal_type` ENUM : `damaged_packaging | overstock | end_of_season | clearance | promo_40plus | trending`.
- Vue SQL `ranked_listings` qui pondère :
  - boost abonnement commerçant (poids le plus fort),
  - distance géolocalisation (PostGIS ou simple lat/lng + Haversine),
  - match catégorie/mots-clés (full-text `tsvector`),
  - fraîcheur.
- Pagination infinie côté frontend (`useInfiniteQuery`).
- Filtres UI : type de deal, distance, catégorie, recherche texte.

**Livrable :** vitrine performante avec ranking transparent + admin peut ajuster les poids.

---

## Phase 4 — Module Professionnels & Employeurs

**But :** marketplace emploi avec tickets cloisonnés.

- Pages : `/professionnels` (annuaire), `/professionnels/:id` (profil), `/employeurs/dashboard`, `/emploi/annonces`.
- Création profil pro (compétences, dispo, secteur) + création annonce employeur.
- **Système de tickets** : table `job_tickets` + `job_ticket_messages` avec **filtre serveur anti-coordonnées** (regex bloque emails, tels, URLs externes tant qu'aucun abonnement actif des deux côtés).
- Plans : Pro 5 $/mois, Employeur Starter/Pro (paramétrables via `subscription_plans`).
- Limites gratuites : employeur = X annonces, pro = visibilité limitée.

**Livrable :** module emploi complet, isolé du marketplace deals (modules indépendants).

---

## Phase 5 — Abonnements & paiements (Stripe seamless)

**But :** monétisation des plans + payouts affiliés.

- Activer **Stripe seamless payments** (built-in Lovable, pas de BYOK).
- Produits Stripe pour chaque plan (`subscription_plans` → produits Stripe via `payments--batch_create_product`).
- Webhook `payments-webhook` étendu pour gérer les events `customer.subscription.*` → MAJ `user_subscriptions`.
- Page `/abonnements` par rôle, upgrade/downgrade, gestion via Stripe Customer Portal.
- **Payouts** : page admin pour valider/exporter les paiements aux affiliés (initial = manuel via virement, automatisable plus tard avec Stripe Connect).

**Livrable :** monétisation opérationnelle.

---

## Phase 6 — Admin Boardeal étendu

**But :** rendre tout paramétrable depuis `/admin/v2`.

Nouveaux modules dans le panel admin v2 existant :
- **Règles de commissions** : éditeur des `commission_rules` (pcts, seuils points→$).
- **Affiliés** : table closers/influencers/promoters, validation KYC, suspension.
- **Tracking** : dashboards QR (visites/conversions/top affiliés).
- **Plans & abonnements** : CRUD `subscription_plans`.
- **Litiges** : nouvelle table `disputes` + UI de résolution.
- **Notation/avis** : modération.

**Livrable :** super-admin a contrôle total sur les leviers business.

---

## Phase 7 — Améliorations recommandées (à valider)

Opportunités identifiées :
1. **KYC affiliés** (Stripe Identity ou upload pièce) avant activation des payouts.
2. **Système d'avis** bidirectionnel (acheteur↔commerçant, employeur↔pro).
3. **Gestion litiges** avec SLA et escalade admin.
4. **Anti-fraude QR** : rate-limit visites par fingerprint, détection auto-scan.
5. **Multi-devises / multi-pays** : ajout `currency` sur listings et `country_config`.
6. **Notifications temps réel** (Supabase Realtime déjà en place) pour conversions affiliés.
7. **API publique** pour intégrations futures (extension navigateur closer, etc.).

---

## Détails techniques transverses

**Stack conservée :** React 18 + Vite + Tailwind + TypeScript + Lovable Cloud (Supabase). Pas de changement de stack.

**Sécurité :**
- RLS sur **toutes** les nouvelles tables.
- Rôles dans `user_roles` (jamais sur `profiles`).
- Filtre serveur anti-coordonnées dans messages tickets (edge function).
- Audit logs étendus (table `audit_logs` existante).

**Compte super-admin préservé :** aucune phase ne touche à `admin_users` ni à votre rôle.

**Modèle de données — diagramme synthétique :**

```text
                    ┌──────────┐
                    │  users   │
                    └────┬─────┘
         ┌───────────────┼───────────────┬──────────────┬──────────────┐
         ▼               ▼               ▼              ▼              ▼
   merchant_       affiliate_     professional_   employer_      admin_users
   profiles        profiles         profiles      profiles      (existant)
         │               │               │              │
         ▼               ▼               ▼              ▼
     listings    shop_affiliations   job_tickets ◄─── job_tickets
         │               │
         ▼               ▼
    qr_codes ──► qr_visits ──► points_ledger ──► payouts
         │
         ▼
   qr_conversions ──► commissions ──► payouts
         │
         ▼
       orders
```

---

## Ordre d'exécution recommandé

| # | Phase | Effort | Risque | Bloque la suite ? |
|---|-------|--------|--------|-------------------|
| 0 | Rebrand | Faible | Très faible | Non |
| 1 | DB rôles | Moyen | Moyen (migration) | Oui (phases 2–6) |
| 2 | Moteur QR | Élevé | Moyen | Oui (phase 6) |
| 3 | Vitrine | Moyen | Faible | Non |
| 4 | Emploi | Élevé | Faible | Non |
| 5 | Paiements | Moyen | Moyen (Stripe) | Phase 6 partielle |
| 6 | Admin étendu | Moyen | Faible | Non |
| 7 | Améliorations | Variable | — | — |

---

## Questions avant de commencer

1. **Couleurs :** garde-t-on l'orange Dealflash en accent secondaire, ou bascule-t-on intégralement sur **navy + vert Boardeal** (palette du logo) ?
2. **Phase 0 maintenant ?** Je propose de démarrer immédiatement par le rebrand (logo + couleurs + textes) — visible tout de suite — puis d'enchaîner sur la Phase 1 (migrations DB) dans un second message. Ça vous convient ?
3. **Ancien panel admin** (`/admin/*`, hors `/admin/v2`) : on le **supprime** maintenant ou on le garde en lecture seule pendant la transition ?

Confirmez ces 3 points et je démarre la Phase 0 immédiatement.