-- DropForeignKey
ALTER TABLE "tradition_submissions" DROP CONSTRAINT "tradition_submissions_tradition_id_fkey";

-- DropForeignKey
ALTER TABLE "tradition_submissions" DROP CONSTRAINT "tradition_submissions_user_id_fkey";

-- AddForeignKey
ALTER TABLE "tradition_submissions" ADD CONSTRAINT "tradition_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tradition_submissions" ADD CONSTRAINT "tradition_submissions_tradition_id_fkey" FOREIGN KEY ("tradition_id") REFERENCES "traditions"("tradition_id") ON DELETE RESTRICT ON UPDATE CASCADE;
