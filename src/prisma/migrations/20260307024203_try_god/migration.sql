-- DropForeignKey
ALTER TABLE "BarajaCarta" DROP CONSTRAINT "BarajaCarta_barajaNombre_barajaUsuarioEmail_fkey";

-- DropForeignKey
ALTER TABLE "BarajaCarta" DROP CONSTRAINT "BarajaCarta_cartaNombre_fkey";

-- DropForeignKey
ALTER TABLE "BarajaPartida" DROP CONSTRAINT "BarajaPartida_barajaNombre_barajaUsuarioEmail_fkey";

-- DropForeignKey
ALTER TABLE "BarajaPartida" DROP CONSTRAINT "BarajaPartida_partidaID_fkey";

-- AddForeignKey
ALTER TABLE "BarajaCarta" ADD CONSTRAINT "BarajaCarta_barajaNombre_barajaUsuarioEmail_fkey" FOREIGN KEY ("barajaNombre", "barajaUsuarioEmail") REFERENCES "Baraja"("nombre", "usuarioEmail") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaCarta" ADD CONSTRAINT "BarajaCarta_cartaNombre_fkey" FOREIGN KEY ("cartaNombre") REFERENCES "Carta"("nombre") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaPartida" ADD CONSTRAINT "BarajaPartida_barajaNombre_barajaUsuarioEmail_fkey" FOREIGN KEY ("barajaNombre", "barajaUsuarioEmail") REFERENCES "Baraja"("nombre", "usuarioEmail") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarajaPartida" ADD CONSTRAINT "BarajaPartida_partidaID_fkey" FOREIGN KEY ("partidaID") REFERENCES "Partida"("ID") ON DELETE CASCADE ON UPDATE CASCADE;
