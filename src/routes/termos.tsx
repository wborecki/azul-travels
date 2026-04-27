import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Turismo Azul" },
      {
        name: "description",
        content:
          "Termos de uso da plataforma Turismo Azul para famílias e estabelecimentos parceiros.",
      },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <article className="container mx-auto px-4 py-16 max-w-3xl prose prose-slate">
      <h1 className="text-3xl md:text-4xl font-display font-extrabold text-primary">
        Termos de Uso
      </h1>
      <p className="text-sm text-muted-foreground">
        Última atualização: 27 de abril de 2026
      </p>

      <h2>1. Aceite</h2>
      <p>
        Ao se cadastrar na lista de espera ou usar qualquer página do Turismo Azul, você
        concorda com estes Termos de Uso e com a nossa Política de Privacidade.
      </p>

      <h2>2. O que é o Turismo Azul</h2>
      <p>
        O Turismo Azul é um marketplace em desenvolvimento que conecta famílias de pessoas com
        Transtorno do Espectro Autista (TEA) a estabelecimentos turísticos preparados para
        recebê-las. Esta versão atual é uma <strong>pré-lançamento</strong> destinada
        exclusivamente à captação de leads.
      </p>

      <h2>3. Cadastro</h2>
      <ul>
        <li>Você deve fornecer informações verdadeiras e atualizadas.</li>
        <li>Cada e-mail só pode ser cadastrado uma vez.</li>
        <li>
          Você pode pedir o cancelamento da sua inscrição a qualquer momento por e-mail.
        </li>
      </ul>

      <h2>4. Uso adequado</h2>
      <p>É proibido:</p>
      <ul>
        <li>Cadastrar dados de terceiros sem autorização;</li>
        <li>Tentar acessar áreas restritas da plataforma;</li>
        <li>Realizar engenharia reversa, raspagem automatizada ou qualquer ataque ao serviço.</li>
      </ul>

      <h2>5. Conteúdo da plataforma</h2>
      <p>
        Todo conteúdo (textos, imagens, marca, código) é de propriedade da Solutions in BI
        Consulting LTDA ou usado sob licença. A reprodução sem autorização é proibida.
      </p>

      <h2>6. Limitação de responsabilidade</h2>
      <p>
        Nesta fase de pré-lançamento, o Turismo Azul não realiza reservas nem intermedeia
        contratos com estabelecimentos. Quando a plataforma abrir, todas as relações comerciais
        com hotéis, restaurantes, parques e demais parceiros serão feitas diretamente entre o
        usuário e o estabelecimento.
      </p>

      <h2>7. Alterações</h2>
      <p>
        Estes Termos podem ser atualizados a qualquer momento. Mudanças significativas serão
        comunicadas por e-mail aos cadastrados.
      </p>

      <h2>8. Lei aplicável e foro</h2>
      <p>
        Estes Termos são regidos pela legislação brasileira. Eventuais disputas serão resolvidas
        no foro da Comarca de Curitiba/PR, com renúncia a qualquer outro.
      </p>

      <h2>9. Contato</h2>
      <p>
        Dúvidas sobre estes Termos:{" "}
        <a href="mailto:contato@turismoazul.com.br" className="text-secondary font-semibold">
          contato@turismoazul.com.br
        </a>
      </p>
    </article>
  );
}
