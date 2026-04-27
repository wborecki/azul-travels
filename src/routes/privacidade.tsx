import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade (LGPD) — Turismo Azul" },
      {
        name: "description",
        content:
          "Como coletamos, armazenamos e protegemos os dados das famílias e estabelecimentos do Turismo Azul, em conformidade com a LGPD.",
      },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <article className="container mx-auto px-4 py-16 max-w-3xl prose prose-slate">
      <h1 className="text-3xl md:text-4xl font-display font-extrabold text-primary">
        Política de Privacidade
      </h1>
      <p className="text-sm text-muted-foreground">
        Última atualização: 27 de abril de 2026
      </p>

      <h2>1. Quem somos</h2>
      <p>
        O Turismo Azul é um produto da <strong>Solutions in BI Consulting LTDA</strong>{" "}
        (CNPJ 59.668.668/0001-54), em parceria com a <strong>Absoluto Educacional</strong>{" "}
        (CNPJ 18.536.766/0001-50). Somos os controladores dos dados pessoais coletados pela
        plataforma.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>Dados de cadastro (famílias):</strong> nome do responsável, e-mail, WhatsApp,
          cidade, estado, status de diagnóstico do filho, número de filhos com TEA e preocupações
          sobre viagens.
        </li>
        <li>
          <strong>Dados de cadastro (estabelecimentos):</strong> nome do responsável, cargo, e-mail
          comercial, WhatsApp, dados do estabelecimento e iniciativas atuais de inclusão.
        </li>
        <li>
          <strong>Dados de navegação:</strong> informações técnicas anônimas para entender uso e
          performance.
        </li>
      </ul>

      <h2>3. Para que usamos seus dados</h2>
      <ul>
        <li>Avisar você sobre o lançamento da plataforma.</li>
        <li>Enviar comunicações relevantes sobre turismo TEA (apenas com seu consentimento).</li>
        <li>
          Adaptar a plataforma com base nas preocupações coletadas, sem identificar pessoas.
        </li>
      </ul>

      <h2>4. Com quem compartilhamos</h2>
      <p>
        <strong>Não vendemos seus dados.</strong> Compartilhamos apenas com fornecedores
        essenciais (hospedagem, e-mail, banco de dados), todos contratados sob acordo de
        confidencialidade e tratamento conforme a LGPD.
      </p>

      <h2>5. Por quanto tempo guardamos</h2>
      <p>
        Mantemos seus dados enquanto você estiver inscrito na lista de espera. Você pode pedir a
        exclusão a qualquer momento.
      </p>

      <h2>6. Seus direitos (Art. 18 da LGPD)</h2>
      <ul>
        <li>Confirmar que tratamos seus dados;</li>
        <li>Acessar, corrigir, anonimizar ou portar seus dados;</li>
        <li>Eliminar dados tratados com seu consentimento;</li>
        <li>Revogar o consentimento a qualquer momento.</li>
      </ul>

      <h2>7. Como exercer seus direitos</h2>
      <p>
        Envie um e-mail para{" "}
        <a href="mailto:dpo@turismoazul.com.br" className="text-secondary font-semibold">
          dpo@turismoazul.com.br
        </a>{" "}
        com o assunto “LGPD” e a solicitação. Respondemos em até 15 dias úteis.
      </p>

      <h2>8. Segurança</h2>
      <p>
        Aplicamos criptografia em trânsito (HTTPS), controle de acesso e auditoria. Em caso de
        incidente, comunicamos os titulares e a ANPD conforme exige a lei.
      </p>

      <h2>9. Mudanças nesta política</h2>
      <p>
        Esta política pode ser atualizada. A versão vigente sempre estará nesta página, com a
        data de atualização no topo.
      </p>
    </article>
  );
}
