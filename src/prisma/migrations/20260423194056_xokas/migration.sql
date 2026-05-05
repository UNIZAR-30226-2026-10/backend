/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tableroInicialNombre` on table `Partida` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Partida" DROP CONSTRAINT "Partida_tableroInicialNombre_fkey";

-- AlterTable
ALTER TABLE "Partida" ALTER COLUMN "tableroInicialNombre" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nombre_key" ON "Usuario"("nombre");

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_tableroInicialNombre_fkey" FOREIGN KEY ("tableroInicialNombre") REFERENCES "TableroInicial"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;
