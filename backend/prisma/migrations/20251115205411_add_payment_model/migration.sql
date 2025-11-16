/*
  Warnings:

  - A unique constraint covering the columns `[providerRef]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "checkoutRequest" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "providerRaw" JSONB,
ADD COLUMN     "providerRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");

-- CreateIndex
CREATE INDEX "Payment_checkoutRequest_idx" ON "Payment"("checkoutRequest");
