-- Create missing tables in public schema for Viva360

-- 8. Swap Offers (Alchemy)
CREATE TABLE IF NOT EXISTS public.swap_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    provider_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    offered_item_id UUID,
    requested_item_id UUID,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Tribe Invites
CREATE TABLE IF NOT EXISTS public.tribe_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    hub_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Vacancies
CREATE TABLE IF NOT EXISTS public.vacancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    specialties TEXT[],
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Records (Patient Records)
CREATE TABLE IF NOT EXISTS public.records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    patient_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- 'anamnesis' | 'session'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Events (Event Sourcing)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    stream_id UUID NOT NULL,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Metamorphosis Projections
CREATE TABLE IF NOT EXISTS public.metamorphosis_projections (
    user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
    total_checkins INTEGER DEFAULT 0,
    last_mood TEXT,
    streak_days INTEGER DEFAULT 0,
    evolution_score INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Oracle Messages
CREATE TABLE IF NOT EXISTS public.oracle_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    category TEXT NOT NULL,
    element TEXT NOT NULL,
    moods TEXT[],
    phases TEXT[],
    depth INTEGER DEFAULT 1,
    weight DECIMAL DEFAULT 1.0,
    rarity TEXT DEFAULT 'common',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Oracle History
CREATE TABLE IF NOT EXISTS public.oracle_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.oracle_messages (id) ON DELETE CASCADE,
    drawn_at TIMESTAMPTZ DEFAULT now(),
    context JSONB NOT NULL
);

-- 17. Guardian Presence
CREATE TABLE IF NOT EXISTS public.guardian_presence (
    guardian_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
    status TEXT DEFAULT 'OFFLINE',
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Ensure other base tables exist (from master_setup)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    image TEXT,
    category TEXT,
    type TEXT,
    description TEXT,
    owner_id UUID REFERENCES public.profiles (id),
    created_at TIMESTAMPTZ DEFAULT now()
);