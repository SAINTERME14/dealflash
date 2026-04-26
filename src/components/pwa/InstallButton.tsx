import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  variant?: "default" | "secondary" | "accent";
  className?: string;
}

/** One-click PWA install button (visible only when browser supports it). */
export function InstallButton({ variant = "default", className }: Props) {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className ?? ""}`}>
        <CheckCircle2 className="h-4 w-4 text-primary" />
        Application déjà installée
      </div>
    );
  }

  if (!canInstall) return null;

  const handleClick = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      toast.success("DealFlash installée !");
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant === "accent" ? "default" : variant}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      Installer DealFlash
    </Button>
  );
}
