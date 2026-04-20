import prisma from "../prismaClient.js";
import { Partida, Usuario, TableroInicial, Estado, BarajaCarta } from "../generated/prisma/client.js";
import { JugadorEstadoSchema, SnapshotJugadoresJSON, SnapshotTableroJSON } from "./JsonTypes.js";
import { lobbyManager } from "../managers/lobbyManager.js";
import { MovimientoReturnType, PartidaReturnType, PartidasActivasReturnType, Movimiento } from "./ReturnTypes.js";
import { randomInt } from "node:crypto";

export async function startMatch(lobbyId: string): Promise<PartidaReturnType> {

    let lobby = lobbyManager.getLobby(lobbyId);
    if (!lobby) {
        throw new Error("Lobby no encontrado");
    }

    const jugadores = lobby.jugadores;
    const tablero = lobby.tablero;
    let jsonJugadores: SnapshotJugadoresJSON = {
        turnoActual: 0,
        ronda: 1,
        jugadores: jugadores.map(jugador => ({
            email: jugador.idJugador,
            fase: "Cartas",
            fichas: [
                { id: 1, casilla: 0, meta: false },
                { id: 2, casilla: 0, meta: false },
                { id: 3, casilla: 0, meta: false }
            ],
            mazo: jugador.nombreMazo || "mazoPorDefecto",
            mano: [],
            mazoRestante: [],
            cementerio: [],
            cartaJugadaEnTurno: false,
            cartasJugadas: 0,
            efectosActivos: [],
            movimientosPermitidos: []
        }))
    };

    for (let jugador of jugadores) {
        let jugadorJson = jsonJugadores.jugadores.find(j => j.email === jugador.idJugador)!;
        if (!jugador.esIA) {
            const cartas = await prisma.barajaCarta.findMany({
                where: { barajaNombre: jugador.nombreMazo },
                select: { cartaNombre: true }
            });
            const nombresCartas = cartas.map(c => c.cartaNombre).sort(() => Math.random() - 0.5);
            jugadorJson.mazoRestante = nombresCartas;
        } else {
            // mazoPorDefecto aún no implementaado
        }
        if (jugadorJson.mazoRestante.length >= 4) {
            jugadorJson.mano = jugadorJson.mazoRestante.slice(0, 4);
            jugadorJson.mazoRestante = jugadorJson.mazoRestante.slice(4);
        }
    }

    const tableroAUtilizar = await prisma.tableroInicial.findUnique({
        where: { nombre: tablero },
        select: { snapshotTableroInicial: true }
    });
    if (!tableroAUtilizar) {
        throw new Error("Tablero no encontrado");
    }

    const jsonTablero: SnapshotTableroJSON = tableroAUtilizar.snapshotTableroInicial as SnapshotTableroJSON;
    const partidaCreada = await prisma.partida.create({
        data: {
            estado: Estado.EnCurso,
            snapshotJugadores: jsonJugadores,
            snapshotTablero: jsonTablero,
            tableroInicialNombre: tablero,
            partidaJugadores: {
                connect: jugadores
                    .filter(jugador => !jugador.esIA)
                    .map(jugador => ({ email: jugador.idJugador }))
            },
            barajas: {
                create: jugadores
                    .filter(jugador => !jugador.esIA)
                    .map(jugador => ({
                        barajaNombre: jugador.nombreMazo!,
                        barajaUsuarioEmail: jugador.idJugador
                    }))
            }
        },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true
                }
            }
        }
    });
    lobbyManager.deleteLobby(lobbyId);
    return partidaCreada
}

export async function getMatchState(partidaId: string, player: string): Promise<PartidaReturnType> {
    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!partida.partidaJugadores.some(j => j.email === player)) {
        throw new Error("El jugador no pertenece a esta partida");
    }

    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    estadoJugadores.jugadores = estadoJugadores.jugadores.map(jugador => {
        if (jugador.email !== player) {
            return {
                ...jugador,
                mano: jugador.mano.map(() => "cartaOculta"),
                mazoRestante: jugador.mazoRestante.map(() => "cartaOculta")
            };
        }
        return jugador;
    });
    return {
        ...partida,
        snapshotJugadores: estadoJugadores
    };
}


export async function getActiveMatches(player: string): Promise<PartidasActivasReturnType[]> {

    const partidas = await prisma.partida.findMany({
        where: {
            estado: Estado.EnCurso,
            partidaJugadores: {
                some: { email: player }
            }
        },
        select: {
            ID: true,
            fechaInicio: true,
            partidaJugadores: {
                select: {
                    nombre: true
                }
            },
            snapshotJugadores: true,
        }
    });
    if (!partidas) {
        throw new Error("No se encontraron partidas activas para este jugador");
    }

    return partidas.map(partida => ({
        ID: partida.ID,
        fechaInicio: partida.fechaInicio,
        partidaJugadores: partida.partidaJugadores.map(j => ({ nombre: j.nombre })),
        turnoActual: (partida.snapshotJugadores as SnapshotJugadoresJSON).turnoActual,
        rondaActual: (partida.snapshotJugadores as SnapshotJugadoresJSON).ronda
    }));
}

function checkBlockInBox(estadoJugadores: SnapshotJugadoresJSON, casilla: number): boolean {
    for (let jugador of estadoJugadores.jugadores) {
        let fichasEnCasilla = 0
        for (let ficha of jugador.fichas) {
            if (ficha.casilla === casilla && !ficha.meta) {
                fichasEnCasilla++;
            }
            if (fichasEnCasilla >= 2) {
                return true;
            }
        }
    }
    return false;
}

export async function throwDice(partidaId: string, player: string): Promise<MovimientoReturnType> {

    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true
                }
            }
        }
    });


    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!partida.partidaJugadores.some(j => j.email === player)) {
        throw new Error("El jugador no está jugando esta partida");
    }


    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const tablero = partida.snapshotTablero as SnapshotTableroJSON;
    const jugadorActual = estadoJugadores.jugadores[estadoJugadores.turnoActual];


    if (jugadorActual.email !== player) {
        throw new Error("No es tu turno");
    }
    if (jugadorActual.fase !== "Cartas") {
        throw new Error("No puedes tirar el dado en esta fase");
    }


    const tirada = randomInt(1, 7);
    jugadorActual.ultimaTirada = tirada;
    jugadorActual.fase = "Movimiento";
    let movimientos: Movimiento[] = [];
    let fichasBloqueadas: number[] = [];

    if (tirada === 6) {
        let posicionesFichas = jugadorActual.fichas.filter(f => !f.meta).map(ficha => ficha.casilla);
        let bloqueoUsuario = posicionesFichas.find((pos, index) => posicionesFichas.indexOf(pos) !== index);
        if (bloqueoUsuario !== undefined) {
            fichasBloqueadas = jugadorActual.fichas.filter(f => f.casilla === bloqueoUsuario && !f.meta).map(f => f.id);
        }
    }

    for (let ficha of jugadorActual.fichas) {
        if (fichasBloqueadas.length > 0 && !fichasBloqueadas.includes(ficha.id)) continue;
        if (ficha.meta) continue;
        let casillaActual = ficha.casilla;
        let pasos = tirada;
        let haciaAtras = false;
        let esBifurcacion = false;
        let casillaTablero;
        while (pasos > 0) {
            casillaTablero = tablero.casillas[casillaActual];
            if (!haciaAtras) {
                if (casillaTablero.tipo === "Meta") {
                    haciaAtras = true;
                    continue;
                }
                if (casillaTablero.tipo === "Bifurcacion") {
                    esBifurcacion = true;
                    break;
                }
                if (checkBlockInBox(estadoJugadores, casillaTablero.siguientes[0])) {
                    break;
                }
                casillaActual = casillaTablero.siguientes[0];
                pasos--;
            } else {
                let casillaAnterior = tablero.casillas.findIndex(casilla => casilla.siguientes.includes(casillaActual));
                if (casillaAnterior === -1 || checkBlockInBox(estadoJugadores, casillaAnterior)) {
                    break;
                }
                casillaActual = casillaAnterior;
                pasos--;
            }
        }
        casillaTablero = tablero.casillas[casillaActual];
        let movimiento: Movimiento = {
            fichaId: ficha.id,
            casillaDestino: casillaActual,
            esBifurcacion: esBifurcacion
        };
        if (esBifurcacion) {
            movimiento.pasosRestantes = pasos;
        }
        movimientos.push(movimiento);
    }
    jugadorActual.movimientosPermitidos = movimientos.map(m => {
        let final = m.casillaDestino;
        let casilla = tablero.casillas[final];
        if (casilla.tipo === "Escalera" || casilla.tipo === "Serpiente") {
            return casilla.saltoA!;
        }
        return final;
    });
       const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: { snapshotJugadores: estadoJugadores },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true
                }
            }
        }

    });
    return {
        partida: partidaUpdated,
        tirada: tirada,
        movimientos: movimientos
    };
}

export async function moveToken(partidaId: string, player: string, fichaId: number, casillaDestino: number): Promise<PartidaReturnType> {

    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!partida.partidaJugadores.some(j => j.email === player)) {
        throw new Error("El jugador no pertenece a esta partida");
    }
    if (casillaDestino < 0 || casillaDestino > 100) {
        throw new Error("Casilla destino no válida");
    }

    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const tablero = partida.snapshotTablero as SnapshotTableroJSON;
    const jugadorActual = estadoJugadores.jugadores[estadoJugadores.turnoActual];
    if (jugadorActual.email !== player) {
        throw new Error("No es tu turno");
    }
    if (jugadorActual.fase !== "Movimiento") {
        throw new Error("No puedes mover fichas en esta fase");
    }
    if (!jugadorActual.movimientosPermitidos.includes(casillaDestino)) {
        throw new Error("Movimiento no permitido");
    }
    let fichaAActualizar = jugadorActual.fichas.find(f => f.id === fichaId)!;
    if (!fichaAActualizar) {
        throw new Error("Ficha no encontrada");
    }
    fichaAActualizar.casilla = casillaDestino;
    if (tablero.casillas[casillaDestino].tipo === "Meta") {
        fichaAActualizar.meta = true;
    }
    if (jugadorActual.fichas.every(f => f.meta)) {
        // return await finishMatch(partidaId, jugadorActual.email);
    } else {
        estadoJugadores.turnoActual = (estadoJugadores.turnoActual + 1) % estadoJugadores.jugadores.length;
        let siguienteJugador = estadoJugadores.jugadores[estadoJugadores.turnoActual];
        siguienteJugador.fase = "Cartas";
        if (siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4) {
            const cartaRobada = siguienteJugador.mazoRestante.shift()!;
            if (cartaRobada){
                siguienteJugador.mano.push(cartaRobada);
            }
        } else if (siguienteJugador.cementerio.length > 0 && siguienteJugador.mano.length < 4 && siguienteJugador.mazoRestante.length === 0) {
            siguienteJugador.mazoRestante = [...siguienteJugador.cementerio];
            siguienteJugador.mazoRestante.sort(() => Math.random() - 0.5);
            siguienteJugador.cementerio = [];
            const cartaRobada = siguienteJugador.mazoRestante.shift()!;
            if (cartaRobada){
                siguienteJugador.mano.push(cartaRobada);
            }
        }
        if (estadoJugadores.turnoActual === 0) {
            estadoJugadores.ronda++;
        }
    }    
    const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: { snapshotJugadores: estadoJugadores },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true
                }
            }
        }
    });
    return partidaUpdated;
}

async function finishMatch(partidaId: string, ganadorEmail: string): Promise<PartidaReturnType> {

    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const jugadorGanador = estadoJugadores.jugadores.find(j => j.email === ganadorEmail);
    if (!jugadorGanador) {
        throw new Error("El jugador ganador no pertenece a esta partida");
    }
    const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: {ganadorEmail: ganadorEmail, estado: Estado.Finalizada, fechaFin: new Date()},
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true
                }
            }
        }
    });
    return partidaUpdated;
}

export async function useCard(partidaId: string, player: string, cartaNombre: string, who: string , inicio: number): Promise<PartidaReturnType> {

    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {   
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!partida.partidaJugadores.some(j => j.email === player)) {
        throw new Error("El jugador no pertenece a esta partida");
    }
    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const jugadorActual = estadoJugadores.jugadores[estadoJugadores.turnoActual];
    if (jugadorActual.email !== player) {
        throw new Error("No es tu turno");
    }
    if (jugadorActual.fase !== "Cartas") {
        throw new Error("No puedes usar cartas en esta fase");
    }
    if (!jugadorActual.mano.includes(cartaNombre)) {
        throw new Error("No tienes esta carta en la mano");
    }
    if (jugadorActual.cartaJugadaEnTurno) {
        throw new Error("Ya has jugado una carta en este turno");
    }
    const casillaActual = jugadorActual.fichas.find(f => !f.meta)!.casilla;
    const casillaTablero = (partida.snapshotTablero as SnapshotTableroJSON).casillas[casillaActual];
    let prohibidas = false;
    if (casillaTablero.tipo === "Serpiente" || casillaTablero.tipo === "Escalera") {
        prohibidas = true;
    }
    switch (cartaNombre) {
        case "Exceso de medios":
            jugadorActual.efectosActivos.push({ resumenEfecto: "+1 dado" });
            break;
        case "Moises":
            jugadorActual.efectosActivos.push({ resumenEfecto: "Saltar bloqueo" });
            break;
        case "Wild Frank":
            // No sé cómo poner esto
            break;
        case "Carpintero":
            // Same
            break;
        case "Día de la marmota":
            if (prohibidas) {
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            casillaTablero.efecto= "-4";
            break;
        case "Salto de longitud":
            if (prohibidas) {
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            casillaTablero.efecto = "+4";
            break;
        case "Robo de identidad":
            let posFichas = []
            for (let jugador of estadoJugadores.jugadores) {
                if (jugador.email === who) {
                    continue;
                }
                for (let ficha of jugador.fichas) {
                    if (!ficha.meta) {
                        posFichas.push(ficha.casilla);
                    }
                }
                // Tiene que seleccionar una ficha el user.
            }
            break;
        case "Mal de ojo":
            let jugadorObjetivo = estadoJugadores.jugadores.find(j => j.email === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            jugadorObjetivo.efectosActivos.push({ resumenEfecto: "-3" });
            break;
        case "Antidoto":
            jugadorActual.efectosActivos.push({ resumenEfecto: "Antidoto" });
            break;
        case "Pickpocket":
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.email === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            if (jugadorObjetivo.mano.length === 0) {
                throw new Error("El jugador objetivo no tiene cartas en la mano");
            }
            const cartaRobada = jugadorObjetivo.mano.shift()!;
            jugadorActual.mano.push(cartaRobada);
            break;
        case "Dardo envenenado":
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.email === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            jugadorObjetivo.efectosActivos.push({ resumenEfecto: "1-3" });
            break;
        case "Dado dorado":
            jugadorActual.efectosActivos.push({ resumenEfecto: "4-6" });
            break;
        case "Serpiente en tu bota":
            // Pasar una ronda entera
            break;
        case "Parca":
            posFichas = [];
            for (let jugador of estadoJugadores.jugadores) {
                for (let ficha of jugador.fichas) {
                    if (!ficha.meta) {
                        posFichas.push(ficha.casilla);
                    }
                }
            }
            // Coger ficha aleatoria y devolverla al inicio
            break;
        case "Cambiar de idea":
            const cartasAlCementerio = jugadorActual.mano
            jugadorActual.cementerio.push(...cartasAlCementerio);
            for (let i = 0; i < 4; i++) {
                if (jugadorActual.mazoRestante.length === 0) {
                    jugadorActual.mazoRestante = [...jugadorActual.cementerio];
                    jugadorActual.mazoRestante.sort(() => Math.random() - 0.5);
                    jugadorActual.cementerio = [];
                }
                const cartaRobada = jugadorActual.mazoRestante.shift()!;
                jugadorActual.mano.push(cartaRobada);
            }
            break;
        case "Agujero de serpiente":
            // Coger posición del tablero aleatoria y teletransportar una ficha ahí
            break;
        case "Bolsillo roto":
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.email === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            if (jugadorObjetivo.mano.length === 0) {
                throw new Error("El jugador objetivo no tiene cartas en la mano");
            }
            jugadorObjetivo.cementerio.push(...jugadorObjetivo.mano);
            jugadorObjetivo.mano = [];
            if (jugadorObjetivo.mazoRestante.length > 0) {
                const cartaRobada = jugadorObjetivo.mazoRestante.shift()!;
                jugadorObjetivo.mano.push(cartaRobada);
            } else if (jugadorObjetivo.cementerio.length > 0) {
                jugadorObjetivo.mazoRestante = [...jugadorObjetivo.cementerio];
                jugadorObjetivo.mazoRestante.sort(() => Math.random() - 0.5);
                jugadorObjetivo.cementerio = [];
                const cartaRobada = jugadorObjetivo.mazoRestante.shift()!;
                jugadorObjetivo.mano.push(cartaRobada);
            }
            break;
        case "Compañerismo obligado":
            let fichasActivas = jugadorActual.fichas.filter(f => !f.meta);
            if (fichasActivas.length < 2) {
                throw new Error("No tienes suficientes fichas en juego para usar esta carta");
            }
            let fichaMasAvanzada = fichasActivas[0];
            let fichaMasAtrasada = fichasActivas[0];
            for (let ficha of fichasActivas) {
                if (ficha.casilla > fichaMasAvanzada.casilla) {
                    fichaMasAvanzada = ficha;
                }
                if (ficha.casilla < fichaMasAtrasada.casilla) {
                    fichaMasAtrasada = ficha;
                }
            }
            let casillaDestino = fichaMasAvanzada.casilla;
            fichaMasAtrasada.casilla = casillaDestino;
            break;
        case "Coleccionista":
            jugadorActual.efectosActivos.push({ resumenEfecto: "Coleccionista" });
            break;
        case "Noqueo":
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.email === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            // Saltar turno del jugador objetivo 
            break;
    }
    jugadorActual.cartaJugadaEnTurno = true;
    jugadorActual.cartasJugadas++;
    jugadorActual.mano = jugadorActual.mano.filter(c => c !== cartaNombre);
    jugadorActual.cementerio.push(cartaNombre);
    const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: { snapshotJugadores: estadoJugadores },
        include: {
            partidaJugadores: true,
            barajas: true,
            ganador: true,
            tableroInicial: {
                select: {
                    nombre: true                }
            }
        }
    });
    return partidaUpdated;
}