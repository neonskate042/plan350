-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "requestedSum" INTEGER NOT NULL,
    "experience" TEXT NOT NULL,
    "equipment" JSONB NOT NULL,
    "tariff" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "error" TEXT,
    "pdfBytes" BYTEA,
    "excelBytes" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_paymentId_idx" ON "Order"("paymentId");

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "Order"("email");
