import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { z } from "zod";
import {
  TrendingUp,
  ShieldCheck,
  MapPin,
  ClipboardList,
  Search,
  GraduationCap,
  Sparkles,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTADOS_BR } from "@/lib/brazil";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/para-estabelecimentos")({
  head: () => ({
    meta: [
      { title: "Certificação para Estabelecimentos — Turismo Azul" },
      {
        name: "description",
        content:
          "Capacite sua equipe, conquiste o Selo Azul e seja encontrado por 500 mil famílias TEA buscando destinos preparados.",
      },
      { property: "og:title", content: "Certificação para Estabelecimentos — Turismo Azul" },
      {
        property: "og:description",
        content:
          "Mercado de R$ 1 bi/ano. Selo Azul auditado pela Absoluto Educacional. Capacitação + listagem qualificada.",
      },
    ],
  }),
  component: ParaEstabelecimentosPage,
});

const TIPOS_ESTAB = [
  "Hotel",
  "Pousada",
  "Resort",
  "Restaurante",
  "Parque",
  "Atração turística",
  "Agência",
  "Transporte",
  "Outro",
] as const;

const FAIXAS_COLAB = [
  "Até 10",
  "11 a 30",
  "31 a 60",
  "61 a 100",
  "Mais de 100",
] as const;

const INTERESSES = [
  { id: "selo_azul", label: "Quero o Selo Azul (capacitação completa)" },
  { id: "listar", label: "Quero listar meu negócio no marketplace" },
  { id: "saber_mais", label: "Quero saber mais antes de decidir" },
  { id: "beneficios", label: "Tenho interesse em oferecer benefícios TEA" },
] as const;

const ORIGENS = ["Google", "Indicação", "Redes sociais", "Evento", "Outro"] as const;

const contatoSchema = z.object({
  nome_responsavel: z.string().trim().min(3, "Informe o nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  nome_estabelecimento: z.string().trim().min(2, "Informe o nome do estabelecimento").max(160),
  tipo_estabelecimento: z.string().min(1, "Selecione o tipo"),
  cidade: z.string().trim().min(2, "Informe a cidade").max(120),
  estado: z.string().min(2, "Selecione o estado"),
  num_colaboradores: z.string().min(1, "Selecione a faixa"),
  interesses: z.array(z.string()).min(1, "Marque ao menos uma opção"),
  origem: z.string().optional().or(z.literal("")),
  mensagem: z.string().max(1000).optional().or(z.literal("")),
});

function maskTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{0,2})/, "($1")
      .replace(/^(\(\d{2})(\d)/, "$1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{0,2})/, "($1")
    .replace(/^(\(\d{2})(\d)/, "$1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function ParaEstabelecimentosPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    nome_responsavel: "",
    email: "",
    telefone: "",
    nome_estabelecimento: "",
    tipo_estabelecimento: "",
    cidade: "",
    estado: "",
    num_colaboradores: "",
    interesses: [] as string[],
    origem: "",
    mensagem: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleInteresse(id: string) {
    setForm((f) => ({
      ...f,
      interesses: f.interesses.includes(id)
        ? f.interesses.filter((x) => x !== id)
        : [...f.interesses, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = contatoSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string") errs[k] = issue.message;
      }
      setErrors(errs);
      toast.error("Verifique os campos do formulário.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.from("contatos_estabelecimentos").insert({
      nome_responsavel: parsed.data.nome_responsavel,
      email: parsed.data.email,
      telefone: parsed.data.telefone,
      nome_estabelecimento: parsed.data.nome_estabelecimento,
      tipo_estabelecimento: parsed.data.tipo_estabelecimento,
      cidade: parsed.data.cidade,
      estado: parsed.data.estado,
      num_colaboradores: parsed.data.num_colaboradores,
      interesses: parsed.data.interesses,
      origem: parsed.data.origem || null,
      mensagem: parsed.data.mensagem || null,
    });
    setEnviando(false);

    if (error) {
      toast.error("Não foi possível enviar agora. Tente novamente.");
      return;
    }

    toast.success("Mensagem enviada. Retornamos em breve.");
    setForm({
      nome_responsavel: "",
      email: "",
      telefone: "",
      nome_estabelecimento: "",
      tipo_estabelecimento: "",
      cidade: "",
      estado: "",
      num_colaboradores: "",
      interesses: [],
      origem: "",
      mensagem: "",
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* HERO */}
      <section className="bg-[#1B2E4B] text-white">
        <div className="container mx-auto px-4 py-20 md:py-28 max-w-5xl">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
            500 mil famílias buscando um lugar que entenda o autismo do filho delas.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-primary font-medium">
            O seu estabelecimento está pronto pra receber?
          </p>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-3xl leading-relaxed">
            O mercado de turismo inclusivo TEA movimenta mais de R$ 1 bilhão por ano no Brasil.
            Nenhuma plataforma conectava essas famílias a destinos preparados. Até agora.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={scrollToForm}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Quero o Selo Azul
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToForm}
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#1B2E4B]"
            >
              Listar meu negócio
            </Button>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — Por que vale a pena */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            O que você ganha com isso
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Acesso a um mercado ignorado",
                text: "Famílias TEA viajam menos porque não encontram destinos adequados. Quando encontram, a fidelidade é muito maior que a média. Um hóspede satisfeito volta — e indica pra toda a rede de famílias TEA que conhece.",
              },
              {
                icon: ShieldCheck,
                title: "O Selo Azul como diferencial real",
                text: "O Selo Azul da Absoluto Educacional é auditado, renovado anualmente e exibido com destaque na plataforma. Não é um adesivo. É um certificado com critérios reais que a concorrência ainda não tem.",
              },
              {
                icon: MapPin,
                title: "Visibilidade qualificada",
                text: "Famílias buscam na plataforma por necessidade específica do filho. Quem te encontra está procurando exatamente o que você oferece. É tráfego qualificado, não aleatório.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-start">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 — Como funciona */}
      <section className="bg-[#EBF4F8] py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: ClipboardList,
                title: "Você entra em contato",
                text: "Preenche o formulário abaixo. Nossa equipe responde em até 1 dia útil.",
              },
              {
                icon: Search,
                title: "A gente avalia seu estabelecimento",
                text: "Visita técnica ou questionário remoto para entender a estrutura atual e o que precisa ser adaptado.",
              },
              {
                icon: GraduationCap,
                title: "Treinamento da equipe",
                text: "A Absoluto Educacional capacita seus colaboradores em TEA/ABA. Mínimo de 70% da equipe para emissão do Selo Azul.",
              },
              {
                icon: Sparkles,
                title: "Listagem e visibilidade",
                text: "Seu estabelecimento entra no marketplace com o Selo Azul em destaque. Famílias já buscando passam a te encontrar.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-border/40"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-[#1B2E4B] text-white grid place-items-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 4 — Opções de participação */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Escolha como quer participar
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* CARD 1 — Listagem básica */}
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">Listagem Básica</h3>
                <span className="text-xs font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  Grátis
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Para começar a aparecer na plataforma sem custo.
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                {[
                  "Perfil no marketplace (sem Selo Azul)",
                  "Preenchimento de questionário básico",
                  "Evidências mínimas de inclusão avaliadas",
                  "Visível nas buscas gerais",
                  "Funil para certificação completa",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2 mb-8 text-sm">
                {[
                  "Selo Azul em destaque",
                  "Perfil sensorial das famílias",
                  "Posição prioritária nas buscas",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-auto" onClick={scrollToForm}>
                Quero listar gratuitamente
              </Button>
            </div>

            {/* CARD 2 — Selo Azul */}
            <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative shadow-lg">
              <div className="absolute -top-3 left-8">
                <span className="text-xs font-semibold uppercase tracking-wide bg-primary text-primary-foreground px-3 py-1 rounded-full">
                  Recomendado
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">
                  Estabelecimento Certificado
                </h3>
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Capacitação completa + Selo Azul oficial pela Absoluto Educacional.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                {[
                  "Treinamento de colaboradores pela Absoluto Educacional",
                  "Emissão do Selo Azul oficial",
                  "Badge de destaque no marketplace",
                  "Perfil sensorial das famílias antes da chegada",
                  "Renovação anual com suporte contínuo",
                  "Acesso ao Portal de Conteúdo TEA",
                  "Posição prioritária nas buscas",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-4 mb-6">
                <p className="text-2xl font-bold text-foreground">
                  R$ 1.200{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    por colaborador treinado
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor varia conforme tamanho da equipe. Solicite uma proposta personalizada.
                </p>
              </div>
              <Button className="mt-auto" onClick={scrollToForm}>
                Quero o Selo Azul
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5 — Formulário */}
      <section ref={formRef} id="contato" className="bg-[#1B2E4B] py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Fale com a gente</h2>
            <p className="mt-3 text-primary font-medium">Respondemos em até 1 dia útil.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-xl space-y-5"
          >
            <div>
              <Label htmlFor="nome_responsavel">Nome do responsável *</Label>
              <Input
                id="nome_responsavel"
                value={form.nome_responsavel}
                onChange={(e) => setForm({ ...form, nome_responsavel: e.target.value })}
                className="mt-1.5"
              />
              {errors.nome_responsavel && (
                <p className="text-xs text-destructive mt-1">{errors.nome_responsavel}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail comercial *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="mt-1.5"
                />
                {errors.telefone && (
                  <p className="text-xs text-destructive mt-1">{errors.telefone}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="nome_estabelecimento">Nome do estabelecimento *</Label>
              <Input
                id="nome_estabelecimento"
                value={form.nome_estabelecimento}
                onChange={(e) => setForm({ ...form, nome_estabelecimento: e.target.value })}
                className="mt-1.5"
              />
              {errors.nome_estabelecimento && (
                <p className="text-xs text-destructive mt-1">{errors.nome_estabelecimento}</p>
              )}
            </div>

            <div>
              <Label>Tipo do estabelecimento *</Label>
              <Select
                value={form.tipo_estabelecimento}
                onValueChange={(v) => setForm({ ...form, tipo_estabelecimento: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ESTAB.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipo_estabelecimento && (
                <p className="text-xs text-destructive mt-1">{errors.tipo_estabelecimento}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  className="mt-1.5"
                />
                {errors.cidade && (
                  <p className="text-xs text-destructive mt-1">{errors.cidade}</p>
                )}
              </div>
              <div>
                <Label>Estado *</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v) => setForm({ ...form, estado: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...ESTADOS_BR]
                      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                      .map((uf) => (
                        <SelectItem key={uf.sigla} value={uf.sigla}>
                          {uf.sigla} — {uf.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.estado && (
                  <p className="text-xs text-destructive mt-1">{errors.estado}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Número de colaboradores *</Label>
              <Select
                value={form.num_colaboradores}
                onValueChange={(v) => setForm({ ...form, num_colaboradores: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione a faixa" />
                </SelectTrigger>
                <SelectContent>
                  {FAIXAS_COLAB.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.num_colaboradores && (
                <p className="text-xs text-destructive mt-1">{errors.num_colaboradores}</p>
              )}
            </div>

            <div>
              <Label className="block mb-2">O que você busca? *</Label>
              <div className="space-y-2">
                {INTERESSES.map((i) => (
                  <label
                    key={i.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={form.interesses.includes(i.id)}
                      onCheckedChange={() => toggleInteresse(i.id)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground">{i.label}</span>
                  </label>
                ))}
              </div>
              {errors.interesses && (
                <p className="text-xs text-destructive mt-1">{errors.interesses}</p>
              )}
            </div>

            <div>
              <Label>Como nos conheceu?</Label>
              <Select
                value={form.origem}
                onValueChange={(v) => setForm({ ...form, origem: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mensagem">Mensagem (opcional)</Label>
              <Textarea
                id="mensagem"
                value={form.mensagem}
                onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                placeholder="Algo que queira nos contar sobre seu estabelecimento ou dúvidas específicas."
                rows={4}
                className="mt-1.5"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={enviando}>
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar mensagem"
              )}
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
