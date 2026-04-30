import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image as ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";

const MAX_SIZE_MB = 8;
const ACCEPT_PHOTO = "image/jpeg,image/png,image/webp";
const ACCEPT_DOC = "image/jpeg,image/png,image/webp,application/pdf";

interface Props {
  bucket?: string;
  kind: "photo" | "document";
  paths: string[]; // storage paths
  onChange: (paths: string[]) => void;
  max?: number;
  label?: string;
}

export function AdvertiserUploader({
  bucket = "advertiser-uploads",
  kind,
  paths,
  onChange,
  max = kind === "photo" ? 8 : 4,
  label,
}: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const loadPreview = useCallback(async (path: string) => {
    if (previews[path]) return;
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
    if (data?.signedUrl) setPreviews((p) => ({ ...p, [path]: data.signedUrl }));
  }, [bucket, previews]);

  paths.forEach((p) => loadPreview(p));

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    if (paths.length + files.length > max) {
      toast.error(`Maximum ${max} fichiers`);
      return;
    }
    setBusy(true);
    const next = [...paths];
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} : trop lourd (max ${MAX_SIZE_MB} Mo)`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${user.id}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        toast.error(`Échec : ${file.name}`);
        continue;
      }
      next.push(path);
    }
    setBusy(false);
    onChange(next);
  };

  const remove = async (path: string) => {
    await supabase.storage.from(bucket).remove([path]);
    onChange(paths.filter((p) => p !== path));
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {paths.map((p) => (
          <div
            key={p}
            className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted group"
          >
            {kind === "photo" && previews[p] ? (
              <img src={previews[p]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-2">
                <FileText className="h-6 w-6" />
                <p className="text-[10px] truncate w-full text-center mt-1">
                  {p.split("/").pop()}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(p)}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 border flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              aria-label="Supprimer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {paths.length < max && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition text-muted-foreground">
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : kind === "photo" ? (
              <ImageIcon className="h-5 w-5" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            <span className="text-[10px] mt-1">Ajouter</span>
            <input
              type="file"
              className="hidden"
              accept={kind === "photo" ? ACCEPT_PHOTO : ACCEPT_DOC}
              multiple
              disabled={busy}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {paths.length}/{max} • Max {MAX_SIZE_MB} Mo par fichier
      </p>
    </div>
  );
}
