/*
  Warnings:

  - The values [Apoyo] on the enum `Tipo_Carta` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Baraja` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Nombre` on the `Baraja` table. All the data in the column will be lost.
  - You are about to drop the column `Afecta` on the `Efecto` table. All the data in the column will be lost.
  - You are about to drop the column `Configuracion` on the `Partida` table. All the data in the column will be lost.
  - You are about to drop the column `Estado` on the `Partida` table. All the data in the column will be lost.
  - You are about to drop the column `FechaFin` on the `Partida` table. All the data in the column will be lost.
  - You are about to drop the column `FechaInicio` on the `Partida` table. All the data in the column will be lost.
  - You are about to drop the column `SnapshotJugadores` on the `Partida` table. All the data in the column will be lost.
  - You are about to drop the column `SnapshotTablero` on the `Partida` table. All the data in the column will be lost.
  - The primary key for the `TableroInicial` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Nombre` on the `TableroInicial` table. All the data in the column will be lost.
  - You are about to drop the column `SnapshotTableroInicial` on the `TableroInicial` table. All the data in the column will be lost.
  - You are about to drop the `_Amigos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CartasUsuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CosmeticosObtenidos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LogrosConseguidos` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `Baraja` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nombre` to the `Baraja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `afecta` to the `Efecto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `configuracion` to the `Partida` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `Partida` table without a default value. This is not possible if the table is not empty.
  - Added the required column `snapshotJugadores` to the `Partida` table without a default value. This is not possible if the table is not empty.
  - Added the required column `snapshotTablero` to the `Partida` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `TableroInicial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `snapshotTableroInicial` to the `TableroInicial` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Tipo_Carta_new" AS ENUM ('Ofensiva', 'Defensiva', 'Entorno');
ALTER TABLE "Carta" ALTER COLUMN "tipo" TYPE "Tipo_Carta_new" USING ("tipo"::text::"Tipo_Carta_new");
ALTER TYPE "Tipo_Carta" RENAME TO "Tipo_Carta_old";
ALTER TYPE "Tipo_Carta_new" RENAME TO "Tipo_Carta";
DROP TYPE "public"."Tipo_Carta_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Baraja" DROP CONSTRAINT "Baraja_usuarioEmail_fkey";

-- DropForeignKey
ALTER TABLE "BarajaCarta" DROP CONSTRAINT "BarajaCarta_barajaNombre_barajaUsuarioEmail_fkey";

-- DropForeignKey
ALTER TABLE "BarajaPartida" DROP CONSTRAINT "BarajaPartida_barajaNombre_barajaUsuarioEmail_fkey";

-- DropForeignKey
ALTER TABLE "Partida" DROP CONSTRAINT "Partida_tableroInicialNombre_fkey";

-- DropForeignKey
ALTER TABLE "_Amigos" DROP CONSTRAINT "_Amigos_A_fkey";

-- DropForeignKey
ALTER TABLE "_Amigos" DROP CONSTRAINT "_Amigos_B_fkey";

-- DropForeignKey
ALTER TABLE "_CartasUsuario" DROP CONSTRAINT "_CartasUsuario_A_fkey";

-- DropForeignKey
ALTER TABLE "_CartasUsuario" DROP CONSTRAINT "_CartasUsuario_B_fkey";

-- DropForeignKey
ALTER TABLE "_CosmeticosObtenidos" DROP CONSTRAINT "_CosmeticosObtenidos_A_fkey";

-- DropForeignKey
ALTER TABLE "_CosmeticosObtenidos" DROP CONSTRAINT "_CosmeticosObtenidos_B_fkey";

-- DropForeignKey
ALTER TABLE "_LogrosConseguidos" DROP CONSTRAINT "_LogrosConseguidos_A_fkey";

-- DropForeignKey
ALTER TABLE "_LogrosConseguidos" DROP CONSTRAINT "_LogrosConseguidos_B_fkey";

-- DropIndex
DROP INDEX "Baraja_Nombre_key";

-- AlterTable
ALTER TABLE "Baraja" DROP CONSTRAINT "Baraja_pkey",
DROP COLUMN "Nombre",
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD CONSTRAINT "Baraja_pkey" PRIMARY KEY ("nombre", "usuarioEmail");

-- AlterTable
ALTER TABLE "Efecto" DROP COLUMN "Afecta",
ADD COLUMN     "afecta" "Tipo_Afeccion" NOT NULL;

-- AlterTable
ALTER TABLE "Partida" DROP COLUMN "Configuracion",
DROP COLUMN "Estado",
DROP COLUMN "FechaFin",
DROP COLUMN "FechaInicio",
DROP COLUMN "SnapshotJugadores",
DROP COLUMN "SnapshotTablero",
ADD COLUMN     "configuracion" JSONB NOT NULL,
ADD COLUMN     "estado" "Estado" NOT NULL,
ADD COLUMN     "fechaFin" TIMESTAMP(3),
ADD COLUMN     "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "snapshotJugadores" JSONB NOT NULL,
ADD COLUMN     "snapshotTablero" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "TableroInicial" DROP CONSTRAINT "TableroInicial_pkey",
DROP COLUMN "Nombre",
DROP COLUMN "SnapshotTableroInicial",
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "snapshotTableroInicial" JSONB NOT NULL,
ADD CONSTRAINT "TableroInicial_pkey" PRIMARY KEY ("nombre");

-- DropTable
DROP TABLE "_Amigos";

-- DropTable
DROP TABLE "_CartasUsuario";

-- DropTable
DROP TABLE "_CosmeticosObtenidos";

-- DropTable
DROP TABLE "_LogrosConseguidos";

-- CreateTable
CREATE TABLE "_amigos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_amigos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_cartasUsuario" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_cartasUsuario_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_logrosConseguidos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_logrosConseguidos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_cosmeticosObtenidos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_cosmeticosObtenidos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_amigos_B_index" ON "_amigos"("B");

-- CreateIndex
CREATE INDEX "_cartasUsuario_B_index" ON "_cartasUsuario"("B");

-- CreateIndex
CREATE INDEX "_logrosConseguidos_B_index" ON "_logrosConseguidos"("B");

-- CreateIndex
CREATE INDEX "_cosmeticosObtenidos_B_index" ON "_cosmeticosObtenidos"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Baraja_nombre_key" ON "Baraja"("nombre");

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_tableroInicialNombre_fkey" FOREIGN KEY ("tableroInicialNombre") REFERENCES "TableroInicial"("nombre") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baraja" ADD CONSTRAINT "Baraja_usuarioEmail_fkey" FOREIGN KEY ("usuarioEmail") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaCarta" ADD CONSTRAINT "BarajaCarta_barajaNombre_barajaUsuarioEmail_fkey" FOREIGN KEY ("barajaNombre", "barajaUsuarioEmail") REFERENCES "Baraja"("nombre", "usuarioEmail") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaPartida" ADD CONSTRAINT "BarajaPartida_barajaNombre_barajaUsuarioEmail_fkey" FOREIGN KEY ("barajaNombre", "barajaUsuarioEmail") REFERENCES "Baraja"("nombre", "usuarioEmail") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_amigos" ADD CONSTRAINT "_amigos_A_fkey" FOREIGN KEY ("A") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_amigos" ADD CONSTRAINT "_amigos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cartasUsuario" ADD CONSTRAINT "_cartasUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "Carta"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cartasUsuario" ADD CONSTRAINT "_cartasUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_logrosConseguidos" ADD CONSTRAINT "_logrosConseguidos_A_fkey" FOREIGN KEY ("A") REFERENCES "Logros"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_logrosConseguidos" ADD CONSTRAINT "_logrosConseguidos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cosmeticosObtenidos" ADD CONSTRAINT "_cosmeticosObtenidos_A_fkey" FOREIGN KEY ("A") REFERENCES "Cosmeticos"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cosmeticosObtenidos" ADD CONSTRAINT "_cosmeticosObtenidos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;
