-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RelationshipIntent" ADD VALUE 'FRIENDS_WITH_BENEFITS';
ALTER TYPE "RelationshipIntent" ADD VALUE 'LOOKING_FOR_WOMAN';
ALTER TYPE "RelationshipIntent" ADD VALUE 'LOOKING_FOR_MAN';
ALTER TYPE "RelationshipIntent" ADD VALUE 'WALK_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'GYM_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'READING_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'TRAVEL_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'CLUBBING_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'STREET_FRIEND';
ALTER TYPE "RelationshipIntent" ADD VALUE 'GIST_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'LAUGHTER_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'CRYING_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'PRAYING_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'ADULT_STUDENT_PARTNER';
ALTER TYPE "RelationshipIntent" ADD VALUE 'EMOTIONAL_SUPPORT';
ALTER TYPE "RelationshipIntent" ADD VALUE 'OTHER_PARTNER';

-- DropIndex
DROP INDEX "Message_clientId_key";

-- CreateIndex
CREATE INDEX "Message_clientId_idx" ON "Message"("clientId");
