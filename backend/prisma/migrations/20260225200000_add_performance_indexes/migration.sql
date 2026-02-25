-- ============================================================
-- Migration: 20260225200000_add_performance_indexes
-- Adds 12 composite indexes for high-frequency query patterns
-- Prevents full table scans on Transaction, Notification,
-- ChatMessage, Appointment, CalendarEvent, MarketplaceOrder,
-- and Record models as data volume grows.
-- ============================================================

-- Transaction: revenue queries and user financial history
CREATE INDEX IF NOT EXISTS "transactions_status_date_idx"
  ON "public"."transactions" ("status", "date");

CREATE INDEX IF NOT EXISTS "transactions_user_id_date_idx"
  ON "public"."transactions" ("user_id", "date");

-- Notification: unread count and user notification list
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_idx"
  ON "public"."notifications" ("user_id", "read");

CREATE INDEX IF NOT EXISTS "notifications_user_id_timestamp_idx"
  ON "public"."notifications" ("user_id", "timestamp");

-- ChatMessage: ordered message history per chat room
CREATE INDEX IF NOT EXISTS "chat_messages_chat_id_created_at_idx"
  ON "public"."chat_messages" ("chat_id", "created_at");

CREATE INDEX IF NOT EXISTS "chat_messages_sender_id_idx"
  ON "public"."chat_messages" ("sender_id");

-- Appointment: client and professional schedule queries
CREATE INDEX IF NOT EXISTS "appointments_client_id_status_idx"
  ON "public"."appointments" ("client_id", "status");

CREATE INDEX IF NOT EXISTS "appointments_professional_id_status_idx"
  ON "public"."appointments" ("professional_id", "status");

-- CalendarEvent: personal calendar lookup
CREATE INDEX IF NOT EXISTS "calendar_events_user_id_idx"
  ON "public"."calendar_events" ("user_id");

-- MarketplaceOrder: buyer purchase history and seller dashboard
CREATE INDEX IF NOT EXISTS "marketplace_orders_buyer_id_idx"
  ON "public"."marketplace_orders" ("buyer_id");

CREATE INDEX IF NOT EXISTS "marketplace_orders_seller_id_status_idx"
  ON "public"."marketplace_orders" ("seller_id", "status");

-- Record (clinical): patient records and professional records
CREATE INDEX IF NOT EXISTS "records_patient_id_idx"
  ON "public"."records" ("patient_id");

CREATE INDEX IF NOT EXISTS "records_professional_id_idx"
  ON "public"."records" ("professional_id");
