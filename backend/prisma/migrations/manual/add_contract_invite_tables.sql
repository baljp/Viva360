-- Migration: Add Contract and SpaceInvite tables (matching Prisma schema)
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.profiles(id),
    guardian_id UUID NOT NULL REFERENCES public.profiles(id),
    space_name TEXT NOT NULL DEFAULT '',
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 year'),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'cancelled')),
    monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    revenue_share INT NOT NULL DEFAULT 0,
    rooms_allowed TEXT[] DEFAULT '{}',
    hours_per_week INT NOT NULL DEFAULT 0,
    benefits TEXT[] DEFAULT '{}',
    rules TEXT[] DEFAULT '{}',
    terms TEXT,
    signed BOOLEAN NOT NULL DEFAULT false,
    version TEXT NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contracts_guardian_status ON public.contracts(guardian_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_space_status ON public.contracts(space_id, status);

CREATE TABLE IF NOT EXISTS public.space_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.profiles(id),
    code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'GUARDIAN',
    usage INT NOT NULL DEFAULT 0,
    max_usage INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_space_invites_code ON public.space_invites(code);
CREATE INDEX IF NOT EXISTS idx_space_invites_space ON public.space_invites(space_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='session_count') THEN
        ALTER TABLE public.rooms ADD COLUMN session_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='duration_min') THEN
        ALTER TABLE public.appointments ADD COLUMN duration_min INT DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='price') THEN
        ALTER TABLE public.appointments ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;
