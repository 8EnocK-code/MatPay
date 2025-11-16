-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'admin';

-- DropIndex
DROP INDEX "User_email_key";
