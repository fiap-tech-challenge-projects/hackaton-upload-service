-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'ANALYZED', 'ERROR');

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'RECEIVED',
    "report_id" TEXT,
    "error_message" TEXT,
    "correlation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analyses_status_idx" ON "analyses"("status");

-- CreateIndex
CREATE INDEX "analyses_created_at_idx" ON "analyses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "analyses_correlation_id_idx" ON "analyses"("correlation_id");
