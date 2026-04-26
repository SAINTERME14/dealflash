import { z } from "zod";

// VIN: 17 chars alphanumériques, sans I/O/Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const currentYear = new Date().getFullYear();

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, { message: `${label} doit être un nombre` });

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date invalide (AAAA-MM-JJ)" })
  .refine((s) => !Number.isNaN(new Date(s).getTime()), { message: "Date invalide" });

export const autosOccasionSchema = z.object({
  year: numericString("Année")
    .refine((s) => {
      const n = Number(s);
      return Number.isInteger(n) && n >= 1900 && n <= currentYear + 1;
    }, { message: `Année entre 1900 et ${currentYear + 1}` }),
  mileage_km: numericString("Kilométrage")
    .refine((s) => {
      const n = Number(s);
      return Number.isInteger(n) && n >= 0 && n <= 2_000_000;
    }, { message: "Kilométrage entre 0 et 2 000 000" }),
  transmission: z.enum(["manual", "automatic"]).optional().or(z.literal("")),
  fuel: z.enum(["gasoline", "diesel", "hybrid", "electric"]).optional().or(z.literal("")),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(VIN_REGEX, { message: "VIN invalide (17 caractères, sans I/O/Q)" })
    .optional()
    .or(z.literal("")),
});

export const colocationSchema = z.object({
  budget_max: numericString("Budget").refine((s) => {
    const n = Number(s);
    return n > 0 && n <= 10_000;
  }, { message: "Budget entre 1 et 10 000 $" }),
  room_type: z.enum(["private", "shared", "studio"], { message: "Type de chambre requis" }),
  available_from: isoDate.optional().or(z.literal("")),
  furnished: z.enum(["yes", "no", "partial"]).optional().or(z.literal("")),
});

export const objetsDiversSchema = z.object({
  condition: z.enum(["new", "like_new", "good", "fair", "for_parts"], {
    message: "État requis",
  }),
  brand: z.string().trim().max(80, { message: "Marque trop longue (max 80)" }).optional().or(z.literal("")),
});

export type PetitesAnnoncesSubSlug = "autos-occasion" | "colocation-pa" | "objets-divers";

export function validatePetitesAnnonces(
  subSlug: PetitesAnnoncesSubSlug,
  raw: Record<string, unknown>,
):
  | { ok: true; data: Record<string, string> }
  | { ok: false; error: string } {
  try {
    const data =
      subSlug === "autos-occasion"
        ? autosOccasionSchema.parse(raw)
        : subSlug === "colocation-pa"
          ? colocationSchema.parse(raw)
          : objetsDiversSchema.parse(raw);
    // Strip empty strings
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "string" && v.length > 0) clean[k] = v;
    }
    return { ok: true, data: clean };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Validation échouée" };
    }
    return { ok: false, error: "Validation échouée" };
  }
}
