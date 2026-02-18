-- CreateEnum
CREATE TYPE "Tipo_Carta" AS ENUM ('Ofensiva', 'Defensiva', 'Apoyo');

-- CreateEnum
CREATE TYPE "Rareza" AS ENUM ('Comun', 'Rara', 'Epica', 'Legendaria');

-- CreateEnum
CREATE TYPE "Tipo_Afeccion" AS ENUM ('Jugador', 'Casilla');

-- CreateEnum
CREATE TYPE "Tipo_Efecto" AS ENUM ('Dados', 'Cartas', 'Bufo', 'Debufo', 'Movimiento');

-- CreateEnum
CREATE TYPE "Tipo_Logro" AS ENUM ('SEP', 'ELO', 'Partidas', 'Victorias', 'Derrotas', 'CartasJugadas', 'CartasColeccionadas', 'LogrosDesbloqueados');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('EnEspera', 'EnCurso', 'Finalizada');

-- CreateEnum
CREATE TYPE "Tipo_Cosmetico" AS ENUM ('Icono', 'Skin_Ficha', 'Skin_Serpiente', 'Skin_Escalera');

-- CreateTable
CREATE TABLE "Usuario" (
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "SEP" INTEGER NOT NULL DEFAULT 0,
    "ELO" INTEGER NOT NULL DEFAULT 500,
    "partidasJugadas" INTEGER NOT NULL DEFAULT 0,
    "victorias" INTEGER NOT NULL DEFAULT 0,
    "derrotas" INTEGER NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cartasJugadas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "Carta" (
    "nombre" TEXT NOT NULL,
    "tipo" "Tipo_Carta" NOT NULL,
    "calidad" "Rareza" NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "Carta_pkey" PRIMARY KEY ("nombre")
);

-- CreateTable
CREATE TABLE "Efecto" (
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "Afecta" "Tipo_Afeccion" NOT NULL,
    "tipo" "Tipo_Efecto" NOT NULL,

    CONSTRAINT "Efecto_pkey" PRIMARY KEY ("nombre")
);

-- CreateTable
CREATE TABLE "Logros" (
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "requisito" INTEGER NOT NULL,
    "tipo" "Tipo_Logro" NOT NULL,
    "cartaID" TEXT,

    CONSTRAINT "Logros_pkey" PRIMARY KEY ("nombre")
);

-- CreateTable
CREATE TABLE "Partida" (
    "ID" TEXT NOT NULL,
    "Estado" "Estado" NOT NULL,
    "SnapshotJugadores" JSONB NOT NULL,
    "FechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "FechaFin" TIMESTAMP(3),
    "Configuracion" JSONB NOT NULL,
    "SnapshotTablero" JSONB NOT NULL,
    "tableroInicialNombre" TEXT,
    "ganadorEmail" TEXT,

    CONSTRAINT "Partida_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "TableroInicial" (
    "Nombre" TEXT NOT NULL,
    "SnapshotTableroInicial" JSONB NOT NULL,

    CONSTRAINT "TableroInicial_pkey" PRIMARY KEY ("Nombre")
);

-- CreateTable
CREATE TABLE "Baraja" (
    "Nombre" TEXT NOT NULL,
    "usuarioEmail" TEXT NOT NULL,

    CONSTRAINT "Baraja_pkey" PRIMARY KEY ("Nombre","usuarioEmail")
);

-- CreateTable
CREATE TABLE "BarajaCarta" (
    "barajaNombre" TEXT NOT NULL,
    "barajaUsuarioEmail" TEXT NOT NULL,
    "cartaNombre" TEXT NOT NULL,

    CONSTRAINT "BarajaCarta_pkey" PRIMARY KEY ("barajaNombre","barajaUsuarioEmail","cartaNombre")
);

-- CreateTable
CREATE TABLE "BarajaPartida" (
    "barajaNombre" TEXT NOT NULL,
    "barajaUsuarioEmail" TEXT NOT NULL,
    "partidaID" TEXT NOT NULL,

    CONSTRAINT "BarajaPartida_pkey" PRIMARY KEY ("barajaNombre","barajaUsuarioEmail","partidaID")
);

-- CreateTable
CREATE TABLE "Cosmeticos" (
    "nombre" TEXT NOT NULL,
    "tipo" "Tipo_Cosmetico" NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "Cosmeticos_pkey" PRIMARY KEY ("nombre")
);

-- CreateTable
CREATE TABLE "_Amigos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Amigos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CartaEfectos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CartaEfectos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CartasUsuario" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CartasUsuario_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LogrosConseguidos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LogrosConseguidos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_partidaJugadores" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_partidaJugadores_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CosmeticosObtenidos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CosmeticosObtenidos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Logros_cartaID_key" ON "Logros"("cartaID");

-- CreateIndex
CREATE UNIQUE INDEX "Baraja_Nombre_key" ON "Baraja"("Nombre");

-- CreateIndex
CREATE INDEX "_Amigos_B_index" ON "_Amigos"("B");

-- CreateIndex
CREATE INDEX "_CartaEfectos_B_index" ON "_CartaEfectos"("B");

-- CreateIndex
CREATE INDEX "_CartasUsuario_B_index" ON "_CartasUsuario"("B");

-- CreateIndex
CREATE INDEX "_LogrosConseguidos_B_index" ON "_LogrosConseguidos"("B");

-- CreateIndex
CREATE INDEX "_partidaJugadores_B_index" ON "_partidaJugadores"("B");

-- CreateIndex
CREATE INDEX "_CosmeticosObtenidos_B_index" ON "_CosmeticosObtenidos"("B");

-- AddForeignKey
ALTER TABLE "Logros" ADD CONSTRAINT "Logros_cartaID_fkey" FOREIGN KEY ("cartaID") REFERENCES "Carta"("nombre") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_tableroInicialNombre_fkey" FOREIGN KEY ("tableroInicialNombre") REFERENCES "TableroInicial"("Nombre") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_ganadorEmail_fkey" FOREIGN KEY ("ganadorEmail") REFERENCES "Usuario"("email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baraja" ADD CONSTRAINT "Baraja_usuarioEmail_fkey" FOREIGN KEY ("usuarioEmail") REFERENCES "Usuario"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaCarta" ADD CONSTRAINT "BarajaCarta_barajaNombre_barajaUsuarioEmail_fkey" FOREIGN KEY ("barajaNombre", "barajaUsuarioEmail") REFERENCES "Baraja"("Nombre", "usuarioEmail") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaCarta" ADD CONSTRAINT "BarajaCarta_cartaNombre_fkey" FOREIGN KEY ("cartaNombre") REFERENCES "Carta"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaPartida" ADD CONSTRAINT "BarajaPartida_barajaNombre_barajaUsuarioEmail_fkey" FOREIGN KEY ("barajaNombre", "barajaUsuarioEmail") REFERENCES "Baraja"("Nombre", "usuarioEmail") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaPartida" ADD CONSTRAINT "BarajaPartida_partidaID_fkey" FOREIGN KEY ("partidaID") REFERENCES "Partida"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Amigos" ADD CONSTRAINT "_Amigos_A_fkey" FOREIGN KEY ("A") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Amigos" ADD CONSTRAINT "_Amigos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartaEfectos" ADD CONSTRAINT "_CartaEfectos_A_fkey" FOREIGN KEY ("A") REFERENCES "Carta"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartaEfectos" ADD CONSTRAINT "_CartaEfectos_B_fkey" FOREIGN KEY ("B") REFERENCES "Efecto"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartasUsuario" ADD CONSTRAINT "_CartasUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "Carta"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartasUsuario" ADD CONSTRAINT "_CartasUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LogrosConseguidos" ADD CONSTRAINT "_LogrosConseguidos_A_fkey" FOREIGN KEY ("A") REFERENCES "Logros"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LogrosConseguidos" ADD CONSTRAINT "_LogrosConseguidos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_partidaJugadores" ADD CONSTRAINT "_partidaJugadores_A_fkey" FOREIGN KEY ("A") REFERENCES "Partida"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_partidaJugadores" ADD CONSTRAINT "_partidaJugadores_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CosmeticosObtenidos" ADD CONSTRAINT "_CosmeticosObtenidos_A_fkey" FOREIGN KEY ("A") REFERENCES "Cosmeticos"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CosmeticosObtenidos" ADD CONSTRAINT "_CosmeticosObtenidos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("email") ON DELETE CASCADE ON UPDATE CASCADE;
