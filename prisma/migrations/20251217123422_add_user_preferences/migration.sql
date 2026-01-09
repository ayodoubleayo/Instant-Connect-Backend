-- CreateEnum
CREATE TYPE "RelationshipIntent" AS ENUM ('ONE_NIGHT', 'CASUAL', 'SERIOUS', 'MARRIAGE');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('CHRISTIAN', 'MUSLIM', 'TRADITIONAL', 'OTHER', 'NONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "preferredTribes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "profilePhoto" TEXT,
ADD COLUMN     "relationshipIntent" "RelationshipIntent",
ADD COLUMN     "religion" "Religion";
