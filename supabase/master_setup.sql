-- ==========================================
-- VIVA360 SUPABASE MASTER SETUP SCRIPT
-- ==========================================

-- 0. Base Table Definitions (Public Schema)
-- ----------------------------------------------------

-- Profiles (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    role TEXT,
    avatar TEXT,
    bio TEXT,
    karma INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    multiplier DECIMAL DEFAULT 1.0,
    personal_balance DECIMAL DEFAULT 0.0,
    corporate_balance DECIMAL DEFAULT 0.0,
    plant_xp INTEGER DEFAULT 0,
    plant_stage TEXT DEFAULT 'seed',
    location TEXT,
    specialty TEXT[],
    hub_id UUID,
    rating DECIMAL DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    client_id UUID REFERENCES public.profiles (id),
    professional_id UUID REFERENCES public.profiles (id),
    service_name TEXT NOT NULL,
    professional_name TEXT,
    client_name TEXT,
    date TIMESTAMPTZ NOT NULL,
    time TEXT NOT NULL,
    price DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID REFERENCES public.profiles (id) NOT NULL,
    type TEXT,
    amount DECIMAL NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'completed',
    date TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    sender_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    type TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 1. Realtime Configuration
-- ----------------------------------------------------
-- Enable Realtime for key tables
-- We use a DO block to safely add tables to the publication
DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- Add tables (if they are not already in it)
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 2. Row Level Security (RLS)
-- ----------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- ----------------------------------------------------

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE TO authenticated USING (auth.uid () = id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;

CREATE POLICY "Users can see their own notifications" ON public.notifications FOR
SELECT TO authenticated USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR
UPDATE TO authenticated USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Users can see their own messages" ON public.chat_messages;

CREATE POLICY "Users can see their own messages" ON public.chat_messages FOR
SELECT TO authenticated USING (
        auth.uid () = sender_id
        OR auth.uid () = receiver_id
    );

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;

CREATE POLICY "Users can send messages" ON public.chat_messages FOR
INSERT
    TO authenticated
WITH
    CHECK (auth.uid () = sender_id);

-- 4. Automated Notification Components (Triggers & Functions)
-- ----------------------------------------------------

-- Function: Handle New Message -> Notify Receiver
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, read)
    VALUES (
        NEW.receiver_id,
        'chat',
        'Nova Mensagem',
        'Você recebeu uma nova mensagem.',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On New Chat Message
DROP TRIGGER IF EXISTS on_chat_message ON public.chat_messages;

CREATE TRIGGER on_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- Function: Handle New Appointment -> Notify Professional
CREATE OR REPLACE FUNCTION handle_new_appointment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, read)
    VALUES (
        NEW.professional_id,
        'appointment',
        'Novo Agendamento',
        'Um novo agendamento foi solicitado.',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On New Appointment
DROP TRIGGER IF EXISTS on_new_appointment ON public.appointments;

CREATE TRIGGER on_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION handle_new_appointment();

-- Function: Handle Appointment Status Update -> Notify Client
CREATE OR REPLACE FUNCTION handle_appointment_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO public.notifications (user_id, type, title, message, read)
        VALUES (
            NEW.client_id,
            'appointment_update',
            'Status do Agendamento',
            'Seu agendamento foi atualizado para: ' || NEW.status,
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Appointment Update
DROP TRIGGER IF EXISTS on_appointment_update ON public.appointments;

CREATE TRIGGER on_appointment_update
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION handle_appointment_update();

-- Function: Handle New Transaction -> Notify Receiver
CREATE OR REPLACE FUNCTION handle_new_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, read)
    VALUES (
        NEW.user_id,
        'finance',
        'Nova Transação',
        'Uma nova transação foi registrada em sua conta.',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On New Transaction
DROP TRIGGER IF EXISTS on_new_transaction ON public.transactions;

CREATE TRIGGER on_new_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION handle_new_transaction();

-- ==========================================
-- SETUP COMPLETE
-- ==========================================