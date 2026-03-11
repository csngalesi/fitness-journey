-- Fitness Journey MED - Migration v3
-- Add all missing columns to profiles + replace age with birth_date
-- Run in Supabase SQL Editor

-- first_name already exists (NOT NULL) — just ensure other columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metabolic_goal TEXT CHECK (metabolic_goal IN ('lose', 'gain', 'maintain', 'recomp'));
ALTER TABLE public.profiles DROP COLUMN IF EXISTS age;
