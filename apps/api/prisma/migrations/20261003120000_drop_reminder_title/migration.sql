-- Remove the free-text title column. Reminder titles are no longer stored;
-- the web app derives a short label from the message instead.
ALTER TABLE "reminders" DROP COLUMN "title";