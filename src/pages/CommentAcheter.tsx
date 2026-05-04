import { Ticket, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function CommentAcheter() {
  useEffect(() => { document.title = "Comment acheter — DealFlash"; }, []);
  return (
    <div className="container py-12 max-w-3xl">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-accent text-accent-foreground">
            <Ticket className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Comment acheter</h1>
        </div>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3"><span className="font-bold text-accent">1.</span><span>Trouvez l'annonce ou le service qui vous intéresse</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">2.</span><span>Cliquez sur <strong>« Entrer en contact »</strong></span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">3.</span><span>Payez votre ticket d'accès (Stripe ou Interac QR)</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">4.</span><span>Recevez votre billet avec rendez-vous</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">5.</span><span>Discutez et planifiez la rencontre</span></li>
          <li className="flex gap-3"><span className="font-bold text-accent">6.</span><span>Complétez votre transaction <strong>en personne</strong></span></li>
        </ol>
      </div>
      <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-5 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-sm">
          <strong>DealFlash est une plateforme de connexion.</strong> Les transactions se complètent entre l'acheteur et le vendeur. Les acheteurs paient un ticket pour entrer en contact.
        </p>
      </div>
    </div>
  );
}
