-- ============================================================
-- Migration: 20260225194500_add_tribe_posts
-- Adds persistent tribe feed posts + idempotent likes
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."tribe_posts" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "author_id"   UUID         NOT NULL,
    "content"     TEXT         NOT NULL,
    "type"        TEXT         NOT NULL DEFAULT 'insight',
    "likes_count" INTEGER      NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "tribe_posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tribe_posts_author_id_fkey"
        FOREIGN KEY ("author_id")
        REFERENCES "public"."profiles"("id")
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "tribe_posts_author_id_idx" ON "public"."tribe_posts" ("author_id");
CREATE INDEX IF NOT EXISTS "tribe_posts_created_at_idx" ON "public"."tribe_posts" ("created_at");

CREATE TABLE IF NOT EXISTS "public"."tribe_post_likes" (
    "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
    "post_id"    UUID         NOT NULL,
    "user_id"    UUID         NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "tribe_post_likes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tribe_post_likes_post_id_user_id_key" UNIQUE ("post_id", "user_id"),
    CONSTRAINT "tribe_post_likes_post_id_fkey"
        FOREIGN KEY ("post_id")
        REFERENCES "public"."tribe_posts"("id")
        ON DELETE CASCADE,
    CONSTRAINT "tribe_post_likes_user_id_fkey"
        FOREIGN KEY ("user_id")
        REFERENCES "public"."profiles"("id")
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "tribe_post_likes_user_id_idx" ON "public"."tribe_post_likes" ("user_id");
CREATE INDEX IF NOT EXISTS "tribe_post_likes_post_id_idx" ON "public"."tribe_post_likes" ("post_id");

-- Auto-update updated_at trigger helper (reuse if already present)
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

DROP TRIGGER IF EXISTS "tribe_posts_updated_at" ON "public"."tribe_posts";
CREATE TRIGGER "tribe_posts_updated_at"
    BEFORE UPDATE ON "public"."tribe_posts"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
