/*
  Warnings:

  - You are about to drop the column `online` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Logros" ADD COLUMN     "recompensaMonetaria" INTEGER;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "online";

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "iconoActual_fk" FOREIGN KEY ("iconoActual") REFERENCES "Cosmeticos"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "fichaActual_fk" FOREIGN KEY ("fichaActual") REFERENCES "Cosmeticos"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "serpienteActual_fk" FOREIGN KEY ("serpienteActual") REFERENCES "Cosmeticos"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "escaleraActual_fk" FOREIGN KEY ("escaleraActual") REFERENCES "Cosmeticos"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;
