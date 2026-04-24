import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { fr } from "date-fns/locale";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

interface Props {
  listingId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AvailabilityDialog({ listingId, open, onOpenChange }: Props) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");

  const load = async () => {
    if (!date) return;
    const dateStr = date.toISOString().slice(0, 10);
    const { data } = await supabase.from("listing_availability")
      .select("id, slot_date, start_time, end_time")
      .eq("listing_id", listingId)
      .eq("slot_date", dateStr)
      .order("start_time");
    setSlots(data ?? []);
  };

  useEffect(() => { if (open) load(); }, [open, date, listingId]);

  const addSlot = async () => {
    if (!date) return;
    if (slots.length >= 8) { toast.error("Maximum 8 créneaux par jour"); return; }
    setLoading(true);
    const { error } = await supabase.from("listing_availability").insert({
      listing_id: listingId,
      slot_date: date.toISOString().slice(0, 10),
      start_time: start,
      end_time: end,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Créneau ajouté"); load(); }
  };

  const removeSlot = async (id: string) => {
    const { error } = await supabase.from("listing_availability").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurer les créneaux de visite</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-2">Date</p>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={fr}
              disabled={{ before: new Date() }}
              className="rounded-md border"
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Créneaux pour le {date?.toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}
            </p>

            <div className="flex gap-2 mb-3">
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="flex-1" />
              <span className="self-center">→</span>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="flex-1" />
              <Button onClick={addSlot} variant="hero" size="icon" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              {slots.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">Aucun créneau pour cette date.</p>
              ) : (
                slots.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded border border-border">
                    <span className="text-sm">{s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}</span>
                    <Button onClick={() => removeSlot(s.id)} variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
