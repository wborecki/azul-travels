import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchReservasDaFamilia,
  mapReservas,
  type ReservaVM,
} from "@/lib/queries";
import {
  RECURSO_KEYS_ORDENADAS,
  RECURSO_LABELS,
  type PerfilBoolKey,
} from "@/components/PerfilSensorialForm";
import type { Tables } from "@/integrations/supabase/types";
import { TEA_NIVEL_LABEL } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  MapPin,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta/")({
  component: Dashboard,
});

const DIAS_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];
const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function dataPorExtenso(): string {
  const d = new Date();
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

const STATUS_PILL: Record<ReservaVM["status"], string> = {
  pendente: "bg-warning text-warning-foreground",
  confirmada: "bg-success text-success-foreground",
  cancelada: "bg-destructive text-destructive-foreground",
  concluida: "bg-primary text-primary-foreground",
};

function Dashboard() {
  const { user } = useAuth();
  const [perfis, setPerfis] = useState<Tables<"perfil_sensorial">[]>([]);
  const [reservas, setReservas] = useState<ReservaVM[]>([]);
  const [avaliacoesCount, setAvaliacoesCount] = useState(0);
  const [reservasAtivasCount, setReservasAtivasCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const [perfisRes, reservasRows, avalCount, ativasCount] = await Promise.all([
          supabase
            .from("perfil_sensorial")
            .select("*")
            .eq("familia_id", user.id)
            .order("criado_em", { ascending: true }),
          fetchReservasDaFamilia(user.id),
          supabase
            .from("avaliacoes")
            .select("*", { count: "exact", head: true })
            .eq("familia_id", user.id),
          supabase
            .from("reservas")
            .select("*", { count: "exact", head: true })
            .eq("familia_id", user.id)
            .in("status", ["pendente", "confirmada"]),
        ]);
        if (perfisRes.error) throw perfisRes.error;
        setPerfis(perfisRes.data ?? []);
        setReservas(mapReservas(reservasRows));
        setAvaliacoesCount(avalCount.count ?? 0);
        setReservasAtivasCount(ativasCount.count ?? 0);
      } catch (err) {
        toast.error("Erro ao carregar dashboard", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    })();
  }, [user]);

  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const primeiroNome = (meta.nome_responsavel ?? user?.email ?? "Família").trim().split(/\s+/)[0];
  const ultimasReservas = useMemo(() => reservas.slice(0, 3), [reservas]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">
          Olá, {primeiroNome}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize-first">
          Hoje é {dataPorExtenso()}.
        </p>
      </div>

      {/* Banner: ainda sem perfil */}
      {perfis.length === 0 && (
        <div className="bg-teal-claro border border-secondary/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-primary">
              Você ainda não criou o perfil sensorial do seu filho.
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sem ele, não conseguimos sugerir destinos compatíveis.
            </p>
          </div>
          <Button asChild className="bg-secondary hover:bg-secondary/90 shrink-0">
            <Link to="/minha-conta/perfis">
              <UserPlus className="h-4 w-4 mr-1" /> Criar perfil agora
            </Link>
          </Button>
        </div>
      )}

      {/* Cards por criança */}
      {perfis.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {perfis.map((p) => (
            <PerfilCard key={p.id} perfil={p} />
          ))}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid sm:grid-cols-3 gap-3">
        <ResumoCard
          icon={<MapPin className="h-5 w-5" />}
          label="Reservas ativas"
          value={reservasAtivasCount}
        />
        <ResumoCard
          icon={<Star className="h-5 w-5" />}
          label="Avaliações feitas"
          value={avaliacoesCount}
        />
        <ResumoCard
          icon={<Users className="h-5 w-5" />}
          label="Perfis cadastrados"
          value={perfis.length}
        />
      </div>

      {/* Últimas reservas */}
      {ultimasReservas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-primary">Últimas reservas</h2>
            <Link
              to="/minha-conta/reservas"
              className="text-sm text-secondary font-medium hover:underline inline-flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="bg-card border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3 font-semibold">Estabelecimento</th>
                  <th className="p-3 font-semibold hidden sm:table-cell">Datas</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {ultimasReservas.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">
                      <div className="font-semibold text-primary text-sm">
                        {r.estabelecimento?.nome ?? "—"}
                      </div>
                      {r.estabelecimento?.localidade && (
                        <div className="text-xs text-muted-foreground">
                          {r.estabelecimento.localidade}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs hidden sm:table-cell">{r.periodoFormatado || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_PILL[r.status]}`}
                      >
                        {r.statusLabel}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/minha-conta/reservas">Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PerfilCard({ perfil }: { perfil: Tables<"perfil_sensorial"> }) {
  const ativos = RECURSO_KEYS_ORDENADAS.filter((k) => perfil[k] === true).slice(0, 4);
  const restantes = RECURSO_KEYS_ORDENADAS.filter((k) => perfil[k] === true).length - ativos.length;
  const nivelTxt = perfil.nivel_tea ? TEA_NIVEL_LABEL[perfil.nivel_tea] : null;

  return (
    <div className="bg-card border rounded-2xl p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-display font-bold text-lg text-primary">{perfil.nome_autista}</h3>
        <p className="text-xs text-muted-foreground">
          {perfil.idade ? `${perfil.idade} anos` : "Idade não informada"}
          {nivelTxt ? ` · Nível ${nivelTxt}` : ""}
        </p>
      </div>
      {ativos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ativos.map((k) => (
            <Chip key={k} label={RECURSO_LABELS[k as PerfilBoolKey]} />
          ))}
          {restantes > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary font-medium">
              +{restantes} mais
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1 mt-auto">
        <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90">
          <Link to="/explorar" search={{ perfil: perfil.id } as never}>
            Explorar destinos compatíveis
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/minha-conta/perfis">Editar perfil</Link>
        </Button>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-1 rounded-full bg-azul-claro text-primary font-medium">
      {label}
    </span>
  );
}

function ResumoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-card border rounded-2xl p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-azul-claro text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-primary">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
