-- ============================================================
-- Migration: 20260220000000_add_routines_table
-- Fixes: Routine/rituals data lost on every Vercel cold start
--        because controller was using in-memory Map.
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."routines" (
    "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
    "user_id"    UUID         NOT NULL,
    "type"       TEXT         NOT NULL,
    "steps"      JSONB        NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "routines_pkey"              PRIMARY KEY ("id"),
    CONSTRAINT "routines_user_id_type_key"  UNIQUE ("user_id", "type"),
    CONSTRAINT "routines_user_id_fkey"
        FOREIGN KEY ("user_id")
        REFERENCES "public"."profiles"("id")
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "routines_user_id_idx" ON "public"."routines" ("user_id");

-- Auto-update updated_at via shared trigger (reuse existing function if present)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
    ) THEN
        CREATE FUNCTION set_updated_at()
        RETURNS trigger LANGUAGE plpgsql AS '
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        ';
    END IF;
END $$;

DROP TRIGGER IF EXISTS "routines_updated_at" ON "public"."routines";
CREATE TRIGGER "routines_updated_at"
    BEFORE UPDATE ON "public"."routines"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
