-- ==========================================
-- VIVA360 SUPABASE RLS HARDENING (SENSITIVE TABLES)
-- Date: 2026-02-24
-- Purpose: Enable and enforce RLS on sensitive tables that may contain
-- clinical, financial, contractual, hiring or link/relationship data.
--
-- Notes:
-- - Idempotent for existing tables (DROP POLICY IF EXISTS + CREATE POLICY).
-- - Service-role backend access remains functional (service role bypasses RLS).
-- - Public-facing tables intentionally omitted (e.g., oracle_messages, products, vacancies)
--   unless they are sensitive by payload or relationship semantics.
-- ==========================================

begin;

-- 1) Enable RLS on sensitive tables (if present)
ALTER TABLE IF EXISTS public.auth_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tribe_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.swap_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.escambo_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recruitment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.space_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interaction_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.oracle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.metamorphosis_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guardian_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- 2) Patch existing sensitive tables already in master_setup to guarantee CRUD policies

-- APPOINTMENTS (client/professional only)
DROP POLICY IF EXISTS "Appointments: participants can read" ON public.appointments;
CREATE POLICY "Appointments: participants can read" ON public.appointments
FOR SELECT TO authenticated
USING (auth.uid() = client_id OR auth.uid() = professional_id);

DROP POLICY IF EXISTS "Appointments: participants can create" ON public.appointments;
CREATE POLICY "Appointments: participants can create" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = client_id OR auth.uid() = professional_id);

DROP POLICY IF EXISTS "Appointments: participants can update" ON public.appointments;
CREATE POLICY "Appointments: participants can update" ON public.appointments
FOR UPDATE TO authenticated
USING (auth.uid() = client_id OR auth.uid() = professional_id)
WITH CHECK (auth.uid() = client_id OR auth.uid() = professional_id);

-- TRANSACTIONS (owner only)
DROP POLICY IF EXISTS "Transactions: owner can read" ON public.transactions;
CREATE POLICY "Transactions: owner can read" ON public.transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Transactions: owner can insert" ON public.transactions;
CREATE POLICY "Transactions: owner can insert" ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Transactions: owner can update" ON public.transactions;
CREATE POLICY "Transactions: owner can update" ON public.transactions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CHAT MESSAGES: existing select/insert may exist; add/normalize update policy for read receipts
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages: participants can update" ON public.chat_messages;
CREATE POLICY "Chat messages: participants can update" ON public.chat_messages
FOR UPDATE TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 3) Clinical + relationship sensitive tables

-- RECORDS (patient/professional only; writes typically by backend/service role)
DROP POLICY IF EXISTS "Records: participants can read" ON public.records;
CREATE POLICY "Records: participants can read" ON public.records
FOR SELECT TO authenticated
USING (auth.uid() = patient_id OR auth.uid() = professional_id);

DROP POLICY IF EXISTS "Records: participants can insert" ON public.records;
CREATE POLICY "Records: participants can insert" ON public.records
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = patient_id OR auth.uid() = professional_id);

DROP POLICY IF EXISTS "Records: participants can update" ON public.records;
CREATE POLICY "Records: participants can update" ON public.records
FOR UPDATE TO authenticated
USING (auth.uid() = patient_id OR auth.uid() = professional_id)
WITH CHECK (auth.uid() = patient_id OR auth.uid() = professional_id);

-- PROFILE LINKS (source/target only)
DROP POLICY IF EXISTS "Profile links: participants can read" ON public.profile_links;
CREATE POLICY "Profile links: participants can read" ON public.profile_links
FOR SELECT TO authenticated
USING (auth.uid() = source_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "Profile links: participants can insert" ON public.profile_links;
CREATE POLICY "Profile links: participants can insert" ON public.profile_links
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = source_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "Profile links: participants can update" ON public.profile_links;
CREATE POLICY "Profile links: participants can update" ON public.profile_links
FOR UPDATE TO authenticated
USING (auth.uid() = source_id OR auth.uid() = target_id)
WITH CHECK (auth.uid() = source_id OR auth.uid() = target_id);

-- CONTRACTS (guardian/space only)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contracts'
    ) THEN
        DROP POLICY IF EXISTS "Contracts: participants can read" ON public.contracts;
        CREATE POLICY "Contracts: participants can read" ON public.contracts
        FOR SELECT TO authenticated
        USING (auth.uid() = space_id OR auth.uid() = guardian_id);

        DROP POLICY IF EXISTS "Contracts: participants can insert" ON public.contracts;
        CREATE POLICY "Contracts: participants can insert" ON public.contracts
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = space_id OR auth.uid() = guardian_id);

        DROP POLICY IF EXISTS "Contracts: participants can update" ON public.contracts;
        CREATE POLICY "Contracts: participants can update" ON public.contracts
        FOR UPDATE TO authenticated
        USING (auth.uid() = space_id OR auth.uid() = guardian_id)
        WITH CHECK (auth.uid() = space_id OR auth.uid() = guardian_id);
    END IF;
END $$;

-- SPACE INVITES (space owner only)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'space_invites'
    ) THEN
        DROP POLICY IF EXISTS "Space invites: owner can read" ON public.space_invites;
        CREATE POLICY "Space invites: owner can read" ON public.space_invites
        FOR SELECT TO authenticated
        USING (auth.uid() = space_id);

        DROP POLICY IF EXISTS "Space invites: owner can insert" ON public.space_invites;
        CREATE POLICY "Space invites: owner can insert" ON public.space_invites
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = space_id);

        DROP POLICY IF EXISTS "Space invites: owner can update" ON public.space_invites;
        CREATE POLICY "Space invites: owner can update" ON public.space_invites
        FOR UPDATE TO authenticated
        USING (auth.uid() = space_id)
        WITH CHECK (auth.uid() = space_id);
    END IF;
END $$;

-- TRIBE INVITES (hub owner only)
DROP POLICY IF EXISTS "Tribe invites: hub can read" ON public.tribe_invites;
CREATE POLICY "Tribe invites: hub can read" ON public.tribe_invites
FOR SELECT TO authenticated
USING (auth.uid() = hub_id);

DROP POLICY IF EXISTS "Tribe invites: hub can insert" ON public.tribe_invites;
CREATE POLICY "Tribe invites: hub can insert" ON public.tribe_invites
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = hub_id);

DROP POLICY IF EXISTS "Tribe invites: hub can update" ON public.tribe_invites;
CREATE POLICY "Tribe invites: hub can update" ON public.tribe_invites
FOR UPDATE TO authenticated
USING (auth.uid() = hub_id)
WITH CHECK (auth.uid() = hub_id);

-- 4) Commerce / hiring sensitive tables

-- SWAP OFFERS (provider/requester only)
DROP POLICY IF EXISTS "Swap offers: participants can read" ON public.swap_offers;
CREATE POLICY "Swap offers: participants can read" ON public.swap_offers
FOR SELECT TO authenticated
USING (auth.uid() = provider_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Swap offers: participants can insert" ON public.swap_offers;
CREATE POLICY "Swap offers: participants can insert" ON public.swap_offers
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = provider_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Swap offers: participants can update" ON public.swap_offers;
CREATE POLICY "Swap offers: participants can update" ON public.swap_offers
FOR UPDATE TO authenticated
USING (auth.uid() = provider_id OR auth.uid() = requester_id)
WITH CHECK (auth.uid() = provider_id OR auth.uid() = requester_id);

-- ESCAMBO PROPOSALS (proposer/receiver only)
DROP POLICY IF EXISTS "Escambo proposals: participants can read" ON public.escambo_proposals;
CREATE POLICY "Escambo proposals: participants can read" ON public.escambo_proposals
FOR SELECT TO authenticated
USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Escambo proposals: proposer can insert" ON public.escambo_proposals;
CREATE POLICY "Escambo proposals: proposer can insert" ON public.escambo_proposals
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = proposer_id);

DROP POLICY IF EXISTS "Escambo proposals: participants can update" ON public.escambo_proposals;
CREATE POLICY "Escambo proposals: participants can update" ON public.escambo_proposals
FOR UPDATE TO authenticated
USING (auth.uid() = proposer_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = proposer_id OR auth.uid() = receiver_id);

-- MARKETPLACE ORDERS (buyer/seller only)
DROP POLICY IF EXISTS "Marketplace orders: participants can read" ON public.marketplace_orders;
CREATE POLICY "Marketplace orders: participants can read" ON public.marketplace_orders
FOR SELECT TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Marketplace orders: buyer can insert" ON public.marketplace_orders;
CREATE POLICY "Marketplace orders: buyer can insert" ON public.marketplace_orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Marketplace orders: participants can update" ON public.marketplace_orders;
CREATE POLICY "Marketplace orders: participants can update" ON public.marketplace_orders
FOR UPDATE TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RECRUITMENT APPLICATIONS (candidate/space only)
DROP POLICY IF EXISTS "Recruitment applications: participants can read" ON public.recruitment_applications;
CREATE POLICY "Recruitment applications: participants can read" ON public.recruitment_applications
FOR SELECT TO authenticated
USING (auth.uid() = candidate_id OR auth.uid() = space_id);

DROP POLICY IF EXISTS "Recruitment applications: candidate can insert" ON public.recruitment_applications;
CREATE POLICY "Recruitment applications: candidate can insert" ON public.recruitment_applications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Recruitment applications: participants can update" ON public.recruitment_applications;
CREATE POLICY "Recruitment applications: participants can update" ON public.recruitment_applications
FOR UPDATE TO authenticated
USING (auth.uid() = candidate_id OR auth.uid() = space_id)
WITH CHECK (auth.uid() = candidate_id OR auth.uid() = space_id);

-- INTERVIEWS (candidate via application, plus guardian/space)
DROP POLICY IF EXISTS "Interviews: participants can read" ON public.interviews;
CREATE POLICY "Interviews: participants can read" ON public.interviews
FOR SELECT TO authenticated
USING (
    auth.uid() = guardian_id
    OR auth.uid() = space_id
    OR EXISTS (
        SELECT 1
        FROM public.recruitment_applications ra
        WHERE ra.id = interviews.application_id
          AND ra.candidate_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Interviews: space or guardian can insert" ON public.interviews;
CREATE POLICY "Interviews: space or guardian can insert" ON public.interviews
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = guardian_id OR auth.uid() = space_id);

DROP POLICY IF EXISTS "Interviews: participants can update" ON public.interviews;
CREATE POLICY "Interviews: participants can update" ON public.interviews
FOR UPDATE TO authenticated
USING (
    auth.uid() = guardian_id
    OR auth.uid() = space_id
    OR EXISTS (
        SELECT 1
        FROM public.recruitment_applications ra
        WHERE ra.id = interviews.application_id
          AND ra.candidate_id = auth.uid()
    )
)
WITH CHECK (
    auth.uid() = guardian_id
    OR auth.uid() = space_id
    OR EXISTS (
        SELECT 1
        FROM public.recruitment_applications ra
        WHERE ra.id = interviews.application_id
          AND ra.candidate_id = auth.uid()
    )
);

-- 5) Personal history / telemetry / eventing

-- CALENDAR EVENTS (owner only)
DROP POLICY IF EXISTS "Calendar events: owner can read" ON public.calendar_events;
CREATE POLICY "Calendar events: owner can read" ON public.calendar_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Calendar events: owner can insert" ON public.calendar_events;
CREATE POLICY "Calendar events: owner can insert" ON public.calendar_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Calendar events: owner can update" ON public.calendar_events;
CREATE POLICY "Calendar events: owner can update" ON public.calendar_events
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Calendar events: owner can delete" ON public.calendar_events;
CREATE POLICY "Calendar events: owner can delete" ON public.calendar_events
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ROUTINES (owner only)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'routines'
    ) THEN
        DROP POLICY IF EXISTS "Routines: owner can read" ON public.routines;
        CREATE POLICY "Routines: owner can read" ON public.routines
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Routines: owner can insert" ON public.routines;
        CREATE POLICY "Routines: owner can insert" ON public.routines
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Routines: owner can update" ON public.routines;
        CREATE POLICY "Routines: owner can update" ON public.routines
        FOR UPDATE TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Routines: owner can delete" ON public.routines;
        CREATE POLICY "Routines: owner can delete" ON public.routines
        FOR DELETE TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- METAMORPHOSIS PROJECTIONS (owner only)
DROP POLICY IF EXISTS "Metamorphosis projections: owner can read" ON public.metamorphosis_projections;
CREATE POLICY "Metamorphosis projections: owner can read" ON public.metamorphosis_projections
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Metamorphosis projections: owner can write" ON public.metamorphosis_projections;
CREATE POLICY "Metamorphosis projections: owner can write" ON public.metamorphosis_projections
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ORACLE HISTORY (owner only)
DROP POLICY IF EXISTS "Oracle history: owner can read" ON public.oracle_history;
CREATE POLICY "Oracle history: owner can read" ON public.oracle_history
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Oracle history: owner can insert" ON public.oracle_history;
CREATE POLICY "Oracle history: owner can insert" ON public.oracle_history
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- INTERACTION RECEIPTS (actor only)
DROP POLICY IF EXISTS "Interaction receipts: actor can read" ON public.interaction_receipts;
CREATE POLICY "Interaction receipts: actor can read" ON public.interaction_receipts
FOR SELECT TO authenticated
USING (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Interaction receipts: actor can insert" ON public.interaction_receipts;
CREATE POLICY "Interaction receipts: actor can insert" ON public.interaction_receipts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- AUDIT EVENTS (actor only, no public visibility)
DROP POLICY IF EXISTS "Audit events: actor can read" ON public.audit_events;
CREATE POLICY "Audit events: actor can read" ON public.audit_events
FOR SELECT TO authenticated
USING (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Audit events: actor can insert" ON public.audit_events;
CREATE POLICY "Audit events: actor can insert" ON public.audit_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- EVENTS / AUTH_ALLOWLIST are sensitive internal tables: RLS enabled, no authenticated policies by default.

-- 6) Presence + chat-room metadata

-- GUARDIAN PRESENCE (read authenticated, write self)
DROP POLICY IF EXISTS "Guardian presence: authenticated can read" ON public.guardian_presence;
CREATE POLICY "Guardian presence: authenticated can read" ON public.guardian_presence
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Guardian presence: self can write" ON public.guardian_presence;
CREATE POLICY "Guardian presence: self can write" ON public.guardian_presence
FOR ALL TO authenticated
USING (auth.uid() = guardian_id)
WITH CHECK (auth.uid() = guardian_id);

-- CHAT PARTICIPANTS (participant only)
DROP POLICY IF EXISTS "Chat participants: self can read" ON public.chat_participants;
CREATE POLICY "Chat participants: self can read" ON public.chat_participants
FOR SELECT TO authenticated
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Chat participants: self can update" ON public.chat_participants;
CREATE POLICY "Chat participants: self can update" ON public.chat_participants
FOR UPDATE TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- CHATS (visible only if user is a participant)
DROP POLICY IF EXISTS "Chats: participants can read" ON public.chats;
CREATE POLICY "Chats: participants can read" ON public.chats
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants cp
        WHERE cp.chat_id = chats.id
          AND cp.profile_id = auth.uid()
    )
);

commit;
