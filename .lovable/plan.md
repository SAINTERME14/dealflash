# Audit Boardeal & plan de réorganisation — espace utilisateurs multi-rôles

## 1. État actuel (audit)

### Ce qui existe déjà côté code
- **Site public** : `Index`, `Search`, `ListingDetail`, `Featured`, `Boutiques`, `CommentAcheter`, `CommentVendre`, `About`, `MobileHome`, `Install`, `Auth`, `BecomeAdvertiser`, `QrRedirect`, `PrototypeHub`. Layout commun via `MainLayout` (Header + LeftSidebar + Footer).
- **Espace utilisateur (éclaté)** : `Dashboard`, `Profile`, `MyListings`, `CreateListing`, `Favorites`, `Messages`, `MyBookings`, `MyTickets`, `MyReviews`, `SellerStats`, `SellerVerification`, `Support`, `SupportTicket`, `AffiliateOnboarding`, `AffiliateDashboard`. Pas de hub unique : chaque page vit isolée.
- **Espace admin (deux générations)** : ancien `/admin/*` (≈20 pages : Annonces, Boutiques, Users, Finances, Tickets, Dropshipping, Suppliers, SalesChannels, Featured, FlashSales, Partners, Tasks, Verifications, Content, ControlCenter, AuditLog, Support, SellerApplications…) **et** nouveau `/admin/v2/*` (Dashboard, ControlCenter, Team, Security, Audit, 2FASetup) protégé par `AdminV2Route` + 2FA obligatoire.
- **Auth & rôles** : `useAuth` (singleton Supabase), `useIsAdmin` (rôle `admin` dans `user_roles`), `useAdminUser` (table `admin_users` v2), `ProtectedRoute`, `AdminRoute`, `AdminV2Route`, `SellerNotesRoute`.
- **Backend Supabase** : tables et RLS en place pour `merchant_profiles`, `affiliate_profiles` (kind = closer/influencer/promoter, KYC), `employer_profiles`, `job_tickets` + `job_ticket_messages`, `commission_rules`, `commissions`, `qr_codes`/`qr_visits`/`qr_conversions` (Phase 2 livrée), `listings` + `ranked_listings` + `search_ranked_listings` (Phase 3 livrée), `flash_sales`, `bookings`, `appointments`, `dealflash_products`, `dropship_orders`, `audit_logs`, `admin_users`, `admin_sessions`, etc.
- **ENUM `app_role`** actif : `acheteur`, `vendeur_b2c`, `vendeur_c2c`, `admin`, `moderateur` (visible via `assign_vendor_role_on_approval` et `can_manage_seller_notes`). `affiliate_kind` séparé (closer/influencer/promoter). **Pas encore** : `professional`, `employer` comme rôles applicatifs ; ils existent uniquement via leurs tables profil.

### Écarts vs la cible Boardeal (7 rôles + MenuFlash)
| Domaine | Cible | État |
|---|---|---|
| Rôles applicatifs | buyer, merchant, closer, influencer, promoter, professional, employer | Partiel : acheteur/vendeur côté `app_role`, affiliés via `affiliate_kind`, pro/employer seulement par tables profil |
| Hub utilisateur unique | Un `/mon-compte` qui route selon rôle(s) | Absent — pages dispersées |
| Onboarding par rôle | Wizard guidé après signup pour choisir/activer un rôle | Partiel : seulement `AffiliateOnboarding` et `BecomeAdvertiser` |
| Switch multi-rôles | Un user peut être merchant **et** closer, basculer de contexte | Absent |
| Dashboards par rôle | Vue dédiée (KPIs, actions) pour chacun des 7 rôles | Seulement merchant (SellerStats), affilié (AffiliateDashboard), buyer (Dashboard générique) |
| MenuFlash | (à confirmer périmètre) | Absent du code — aucun fichier `menuflash` |
| Pro / Employeur | Profils + annuaire + tickets | Tables OK, **pages manquantes** |

## 2. Plan de réorganisation — espace utilisateurs multi-rôles

Approche **non destructive** : on garde toutes les pages existantes, on ajoute une couche de routage et un hub. Découpage en 4 étapes livrables séparément.

### Étape A — Fondations (1 itération)
- Étendre `app_role` : ajouter `closer`, `influencer`, `promoter`, `professional`, `employer` (migration ENUM `ADD VALUE`). `acheteur` reste = buyer, `vendeur_b2c`/`c2c` restent = merchant.
- Créer `professional_profiles` (compétences[], dispo, secteur, taux, CV). RLS comme `employer_profiles`.
- Hook `useUserRoles()` : retourne **toutes** les rôles actifs du user (lecture `user_roles` + `merchant_profiles`/`affiliate_profiles`/`professional_profiles`/`employer_profiles`).
- Composant `RoleGuard` : `<RoleGuard roles={["merchant","admin"]}>…</RoleGuard>`.
- Store léger `activeRoleStore` (pattern `sidebarStore`) : rôle de contexte courant, persistant `localStorage`.

### Étape B — Hub `/mon-compte` (1 itération)
Nouveau layout `AccountLayout` + sous-routes :
```text
/mon-compte                       → AccountHome (résumé tous rôles, KPIs croisés)
/mon-compte/profil                → existant Profile
/mon-compte/parametres            → préférences, langue, notifs, sécurité
/mon-compte/messages              → existant Messages
/mon-compte/favoris               → existant Favorites
/mon-compte/notifications         → centre notifs
/mon-compte/roles                 → activer/désactiver chaque rôle (lance onboarding)
```
Avec un **RoleSwitcher** dans le header du hub (pastilles colorées par rôle, 1 clic = change `activeRole` et bascule la sidebar contextuelle).

### Étape C — Sous-espaces par rôle (2 itérations)
Chaque rôle a son sous-arbre, monté seulement si rôle actif :
```text
/mon-compte/acheteur/             AcheteurDashboard, MesBookings, MesTickets, MesAvis
/mon-compte/marchand/             MerchantDashboard, MesAnnonces, CreerAnnonce, FlashSales,
                                  Disponibilites, Stats, Verification, Boutique
/mon-compte/closer/               CloserDashboard, MesQR, MesAffiliations, Commissions, Points, Payouts
/mon-compte/influenceur/          InfluencerDashboard (même base que closer + médias sociaux)
/mon-compte/promoteur/            PromoterDashboard (idem + campagnes terrain)
/mon-compte/pro/                  ProDashboard, MonCV, MesTicketsEmploi, Disponibilites
/mon-compte/employeur/            EmployerDashboard, MesAnnoncesEmploi, Candidats, MesTicketsEmploi
```
Wizards d'activation réutilisant `AffiliateOnboarding` (pattern multi-step zod) pour chacun des nouveaux rôles. Le `AffiliateDashboard` actuel devient `closer/influencer/promoter` partagé via prop `kind`.

Règles préservées :
- Aucune coordonnée directe (email/tel) sur les fiches publiques pro/marchand → tout passe par tickets ou QR.
- Filtre serveur anti-coordonnées sur `job_ticket_messages` (déjà prévu côté trigger à compléter).
- `boost_weight` et `featured_*` restent réservés admin.
- Affiliés : payouts visibles seulement si KYC `approved`.

### Étape D — Migration douce des pages existantes (1 itération)
- Ajouter des **redirections 301 internes** : `/dashboard` → `/mon-compte`, `/my-listings` → `/mon-compte/marchand/annonces`, `/affilie` → `/mon-compte/closer` (selon `kind`), `/profile` → `/mon-compte/profil`, etc.
- Garder les anciens chemins fonctionnels pendant 1 release (liens externes, emails, PWA).
- Mettre à jour `LeftSidebar` et `Header` : menu compte regroupé sous un seul point d'entrée + RoleSwitcher.

## 3. Détails techniques

**Routing** : ajouter dans `App.tsx` un bloc `<Route path="/mon-compte" element={<ProtectedRoute><AccountLayout/></ProtectedRoute>}>` avec routes enfants lazy. Les sous-routes par rôle sont gardées par `<RoleGuard>` qui redirige vers `/mon-compte/roles?activate=<role>` si le rôle n'est pas actif.

**Migration DB (étape A)** :
```sql
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'closer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'influencer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'promoter';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'professional';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'employer';

CREATE TABLE public.professional_profiles (
  id uuid PK default gen_random_uuid(),
  user_id uuid not null unique,
  headline text, bio text, sector text, city text,
  skills text[] default '{}', hourly_rate numeric, currency text default 'CAD',
  availability text, cv_url text, is_published boolean default false,
  created_at/updated_at
);
-- RLS : owner ALL, public SELECT si is_published, admin ALL
```
Triggers existants `handle_new_user` / `assign_vendor_role_on_approval` conservés. Activation d'un rôle = INSERT dans `user_roles` (idempotent) + INSERT dans la table profil correspondante.

**Sécurité** :
- `useUserRoles` lit via `has_role` (security definer) — pas de récursion RLS.
- `RoleGuard` est une garde **UX** ; les RLS restent la vraie barrière.
- Admin v2 (`/admin/v2`) reste intouché : aucune route `/mon-compte/*` ne peut accorder de privilège admin.

**MenuFlash** : non inclus dans cette étape (périmètre à clarifier — restaurants ? menu QR éphémère sur fiche commerçant ?). Sera traité dans une phase ultérieure une fois le hub multi-rôles en place.

## 4. Ordre d'exécution proposé

1. **Étape A** — migration ENUM + `professional_profiles` + hook `useUserRoles` + `RoleGuard`. (1 message)
2. **Étape B** — `AccountLayout` + `/mon-compte` + RoleSwitcher + page `/mon-compte/roles`. (1 message)
3. **Étape C1** — sous-espaces buyer + merchant + affiliés (réutilise pages existantes). (1 message)
4. **Étape C2** — sous-espaces pro + employeur (nouvelles pages, réutilise tables existantes). (1 message)
5. **Étape D** — redirections + nettoyage `LeftSidebar`/`Header`. (1 message)

Chaque étape est testable indépendamment et n'introduit aucune régression sur les flux existants.

## 5. Hors scope (à valider ensuite)
- MenuFlash (périmètre à définir).
- Phase 4 (module emploi côté public + plans payants pro/employeur).
- Phase 5 (Stripe seamless + payouts automatisés).
- Phase 6 admin v2 étendu (commission_rules CRUD, KYC affiliés UI, dashboards QR).

Confirme l'approche pour que je lance l'**Étape A** (migration + fondations) — je t'enverrai la migration SQL en attente d'approbation avant d'écrire le code.
