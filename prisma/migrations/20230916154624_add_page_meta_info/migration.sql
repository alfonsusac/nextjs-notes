/*
  Warnings:

  - Added the required column `data` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "data" JSONB NOT NULL;
