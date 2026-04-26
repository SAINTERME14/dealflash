import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Ticket = {
  id: string; user_id: string; subject: string; description: string;
  category: string; priority: string; status: string;
  created_at: string; updated_at: string;
};
type Message = {
  id: string; ticket_id: string; author_id: string;
  is_admin_reply: boolean; content: string; created_at: string;
};

export default function SupportTicket() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Ticket de support | DealFlash";
  }, []);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [tRes, mRes] = await Promise.all([
      supabase.from("support_tickets").select("*").eq("id", id).maybeSingle(),
      supabase.from("support_ticket_messages").select("*").eq("ticket_id", id).order("created_at"),
    ]);
    setTicket(tRes.data as Ticket | null);
    setMessages((mRes.data as Message[]) ?? []);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`support-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const send = async () => {
    if (!user || !ticket || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      author_id: user.id,
      is_admin_reply: isAdmin,
      content: reply.trim(),
    });
    if (error) { toast.error(error.message); setSending(false); return; }

    // Auto-update status
    const newStatus = isAdmin ? "waiting_user" : "in_progress";
    if (ticket.status !== newStatus && ticket.status !== "resolved" && ticket.status !== "closed") {
      await supabase.from("support_tickets").update({ status: newStatus }).eq("id", ticket.id);
    }
    setReply("");
    setSending(false);
    load();
  };

  const updateStatus = async (status: string) => {
    if (!ticket) return;
    const { error } = await supabase.from("support_tickets").update({ status: status as "open" | "in_progress" | "waiting_user" | "resolved" | "closed" }).eq("id", ticket.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Statut mis à jour");
    load();
  };

  if (loading) return <div className="container py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!ticket) return <div className="container py-8"><p>Ticket introuvable.</p></div>;

  return (
    <div className="container py-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(isAdmin ? "/admin/support" : "/support")} className="mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" />Retour
      </Button>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>{ticket.subject}</CardTitle>
            <Badge>{ticket.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Catégorie: {ticket.category} · Priorité: {ticket.priority}</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          {isAdmin && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Action admin:</span>
              <Select value={ticket.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="waiting_user">En attente user</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.is_admin_reply ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[75%] rounded-lg p-3 ${m.is_admin_reply ? "bg-secondary" : "bg-primary text-primary-foreground"}`}>
              <p className="text-xs opacity-70 mb-1">{m.is_admin_reply ? "Support" : "Vous"} · {format(new Date(m.created_at), "Pp", { locale: fr })}</p>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {ticket.status !== "closed" && (
        <div className="space-y-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Votre réponse…" rows={3} />
          <Button onClick={send} disabled={sending || !reply.trim()} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}Envoyer
          </Button>
        </div>
      )}
    </div>
  );
}
