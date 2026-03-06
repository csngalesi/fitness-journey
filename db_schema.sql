-- ==========================================
-- Fitness Journey MED - SUPABASE SCHEMA V1
-- ==========================================

-- CUIDADO: Este script cria as tabelas e políticas de segurança RLS.
-- Rode no SQL Editor do seu projeto Supabase.

-- -----------------------------------------------------
-- 1. Profiles (Biometria)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  height_cm INT,
  age INT,
  gender TEXT CHECK (gender IN ('M', 'F')),
  metabolic_goal TEXT CHECK (metabolic_goal IN ('lose', 'gain', 'maintain', 'recomp'))
);

-- Habilitar RLS (Row Level Security) - Só o próprio usuário pode ver/editar sua linha
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem o próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários editam o próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuários criam o próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------
-- 2. Nutrition Logs (Diário de Nutrição)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  title TEXT,
  total_calories INT,
  macros_json JSONB DEFAULT '{}'::jsonb,
  meals_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS Nutrition Logs Select" ON public.nutrition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS Nutrition Logs Insert" ON public.nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS Nutrition Logs Update" ON public.nutrition_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS Nutrition Logs Delete" ON public.nutrition_logs FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 3. Evolution Logs (Fotos e BF)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evolution_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  title TEXT,
  average_bf NUMERIC(4,1),
  average_weight NUMERIC(5,1),
  photos_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.evolution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS Evolution Logs Select" ON public.evolution_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS Evolution Logs Insert" ON public.evolution_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS Evolution Logs Update" ON public.evolution_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS Evolution Logs Delete" ON public.evolution_logs FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 4. Physique Architect (Diretrizes de Treino / Prompt)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.physique_architect (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  master_prompt TEXT,
  weekly_volumes_json JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.physique_architect ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS Physique Architect Select" ON public.physique_architect FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS Physique Architect Insert" ON public.physique_architect FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS Physique Architect Update" ON public.physique_architect FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS Physique Architect Delete" ON public.physique_architect FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 5. Workout Executions (Diário de Treino / Overload)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  workout_title TEXT,
  exercises_log_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS Workout Executions Select" ON public.workout_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS Workout Executions Insert" ON public.workout_executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS Workout Executions Update" ON public.workout_executions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS Workout Executions Delete" ON public.workout_executions FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 6. Mitochondrial Cardio (Cardiômetro)
-- -----------------------------------------------------
CREATE TABLE public.mitochondrial_cardio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  modality_type TEXT CHECK (modality_type IN ('HIIT', 'MISS', 'LISS')),
  modality_name TEXT,
  duration_min INT,
  calories INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mitochondrial_cardio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS Mitochondrial Cardio Select" ON public.mitochondrial_cardio FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "RLS Mitochondrial Cardio Insert" ON public.mitochondrial_cardio FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS Mitochondrial Cardio Update" ON public.mitochondrial_cardio FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "RLS Mitochondrial Cardio Delete" ON public.mitochondrial_cardio FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- BUCKET DE IMAGENS (Supabase Storage)
-- ==========================================
-- Inicie o bucket no painel do Supabase Storage manualmente via UI,
-- ou caso esteja rodando numa Role SUPERUSER:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evolution_photos', 'evolution_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Regras de Segurança (RLS) para o Storage (Acesso público mas dono controla inserção)
CREATE POLICY "Public Access to Evolution Photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'evolution_photos' );

CREATE POLICY "User can upload photos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'evolution_photos' AND auth.uid() = owner );

CREATE POLICY "User can update photos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'evolution_photos' AND auth.uid() = owner );

CREATE POLICY "User can delete photos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'evolution_photos' AND auth.uid() = owner );
