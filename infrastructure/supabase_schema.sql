-- Viva360: Official Supabase Schema (Zero-Cost Mode)

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'CLIENT',
    avatar TEXT,
    karma INTEGER DEFAULT 100,
    streak INTEGER DEFAULT 0,
    multiplier DECIMAL DEFAULT 1.0,
    plant_stage TEXT DEFAULT 'seed',
    plant_xp INTEGER DEFAULT 0,
    corporate_balance DECIMAL DEFAULT 0,
    personal_balance DECIMAL DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    client_id UUID REFERENCES profiles (id),
    professional_id UUID REFERENCES profiles (id),
    service_name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    price DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MARKETPLACE TABLE
CREATE TABLE IF NOT EXISTS marketplace_products (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL NOT NULL,
    category TEXT,
    type TEXT DEFAULT 'physical',
    image TEXT,
    karma_reward INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS POLICIES (Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- Profile: Users can view all, but only edit own
CREATE POLICY "Public Profiles are viewable by everyone" ON profiles FOR
SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid () = id);

-- Appointments: Users can only see their own (as client or pro)
CREATE POLICY "Users can see their own appointments" ON appointments FOR
SELECT USING (
        auth.uid () = client_id
        OR auth.uid () = professional_id
    );

CREATE POLICY "Clients can create appointments" ON appointments FOR
INSERT
WITH
    CHECK (auth.uid () = client_id);

-- Marketplace: Viewable by all, editable by none (Client side)
CREATE POLICY "Marketplace is viewable by all" ON marketplace_products FOR
SELECT USING (true);

-- 5. FUNCTION: Update Updated_At
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();