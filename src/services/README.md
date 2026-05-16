# Service layer

Règle d'architecture Boardeal :

> **Jamais d'appel `fetch` ou `supabase.from(...)` direct depuis un composant.**

Chaque domaine métier (`listings`, `affiliations`, `leads`, `commissions`, `markets`…)
expose ici une API typée. Les composants/hooks consomment ces services, ce qui :

- Centralise le filtrage **multi-tenant par `market_id`** ;
- Permet d'ajouter télémétrie, cache, retry, validation Zod ;
- Facilite les tests unitaires (mock du service, pas du client Supabase).

## Convention

```ts
// src/services/<domain>.ts
import { supabase } from "@/integrations/supabase/customClient";

export const listingsService = {
  async listByMarket(marketId: string, opts?: { limit?: number }) { ... },
  async getById(id: string) { ... },
};
```

Les hooks (`src/hooks/use*`) appellent les services ; les pages appellent les hooks.
