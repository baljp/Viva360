ALTER TABLE IF EXISTS "public"."tribe_invites"
ADD COLUMN IF NOT EXISTS "invite_type" TEXT DEFAULT 'TEAM',
ADD COLUMN IF NOT EXISTS "target_role" TEXT,
ADD COLUMN IF NOT EXISTS "context_ref" TEXT,
ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "responded_at" TIMESTAMPTZ(6);

UPDATE "public"."tribe_invites"
SET "invite_type" = 'TEAM'
WHERE "invite_type" IS NULL;

ALTER TABLE IF EXISTS "public"."tribe_invites"
ALTER COLUMN "invite_type" SET NOT NULL;

ALTER TABLE IF EXISTS "public"."swap_offers"
ADD COLUMN IF NOT EXISTS "counter_offer" TEXT,
ADD COLUMN IF NOT EXISTS "accepted_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS "public"."marketplace_orders"
ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "fulfillment_status" TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS "public"."vacancies"
ADD COLUMN IF NOT EXISTS "interview_required" BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS "public"."recruitment_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vacancy_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "notes" TEXT,
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recruitment_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recruitment_applications_vacancy_candidate_key"
ON "public"."recruitment_applications"("vacancy_id", "candidate_id");

CREATE INDEX IF NOT EXISTS "recruitment_applications_space_status_idx"
ON "public"."recruitment_applications"("space_id", "status");

CREATE TABLE IF NOT EXISTS "public"."interviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_RESPONSE',
    "response_note" TEXT,
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "interviews_guardian_status_idx"
ON "public"."interviews"("guardian_id", "status");

CREATE INDEX IF NOT EXISTS "interviews_space_status_idx"
ON "public"."interviews"("space_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "interviews_application_id_key"
ON "public"."interviews"("application_id");

CREATE TABLE IF NOT EXISTS "public"."interaction_receipts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "next_step" TEXT,
    "request_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interaction_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "interaction_receipts_entity_action_actor_key"
ON "public"."interaction_receipts"("entity_type", "entity_id", "action", "actor_id");

CREATE INDEX IF NOT EXISTS "interaction_receipts_actor_created_idx"
ON "public"."interaction_receipts"("actor_id", "created_at");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recruitment_applications')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vacancies')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_applications_vacancy_id_fkey') THEN
    ALTER TABLE "public"."recruitment_applications"
      ADD CONSTRAINT "recruitment_applications_vacancy_id_fkey"
      FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recruitment_applications')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_applications_candidate_id_fkey') THEN
    ALTER TABLE "public"."recruitment_applications"
      ADD CONSTRAINT "recruitment_applications_candidate_id_fkey"
      FOREIGN KEY ("candidate_id") REFERENCES "public"."profiles"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recruitment_applications')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_applications_space_id_fkey') THEN
    ALTER TABLE "public"."recruitment_applications"
      ADD CONSTRAINT "recruitment_applications_space_id_fkey"
      FOREIGN KEY ("space_id") REFERENCES "public"."profiles"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interviews')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recruitment_applications')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interviews_application_id_fkey') THEN
    ALTER TABLE "public"."interviews"
      ADD CONSTRAINT "interviews_application_id_fkey"
      FOREIGN KEY ("application_id") REFERENCES "public"."recruitment_applications"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interviews')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interviews_space_id_fkey') THEN
    ALTER TABLE "public"."interviews"
      ADD CONSTRAINT "interviews_space_id_fkey"
      FOREIGN KEY ("space_id") REFERENCES "public"."profiles"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interviews')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interviews_guardian_id_fkey') THEN
    ALTER TABLE "public"."interviews"
      ADD CONSTRAINT "interviews_guardian_id_fkey"
      FOREIGN KEY ("guardian_id") REFERENCES "public"."profiles"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interaction_receipts')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interaction_receipts_actor_id_fkey') THEN
    ALTER TABLE "public"."interaction_receipts"
      ADD CONSTRAINT "interaction_receipts_actor_id_fkey"
      FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
