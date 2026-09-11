import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Lock } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMensagensDaReserva,
  enviarMensagemReserva,
  marcarMensagensComoLidas,
  type ReservaMensagemRow,
} from "@/lib/queries";

interface ReservaChatProps {
  reservaId: string;
  currentUserId: string;
  encerrada?: boolean;
  onNovaMensagem?: (mensagem: ReservaMensagemRow) => void;
  onMarcadasComoLidas?: () => void;
}

function horaCurta(dataIso: string): string {
  return new Date(dataIso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ReservaChat({
  reservaId,
  currentUserId,
  encerrada = false,
  onNovaMensagem,
  onMarcadasComoLidas,
}: ReservaChatProps) {
  const [mensagens, setMensagens] = useState<ReservaMensagemRow[]>([]);
  const [primeiraNaoLidaId, setPrimeiraNaoLidaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [corpo, setCorpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef<HTMLDivElement | null>(null);
  const onNovaMensagemRef = useRef(onNovaMensagem);
  onNovaMensagemRef.current = onNovaMensagem;
  const onMarcadasComoLidasRef = useRef(onMarcadasComoLidas);
  onMarcadasComoLidasRef.current = onMarcadasComoLidas;

  useEffect(() => {
    let alive = true;
    setCarregando(true);
    void (async () => {
      try {
        const data = await fetchMensagensDaReserva(reservaId);
        if (!alive) return;
        setMensagens(data);
        const primeira = data.find((m) => m.autor_id !== currentUserId && !m.lida_em);
        setPrimeiraNaoLidaId(primeira?.id ?? null);
      } catch (err) {
        if (alive) {
          toast.error("Erro ao carregar mensagens", {
            description: err instanceof Error ? err.message : undefined,
          });
        }
      } finally {
        if (alive) setCarregando(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reservaId, currentUserId]);

  useEffect(() => {
    const channel = supabase
      .channel(`reserva_mensagens:${reservaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reserva_mensagens",
          filter: `reserva_id=eq.${reservaId}`,
        },
        (payload) => {
          const nova = payload.new as ReservaMensagemRow;
          setMensagens((atual) => (atual.some((m) => m.id === nova.id) ? atual : [...atual, nova]));
          if (nova.autor_id !== currentUserId) {
            onNovaMensagemRef.current?.(nova);
            void marcarMensagensComoLidas(reservaId, currentUserId)
              .then(() => onMarcadasComoLidasRef.current?.())
              .catch(() => {
                // best-effort
              });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reservaId, currentUserId]);

  useEffect(() => {
    if (carregando || !primeiraNaoLidaId) return;
    void marcarMensagensComoLidas(reservaId, currentUserId)
      .then(() => onMarcadasComoLidas?.())
      .catch(() => {
        // best-effort;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onMarcadasComoLidas só deve disparar quando a thread abre, não a cada render do pai
  }, [carregando, primeiraNaoLidaId, reservaId, currentUserId]);

  useEffect(() => {
    if (carregando) return;
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [carregando, mensagens.length]);

  const enviar = async () => {
    const texto = corpo.trim();
    if (!texto || encerrada) return;
    setEnviando(true);
    try {
      const nova = await enviarMensagemReserva({ reservaId, autorId: currentUserId, corpo: texto });
      setMensagens((atual) => [...atual, nova]);
      setCorpo("");
      onNovaMensagem?.(nova);
    } catch (err) {
      toast.error("Não foi possível enviar a mensagem", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {carregando ? (
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando mensagens…
          </div>
        ) : mensagens.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Envie a primeira para combinar os detalhes do acolhimento.
          </p>
        ) : (
          mensagens.map((m) => {
            const propria = m.autor_id === currentUserId;
            return (
              <div key={m.id}>
                {m.id === primeiraNaoLidaId && (
                  <div className="flex items-center gap-2 py-2">
                    <span className="h-px flex-1 bg-secondary/30" />
                    <span className="text-[10px] uppercase tracking-wide text-secondary font-semibold">
                      Novas mensagens
                    </span>
                    <span className="h-px flex-1 bg-secondary/30" />
                  </div>
                )}
                <div className={cn("flex", propria ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                      propria
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.corpo}
                    <div
                      className={cn(
                        "text-[10px] mt-1 text-right",
                        propria ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {horaCurta(m.criado_em)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={fimRef} />
      </div>

      {encerrada ? (
        <p className="shrink-0 mx-4 sm:mx-6 mb-4 text-sm text-muted-foreground inline-flex items-center gap-1.5 bg-muted/40 rounded-xl px-3 py-2.5">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Esta reserva foi finalizada e a conversa não aceita mais mensagens.
        </p>
      ) : (
        <div className="shrink-0 border-t px-4 sm:px-6 py-4 flex gap-3 items-end">
          <Textarea
            rows={1}
            placeholder="Escreva uma mensagem…"
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void enviar();
              }
            }}
            className="min-h-11 max-h-40 resize-none rounded-2xl bg-muted/40 border-transparent focus-visible:ring-1 focus-visible:ring-primary py-3"
          />
          <button
            onClick={() => void enviar()}
            disabled={enviando || !corpo.trim()}
            aria-label="Enviar mensagem"
            className="shrink-0 h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
