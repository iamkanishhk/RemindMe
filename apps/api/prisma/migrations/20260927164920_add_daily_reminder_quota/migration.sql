-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reminderDailyBucket" TEXT,
ADD COLUMN     "reminderDailyCount" INTEGER NOT NULL DEFAULT 0;
