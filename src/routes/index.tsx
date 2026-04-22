import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/Reveal";
import { useCountUp } from "@/hooks/useReveal";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchEstabelecimentosView,
  fetchPerfisCompletos,
  mapEstabCard,
  type EstabCardVM,
  type EstabelecimentoView,
  type PerfilSensorial,
} from "@/lib/queries";
import { filtroConteudoPublico } from "@/lib/conteudoPublico";
import {
  Search,
  ShieldCheck,
  Award,
  Home as HomeIcon,
  Heart,
  Gift,
  Star,
  ArrowRight,
  Sparkles,
  Calendar,
  ChevronDown,
  UserPlus,
  MapPinned,
  HeartHandshake,
  Plane,
  Quote,
  CheckCircle2,
  MapPin,
  BellRing,
  Utensils,
  DoorOpen,
} from "lucide-react";
import heroImg from "@/assets/hero-familia-viagem.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turismo Azul — Viajar com autismo, com confiança" },
      {
        name: "description",
        content:
          "Marketplace pioneiro de turismo inclusivo para famílias TEA. Hotéis, restaurantes e parques certificados, com perfil sensorial enviado ao estabelecimento.",
      },
      { property: "og:title", content: "Turismo Azul" },
      {
        property: "og:description",
        content: "Viajar com autismo. Com confiança, com conforto, com alegria.",
      },
    ],
  }),
  component: Landing,
});

// ─────────────────────────────────────────────────────────────────────────────
// Tipos auxiliares
// ─────────────────────────────────────────────────────────────────────────────

interface ArtigoCard {
  slug: string;
  titulo: string;
  resumo: string | null;
  foto_capa: string | null;
  categoria: string | null;
  criado_em: string;
}

type CategoriaCor = "primary" | "secondary" | "success" | "amarelo" | "roxo-suave";

const CATEGORIA_COR: Record<string, { bg: string; label: string }> = {
  legislacao: { bg: "bg-primary text-primary-foreground", label: "Legislação" },
  dicas_viagem: { bg: "bg-secondary text-secondary-foreground", label: "Dicas de viagem" },
  boas_praticas: { bg: "bg-success text-success-foreground", label: "Boas práticas" },
  novidades: { bg: "bg-amarelo text-amarelo-foreground", label: "Novidades" },
  destinos: { bg: "bg-roxo-suave text-roxo-suave-foreground", label: "Destinos" },
};
// (CategoriaCor declarada para documentar o domínio; não usada em runtime)
void (null as unknown as CategoriaCor);

interface Depoimento {
  nome: string;
  cidade: string;
  filhoNome: string;
  filhoIdade: number;
  papel: "Mãe" | "Pai" | "Mãe e Pai";
  texto: string;
  estabSlug?: string;
  estabNome?: string;
}

const DEPOIMENTOS_SEED: Depoimento[] = [
  {
    nome: "Mariana",
    cidade: "Curitiba",
    filhoNome: "Enzo",
    filhoIdade: 7,
    papel: "Mãe",
    texto:
      "Nunca achei que conseguiríamos viajar de verdade. No hotel que encontramos aqui, o pessoal já sabia do perfil do Enzo antes de chegar. Foi a primeira vez que ele dormiu tranquilo fora de casa.",
  },
  {
    nome: "Carlos e Renata",
    cidade: "São Paulo",
    filhoNome: "Sofia",
    filhoIdade: 9,
    papel: "Mãe e Pai",
    texto:
      "A sala sensorial do resort salvou nossa viagem. Quando ficou muito barulhento na piscina, a Sofia teve um lugar seguro para se reequilibrar. Voltamos mês que vem.",
  },
  {
    nome: "Patrícia",
    cidade: "Porto Alegre",
    filhoNome: "João",
    filhoIdade: 11,
    papel: "Mãe",
    texto:
      "Não precisamos mais ligar para 40 hotéis explicando o autismo do João. A plataforma já filtra. Simplesmente funciona.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Compatibilidade entre perfil sensorial × estabelecimento
// ─────────────────────────────────────────────────────────────────────────────

const PARES_COMPAT: Array<[keyof PerfilSensorial, keyof EstabelecimentoView]> = [
  ["precisa_sala_sensorial", "tem_sala_sensorial"],
  ["precisa_concierge_tea", "tem_concierge_tea"],
  ["precisa_checkin_antecipado", "tem_checkin_antecipado"],
  ["precisa_fila_prioritaria", "tem_fila_prioritaria"],
  ["precisa_cardapio_visual", "tem_cardapio_visual"],
];

function calcularCompatibilidade(
  perfil: PerfilSensorial | null,
  estab: EstabelecimentoView,
): number | null {
  if (!perfil) return null;
  const necessidades = PARES_COMPAT.filter(([p]) => perfil[p] === true);
  if (necessidades.length === 0) return null;
  const atendidas = necessidades.filter(([, e]) => estab[e] === true).length;
  return Math.round((atendidas / necessidades.length) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing
// ─────────────────────────────────────────────────────────────────────────────

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const [destaques, setDestaques] = useState<EstabelecimentoView[] | null>(null);
  const [beneficios, setBeneficios] = useState<EstabelecimentoView[] | null>(null);
  const [artigos, setArtigos] = useState<ArtigoCard[] | null>(null);
  const [perfilPrincipal, setPerfilPrincipal] = useState<PerfilSensorial | null>(null);
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>(DEPOIMENTOS_SEED);

  // Carrega dados públicos
  useEffect(() => {
    void (async () => {
      const [dDestaque, b] = await Promise.all([
        fetchEstabelecimentosView({ apenasDestaque: true, pagina: 1, tamanhoPagina: 6 }),
        fetchEstabelecimentosView({ apenasComBeneficio: true, pagina: 1, tamanhoPagina: 3 }),
      ]);

      // Garante 6 cards no grid (3x2 desktop / 2x3 tablet) — sem card sozinho
      // na última linha. Se houver menos de 6 com destaque=true, completa
      // com os demais ativos mais recentes.
      let d = dDestaque;
      if (d.length < 6) {
        const faltam = 6 - d.length;
        const idsExcluir = d.map((x) => x.id);
        const extras = await fetchEstabelecimentosView({
          pagina: 1,
          tamanhoPagina: faltam + idsExcluir.length,
        });
        const complemento = extras.filter((x) => !idsExcluir.includes(x.id)).slice(0, faltam);
        d = [...d, ...complemento];
      }
      setDestaques(d);
      setBeneficios(b);


      const { data: a } = await supabase
        .from("conteudo_tea")
        .select("slug,titulo,resumo,foto_capa,categoria,criado_em")
        .or(filtroConteudoPublico())
        .order("criado_em", { ascending: false })
        .limit(3);
      setArtigos(a ?? []);

      // Depoimentos reais (5 estrelas, públicos), com nome do estab
      const { data: avs } = await supabase
        .from("avaliacoes")
        .select(
          "id, comentario, criado_em, nota_geral, familia_profiles(nome_responsavel, cidade), estabelecimentos(nome, slug)",
        )
        .eq("publica", true)
        .eq("nota_geral", 5)
        .not("comentario", "is", null)
        .order("criado_em", { ascending: false })
        .limit(3);

      if (avs && avs.length >= 3) {
        const reais: Depoimento[] = avs.flatMap((row) => {
          const nomeResp = (row.familia_profiles as { nome_responsavel?: string | null } | null)
            ?.nome_responsavel;
          const cidade = (row.familia_profiles as { cidade?: string | null } | null)?.cidade;
          const estab = row.estabelecimentos as { nome?: string; slug?: string } | null;
          if (!row.comentario) return [];
          return [
            {
              nome: nomeResp?.split(/\s+/)[0] ?? "Família",
              cidade: cidade ?? "Brasil",
              filhoNome: "—",
              filhoIdade: 0,
              papel: "Mãe",
              texto: row.comentario,
              estabNome: estab?.nome,
              estabSlug: estab?.slug,
            },
          ];
        });
        if (reais.length >= 3) setDepoimentos(reais);
      }
    })();
  }, []);

  // Carrega perfil principal do usuário logado (para compatibilidade)
  useEffect(() => {
    if (!user) {
      setPerfilPrincipal(null);
      return;
    }
    void (async () => {
      const perfis = await fetchPerfisCompletos(user.id).catch(() => []);
      setPerfilPrincipal(perfis[0] ?? null);
    })();
  }, [user]);

  /**
   * Roteamento contextual do CTA "criar perfil sensorial":
   *   - sem login → /cadastro
   *   - logado, sem perfil → /minha-conta/perfil-sensorial
   *   - logado, com perfil → /explorar (já pode usar a plataforma)
   */
  const goCriarPerfil = useCallback(() => {
    if (!user) {
      void navigate({ to: "/cadastro" });
      return;
    }
    if (!perfilPrincipal) {
      void navigate({ to: "/minha-conta/perfil-sensorial" });
      return;
    }
    void navigate({ to: "/explorar" });
  }, [user, perfilPrincipal, navigate]);

  return (
    <div>
      <Hero busca={busca} setBusca={setBusca} />
      <ComoFunciona />
      <SelosImportantes />
      <DestinosDestaque
        destaques={destaques}
        perfil={perfilPrincipal}
        userLogado={!!user}
        onCriarPerfil={goCriarPerfil}
      />
      <Depoimentos depoimentos={depoimentos} />
      <BeneficiosTea beneficios={beneficios} />
      <BlogTeaser artigos={artigos} />
      <CtaFinal onCriarPerfil={goCriarPerfil} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ busca, setBusca }: { busca: string; setBusca: (v: string) => void }) {
  const navigate = useNavigate();
  return (
    <section id="hero" className="relative overflow-hidden">
      <img
        src={heroImg}
        alt="Família brasileira diversa caminhando feliz em uma praia tropical ao entardecer"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center 30%" }}
        width={1920}
        height={1280}
      />
      {/* Overlay azul-navy para garantir contraste com texto branco */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(27, 46, 75, 0.60) 0%, rgba(27, 46, 75, 0.45) 50%, rgba(27, 46, 75, 0.65) 100%)",
        }}
      />

      <div className="relative container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-3xl mx-auto text-center text-white animate-fade-up">
          <span className="badge-shimmer inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold border border-white/25">
            <Sparkles className="h-3.5 w-3.5 text-amarelo" />
            ✦ O 1º marketplace de turismo TEA do Brasil
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-display font-extrabold leading-[1.05] text-shadow-soft">
            Sua família também
            <br />
            <span className="text-secondary">merece viajar.</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
            Encontre hotéis, restaurantes e parques que já sabem como cuidar do seu filho — antes
            mesmo de vocês chegarem.
          </p>

          {/* Busca */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = busca.trim();
              void navigate({
                to: "/explorar",
                search: q ? { q } : {},
              });
            }}
            className="mt-8 bg-white rounded-2xl p-2 shadow-elegant flex items-center gap-2 max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Para onde sua família quer ir?"
                className="border-0 shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                aria-label="Buscar destinos"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="rounded-xl bg-primary hover:bg-primary/90 px-6 min-h-[44px]"
            >
              Buscar destinos
            </Button>
          </form>

          {/* Chips — passam o tipo via array (filtro multi-tipo do /explorar) */}
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {[
              { label: "🏨 Hotéis", q: "hotel" as const },
              { label: "🍽️ Restaurantes", q: "restaurante" as const },
              { label: "🎡 Parques", q: "parque" as const },
              { label: "🌊 Resorts", q: "resort" as const },
              { label: "🌳 Pousadas", q: "pousada" as const },
            ].map((c) => (
              <Link
                key={c.q}
                to="/explorar"
                search={{ tipos: [c.q] }}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-medium border border-white/20 transition min-h-[44px] inline-flex items-center"
              >
                {c.label}
              </Link>
            ))}
          </div>

          {/* Indicadores com contador animado */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-xl mx-auto text-center">
            <Counter target={247} suffix="" label="Destinos verificados" />
            <Counter target={12} suffix="" label="Estados do Brasil" />
            <Counter target={4.8} decimals={1} suffix="★" label="Avaliação média das famílias" />
          </div>

          {/* Scroll indicator — scroll suave até a seção "Como funciona" */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("como-funciona")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="mt-14 inline-flex flex-col items-center gap-1 text-white/80 hover:text-white text-xs font-medium animate-scroll-hint cursor-pointer"
            aria-label="Veja como funciona — rolar para a seção"
          >
            <span>↓ Veja como funciona</span>
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Counter({
  target,
  suffix = "",
  decimals = 0,
  label,
}: {
  target: number;
  suffix?: string;
  decimals?: number;
  label: string;
}) {
  const { ref, value } = useCountUp(target, 1500);
  const display = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toString();
  return (
    <div ref={ref}>
      <div className="text-2xl md:text-3xl font-display font-bold text-secondary tabular-nums">
        {display}
        {suffix}
      </div>
      <div className="text-xs text-white/75 mt-1">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMO FUNCIONA
// ─────────────────────────────────────────────────────────────────────────────

function ComoFunciona() {
  const steps = [
    {
      n: "01",
      Icon: UserPlus,
      titulo: "Conte sobre o seu filho",
      texto:
        "Sensibilidades, preferências, o que funciona e o que não funciona. Leva 3 minutos — e muda completamente como você planeja viagens.",
    },
    {
      n: "02",
      Icon: MapPinned,
      titulo: "Veja destinos feitos para ele",
      texto:
        "Nada de ligar para dezenas de hotéis explicando o autismo. A plataforma filtra e sugere só os lugares que estão prontos para receber o seu filho.",
    },
    {
      n: "03",
      Icon: HeartHandshake,
      titulo: "Chegue. Eles já sabem.",
      texto:
        "Ao confirmar a reserva, o estabelecimento recebe o perfil sensorial do seu filho e assume o compromisso de cuidar de cada detalhe. Você chega, eles já estão preparados.",
    },
  ];

  return (
    <section id="como-funciona" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-secondary font-semibold uppercase tracking-wide text-sm">
            Como funciona
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold text-primary">
            Simples assim. Prometemos.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Três passos para a viagem que vocês tanto adiaram.
          </p>
        </Reveal>

        <div className="relative">
          {/* Linha conectora desktop */}
          <div
            aria-hidden
            className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-0.5 step-connector"
          />

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative bg-card rounded-2xl p-7 shadow-soft hover:shadow-elegant transition border h-full">
                  <span
                    aria-hidden
                    className="absolute top-3 right-5 font-display font-extrabold text-secondary/15 text-[72px] leading-none select-none"
                  >
                    {s.n}
                  </span>
                  <div className="relative w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <s.Icon className="h-7 w-7" />
                  </div>
                  <h3 className="relative mt-5 font-display font-bold text-primary text-xl">
                    {s.titulo}
                  </h3>
                  <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">
                    {s.texto}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELOS QUE IMPORTAM
// ─────────────────────────────────────────────────────────────────────────────

function SelosImportantes() {
  const selos = [
    {
      Icon: ShieldCheck,
      cor: "bg-primary text-primary-foreground",
      nome: "Selo Azul",
      descricao:
        "Emitido pela Absoluto Educacional. Exige que no mínimo 70% da equipe seja treinada em TEA/ABA com metodologia validada. O mais rigoroso do mercado.",
    },
    {
      Icon: Award,
      cor: "bg-success text-success-foreground",
      nome: "Certificação Governamental",
      descricao:
        "Certificação pública federal. Passa a valer após a aprovação do PL 4108/2024, com auditoria por órgão governamental independente.",
    },
    {
      Icon: HomeIcon,
      cor: "bg-roxo-suave text-roxo-suave-foreground",
      nome: "Sala Sensorial",
      descricao:
        "Espaço físico dedicado com controle de luz, volume e estímulos. Projeto validado por especialista em TEA. Seu filho tem para onde ir quando precisar.",
    },
    {
      Icon: Heart,
      cor: "bg-secondary text-secondary-foreground",
      nome: "Concierge TEA",
      descricao:
        "Profissional especializado em autismo presente durante toda a sua estadia. Não é um funcionário treinado — é alguém que entende de verdade.",
    },
  ];

  return (
    <section className="py-20 bg-azul-claro">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-secondary font-semibold uppercase tracking-wide text-sm">
            Transparência total
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold text-primary">
            Cada selo que você vê foi ganho de verdade
          </h2>
          <p className="mt-3 text-muted-foreground">
            Qualquer hotel pode dizer que é inclusivo. Aqui, precisa provar.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {selos.map((s, i) => (
            <Reveal key={s.nome} delay={i * 100}>
              <div className="relative bg-card rounded-2xl p-7 shadow-soft hover:shadow-elegant transition border text-center h-full">
                <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verificado
                </span>
                <div
                  className={`mx-auto w-16 h-16 rounded-2xl ${s.cor} flex items-center justify-center`}
                >
                  <s.Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-display font-bold text-primary text-lg">{s.nome}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.descricao}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <Link
            to="/sobre-os-selos"
            className="inline-flex items-center gap-1 text-secondary font-semibold hover:text-primary transition"
          >
            Entenda como auditamos cada estabelecimento <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DESTINOS EM DESTAQUE
// ─────────────────────────────────────────────────────────────────────────────

function DestinosDestaque({
  destaques,
  perfil,
  userLogado,
  onCriarPerfil,
}: {
  destaques: EstabelecimentoView[] | null;
  perfil: PerfilSensorial | null;
  userLogado: boolean;
  onCriarPerfil: () => void;
}) {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="text-secondary font-semibold uppercase tracking-wide text-sm">
                Recomendados
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold text-primary max-w-xl">
                Estabelecimentos mais escolhidos pelas famílias
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/explorar">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {destaques === null ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] bg-muted animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : destaques.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            Em breve novos destinos certificados.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              <Reveal key={e.id} delay={i * 80}>
                <DestaqueCard
                  estab={e}
                  perfil={perfil}
                  userLogado={userLogado}
                  isMaisEscolhido={i === 0}
                />
              </Reveal>
            ))}
          </div>
        )}

        <Reveal className="mt-14 text-center max-w-2xl mx-auto">
          <p className="text-lg text-foreground">
            Quer ver estabelecimentos compatíveis com o perfil do seu filho?
          </p>
          <Button
            type="button"
            size="lg"
            className="mt-4 bg-primary hover:bg-primary/90 min-h-[44px]"
            onClick={onCriarPerfil}
          >
            Criar perfil sensorial — é gratuito <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

function DestaqueCard({
  estab,
  perfil,
  userLogado,
  isMaisEscolhido,
}: {
  estab: EstabelecimentoView;
  perfil: PerfilSensorial | null;
  userLogado: boolean;
  isMaisEscolhido: boolean;
}) {
  const vm: EstabCardVM = useMemo(() => mapEstabCard(estab), [estab]);
  const compat = useMemo(() => calcularCompatibilidade(perfil, estab), [perfil, estab]);

  const miniRecursos: Array<{ key: string; cond: boolean; Icon: typeof BellRing; tip: string }> = [
    { key: "sala", cond: estab.tem_sala_sensorial === true, Icon: HomeIcon, tip: "Sala sensorial" },
    {
      key: "cardapio",
      cond: estab.tem_cardapio_visual === true,
      Icon: Utensils,
      tip: "Cardápio visual",
    },
    {
      key: "checkin",
      cond: estab.tem_checkin_antecipado === true,
      Icon: DoorOpen,
      tip: "Check-in antecipado",
    },
    {
      key: "fila",
      cond: estab.tem_fila_prioritaria === true,
      Icon: BellRing,
      tip: "Fila prioritária",
    },
  ].filter((r) => r.cond);

  // Emoji de fallback derivado do tipoLabel (sem precisar adicionar campo ao VM)
  const tipoLower = vm.tipoLabel.toLowerCase();
  const emojiFallback = tipoLower.includes("restaurante")
    ? "🍽️"
    : tipoLower.includes("parque") || tipoLower.includes("atra")
      ? "🎡"
      : tipoLower.includes("transporte")
        ? "✈️"
        : tipoLower.includes("agência") || tipoLower.includes("agencia")
          ? "🧳"
          : "🏨";

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition border h-full flex flex-col">
      {/* Imagem com altura FIXA (h-48 = 192px) — uniforme em todos os cards */}
      <div className="relative w-full h-48 overflow-hidden bg-azul-claro">
        {vm.media.fotoCapa ? (
          <img
            src={vm.media.fotoCapa}
            alt={vm.nome}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-azul-claro to-teal-claro"
          >
            <span className="text-5xl opacity-30">{emojiFallback}</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-1.5rem)]">
          {vm.temSeloAzul && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
              <ShieldCheck className="h-3 w-3" /> Selo Azul
            </span>
          )}
          {vm.temTour360 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amarelo text-amarelo-foreground text-[11px] font-semibold">
              📸 Tour 360°
            </span>
          )}
          {estab.tem_concierge_tea === true && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold">
              <Heart className="h-3 w-3" /> Concierge TEA
            </span>
          )}
        </div>
        {isMaisEscolhido && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amarelo text-amarelo-foreground text-[11px] font-bold uppercase tracking-wide shadow-soft">
            Mais escolhido
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-display font-bold text-primary text-lg leading-tight">{vm.nome}</h3>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className="font-medium">{vm.tipoLabel}</span>
            {vm.localidade && (
              <>
                <span>·</span>
                <MapPin className="h-3 w-3" />
                <span>{vm.localidade}</span>
              </>
            )}
          </div>
        </div>

        {miniRecursos.length > 0 && (
          <div className="flex items-center gap-2">
            {miniRecursos.map((r) => (
              <span
                key={r.key}
                title={r.tip}
                aria-label={r.tip}
                className="w-7 h-7 rounded-full bg-azul-claro text-primary flex items-center justify-center"
              >
                <r.Icon className="h-3.5 w-3.5" />
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-amarelo text-amarelo" />
          <span className="font-semibold text-foreground">4.8</span>
          <span>(novas avaliações)</span>
        </div>

        {/* Compatibilidade */}
        {userLogado && compat !== null ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Compatibilidade</span>
              <span className="font-bold text-secondary">{compat}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-secondary transition-[width] duration-700"
                style={{ width: `${compat}%` }}
              />
            </div>
          </div>
        ) : userLogado ? (
          <p className="text-xs text-muted-foreground italic">
            Crie um perfil sensorial para ver compatibilidade.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            <Link to="/login" className="text-secondary hover:underline">
              Faça login
            </Link>{" "}
            para ver compatibilidade.
          </p>
        )}

        <Button
          asChild
          className="mt-auto w-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition"
        >
          <Link to="/estabelecimento/$slug" params={{ slug: vm.slug }}>
            Ver detalhes
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPOIMENTOS
// ─────────────────────────────────────────────────────────────────────────────

function Depoimentos({ depoimentos }: { depoimentos: Depoimento[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (depoimentos.length <= 1) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % depoimentos.length), 5000);
    return () => clearInterval(t);
  }, [depoimentos.length]);

  const d = depoimentos[idx];
  if (!d) return null;

  const subtitulo =
    d.filhoIdade > 0
      ? `${d.cidade} | ${d.papel} do ${d.filhoNome}, ${d.filhoIdade} anos`
      : `${d.cidade}`;

  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
            Famílias que voltaram a viajar
          </h2>
          <p className="mt-3 text-secondary italic text-lg">
            Histórias reais de quem encontrou o lugar certo.
          </p>
        </Reveal>

        <Reveal className="relative max-w-3xl mx-auto">
          <Quote
            aria-hidden
            className="absolute -top-6 -left-2 md:-left-8 h-28 w-28 md:h-32 md:w-32 text-secondary opacity-20"
          />
          <div
            key={idx}
            className="relative bg-white/5 backdrop-blur rounded-2xl p-8 md:p-10 border-l-4 border-secondary animate-fade-up"
          >
            <p className="text-lg md:text-xl text-white leading-relaxed italic">“{d.texto}”</p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-display font-bold text-lg">
                {d.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-display font-bold text-white">{d.nome}</div>
                <div className="text-xs text-white/70">{subtitulo}</div>
                <div className="mt-1 flex items-center gap-0.5 text-amarelo">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amarelo" />
                  ))}
                </div>
              </div>
              {d.estabSlug && d.estabNome && (
                <Link
                  to="/estabelecimento/$slug"
                  params={{ slug: d.estabSlug }}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-semibold hover:bg-white hover:text-primary transition"
                >
                  {d.estabNome}
                </Link>
              )}
            </div>
          </div>

          {/* Dots */}
          {depoimentos.length > 1 && (
            <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Depoimentos">
              {depoimentos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Depoimento ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === idx ? "w-8 bg-secondary" : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BENEFÍCIOS TEA
// ─────────────────────────────────────────────────────────────────────────────

function BeneficiosTea({ beneficios }: { beneficios: EstabelecimentoView[] | null }) {
  return (
    <section className="py-20 bg-teal-claro">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-secondary text-xs font-semibold border border-secondary/20">
              <Gift className="h-3.5 w-3.5" /> Exclusivo para famílias TEA
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-primary">
              Benefícios que você não encontra em lugar nenhum
            </h2>
            <p className="mt-4 text-foreground/80 leading-relaxed">
              Parques, hotéis e restaurantes que oferecem entrada gratuita, filas prioritárias e
              descontos exclusivos para pessoas autistas e seus acompanhantes.
            </p>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/beneficios-tea">
                Ver todos os benefícios <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </Reveal>

          <div className="space-y-3">
            {beneficios === null
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-white/60 animate-pulse rounded-xl" />
                ))
              : beneficios.length === 0
                ? (
                    <p className="text-sm text-muted-foreground">
                      Em breve novos parceiros com benefícios.
                    </p>
                  )
                : beneficios.map((b, i) => (
                    <Reveal key={b.id} delay={i * 100}>
                      <Link
                        to="/estabelecimento/$slug"
                        params={{ slug: b.slug }}
                        className="block bg-card rounded-xl p-5 shadow-soft hover:shadow-elegant transition border"
                      >
                        <h3 className="font-display font-bold text-primary">{b.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {b.tipo} {b.cidade && `· ${b.cidade}${b.estado ? `, ${b.estado}` : ""}`}
                        </p>
                        {b.beneficio_tea_descricao && (
                          <div className="mt-3 text-sm bg-success/10 text-success rounded-lg px-3 py-2 flex items-start gap-2">
                            <Gift className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="text-foreground/90">{b.beneficio_tea_descricao}</span>
                          </div>
                        )}
                        <div className="mt-3 text-xs text-secondary font-semibold inline-flex items-center gap-1">
                          Ver detalhes <ArrowRight className="h-3 w-3" />
                        </div>
                      </Link>
                    </Reveal>
                  ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG TEASER
// ─────────────────────────────────────────────────────────────────────────────

function BlogTeaser({ artigos }: { artigos: ArtigoCard[] | null }) {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="text-secondary font-semibold uppercase tracking-wide text-sm">
                Aprenda mais
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold text-primary">
                Conteúdo atualizado sobre turismo TEA
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/conteudo">
                Ver todos os artigos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {artigos === null ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[16/10] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : artigos.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Em breve novos artigos.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {artigos.map((a, i) => {
              const cat = a.categoria ? CATEGORIA_COR[a.categoria] : null;
              return (
                <Reveal key={a.slug} delay={i * 100}>
                  <Link
                    to="/conteudo/$slug"
                    params={{ slug: a.slug }}
                    className="group block bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition border h-full"
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      {a.foto_capa && (
                        <img
                          src={a.foto_capa}
                          alt={a.titulo}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-5">
                      {cat && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${cat.bg}`}
                        >
                          {cat.label}
                        </span>
                      )}
                      <h3 className="mt-3 font-display font-bold text-primary line-clamp-2 group-hover:text-secondary transition">
                        {a.titulo}
                      </h3>
                      {a.resumo && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                          {a.resumo}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="text-secondary font-semibold inline-flex items-center gap-1">
                          Ler artigo <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA FINAL
// ─────────────────────────────────────────────────────────────────────────────

function CtaFinal({ onCriarPerfil }: { onCriarPerfil: () => void }) {
  return (
    <section className="py-24 gradient-cta-final text-white">
      <div className="container mx-auto px-4">
        <Reveal className="max-w-2xl mx-auto text-center">
          <Plane className="h-16 w-16 mx-auto text-white/90" aria-hidden />
          <h2 className="mt-6 text-4xl md:text-5xl font-display font-extrabold leading-tight">
            Sua família merece viajar.
          </h2>
          <p className="mt-4 text-lg text-white/85">
            Crie o perfil sensorial do seu filho agora. É gratuito, leva 3 minutos e muda tudo.
          </p>
          <Button
            type="button"
            size="lg"
            onClick={onCriarPerfil}
            className="mt-8 bg-white text-primary hover:bg-secondary hover:text-secondary-foreground px-8 py-6 text-base font-bold min-h-[44px]"
          >
            Quero criar o perfil do meu filho <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <p className="mt-5 text-xs text-white/60">
            ✓ Gratuito · ✓ Sem compromisso · ✓ Dados protegidos pela LGPD
          </p>
        </Reveal>
      </div>
    </section>
  );
}
