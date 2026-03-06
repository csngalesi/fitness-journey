-- ============================================================
-- Fitness Journey — "Minimum Effective Dose" Tracker
-- Schema SQL v1 (Supabase)
-- ============================================================

-- ============================================================
-- 1. USERS (Profiles Profile Tracker)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name  TEXT NOT NULL,
    current_goal TEXT DEFAULT 'Maintenance', -- 'Bulking', 'Cutting', 'Maintenance'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. NUTRITION MODULE (Metas e Diário)
-- ============================================================

-- Log diário (1 por pessoa por dia)
CREATE TABLE IF NOT EXISTS public.nutrition_daily_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Metas do dia (Podem ser cravadas do objetivo no momento da criação)
    target_cals  INTEGER NOT NULL,
    target_pro   INTEGER NOT NULL, -- Gramas de Proteína
    target_carb  INTEGER NOT NULL, -- Gramas de Carboidrato
    target_fat   INTEGER NOT NULL, -- Gramas de Gordura
    
    -- Consumido no dia (A interface atualiza esses campos ao adicionar refeições)
    consumed_cals INTEGER DEFAULT 0,
    consumed_pro  INTEGER DEFAULT 0,
    consumed_carb INTEGER DEFAULT 0,
    consumed_fat  INTEGER DEFAULT 0,
    
    UNIQUE(user_id, log_date)
);

-- Refeições isoladas (O que foi comido no log_date)
CREATE TABLE IF NOT EXISTS public.nutrition_meals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id UUID NOT NULL REFERENCES public.nutrition_daily_logs(id) ON DELETE CASCADE,
    meal_time   TIME NOT NULL DEFAULT CURRENT_TIME,
    description TEXT NOT NULL, -- "Omelete de 4 ovos com queijo"
    cals        INTEGER NOT NULL,
    pro         INTEGER NOT NULL,
    carb        INTEGER NOT NULL,
    fat         INTEGER NOT NULL
);

-- ============================================================
-- 3. SURVIVAL GUIDE & EDUCATION (Food Dictionary)
-- ============================================================
-- Biblioteca global do casal: Snacks de mercado, lanches de rua e "Aculturamento"
CREATE TABLE IF NOT EXISTS public.food_dictionary (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category   TEXT NOT NULL, -- 'Survival Macro', 'Fast Food Reality Check', 'Staple'
    name       TEXT NOT NULL, -- "Yopro 15g + Banana" ou "Big Mac"
    cals       INTEGER NOT NULL,
    pro        INTEGER NOT NULL,
    carb       INTEGER NOT NULL,
    fat        INTEGER NOT NULL,
    context_tip TEXT -- "Ótimo para dias de pressa na rua" ou "Cuidado: 50% é só molho gordo"
);

-- ============================================================
-- 4. WORKOUT MODULE (Progressive Overload)
-- ============================================================

-- Fichas Padrões ("Treino A - Peito", "Treino B - Costas")
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name       TEXT NOT NULL, 
    focus_area TEXT
);

-- Execução Real no Dia a Dia
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.workout_templates(id),
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rpe_score   INTEGER, -- Rate of Perceived Exertion (1 a 10) para medir fadiga do SNC
    duration_min INTEGER
);

-- Séries de Progressive Overload (Quantos KGs pegou?)
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    set_number   INTEGER NOT NULL,
    weight_kg    NUMERIC NOT NULL,
    reps         INTEGER NOT NULL,
    is_pr        BOOLEAN DEFAULT FALSE -- Flag visual de Personal Record batido
);

-- ============================================================
-- 5. CARDIO MODULE (Prescrição e Tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cardio_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    cardio_type     TEXT NOT NULL, -- 'HIIT' ou 'LISS'
    protocol        TEXT NOT NULL, -- Ex: '5 Tiros de 100m' ou '20min Esteira 5km/h'
    duration_min    INTEGER NOT NULL,
    perceived_effort INTEGER -- 1 a 10
);

-- ============================================================
-- 6. COMPUTER VISION MODULE (Progress Tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.progress_photos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    capture_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    photo_front_url TEXT,
    photo_side_url  TEXT,
    photo_back_url  TEXT,
    
    -- Análise preenchida pela IA (Gemini Model)
    ai_est_bodyfat   NUMERIC,
    ai_vascularity_score INTEGER, -- 1 a 10 (Julgamento AI)
    ai_density_score     INTEGER, -- 1 a 10 (Julgamento AI)
    ai_feedback      TEXT -- Contexto qualitativo
);

-- ============================================================
-- RLS - ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- Casal compartilha o mesmo escopo visual nos Dicionários
CREATE POLICY "food_dictionary_all" ON public.food_dictionary FOR ALL TO authenticated USING (true);

-- Dados Pessoais de usuários restritos ao seu criador
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "nutrition_logs_own" ON public.nutrition_daily_logs FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "workouts_own" ON public.workout_sessions FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "cardio_own" ON public.cardio_logs FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "photos_own" ON public.progress_photos FOR ALL TO authenticated USING (user_id = auth.uid());
