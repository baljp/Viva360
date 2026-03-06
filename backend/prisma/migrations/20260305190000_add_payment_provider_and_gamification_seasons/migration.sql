ALTER TABLE "public"."transactions"
  ADD COLUMN IF NOT EXISTS "provider" TEXT DEFAULT 'internal_wallet',
  ADD COLUMN IF NOT EXISTS "provider_ref" TEXT,
  ADD COLUMN IF NOT EXISTS "provider_status" TEXT DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS "context_type" TEXT,
  ADD COLUMN IF NOT EXISTS "context_ref" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

UPDATE "public"."transactions"
SET "provider" = COALESCE("provider", 'internal_wallet'),
    "provider_status" = COALESCE("provider_status", CASE WHEN COALESCE("status", 'completed') = 'completed' THEN 'completed' ELSE 'pending' END)
WHERE "provider" IS NULL OR "provider_status" IS NULL;

CREATE INDEX IF NOT EXISTS "transactions_provider_provider_ref_idx"
  ON "public"."transactions" ("provider", "provider_ref");

CREATE TABLE IF NOT EXISTS "public"."gamification_seasons" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "prize_title" TEXT,
  "prize_summary" TEXT,
  "prize_payload" JSONB,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "closed_at" TIMESTAMPTZ,
  "final_results" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "gamification_seasons_status_starts_at_ends_at_idx"
  ON "public"."gamification_seasons" ("status", "starts_at", "ends_at");

INSERT INTO "public"."gamification_seasons" (
  "slug",
  "title",
  "subtitle",
  "starts_at",
  "ends_at",
  "prize_title",
  "prize_summary",
  "prize_payload",
  "status"
)
SELECT
  'season-' || to_char(date_trunc('month', NOW()), 'YYYY-MM'),
  'Temporada Radiante ' || to_char(date_trunc('month', NOW()), 'TMMon YYYY'),
  'Karma acumulado em missões, oráculo, tribo e metamorfose',
  date_trunc('month', NOW()),
  (date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'),
  'Premiação Aurora',
  'Top 3 recebem destaque no perfil e recompensa sazonal automática.',
  jsonb_build_object(
    'rewards',
    jsonb_build_array(
      jsonb_build_object('position', 1, 'label', 'Aurora Mestre', 'karmaBonus', 250, 'badge', 'aurora-mestre'),
      jsonb_build_object('position', 2, 'label', 'Aurora Guardiã', 'karmaBonus', 150, 'badge', 'aurora-guardia'),
      jsonb_build_object('position', 3, 'label', 'Aurora Raiz', 'karmaBonus', 75, 'badge', 'aurora-raiz')
    )
  ),
  'ACTIVE'
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."gamification_seasons"
  WHERE "slug" = 'season-' || to_char(date_trunc('month', NOW()), 'YYYY-MM')
);
