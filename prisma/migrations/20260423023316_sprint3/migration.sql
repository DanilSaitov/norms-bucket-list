/*
  Warnings:

  - You are about to drop the column `category` on the `tradition_suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `tradition_suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `intermittent` on the `tradition_suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `tradition_suggestions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tradition_suggestions" DROP COLUMN "category",
DROP COLUMN "image",
DROP COLUMN "intermittent",
DROP COLUMN "tags";
