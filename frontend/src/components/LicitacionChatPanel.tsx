import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Loader2, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage, ChatSession } from "@/types/chat";
import {
  getOrCreateLicitacionSession,
  listMessages,
  postUserMessage,
} from "@/services/chat";

const DOT_PATTERN_STYLE = { backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' } as const;

type Props = {
  licitacionId: number;
  licitacionNombre?: string;
  onClose: () => void;
};

export default function LicitacionChatPanel({ licitacionId, licitacionNombre, onClose }: Props) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  // Inicializar sesión al montar
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setInitError(null);
      try {
        const s = await getOrCreateLicitacionSession(
          licitacionId,
          licitacionNombre ? `Chat: ${licitacionNombre}` : undefined
        );
        if (cancelled) return;
        setSession(s);
        const hist = await listMessages(s.id, { limit: 200, asc: true });
        if (!cancelled) setMessages(hist);
      } catch (e: any) {
        if (!cancelled) setInitError(e?.message ?? "No se pudo iniciar el chat");
      }
    }
    init();
    return () => { cancelled = true; };
  }, [licitacionId, licitacionNombre]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !!session && !pending,
    [input, session, pending]
  );

  async function handleSend() {
    if (!session || !canSend) return;
    const text = input.trim();

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
      const assistant = await postUserMessage(session.id, text);
      setMessages((prev) => [...prev, assistant]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          message: "Hubo un problema al procesar tu mensaje. Intenta nuevamente.",
          sources: [],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  }

  return (
    <aside className="flex flex-col h-full bg-card">
      {/* ── Hero banner ── */}
      <div className="relative h-28 shrink-0 bg-gradient-hero flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={DOT_PATTERN_STYLE} />
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-medium text-white/80 tracking-wide">EVA Assistant</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">Chat con EVA</p>
          {licitacionNombre && (
            <p className="text-xs text-muted-foreground truncate">{licitacionNombre}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Mensajes ──────────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {!session && !initError && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {initError && (
            <div className="text-xs text-destructive text-center py-4 space-y-2">
              <p>{initError}</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => { setInitError(null); setSession(null); }}
              >
                <RefreshCw className="w-3 h-3" /> Reintentar
              </Button>
            </div>
          )}

          {session && messages.length === 0 && !pending && (
            <div className="text-center py-8 space-y-2">
              <Bot className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                Hola, soy EVA. Pregúntame sobre esta licitación o cualquier documento de tu organización.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={`${m.role}-${m.id}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.message}</div>
                {m.sources?.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-current/10 text-[11px] opacity-60 space-y-0.5">
                    {m.sources.map((s, i) => (
                      <div key={i}>
                        {s.file_name}{s.page != null ? ` (p.${s.page})` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm bg-muted text-foreground shadow-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs text-muted-foreground">EVA está pensando…</span>
              </div>
            </div>
          )}

          <div ref={listEndRef} />
        </div>
      </ScrollArea>

      {/* ── Input ── */}
      <div className="p-3 border-t border-border/40 shrink-0 bg-card">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 min-h-[36px] max-h-32 resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
            placeholder="Escribe tu consulta… (Enter para enviar)"
            value={input}
            disabled={!session || pending}
            onChange={(e) => {
              setInput(e.target.value);
              // auto-resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
            }}
            onKeyDown={handleKeyDown}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={!canSend}
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Shift+Enter para salto de línea
        </p>
      </div>
    </aside>
  );
}
