import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Award, Home as HomeIcon, Heart, Check, MessageCircle } from "lucide-react";
const seloOficial = "https://ausjcarxquthyvtqgjmu.supabase.co/storage/v1/object/public/conteudo-capas/selos/selo-turismo-azul.png";

export const Route = createFileRoute("/sobre-os-selos")({
  head: () => ({
    meta: [
      { title: "Como auditamos cada estabelecimento · Turismo Azul" },
      {
        name: "description",
        content:
          "Entenda o processo de certificação Turismo Azul: como cada selo é validado e o que muda para a sua família.",
      },
      { property: "og:title", content: "Como auditamos cada estabelecimento · Turismo Azul" },
      {
        property: "og:description",
        content:
          "O processo de auditoria que garante que cada selo represente preparo real para receber famílias TEA.",
      },
    ],
  }),
  component: SobreOsSelosPage,
});

function SobreOsSelosPage() {
  const selos = [
    {
      Icon: ShieldCheck,
      cor: "bg-primary text-primary-foreground",
      nome: "Selo Azul",
      criterios: [
        "No mínimo 70% da equipe treinada em TEA/ABA pela Absoluto Educacional",
        "Capacitação validada com avaliação prática e certificado individual",
        "Renovação anual obrigatória com reciclagem de conteúdo",
        "Auditoria presencial pela equipe Turismo Azul",
      ],
    },
    {
      Icon: Award,
      cor: "bg-success text-success-foreground",
      nome: "Certificação Governamental",
      criterios: [
        "Certificação federal pública (após aprovação do PL 4108/2024)",
        "Auditoria por órgão governamental independente",
        "Validade fixada por norma pública",
        "Lista oficial publicada pelo governo",
      ],
    },
    {
      Icon: HomeIcon,
      cor: "bg-roxo-suave text-roxo-suave-foreground",
      nome: "Sala Sensorial",
      criterios: [
        "Espaço físico dedicado, com porta e isolamento acústico",
        "Controle de luz, volume e estímulos visuais",
        "Mobiliário e materiais validados por especialista em TEA",
        "Disponível durante todo o horário de funcionamento",
      ],
    },
    {
      Icon: Heart,
      cor: "bg-secondary text-secondary-foreground",
      nome: "Concierge TEA",
      criterios: [
        "Profissional dedicado, com formação em autismo",
        "Disponível durante toda a estadia da família",
        "Recebe o perfil sensorial antes do check-in",
        "Avaliação obrigatória após cada estadia",
      ],
    },
  ];

  const whatsappUrl =
    "https://wa.me/5511947096278?text=" +
    encodeURIComponent("Olá! Tenho interesse no Selo Azul Turismo Azul Inclusivo.");

  return (
    <div className="bg-white">
      <section className="bg-azul-claro pt-12 pb-8 md:pt-16 md:pb-10">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-primary">
            Como auditamos cada estabelecimento
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            Qualquer hotel pode se dizer inclusivo. A gente exige prova. Conheça os 4 critérios
            que cada selo precisa cumprir antes de aparecer na plataforma.
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
              className="w-[220px] sm:w-[280px] h-auto"
              loading="lazy"
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Selo Turismo Azul Inclusivo · Emitido pela Absoluto Educacional
          </p>
        </div>
      </section>

      <section className="pt-6 pb-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          {selos.map((s) => (
            <div
              key={s.nome}
              className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl ${s.cor} flex items-center justify-center shrink-0`}
                >
                  <s.Icon className="h-6 w-6" />
                </div>
                <h2 className="font-display font-bold text-primary text-xl">{s.nome}</h2>
              </div>
              <ul className="mt-5 space-y-2.5">
                {s.criterios.map((c) => (
                  <li key={c} className="flex gap-2 text-[15px] text-foreground">
                    <Check className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 text-white" style={{ backgroundColor: "#1A2A6B" }}>
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
            Seu estabelecimento está pronto para dar esse passo?
          </h2>
          <p className="mt-4 text-white/85">
            A formação começa com um cadastro. Nossa equipe entra em contato para iniciar o processo.
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
        </div>
      </section>
    </div>
  );
}
