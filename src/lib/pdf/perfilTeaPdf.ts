/**
 * Gera um PDF profissional do Perfil TEA + dados da reserva, pronto
 * para ser entregue ao estabelecimento. Roda 100% no browser via jsPDF.
 *
 * O conteúdo vem de `resumoDoPerfil`, a mesma fonte da tela de revisão da
 * família e do painel do estabelecimento - o que a família viu antes de
 * autorizar é exatamente o que sai impresso aqui.
 */

import jsPDF from "jspdf";
import type { Tables } from "@/integrations/supabase/types";
import { alertasDoPerfil, resumoDoPerfil } from "@/lib/perfil/resumo";

type Perfil = Tables<"perfil_sensorial">;
type Reserva = Tables<"reservas">;
type Estab = Pick<Tables<"estabelecimentos">, "nome" | "cidade" | "estado">;

type Linha = { rotulo: string; valor: string | null | undefined };

function arr(v: string[] | null | undefined): string {
  return (v ?? []).filter(Boolean).join(", ");
}

function txt(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : "-";
}

function num(v: number | null | undefined): string {
  return v === null || v === undefined ? "-" : String(v);
}

function dataFmt(v: string | null | undefined): string {
  if (!v) return "-";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

interface PdfOpts {
  perfil: Perfil;
  reserva?: Reserva | null;
  estabelecimento?: Estab | null;
}

export function gerarPerfilTeaPdf({ perfil, reserva, estabelecimento }: PdfOpts): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  function ensureSpace(h: number) {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function header() {
    doc.setFillColor(13, 71, 161); // azul escuro
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Turismo Azul · Perfil TEA", margin, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageW - margin, 14, {
      align: "right",
    });
    doc.setTextColor(0, 0, 0);
    y = 30;
  }

  function sectionTitle(title: string) {
    ensureSpace(12);
    doc.setFillColor(232, 244, 253);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 71, 161);
    doc.text(title.toUpperCase(), margin + 2, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  function rows(linhas: Linha[]) {
    doc.setFontSize(9.5);
    for (const { rotulo, valor } of linhas) {
      const v = txt(valor);
      const rotuloWrapped = doc.splitTextToSize(rotulo, 46);
      const valorWrapped = doc.splitTextToSize(v, contentW - 55);
      const blockH = Math.max(5, rotuloWrapped.length * 4.6, valorWrapped.length * 4.6);
      ensureSpace(blockH + 1);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text(rotuloWrapped, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(valorWrapped, margin + 50, y);
      y += blockH + 1;
    }
    y += 2;
  }

  function paragrafo(texto: string) {
    const wrapped = doc.splitTextToSize(texto, contentW);
    const blockH = wrapped.length * 4.6;
    ensureSpace(blockH);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(wrapped, margin, y);
    y += blockH + 2;
  }

  header();

  // Identificação
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(perfil.nome_autista, margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(
    [
      perfil.idade != null ? `${perfil.idade} anos` : "Idade não informada",
      perfil.nivel_tea ? `Nível ${perfil.nivel_tea}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    margin,
    y,
  );
  doc.setTextColor(0, 0, 0);
  y += 8;

  // Alertas de segurança antes de qualquer outra coisa: é o que a equipe
  // precisa ter lido mesmo que não leia o resto do documento.
  const alertas = alertasDoPerfil(perfil);
  if (alertas.length > 0) {
    ensureSpace(14 + alertas.length * 6);
    doc.setFillColor(255, 244, 214);
    doc.setDrawColor(217, 155, 20);
    const alturaBox = 9 + alertas.length * 9;
    doc.rect(margin, y, contentW, alturaBox, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(140, 90, 0);
    doc.text("ATENÇÃO DA EQUIPE", margin + 3, y + 6);
    doc.setTextColor(0, 0, 0);
    let ay = y + 12;
    for (const a of alertas) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${a.rotulo}:`, margin + 3, ay);
      doc.setFont("helvetica", "normal");
      const w = doc.splitTextToSize(txt(a.valor), contentW - 46);
      doc.text(w, margin + 42, ay);
      ay += Math.max(9, w.length * 4.6);
    }
    y += alturaBox + 6;
  }

  if (estabelecimento || reserva) {
    sectionTitle("Esta reserva");
    rows([
      { rotulo: "Estabelecimento", valor: estabelecimento?.nome },
      {
        rotulo: "Local",
        valor: estabelecimento
          ? `${estabelecimento.cidade ?? "-"}/${estabelecimento.estado ?? "-"}`
          : null,
      },
      { rotulo: "Check-in", valor: reserva ? dataFmt(reserva.data_checkin) : null },
      { rotulo: "Check-out", valor: reserva ? dataFmt(reserva.data_checkout) : null },
      { rotulo: "Pessoa de referência", valor: reserva?.pessoa_referencia },
      { rotulo: "Acompanhantes", valor: num(reserva?.num_acompanhantes ?? null) },
      { rotulo: "Objetivo da viagem", valor: arr(reserva?.objetivo_viagem ?? null) },
    ]);
    if (reserva?.notas_especificas) {
      doc.setFont("helvetica", "bold");
      doc.text("Notas específicas desta estadia:", margin, y);
      y += 5;
      paragrafo(reserva.notas_especificas);
    }
    if (reserva?.historico_negativo) {
      doc.setFont("helvetica", "bold");
      doc.text("Histórico negativo (atenção):", margin, y);
      y += 5;
      paragrafo(reserva.historico_negativo);
    }
    if (reserva?.recomendacoes_adicionais) {
      doc.setFont("helvetica", "bold");
      doc.text("Recomendações adicionais:", margin, y);
      y += 5;
      paragrafo(reserva.recomendacoes_adicionais);
    }
    if (reserva?.conversa_previa_equipe) {
      doc.setFont("helvetica", "italic");
      paragrafo("→ A família solicita conversa prévia com a equipe.");
    }
  }

  for (const secao of resumoDoPerfil(perfil)) {
    sectionTitle(secao.titulo);
    rows(secao.linhas);
  }

  // Rodapé com paginação
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Turismo Azul · Documento confidencial · Página ${i} de ${total}`,
      pageW / 2,
      pageH - 6,
      { align: "center" },
    );
  }

  return doc;
}

export function baixarPerfilTeaPdf(opts: PdfOpts) {
  const doc = gerarPerfilTeaPdf(opts);
  const slug = opts.perfil.nome_autista
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`perfil-tea-${slug || "perfil"}.pdf`);
}
