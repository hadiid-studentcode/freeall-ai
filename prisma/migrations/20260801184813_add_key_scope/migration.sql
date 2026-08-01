-- CreateEnum
CREATE TYPE "KeyScope" AS ENUM ('PRIVATE', 'SHARED');

-- AlterTable
ALTER TABLE "ProviderKey" ADD COLUMN     "scope" "KeyScope" NOT NULL DEFAULT 'PRIVATE';

-- CreateIndex
CREATE INDEX "ProviderKey_scope_isActive_idx" ON "ProviderKey"("scope", "isActive");
