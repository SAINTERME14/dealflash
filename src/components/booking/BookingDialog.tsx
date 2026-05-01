import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/customClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";
import { Loader2, Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { TicketCheckout } from "./TicketCheckout";
import { QRCodeSVG } from "qrcode.react";

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: {
    id: string;
    title: string;
    seller_id: string;
  };
}

export function BookingDialog({ open, onOpenChange, listing }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{ confirmation_code: string; qr_code: string } | null>(null);
  const [polling, setPolling] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", message: "" });

  useEffect(() => {
    if (!open) {
      setStep(1); setDate(undefined); setSelectedSlot(null);
      setAppointmentId(null); setTicket(null); setPolling(false);
    } else if (user) {
      setForm((f) => ({ ...f, email: user.email ?? "" }));
      supabase.from("profiles").select("display_name, phone").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => {
          if (data) {
            const [first, ...rest] = (data.display_name ?? "").split(" ");
            setForm((f) => ({
              ...f,
              first_name: f.first_name || first || "",
              last_name: f.last_name || rest.join(" "),
              phone: f.phone || data.phone || "",
            }));
          }
        });
    }
  }, [open, user]);

  useEffect(() => {
    if (!date) { setSlots([]); return; }
    const dateStr = date.toISOString().slice(0, 10);
    (async () => {
      const { data } = await supabase
        .from("listing_availability")
        .select("id, slot_date, start_time, end_time")
        .eq("listing_id", listing.id)
        .eq("slot_date", dateStr)
        .eq("is_available", true)
        .order("start_time");

      const { data: booked } = await supabase
        .from("appointments")
        .select("requested_date, requested_start_time")
        .eq("listing_id", listing.id)
        .eq("requested_date", dateStr)
        .in("status", ["requested", "accepted", "paid"]);
      const bookedKeys = new Set((booked ?? []).map((b) => `${b.requested_date}-${b.requested_start_time}`));
      setSlots((data ?? []).filter((s) => !bookedKeys.has(`${s.slot_date}-${s.start_time}`)));
    })();
  }, [date, listing.id]);

  // Poll for ticket creation after payment
  useEffect(() => {
    if (!polling || !appointmentId) return;
    const t = setInterval(async () => {
      const { data } = await supabase
        .from("appointments")
        .select("ticket_id, tickets:ticket_id(confirmation_code, qr_code)")
        .eq("id", appointmentId)
        .maybeSingle();
      const tk = (data as { tickets?: { confirmation_code: string; qr_code: string } | null } | null)?.tickets;
      if (tk) {
        setTicket(tk);
        setStep(5);
        setPolling(false);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [polling, appointmentId]);

  const handleCreateAppointment = async () => {
    if (!user || !selectedSlot) return;
    setLoading(true);
    const { data, error } = await supabase.from("appointments").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      requested_date: selectedSlot.slot_date,
      requested_start_time: selectedSlot.start_time,
      requested_end_time: selectedSlot.end_time,
      buyer_first_name: form.first_name,
      buyer_last_name: form.last_name,
      buyer_phone: form.phone,
      buyer_email: form.email,
      message: form.message || null,
      status: 'requested',
    }).select("id").single();
    setLoading(false);
    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }
    setAppointmentId(data.id);
    setStep(4);
    setPolling(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step > 1 && step < 4 && (
              <button onClick={() => setStep(step - 1)} className="text-muted-foreground hover:text-foreground" aria-label="Retour">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            Réserver une visite
            <span className="ml-auto text-sm font-normal text-muted-foreground">Étape {step}/5</span>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choisissez une date disponible</p>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={fr}
                disabled={{ before: new Date() }}
                className="rounded-md border"
              />
            </div>
            <Button onClick={() => setStep(2)} variant="hero" size="lg" className="w-full" disabled={!date}>
              Continuer
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Créneaux pour le {date?.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {slots.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Aucun créneau disponible. Choisissez une autre date.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSlot(s)}
                    className={`px-3 py-2 rounded-md border text-sm transition-smooth ${
                      selectedSlot?.id === s.id
                        ? "gradient-accent text-accent-foreground border-accent shadow-flash"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {s.start_time.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
            <Button onClick={() => setStep(3)} variant="hero" size="lg" className="w-full" disabled={!selectedSlot}>
              Continuer
            </Button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={(e) => { e.preventDefault(); handleCreateAppointment(); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input id="first_name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input id="last_name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input id="phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(514) 555-1234" />
            </div>
            <div>
              <Label htmlFor="email">Courriel *</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea id="message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Continuer vers le paiement
            </Button>
          </form>
        )}

        {step === 4 && appointmentId && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Payez le frais de réservation pour confirmer votre visite. Le paiement du bien se fait sur place.
            </p>
            <TicketCheckout
              listingId={listing.id}
              appointmentId={appointmentId}
              kind="appointment"
              buyer={form}
              returnUrl={`${window.location.origin}/my-bookings?session_id={CHECKOUT_SESSION_ID}`}
            />
            {polling && (
              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                En attente de confirmation du paiement...
              </p>
            )}
          </div>
        )}

        {step === 5 && ticket && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-success text-success-foreground flex items-center justify-center">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Réservation confirmée !</h3>
              <p className="text-sm text-muted-foreground mt-1">Votre code de confirmation</p>
              <p className="font-mono font-bold text-xl text-accent mt-2">{ticket.confirmation_code}</p>
            </div>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={ticket.qr_code} size={180} />
            </div>
            <p className="text-xs text-muted-foreground">
              Présentez ce QR code au vendeur lors de votre visite.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="default" size="lg" className="w-full">
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
