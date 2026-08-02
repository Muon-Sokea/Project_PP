-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "agenda" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "ticketTypeId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "telegramId" TEXT;

-- CreateTable
CREATE TABLE "TicketType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" INTEGER NOT NULL,

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketType_eventId_idx" ON "TicketType"("eventId");

-- CreateIndex
CREATE INDEX "Bookmark_userId_createdAt_idx" ON "Bookmark"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_eventId_key" ON "Bookmark"("userId", "eventId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Event_approvalStatus_idx" ON "Event"("approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- AddForeignKey
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

