import { useEffect } from "react";
import boardealLogo from "@/assets/boardeal-logo.jpeg";
import { Card } from "@/components/ui/card";
import { Smartphone, Share, Plus, Download } from "lucide-react";
import { InstallButton } from "@/components/pwa/InstallButton";

export default function Install() {
  useEffect(() => { document.title = "Installer Boardeal sur mobile"; }, []);

  return (
    <div className="container max-w-2xl py-12">
      <div className="text-center mb-10">
        <img src={boardealLogo} alt="Boardeal" className="h-20 w-auto mx-auto rounded-2xl mb-4 shadow-flash" />
        <h1 className="text-3xl font-bold">Installer Boardeal sur votre mobile</h1>
        <p className="text-muted-foreground mt-2">Accédez au marketplace en un clic, comme une vraie application.</p>
        <div className="mt-6 flex justify-center">
          <InstallButton />
        </div>
      </div>

      <Card className="p-6 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">📱 iPhone / iPad (Safari)</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3"><span className="font-bold text-accent">1.</span><span>Ouvrez Boardeal dans <strong>Safari</strong> sur votre iPhone.</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">2.</span><span>Touchez le bouton <Share className="inline h-4 w-4" /> <strong>Partager</strong> en bas de l'écran.</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">3.</span><span>Sélectionnez <Plus className="inline h-4 w-4" /> <strong>« Sur l'écran d'accueil »</strong>.</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">4.</span><span>Touchez <strong>Ajouter</strong>. L'icône Boardeal apparaîtra sur votre écran d'accueil.</span></li>
        </ol>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">🤖 Android (Chrome)</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3"><span className="font-bold text-accent">1.</span><span>Ouvrez Boardeal dans <strong>Chrome</strong> sur votre téléphone Android.</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">2.</span><span>Touchez le menu <strong>⋮</strong> en haut à droite.</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">3.</span><span>Sélectionnez <Download className="inline h-4 w-4" /> <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">4.</span><span>Confirmez. Boardeal sera ajouté comme une vraie application.</span></li>
        </ol>
      </Card>

      <Card className="p-6 bg-secondary/50">
        <h3 className="font-semibold mb-2">✨ Pourquoi installer ?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Lancement plus rapide depuis l'écran d'accueil</li>
          <li>• Mode plein écran sans la barre du navigateur</li>
          <li>• Aucun téléchargement depuis l'App Store ou Google Play</li>
          <li>• Mises à jour automatiques</li>
        </ul>
      </Card>
    </div>
  );
}
