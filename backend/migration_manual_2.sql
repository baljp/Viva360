-- Add profileId column to satisfy lingering Prisma Client expectation
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS "profileId" UUID;