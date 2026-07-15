import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchReservaDaFamiliaPorId,
  perfisDaReserva,
  type ReservaComContexto,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BedDouble,
  Clock,
  ExternalLink,
  Gift,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { formatDateBR } from "@/lib/brazil";
import { RESERVA_STATUS_LABEL } from "@/lib/enums";
import { ItemReservadoFotos } from "@/components/reserva/ItemReservadoFotos";
import { MarkdownView } from "@/components/MarkdownView";
import { COMODIDADE_POR_KEY } from "@/lib/itens-comodidades";

export const Route = createFileRoute("/minha-conta/reservas/$id")({
  component: ReservaDetalhe,
});

interface Acomp {
  nome: string;
  idade?: number | null;
  parentesco?: string | null;
}

const RECURSOS_TEA_ESTAB = [
  { key: "tem_sala_sensorial", label: "Sala Sensorial" },
  { key: "tem_concierge_tea", label: "Concierge TEA" },
  { key: "tem_checkin_antecipado", label: "Check-in Antecipado" },
  { key: "tem_fila_prioritaria", label: "Fila Prioritária" },
  { key: "tem_cardapio_visual", label: "Cardápio Visual" },
  { key: "tem_caa", label: "Comunicação Alternativa (CAA)" },
] as const;

function ReservaDetalhe() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [reserva, setReserva] = useState<ReservaComContexto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchReservaDaFamiliaPorId(id, user.id)
      .then((data) => {
        if (alive) setReserva(data);
      })
      .catch(() => {
        if (alive) setReserva(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="text-muted-foreground inline-flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="bg-white border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Reserva não encontrada.</p>
        <Button asChild className="mt-4">
          <Link to="/minha-conta/reservas">Voltar</Link>
        </Button>
      </div>
    );
  }

  const acomp = (reserva.acompanhantes ?? []) as unknown as Acomp[];
  const perfisEnviados = perfisDaReserva(reserva);

  const estab = reserva.estabelecimentos;
  const item = reserva.itens_reservaveis;
  // Endereço do quarto quando ele tem endereço próprio; senão, o do estabelecimento.
  const cidade = (item?.usa_endereco_proprio ? item.cidade : null) ?? estab?.cidade;
  const estado = (item?.usa_endereco_proprio ? item.estado : null) ?? estab?.estado;
  const enderecoItem = item?.usa_endereco_proprio ? item.endereco : null;
  const comodidades = (item?.comodidades ?? []).filter((key) => COMODIDADE_POR_KEY[key]);
  const recursosTea = estab ? RECURSOS_TEA_ESTAB.filter((r) => estab[r.key]) : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/minha-conta/reservas"
          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar para reservas
        </Link>
        <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
          <h1 className="text-3xl font-display font-bold text-primary">
            {item?.nome ?? estab?.nome ?? "Reserva"}
          </h1>
          <span className="text-[11px] uppercase font-semibold px-2 py-1 rounded-full bg-azul-claro text-primary">
            {RESERVA_STATUS_LABEL[reserva.status ?? "pendente"]}
          </span>
        </div>
        {(estab || cidade) && (
          <p className="text-sm text-muted-foreground mt-1">
            {estab?.nome}
            {estab && cidade ? " · " : ""}
            {[cidade, estado].filter(Boolean).join("/")}
          </p>
        )}
      </div>

      {/* O que foi reservado */}
      {item && (
        <div className="bg-white border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-display font-bold text-primary">O que você reservou</h2>
            <Link
              to="/quartos/$id"
              params={{ id: item.id }}
              className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Ver página do quarto
            </Link>
          </div>

          <ItemReservadoFotos imagens={item.imagens} titulo={item.nome} alturaClassName="h-56" />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Até {item.capacidade_total} pessoa(s)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="h-4 w-4" /> {item.quantidade_camas} cama(s)
            </span>
            {(item.check_in_padrao || item.check_out_padrao) && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {item.check_in_padrao && `Check-in ${item.check_in_padrao.slice(0, 5)}`}
                {item.check_in_padrao && item.check_out_padrao && " · "}
                {item.check_out_padrao && `Check-out ${item.check_out_padrao.slice(0, 5)}`}
              </span>
            )}
            {(enderecoItem || cidade) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {enderecoItem ?? [cidade, estado].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          {item.descricao?.trim() && (
            <div className="border-t pt-4">
              <MarkdownView source={item.descricao} />
            </div>
          )}

          {comodidades.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-primary mb-2">
                O que este quarto oferece
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {comodidades.map((key) => (
                  <span
                    key={key}
                    className="text-xs font-medium bg-azul-claro text-primary px-2.5 py-1 rounded-full"
                  >
                    {COMODIDADE_POR_KEY[key].label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acolhimento TEA do estabelecimento */}
      {(recursosTea.length > 0 || (estab?.tem_beneficio_tea && estab.beneficio_tea_descricao)) && (
        <div className="bg-white border border-secondary/20 rounded-2xl p-5 space-y-3">
          <h2 className="font-display font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" /> Acolhimento TEA do estabelecimento
          </h2>
          {recursosTea.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recursosTea.map((r) => (
                <span
                  key={r.key}
                  className="text-xs font-medium bg-teal-claro text-primary px-2.5 py-1 rounded-full"
                >
                  {r.label}
                </span>
              ))}
            </div>
          )}
          {estab?.tem_beneficio_tea && estab.beneficio_tea_descricao && (
            <p className="text-sm text-foreground/80 flex items-start gap-2 rounded-xl bg-success/10 border border-success/30 p-3">
              <Gift className="h-4 w-4 mt-0.5 shrink-0 text-success" />
              <span>{estab.beneficio_tea_descricao}</span>
            </p>
          )}
        </div>
      )}

      <div className="bg-white border rounded-2xl p-5 space-y-2">
        <h2 className="font-display font-bold text-primary">Datas</h2>
        <p className="text-sm">
          {reserva.data_checkin ? formatDateBR(reserva.data_checkin) : "-"} →{" "}
          {reserva.data_checkout ? formatDateBR(reserva.data_checkout) : "-"}
        </p>
      </div>

      {reserva.objetivo && (
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary">Objetivo</h2>
          <p className="text-sm mt-1 text-foreground/90">{reserva.objetivo}</p>
        </div>
      )}

      {reserva.mensagem && (
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary">Notas desta estadia</h2>
          <p className="text-sm mt-1 text-foreground/90 whitespace-pre-line">
            {reserva.mensagem}
          </p>
        </div>
      )}

      {acomp.length > 0 && (
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary">Acompanhantes</h2>
          <ul className="mt-2 text-sm space-y-1">
            {acomp.map((a, i) => (
              <li key={i}>
                <strong>{a.nome}</strong>
                {a.idade ? `, ${a.idade} anos` : ""}
                {a.parentesco ? ` · ${a.parentesco}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {perfisEnviados.length > 0 && (
        <div className="bg-azul-claro/40 border border-primary/20 rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary">
            {perfisEnviados.length === 1
              ? "Perfil TEA enviado"
              : `Perfis TEA enviados (${perfisEnviados.length})`}
          </h2>
          <ul className="mt-2 space-y-2">
            {perfisEnviados.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-white grid place-items-center shrink-0 border border-primary/20">
                  {p.foto_url ? (
                    <img
                      src={p.foto_url}
                      alt={`Foto de ${p.nome_autista}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display font-bold text-primary text-sm">
                      {p.nome_autista.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-primary">{p.nome_autista}</span>
                  <span className="text-foreground/80">
                    {p.idade ? ` · ${p.idade} anos` : ""}
                    {p.nivel_tea ? ` · Nível ${p.nivel_tea}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/minha-conta/perfil"
            className="text-xs text-secondary hover:underline mt-3 inline-block"
          >
            Ver / editar perfis →
          </Link>
        </div>
      )}

      <div className="bg-white border rounded-2xl p-5">
        <Link
          to="/minha-conta/mensagens"
          search={{ reserva: reserva.id }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <MessageSquare className="h-4 w-4" /> Ver conversa com o estabelecimento
        </Link>
      </div>
    </div>
  );
}
