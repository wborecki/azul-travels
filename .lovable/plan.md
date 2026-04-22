

## Reagrupamento de categorias de estabelecimento

### Sugestão

Hoje existem 8 tipos no banco (`hotel`, `pousada`, `resort`, `restaurante`, `parque`, `atracoes`, `agencia`, `transporte`). Sugiro consolidar em **5 categorias mais legíveis para a família**, sem perder granularidade — o tipo original vira um subtipo informativo dentro do card.

| Nova categoria | Engloba | Por quê |
|---|---|---|
| **Hospedagem** | hotel, pousada, resort | A família busca "onde dormir", não a classificação hoteleira. Um único filtro com 3x mais resultados é mais útil. |
| **Passeios e experiências** | parque, atracoes + nova subcategoria `excursao` | Resposta direta pra sua pergunta: passeios, excursões e atrações cabem todos aqui. É o "o que fazer no destino". |
| **Onde comer** | restaurante | Mantém separado. Uso e momento de busca distintos de hospedagem/passeios. |
| **Transporte** | transporte | Mantém separado. Decisão logística, não experiencial. |
| **Planejamento** | agencia | Mantém separado. Quem busca agência tá numa fase diferente da jornada (ainda planejando). |

### Por que não criar categoria isolada para excursões

Excursão, passeio guiado e experiência local são variações do mesmo intent: "atividade pra fazer com a criança no destino". Separar em 3 categorias gera filtros vazios e fragmenta resultados. Um único guarda-chuva **Passeios e experiências** com subtipo no card resolve.

### Impacto no produto

**UI (home + /explorar):**
- 5 chips de categoria em vez de 8. Visualmente mais limpo, decisão mais rápida.
- Cada card continua mostrando o tipo específico ("Hotel", "Pousada", "Excursão guiada") como label fino abaixo do nome — não se perde informação.
- Filtros de `/explorar` ganham um nível: categoria (agrupador) + tipo específico (refino opcional dentro da categoria selecionada).

**Banco:**
- Adicionar valor `excursao` ao enum `estab_tipo` (migration aditiva, não destrutiva).
- Criar enum novo `estab_categoria` com os 5 valores e uma função `categoria_de_tipo(estab_tipo)` que faz o mapeamento. Sem coluna nova — categoria é derivada do tipo.
- Atualizar `src/lib/enums.ts` com `ESTAB_CATEGORIA_LABEL` e o mapa `TIPO_PARA_CATEGORIA`.

**Onde aparece:**
- Home: chips do hero passam de 5 tipos misturados ("Hotéis, Restaurantes, Parques, Resorts, Pousadas") para 5 categorias coerentes.
- `/explorar`: filtro principal vira categoria; tipo específico aparece como sub-filtro só quando a categoria tem múltiplos tipos (Hospedagem, Passeios).
- Card do estabelecimento: ícone derivado da categoria (mais consistente que do tipo), label do tipo específico abaixo do nome.

### Decisão pendente

Antes de implementar, preciso confirmar dois pontos:

1. **Nome do enum em PT-BR**: prefere "Passeios e experiências" (proposto) ou outro rótulo tipo "O que fazer", "Atrações", "Atividades"?
2. **Onde adicionar excursões na UX**: só como novo tipo dentro de "Passeios e experiências", ou também quer que a equipe possa cadastrar produtos avulsos (ex: "Passeio de barco com guia TEA — meio dia") como item destacado em outro lugar (ex: seção própria na home)?

Responda esses dois pontos e eu sigo com a implementação completa (migration + enum + UI da home + filtros de /explorar + card).

