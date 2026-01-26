-- CreateTable

CREATE TABLE "public"."events" (
    "id" UUID NOT NULL,
    "stream_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable

CREATE TABLE "public"."metamorphosis_projections" (
    "user_id" UUID NOT NULL,
    "total_checkins" INTEGER NOT NULL DEFAULT 0,
    "last_mood" TEXT,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "evolution_score" INTEGER NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metamorphosis_projections_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "events_stream_id_idx" ON "public"."events"("stream_id");