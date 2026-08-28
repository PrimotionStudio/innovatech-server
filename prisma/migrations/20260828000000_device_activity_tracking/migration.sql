-- CreateTable
CREATE TABLE "DeviceProfile" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT,
    "class" TEXT,
    "school" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceSession" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceActivity" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER,
    "payload" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicePracticeAttempt" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "practiceTitle" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL,
    "correct" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "answers" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevicePracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceProfile_deviceId_key" ON "DeviceProfile"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_deviceId_uid_key" ON "DeviceSession"("deviceId", "uid");

-- CreateIndex
CREATE INDEX "DeviceSession_deviceId_startedAt_idx" ON "DeviceSession"("deviceId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceActivity_deviceId_uid_key" ON "DeviceActivity"("deviceId", "uid");

-- CreateIndex
CREATE INDEX "DeviceActivity_deviceId_occurredAt_idx" ON "DeviceActivity"("deviceId", "occurredAt");

-- CreateIndex
CREATE INDEX "DeviceActivity_eventType_idx" ON "DeviceActivity"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "DevicePracticeAttempt_deviceId_uid_key" ON "DevicePracticeAttempt"("deviceId", "uid");

-- CreateIndex
CREATE INDEX "DevicePracticeAttempt_deviceId_attemptedAt_idx" ON "DevicePracticeAttempt"("deviceId", "attemptedAt");

-- AddForeignKey
ALTER TABLE "DeviceProfile" ADD CONSTRAINT "DeviceProfile_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceActivity" ADD CONSTRAINT "DeviceActivity_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePracticeAttempt" ADD CONSTRAINT "DevicePracticeAttempt_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;