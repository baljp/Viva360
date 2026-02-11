-- Enable UUID extension if needed (Supabase has it enabled usually)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID NOT NULL DEFAULT uuid_generate_v4 (),
    author_id UUID NOT NULL,
    target_id TEXT NOT NULL,
    rating DECIMAL NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ (6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_pkey PRIMARY KEY ("id"),
    CONSTRAINT reviews_author_id_fkey FOREIGN KEY ("author_id") REFERENCES public.profiles ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "reviews_target_id_idx" ON public.reviews ("target_id");

-- Rooms Table (Drop if exists to ensure schema match or handle existence)
-- Since verify failed with "does not exist", assuming clean slate or renamed.
-- If exists, IF NOT EXISTS handles it but won't update columns.
-- I'll use ALTER to add columns just in case table exists.

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID NOT NULL DEFAULT uuid_generate_v4 (),
    hub_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'generic',
    capacity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'available',
    current_occupant TEXT,
    created_at TIMESTAMPTZ (6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rooms_pkey PRIMARY KEY ("id"),
    CONSTRAINT rooms_hub_id_fkey FOREIGN KEY ("hub_id") REFERENCES public.profiles ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Ensure columns exist if table existed
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'generic';

ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1;