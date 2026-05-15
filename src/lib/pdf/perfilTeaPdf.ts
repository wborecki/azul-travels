/**
 * Gera um PDF profissional do Perfil TEA + dados da reserva, pronto
 * para ser entregue ao estabelecimento. Roda 100% no browser via jsPDF.
 */

import jsPDF from "jspdf";
import type { Tables } from "@/integrations/supabase/types";

type PerfilTea = Tables<"perfil_tea">;
type Reserva = Tables<"reservas">;
type Estab = Pick<Tables<"estabelecimentos">, "nome" | "cidade" | "estado">;

type Linha = { rotulo: string; valor: string | null | undefined };

function arr(v: string[] | null | undefined): string {
  return (v ?? []).filter(Boolean).join(", ");
}

function bool(v: boolean | null | undefined): string {
  if (v === true) return "Sim";
  if (v === false) return "Não";
  return "—";
}

function txt(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : "—";
}

function num(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : String(v);
}

function timeFmt(v: string | null | undefined): string {
  if (!v) return "—";
  return v.length >= 5 ? v.slice(0, 5) : v;
}

function dataFmt(v: string | null | undefined): string {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

interface PdfOpts {
  perfil: PerfilTea;
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
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      pageW - margin,
      14,
      { align: "right" },
    );
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
      const v = txt(typeof valor === "string" ? valor : (valor ?? "").toString());
      const wrapped = doc.splitTextToSize(v, contentW - 55);
      const blockH = Math.max(5, wrapped.length * 4.6);
      ensureSpace(blockH + 1);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text(rotulo, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(wrapped, margin + 50, y);
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
  doc.text(perfil.nome_pessoa, margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(
    `${perfil.idade != null ? `${perfil.idade} anos` : "Idade não informada"}`,
    margin,
    y,
  );
  doc.setTextColor(0, 0, 0);
  y += 8;

  if (estabelecimento || reserva) {
    sectionTitle("Esta reserva");
    rows([
      { rotulo: "Estabelecimento", valor: estabelecimento?.nome },
      {
        rotulo: "Local",
        valor: estabelecimento
          ? `${estabelecimento.cidade ?? "—"}/${estabelecimento.estado ?? "—"}`
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

  sectionTitle("Comunicação e compreensão");
  rows([
    { rotulo: "Forma de comunicação", valor: arr(perfil.forma_comunicacao) },
    { rotulo: "Detalhes (misto)", valor: perfil.comunicacao_misto_descricao },
    { rotulo: "Compreende instruções", valor: perfil.compreende_instrucoes },
    { rotulo: "Responde melhor a", valor: perfil.responde_melhor_a },
    { rotulo: "Recursos usados", valor: arr(perfil.recursos_comunicacao) },
    { rotulo: "Observações", valor: perfil.observacoes_comunicacao },
  ]);

  sectionTitle("Apoio diário");
  rows([
    { rotulo: "Alimentação", valor: perfil.apoio_alimentacao },
    { rotulo: "Higiene", valor: perfil.apoio_higiene },
    { rotulo: "Vestir-se", valor: perfil.apoio_vestir },
    { rotulo: "Deslocamento", valor: perfil.apoio_deslocamento },
    { rotulo: "Compreensão de regras", valor: perfil.apoio_regras },
    { rotulo: "Autonomia em espaços", valor: perfil.autonomia_espacos },
    { rotulo: "Supervisão constante", valor: bool(perfil.supervisao_constante) },
  ]);

  sectionTitle("Rotina e horários");
  rows([
    { rotulo: "Acordar", valor: timeFmt(perfil.horario_acordar) },
    { rotulo: "Café da manhã", valor: timeFmt(perfil.horario_cafe) },
    { rotulo: "Almoço", valor: timeFmt(perfil.horario_almoco) },
    { rotulo: "Lanche", valor: timeFmt(perfil.horario_lanche) },
    { rotulo: "Jantar", valor: timeFmt(perfil.horario_jantar) },
    { rotulo: "Dormir", valor: timeFmt(perfil.horario_dormir) },
    { rotulo: "Tem rotina matinal", valor: bool(perfil.tem_rotina_matinal) },
    { rotulo: "Descrição rotina", valor: perfil.rotina_matinal_descricao },
    {
      rotulo: "Sofre com mudança de rotina",
      valor: bool(perfil.mudanca_rotina_sofrimento),
    },
  ]);

  sectionTitle("Alimentação");
  rows([
    { rotulo: "Seletividade", valor: perfil.seletividade },
    { rotulo: "Alimentos aceitos", valor: perfil.alimentos_aceitos },
    { rotulo: "Alimentos recusados", valor: perfil.alimentos_recusados },
    {
      rotulo: "Sensibilidades",
      valor: arr(perfil.sensibilidades_alimentares),
    },
    { rotulo: "Espera fila restaurante", valor: perfil.espera_fila_restaurante },
    {
      rotulo: "Prefere ambiente reservado",
      valor: bool(perfil.prefere_ambiente_reservado),
    },
    { rotulo: "Utensílios específicos", valor: bool(perfil.utensilios_especificos) },
    { rotulo: "Marca favorece aceitação", valor: perfil.marca_favorece_aceitacao },
    { rotulo: "Risco de recusa", valor: perfil.risco_recusa_alimentar },
  ]);

  sectionTitle("Perfil sensorial");
  rows([
    { rotulo: "Barulho de pessoas", valor: perfil.sensorial_barulho_pessoas },
    { rotulo: "Música ambiente", valor: perfil.sensorial_musica_ambiente },
    { rotulo: "Sons súbitos", valor: perfil.sensorial_sons_subitos },
    { rotulo: "Eco", valor: perfil.sensorial_eco },
    { rotulo: "Cheiros fortes", valor: perfil.sensorial_cheiros_fortes },
    { rotulo: "Perfumes", valor: perfil.sensorial_perfumes },
    { rotulo: "Iluminação intensa", valor: perfil.sensorial_iluminacao_intensa },
    { rotulo: "Luz piscando", valor: perfil.sensorial_luz_piscando },
    { rotulo: "Calor", valor: perfil.sensorial_calor },
    { rotulo: "Frio", valor: perfil.sensorial_frio },
    { rotulo: "Toque inesperado", valor: perfil.sensorial_toque_inesperado },
    { rotulo: "Superfícies molhadas", valor: perfil.sensorial_superficies_molhadas },
    { rotulo: "Locais cheios", valor: perfil.sensorial_locais_cheios },
    { rotulo: "Movimento visual", valor: perfil.sensorial_movimento_visual },
    { rotulo: "Usa abafadores", valor: perfil.usa_abafadores },
    { rotulo: "Detalhes abafadores", valor: perfil.abafadores_descricao },
    { rotulo: "Gatilho sensorial principal", valor: perfil.gatilho_sensorial },
    { rotulo: "Estímulos que acalmam", valor: perfil.estimulos_acalmam },
  ]);

  sectionTitle("Regulação emocional");
  rows([
    { rotulo: "Sinais de desconforto", valor: arr(perfil.sinais_desconforto) },
    { rotulo: "Desencadeadores", valor: perfil.desencadeadores },
    { rotulo: "Tempo para acalmar", valor: perfil.tempo_acalmar },
    { rotulo: "Estratégias que funcionam", valor: arr(perfil.estrategias_funcionam) },
    { rotulo: "O que NÃO fazer", valor: perfil.o_que_nao_fazer },
    { rotulo: "Risco de fuga", valor: bool(perfil.risco_fuga) },
    { rotulo: "Preferência em crise", valor: arr(perfil.preferencia_crise) },
  ]);

  sectionTitle("Quarto");
  rows([
    { rotulo: "Localização preferida", valor: perfil.preferencia_localizacao },
    { rotulo: "Sensível ao ar-condicionado", valor: bool(perfil.sensibilidade_ar_condicionado) },
    { rotulo: "Sensível à iluminação", valor: bool(perfil.sensibilidade_iluminacao) },
    { rotulo: "Dorme melhor com", valor: arr(perfil.dorme_melhor_com) },
    { rotulo: "Objetos de adaptação", valor: perfil.objetos_adaptacao },
    { rotulo: "Preparação especial", valor: perfil.preparacao_especial_quarto },
  ]);

  sectionTitle("Áreas comuns");
  rows([
    { rotulo: "Gosta de piscina", valor: perfil.gosta_piscina },
    { rotulo: "Piscina sem multidão", valor: bool(perfil.piscina_muitas_pessoas) },
    { rotulo: "Piscina aquecida", valor: bool(perfil.piscina_temperatura) },
    { rotulo: "Piscina supervisionada", valor: bool(perfil.piscina_supervisao) },
    { rotulo: "Piscina horário tranquilo", valor: bool(perfil.piscina_horario_tranquilo) },
    { rotulo: "Recreação participa", valor: bool(perfil.recreacao_gosta) },
    { rotulo: "Preferência recreação", valor: perfil.recreacao_preferencia },
    { rotulo: "Tolera som alto recreação", valor: bool(perfil.recreacao_tolera_som) },
    { rotulo: "Interesses recreação", valor: perfil.recreacao_interesses },
    { rotulo: "Evitar na recreação", valor: perfil.recreacao_evitar },
    { rotulo: "Restaurante: fila", valor: perfil.restaurante_fila },
    { rotulo: "Restaurante reservado", valor: bool(perfil.restaurante_reservado) },
    { rotulo: "Apoio visual restaurante", valor: bool(perfil.restaurante_apoio_visual) },
    { rotulo: "Horário tranquilo restaurante", valor: bool(perfil.restaurante_horario_tranquilo) },
    { rotulo: "Check-in causa ansiedade", valor: bool(perfil.checkin_ansiedade) },
    { rotulo: "Evitar fila no check-in", valor: bool(perfil.checkin_evitar_fila) },
    { rotulo: "Equipe deve saber prévio", valor: bool(perfil.checkin_equipe_saber) },
  ]);

  sectionTitle("Interesses e estratégias");
  rows([
    { rotulo: "Atividades preferidas", valor: perfil.atividades_preferidas },
    { rotulo: "Temas de interesse", valor: perfil.temas_interesses },
    { rotulo: "Objetos / personagens", valor: perfil.objetos_personagens },
    { rotulo: "O que gera alegria", valor: perfil.o_que_gera_alegria },
    {
      rotulo: "Estratégias em ambientes novos",
      valor: perfil.estrategias_ambientes_novos,
    },
    { rotulo: "Formas de abordagem", valor: perfil.formas_abordagem },
  ]);

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
  const slug = opts.perfil.nome_pessoa
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`perfil-tea-${slug || "perfil"}.pdf`);
}
