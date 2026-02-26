-- CreateTable: push_subscriptions
-- Stores Web Push API subscriptions per user device
CREATE TABLE "public"."push_subscriptions" (
    "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"      UUID NOT NULL,
    "endpoint"     TEXT NOT NULL,
    "p256dh"       TEXT NOT NULL,
    "auth"         TEXT NOT NULL,
    "user_agent"   TEXT,
    "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint"),
    CONSTRAINT "push_subscriptions_user_id_fkey"
        FOREIGN KEY ("user_id")
        REFERENCES "public"."profiles"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "push_subscriptions_user_id_idx" ON "public"."push_subscriptions"("user_id");

-- Enable RLS
ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users only see/manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON "public"."push_subscriptions"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS (for backend to send to any user)
CREATE POLICY "Service role full access"
  ON "public"."push_subscriptions"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
