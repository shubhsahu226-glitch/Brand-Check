-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'EXTRACTING', 'EXTRACTED', 'FAILED');

-- CreateEnum
CREATE TYPE "KnowledgeType" AS ENUM ('RULE', 'TONE', 'TERM_APPROVED', 'TERM_BANNED', 'FACT', 'CLAIM', 'VISUAL', 'ACCESSIBILITY', 'DISCLOSURE');

-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('DRAFT', 'APPROVED', 'DISABLED');

-- CreateEnum
CREATE TYPE "KnowledgeSource" AS ENUM ('EXTRACTED', 'MANUAL');

-- CreateTable
CREATE TABLE "BrandDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "extractedText" TEXT,
    "pageCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "documentId" TEXT,
    "type" "KnowledgeType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "KnowledgeSource" NOT NULL DEFAULT 'EXTRACTED',
    "sourceQuote" TEXT,
    "sourcePage" INTEGER,
    "sourceVerified" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "expiresAt" TIMESTAMP(3),
    "evidenceUrl" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandDocument_workspaceId_idx" ON "BrandDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "BrandDocument_uploadedById_idx" ON "BrandDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "BrandDocument_workspaceId_status_idx" ON "BrandDocument"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeItem_workspaceId_status_idx" ON "KnowledgeItem"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeItem_workspaceId_type_idx" ON "KnowledgeItem"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "KnowledgeItem_documentId_idx" ON "KnowledgeItem"("documentId");

-- CreateIndex
CREATE INDEX "AuditEvent_workspaceId_createdAt_idx" ON "AuditEvent"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- AddForeignKey
ALTER TABLE "BrandDocument" ADD CONSTRAINT "BrandDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandDocument" ADD CONSTRAINT "BrandDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BrandDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
