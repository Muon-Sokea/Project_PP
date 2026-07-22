-- CreateIndex: speeds up WHERE status != 'cancelled' filter
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex: composite for GROUP BY eventId + status filter (replaces N+1 _count)
CREATE INDEX "Ticket_eventId_status_idx" ON "Ticket"("eventId", "status");

-- CreateIndex: composite for WHERE organizerId = ? ORDER BY createdAt DESC
CREATE INDEX "Event_organizerId_createdAt_idx" ON "Event"("organizerId", "createdAt");

-- CreateIndex: speeds up ORDER BY createdAt DESC (non-organizer queries)
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");
