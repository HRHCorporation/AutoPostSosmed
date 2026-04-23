-- Drop tables if they exist
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS social_accounts;
DROP TABLE IF EXISTS media;

-- Note: We assume the Supabase "users" table is used for authentication 
-- and we reference auth.users in our tables.

-- Table: social_accounts
CREATE TABLE social_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  provider_user_id text, -- LinkedIn URN (e.g. urn:li:person:ABC123)
  access_token text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, provider)
);

-- Table: posts
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published');

CREATE TABLE posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  status post_status DEFAULT 'draft' NOT NULL,
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  first_comment text,
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

-- Row Level Security (RLS)
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own social accounts" ON social_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own posts" ON posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own media" ON media
  FOR ALL USING (auth.uid() = user_id);
