-- ============================================
-- VaultX Database Schema — Supabase PostgreSQL
-- ============================================

-- PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  master_password_hash TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASSWORDS TABLE
CREATE TABLE public.passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  site_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('email','banking','social_media','work','others')
  ),
  original_password TEXT,
  encrypted_version TEXT NOT NULL,
  save_type TEXT NOT NULL CHECK (
    save_type IN ('original','encrypted','both')
  ),
  iv TEXT,
  auth_tag TEXT,
  strength_score INTEGER DEFAULT 0,
  is_breached BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOGS TABLE
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can only access own profile"
  ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access own passwords"
  ON public.passwords FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own logs"
  ON public.activity_logs FOR ALL USING (auth.uid() = user_id);

-- AUTO UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN NEW.last_updated = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_last_updated
  BEFORE UPDATE ON public.passwords
  FOR EACH ROW EXECUTE FUNCTION update_last_updated();
