-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "isFreeCall" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "freeCallUsed" BOOLEAN NOT NULL DEFAULT false;
