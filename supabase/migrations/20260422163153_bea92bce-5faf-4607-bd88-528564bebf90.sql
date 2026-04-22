
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.tea_nivel AS ENUM ('leve','moderado','severo');
CREATE TYPE public.estab_tipo AS ENUM ('hotel','pousada','resort','restaurante','parque','atracoes','agencia','transporte');
CREATE TYPE public.estab_status AS ENUM ('ativo','inativo','pendente');
CREATE TYPE public.reserva_status AS ENUM ('pendente','confirmada','cancelada','concluida');
CREATE TYPE public.conteudo_categoria AS ENUM ('legislacao','dicas_viagem','boas_praticas','novidades','destinos');

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ FAMILIA PROFILES ============
CREATE TABLE public.familia_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_responsavel TEXT,
  email TEXT,
  telefone TEXT,
  cidade TEXT,
  estado TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.familia_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.familia_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.familia_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.familia_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.familia_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ PERFIL SENSORIAL ============
CREATE TABLE public.perfil_sensorial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES public.familia_profiles(id) ON DELETE CASCADE,
  nome_autista TEXT NOT NULL,
  idade INT,
  nivel_tea public.tea_nivel,
  sensivel_sons BOOLEAN DEFAULT FALSE,
  sensivel_luz BOOLEAN DEFAULT FALSE,
  sensivel_texturas BOOLEAN DEFAULT FALSE,
  sensivel_cheiros BOOLEAN DEFAULT FALSE,
  sensivel_multidao BOOLEAN DEFAULT FALSE,
  comunicacao_verbal BOOLEAN DEFAULT TRUE,
  usa_caa BOOLEAN DEFAULT FALSE,
  usa_libras BOOLEAN DEFAULT FALSE,
  precisa_sala_sensorial BOOLEAN DEFAULT FALSE,
  precisa_checkin_antecipado BOOLEAN DEFAULT FALSE,
  precisa_fila_prioritaria BOOLEAN DEFAULT FALSE,
  precisa_cardapio_visual BOOLEAN DEFAULT FALSE,
  precisa_concierge_tea BOOLEAN DEFAULT FALSE,
  dificuldade_esperar BOOLEAN DEFAULT FALSE,
  dificuldade_mudanca_rotina BOOLEAN DEFAULT FALSE,
  gosta_atividades_agua BOOLEAN DEFAULT FALSE,
  gosta_natureza BOOLEAN DEFAULT FALSE,
  gosta_animais BOOLEAN DEFAULT FALSE,
  notas_adicionais TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.perfil_sensorial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family manages own perfis" ON public.perfil_sensorial
  FOR ALL TO authenticated USING (auth.uid() = familia_id) WITH CHECK (auth.uid() = familia_id);
CREATE POLICY "Admins view all perfis" ON public.perfil_sensorial
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ ESTABELECIMENTOS ============
CREATE TABLE public.estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tipo public.estab_tipo NOT NULL,
  descricao TEXT,
  descricao_tea TEXT,
  cidade TEXT,
  estado TEXT,
  endereco TEXT,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  website TEXT,
  foto_capa TEXT,
  fotos JSONB DEFAULT '[]',
  tour_360_url TEXT,
  selo_azul BOOLEAN DEFAULT FALSE,
  selo_azul_validade DATE,
  selo_governamental BOOLEAN DEFAULT FALSE,
  selo_privado BOOLEAN DEFAULT FALSE,
  selo_privado_nome TEXT,
  listagem_basica BOOLEAN DEFAULT TRUE,
  tem_sala_sensorial BOOLEAN DEFAULT FALSE,
  tem_concierge_tea BOOLEAN DEFAULT FALSE,
  tem_checkin_antecipado BOOLEAN DEFAULT FALSE,
  tem_fila_prioritaria BOOLEAN DEFAULT FALSE,
  tem_cardapio_visual BOOLEAN DEFAULT FALSE,
  tem_caa BOOLEAN DEFAULT FALSE,
  tem_beneficio_tea BOOLEAN DEFAULT FALSE,
  beneficio_tea_descricao TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  status public.estab_status DEFAULT 'ativo',
  destaque BOOLEAN DEFAULT FALSE,
  mensalidade_ativa BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active estabelecimentos" ON public.estabelecimentos
  FOR SELECT TO anon, authenticated USING (status = 'ativo');
CREATE POLICY "Admins read all estabelecimentos" ON public.estabelecimentos
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage estabelecimentos" ON public.estabelecimentos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_estab_status ON public.estabelecimentos(status);
CREATE INDEX idx_estab_destaque ON public.estabelecimentos(destaque);
CREATE INDEX idx_estab_tipo ON public.estabelecimentos(tipo);

-- ============ RESERVAS ============
CREATE TABLE public.reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES public.familia_profiles(id) ON DELETE CASCADE,
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  perfil_sensorial_id UUID REFERENCES public.perfil_sensorial(id),
  data_checkin DATE,
  data_checkout DATE,
  num_adultos INT DEFAULT 1,
  num_autistas INT DEFAULT 1,
  mensagem TEXT,
  status public.reserva_status DEFAULT 'pendente',
  perfil_enviado_ao_estabelecimento BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family sees own reservas" ON public.reservas
  FOR SELECT TO authenticated USING (auth.uid() = familia_id);
CREATE POLICY "Family creates own reservas" ON public.reservas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = familia_id);
CREATE POLICY "Family updates own reservas" ON public.reservas
  FOR UPDATE TO authenticated USING (auth.uid() = familia_id);
CREATE POLICY "Admins see all reservas" ON public.reservas
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all reservas" ON public.reservas
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ AVALIACOES ============
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES public.familia_profiles(id) ON DELETE CASCADE,
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nota_geral INT CHECK (nota_geral BETWEEN 1 AND 5),
  nota_acolhimento INT CHECK (nota_acolhimento BETWEEN 1 AND 5),
  nota_estrutura INT CHECK (nota_estrutura BETWEEN 1 AND 5),
  nota_comunicacao INT CHECK (nota_comunicacao BETWEEN 1 AND 5),
  comentario TEXT,
  publica BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads public avaliacoes" ON public.avaliacoes
  FOR SELECT TO anon, authenticated USING (publica = TRUE);
CREATE POLICY "Family manages own avaliacoes" ON public.avaliacoes
  FOR ALL TO authenticated USING (auth.uid() = familia_id) WITH CHECK (auth.uid() = familia_id);

-- ============ CONTEUDO TEA ============
CREATE TABLE public.conteudo_tea (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT,
  conteudo TEXT,
  categoria public.conteudo_categoria,
  autor TEXT,
  foto_capa TEXT,
  publicado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.conteudo_tea ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published conteudo" ON public.conteudo_tea
  FOR SELECT TO anon, authenticated USING (publicado = TRUE);
CREATE POLICY "Admins manage conteudo" ON public.conteudo_tea
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGER: auto-create familia_profile + role on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.familia_profiles (id, nome_responsavel, email, telefone, cidade, estado)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nome_responsavel',
    NEW.email,
    NEW.raw_user_meta_data->>'telefone',
    NEW.raw_user_meta_data->>'cidade',
    NEW.raw_user_meta_data->>'estado'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
