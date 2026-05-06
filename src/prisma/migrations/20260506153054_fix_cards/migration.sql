/*
  Warnings:

  - The primary key for the `BarajaCarta` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "BarajaCarta" DROP CONSTRAINT "BarajaCarta_pkey",
ADD COLUMN     "Id" SERIAL NOT NULL,
ADD CONSTRAINT "BarajaCarta_pkey" PRIMARY KEY ("Id");
