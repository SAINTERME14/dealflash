// Whitelist client-side des buckets autorisés et de leurs contraintes.
// Note: la sécurité réelle est appliquée par les RLS storage côté serveur ;
// ces vérifications offrent un retour utilisateur immédiat et évitent les
// uploads inutiles vers des buckets non prévus par l'app.

export type AllowedBucket = "listings" | "avatars";

interface BucketRules {
  /** Types MIME exacts acceptés. */
  allowedMimeTypes: readonly string[];
  /** Extensions de fichier acceptées (sans le point), en minuscules. */
  allowedExtensions: readonly string[];
  /** Taille maximale en octets. */
  maxSizeBytes: number;
  /** Libellé humain pour les messages d'erreur. */
  label: string;
}

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"] as const;

const BUCKET_RULES: Record<AllowedBucket, BucketRules> = {
  listings: {
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
    maxSizeBytes: 8 * 1024 * 1024, // 8 Mo / image d'annonce
    label: "image d'annonce",
  },
  avatars: {
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
    maxSizeBytes: 2 * 1024 * 1024, // 2 Mo / avatar
    label: "avatar",
  },
};

export interface UploadValidationResult {
  ok: boolean;
  /** Message d'erreur localisé (FR), prêt à afficher. */
  error?: string;
}

/**
 * Vérifie qu'un fichier peut être uploadé dans le bucket donné.
 * - Refuse les buckets non listés dans la whitelist.
 * - Vérifie le type MIME et l'extension (les deux doivent être autorisés).
 * - Vérifie la taille maximale.
 */
export function validateUpload(
  bucket: string,
  file: File,
): UploadValidationResult {
  const rules = BUCKET_RULES[bucket as AllowedBucket];
  if (!rules) {
    return { ok: false, error: `Bucket non autorisé : ${bucket}` };
  }

  const mime = file.type?.toLowerCase() ?? "";
  if (!rules.allowedMimeTypes.includes(mime as (typeof IMAGE_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: `Type de fichier non accepté pour ${rules.label}. Formats acceptés : ${rules.allowedExtensions.join(", ").toUpperCase()}.`,
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!rules.allowedExtensions.includes(ext as (typeof IMAGE_EXTENSIONS)[number])) {
    return {
      ok: false,
      error: `Extension non acceptée (.${ext}). Utilisez : ${rules.allowedExtensions.join(", ")}.`,
    };
  }

  if (file.size > rules.maxSizeBytes) {
    const maxMb = Math.round(rules.maxSizeBytes / (1024 * 1024));
    return {
      ok: false,
      error: `Fichier trop volumineux (max ${maxMb} Mo pour ${rules.label}).`,
    };
  }

  return { ok: true };
}

/** Renvoie un attribut `accept` HTML pour un <input type="file"> selon le bucket. */
export function getAcceptAttribute(bucket: AllowedBucket): string {
  return BUCKET_RULES[bucket].allowedMimeTypes.join(",");
}
