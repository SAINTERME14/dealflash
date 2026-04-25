import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  const [confirmCode, setConfirmCode] = useState<string>("");
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", message: "" });

  useEffect(() => {
    if (!open) {
      setStep(1); setDate(undefined); setSelectedSlot(null); setConfirmCode("");
    } else if (user) {
      // prefill email from auth
      setForm((f) => ({ ...f, email: user.email ?? "" }));
      // load profile for prefill
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

  // Load available slots when date changes
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

      // filter out slots already booked (confirmed or pending)
      const slotIds = (data ?? []).map((s) => `${s.slot_date}-${s.start_time}`);
      const { data: booked } = await supabase
        .from("bookings")
        .select("slot_date, start_time")
        .eq("listing_id", listing.id)
        .eq("slot_date", dateStr)
        .in("status", ["pending", "confirmed"]);
      const bookedKeys = new Set((booked ?? []).map((b) => `${b.slot_date}-${b.start_time}`));
      setSlots((data ?? []).filter((s) => !bookedKeys.has(`${s.slot_date}-${s.start_time}`)));
    })();
  }, [date, listing.id]);

  const handleConfirm = async () => {
    if (!user || !selectedSlot) return;
    setLoading(true);
    const { data, error } = await supabase.from("bookings").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      slot_date: selectedSlot.slot_date,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      buyer_first_name: form.first_name,
      buyer_last_name: form.last_name,
      buyer_phone: form.phone,
      buyer_email: form.email,
      message: form.message || null,
      status: 'pending',
    }).select("confirmation_code").single();
    setLoading(false);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      setConfirmCode(data.confirmation_code);
      setStep(4);
    }
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
            <span className="ml-auto text-sm font-normal text-muted-foreground">Étape {step}/4</span>
          </DialogTitle>
        </DialogHeader>

        {/* Step 1 — date */}
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

        {/* Step 2 — slot */}
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

        {/* Step 3 — coordinates */}
        {step === 3 && (
          <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} className="space-y-3">
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
              Confirmer la réservation
            </Button>
          </form>
        )}

        {/* Step 4 — confirmation */}
        {step === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-success text-success-foreground flex items-center justify-center">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Réservation confirmée !</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Votre code de confirmation
              </p>
              <p className="font-mono font-bold text-xl text-accent mt-2">{confirmCode}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Le vendeur recevra votre demande et vous contactera pour confirmer.
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
