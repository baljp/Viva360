ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "active_role" TEXT;

CREATE TABLE IF NOT EXISTS "public"."profile_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "profile_roles_profile_id_role_key"
ON "public"."profile_roles"("profile_id", "role");

CREATE INDEX IF NOT EXISTS "profile_roles_profile_id_idx"
ON "public"."profile_roles"("profile_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profile_roles_profile_id_fkey'
  ) THEN
    ALTER TABLE "public"."profile_roles"
      ADD CONSTRAINT "profile_roles_profile_id_fkey"
      FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "public"."profile_roles" ("profile_id", "role")
SELECT p."id", UPPER(TRIM(p."role"))
FROM "public"."profiles" p
WHERE p."role" IS NOT NULL
  AND TRIM(p."role") <> ''
ON CONFLICT ("profile_id", "role") DO NOTHING;

UPDATE "public"."profiles" p
SET "active_role" = COALESCE(
  NULLIF(UPPER(TRIM(p."active_role")), ''),
  (
    SELECT pr."role"
    FROM "public"."profile_roles" pr
    WHERE pr."profile_id" = p."id"
    ORDER BY pr."created_at" ASC
    LIMIT 1
  )
)
WHERE p."active_role" IS NULL
   OR TRIM(p."active_role") = '';
