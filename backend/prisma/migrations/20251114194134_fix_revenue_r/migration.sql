-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('conductor', 'driver', 'owner', 'sacco');

-- CreateEnum
CREATE TYPE "FareType" AS ENUM ('normal', 'rush_hour', 'off_peak', 'rain');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'received', 'failed');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matatu" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "model" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 14,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matatu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "distance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FareRule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "fareType" "FareType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FareRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "matatuId" TEXT NOT NULL,
    "conductorId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "fareType" "FareType" NOT NULL,
    "passengerCount" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "driverConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "ownerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "TripStatus" NOT NULL DEFAULT 'pending',
    "tripDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "mpesaRequestId" TEXT,
    "mpesaReceipt" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "callbackData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueSplit" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "conductorId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "ownerAmount" DOUBLE PRECISION NOT NULL,
    "driverAmount" DOUBLE PRECISION NOT NULL,
    "conductorAmount" DOUBLE PRECISION NOT NULL,
    "saccoAmount" DOUBLE PRECISION NOT NULL,
    "maintenanceAmount" DOUBLE PRECISION NOT NULL,
    "blockchainHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idempotency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Matatu_plateNumber_key" ON "Matatu"("plateNumber");

-- CreateIndex
CREATE INDEX "Matatu_ownerId_idx" ON "Matatu"("ownerId");

-- CreateIndex
CREATE INDEX "Matatu_plateNumber_idx" ON "Matatu"("plateNumber");

-- CreateIndex
CREATE INDEX "Route_name_idx" ON "Route"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Route_from_to_key" ON "Route"("from", "to");

-- CreateIndex
CREATE INDEX "FareRule_routeId_idx" ON "FareRule"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "FareRule_routeId_fareType_key" ON "FareRule"("routeId", "fareType");

-- CreateIndex
CREATE INDEX "Trip_conductorId_idx" ON "Trip"("conductorId");

-- CreateIndex
CREATE INDEX "Trip_driverId_idx" ON "Trip"("driverId");

-- CreateIndex
CREATE INDEX "Trip_matatuId_idx" ON "Trip"("matatuId");

-- CreateIndex
CREATE INDEX "Trip_routeId_idx" ON "Trip"("routeId");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "Trip_tripDate_idx" ON "Trip"("tripDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpesaRequestId_key" ON "Payment"("mpesaRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpesaReceipt_key" ON "Payment"("mpesaReceipt");

-- CreateIndex
CREATE INDEX "Payment_tripId_idx" ON "Payment"("tripId");

-- CreateIndex
CREATE INDEX "Payment_mpesaRequestId_idx" ON "Payment"("mpesaRequestId");

-- CreateIndex
CREATE INDEX "Payment_mpesaReceipt_idx" ON "Payment"("mpesaReceipt");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSplit_tripId_key" ON "RevenueSplit"("tripId");

-- CreateIndex
CREATE INDEX "RevenueSplit_tripId_idx" ON "RevenueSplit"("tripId");

-- CreateIndex
CREATE INDEX "RevenueSplit_ownerId_idx" ON "RevenueSplit"("ownerId");

-- CreateIndex
CREATE INDEX "RevenueSplit_driverId_idx" ON "RevenueSplit"("driverId");

-- CreateIndex
CREATE INDEX "RevenueSplit_conductorId_idx" ON "RevenueSplit"("conductorId");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_read_idx" ON "Alert"("read");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Idempotency_key_key" ON "Idempotency"("key");

-- CreateIndex
CREATE INDEX "Idempotency_key_idx" ON "Idempotency"("key");

-- CreateIndex
CREATE INDEX "Idempotency_expiresAt_idx" ON "Idempotency"("expiresAt");

-- AddForeignKey
ALTER TABLE "Matatu" ADD CONSTRAINT "Matatu_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FareRule" ADD CONSTRAINT "FareRule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_matatuId_fkey" FOREIGN KEY ("matatuId") REFERENCES "Matatu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSplit" ADD CONSTRAINT "RevenueSplit_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSplit" ADD CONSTRAINT "RevenueSplit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSplit" ADD CONSTRAINT "RevenueSplit_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSplit" ADD CONSTRAINT "RevenueSplit_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
