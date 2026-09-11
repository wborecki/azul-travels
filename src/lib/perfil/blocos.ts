/**
 * Os 10 blocos do Perfil TEA, derivados do Pré-Check-in (Apostila do Concierge).
 *
 * As seções 1 e 11 do PDF (datas, acompanhantes, objetivo da viagem, histórico)
 * são por hospedagem, não por pessoa: moram em `reservas` e são perguntadas no
 * fluxo de reserva, não aqui.
 */

import {
  BedDouble,
  Brain,
  Compass,
  HeartHandshake,
  LifeBuoy,
  MessageSquare,
  Sparkles,
  Sun,
  Utensils,
  Waves,
} from "lucide-react";
import type { Bloco, PerfilDraft } from "./tipos";

const NIVEIS_INTENSIDADE = [
  { v: "baixo", t: "Pouco" },
  { v: "medio", t: "Médio" },
  { v: "alto", t: "Muito" },
  { v: "depende", t: "Depende" },
];

const SIM_PARCIAL_NAO = [
  { v: "sim", t: "Sim" },
  { v: "parcialmente", t: "Em parte" },
  { v: "nao", t: "Não" },
];

function marcou(campo: "areas_usadas", valor: string) {
  return (d: PerfilDraft) => (d[campo] ?? []).includes(valor);
}

export const BLOCOS: Bloco[] = [
  // ───────────────────────────────────────────────────────────── Essencial
  {
    id: "essencial",
    titulo: "O básico",
    porque: "É o mínimo para o hotel saber quem está chegando e se preparar.",
    Icon: Sparkles,
    peso: 25,
    minutos: 2,
    perguntas: [
      {
        tipo: "texto",
        campo: "nome_autista",
        titulo: "Como vocês chamam ele ou ela?",
        ajuda: "É o nome que a equipe do hotel vai usar na chegada",
        exemplo: "Apelido ou primeiro nome",
      },
      {
        tipo: "numero",
        campo: "idade",
        titulo: "Quantos anos tem?",
        min: 1,
        max: 99,
      },
      {
        tipo: "unica",
        campo: "nivel_tea",
        titulo: "Qual o nível de suporte?",
        ajuda: "É a classificação do DSM-5, que costuma estar no laudo",
        opcoes: [
          { v: "leve", t: "Nível 1", d: "Fala bem e é independente na maior parte do dia." },
          { v: "moderado", t: "Nível 2", d: "Precisa de apoio em várias situações do dia a dia." },
          { v: "severo", t: "Nível 3", d: "Precisa de suporte constante." },
        ],
      },
      {
        tipo: "multipla",
        campo: "forma_comunicacao",
        titulo: "Como ele se comunica?",
        ajuda: "Pode marcar mais de uma",
        opcoes: [
          { v: "verbal_fluente", t: "Fala com frases completas" },
          { v: "frases_curtas", t: "Fala frases curtas" },
          { v: "palavras_isoladas", t: "Palavras isoladas" },
          { v: "gestos_imagens", t: "Gestos ou imagens" },
        ],
      },
      {
        tipo: "booleano",
        campo: "risco_fuga",
        titulo: "Ele pode se afastar sozinho sem avisar?",
        ajuda:
          "A equipe precisa saber antes da chegada. Isso só aumenta o cuidado, nada muda no atendimento",
      },
      {
        tipo: "chips-booleano",
        titulo: "O que ajudaria vocês neste hotel?",
        ajuda: "Usamos isso para mostrar primeiro os lugares que já oferecem o que vocês precisam",
        opcoes: [
          { campo: "precisa_checkin_antecipado", v: "checkin", t: "Check-in antecipado" },
          { campo: "precisa_fila_prioritaria", v: "fila", t: "Fila prioritária" },
          { campo: "precisa_sala_sensorial", v: "sala", t: "Sala sensorial no local" },
          { campo: "precisa_concierge_tea", v: "concierge", t: "Concierge TEA" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────── Comunicação
  {
    id: "comunicacao",
    titulo: "Comunicação",
    porque: "A equipe aprende como falar com ele antes do primeiro contato.",
    Icon: MessageSquare,
    peso: 10,
    minutos: 1,
    perguntas: [
      {
        tipo: "texto",
        campo: "comunicacao_misto_descricao",
        titulo: "Como funciona essa mistura no dia a dia?",
        exemplo: "Fala frases curtas em casa, mas usa gestos com estranhos…",
        multilinha: true,
        visivelSe: (d) => (d.forma_comunicacao ?? []).length > 1,
      },
      {
        tipo: "unica",
        campo: "compreende_instrucoes",
        titulo: "Ele entende instruções simples?",
        ajuda: 'Do tipo "pega a toalha" ou "espera aqui"',
        opcoes: SIM_PARCIAL_NAO,
      },
      {
        tipo: "multipla",
        campo: "responde_melhor_a",
        titulo: "Ele responde melhor a quê?",
        ajuda: "Pode marcar mais de uma",
        opcoes: [
          { v: "verbal", t: "Linguagem falada" },
          { v: "pistas_visuais", t: "Pistas visuais", d: "Apontar, mostrar foto, placa." },
          { v: "demonstracao", t: "Demonstração prática", d: "Fazer junto, mostrar como se faz." },
        ],
      },
      {
        tipo: "multipla",
        campo: "recursos_comunicacao",
        titulo: "Usa algum recurso de comunicação?",
        opcoes: [
          { v: "prancha", t: "Prancha de comunicação" },
          { v: "aplicativo", t: "Aplicativo no celular ou tablet" },
          { v: "pecs", t: "PECS" },
          { v: "libras", t: "Libras" },
        ],
        permiteOutro: true,
        nenhum: "Não usa nenhum",
      },
      {
        tipo: "texto",
        campo: "observacoes_comunicacao",
        titulo: "Mais alguma coisa sobre como falar com ele?",
        exemplo: "Não gosta que falem muito alto, precisa de tempo para responder…",
        multilinha: true,
      },
    ],
  },

  // ───────────────────────────────────────────────────────── Apoio diário
  {
    id: "apoio",
    titulo: "Apoio no dia a dia",
    porque: "Define quanto a equipe deve se aproximar ou dar espaço.",
    Icon: HeartHandshake,
    peso: 10,
    minutos: 1,
    perguntas: [
      {
        tipo: "matriz",
        id: "apoio",
        titulo: "Em quais dessas ele precisa de ajuda?",
        ajuda: "Marque só as que precisam. As outras contam como independente",
        tituloRefino: "Quanta ajuda em cada uma?",
        itens: [
          { campo: "apoio_alimentacao_nivel", t: "Comer", grupo: "Rotina" },
          { campo: "apoio_higiene_nivel", t: "Higiene e banho", grupo: "Rotina" },
          { campo: "apoio_vestir_nivel", t: "Vestir-se", grupo: "Rotina" },
          { campo: "apoio_deslocamento_nivel", t: "Se deslocar", grupo: "Ambiente" },
          { campo: "apoio_regras_nivel", t: "Entender regras do lugar", grupo: "Ambiente" },
        ],
        niveis: [
          { v: "apoio_parcial", t: "Um pouco", d: "Precisa de ajuda em parte da tarefa." },
          { v: "apoio_total", t: "Bastante", d: "Precisa de alguém junto do começo ao fim." },
        ],
        vazio: "independente",
        nenhumLabel: "É independente em todas",
      },
      {
        tipo: "unica",
        campo: "autonomia_espacos",
        titulo: "Ele pode circular sozinho por alguns espaços do hotel?",
        opcoes: SIM_PARCIAL_NAO,
      },
      {
        tipo: "booleano",
        campo: "supervisao_constante",
        titulo: "Precisa de supervisão constante?",
      },
      {
        tipo: "texto",
        campo: "apoio_observacoes",
        titulo: "Algo que a equipe deva saber sobre o apoio?",
        exemplo: "Aceita ajuda da mãe, mas não de estranhos…",
        multilinha: true,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────── Rotina
  {
    id: "rotina",
    titulo: "Rotina e horários",
    porque: "O hotel ajusta café da manhã, limpeza e atividades ao ritmo dele.",
    Icon: Sun,
    peso: 5,
    minutos: 2,
    perguntas: [
      { tipo: "hora", campo: "rotina_horario_acordar", titulo: "Costuma acordar às" },
      { tipo: "hora", campo: "rotina_horario_cafe", titulo: "Café da manhã às" },
      { tipo: "hora", campo: "rotina_horario_almoco", titulo: "Almoço às" },
      { tipo: "hora", campo: "rotina_horario_lanche", titulo: "Lanche da tarde às" },
      { tipo: "hora", campo: "rotina_horario_jantar", titulo: "Jantar às" },
      { tipo: "hora", campo: "rotina_horario_dormir", titulo: "Costuma dormir às" },
      {
        tipo: "booleano",
        campo: "tem_rotina_matinal",
        titulo: "Existe uma rotina de manhã que ajuda a organizar o dia?",
      },
      {
        tipo: "texto",
        campo: "rotina_matinal_descricao",
        titulo: "Como é essa rotina?",
        exemplo: "Acorda, escova os dentes, veste a roupa que escolheu na noite anterior…",
        multilinha: true,
        visivelSe: (d) => d.tem_rotina_matinal === true,
      },
      {
        tipo: "booleano",
        campo: "dificuldade_mudanca_rotina",
        titulo: "Mudanças de rotina costumam gerar sofrimento?",
      },
      {
        tipo: "texto",
        campo: "rotina_observacoes",
        titulo: "Mais alguma coisa sobre a rotina?",
        exemplo: "Tira soneca depois do almoço, toma remédio às 20h…",
        multilinha: true,
      },
    ],
  },

  // ────────────────────────────────────────────────────────── Alimentação
  {
    id: "alimentacao",
    titulo: "Alimentação",
    porque: "A cozinha se prepara antes, em vez de improvisar na hora da refeição.",
    Icon: Utensils,
    peso: 10,
    minutos: 3,
    perguntas: [
      {
        tipo: "unica",
        campo: "seletividade",
        titulo: "Ele é seletivo com comida?",
        opcoes: [
          { v: "nao", t: "Não", d: "Come praticamente de tudo." },
          { v: "leve", t: "Um pouco", d: "Recusa alguns alimentos." },
          { v: "moderada", t: "Bastante", d: "Come um conjunto limitado de alimentos." },
          { v: "severa", t: "Muito", d: "Come pouquíssimos alimentos, sempre os mesmos." },
        ],
      },
      {
        tipo: "texto",
        campo: "alimentos_aceitos",
        titulo: "O que ele come com tranquilidade?",
        ajuda: "Saber o que dá certo ajuda mais que saber o que dá errado",
        exemplo: "Arroz branco, frango grelhado, banana…",
        multilinha: true,
      },
      {
        tipo: "texto",
        campo: "alimentos_recusados",
        titulo: "O que ele recusa?",
        exemplo: "Comida com molho, verduras cozidas…",
        multilinha: true,
      },
      {
        tipo: "multipla",
        campo: "alimentacao_restricoes",
        titulo: "Tem alguma restrição alimentar?",
        opcoes: [
          { v: "glúten", t: "Glúten" },
          { v: "lactose", t: "Lactose" },
          { v: "amendoim", t: "Amendoim" },
          { v: "frutos do mar", t: "Frutos do mar" },
          { v: "ovo", t: "Ovo" },
          { v: "corantes", t: "Corantes" },
          { v: "açúcar", t: "Açúcar" },
        ],
        permiteOutro: true,
        nenhum: "Nenhuma restrição",
      },
      {
        tipo: "multipla",
        campo: "sensibilidades_alimentares",
        titulo: "O que costuma atrapalhar na hora de comer?",
        opcoes: [
          { v: "textura", t: "Textura" },
          { v: "temperatura", t: "Temperatura" },
          { v: "cheiro", t: "Cheiro" },
          { v: "cor", t: "Cor" },
          { v: "mistura", t: "Alimentos encostando um no outro" },
        ],
        permiteOutro: true,
        nenhum: "Nada disso",
      },
      {
        tipo: "unica",
        campo: "espera_fila_restaurante",
        titulo: "Ele consegue esperar na fila do buffet?",
        opcoes: [
          { v: "sim", t: "Sim" },
          { v: "com_apoio", t: "Com apoio" },
          { v: "nao", t: "Não" },
        ],
      },
      {
        tipo: "chips-booleano",
        titulo: "O que ajuda na hora da refeição?",
        opcoes: [
          { campo: "prefere_ambiente_reservado", v: "reservado", t: "Mesa em canto reservado" },
          { campo: "utensilios_especificos", v: "utensilios", t: "Talher ou copo próprio" },
        ],
      },
      {
        tipo: "texto",
        campo: "marca_favorece_aceitacao",
        titulo: "Tem alguma marca ou preparo que sempre funciona?",
        ajuda: "Se o hotel conseguir comprar antes, vale muito",
        exemplo: "Só toma o achocolatado da marca X, arroz sem tempero…",
      },
      {
        tipo: "unica",
        campo: "risco_recusa_alimentar",
        titulo: "Em lugares novos, qual o risco de ele não comer?",
        opcoes: [
          { v: "baixo", t: "Baixo" },
          { v: "medio", t: "Médio" },
          { v: "alto", t: "Alto" },
        ],
      },
      {
        tipo: "texto",
        campo: "alimentacao_observacoes",
        titulo: "Mais alguma coisa sobre alimentação?",
        multilinha: true,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── Sensorial
  {
    id: "sensorial",
    titulo: "Sensorial",
    porque: "É o que define quarto, horário e caminho até o restaurante.",
    Icon: Brain,
    peso: 15,
    minutos: 2,
    perguntas: [
      {
        tipo: "matriz",
        id: "sensorial",
        titulo: "O que costuma incomodar?",
        ajuda: "Marque só o que incomoda. O resto a gente assume que está tudo bem",
        tituloRefino: "Quanto cada um incomoda?",
        itens: [
          { campo: "sensorial_barulho_pessoas", t: "Barulho de gente conversando", grupo: "Som" },
          { campo: "sensorial_musica_ambiente", t: "Música ambiente", grupo: "Som" },
          { campo: "sensorial_sons_subitos", t: "Sons de repente", grupo: "Som" },
          { campo: "sensorial_eco", t: "Eco em ambientes grandes", grupo: "Som" },
          { campo: "sensorial_cheiros_fortes", t: "Cheiros fortes", grupo: "Cheiro" },
          { campo: "sensorial_perfumes", t: "Perfumes", grupo: "Cheiro" },
          { campo: "sensorial_iluminacao_intensa", t: "Luz muito forte", grupo: "Luz" },
          { campo: "sensorial_luz_piscando", t: "Luz piscando", grupo: "Luz" },
          { campo: "sensorial_calor", t: "Calor", grupo: "Temperatura" },
          { campo: "sensorial_frio", t: "Frio", grupo: "Temperatura" },
          { campo: "sensorial_toque_inesperado", t: "Toque inesperado", grupo: "Toque" },
          { campo: "sensorial_superficies_molhadas", t: "Superfície molhada", grupo: "Toque" },
          { campo: "sensorial_locais_cheios", t: "Lugares cheios", grupo: "Movimento" },
          { campo: "sensorial_movimento_visual", t: "Muita coisa se mexendo", grupo: "Movimento" },
        ],
        niveis: NIVEIS_INTENSIDADE.filter((n) => n.v !== "baixo"),
        vazio: "baixo",
        nenhumLabel: "Nada disso incomoda",
      },
      {
        tipo: "booleano",
        campo: "usa_abafadores",
        titulo: "Ele usa abafador ou outro recurso para se regular?",
      },
      {
        tipo: "texto",
        campo: "abafadores_descricao",
        titulo: "Qual?",
        exemplo: "Abafador vermelho, fone com música, bolinha de apertar…",
        visivelSe: (d) => d.usa_abafadores === true,
      },
      {
        tipo: "multipla",
        campo: "gatilhos",
        titulo: "Tem algum gatilho que o hotel deveria evitar?",
        opcoes: [
          { v: "fogos de artifício", t: "Fogos de artifício" },
          { v: "música alta", t: "Música alta" },
          { v: "animação com microfone", t: "Animação com microfone" },
          { v: "mudança de rotina", t: "Mudança de rotina" },
          { v: "esperar", t: "Esperar" },
          { v: "aglomeração", t: "Aglomeração" },
          { v: "elevador", t: "Elevador" },
        ],
        permiteOutro: true,
        nenhum: "Nenhum específico",
      },
      {
        tipo: "texto",
        campo: "estrategias_acalmar",
        titulo: "O que ajuda a acalmar?",
        exemplo: "Música no fone, ficar num lugar escuro, abraço apertado…",
        multilinha: true,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── Regulação
  {
    id: "regulacao",
    titulo: "Em momentos difíceis",
    porque: "É o roteiro que a equipe segue se algo sair do previsto.",
    Icon: LifeBuoy,
    peso: 15,
    minutos: 3,
    perguntas: [
      {
        tipo: "multipla",
        campo: "sinais_desconforto",
        titulo: "Como vocês percebem que ele está desconfortável?",
        opcoes: [
          { v: "choro", t: "Choro" },
          { v: "irritação", t: "Irritação" },
          { v: "agitação", t: "Agitação" },
          { v: "isolamento", t: "Se isola" },
          { v: "gritos", t: "Gritos" },
          { v: "fuga", t: "Tenta sair do lugar" },
          { v: "agressividade", t: "Agressividade" },
        ],
        permiteOutro: true,
      },
      {
        tipo: "texto",
        campo: "sinais_sobrecarga",
        titulo: "Tem algum sinal mais sutil, antes de chegar nesse ponto?",
        ajuda: "É o que permite a equipe agir cedo, quando ainda é fácil",
        exemplo: "Começa a balançar, tampa os ouvidos, fica em silêncio…",
        multilinha: true,
      },
      {
        tipo: "unica",
        campo: "tempo_acalmar",
        titulo: "Quanto tempo ele costuma levar para se acalmar?",
        opcoes: [
          { v: "rapido", t: "Rápido", d: "Menos de 5 minutos." },
          { v: "medio", t: "Médio", d: "Entre 5 e 15 minutos." },
          { v: "longo", t: "Longo", d: "Mais de 15 minutos." },
        ],
      },
      {
        tipo: "multipla",
        campo: "estrategias_funcionam",
        titulo: "O que funciona nessas horas?",
        opcoes: [
          { v: "diminuir_falas", t: "Falar menos" },
          { v: "retirar_local", t: "Sair do lugar" },
          { v: "oferecer_objeto", t: "Oferecer o objeto dele" },
          { v: "chamar_responsavel", t: "Chamar o responsável" },
          { v: "reduzir_luz_som", t: "Baixar luz e som" },
        ],
        permiteOutro: true,
      },
      {
        tipo: "texto",
        campo: "o_que_nao_fazer",
        titulo: "O que a equipe não deve fazer de jeito nenhum?",
        ajuda: "Essa resposta vai destacada para a equipe. Pode ser direta",
        exemplo:
          "Não segurar pelo braço, não insistir com perguntas, não chamar atenção em público…",
        multilinha: true,
      },
      {
        tipo: "multipla",
        campo: "preferencia_crise",
        titulo: "Se acontecer uma crise, o que vocês preferem que façam primeiro?",
        opcoes: [
          { v: "diminuir_estimulos", t: "Diminuir os estímulos" },
          { v: "retirar_local", t: "Levar para um lugar calmo" },
          { v: "oferecer_objeto", t: "Oferecer objeto de regulação" },
          { v: "chamar_responsavel", t: "Chamar o responsável na hora" },
        ],
        permiteOutro: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────── Quarto
  {
    id: "quarto",
    titulo: "No quarto",
    porque: "O hotel escolhe e prepara o quarto antes de vocês chegarem.",
    Icon: BedDouble,
    peso: 5,
    minutos: 2,
    perguntas: [
      {
        tipo: "multipla",
        campo: "quarto_localizacao",
        titulo: "Onde o quarto deveria ficar?",
        opcoes: [
          { v: "longe_barulho", t: "Longe de barulho" },
          { v: "andar_terreo", t: "Andar térreo" },
          { v: "mais_silencioso", t: "Ala mais silenciosa" },
          { v: "proximo_recepcao", t: "Perto da recepção" },
        ],
        nenhum: "Tanto faz",
      },
      {
        tipo: "multipla",
        campo: "dorme_melhor_com",
        titulo: "Ele dorme melhor com o quê?",
        opcoes: [
          { v: "pouca_luz", t: "Pouca luz" },
          { v: "escuro_total", t: "Escuro total" },
          { v: "ruido_branco", t: "Ruído branco" },
          { v: "silencio", t: "Silêncio" },
        ],
        permiteOutro: true,
      },
      {
        tipo: "chips-booleano",
        titulo: "Alguma dessas se aplica?",
        opcoes: [
          { campo: "sensibilidade_ar_condicionado", v: "ar", t: "Sensível ao ar-condicionado" },
          { campo: "sensibilidade_iluminacao", v: "luz", t: "Sensível à iluminação do quarto" },
          { campo: "quarto_sem_estampas", v: "estampas", t: "Sem estampas ou cores fortes" },
          { campo: "quarto_cama_extra", v: "cama", t: "Precisa de cama extra" },
        ],
      },
      {
        tipo: "texto",
        campo: "objetos_adaptacao",
        titulo: "Que objetos ele leva para se adaptar?",
        ajuda: "A equipe evita mexer ou guardar esses itens na arrumação",
        exemplo: "Travesseiro próprio, cobertor, boneco…",
        multilinha: true,
      },
      {
        tipo: "texto",
        campo: "preparacao_especial_quarto",
        titulo: "Precisa de alguma preparação antes de vocês entrarem?",
        exemplo: "Retirar o frigobar, tirar quadros da parede, deixar a cortina fechada…",
        multilinha: true,
      },
      {
        tipo: "texto",
        campo: "quarto_observacoes",
        titulo: "Mais alguma coisa sobre o quarto?",
        multilinha: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────── Áreas comuns
  {
    id: "areas",
    titulo: "Áreas do hotel",
    porque: "Cada área tem uma equipe diferente, e cada uma se prepara do seu jeito.",
    Icon: Waves,
    peso: 3,
    minutos: 2,
    perguntas: [
      {
        tipo: "multipla",
        campo: "areas_usadas",
        titulo: "Quais espaços vocês costumam usar?",
        ajuda: "Só perguntamos sobre os que vocês marcarem",
        opcoes: [
          { v: "piscina", t: "Piscina" },
          { v: "recreacao", t: "Recreação" },
          { v: "restaurante", t: "Restaurante" },
        ],
        nenhum: "Nenhum desses",
      },
      {
        tipo: "unica",
        campo: "gosta_piscina",
        titulo: "Ele gosta de piscina?",
        opcoes: [
          { v: "sim", t: "Sim" },
          { v: "as_vezes", t: "Às vezes" },
          { v: "nao", t: "Não" },
        ],
        visivelSe: marcou("areas_usadas", "piscina"),
      },
      {
        tipo: "chips-booleano",
        titulo: "Na piscina, o que precisa de atenção?",
        opcoes: [
          { campo: "piscina_muitas_pessoas", v: "cheia", t: "Não tolera piscina cheia" },
          { campo: "piscina_temperatura", v: "temp", t: "Sensível à temperatura da água" },
          { campo: "piscina_supervisao", v: "sup", t: "Precisa de supervisão constante" },
          { campo: "piscina_horario_tranquilo", v: "hora", t: "Prefere horário tranquilo" },
        ],
        visivelSe: marcou("areas_usadas", "piscina"),
      },
      {
        tipo: "booleano",
        campo: "recreacao_gosta",
        titulo: "Ele curte atividades de recreação?",
        visivelSe: marcou("areas_usadas", "recreacao"),
      },
      {
        tipo: "unica",
        campo: "recreacao_preferencia",
        titulo: "Prefere brincar livre ou com alguém conduzindo?",
        opcoes: [
          { v: "livres", t: "Livre" },
          { v: "mediadas", t: "Com alguém conduzindo" },
          { v: "ambas", t: "Os dois" },
        ],
        visivelSe: marcou("areas_usadas", "recreacao"),
      },
      {
        tipo: "booleano",
        campo: "recreacao_tolera_som",
        titulo: "Tolera som e movimento intensos na recreação?",
        visivelSe: marcou("areas_usadas", "recreacao"),
      },
      {
        tipo: "texto",
        campo: "recreacao_interesses",
        titulo: "Que atividades ele mais gosta?",
        exemplo: "Pintura, água, contação de história…",
        multilinha: true,
        visivelSe: marcou("areas_usadas", "recreacao"),
      },
      {
        tipo: "texto",
        campo: "recreacao_evitar",
        titulo: "Que atividades é melhor evitar?",
        exemplo: "Competição, brincadeira com muito contato físico…",
        multilinha: true,
        visivelSe: marcou("areas_usadas", "recreacao"),
      },
      {
        tipo: "unica",
        campo: "restaurante_fila",
        titulo: "Ele tolera fila no restaurante?",
        opcoes: [
          { v: "sim", t: "Sim" },
          { v: "com_apoio", t: "Com apoio" },
          { v: "nao", t: "Não" },
        ],
        visivelSe: marcou("areas_usadas", "restaurante"),
      },
      {
        tipo: "chips-booleano",
        titulo: "No restaurante, o que ajuda?",
        opcoes: [
          { campo: "restaurante_reservado", v: "reservado", t: "Ambiente mais reservado" },
          { campo: "restaurante_apoio_visual", v: "visual", t: "Cardápio com fotos" },
          { campo: "restaurante_horario_tranquilo", v: "hora", t: "Horário mais tranquilo" },
        ],
        visivelSe: marcou("areas_usadas", "restaurante"),
      },
      {
        tipo: "chips-booleano",
        titulo: "E na chegada?",
        opcoes: [
          { campo: "checkin_ansiedade", v: "ansiedade", t: "O check-in costuma gerar ansiedade" },
          { campo: "checkin_evitar_fila", v: "fila", t: "É importante evitar fila" },
          { campo: "checkin_equipe_saber", v: "saber", t: "A equipe deve estar avisada antes" },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── Interesses
  {
    id: "interesses",
    titulo: "O que dá certo",
    porque: "É como a equipe cria vínculo em vez de só evitar problema.",
    Icon: Compass,
    peso: 2,
    minutos: 2,
    perguntas: [
      {
        tipo: "chips-booleano",
        titulo: "Do que ele gosta?",
        opcoes: [
          { campo: "gosta_atividades_agua", v: "agua", t: "Água" },
          { campo: "gosta_natureza", v: "natureza", t: "Natureza e ar livre" },
          { campo: "gosta_animais", v: "animais", t: "Animais" },
        ],
      },
      {
        tipo: "multipla",
        campo: "interesses_extra",
        titulo: "Tem algum assunto que ele adora?",
        ajuda: "A equipe usa isso para puxar conversa e criar vínculo",
        opcoes: [
          { v: "dinossauros", t: "Dinossauros" },
          { v: "trens", t: "Trens" },
          { v: "carros", t: "Carros" },
          { v: "espaço", t: "Espaço e planetas" },
          { v: "música", t: "Música" },
          { v: "desenhos", t: "Desenhos animados" },
          { v: "números", t: "Números" },
        ],
        permiteOutro: true,
      },
      {
        tipo: "texto",
        campo: "atividades_preferidas",
        titulo: "Quais são as atividades preferidas dele?",
        multilinha: true,
      },
      {
        tipo: "texto",
        campo: "objetos_personagens",
        titulo: "Tem algum objeto ou personagem que ajuda na adaptação?",
        exemplo: "O dinossauro azul, a mochila do Homem-Aranha…",
      },
      {
        tipo: "texto",
        campo: "o_que_gera_alegria",
        titulo: "O que costuma deixar ele feliz?",
        multilinha: true,
      },
      {
        tipo: "texto",
        campo: "estrategias_que_funcionam",
        titulo: "O que funciona bem quando ele chega num lugar novo?",
        exemplo: "Avisar 5 minutos antes de qualquer mudança, mostrar foto do lugar antes…",
        multilinha: true,
      },
      {
        tipo: "texto",
        campo: "formas_abordagem",
        titulo: "Como alguém deve se aproximar dele pela primeira vez?",
        exemplo: "Se agachar na altura dele, falar baixo, não estender a mão…",
        multilinha: true,
      },
      {
        tipo: "texto",
        campo: "notas_adicionais",
        titulo: "Mais alguma coisa que ajude a equipe a receber bem?",
        multilinha: true,
      },
    ],
  },
];

export const BLOCO_ESSENCIAL = BLOCOS[0];
export const BLOCOS_OPCIONAIS = BLOCOS.slice(1);

export function blocoPorId(id: string): Bloco | undefined {
  return BLOCOS.find((b) => b.id === id);
}

/** A partir daqui o hotel já consegue se preparar - o alvo não é 100%. */
export const LIMIAR_UTIL = 40;
