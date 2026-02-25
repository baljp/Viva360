-- Add muted_until to chat_participants for per-room notification control

ALTER TABLE "public"."chat_participants"
  ADD COLUMN IF NOT EXISTS "muted_until" TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "left_at"     TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS "chat_participants_profile_id_idx"
  ON "public"."chat_participants"("profile_id");
