-- Standalone PostgreSQL Schema
-- No Supabase auth dependency — works with local PostgreSQL or Vercel Postgres (Neon)
-- Run once: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  status post_status DEFAULT 'draft' NOT NULL,
  visibility text DEFAULT 'PUBLIC' NOT NULL,
  platforms text NOT NULL DEFAULT 'linkedin',
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  first_comment text,
  image_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_account_id text,
  access_token text NOT NULL,
  account_name text,
  account_picture text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS automations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  trigger_keyword text NOT NULL,
  dm_message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
