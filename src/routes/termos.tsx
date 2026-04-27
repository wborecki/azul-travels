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
      <p className="text-sm text-muted-foreground">Vigente a partir de abril de 2026</p>

      <h2>1. O que é o Turismo Azul</h2>
      <p>
        O Turismo Azul é um marketplace digital em desenvolvimento que vai conectar famílias de
        pessoas com Transtorno do Espectro Autista (TEA) a estabelecimentos turísticos preparados
        para recebê-las. Esta versão atual é uma <strong>pré-lançamento</strong> destinada
        exclusivamente à captação de leads e demonstração do produto.
      </p>

      <h2>2. Cadastro na lista de espera</h2>
      <p>
        Ao se cadastrar você autoriza o contato sobre o lançamento da plataforma. Não há cobrança
        ou compromisso financeiro de nenhum tipo. Cada e-mail só pode ser cadastrado uma vez e
        você pode pedir o descadastro a qualquer momento.
      </p>

      <h2>3. Dados de demonstração</h2>
      <p>
        Os dados exibidos na seção <code>/demo</code> são exclusivamente ilustrativos e{" "}
        <strong>não representam estabelecimentos reais cadastrados</strong>. Quando a plataforma
        abrir, todas as informações exibidas serão reais e auditadas pela nossa equipe.
      </p>

      <h2>4. Uso adequado</h2>
      <p>É proibido:</p>
      <ul>
        <li>Cadastrar dados de terceiros sem autorização;</li>
        <li>Tentar acessar áreas restritas;</li>
        <li>Realizar engenharia reversa, raspagem automatizada ou qualquer ataque ao serviço.</li>
      </ul>

      <h2>5. Propriedade intelectual</h2>
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
        no foro da Comarca de Curitiba/PR.
      </p>

      <h2>9. Contato</h2>
      <p>
        Dúvidas:{" "}
        <a href="mailto:contato@turismoazul.com.br" className="text-secondary font-semibold">
          contato@turismoazul.com.br
        </a>
      </p>
    </article>
  );
}
