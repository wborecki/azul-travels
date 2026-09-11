
-- Permite que o dono leia seu próprio estabelecimento mesmo antes de status = 'ativo'.
-- Sem esta policy, a query por owner_user_id em /meu-estabelecimento retorna vazio
-- (estabId null) enquanto o registro estiver 'pendente' ou 'rascunho'.
DROP POLICY IF EXISTS "Owner reads own estabelecimento" ON public.estabelecimentos;
CREATE POLICY "Owner reads own estabelecimento"
  ON public.estabelecimentos FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id);
