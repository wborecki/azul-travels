-- ============================================================================
-- SEED DE DEMONSTRAÇÃO - Turismo Azul
--
-- 14 estabelecimentos (7 com Selo Azul, 7 sem),
-- 13 quartos reserváveis e 14 contas de acesso.
--
-- COMO APLICAR: cole inteiro no SQL Editor do Supabase e execute. Roda dentro
-- de uma transação - ou entra tudo, ou não entra nada - e pode ser reaplicado
-- quantas vezes quiser: a primeira instrução limpa a execução anterior.
--
-- LOGIN: os e-mails abaixo, todos com a senha  senha123
-- Domínio .test é reservado pela RFC 2606: nunca resolve, nunca envia e-mail
-- de verdade. Os endereços já entram confirmados.
--
--   gramado@turismoazul.test               [SELO AZUL] Hotel Vale das Hortênsias
--   praiadorosa@turismoazul.test           [sem selo]  Pousada Costa do Rosa
--   portodegalinhas@turismoazul.test       [SELO AZUL] Recanto Azul Resort Porto
--   paulista@turismoazul.test              [sem selo]  Hotel Bela Vista Paulista
--   tiradentes@turismoazul.test            [SELO AZUL] Pousada Casa da Serra
--   curitiba@turismoazul.test              [SELO AZUL] Restaurante Mesa do Largo
--   salvador@turismoazul.test              [sem selo]  Tempero de Dona Zefa
--   florianopolis@turismoazul.test         [sem selo]  Cantina da Lagoa
--   olimpia@turismoazul.test               [SELO AZUL] Parque Aquático Águas de Olímpia
--   rio@turismoazul.test                   [sem selo]  Aquário da Baía
--   bh@turismoazul.test                    [SELO AZUL] Museu de Ciências Estação Liberdade
--   bonito@turismoazul.test                [sem selo]  Bonito Trilhas e Flutuação
--   foz@turismoazul.test                   [sem selo]  Cataratas Transfer Acessível
--   campinas@turismoazul.test              [SELO AZUL] Rota Azul Viagens
--
-- DADOS: nomes de empresa são fictícios - nenhuma empresa real é retratada
-- como cadastrada ou certificada. Cidades, endereços e coordenadas são reais
-- (geocodificados no Nominatim/OpenStreetMap). Fotos vêm do Unsplash, sob
-- licença livre para uso comercial, e todas as URLs foram verificadas.
--
-- COMO IDENTIFICAR QUE É DADO FICTÍCIO - toda linha criada aqui carrega
-- quatro marcas independentes, qualquer uma serve de filtro:
--
--   is_demo = true      em estabelecimentos, estabelecimento_profiles e
--                       itens_reservaveis. É a marcação canônica do projeto
--                       (migration 20260521234354) e o admin já mostra o
--                       DemoBadge para ela.
--   origem = 'seed_demo' em estabelecimento_profiles, vindo do metadata do
--                       usuário - separa este seed de outras origens.
--   id LIKE 'a5e1%'     nos usuários: UUID fixo que nenhuma conta real tem.
--   e-mail @...test     domínio reservado pela RFC 2606, nunca roteável.
--
-- Para uma marca visível na tela ("[DEMO] Hotel ..."), ligue MARCAR_NO_NOME
-- em gerar-seed.mjs e gere de novo. Está desligado por padrão.
--
-- Apagar tudo que é fictício, a qualquer momento:
--   DELETE FROM auth.users WHERE id::text LIKE 'a5e1%';
--
-- ROLLBACK: o bloco no fim do arquivo remove tudo (comentado).
-- ============================================================================

BEGIN;

-- pgcrypto vive no schema `extensions` no Supabase; o SET abaixo deixa
-- crypt()/gen_salt() visíveis sem qualificar cada chamada.
SET LOCAL search_path = public, extensions;

-- Limpa uma execução anterior, para o arquivo poder ser reaplicado à vontade.
-- O alcance é só o destes 14 UUIDs fixos, que nenhuma conta real tem;
-- apagar o usuário cascateia para perfil, papel, estabelecimento e quartos.
-- Na primeira execução não apaga nada.
DELETE FROM auth.users WHERE id IN (
  'a5e10000-0000-4000-8000-000000000001',
  'a5e10000-0000-4000-8000-000000000002',
  'a5e10000-0000-4000-8000-000000000003',
  'a5e10000-0000-4000-8000-000000000004',
  'a5e10000-0000-4000-8000-000000000005',
  'a5e10000-0000-4000-8000-000000000006',
  'a5e10000-0000-4000-8000-000000000007',
  'a5e10000-0000-4000-8000-000000000008',
  'a5e10000-0000-4000-8000-000000000009',
  'a5e10000-0000-4000-8000-000000000010',
  'a5e10000-0000-4000-8000-000000000011',
  'a5e10000-0000-4000-8000-000000000012',
  'a5e10000-0000-4000-8000-000000000013',
  'a5e10000-0000-4000-8000-000000000014'
);

-- ---------------------------------------------------------------------------
-- 1. Contas de acesso
--
-- Inserir em auth.users dispara `handle_new_user`, que já cria o perfil em
-- estabelecimento_profiles, o papel em user_roles e a linha base em
-- estabelecimentos. É o mesmo caminho de um cadastro pelo site - por isso o
-- metadata abaixo repete exatamente o que /cadastro envia.
-- ---------------------------------------------------------------------------

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'gramado@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Marina Kleinschmidt","whatsapp":"(54) 3286-1420","telefone":"(54) 3286-1420","origem":"seed_demo","nome_estabelecimento":"Hotel Vale das Hortênsias","tipo":"hotel","cidade":"Gramado","estado":"RS"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000001', 'a5e10000-0000-4000-8000-000000000001',
  '{"sub":"a5e10000-0000-4000-8000-000000000001","email":"gramado@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
  'praiadorosa@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Thiago Bittencourt","whatsapp":"(48) 3355-6088","telefone":"(48) 3355-6088","origem":"seed_demo","nome_estabelecimento":"Pousada Costa do Rosa","tipo":"pousada","cidade":"Imbituba","estado":"SC"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000002', 'a5e10000-0000-4000-8000-000000000002',
  '{"sub":"a5e10000-0000-4000-8000-000000000002","email":"praiadorosa@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
  'portodegalinhas@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Juliana Albuquerque","whatsapp":"(81) 3552-7100","telefone":"(81) 3552-7100","origem":"seed_demo","nome_estabelecimento":"Recanto Azul Resort Porto","tipo":"resort","cidade":"Ipojuca","estado":"PE"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000003', 'a5e10000-0000-4000-8000-000000000003',
  '{"sub":"a5e10000-0000-4000-8000-000000000003","email":"portodegalinhas@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
  'paulista@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Rogério Tanaka","whatsapp":"(11) 3253-7744","telefone":"(11) 3253-7744","origem":"seed_demo","nome_estabelecimento":"Hotel Bela Vista Paulista","tipo":"hotel","cidade":"São Paulo","estado":"SP"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000004', 'a5e10000-0000-4000-8000-000000000004',
  '{"sub":"a5e10000-0000-4000-8000-000000000004","email":"paulista@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000005', 'authenticated', 'authenticated',
  'tiradentes@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Beatriz Ottoni","whatsapp":"(32) 3355-1174","telefone":"(32) 3355-1174","origem":"seed_demo","nome_estabelecimento":"Pousada Casa da Serra","tipo":"pousada","cidade":"Tiradentes","estado":"MG"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000005', 'a5e10000-0000-4000-8000-000000000005',
  '{"sub":"a5e10000-0000-4000-8000-000000000005","email":"tiradentes@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000006', 'authenticated', 'authenticated',
  'curitiba@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Anderson Prado","whatsapp":"(41) 3224-9080","telefone":"(41) 3224-9080","origem":"seed_demo","nome_estabelecimento":"Restaurante Mesa do Largo","tipo":"restaurante","cidade":"Curitiba","estado":"PR"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000006', 'a5e10000-0000-4000-8000-000000000006',
  '{"sub":"a5e10000-0000-4000-8000-000000000006","email":"curitiba@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000007', 'authenticated', 'authenticated',
  'salvador@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Josefa Nascimento","whatsapp":"(71) 3321-4455","telefone":"(71) 3321-4455","origem":"seed_demo","nome_estabelecimento":"Tempero de Dona Zefa","tipo":"restaurante","cidade":"Salvador","estado":"BA"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000007', 'a5e10000-0000-4000-8000-000000000007',
  '{"sub":"a5e10000-0000-4000-8000-000000000007","email":"salvador@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000008', 'authenticated', 'authenticated',
  'florianopolis@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Marcelo Duarte","whatsapp":"(48) 3232-7712","telefone":"(48) 3232-7712","origem":"seed_demo","nome_estabelecimento":"Cantina da Lagoa","tipo":"restaurante","cidade":"Florianópolis","estado":"SC"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000008', 'a5e10000-0000-4000-8000-000000000008',
  '{"sub":"a5e10000-0000-4000-8000-000000000008","email":"florianopolis@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000009', 'authenticated', 'authenticated',
  'olimpia@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Cláudia Ferrari","whatsapp":"(17) 3279-5000","telefone":"(17) 3279-5000","origem":"seed_demo","nome_estabelecimento":"Parque Aquático Águas de Olímpia","tipo":"parque","cidade":"Olímpia","estado":"SP"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000009', 'a5e10000-0000-4000-8000-000000000009',
  '{"sub":"a5e10000-0000-4000-8000-000000000009","email":"olimpia@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000010', 'authenticated', 'authenticated',
  'rio@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Renata Villela","whatsapp":"(21) 2542-6600","telefone":"(21) 2542-6600","origem":"seed_demo","nome_estabelecimento":"Aquário da Baía","tipo":"atracoes","cidade":"Rio de Janeiro","estado":"RJ"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000010', 'a5e10000-0000-4000-8000-000000000010',
  '{"sub":"a5e10000-0000-4000-8000-000000000010","email":"rio@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000011', 'authenticated', 'authenticated',
  'bh@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Paulo Assunção","whatsapp":"(31) 3236-7400","telefone":"(31) 3236-7400","origem":"seed_demo","nome_estabelecimento":"Museu de Ciências Estação Liberdade","tipo":"passeio_educativo","cidade":"Belo Horizonte","estado":"MG"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000011', 'a5e10000-0000-4000-8000-000000000011',
  '{"sub":"a5e10000-0000-4000-8000-000000000011","email":"bh@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000012', 'authenticated', 'authenticated',
  'bonito@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Vanessa Arruda","whatsapp":"(67) 3255-1890","telefone":"(67) 3255-1890","origem":"seed_demo","nome_estabelecimento":"Bonito Trilhas e Flutuação","tipo":"excursao","cidade":"Bonito","estado":"MS"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000012', 'a5e10000-0000-4000-8000-000000000012',
  '{"sub":"a5e10000-0000-4000-8000-000000000012","email":"bonito@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000013', 'authenticated', 'authenticated',
  'foz@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Éder Wamser","whatsapp":"(45) 3521-8080","telefone":"(45) 3521-8080","origem":"seed_demo","nome_estabelecimento":"Cataratas Transfer Acessível","tipo":"transporte","cidade":"Foz do Iguaçu","estado":"PR"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000013', 'a5e10000-0000-4000-8000-000000000013',
  '{"sub":"a5e10000-0000-4000-8000-000000000013","email":"foz@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'a5e10000-0000-4000-8000-000000000014', 'authenticated', 'authenticated',
  'campinas@turismoazul.test', crypt('senha123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{"account_type":"estabelecimento","nome_responsavel":"Simone Rebelato","whatsapp":"(19) 3252-6600","telefone":"(19) 3252-6600","origem":"seed_demo","nome_estabelecimento":"Rota Azul Viagens","tipo":"agencia","cidade":"Campinas","estado":"SP"}'::jsonb, now(), now(),
  '', '', '', ''
);
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'a5e10000-0000-4000-8000-000000000014', 'a5e10000-0000-4000-8000-000000000014',
  '{"sub":"a5e10000-0000-4000-8000-000000000014","email":"campinas@turismoazul.test","email_verified":true,"phone_verified":false}'::jsonb, 'email', now(), now(), now());

-- ---------------------------------------------------------------------------
-- 2. Conteúdo público dos estabelecimentos
--
-- O trigger criou a linha com o mínimo e status 'pendente'. Aqui ela recebe
-- descrição, fotos, coordenadas, selos e recursos. Rodando como dono do banco,
-- `auth.uid()` é NULL e a trigger protect_estabelecimentos_admin_columns
-- libera a escrita das colunas administrativas - é o mesmo atalho que uma
-- migration usa.
-- ---------------------------------------------------------------------------

-- Hotel Vale das Hortênsias (Gramado/RS) - Selo Azul
UPDATE public.estabelecimentos SET
  nome = 'Hotel Vale das Hortênsias',
  slug = 'hotel-vale-das-hortensias',
  status = 'ativo'::estab_status,
  descricao = 'Hotel de 42 apartamentos a três quadras da Rua Coberta, com jardim interno, lareira no living e café da manhã servido das 7h às 11h. A construção em enxaimel abriga áreas comuns amplas e pé-direito alto, o que mantém o ruído baixo mesmo na alta temporada.',
  descricao_tea = 'Temos dois apartamentos no ala leste com isolamento acústico reforçado e cortinas blackout, reservados preferencialmente para famílias autistas. A recepção mantém um kit sensorial (abafador, luminária de luz âmbar e almofada com peso) disponível sem custo, e o café da manhã pode ser servido no quarto quando o salão está cheio.',
  endereco = 'Avenida Borges de Medeiros, 1420 - Centro', cep = '95670-000',
  latitude = -29.371558, longitude = -50.877035,
  telefone = '(54) 3286-1420', email = 'gramado@turismoazul.test', website = 'https://valedashortensias.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"quartos_silenciosos":true,"iluminacao_regulavel":true,"area_escape_sensorial":true,"cardapio_seletividade":true,"equipe_treinada_tea":true}'::jsonb,
  detalhes = '{}'::jsonb,
  selo_azul = true,
  selo_azul_validade = (current_date + interval '11 months')::date,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = true,
  beneficio_tea_descricao = '15% de desconto em estadias de 3 noites ou mais para famílias com laudo TEA, cumulativo com o check-in antecipado sem taxa.',
  tem_sala_sensorial = true,
  tem_concierge_tea = false,
  tem_checkin_antecipado = true,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = true,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000001';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'hotel',
  endereco = 'Avenida Borges de Medeiros, 1420 - Centro', cidade = 'Gramado', estado = 'RS',
  website = 'https://valedashortensias.turismoazul.test', num_colaboradores = '6-15',
  estrutura = '{"quartos_silenciosos":true,"iluminacao_regulavel":true,"area_escape_sensorial":true,"cardapio_seletividade":true,"equipe_treinada_tea":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000001';

-- Pousada Costa do Rosa (Imbituba/SC)
UPDATE public.estabelecimentos SET
  nome = 'Pousada Costa do Rosa',
  slug = 'pousada-costa-do-rosa',
  status = 'ativo'::estab_status,
  descricao = 'Pousada de 9 chalés espalhados na encosta, a 400 metros da areia da Praia do Rosa. Café da manhã com pães de fermentação natural, piscina aquecida e trilha própria até o costão. Não recebemos ônibus de excursão.',
  descricao_tea = 'Os chalés são independentes, sem parede compartilhada, o que ajuda quem se incomoda com barulho de vizinho. Estamos começando a estruturar o atendimento a famílias autistas e já conversamos por WhatsApp antes da chegada para combinar horários e preferências.',
  endereco = 'Estrada Geral da Praia do Rosa, s/n - Praia do Rosa', cep = '88780-000',
  latitude = -28.129453, longitude = -48.641699,
  telefone = '(48) 3355-6088', email = 'praiadorosa@turismoazul.test', website = NULL,
  foto_capa = 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1711059985570-4c32ed12a12c?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"quartos_silenciosos":true,"area_escape_sensorial":true,"cardapio_seletividade":true}'::jsonb,
  detalhes = '{}'::jsonb,
  selo_azul = false,
  selo_azul_validade = NULL,
  quer_selo_azul = true,
  quer_selo_azul_em = (now() - interval '18 days'),
  tem_beneficio_tea = false,
  beneficio_tea_descricao = NULL,
  tem_sala_sensorial = false,
  tem_concierge_tea = false,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = false,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000002';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'pousada',
  endereco = 'Estrada Geral da Praia do Rosa, s/n - Praia do Rosa', cidade = 'Imbituba', estado = 'SC',
  website = NULL, num_colaboradores = '16-30',
  estrutura = '{"quartos_silenciosos":true,"area_escape_sensorial":true,"cardapio_seletividade":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000002';

-- Recanto Azul Resort Porto (Ipojuca/PE) - Selo Azul
UPDATE public.estabelecimentos SET
  nome = 'Recanto Azul Resort Porto',
  slug = 'recanto-azul-resort-porto',
  status = 'ativo'::estab_status,
  descricao = 'Resort pé na areia com 118 apartamentos, quatro piscinas, restaurante principal em regime de pensão completa e acesso direto às piscinas naturais. Estrutura de lazer com recreação monitorada em dois turnos.',
  descricao_tea = 'Mantemos uma sala sensorial climatizada ao lado do espaço kids, com iluminação regulável, tenda de tecido e materiais táteis, aberta das 9h às 20h. A piscina infantil tem horário reservado das 8h às 9h30, sem música ambiente, e a recreação recebe no máximo seis crianças por monitor nesse período. Nossa equipe de recepção e de lazer passou por formação em comunicação alternativa.',
  endereco = 'Rua Beijupirá, 300 - Porto de Galinhas', cep = '55590-000',
  latitude = -8.500785, longitude = -35.003032,
  telefone = '(81) 3552-7100', email = 'portodegalinhas@turismoazul.test', website = 'https://recantoazulporto.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1623718649591-311775a30c43?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"quartos_silenciosos":true,"iluminacao_regulavel":true,"area_escape_sensorial":true,"cardapio_seletividade":true,"comunicacao_visual":true,"entrada_sem_filas":true,"piscina_horarios_reservados":true,"equipe_treinada_tea":true}'::jsonb,
  detalhes = '{}'::jsonb,
  selo_azul = true,
  selo_azul_validade = (current_date + interval '11 months')::date,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = true,
  beneficio_tea_descricao = 'Concierge TEA exclusivo durante toda a estadia e acesso antecipado ao restaurante 20 minutos antes da abertura, evitando a fila do buffet.',
  tem_sala_sensorial = true,
  tem_concierge_tea = true,
  tem_checkin_antecipado = true,
  tem_fila_prioritaria = true,
  tem_cardapio_visual = true,
  tem_caa = true,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = true,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000003';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'resort',
  endereco = 'Rua Beijupirá, 300 - Porto de Galinhas', cidade = 'Ipojuca', estado = 'PE',
  website = 'https://recantoazulporto.turismoazul.test', num_colaboradores = '31-50',
  estrutura = '{"quartos_silenciosos":true,"iluminacao_regulavel":true,"area_escape_sensorial":true,"cardapio_seletividade":true,"comunicacao_visual":true,"entrada_sem_filas":true,"piscina_horarios_reservados":true,"equipe_treinada_tea":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000003';

-- Hotel Bela Vista Paulista (São Paulo/SP)
UPDATE public.estabelecimentos SET
  nome = 'Hotel Bela Vista Paulista',
  slug = 'hotel-bela-vista-paulista',
  status = 'ativo'::estab_status,
  descricao = 'Hotel executivo de 86 apartamentos a uma quadra da Avenida Paulista e a 300 metros da estação Trianon-MASP. Café da manhã das 6h às 10h30, lavanderia no local e estacionamento coberto com manobrista.',
  descricao_tea = 'Ainda não temos estrutura sensorial dedicada, mas conseguimos bloquear os apartamentos de final 08, que ficam no fim do corredor e longe do elevador. Basta pedir na reserva.',
  endereco = 'Alameda Santos, 980 - Bela Vista', cep = '01418-100',
  latitude = -23.560986, longitude = -46.656892,
  telefone = '(11) 3253-7744', email = 'paulista@turismoazul.test', website = 'https://belavistapaulista.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1587870306141-4f19861e6c73?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1693934304978-22274e6a3276?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"quartos_silenciosos":true,"comunicacao_visual":true}'::jsonb,
  detalhes = '{}'::jsonb,
  selo_azul = false,
  selo_azul_validade = NULL,
  quer_selo_azul = true,
  quer_selo_azul_em = (now() - interval '18 days'),
  tem_beneficio_tea = false,
  beneficio_tea_descricao = NULL,
  tem_sala_sensorial = false,
  tem_concierge_tea = false,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = false,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000004';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'hotel',
  endereco = 'Alameda Santos, 980 - Bela Vista', cidade = 'São Paulo', estado = 'SP',
  website = 'https://belavistapaulista.turismoazul.test', num_colaboradores = '50+',
  estrutura = '{"quartos_silenciosos":true,"comunicacao_visual":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000004';

-- Pousada Casa da Serra (Tiradentes/MG) - Selo Azul
UPDATE public.estabelecimentos SET
  nome = 'Pousada Casa da Serra',
  slug = 'pousada-casa-da-serra',
  status = 'ativo'::estab_status,
  descricao = 'Casarão do século XIX restaurado, com 11 quartos ao redor de um pátio de pedra. Café da manhã mineiro com quitandas feitas na casa, servido das 7h30 às 10h30. Cinco minutos a pé da Igreja Matriz.',
  descricao_tea = 'O pátio interno funciona como área de escape: é coberto, tem bancos afastados e quase nenhum ruído, mesmo nos fins de semana cheios. Trabalhamos com um roteiro visual da pousada, enviado por e-mail antes da chegada, mostrando cada ambiente em foto para a criança reconhecer o lugar antes de entrar.',
  endereco = 'Rua da Câmara, 74 - Centro Histórico', cep = '36325-000',
  latitude = -21.109556, longitude = -44.177712,
  telefone = '(32) 3355-1174', email = 'tiradentes@turismoazul.test', website = 'https://casadaserra.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"quartos_silenciosos":true,"iluminacao_regulavel":true,"area_escape_sensorial":true,"cardapio_seletividade":true,"comunicacao_visual":true,"equipe_treinada_tea":true}'::jsonb,
  detalhes = '{}'::jsonb,
  selo_azul = true,
  selo_azul_validade = (current_date + interval '11 months')::date,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = true,
  beneficio_tea_descricao = 'Check-in antecipado a partir das 10h sem cobrança adicional e quarto reservado no corredor sem passagem, mediante disponibilidade.',
  tem_sala_sensorial = true,
  tem_concierge_tea = false,
  tem_checkin_antecipado = true,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = true,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000005';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'pousada',
  endereco = 'Rua da Câmara, 74 - Centro Histórico', cidade = 'Tiradentes', estado = 'MG',
  website = 'https://casadaserra.turismoazul.test', num_colaboradores = '1-5',
  estrutura = '{"quartos_silenciosos":true,"iluminacao_regulavel":true,"area_escape_sensorial":true,"cardapio_seletividade":true,"comunicacao_visual":true,"equipe_treinada_tea":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000005';

-- Restaurante Mesa do Largo (Curitiba/PR) - Selo Azul
UPDATE public.estabelecimentos SET
  nome = 'Restaurante Mesa do Largo',
  slug = 'restaurante-mesa-do-largo',
  status = 'ativo'::estab_status,
  descricao = 'Cozinha paranaense contemporânea em um sobrado restaurado no Largo da Ordem. Menu à la carte no almoço e jantar, com 64 lugares distribuídos em três salões pequenos em vez de um salão único.',
  descricao_tea = 'A divisão em três salões não é decoração: o salão dos fundos tem seis mesas, música desligada e é o que reservamos para famílias que precisam de menos estímulo. Temos cardápio ilustrado com foto de cada prato e a cozinha aceita pedidos de prato desconstruído, com os ingredientes separados no prato.',
  endereco = 'Rua Claudino dos Santos, 58 - São Francisco', cep = '80020-260',
  latitude = -25.427646, longitude = -49.27245,
  telefone = '(41) 3224-9080', email = 'curitiba@turismoazul.test', website = 'https://mesadolargo.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1667388969250-1c7220bf3f37?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"ambiente_ruido_controlado":true,"mesa_afastada_fluxo":true,"cardapio_seletividade":true,"area_escape_sensorial":true,"comunicacao_visual":true,"entrada_sem_filas":true,"equipe_treinada_tea":true}'::jsonb,
  detalhes = '{"horario_menor_movimento":"14:30","tempo_medio_espera":25}'::jsonb,
  selo_azul = true,
  selo_azul_validade = (current_date + interval '11 months')::date,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = true,
  beneficio_tea_descricao = 'Mesa no salão silencioso garantida com reserva de 24h de antecedência, sem taxa, e entrada pela porta lateral evitando a fila da calçada.',
  tem_sala_sensorial = false,
  tem_concierge_tea = false,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = true,
  tem_cardapio_visual = true,
  tem_caa = true,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = true,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000006';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'restaurante',
  endereco = 'Rua Claudino dos Santos, 58 - São Francisco', cidade = 'Curitiba', estado = 'PR',
  website = 'https://mesadolargo.turismoazul.test', num_colaboradores = '6-15',
  estrutura = '{"ambiente_ruido_controlado":true,"mesa_afastada_fluxo":true,"cardapio_seletividade":true,"area_escape_sensorial":true,"comunicacao_visual":true,"entrada_sem_filas":true,"equipe_treinada_tea":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000006';

-- Tempero de Dona Zefa (Salvador/BA)
UPDATE public.estabelecimentos SET
  nome = 'Tempero de Dona Zefa',
  slug = 'tempero-de-dona-zefa',
  status = 'ativo'::estab_status,
  descricao = 'Comida baiana de panela servida no almoço, de terça a domingo. Moqueca, bobó e caruru feitos na hora, com dendê da roça. Casa de 40 lugares no coração do Pelourinho, aberta desde 1994.',
  descricao_tea = 'A casa é pequena e o movimento concentra entre 12h e 14h. Quem prefere um ambiente mais calmo consegue mesa tranquila a partir das 15h. Estamos aprendendo sobre acolhimento sensorial e recebemos bem qualquer orientação da família.',
  endereco = 'Rua Alfredo de Brito, 21 - Pelourinho', cep = '40026-280',
  latitude = -12.973986, longitude = -38.510377,
  telefone = '(71) 3321-4455', email = 'salvador@turismoazul.test', website = NULL,
  foto_capa = 'https://images.unsplash.com/photo-1583354608715-177553a4035e?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1583354608715-177553a4035e?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1494346480775-936a9f0d0877?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1613274554329-70f997f5789f?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"cardapio_seletividade":true,"mesa_afastada_fluxo":true}'::jsonb,
  detalhes = '{"horario_menor_movimento":"15:00","tempo_medio_espera":30}'::jsonb,
  selo_azul = false,
  selo_azul_validade = NULL,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = false,
  beneficio_tea_descricao = NULL,
  tem_sala_sensorial = false,
  tem_concierge_tea = false,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = false,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000007';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'restaurante',
  endereco = 'Rua Alfredo de Brito, 21 - Pelourinho', cidade = 'Salvador', estado = 'BA',
  website = NULL, num_colaboradores = '16-30',
  estrutura = '{"cardapio_seletividade":true,"mesa_afastada_fluxo":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000007';

-- Cantina da Lagoa (Florianópolis/SC)
UPDATE public.estabelecimentos SET
  nome = 'Cantina da Lagoa',
  slug = 'cantina-da-lagoa',
  status = 'pendente'::estab_status,
  descricao = 'Frutos do mar e massas artesanais na beira da Lagoa da Conceição, com deck externo de 30 lugares. Aberto todos os dias a partir das 17h.',
  descricao_tea = 'Cadastro em análise. O deck externo é a parte mais silenciosa da casa e costuma funcionar bem para quem prefere ambiente aberto.',
  endereco = 'Avenida das Rendeiras, 1180 - Lagoa da Conceição', cep = '88062-300',
  latitude = -27.569719, longitude = -48.451581,
  telefone = '(48) 3232-7712', email = 'florianopolis@turismoazul.test', website = NULL,
  foto_capa = 'https://images.unsplash.com/photo-1729394405518-eaf2a0203aa7?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1729394405518-eaf2a0203aa7?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1538333581680-29dd4752ddf2?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1570560258879-af7f8e1447ac?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"mesa_afastada_fluxo":true}'::jsonb,
  detalhes = '{"horario_menor_movimento":"17:30"}'::jsonb,
  selo_azul = false,
  selo_azul_validade = NULL,
  quer_selo_azul = true,
  quer_selo_azul_em = (now() - interval '18 days'),
  tem_beneficio_tea = false,
  beneficio_tea_descricao = NULL,
  tem_sala_sensorial = false,
  tem_concierge_tea = false,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = false,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000008';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'restaurante',
  endereco = 'Avenida das Rendeiras, 1180 - Lagoa da Conceição', cidade = 'Florianópolis', estado = 'SC',
  website = NULL, num_colaboradores = '31-50',
  estrutura = '{"mesa_afastada_fluxo":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000008';

-- Parque Aquático Águas de Olímpia (Olímpia/SP) - Selo Azul
UPDATE public.estabelecimentos SET
  nome = 'Parque Aquático Águas de Olímpia',
  slug = 'parque-aquatico-aguas-de-olimpia',
  status = 'ativo'::estab_status,
  descricao = 'Parque aquático de águas termais com 26 atrações, piscinas de ondas, rio lento e área infantil coberta. Funciona das 9h às 17h, com capacidade limitada por dia para evitar superlotação.',
  descricao_tea = 'Abrimos uma hora antes, às 8h, exclusivamente para famílias com laudo TEA: parque vazio, som ambiente desligado e brinquedos operando em velocidade reduzida. A sala de calma fica ao lado da enfermaria, com colchonetes, iluminação baixa e sem música. O passaporte sensorial dá acesso a todas as filas pela entrada lateral.',
  endereco = 'Rodovia Assis Chateaubriand, km 4 - Distrito Turístico', cep = '15400-000',
  latitude = -20.736634, longitude = -48.910625,
  telefone = '(17) 3279-5000', email = 'olimpia@turismoazul.test', website = 'https://aguasdeolimpia.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1656647657563-ae3274b59492?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1505731110654-99d7f7f8e39c?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1589197471564-8266ed7f59b5?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"grupo_reduzido":true,"roteiro_visual_antecipado":true,"protetor_auricular":true,"area_escape_sensorial":true,"comunicacao_visual":true,"entrada_sem_filas":true,"equipe_treinada_tea":true}'::jsonb,
  detalhes = '{"duracao_media":420,"faixa_etaria":"a partir de 2 anos","exige_ingresso_antecipado":true}'::jsonb,
  selo_azul = true,
  selo_azul_validade = (current_date + interval '11 months')::date,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = true,
  beneficio_tea_descricao = 'Entrada gratuita para o acompanhante de pessoa com laudo TEA e acesso à abertura antecipada das 8h, mediante agendamento.',
  tem_sala_sensorial = true,
  tem_concierge_tea = true,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = true,
  tem_cardapio_visual = true,
  tem_caa = true,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = true,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000009';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'parque',
  endereco = 'Rodovia Assis Chateaubriand, km 4 - Distrito Turístico', cidade = 'Olímpia', estado = 'SP',
  website = 'https://aguasdeolimpia.turismoazul.test', num_colaboradores = '50+',
  estrutura = '{"grupo_reduzido":true,"roteiro_visual_antecipado":true,"protetor_auricular":true,"area_escape_sensorial":true,"comunicacao_visual":true,"entrada_sem_filas":true,"equipe_treinada_tea":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000009';

-- Aquário da Baía (Rio de Janeiro/RJ)
UPDATE public.estabelecimentos SET
  nome = 'Aquário da Baía',
  slug = 'aquario-da-baia',
  status = 'ativo'::estab_status,
  descricao = 'Aquário marinho com 28 tanques dedicados à fauna da costa brasileira, incluindo um túnel de 22 metros e um tanque tátil de estrelas-do-mar. Visitação das 10h às 18h, de terça a domingo.',
  descricao_tea = 'O ambiente já é naturalmente escuro e silencioso, o que muitas famílias relatam funcionar bem. As terças de manhã são o horário mais vazio. Não temos ainda sala de descanso dedicada nem equipe treinada, mas o tanque tátil pode ser aberto fora do horário de grupos escolares se avisado antes.',
  endereco = 'Praia de Botafogo, 400 - Botafogo', cep = '22250-040',
  latitude = -22.945404, longitude = -43.180818,
  telefone = '(21) 2542-6600', email = 'rio@turismoazul.test', website = 'https://aquariodabaia.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1491156855053-9cdff72c7f85?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1491156855053-9cdff72c7f85?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1534445291134-f70b7a81f691?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1521920592574-49e0b121c964?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"ambiente_ruido_controlado":true,"grupo_reduzido":true}'::jsonb,
  detalhes = '{"duracao_media":120,"faixa_etaria":"livre","exige_ingresso_antecipado":false}'::jsonb,
  selo_azul = false,
  selo_azul_validade = NULL,
  quer_selo_azul = true,
  quer_selo_azul_em = (now() - interval '18 days'),
  tem_beneficio_tea = false,
  beneficio_tea_descricao = NULL,
  tem_sala_sensorial = false,
  tem_concierge_tea = false,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = false,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000010';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'atracoes',
  endereco = 'Praia de Botafogo, 400 - Botafogo', cidade = 'Rio de Janeiro', estado = 'RJ',
  website = 'https://aquariodabaia.turismoazul.test', num_colaboradores = '1-5',
  estrutura = '{"ambiente_ruido_controlado":true,"grupo_reduzido":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000010';

-- Museu de Ciências Estação Liberdade (Belo Horizonte/MG) - Selo Azul
UPDATE public.estabelecimentos SET
  nome = 'Museu de Ciências Estação Liberdade',
  slug = 'museu-ciencias-estacao-liberdade',
  status = 'ativo'::estab_status,
  descricao = 'Museu interativo de ciências com 14 salas temáticas, planetário de 60 lugares e laboratório aberto de experimentos. Recebe grupos escolares de manhã e visitação livre à tarde.',
  descricao_tea = 'Nossa visita adaptada acontece às quintas de manhã, com grupos de no máximo oito pessoas e o planetário em sessão reduzida, sem trilha sonora e com luz de transição gradual. Enviamos o roteiro visual completo por e-mail uma semana antes, com foto de cada sala e o tempo previsto em cada uma. Toda a equipe de mediação tem formação em CAA.',
  endereco = 'Praça da Liberdade, 200 - Funcionários', cep = '30140-010',
  latitude = -19.932167, longitude = -43.937059,
  telefone = '(31) 3236-7400', email = 'bh@turismoazul.test', website = 'https://estacaoliberdade.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1696694139314-e0e5962b8dc0?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1696694139314-e0e5962b8dc0?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1649452843752-663493034117?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1764253340517-9adc9a839970?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1670915564082-9258f2c326c4?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"grupo_reduzido":true,"roteiro_visual_antecipado":true,"protetor_auricular":true,"area_escape_sensorial":true,"comunicacao_visual":true,"entrada_sem_filas":true,"equipe_treinada_tea":true}'::jsonb,
  detalhes = '{"duracao_media":180,"faixa_etaria":"a partir de 5 anos","exige_ingresso_antecipado":true}'::jsonb,
  selo_azul = true,
  selo_azul_validade = (current_date + interval '11 months')::date,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = true,
  beneficio_tea_descricao = 'Visita adaptada em grupo reduzido às quintas, sem custo adicional, com roteiro visual enviado antes.',
  tem_sala_sensorial = true,
  tem_concierge_tea = true,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = true,
  tem_cardapio_visual = true,
  tem_caa = true,
  recebe_grupos_escolares_tea = true,
  subtipo_educativo = 'museu',
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000011';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'passeio_educativo',
  endereco = 'Praça da Liberdade, 200 - Funcionários', cidade = 'Belo Horizonte', estado = 'MG',
  website = 'https://estacaoliberdade.turismoazul.test', num_colaboradores = '6-15',
  estrutura = '{"grupo_reduzido":true,"roteiro_visual_antecipado":true,"protetor_auricular":true,"area_escape_sensorial":true,"comunicacao_visual":true,"entrada_sem_filas":true,"equipe_treinada_tea":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000011';

-- Bonito Trilhas e Flutuação (Bonito/MS)
UPDATE public.estabelecimentos SET
  nome = 'Bonito Trilhas e Flutuação',
  slug = 'bonito-trilhas-e-flutuacao',
  status = 'ativo'::estab_status,
  descricao = 'Operadora local de flutuação no Rio da Prata, trilha da Boca da Onça e mergulho na Lagoa Misteriosa. Saídas diárias com transporte incluído a partir do centro de Bonito.',
  descricao_tea = 'Trabalhamos com grupos de até dez pessoas e conseguimos montar saída privativa para uma família só, com o guia dedicado e o horário mais vazio do rio (primeira saída, 7h30). Ainda não temos material visual preparado, mas o guia conversa com a família antes para combinar o ritmo.',
  endereco = 'Rua Coronel Pilad Rebuá, 1890 - Centro', cep = '79290-000',
  latitude = -21.126477, longitude = -56.490221,
  telefone = '(67) 3255-1890', email = 'bonito@turismoazul.test', website = NULL,
  foto_capa = 'https://images.unsplash.com/photo-1579963405196-8f694d063749?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1579963405196-8f694d063749?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1533856493584-0c6ca8ca9ce3?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"grupo_reduzido":true,"paradas_sob_demanda":true}'::jsonb,
  detalhes = '{"duracao_media":300,"faixa_etaria":"a partir de 6 anos","exige_ingresso_antecipado":true}'::jsonb,
  selo_azul = false,
  selo_azul_validade = NULL,
  quer_selo_azul = true,
  quer_selo_azul_em = (now() - interval '18 days'),
  tem_beneficio_tea = false,
  beneficio_tea_descricao = NULL,
  tem_sala_sensorial = false,
  tem_concierge_tea = false,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = false,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000012';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'excursao',
  endereco = 'Rua Coronel Pilad Rebuá, 1890 - Centro', cidade = 'Bonito', estado = 'MS',
  website = NULL, num_colaboradores = '16-30',
  estrutura = '{"grupo_reduzido":true,"paradas_sob_demanda":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000012';

-- Cataratas Transfer Acessível (Foz do Iguaçu/PR)
UPDATE public.estabelecimentos SET
  nome = 'Cataratas Transfer Acessível',
  slug = 'cataratas-transfer-acessivel',
  status = 'ativo'::estab_status,
  descricao = 'Transfer privativo entre aeroporto, hotéis e as atrações de Foz do Iguaçu. Frota de vans de 15 lugares com ar-condicionado e um veículo adaptado com elevador para cadeira de rodas.',
  descricao_tea = 'Nossos motoristas aceitam parada extra a qualquer momento do trajeto, sem custo e sem pergunta. O veículo pode circular com o rádio desligado e o ar em ventilação baixa. A van é sempre exclusiva da família, nunca compartilhada com outros passageiros.',
  endereco = 'Avenida das Cataratas, 3200 - Vila Yolanda', cep = '85853-000',
  latitude = -25.552144, longitude = -54.57072,
  telefone = '(45) 3521-8080', email = 'foz@turismoazul.test', website = 'https://cataratastransfer.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1576314728409-e51799b6f849?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1576314728409-e51799b6f849?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1597172984973-fa1a221fe91d?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1601930113377-729966035f34?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"veiculo_exclusivo":true,"paradas_sob_demanda":true,"ambiente_ruido_controlado":true}'::jsonb,
  detalhes = '{"tipo_veiculo":"Van Sprinter de 15 lugares, ar-condicionado, vidros com película","acessibilidade":"Um veículo da frota tem elevador para cadeira de rodas e espaço para dois carrinhos. Cintos de três pontos em todos os assentos e possibilidade de instalar cadeirinha própria da família."}'::jsonb,
  selo_azul = false,
  selo_azul_validade = NULL,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = false,
  beneficio_tea_descricao = NULL,
  tem_sala_sensorial = false,
  tem_concierge_tea = false,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = false,
  tem_caa = false,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000013';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'transporte',
  endereco = 'Avenida das Cataratas, 3200 - Vila Yolanda', cidade = 'Foz do Iguaçu', estado = 'PR',
  website = 'https://cataratastransfer.turismoazul.test', num_colaboradores = '31-50',
  estrutura = '{"veiculo_exclusivo":true,"paradas_sob_demanda":true,"ambiente_ruido_controlado":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000013';

-- Rota Azul Viagens (Campinas/SP) - Selo Azul
UPDATE public.estabelecimentos SET
  nome = 'Rota Azul Viagens',
  slug = 'rota-azul-viagens',
  status = 'ativo'::estab_status,
  descricao = 'Agência especializada em roteiros para famílias com crianças autistas. Montamos a viagem inteira — voo, hospedagem, passeios e transporte — considerando tempo de deslocamento, horários de menor movimento e pontos de descanso entre uma atividade e outra.',
  descricao_tea = 'Antes de montar qualquer roteiro fazemos uma conversa de uma hora com a família para entender gatilhos, rotina e o que já deu errado em viagens anteriores. Entregamos um roteiro visual impresso e em PDF, com foto de cada lugar e tempo estimado. Durante a viagem ficamos disponíveis por WhatsApp para remanejar o que for preciso.',
  endereco = 'Rua Coronel Quirino, 1420 - Cambuí', cep = '13025-002',
  latitude = -22.892222, longitude = -47.049722,
  telefone = '(19) 3252-6600', email = 'campinas@turismoazul.test', website = 'https://rotaazulviagens.turismoazul.test',
  foto_capa = 'https://images.unsplash.com/photo-1542577731-55541be363d4?w=1200&h=800&fit=crop&q=80',
  fotos = '["https://images.unsplash.com/photo-1542577731-55541be363d4?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1531012451721-432c0ae74527?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1761242606389-0a45db29fdee?w=1200&h=800&fit=crop&q=80"]'::jsonb,
  estrutura = '{"conversa_previa_familia":true,"roteiro_visual_antecipado":true,"acompanhamento_na_viagem":true,"equipe_treinada_tea":true}'::jsonb,
  detalhes = '{}'::jsonb,
  selo_azul = true,
  selo_azul_validade = (current_date + interval '11 months')::date,
  quer_selo_azul = false,
  quer_selo_azul_em = NULL,
  tem_beneficio_tea = true,
  beneficio_tea_descricao = 'Primeira consultoria de roteiro sem custo para famílias com laudo TEA, incluindo o roteiro visual em PDF.',
  tem_sala_sensorial = false,
  tem_concierge_tea = true,
  tem_checkin_antecipado = false,
  tem_fila_prioritaria = false,
  tem_cardapio_visual = false,
  tem_caa = true,
  recebe_grupos_escolares_tea = false,
  subtipo_educativo = NULL,
  destaque = false,
  is_demo = true
WHERE owner_user_id = 'a5e10000-0000-4000-8000-000000000014';

UPDATE public.estabelecimento_profiles SET
  perfil_completo = true, status = 'ativo', tipo = 'agencia',
  endereco = 'Rua Coronel Quirino, 1420 - Cambuí', cidade = 'Campinas', estado = 'SP',
  website = 'https://rotaazulviagens.turismoazul.test', num_colaboradores = '50+',
  estrutura = '{"conversa_previa_familia":true,"roteiro_visual_antecipado":true,"acompanhamento_na_viagem":true,"equipe_treinada_tea":true}'::jsonb, is_demo = true
WHERE id = 'a5e10000-0000-4000-8000-000000000014';

-- ---------------------------------------------------------------------------
-- 3. Quartos (13)
--
-- Só hospedagem tem quarto: hotel, pousada e resort reservam-se escolhendo um
-- quarto, todo o resto reserva-se direto no estabelecimento. É a regra de
-- `estab_e_hospedagem` e do ramo de estadia da ofertas_view.
-- ---------------------------------------------------------------------------

-- Hotel Vale das Hortênsias
INSERT INTO public.itens_reservaveis
  (estabelecimento_id, nome, descricao, preco, quantidade, capacidade_total,
   capacidade_adultos, capacidade_criancas, comodidades, quantidade_camas,
   imagens, check_in_padrao, check_out_padrao, ativo, usa_endereco_proprio, is_demo)
SELECT e.id, v.nome, v.descricao, v.preco, v.quantidade, v.cap_total,
       v.cap_adultos, v.cap_criancas, v.comodidades, v.camas,
       v.imagens, v.checkin, v.checkout, true, false, true
FROM public.estabelecimentos e
CROSS JOIN (VALUES
  ('Apartamento Standard Casal', '22 m², cama queen, janela para o jardim interno. Piso em madeira e cortina blackout.', 465::numeric, 12, 2, 2, 0, ARRAY['wifi','ar_condicionado','tv','frigobar']::text[], 1, '["https://images.unsplash.com/photo-1621293954908-907159247fc8?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time),
  ('Apartamento Família Silencioso', '34 m² na ala leste, com isolamento acústico reforçado, iluminação regulável em três níveis e cama de solteiro extra. É o quarto que indicamos para famílias autistas.', 690::numeric, 4, 4, 2, 2, ARRAY['wifi','ar_condicionado','tv','frigobar','estacionamento']::text[], 3, '["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time),
  ('Suíte Hortênsia com Lareira', '48 m² com lareira a gás, banheira e sala de estar separada do dormitório.', 890::numeric, 2, 3, 2, 1, ARRAY['wifi','ar_condicionado','tv','frigobar','cozinha']::text[], 2, '["https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time)
) AS v(nome, descricao, preco, quantidade, cap_total, cap_adultos, cap_criancas, comodidades, camas, imagens, checkin, checkout)
WHERE e.owner_user_id = 'a5e10000-0000-4000-8000-000000000001';

-- Pousada Costa do Rosa
INSERT INTO public.itens_reservaveis
  (estabelecimento_id, nome, descricao, preco, quantidade, capacidade_total,
   capacidade_adultos, capacidade_criancas, comodidades, quantidade_camas,
   imagens, check_in_padrao, check_out_padrao, ativo, usa_endereco_proprio, is_demo)
SELECT e.id, v.nome, v.descricao, v.preco, v.quantidade, v.cap_total,
       v.cap_adultos, v.cap_criancas, v.comodidades, v.camas,
       v.imagens, v.checkin, v.checkout, true, false, true
FROM public.estabelecimentos e
CROSS JOIN (VALUES
  ('Chalé Mata', 'Chalé de 28 m² voltado para a mata, com varanda e rede. Sem TV, por opção.', 520::numeric, 5, 3, 2, 1, ARRAY['wifi','estacionamento','frigobar']::text[], 2, '["https://images.unsplash.com/photo-1584132869994-873f9363a562?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1742171046853-0961eabdc7d4?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time),
  ('Chalé Mirante do Rosa', '42 m² no ponto mais alto do terreno, com vista para a lagoa e kitchenette completa.', 780::numeric, 4, 4, 2, 2, ARRAY['wifi','estacionamento','ar_condicionado','frigobar','cozinha']::text[], 3, '["https://images.unsplash.com/photo-1527142879-95b61a0b8226?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1664876080601-acf03b40c5e3?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time)
) AS v(nome, descricao, preco, quantidade, cap_total, cap_adultos, cap_criancas, comodidades, camas, imagens, checkin, checkout)
WHERE e.owner_user_id = 'a5e10000-0000-4000-8000-000000000002';

-- Recanto Azul Resort Porto
INSERT INTO public.itens_reservaveis
  (estabelecimento_id, nome, descricao, preco, quantidade, capacidade_total,
   capacidade_adultos, capacidade_criancas, comodidades, quantidade_camas,
   imagens, check_in_padrao, check_out_padrao, ativo, usa_endereco_proprio, is_demo)
SELECT e.id, v.nome, v.descricao, v.preco, v.quantidade, v.cap_total,
       v.cap_adultos, v.cap_criancas, v.comodidades, v.camas,
       v.imagens, v.checkin, v.checkout, true, false, true
FROM public.estabelecimentos e
CROSS JOIN (VALUES
  ('Apartamento Luxo Vista Jardim', '31 m² com varanda para o jardim, cama king e sofá-cama. Pensão completa inclusa.', 980::numeric, 40, 3, 2, 1, ARRAY['wifi','ar_condicionado','tv','frigobar','estacionamento']::text[], 2, '["https://images.unsplash.com/photo-1711114435495-76503f9f3181?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1687834618283-1b9e12de54a7?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time),
  ('Apartamento Família Vista Mar', '52 m² com dois ambientes, varanda ampla de frente para o mar e banheiro com banheira infantil.', 1480::numeric, 18, 5, 2, 3, ARRAY['wifi','ar_condicionado','tv','frigobar','estacionamento']::text[], 4, '["https://images.unsplash.com/photo-1721617864119-611e4544ff07?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1714254571994-60e58b76deb0?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time),
  ('Bangalô Silencioso Beira-Mar', 'Bangalô isolado de 64 m² no extremo sul do terreno, longe da área de piscinas e do som ambiente. Iluminação regulável em todos os ambientes.', 1890::numeric, 6, 4, 2, 2, ARRAY['wifi','ar_condicionado','tv','frigobar','cozinha','estacionamento']::text[], 3, '["https://images.unsplash.com/photo-1732817207228-7d53fec17f97?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1576354302919-96748cb8299e?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time)
) AS v(nome, descricao, preco, quantidade, cap_total, cap_adultos, cap_criancas, comodidades, camas, imagens, checkin, checkout)
WHERE e.owner_user_id = 'a5e10000-0000-4000-8000-000000000003';

-- Hotel Bela Vista Paulista
INSERT INTO public.itens_reservaveis
  (estabelecimento_id, nome, descricao, preco, quantidade, capacidade_total,
   capacidade_adultos, capacidade_criancas, comodidades, quantidade_camas,
   imagens, check_in_padrao, check_out_padrao, ativo, usa_endereco_proprio, is_demo)
SELECT e.id, v.nome, v.descricao, v.preco, v.quantidade, v.cap_total,
       v.cap_adultos, v.cap_criancas, v.comodidades, v.camas,
       v.imagens, v.checkin, v.checkout, true, false, true
FROM public.estabelecimentos e
CROSS JOIN (VALUES
  ('Apartamento Executivo Solteiro', '18 m² com mesa de trabalho e cama de solteiro ampla.', 340::numeric, 30, 1, 1, 0, ARRAY['wifi','ar_condicionado','tv','frigobar']::text[], 1, '["https://images.unsplash.com/photo-1630660664869-c9d3cc676880?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1552858725-2758b5fb1286?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time),
  ('Apartamento Superior Casal', '26 m² com cama queen e janela antirruído voltada para a Alameda Santos.', 480::numeric, 24, 2, 2, 0, ARRAY['wifi','ar_condicionado','tv','frigobar','estacionamento']::text[], 1, '["https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1521783988139-89397d761dce?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time),
  ('Apartamento Família Final 08', '38 m² no fim do corredor, o mais distante do elevador e da copa do andar.', 620::numeric, 8, 4, 2, 2, ARRAY['wifi','ar_condicionado','tv','frigobar','estacionamento']::text[], 3, '["https://images.unsplash.com/photo-1578898886225-c7c894047899?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1631049421450-348ccd7f8949?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time)
) AS v(nome, descricao, preco, quantidade, cap_total, cap_adultos, cap_criancas, comodidades, camas, imagens, checkin, checkout)
WHERE e.owner_user_id = 'a5e10000-0000-4000-8000-000000000004';

-- Pousada Casa da Serra
INSERT INTO public.itens_reservaveis
  (estabelecimento_id, nome, descricao, preco, quantidade, capacidade_total,
   capacidade_adultos, capacidade_criancas, comodidades, quantidade_camas,
   imagens, check_in_padrao, check_out_padrao, ativo, usa_endereco_proprio, is_demo)
SELECT e.id, v.nome, v.descricao, v.preco, v.quantidade, v.cap_total,
       v.cap_adultos, v.cap_criancas, v.comodidades, v.camas,
       v.imagens, v.checkin, v.checkout, true, false, true
FROM public.estabelecimentos e
CROSS JOIN (VALUES
  ('Quarto Pátio', '20 m² com porta para o pátio de pedra. Teto alto original do casarão.', 330::numeric, 6, 2, 2, 0, ARRAY['wifi','ar_condicionado','tv']::text[], 1, '["https://images.unsplash.com/photo-1549638441-b787d2e11f14?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time),
  ('Quarto Família Corredor Sem Passagem', '36 m² no corredor lateral, sem trânsito de outros hóspedes. Iluminação regulável e cortina blackout.', 540::numeric, 3, 4, 2, 2, ARRAY['wifi','ar_condicionado','tv','frigobar']::text[], 3, '["https://images.unsplash.com/photo-1667125095636-dce94dcbdd96?w=1200&h=800&fit=crop&q=80","https://images.unsplash.com/photo-1559414059-34fe0a59e57a?w=1200&h=800&fit=crop&q=80"]'::jsonb, '14:00'::time, '11:00'::time)
) AS v(nome, descricao, preco, quantidade, cap_total, cap_adultos, cap_criancas, comodidades, camas, imagens, checkin, checkout)
WHERE e.owner_user_id = 'a5e10000-0000-4000-8000-000000000005';

COMMIT;

-- ---------------------------------------------------------------------------
-- Conferência rápida (opcional)
-- ---------------------------------------------------------------------------
-- SELECT nome, cidade, estado, tipo, status, selo_azul FROM public.estabelecimentos WHERE is_demo ORDER BY selo_azul DESC, nome;
-- SELECT count(*) AS ofertas_visiveis FROM public.ofertas_view;

-- ---------------------------------------------------------------------------
-- ROLLBACK - remove tudo que este arquivo criou.
-- Apagar o usuário cascateia para perfil, papel, estabelecimento e quartos.
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM auth.users WHERE id IN (
--   'a5e10000-0000-4000-8000-000000000001',
--   'a5e10000-0000-4000-8000-000000000002',
--   'a5e10000-0000-4000-8000-000000000003',
--   'a5e10000-0000-4000-8000-000000000004',
--   'a5e10000-0000-4000-8000-000000000005',
--   'a5e10000-0000-4000-8000-000000000006',
--   'a5e10000-0000-4000-8000-000000000007',
--   'a5e10000-0000-4000-8000-000000000008',
--   'a5e10000-0000-4000-8000-000000000009',
--   'a5e10000-0000-4000-8000-000000000010',
--   'a5e10000-0000-4000-8000-000000000011',
--   'a5e10000-0000-4000-8000-000000000012',
--   'a5e10000-0000-4000-8000-000000000013',
--   'a5e10000-0000-4000-8000-000000000014'
-- );
-- COMMIT;
