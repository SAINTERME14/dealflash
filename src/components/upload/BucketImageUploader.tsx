import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/customClient";
import {
  validateUpload,
  getAcceptAttribute,
  type AllowedBucket,
} from "@/lib/uploadValidation";
import { cn } from "@/lib/utils";

interface BucketImageUploaderProps {
  /** Bucket cible — doit être dans la whitelist. */
  bucket: AllowedBucket;
  /** ID du user (sert de préfixe au chemin pour respecter les RLS storage). */
  userId: string;
  /** URLs publiques actuellement sélectionnées. */
  value: string[];
  /** Callback quand la liste change. */
  onChange: (urls: string[]) => void;
  /** Nombre max de fichiers. Par défaut 8 pour listings, 1 pour avatars. */
  maxFiles?: number;
  /** Autoriser plusieurs fichiers à la fois. */
  multiple?: boolean;
  /** Libellé du bouton "ajouter". */
  addLabel?: string;
  /** Classes pour la grille des miniatures. */
  gridClassName?: string;
}

/**
 * Uploader d'images réutilisable :
 * - valide chaque fichier via le helper centralisé (whitelist bucket + MIME + taille)
 * - affiche les erreurs uniformément via sonner
 * - upload vers Supabase Storage sous `${userId}/...` (compatible RLS)
 * - retourne les URLs publiques via `onChange`
 */
export function BucketImageUploader({
  bucket,
  userId,
  value,
  onChange,
  maxFiles = bucket === "avatars" ? 1 : 8,
  multiple = bucket !== "avatars",
  addLabel = "Ajouter",
  gridClassName,
}: BucketImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const removeImage = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !userId) return;
    setUploading(true);

    const remaining = Math.max(0, maxFiles - value.length);
    const files = Array.from(e.target.files).slice(0, remaining);
    const uploaded: string[] = [];

    for (const file of files) {
      const check = validateUpload(bucket, file);
      if (!check.ok) {
        toast.error(check.error!);
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type });
      if (error) {
        toast.error(`Erreur upload : ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    if (uploaded.length) onChange([...value, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const canAddMore = value.length < maxFiles;

  return (
    <div
      className={cn(
        "grid gap-3",
        gridClassName ?? "grid-cols-3 sm:grid-cols-4",
      )}
    >
      {value.map((url, i) => (
        <div
          key={`${url}-${i}`}
          className="aspect-square relative rounded-lg overflow-hidden border border-border group"
        >
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => removeImage(i)}
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth"
            aria-label="Retirer l'image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {canAddMore && (
        <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 cursor-pointer transition-smooth">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">{addLabel}</span>
          <input
            type="file"
            accept={getAcceptAttribute(bucket)}
            multiple={multiple}
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
