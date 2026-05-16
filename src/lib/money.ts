/**
 * Helpers monétaires Boardeal.
 * Règle d'architecture : tout montant est stocké en cents (integer).
 * La conversion d'affichage utilise la devise du marché actif.
 */

export type Money = { amount_cents: number; currency: string };

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(amount_cents: number): number {
  return Math.round(amount_cents) / 100;
}

export function formatMoney(
  amount_cents: number,
  currency: string,
  locale = "fr-CA"
): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      fromCents(amount_cents)
    );
  } catch {
    return `${fromCents(amount_cents).toFixed(2)} ${currency}`;
  }
}

/** Convertit un montant en cents d'une devise vers une autre via un taux. */
export function convertCents(
  amount_cents: number,
  rate_from_to: number
): number {
  return Math.round(amount_cents * rate_from_to);
}
