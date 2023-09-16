/*
  Warnings:

  - The `content` column on the `Article` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[slug]` on the table `Article` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "slug" TEXT NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");