
# Arquitetura de contas e papéis

## 1. Banco de dados (migration)

**Enum `app_role`** — adicionar valor `estabelecimento`:
```
ALTER TYPE app_role ADD VALUE 'estabelecimento';
```

**Nova tabela `estabelecimento_profiles`** (perfil do dono da conta, separado de `estabelecimentos` que é o cadastro público):
- `id uuid PK` (= auth.users.id)
- `nome_responsavel`, `cargo`, `email`, `whatsapp`
- `estabelecimento_id uuid` (FK lógica para `estabelecimentos`, nullable até admin aprovar/criar)
- `criado_em`
- RLS: dono lê/edita o próprio; admin lê todos.

**Coluna nova em `estabelecimentos`**: `owner_user_id uuid` (nullable) — vincula o registro público ao dono logado. Atualizar policy: dono pode UPDATE quando `owner_user_id = auth.uid()`.

**Atualizar `handle_new_user()`**: ler `raw_user_meta_data->>'account_type'`:
- `familia` (default) → cria `familia_profiles` + role `user`
- `estabelecimento` → cria `estabelecimento_profiles` + role `estabelecimento` + cria registro stub em `estabelecimentos` (nome, tipo, cidade, estado vindos do metadata) com `owner_user_id = NEW.id`.

## 2. Formulários de waitlist viram signup

**`LeadFamiliasForm`**: adicionar campo senha; ao submeter:
1. `supabase.auth.signUp({ email, password, options: { data: { account_type: 'familia', nome_responsavel, telefone, cidade, estado } } })`
2. INSERT em `leads_familias` (mantém o lead para CRM)
3. Redireciona para `/minha-conta` (já existe).

**`LeadEstabelecimentosForm`**: idem, com `account_type: 'estabelecimento'` + dados do estabelecimento no metadata. Redireciona para `/minha-empresa`.

## 3. Nova área `/minha-empresa`

- Layout protegido (verifica role `estabelecimento`).
- Página única: editar perfil do local — nome, tipo, descrição, descricao_tea, cidade, estado, endereço, cep, telefone, email, website, recursos TEA (checkboxes: tem_caa, tem_sala_sensorial, etc.), foto_capa.
- Salva em `estabelecimentos` filtrado por `owner_user_id = auth.uid()`.
- Mostra status (rascunho / ativo) — só admin muda status.

## 4. Painel admin de usuários

Nova rota `/admin/usuarios`:
- Lista famílias (`familia_profiles`) + estabelecimentos (`estabelecimento_profiles`) com role atual.
- Botão "Promover a admin" / "Remover admin" → INSERT/DELETE em `user_roles`.
- Item no menu lateral admin.

## 5. Header / Auth

- `useAuth` passa a expor `role: 'admin' | 'estabelecimento' | 'user'`.
- Header: link "Minha conta" para família, "Minha empresa" para estabelecimento, "Admin" para admin.
- `resolvePostLoginPath`: se role = estabelecimento → `/minha-empresa`; senão lógica atual.

## 6. Fora de escopo (deixar para depois)

- Reservas chegando ao estabelecimento (já existe `reservas`, mas sem UI no painel do parceiro).
- Aprovação manual / fluxo de moderação (estabelecimento entra como `status='ativo'` direto; admin pode despublicar).
- Confirmação de email permanece desligada ou conforme config atual; não vamos auto-confirmar.

## Detalhes técnicos

- Migration: ALTER TYPE + CREATE TABLE + ALTER TABLE estabelecimentos + REPLACE FUNCTION handle_new_user + RLS policies.
- Após migration, regenerar types acontece automaticamente.
- Manter inserção em `leads_*` para não perder histórico do CRM.
- Validação: senha mínima 6 chars; mostrar erro se email já existir.
