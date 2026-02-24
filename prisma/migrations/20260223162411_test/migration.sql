-- CreateEnum
CREATE TYPE "Category" AS ENUM ('sports', 'academic', 'social');

-- CreateTable
CREATE TABLE "traditions" (
    "tradition_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "intermittent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traditions_pkey" PRIMARY KEY ("tradition_id")
);
