-- CreateTable
CREATE TABLE "CustomProvider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "defaultModel" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'openai',
    "consoleUrl" TEXT,
    "free" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomProvider_slug_key" ON "CustomProvider"("slug");
