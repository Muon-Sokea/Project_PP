-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" SERIAL NOT NULL,
    "cpuUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diskUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loadAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "services" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthCheck_createdAt_idx" ON "HealthCheck"("createdAt");
