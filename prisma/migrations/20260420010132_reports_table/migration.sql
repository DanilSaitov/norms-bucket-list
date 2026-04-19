-- CreateEnum
CREATE TYPE "Issue_type" AS ENUM ('traditions', 'notifications', 'profile', 'performance', 'access', 'other');

-- CreateTable
CREATE TABLE "user_reports" (
    "report_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "issue_type" "Issue_type" NOT NULL DEFAULT 'other',
    "description" TEXT NOT NULL,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("report_id")
);

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
