import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface Thread {
  other_id: string;
  other_name: string;
  listing_id: string | null;
  listing_title: string | null;
  last_message: string;
  last_at: string;
  unread: number;
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<{ otherId: string; listingId: string | null } | null>(null);
  const [otherName, setOtherName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Messages — Boardeal"; }, []);

  // Build threads from messages
  const loadThreads = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("id, content, sender_id, recipient_id, listing_id, is_read, created_at, listings(title)")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const map = new Map<string, Thread>();
    type RawMessage = {
      id: string; content: string; sender_id: string; recipient_id: string;
      listing_id: string | null; is_read: boolean; created_at: string;
      listings: { title: string } | null;
    };
    for (const m of (data ?? []) as RawMessage[]) {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const key = `${otherId}-${m.listing_id ?? 'none'}`;
      if (!map.has(key)) {
        map.set(key, {
          other_id: otherId,
          other_name: "",
          listing_id: m.listing_id,
          listing_title: m.listings?.title ?? null,
          last_message: m.content,
          last_at: m.created_at,
          unread: 0,
        });
      }
      if (!m.is_read && m.recipient_id === user.id) {
        map.get(key)!.unread++;
      }
    }

    const list = Array.from(map.values());
    // fetch profile names
    const ids = [...new Set(list.map((t) => t.other_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", ids);
      const nameMap = new Map((profs ?? []).map((p) => [p.user_id, p.display_name ?? "Utilisateur"]));
      list.forEach((t) => { t.other_name = nameMap.get(t.other_id) ?? "Utilisateur"; });
    }
    setThreads(list);
    setLoading(false);
  };

  useEffect(() => { loadThreads(); }, [user]);

  // Open thread from URL ?to=
  useEffect(() => {
    const to = searchParams.get("to");
    const lid = searchParams.get("listing");
    if (to && user && to !== user.id) {
      setActive({ otherId: to, listingId: lid });
    }
  }, [searchParams, user]);

  // Load messages for active thread + realtime
  useEffect(() => {
    if (!active || !user) return;
    (async () => {
      const { data: prof } = await supabase.from("public_profiles").select("display_name").eq("user_id", active.otherId).maybeSingle();
      setOtherName(prof?.display_name ?? "Utilisateur");

      let q = supabase.from("messages").select("id, content, sender_id, created_at")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${active.otherId}),and(sender_id.eq.${active.otherId},recipient_id.eq.${user.id})`)
        .order("created_at");
      if (active.listingId) q = q.eq("listing_id", active.listingId);
      const { data } = await q;
      setMessages(data ?? []);

      // mark as read
      await supabase.from("messages").update({ is_read: true })
        .eq("recipient_id", user.id).eq("sender_id", active.otherId).eq("is_read", false);
    })();

    const channel = supabase.channel(`messages-${active.otherId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (payload) => {
        const m = payload.new as Message & { recipient_id: string };
        const involves = (m.sender_id === user.id && m.recipient_id === active.otherId) ||
                         (m.sender_id === active.otherId && m.recipient_id === user.id);
        if (involves) setMessages((prev) => [...prev, m]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [active, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !active || !content.trim()) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: active.otherId,
      listing_id: active.listingId,
      content: content.trim(),
    });
    if (error) toast.error(error.message);
    else { setContent(""); loadThreads(); }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[600px]">
        <Card className="overflow-y-auto">
          {loading ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : threads.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Aucune conversation.</p>
          ) : (
            threads.map((t) => (
              <button
                key={`${t.other_id}-${t.listing_id ?? 'none'}`}
                onClick={() => setActive({ otherId: t.other_id, listingId: t.listing_id })}
                className={`w-full text-left p-4 border-b border-border hover:bg-secondary transition-smooth ${
                  active?.otherId === t.other_id && active?.listingId === t.listing_id ? "bg-secondary" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{t.other_name}</p>
                  {t.unread > 0 && <span className="h-5 w-5 rounded-full gradient-accent text-accent-foreground text-xs flex items-center justify-center">{t.unread}</span>}
                </div>
                {t.listing_title && <p className="text-xs text-muted-foreground truncate">{t.listing_title}</p>}
                <p className="text-xs text-muted-foreground truncate mt-1">{t.last_message}</p>
              </button>
            ))
          )}
        </Card>

        <Card className="flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Sélectionnez une conversation
            </div>
          ) : (
            <>
              <div className="border-b border-border p-4">
                <p className="font-medium">{otherName}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      m.sender_id === user?.id
                        ? 'gradient-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
                <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Écrire un message…" />
                <Button type="submit" variant="hero" size="icon" disabled={!content.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
