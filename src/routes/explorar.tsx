import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchEstabelecimentosView,
  type EstabelecimentoView,
} from "@/lib/queries/estabelecimentos";
import {
  ESTAB_TIPO_LABEL,
  ESTAB_TIPOS,
  SUBTIPO_EDUCATIVO_LABEL,
  type EstabTipo,
  type SubtipoEducativo,
} from "@/lib/enums";
import { ESTADOS_BR } from "@/lib/brazil";
import {
  VolumeX,
  Utensils,
  Eye,
  Waves,
  MapPin,
  ShieldCheck,
  Loader2,
  Compass,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/explorar")({
  head: () => ({
    meta: [
      { title: "Explorar destinos · Turismo Azul" },
      {
        name: "description",
        content:
          "Hotéis, pousadas, parques e restaurantes preparados para receber famílias TEA.",
      },
    ],
  }),
  component: ExplorarPage,
});

function ExplorarPage() {
  const [items, setItems] = useState<EstabelecimentoView[]>([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState<EstabTipo | "">("");
  const [subtipoEdu, setSubtipoEdu] = useState<SubtipoEducativo | "fazenda_sitio" | "">("");
  const [apenasSeloAzul, setApenasSeloAzul] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchEstabelecimentosView({})
      .then((rows) => {
        if (alive) setItems(rows);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Não foi possível carregar os estabelecimentos.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const total = items.length;

  const filtrados = useMemo(() => {
    return items.filter((e) => {
      if (estado && e.estado !== estado) return false;
      if (tipo && e.tipo !== tipo) return false;
      if (tipo === "passeio_educativo" && subtipoEdu) {
        const sub = e.subtipo_educativo ?? "";
        if (subtipoEdu === "fazenda_sitio") {
          if (sub !== "fazenda" && sub !== "sitio") return false;
        } else if (sub !== subtipoEdu) {
          return false;
        }
      }
      if (apenasSeloAzul && !e.selo_azul) return false;
      return true;
    });
  }, [items, estado, tipo, subtipoEdu, apenasSeloAzul]);

  const categoriasRapidas: Array<{
    key: EstabTipo | "";
    label: string;
    icon: string;
  }> = [
    { key: "", label: "Tudo", icon: "✨" },
    { key: "hotel", label: "Hotéis", icon: "🏨" },
    { key: "pousada", label: "Pousadas", icon: "🏡" },
    { key: "restaurante", label: "Restaurantes", icon: "🍽️" },
    { key: "parque", label: "Parques", icon: "🎢" },
    { key: "passeio_educativo", label: "Passeios Educativos", icon: "🎒" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 pt-8 pb-16">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">
            Explorar destinos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Locais cadastrados e preparados para receber famílias TEA.
          </p>

          {/* Banner contador */}
          <div className="mt-5 rounded-xl bg-primary/5 border border-primary/15 px-5 py-3 text-sm text-primary flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {loading ? (
              <span className="text-muted-foreground">
                Carregando estabelecimentos…
              </span>
            ) : total === 0 ? (
              <span>Primeiros estabelecimentos chegando em breve.</span>
            ) : (
              <span>
                <strong>{total}</strong> estabelecimento{total === 1 ? "" : "s"}{" "}
                já cadastrado{total === 1 ? "" : "s"} e preparado
                {total === 1 ? "" : "s"} para receber sua família.
              </span>
            )}
          </div>

          {/* Categorias rápidas */}
          <div className="mt-6 flex flex-wrap gap-2">
            {categoriasRapidas.map((c) => {
              const ativo = tipo === c.key;
              return (
                <button
                  key={c.key || "tudo"}
                  type="button"
                  onClick={() => {
                    setTipo(c.key);
                    if (c.key !== "passeio_educativo") setSubtipoEdu("");
                  }}
                  className={
                    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition " +
                    (ativo
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white text-foreground/80 border-border hover:border-primary/40 hover:text-primary")
                  }
                >
                  <span aria-hidden>{c.icon}</span>
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Filtros */}
          <div className="mt-4 grid sm:grid-cols-3 gap-3 bg-white border rounded-xl p-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
              >
                <option value="">Todos</option>
                {ESTADOS_BR.map((uf) => (
                  <option key={uf.sigla} value={uf.sigla}>
                    {uf.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => {
                  const v = e.target.value as EstabTipo | "";
                  setTipo(v);
                  if (v !== "passeio_educativo") setSubtipoEdu("");
                }}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
              >
                <option value="">Todos</option>
                {ESTAB_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t === "passeio_educativo" ? "🎒 " : ""}
                    {ESTAB_TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-end gap-2 text-sm pb-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={apenasSeloAzul}
                onChange={(e) => setApenasSeloAzul(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Mostrar só com Selo Azul
            </label>

            {tipo === "passeio_educativo" && (
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Subcategoria de passeio educativo
                </label>
                <select
                  value={subtipoEdu}
                  onChange={(e) =>
                    setSubtipoEdu(
                      e.target.value as SubtipoEducativo | "fazenda_sitio" | "",
                    )
                  }
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
                >
                  <option value="">Todas</option>
                  <option value="fazenda_sitio">Fazenda / Sítio</option>
                  <option value="museu">{SUBTIPO_EDUCATIVO_LABEL.museu}</option>
                  <option value="parque_tematico">
                    {SUBTIPO_EDUCATIVO_LABEL.parque_tematico}
                  </option>
                  <option value="espaco_cultural">
                    {SUBTIPO_EDUCATIVO_LABEL.espaco_cultural}
                  </option>
                </select>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
              </div>
            ) : filtrados.length === 0 ? (
              <EstadoVazio />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtrados.map((e) => (
                  <EstabCard key={e.id} estab={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const ADAPTACOES: Array<{
  key: keyof EstabelecimentoView;
  label: string;
  Icon: typeof VolumeX;
}> = [
  { key: "tem_sala_sensorial", label: "Ambiente silencioso", Icon: VolumeX },
  { key: "tem_cardapio_visual", label: "Cardápio adaptado", Icon: Utensils },
  { key: "tem_caa", label: "Comunicação visual", Icon: Eye },
  { key: "tem_concierge_tea", label: "Concierge TEA", Icon: Waves },
];

function EstabCard({ estab }: { estab: EstabelecimentoView }) {
  const adaptacoes = ADAPTACOES.filter((a) => estab[a.key]);
  return (
    <div className="relative bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition">
      {estab.selo_azul && (
        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold shadow">
          <ShieldCheck className="h-3 w-3" /> Selo Azul ✓
        </span>
      )}
      <div className="aspect-[16/10] bg-azul-claro">
        {estab.foto_capa ? (
          <img
            src={estab.foto_capa}
            alt={estab.nome}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/40">
            <Compass className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
          {ESTAB_TIPO_LABEL[estab.tipo]}
        </div>
        <h3 className="mt-1 font-display font-bold text-primary text-lg leading-tight">
          {estab.nome}
        </h3>
        {(estab.cidade || estab.estado) && (
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[estab.cidade, estab.estado].filter(Boolean).join(" · ")}
          </div>
        )}

        {adaptacoes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {adaptacoes.map(({ key, label, Icon }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[11px] text-foreground/80"
                title={label}
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/estabelecimento/$slug" params={{ slug: estab.slug }}>
              Conhecer o local
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            <Link to="/minha-conta/reservas/nova" search={{ slug: estab.slug } as never}>
              Solicitar Reserva →
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function EstadoVazio() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.from("contatos_gerais").insert({
      nome: nome.trim(),
      email: email.trim(),
      assunto: "Indicação de estabelecimento",
      mensagem: mensagem.trim(),
      origem: "explorar_indicacao",
    });
    setEnviando(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    toast.success("Indicação enviada! Obrigado.");
    setNome("");
    setEmail("");
    setMensagem("");
  }

  return (
    <div className="bg-azul-claro/40 border rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Compass className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-xl font-display font-bold text-primary">
        Ainda não temos estabelecimentos nessa região.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Indique um local que você gostaria de ver aqui →
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-3 text-left max-w-md mx-auto"
      >
        <Input
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Textarea
          placeholder="Nome e cidade do local que você gostaria de indicar"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={3}
          required
        />
        <Button
          type="submit"
          disabled={enviando}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        >
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando…
            </>
          ) : (
            "Indicar"
          )}
        </Button>
      </form>
    </div>
  );
}
