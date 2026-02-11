-- CreateTable: contracts
CREATE TABLE "public"."contracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "space_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "space_name" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "monthly_fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenue_share" INTEGER NOT NULL DEFAULT 0,
    "rooms_allowed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hours_per_week" INTEGER NOT NULL DEFAULT 0,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "terms" TEXT,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: space_invites
CREATE TABLE "public"."space_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "space_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "usage" INTEGER NOT NULL DEFAULT 0,
    "max_usage" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_guardian_id_status_idx" ON "public"."contracts"("guardian_id", "status");
CREATE INDEX "contracts_space_id_status_idx" ON "public"."contracts"("space_id", "status");
CREATE UNIQUE INDEX "space_invites_code_key" ON "public"."space_invites"("code");
CREATE INDEX "space_invites_code_idx" ON "public"."space_invites"("code");
CREATE INDEX "space_invites_space_id_idx" ON "public"."space_invites"("space_id");

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."space_invites" ADD CONSTRAINT "space_invites_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
