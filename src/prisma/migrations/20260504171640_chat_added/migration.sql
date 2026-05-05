/*
  Warnings:

  - Added the required column `chat` to the `Partida` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Partida" ADD COLUMN     "chat" JSONB NOT NULL;
