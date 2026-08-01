-- AlterTable
ALTER TABLE "ProviderKey" ADD COLUMN     "fallbackModels" TEXT[] DEFAULT ARRAY[]::TEXT[];
