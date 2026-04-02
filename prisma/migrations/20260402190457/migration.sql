-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Tags_enum" ADD VALUE 'engagement';
ALTER TYPE "Tags_enum" ADD VALUE 'landmark';
ALTER TYPE "Tags_enum" ADD VALUE 'event';
ALTER TYPE "Tags_enum" ADD VALUE 'oncampus';
ALTER TYPE "Tags_enum" ADD VALUE 'offcampus';
ALTER TYPE "Tags_enum" ADD VALUE 'datesensitive';
ALTER TYPE "Tags_enum" ADD VALUE 'misc';
