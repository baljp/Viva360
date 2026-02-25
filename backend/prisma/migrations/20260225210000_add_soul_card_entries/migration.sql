-- Migration: add_soul_card_entries
-- Persists the SoulCard Grimoire collection per user

CREATE TABLE IF NOT EXISTS "public"."soul_card_entries" (
    "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
    "profile_id"   UUID        NOT NULL,
    "card_id"      TEXT        NOT NULL,
    "archetype"    TEXT        NOT NULL,
    "element"      TEXT        NOT NULL,
    "rarity"       TEXT        NOT NULL,
    "message"      TEXT        NOT NULL,
    "visual_theme" TEXT        NOT NULL,
    "xp_reward"    INTEGER     NOT NULL DEFAULT 0,
    "drawn_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "soul_card_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "soul_card_entries_profile_id_card_id_key" UNIQUE ("profile_id", "card_id"),
    CONSTRAINT "soul_card_entries_profile_id_fkey"
        FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "soul_card_entries_profile_id_idx" ON "public"."soul_card_entries"("profile_id");
