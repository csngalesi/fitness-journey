-- Fitness Journey MED - Migration v2
-- Add weight_kg to profiles table
-- Run in Supabase SQL Editor

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1);
