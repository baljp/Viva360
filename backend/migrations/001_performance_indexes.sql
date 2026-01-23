-- MIGRATION: 001_performance_tuning.sql
-- OBJECTIVE: Optimize query performance for 30k+ CCU
-- AUTHOR: Principal Database Architect

-- 1. Appointments: Heavy filtering by client/pro/date
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments (client_id);

CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON public.appointments (professional_id);

CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments (date, status);
-- Composite index for the most common dashboard query (My active appointments)
CREATE INDEX IF NOT EXISTS idx_appointments_composite_client ON public.appointments (client_id, date)
WHERE
    status = 'pending';

-- 2. Products: Filtering by owner and category
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON public.products (owner_id);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);

-- 3. Notifications: Real-time pulling of unread items
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read)
WHERE
    read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- 4. Transactions: History log
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date DESC);

-- 5. Profiles: Role based lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
-- Search capability (Trigram extension for fuzzy search if needed later, standard btree for exact)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- 6. RLS Optimization: Enable RLS to use indexes
-- Note: Make sure RLS policies use these indexed columns!

COMMENT ON INDEX idx_appointments_client_id IS 'Accelerates client dashboard loading';

COMMENT ON INDEX idx_notifications_user_read IS 'Critical for real-time notification badge performance';