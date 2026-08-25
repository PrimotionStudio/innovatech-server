-- Devices, per-resource versioning and course categories.
--
-- Generated with `prisma migrate diff` against the previous schema, so this is
-- exactly what `prisma migrate dev` would have produced. It was verified that
-- way rather than hand written, because a hand written migration that is subtly
-- wrong is worse than none.
--
-- Every change is additive and every new column on an existing table has a
-- default, so this applies to a populated database without touching a single
-- existing row. Nothing is dropped or renamed.
--
-- Two defaults are deliberate and worth understanding before changing them:
--
--   Course.published defaults to FALSE, so existing courses stay invisible to
--   device sync until somebody publishes them. That is the safe direction. The
--   alternative silently pushes every course in the database to every
--   installation the moment this deploys.
--
--   Course.autoDownload defaults to FALSE for the same reason.
--
-- The desktop app's existing endpoints do not read either column, so nothing
-- that works today stops working.

-- CreateEnum
CREATE TYPE "CourseCategory" AS ENUM ('DIGITAL', 'ACADEMIC');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'RETIRED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('OK', 'PENDING', 'FAILED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "autoDownload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" "CourseCategory" NOT NULL DEFAULT 'ACADEMIC',
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Practice" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "label" TEXT,
    "platform" TEXT,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceSyncState" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "installedVersion" INTEGER NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'OK',
    "message" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE INDEX "Device_lastSeenAt_idx" ON "Device"("lastSeenAt");

-- CreateIndex
CREATE INDEX "DeviceSyncState_status_idx" ON "DeviceSyncState"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSyncState_deviceId_resourceType_resourceId_key" ON "DeviceSyncState"("deviceId", "resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "DeviceSyncState" ADD CONSTRAINT "DeviceSyncState_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

