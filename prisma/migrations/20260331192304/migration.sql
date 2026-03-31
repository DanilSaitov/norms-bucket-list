-- CreateEnum
CREATE TYPE "Tags_enum" AS ENUM ('sports', 'academic', 'social', 'club', 'food');

-- CreateTable
CREATE TABLE "tags" (
    "tag_id" SERIAL NOT NULL,
    "tag" "Tags_enum" NOT NULL,
    "tradition_id" INTEGER NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("tag_id")
);

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_tradition_id_fkey" FOREIGN KEY ("tradition_id") REFERENCES "traditions"("tradition_id") ON DELETE RESTRICT ON UPDATE CASCADE;
