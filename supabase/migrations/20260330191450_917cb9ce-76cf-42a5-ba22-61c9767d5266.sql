
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pasta TEXT,
  nome_cliente TEXT NOT NULL,
  reclamado TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  observacao TEXT,
  cargo TEXT,
  valor_da_causa NUMERIC,
  data_distribuicao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clientes" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clientes" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clientes" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clientes" ON public.clientes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Juntas
CREATE TABLE public.juntas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jcj_real TEXT NOT NULL,
  local_real TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.juntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own juntas" ON public.juntas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own juntas" ON public.juntas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own juntas" ON public.juntas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own juntas" ON public.juntas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_juntas_updated_at BEFORE UPDATE ON public.juntas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agenda
CREATE TABLE public.agenda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  junta TEXT,
  processo TEXT,
  data_distribuicao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own agenda" ON public.agenda FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agenda" ON public.agenda FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agenda" ON public.agenda FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agenda" ON public.agenda FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_agenda_updated_at BEFORE UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Compromissos
CREATE TABLE public.compromissos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  junta_id UUID REFERENCES public.juntas(id) ON DELETE SET NULL,
  processo TEXT,
  data TIMESTAMPTZ,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compromissos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own compromissos" ON public.compromissos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own compromissos" ON public.compromissos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own compromissos" ON public.compromissos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own compromissos" ON public.compromissos FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_compromissos_updated_at BEFORE UPDATE ON public.compromissos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Respostas Compromisso
CREATE TABLE public.respostas_compromisso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compromisso_id UUID NOT NULL REFERENCES public.compromissos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  descricao_resposta TEXT,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.respostas_compromisso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own respostas" ON public.respostas_compromisso FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own respostas" ON public.respostas_compromisso FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own respostas" ON public.respostas_compromisso FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own respostas" ON public.respostas_compromisso FOR DELETE USING (auth.uid() = user_id);
