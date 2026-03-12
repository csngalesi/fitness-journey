-- Fitness Journey MED - Migration v4
-- Add training_level to profiles
-- Run in Supabase SQL Editor

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS training_level TEXT
    CHECK (training_level IN ('beginner', 'intermediate', 'advanced'))
    DEFAULT 'intermediate';
