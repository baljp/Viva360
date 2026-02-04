-- VIVA360 v4.5 Schema Migration
-- Run this SQL in Supabase SQL Editor to apply schema changes

-- 1. Profile Links (Vínculos entre perfis)
CREATE TABLE IF NOT EXISTS public.profile_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'tribo' | 'paciente' | 'escambo' | 'equipe' | 'bazar'
  status TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'active'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(source_id, target_id, type)
);

-- 2. Chats (Context-aware chat rooms)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL, -- 'private' | 'escambo' | 'agendamento' | 'bazar'
  context_id UUID, -- Reference to escambo/appointment/order
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Chat Participants
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unread_count INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(chat_id, profile_id)
);

-- 4. Add chat_id to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES public.chats (id);

-- 5. Marketplace Orders
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT DEFAULT 1,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'paid' | 'shipped' | 'completed'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Escambo Proposals
CREATE TABLE IF NOT EXISTS public.escambo_proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposer_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  offer TEXT NOT NULL,
  request TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'completed'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Audit Events (Event Sourcing)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'link.created' | 'chat.sent' etc.
  entity_type TEXT NOT NULL, -- 'profile_link' | 'chat' | 'appointment'
  entity_id UUID NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON public.audit_events (actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON public.audit_events (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_profile_links_source ON public.profile_links (source_id);

CREATE INDEX IF NOT EXISTS idx_profile_links_target ON public.profile_links (target_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_profile ON public.chat_participants (profile_id);

-- Enable RLS on new tables
ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.escambo_proposals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (permissive for now - production should be stricter)
CREATE POLICY "Public read profile_links" ON public.profile_links FOR
SELECT USING (true);

CREATE POLICY "Public read chats" ON public.chats FOR
SELECT USING (true);

CREATE POLICY "Public read chat_participants" ON public.chat_participants FOR
SELECT USING (true);

CREATE POLICY "Public read marketplace_orders" ON public.marketplace_orders FOR
SELECT USING (true);

CREATE POLICY "Public read escambo_proposals" ON public.escambo_proposals FOR
SELECT USING (true);

CREATE POLICY "Public read audit_events" ON public.audit_events FOR
SELECT USING (true);

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;