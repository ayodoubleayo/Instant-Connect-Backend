-- Add beneficiaryId column
ALTER TABLE "public"."Payment"
ADD COLUMN IF NOT EXISTS "beneficiaryId" TEXT;

-- Add benefitScope column
ALTER TABLE "public"."Payment"
ADD COLUMN IF NOT EXISTS "benefitScope" TEXT NOT NULL DEFAULT 'BOTH';

-- Foreign key to User
ALTER TABLE "public"."Payment"
ADD CONSTRAINT "Payment_beneficiaryId_fkey"
FOREIGN KEY ("beneficiaryId")
REFERENCES "public"."User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "Payment_beneficiaryId_idx"
ON "public"."Payment"("beneficiaryId");
