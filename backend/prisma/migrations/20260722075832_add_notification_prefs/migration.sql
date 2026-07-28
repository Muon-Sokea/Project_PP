-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationPrefs" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");
