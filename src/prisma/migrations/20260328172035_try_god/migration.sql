/*
  Warnings:

  - Added the required column `precio` to the `Cosmeticos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cosmeticos" ADD COLUMN     "precio" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "escaleraActual" TEXT NOT NULL DEFAULT 'escalera_default',
ADD COLUMN     "fichaActual" TEXT NOT NULL DEFAULT 'ficha_default',
ADD COLUMN     "iconoActual" TEXT NOT NULL DEFAULT 'icono_default',
ADD COLUMN     "serpienteActual" TEXT NOT NULL DEFAULT 'serpiente_default';
