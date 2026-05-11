import { Store } from "lucide-react";
import { useEffect } from "react";

export default function CommentVendre() {
  useEffect(() => { document.title = "Comment vendre — Boardeal"; }, []);
  return (
    <div className="container py-12 max-w-3xl">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Comment vendre</h1>
        </div>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3"><span className="font-bold text-primary">1.</span><span>Choisissez votre catégorie (particulier, commerce, professionnel, etc.)</span></li>
          <li className="flex gap-3"><span className="font-bold text-primary">2.</span><span>Vérifiez votre identité ou licence professionnelle</span></li>
          <li className="flex gap-3"><span className="font-bold text-primary">3.</span><span>Publiez votre annonce avec photos et description détaillée</span></li>
          <li className="flex gap-3"><span className="font-bold text-primary">4.</span><span>Définissez vos conditions (prix, rabais, horaires)</span></li>
          <li className="flex gap-3"><span className="font-bold text-primary">5.</span><span>Recevez les demandes de contact des acheteurs sérieux</span></li>
          <li className="flex gap-3"><span className="font-bold text-primary">6.</span><span>Synchronisez votre calendrier et confirmez les rendez-vous</span></li>
          <li className="flex gap-3"><span className="font-bold text-primary">7.</span><span>Rencontrez vos acheteurs qualifiés</span></li>
        </ol>
      </div>
    </div>
  );
}
