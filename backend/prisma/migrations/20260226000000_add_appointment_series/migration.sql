-- ============================================================
-- Migration: 20260226000000_add_appointment_series
-- Adds AppointmentSeries table + series fields to appointments
-- Backward compatible: all new columns are nullable/defaulted
-- ============================================================

-- 1. Create appointment_series table
CREATE TABLE IF NOT EXISTS "public"."appointment_series" (
    "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
    "guardian_id"      UUID         NOT NULL,
    "client_id"        UUID         NOT NULL,
    "space_id"         UUID,
    "start_at"         TIMESTAMPTZ  NOT NULL,
    "duration_min"     INTEGER      NOT NULL DEFAULT 60,
    "timezone"         TEXT         NOT NULL DEFAULT 'America/Fortaleza',
    "freq"             TEXT         NOT NULL,
    "by_day"           TEXT[]       NOT NULL DEFAULT '{}',
    "count"            INTEGER,
    "until"            TIMESTAMPTZ,
    "status"           TEXT         NOT NULL DEFAULT 'active',
    "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "appointment_series_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_series_guardian_id_fkey"
        FOREIGN KEY ("guardian_id")
        REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "appointment_series_client_id_fkey"
        FOREIGN KEY ("client_id")
        REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "appointment_series_guardian_id_idx"
    ON "public"."appointment_series" ("guardian_id");
CREATE INDEX IF NOT EXISTS "appointment_series_client_id_idx"
    ON "public"."appointment_series" ("client_id");

-- 2. Add series fields to appointments (nullable, no existing data affected)
ALTER TABLE "public"."appointments"
    ADD COLUMN IF NOT EXISTS "series_id"         UUID        REFERENCES "public"."appointment_series"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "occurrence_index"  INTEGER,
    ADD COLUMN IF NOT EXISTS "is_exception"      BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "original_start_at" TIMESTAMPTZ;

-- 3. Unique constraint on (series_id, occurrence_index) — idempotência
-- Only applies when series_id IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_series_occurrence_uniq"
    ON "public"."appointments" ("series_id", "occurrence_index")
    WHERE "series_id" IS NOT NULL AND "occurrence_index" IS NOT NULL;

-- 4. Index on series_id for fast lookup
CREATE INDEX IF NOT EXISTS "appointments_series_id_idx"
    ON "public"."appointments" ("series_id")
    WHERE "series_id" IS NOT NULL;

-- 5. updated_at trigger for appointment_series
CREATE OR REPLACE FUNCTION "public"."set_updated_at"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "appointment_series_updated_at" ON "public"."appointment_series";
CREATE TRIGGER "appointment_series_updated_at"
    BEFORE UPDATE ON "public"."appointment_series"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
