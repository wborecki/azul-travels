## Arquitetura final

```text
CONTA DA FAMÍLIA (login obrigatório)
└── /minha-conta                  → dashboard
    ├── /minha-conta/perfil       → Perfil TEA único (8 seções, editável)
    └── /minha-conta/reservas     → lista + nova reserva
        └── /minha-conta/reservas/$id → detalhe
```

- **Perfil TEA** vive na tabela `perfil_sensorial` (1 por familia_id).
- **Reservas** usam a tabela `reservas` existente, com `perfil_sensorial_id` apontando para o perfil da família — quando a família abre uma reserva, o perfil é puxado automaticamente.
- Botão **"Solicitar Reserva"** no marketplace passa a:
  - sem login → manda para `/login?next=/minha-conta/reservas/nova?slug=...`
  - logado e sem perfil → manda para `/minha-conta/perfil?next=...`
  - logado e com perfil → abre `/minha-conta/reservas/nova?slug=...` já com o perfil selecionado.
- O fluxo anônimo `/pre-checkin/$slug` é **descontinuado** (rota redireciona para o novo fluxo).

## Mudanças no banco

**Estender `perfil_sensorial`** com colunas para as seções que ainda não existem (todas opcionais, default vazio):

- *Necessidades de apoio diário*: `apoio_higiene`, `apoio_alimentacao`, `apoio_mobilidade`, `apoio_seguranca` (boolean)
- *Rotina e horários*: `rotina_horario_acordar`, `rotina_horario_dormir` (text), `rotina_observacoes` (text)
- *Alimentação*: `alimentacao_seletiva` (boolean), `alimentacao_restricoes` (text[]), `alimentacao_observacoes` (text)
- *Regulação emocional*: `gatilhos` (text[]), `estrategias_acalmar` (text), `sinais_sobrecarga` (text)
- *Preferências de quarto*: `quarto_andar_baixo`, `quarto_longe_elevador`, `quarto_blackout`, `quarto_sem_estampas`, `quarto_cama_extra` (boolean), `quarto_observacoes` (text)
- *Interesses e estratégias*: `interesses_extra` (text[]), `estrategias_que_funcionam` (text)

**Estender `reservas`** com:
- `objetivo` (text) — "Por que essa viagem?"
- `acompanhantes` (jsonb) — `[{ nome, idade, parentesco }]`

Constraint: `unique(familia_id)` em `perfil_sensorial` para garantir 1 perfil por família (somente 1 filho TEA por conta nesta versão — múltiplos filhos fica como evolução futura, conforme a estrutura solicitada).

## Telas a construir

1. **`/minha-conta`** — dashboard simples: card "Perfil TEA" (criar/editar) + card "Reservas" (lista resumida) + atalho "Explorar destinos".
2. **`/minha-conta/perfil`** — formulário único com as 8 seções em accordion/abas, salva tudo numa única submissão (upsert por `familia_id`).
3. **`/minha-conta/reservas`** — lista de reservas com status, datas e estabelecimento.
4. **`/minha-conta/reservas/nova`** — formulário curto: estabelecimento (pré-preenchido por `?slug`), datas, acompanhantes, objetivo, notas. Mostra resumo do Perfil TEA que será enviado.
5. **`/minha-conta/reservas/$id`** — detalhe da reserva + snapshot do perfil enviado.

Layout `_minhaconta.tsx` (rota pathless) faz o gate de auth: sem sessão → redirect `/login?next=...`.

## Marketplace e pré-check-in

- `src/routes/explorar.tsx`: botão "Solicitar Reserva →" passa a apontar para `/minha-conta/reservas/nova?slug=…` (com gate de auth/perfil).
- `src/routes/estabelecimento.$slug.tsx`: idem.
- `src/routes/demo.estabelecimento.$slug.tsx`: idem (usuário entendeu antes que demo e produção compartilham fluxo).
- `src/routes/pre-checkin.$slug.tsx`: vira página de redirect (`Navigate` para `/minha-conta/reservas/nova?slug=…`) para não quebrar links existentes.

## Detalhes técnicos

- RLS já existente em `perfil_sensorial` e `reservas` (`auth.uid() = familia_id`) é suficiente — sem necessidade de novas policies.
- `PerfilSensorialForm` é estendido para aceitar as novas seções; mantém compatibilidade com o uso atual.
- Sem alterações em header, footer, área admin, conteúdo ou outras páginas.

## Fora do escopo

- Múltiplos filhos por família (estrutura permite 1 perfil/família agora).
- Notificação por e-mail ao estabelecimento.
- Chat família ↔ estabelecimento.
- Pagamento/reserva financeira real.
