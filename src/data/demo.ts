/**
 * Dados estáticos para a demonstração da plataforma em /demo/*.
 * Nenhuma rota /demo/* faz chamadas ao Supabase — tudo vem daqui.
 */

export type DemoEstabelecimento = {
  id: string;
  nome: string;
  slug: string;
  tipo: "hotel" | "pousada" | "resort" | "parque" | "atracoes" | "restaurante";
  cidade: string;
  estado: string;
  foto_capa: string;
  fotos: string[];
  descricao: string;
  descricao_tea: string;
  selo_azul: boolean;
  selo_azul_validade?: string;
  tem_sala_sensorial: boolean;
  tem_concierge_tea: boolean;
  tem_checkin_antecipado: boolean;
  tem_fila_prioritaria: boolean;
  tem_cardapio_visual: boolean;
  tem_caa: boolean;
  tour_360_url: string | null;
  tem_beneficio_tea: boolean;
  beneficio_tea_descricao?: string;
  destaque: boolean;
  nota_media: number;
  total_avaliacoes: number;
  latitude: number;
  longitude: number;
};

export const DEMO_ESTABELECIMENTOS: DemoEstabelecimento[] = [
  {
    id: "demo-1",
    nome: "Resort Praia Azul",
    slug: "resort-praia-azul",
    tipo: "resort",
    cidade: "Florianópolis",
    estado: "SC",
    foto_capa:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    ],
    descricao: "Resort à beira-mar com estrutura completa para famílias.",
    descricao_tea:
      "Nossa equipe passou por treinamento intensivo em TEA/ABA pela Absoluto Educacional. Temos sala sensorial disponível 24h, cardápio visual em todos os restaurantes, check-in silencioso sem fila e concierge especializado em autismo presente todos os dias das 8h às 20h.",
    selo_azul: true,
    selo_azul_validade: "2026-12-01",
    tem_sala_sensorial: true,
    tem_concierge_tea: true,
    tem_checkin_antecipado: true,
    tem_fila_prioritaria: true,
    tem_cardapio_visual: true,
    tem_caa: true,
    tour_360_url: "https://my.matterport.com/show/?m=zEWsxhZpGba",
    tem_beneficio_tea: true,
    beneficio_tea_descricao:
      "Crianças autistas e 1 acompanhante: 50% de desconto na diária.",
    destaque: true,
    nota_media: 4.9,
    total_avaliacoes: 23,
    latitude: -27.5954,
    longitude: -48.548,
  },
  {
    id: "demo-2",
    nome: "Hotel Serra Verde",
    slug: "hotel-serra-verde",
    tipo: "hotel",
    cidade: "Campos do Jordão",
    estado: "SP",
    foto_capa:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    ],
    descricao: "Hotel boutique na Serra com ambiente calmo e tranquilo.",
    descricao_tea:
      "Ambiente silencioso por política interna. Quartos com blackout total, travesseiros de pressão disponíveis, cardápio visual no restaurante e trilhas adaptadas para crianças com mobilidade reduzida.",
    selo_azul: true,
    tem_sala_sensorial: false,
    tem_concierge_tea: false,
    tem_checkin_antecipado: true,
    tem_fila_prioritaria: true,
    tem_cardapio_visual: true,
    tem_caa: false,
    tour_360_url: null,
    tem_beneficio_tea: false,
    destaque: true,
    nota_media: 4.7,
    total_avaliacoes: 18,
    latitude: -22.7392,
    longitude: -45.5916,
  },
  {
    id: "demo-3",
    nome: "Parque Aventura Mata",
    slug: "parque-aventura-mata",
    tipo: "parque",
    cidade: "Curitiba",
    estado: "PR",
    foto_capa:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    fotos: [],
    descricao: "Parque ecológico com atividades para toda a família.",
    descricao_tea:
      "Fila prioritária em todas as atrações, guias treinados em comunicação alternativa e uma sala de descanso sensorial disponível próxima à entrada principal.",
    selo_azul: true,
    tem_sala_sensorial: true,
    tem_concierge_tea: true,
    tem_checkin_antecipado: false,
    tem_fila_prioritaria: true,
    tem_cardapio_visual: true,
    tem_caa: true,
    tour_360_url: "https://my.matterport.com/show/?m=zEWsxhZpGba",
    tem_beneficio_tea: true,
    beneficio_tea_descricao:
      "Entrada gratuita para a pessoa autista e 1 acompanhante.",
    destaque: true,
    nota_media: 4.8,
    total_avaliacoes: 31,
    latitude: -25.4284,
    longitude: -49.2733,
  },
  {
    id: "demo-4",
    nome: "Aquário Mundo Marinho",
    slug: "aquario-mundo-marinho",
    tipo: "atracoes",
    cidade: "Balneário Camboriú",
    estado: "SC",
    foto_capa:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    fotos: [],
    descricao: "Aquário com experiências imersivas e interativas.",
    descricao_tea:
      "Toda terça-feira das 9h às 11h o aquário opera em modo silencioso: sem música, iluminação reduzida, sem narração em voz alta. Equipe treinada para receber famílias TEA.",
    selo_azul: true,
    tem_sala_sensorial: false,
    tem_concierge_tea: false,
    tem_checkin_antecipado: false,
    tem_fila_prioritaria: true,
    tem_cardapio_visual: true,
    tem_caa: false,
    tour_360_url: null,
    tem_beneficio_tea: true,
    beneficio_tea_descricao: "Meia-entrada para pessoas autistas todos os dias.",
    destaque: true,
    nota_media: 4.6,
    total_avaliacoes: 14,
    latitude: -26.9906,
    longitude: -48.6348,
  },
  {
    id: "demo-5",
    nome: "Pousada Recanto Sereno",
    slug: "pousada-recanto-sereno",
    tipo: "pousada",
    cidade: "Gramado",
    estado: "RS",
    foto_capa:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    fotos: [],
    descricao: "Pousada familiar em meio à natureza da Serra Gaúcha.",
    descricao_tea:
      "Ambiente quieto por política interna, sem TV nos quartos (opcional), jardim sensorial com diferentes texturas naturais, rotina visual disponível para as refeições.",
    selo_azul: true,
    tem_sala_sensorial: true,
    tem_concierge_tea: false,
    tem_checkin_antecipado: true,
    tem_fila_prioritaria: false,
    tem_cardapio_visual: true,
    tem_caa: false,
    tour_360_url: null,
    tem_beneficio_tea: false,
    destaque: true,
    nota_media: 4.8,
    total_avaliacoes: 9,
    latitude: -29.3779,
    longitude: -50.8739,
  },
  {
    id: "demo-6",
    nome: "Hotel Fazenda Boa Vista",
    slug: "hotel-fazenda-boa-vista",
    tipo: "hotel",
    cidade: "Pirenópolis",
    estado: "GO",
    foto_capa:
      "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80",
    fotos: [],
    descricao: "Hotel fazenda com cavalos, piscina e atividades rurais.",
    descricao_tea:
      "Terapia assistida por animais disponível com equipe especializada. Concierge TEA presente em todas as atividades. Quarto preparado com antecedência conforme perfil sensorial enviado.",
    selo_azul: true,
    tem_sala_sensorial: false,
    tem_concierge_tea: true,
    tem_checkin_antecipado: true,
    tem_fila_prioritaria: false,
    tem_cardapio_visual: true,
    tem_caa: true,
    tour_360_url: null,
    tem_beneficio_tea: true,
    beneficio_tea_descricao: "20% de desconto para famílias com membro autista.",
    destaque: true,
    nota_media: 4.9,
    total_avaliacoes: 7,
    latitude: -15.8514,
    longitude: -48.9586,
  },
];

export type DemoAvaliacao = {
  id: string;
  estabelecimento_id: string;
  nome_responsavel: string;
  cidade: string;
  nota_geral: number;
  nota_acolhimento: number;
  nota_estrutura: number;
  nota_comunicacao: number;
  comentario: string;
  criado_em: string;
};

export const DEMO_AVALIACOES: DemoAvaliacao[] = [
  {
    id: "av-1",
    estabelecimento_id: "demo-1",
    nome_responsavel: "Mariana",
    cidade: "Curitiba, PR",
    nota_geral: 5,
    nota_acolhimento: 5,
    nota_estrutura: 5,
    nota_comunicacao: 4,
    comentario:
      "A sala sensorial salvou nossa viagem. Quando o barulho ficou demais na piscina, o Enzo teve um lugar calmo pra se reorganizar. Foi a primeira vez que a gente relaxou de verdade numa viagem em família.",
    criado_em: "2026-03-12",
  },
  {
    id: "av-2",
    estabelecimento_id: "demo-1",
    nome_responsavel: "Carlos e Renata",
    cidade: "São Paulo, SP",
    nota_geral: 5,
    nota_acolhimento: 5,
    nota_estrutura: 4,
    nota_comunicacao: 5,
    comentario:
      "O check-in foi diferente de tudo que já vivemos. Ficamos direto pro quarto sem fila, sem barulho. A Sofia nem percebeu que tinha chegado num hotel. Acordou no dia seguinte perguntando se podia ir pra piscina.",
    criado_em: "2026-02-28",
  },
  {
    id: "av-3",
    estabelecimento_id: "demo-3",
    nome_responsavel: "Patrícia",
    cidade: "Porto Alegre, RS",
    nota_geral: 5,
    nota_acolhimento: 4,
    nota_estrutura: 5,
    nota_comunicacao: 5,
    comentario:
      "Antes eu ligava pra vários parques explicando o João. Aqui não precisei explicar nada. Eles já sabiam. A equipe usou CAA com ele na entrada. Ele ficou olhando pra guia com admiração.",
    criado_em: "2026-04-01",
  },
];

export type DemoPerfilSensorial = {
  nome_autista: string;
  idade: number;
  nivel_tea: "leve" | "moderado" | "severo";
  sensivel_sons: boolean;
  sensivel_luz: boolean;
  sensivel_texturas: boolean;
  sensivel_cheiros: boolean;
  sensivel_multidao: boolean;
  comunicacao_verbal: boolean;
  usa_caa: boolean;
  precisa_sala_sensorial: boolean;
  precisa_checkin_antecipado: boolean;
  precisa_fila_prioritaria: boolean;
  precisa_cardapio_visual: boolean;
  precisa_concierge_tea: boolean;
  gosta_atividades_agua: boolean;
  gosta_natureza: boolean;
  gosta_animais: boolean;
};

export const DEMO_PERFIL_SENSORIAL: DemoPerfilSensorial = {
  nome_autista: "Enzo",
  idade: 7,
  nivel_tea: "moderado",
  sensivel_sons: true,
  sensivel_luz: false,
  sensivel_texturas: true,
  sensivel_cheiros: false,
  sensivel_multidao: true,
  comunicacao_verbal: true,
  usa_caa: false,
  precisa_sala_sensorial: true,
  precisa_checkin_antecipado: true,
  precisa_fila_prioritaria: true,
  precisa_cardapio_visual: true,
  precisa_concierge_tea: false,
  gosta_atividades_agua: true,
  gosta_natureza: true,
  gosta_animais: true,
};

export type DemoArtigo = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  autor: string;
  foto_capa: string;
  criado_em: string;
  conteudo: string;
};

export const DEMO_ARTIGOS: DemoArtigo[] = [
  {
    id: "art-1",
    slug: "direitos-tea-turismo",
    titulo:
      "Quais são os seus direitos como família TEA no turismo brasileiro?",
    resumo:
      "Da fila prioritária à gratuidade em parques: a lei garante mais do que você imagina. Saiba o que exigir e como usar a seu favor.",
    categoria: "Legislação",
    autor: "Equipe Turismo Azul",
    foto_capa:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    criado_em: "2026-04-22",
    conteudo: "Conteúdo completo do artigo...",
  },
  {
    id: "art-2",
    slug: "primeira-viagem-filho-autista",
    titulo:
      "Primeira viagem com filho autista: o guia que eu gostaria de ter tido",
    resumo:
      "O que levar, como preparar o ambiente, o que avisar ao hotel e como lidar com imprevistos. Um roteiro real de quem já passou por isso.",
    categoria: "Dicas de viagem",
    autor: "Equipe Turismo Azul",
    foto_capa:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    criado_em: "2026-04-22",
    conteudo: "Conteúdo completo do artigo...",
  },
  {
    id: "art-3",
    slug: "como-identificar-hotel-preparado",
    titulo:
      "Como identificar se um hotel está preparado ou só finge estar",
    resumo:
      "Existem hotéis que dizem ser inclusivos e existem hotéis que provam ser. Veja as perguntas certas para fazer antes de reservar.",
    categoria: "Boas práticas",
    autor: "Equipe Turismo Azul",
    foto_capa:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    criado_em: "2026-04-22",
    conteudo: "Conteúdo completo do artigo...",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const TIPO_LABEL: Record<DemoEstabelecimento["tipo"], string> = {
  hotel: "Hotel",
  pousada: "Pousada",
  resort: "Resort",
  parque: "Parque",
  atracoes: "Atração",
  restaurante: "Restaurante",
};

const RECURSOS_NECESSARIOS: Array<
  [keyof DemoPerfilSensorial, keyof DemoEstabelecimento]
> = [
  ["precisa_sala_sensorial", "tem_sala_sensorial"],
  ["precisa_checkin_antecipado", "tem_checkin_antecipado"],
  ["precisa_fila_prioritaria", "tem_fila_prioritaria"],
  ["precisa_cardapio_visual", "tem_cardapio_visual"],
  ["precisa_concierge_tea", "tem_concierge_tea"],
];

/**
 * Calcula a porcentagem de compatibilidade do perfil com o estabelecimento.
 * Para cada recurso que o perfil precisa (true), verifica se o estabelecimento tem (true).
 */
export function calcularCompatibilidade(
  perfil: DemoPerfilSensorial,
  estab: DemoEstabelecimento,
): number {
  const necessarios = RECURSOS_NECESSARIOS.filter(([k]) => perfil[k] === true);
  if (necessarios.length === 0) return 100;
  const atendidos = necessarios.filter(([, ek]) => estab[ek] === true).length;
  return Math.round((atendidos / necessarios.length) * 100);
}

export function corCompatibilidade(p: number): {
  bar: string;
  text: string;
  label: string;
} {
  if (p <= 40)
    return { bar: "bg-red-500", text: "text-red-700", label: "Pouco compatível" };
  if (p <= 70)
    return {
      bar: "bg-amber-500",
      text: "text-amber-700",
      label: "Parcialmente compatível",
    };
  return { bar: "bg-emerald-500", text: "text-emerald-700", label: "Muito compatível" };
}
