-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  instance_id uuid,
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  confirmation_token varchar(255),
  recovery_token varchar(255),
  email_change_token_new varchar(255),
  email_change varchar(255),
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_sso_user boolean
);

-- Create auth.identities table
CREATE TABLE IF NOT EXISTS auth.identities (
  id varchar(255),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_data jsonb,
  provider text,
  provider_id text,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  PRIMARY KEY (id, provider)
);

-- Insert mock single user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@automatein.local',
  crypt('automatein-admin-2024', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Insert identity record
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'admin@automatein.local'),
  'email',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id, provider) DO NOTHING;

-- Drop tables if they exist
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS social_accounts;
DROP TABLE IF EXISTS media;
DROP TYPE IF EXISTS post_status;

-- Table: social_accounts
CREATE TABLE social_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  provider_account_id text, -- Used to store the LinkedIn Person URN (sub)
  access_token text NOT NULL,
  account_name text,
  account_picture text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: posts
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published');

CREATE TABLE posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Table: media
CREATE TABLE media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
