-- Fitness Journey MED - Migration v3
-- Replace age (INT) with birth_date (DATE) on profiles
-- Run in Supabase SQL Editor

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS age;
