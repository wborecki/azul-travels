import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ClipboardList,
  GraduationCap,
  Eye,
  Award,
  RefreshCw,
  Check,
  MessageCircle,
  FileCheck2,
  Users,
  Building2,
  HeartHandshake,
} from "lucide-react";
import seloOficial from "@/assets/selo-turismo-azul.png";

export const Route = createFileRoute("/como-funciona-o-selo-azul")({
  head: () => ({
    meta: [
      { title: "Como funciona o Selo Azul · Turismo Azul Inclusivo" },
      {
        name: "description",
        content:
          "Conheça as etapas, requisitos e o processo de verificação do Selo Azul - a certificação que atesta preparo real para receber famílias TEA.",
      },
      { property: "og:title", content: "Como funciona o Selo Azul" },
      {
        property: "og:description",
        content:
          "Etapas, requisitos e auditoria do Selo Azul Turismo Azul Inclusivo.",
      },
    ],
  }),
  component: ComoFuncionaSeloAzulPage,
});

function ComoFuncionaSeloAzulPage() {
  const etapas = [
    {
      Icon: ClipboardList,
      titulo: "1. Cadastro e diagnóstico",
      descricao:
        "O estabelecimento se cadastra na plataforma e responde a um diagnóstico inicial sobre estrutura, equipe e operação. Nossa equipe analisa a viabilidade e apresenta o plano de certificação.",
    },
    {
      Icon: GraduationCap,
      titulo: "2. Capacitação da equipe",
      descricao:
        "No mínimo 70% da equipe operacional passa pelo treinamento em TEA/ABA conduzido pelo Turismo Azul Inclusivo, com avaliação prática e emissão de certificado individual.",
    },
    {
      Icon: Building2,
      titulo: "3. Adequação do espaço",
      descricao:
        "Revisamos sinalização, fluxo de chegada, ambientes sensoriais, cardápio e protocolos internos. O estabelecimento recebe um checklist com ajustes obrigatórios e recomendados.",
    },
    {
      Icon: Eye,
      titulo: "4. Auditoria presencial",
      descricao:
        "Um auditor da Turismo Azul visita o local sem aviso prévio, observa a operação real, entrevista a equipe e valida o atendimento a famílias TEA na prática.",
    },
    {
      Icon: Award,
      titulo: "5. Emissão do Selo Azul",
      descricao:
        "Após aprovação, o estabelecimento recebe o Selo Azul Turismo Azul Inclusivo, passa a ter destaque na plataforma e pode utilizar o selo em sua comunicação.",
    },
    {
      Icon: RefreshCw,
      titulo: "6. Reciclagem anual",
      descricao:
        "A certificação tem validade de 12 meses. A renovação exige reciclagem da equipe, nova auditoria e revisão dos protocolos para acompanhar boas práticas atualizadas.",
    },
  ];

  const requisitos = [
    "70% ou mais da equipe operacional treinada em TEA/ABA",
    "Pelo menos um responsável certificado em atendimento prioritário disponível em todos os turnos",
    "Protocolo escrito de acolhimento a famílias TEA",
    "Espaço de descompressão ou estratégia equivalente validada",
    "Cardápio com opções para restrições alimentares comuns ao TEA",
    "Sinalização visual clara de ambientes, rotas e tempos de espera",
    "Canal direto com a família antes da visita para receber o perfil sensorial",
    "Compromisso público de não discriminação e atendimento prioritário",
  ];

  const verificacao = [
    {
      Icon: FileCheck2,
      titulo: "Documental",
      descricao:
        "Análise de certificados de treinamento, registros de equipe, protocolos internos e materiais voltados ao público TEA.",
    },
    {
      Icon: Users,
      titulo: "Operacional",
      descricao:
        "Entrevistas com equipe de diferentes turnos, simulação de check-in e revisão de atendimentos anteriores a famílias TEA.",
    },
    {
      Icon: HeartHandshake,
      titulo: "Experiência real",
      descricao:
        "Coleta de feedback de famílias TEA que estiveram no local e visita técnica presencial sem aviso prévio.",
    },
  ];

  const whatsappUrl =
    "https://wa.me/5511947150632?text=" +
    encodeURIComponent("Olá! Quero entender como funciona o Selo Azul.");

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-azul-claro pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 text-primary text-xs font-semibold mb-4">
            <ShieldCheck className="h-4 w-4" />
            Certificação Turismo Azul Inclusivo
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-primary">
            Como funciona o Selo Azul?
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            O Selo Azul é a nossa garantia pública de que um estabelecimento está
            realmente preparado para receber famílias com pessoas autistas - com
            equipe treinada, estrutura adequada e auditoria independente.
          </p>
        </div>
      </section>

      {/* Selo oficial */}
      <section className="pt-10 pb-4">
        <div className="container mx-auto px-4 max-w-3xl flex flex-col items-center text-center">
          <div className="bg-white rounded-3xl shadow-[0_10px_30px_-12px_rgba(26,42,107,0.25)] p-5 sm:p-6">
            <img
              src={seloOficial}
              alt="Selo Turismo Azul Inclusivo - Certificação Oficial"
              className="w-[200px] sm:w-[240px] h-auto"
              loading="lazy"
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Emitido pelo Turismo Azul Inclusivo
          </p>
        </div>
      </section>

      {/* Texto institucional */}
      <section className="pt-8 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary text-center">
            Por que o Selo Azul existe
          </h2>
          <div className="mt-6 space-y-4 text-[15px] md:text-base text-foreground leading-relaxed">
            <p>
              Muitos estabelecimentos se dizem inclusivos, mas poucos têm preparo
              real para receber uma pessoa autista e sua família. A diferença entre
              uma viagem que cura e uma viagem que adoece está nos detalhes:
              acolhimento na chegada, equipe que entende crises sensoriais,
              flexibilidade no cardápio, um ambiente para se recompor.
            </p>
            <p>
              O Selo Azul nasceu para separar discurso de prática. Toda
              certificação envolve treinamento estruturado, mudança operacional
              e auditoria presencial. Nenhum estabelecimento recebe o selo apenas
              por se cadastrar - ele precisa provar, na rotina, que está pronto.
            </p>
            <p>
              Quando uma família vê o Selo Azul na plataforma, ela sabe que
              alguém já esteve lá, validou cada item e confirmou que o
              acolhimento é real.
            </p>
          </div>
        </div>
      </section>

      {/* Etapas */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary text-center">
            As 6 etapas da certificação
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            Da inscrição à emissão do selo, o processo costuma levar de 60 a 120 dias.
          </p>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            {etapas.map((e) => (
              <div
                key={e.titulo}
                className="bg-card rounded-2xl p-6 border shadow-sm flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <e.Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-primary text-lg">
                    {e.titulo}
                  </h3>
                  <p className="mt-2 text-[15px] text-foreground leading-relaxed">
                    {e.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requisitos */}
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary text-center">
            Requisitos para obter o Selo Azul
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            Critérios mínimos que todo estabelecimento certificado precisa atender.
          </p>
          <div className="mt-8 bg-card rounded-2xl p-6 md:p-8 border shadow-sm">
            <ul className="grid sm:grid-cols-2 gap-3">
              {requisitos.map((r) => (
                <li key={r} className="flex gap-3 text-[15px] text-foreground">
                  <Check className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Como verificamos */}
      <section className="py-14 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary text-center">
            Como verificamos na prática
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            A auditoria do Selo Azul combina três frentes de verificação independentes.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {verificacao.map((v) => (
              <div
                key={v.titulo}
                className="bg-card rounded-2xl p-6 border shadow-sm text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary mx-auto flex items-center justify-center">
                  <v.Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-display font-bold text-primary text-lg">
                  {v.titulo}
                </h3>
                <p className="mt-2 text-[15px] text-foreground leading-relaxed">
                  {v.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-white" style={{ backgroundColor: "#1A2A6B" }}>
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
            Pronto para certificar seu estabelecimento?
          </h2>
          <p className="mt-4 text-white/85">
            Comece pelo cadastro. Nossa equipe entra em contato com o plano completo
            de certificação para a sua operação.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#c9a84c] hover:bg-[#b9962e] text-[#1A2A6B] min-h-[52px] px-7 text-base font-semibold"
            >
              <Link to="/estabelecimentos">Quero o Selo Azul</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#1A2A6B] min-h-[52px] px-7 text-base font-semibold"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5 mr-2" />
                Falar com a equipe
              </a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-white/70">
            Quer conhecer os outros selos da plataforma?{" "}
            <Link to="/sobre-os-selos" className="underline">
              Veja todos os critérios
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
