import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export default function DropshipAiAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Bonjour 👋 Je suis votre assistant IA dropshipping Boardeal. Je peux vous aider à trouver les produits tendances, créer une boutique, fixer vos prix et rédiger vos fiches. Que voulez-vous faire ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("ai_assistant_conversations" as any)
        .insert({ user_id: u.user.id, title: "Session " + new Date().toLocaleString() })
        .select("id").single();
      if (data) setConvId((data as any).id);
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dropship-ai-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, conversationId: convId }),
      });
      if (resp.status === 429) { toast.error("Trop de requêtes, réessayez."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("Crédits IA épuisés."); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error("Erreur IA"); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", acc = "", done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, i); buf = buf.slice(i + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) {
              acc += c;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      // persist assistant message
      if (convId && acc) {
        await supabase.from("ai_assistant_messages" as any).insert({
          conversation_id: convId, role: "assistant", content: acc,
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const quick = (q: string) => { setInput(q); setTimeout(send, 50); };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Assistant IA dropshipping</h1>
      </div>
      <p className="text-sm text-muted-foreground">Posez vos questions, demandez les meilleures niches, faites scorer un produit.</p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => quick("Quels sont les 5 meilleurs produits tendances à vendre en ce moment ?")}><Sparkles className="h-3 w-3 mr-1" />Top tendances</Button>
        <Button size="sm" variant="outline" onClick={() => quick("Suggère-moi une niche dropshipping rentable pour 2026.")}>Idée de niche</Button>
        <Button size="sm" variant="outline" onClick={() => quick("Comment calculer ma marge sur un produit CJ à 12 $ ?")}>Calcul de marge</Button>
      </div>

      <Card className="p-4 h-[55vh] overflow-y-auto space-y-3" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content || (loading && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : "")}
            </div>
          </div>
        ))}
      </Card>

      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Votre message..." disabled={loading} />
        <Button onClick={send} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
