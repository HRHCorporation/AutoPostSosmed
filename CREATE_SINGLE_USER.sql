-- SQL Script to Create Single User for No-Auth Mode
-- Run this in your Supabase SQL Editor

-- 1. Create user in auth.users table
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
  email_change
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
  ''
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create identity record
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

-- 3. Verify user creation
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Success! User created with:
-- Email: admin@automatein.local
-- Password: automatein-admin-2024
-- User ID: 00000000-0000-0000-0000-000000000001
--
-- NOTE: This user is only for internal reference.
-- In no-auth mode, the app doesn't actually use authentication.
-- All operations use the hardcoded SINGLE_USER_ID.