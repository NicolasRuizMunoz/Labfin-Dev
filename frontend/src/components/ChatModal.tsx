// src/components/ChatModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, X } from "lucide-react";
import type { ChatMessage, ChatSession } from "@/types/chat";
import { createSession, listMessages, postUserMessage } from "@/services/chat";

type ChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Opcional: si pasas un sessionId reabrimos esa sesión, si no, creamos una nueva.
   */
  sessionId?: number;
  title?: string;
};

export default function ChatModal({ isOpen, onClose, sessionId, title = "Tax & Finance Coach" }: ChatModalProps) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  // Crear o cargar sesión al abrir
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!isOpen) return;
      try {
        if (sessionId) {
          // Ya existe (si quieres podrías fetch getSession aquí)
          setSession({ id: sessionId } as ChatSession);
          const hist = await listMessages(sessionId, { limit: 200, asc: true });
          if (!cancelled) setMessages(hist);
        } else {
          const s = await createSession("Nueva Conversación");
          if (!cancelled) {
            setSession(s);
            const hist = await listMessages(s.id, { limit: 200, asc: true });
            setMessages(hist);
          }
        }
      } catch (e) {
        console.error("Chat init error:", e);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [isOpen, sessionId]);

  const canSend = useMemo(() => input.trim().length > 0 && !!session && !pending, [input, session, pending]);

  async function handleSend() {
    if (!session) return;
    const text = input.trim();
    if (!text) return;

    // Optimista: muestra el mensaje del usuario
    const tempUser: ChatMessage = {
      id: Date.now(),
      role: "user",
      message: text,
      sources: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUser]);
    setInput("");
    setPending(true);

    try {
      // POST → devuelve la respuesta del asistente
      const assistant = await postUserMessage(session.id, text);
      setMessages((prev) => [...prev, assistant]);
    } catch (e) {
      console.error(e);
      // feedback simple
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        message: "Hubo un problema al procesar tu mensaje. Intenta nuevamente.",
        sources: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="px-6 py-4">
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={`${m.role}-${m.id}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow ${m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    <div className="whitespace-pre-wrap">{m.message}</div>
                    {m.sources?.length > 0 && (
                      <div className="mt-2 text-xs opacity-70">
                        Fuentes:{" "}
                        {m.sources.map((s, i) => (
                          <span key={i}>
                            {s.file_name}{s.page != null ? ` (p.${s.page})` : ""}{i < m.sources.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {pending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow bg-muted text-foreground rounded-bl-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pensando…
                  </div>
                </div>
              )}
              <div ref={listEndRef} />
            </div>
          </ScrollArea>

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Escribe tu mensaje…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={!canSend}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
