-- Invite/allowlist gate for controlled registration/login
CREATE TABLE IF NOT EXISTS "public"."auth_allowlist" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL DEFAULT 'APPROVED',
  "invited_by" UUID,
  "used_by" UUID,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "used_at" TIMESTAMPTZ(6),
  CONSTRAINT "auth_allowlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_allowlist_email_key" ON "public"."auth_allowlist"("email");
CREATE INDEX IF NOT EXISTS "auth_allowlist_status_idx" ON "public"."auth_allowlist"("status");

