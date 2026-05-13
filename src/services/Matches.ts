import prisma from "../prismaClient.js";
import { Usuario, Estado } from "../generated/prisma/client.js";
import { SnapshotJugadoresJSON, SnapshotTableroJSON, ChatPartidaJSON } from "./JsonTypes.js";
import { lobbyManager } from "../managers/lobbyManager.js";
import { MovimientoReturnType, PartidaReturnType, PartidasActivasReturnType, Movimiento, ChatReturnType } from "./ReturnTypes.js";
import { randomInt } from "node:crypto";
import { modifyUserByEmail, getUserByName } from "./User.js";
import { checkAchievementsForCompletion } from "./Achievements.js";
import { isBotPlayer, selectBotCard, selectBotMove, selectBotTarget } from "./Bot.js";

function isPlayerInMatch(partida: { partidaJugadores: { nombre: string }[]; snapshotJugadores: unknown }, player: string): boolean {
    const inDbPlayers = partida.partidaJugadores.some(j => j.nombre === player);
    const snapshot = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const inSnapshot = snapshot.jugadores.some(j => j.username === player);
    return inDbPlayers || inSnapshot;
}

const botTurnRunning = new Set<string>();
const botTurnQueue = new Map<string, number>();

function queueBotTurn(partidaId: string): void {
    const pending = botTurnQueue.get(partidaId) ?? 0;
    botTurnQueue.set(partidaId, pending + 1);

    if (botTurnRunning.has(partidaId)) {
        return;
    }

    runNextBotTurn(partidaId);
}

function runNextBotTurn(partidaId: string): void {
    const pending = botTurnQueue.get(partidaId) ?? 0;
    if (pending <= 0) {
        botTurnQueue.delete(partidaId);
        return;
    }

    botTurnQueue.set(partidaId, pending - 1);


    const timeout =Math.floor(Math.random() * 2000) + 1500;
    botTurnRunning.add(partidaId);
    setTimeout(() => {
        runBotTurn(partidaId)
            .catch(err => console.error("Bot error:", err))
            .finally(() => {
                botTurnRunning.delete(partidaId);
                runNextBotTurn(partidaId);
            });
    }, timeout);
}

async function runBotTurn(partidaId: string): Promise<void> {
    const partidaRaw = await prisma.partida.findUnique({
        where: { ID: partidaId },
        select: { snapshotJugadores: true }
    });

    if (!partidaRaw) {
        return;
    }

    const estadoRaw = partidaRaw.snapshotJugadores as SnapshotJugadoresJSON;
    const jugadorRaw = estadoRaw.jugadores[estadoRaw.turnoActual];
    if (!jugadorRaw || !jugadorRaw.esIA) {
        return;
    }

    const botUsername = jugadorRaw.username;
    let estado = estadoRaw;
    let jugadorActual = estado.jugadores[estado.turnoActual];

    if (jugadorActual.username !== botUsername || !isBotPlayer(estado, botUsername)) {
        return;
    }

    if (jugadorActual.fase === "Cartas") {
        if (!jugadorActual.cartaJugadaEnTurno) {
            const carta = selectBotCard(jugadorActual.mano);
            if (carta) {
                try {
                    const objetivo = selectBotTarget(estado, botUsername, carta);
                    await useCard(partidaId, botUsername, carta, objetivo);
                } catch (err) {
                }
            }
        }
        try {
            await throwDice(partidaId, botUsername);
        } catch (err) {
            await advanceTurn(partidaId, estado);
        }
    }

    const partidaAfter = await prisma.partida.findUnique({
        where: { ID: partidaId },
        select: { snapshotJugadores: true }
    });
    if (!partidaAfter) return;
    estado = partidaAfter.snapshotJugadores as SnapshotJugadoresJSON;
    jugadorActual = estado.jugadores[estado.turnoActual];

    if (jugadorActual.username !== botUsername || jugadorActual.fase !== "Movimiento") {
        return;
    }

    const movimientos = jugadorActual.movimientosPermitidos || [];
    const hayMovimientoReal = movimientos.some(m => {
        const ficha = jugadorActual.fichas.find(f => f.id === m.fichaId);
        if (!ficha) {
            return false;
        }
        return m.esBifurcacion || m.casilla !== ficha.casilla;
    });

    if (!hayMovimientoReal) {
        await advanceTurn(partidaId, estado);
        return;
    }

    const movimiento = selectBotMove(movimientos);
    if (movimiento) {
        try {
            if (movimiento.esBifurcacion && movimiento.pasosRestantes !== undefined) {
                const partidaBif = await moveToken(partidaId, botUsername, movimiento.fichaId, movimiento.casilla, movimiento.pasosRestantes);
                const estadoBif = partidaBif.snapshotJugadores as SnapshotJugadoresJSON;
                const tableroBif = partidaBif.snapshotTablero as SnapshotTableroJSON;
                const jugadorBif = estadoBif.jugadores[estadoBif.turnoActual];
                const fichaBif = jugadorBif.fichas.find(f => f.id === movimiento.fichaId) || jugadorBif.fichas[0];
                if (fichaBif) {
                    const casillaBif = tableroBif.casillas[fichaBif.casilla];
                    const opciones = casillaBif?.siguientes || [];
                    if (opciones.length > 0) {
                        const opcionIndex = Math.floor(Math.random() * opciones.length);
                        await moveToken(partidaId, botUsername, fichaBif.id, opciones[opcionIndex], movimiento.pasosRestantes);
                    }
                }
                return;
            }
            await moveToken(partidaId, botUsername, movimiento.fichaId, movimiento.casilla, movimiento.pasosRestantes);
            return;
        } catch (err) {
            console.error("Bot move error:", err);
            await advanceTurn(partidaId, estado);
            return;
        }
    }

    await advanceTurn(partidaId, estado);
}

async function advanceTurn(partidaId: string, estadoJugadores: SnapshotJugadoresJSON): Promise<void> {
    const jugadorActual = estadoJugadores.jugadores[estadoJugadores.turnoActual];
    jugadorActual.fase = "Cartas";
    jugadorActual.ultimaTirada = undefined;
    jugadorActual.movimientosPermitidos = [];
    jugadorActual.cartaJugadaEnTurno = false;

    estadoJugadores.turnoActual = (estadoJugadores.turnoActual + 1) % estadoJugadores.jugadores.length;
    const siguienteJugador = estadoJugadores.jugadores[estadoJugadores.turnoActual];
    siguienteJugador.fase = "Cartas";

    if (siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4) {
        const cartaRobada = siguienteJugador.mazoRestante.shift()!;
        if (cartaRobada) {
            siguienteJugador.mano.push(cartaRobada);
        }

        if (siguienteJugador.efectosActivos.some(e => e.resumenEfecto === "Coleccionista")) {
            if (siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4) {
                const cartaRobada2 = siguienteJugador.mazoRestante.shift()!;
                if (cartaRobada2) {
                    siguienteJugador.mano.push(cartaRobada2);
                }
                siguienteJugador.efectosActivos = siguienteJugador.efectosActivos.filter(e => e.resumenEfecto !== "Coleccionista");
            }
        }
    } else if (siguienteJugador.cementerio.length > 0 && siguienteJugador.mano.length < 4 && siguienteJugador.mazoRestante.length === 0) {
        siguienteJugador.mazoRestante = [...siguienteJugador.cementerio];
        siguienteJugador.mazoRestante.sort(() => Math.random() - 0.5);
        siguienteJugador.cementerio = [];
        const cartaRobada = siguienteJugador.mazoRestante.shift()!;
        if (cartaRobada) {
            siguienteJugador.mano.push(cartaRobada);
        }
    }

    if (estadoJugadores.turnoActual === 0) {
        estadoJugadores.ronda++;
    }

    await prisma.partida.update({
        where: { ID: partidaId },
        data: { snapshotJugadores: estadoJugadores },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    queueBotTurn(partidaId);
}

export async function startMatch(lobbyId: string): Promise<PartidaReturnType> {

    let lobby = lobbyManager.getLobbyById(lobbyId);
    if (!lobby) {
        throw new Error("Lobby no encontrado");
    }
    if (lobby.idPartida) {
        throw new Error("La partida ya ha sido iniciada");
    }
    if (lobby.jugadores.length < 2) {
        throw new Error("No hay suficientes jugadores para iniciar la partida");
    }

    const allDeckSelected = lobby.jugadores.every(jugador => jugador.nombreMazo);
    const allReady = lobby.jugadores.every(jugador => jugador.estaListo);
    if (!allDeckSelected) {
        throw new Error("No todos los jugadores han seleccionado un mazo");
    }
    if (!allReady) {
        throw new Error("No todos los jugadores están listos");
    }

    const jugadores = lobby.jugadores;
    const tablero = lobby.tablero;

    // Resolver emails de los jugadores no-IA antes de construir los mazos
    let jugadoresEmail = new Map<string, string>();
    for (let jugador of jugadores) {
        if (!jugador.esIA) {
            const user = await getUserByName(jugador.nombre);
            if (!user) {
                throw new Error(`Usuario ${jugador.nombre} no encontrado`);
            }
            jugadoresEmail.set(jugador.nombre, user.email);
        }
    }
    let jsonJugadores: SnapshotJugadoresJSON = {
        turnoActual: 0,
        ronda: 1,
        jugadores: jugadores.map(jugador => ({
            username: jugador.nombre,
            esIA: jugador.esIA,
            fase: "Cartas",
            fichas: [
                { id: 1, casilla: 0, meta: false },
                { id: 2, casilla: 0, meta: false },
                { id: 3, casilla: 0, meta: false }
            ],
            mazo: jugador.nombreMazo || "Mazo IA",
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
        let jugadorJson = jsonJugadores.jugadores.find(j => j.username === jugador.nombre)!;
        if (!jugador.esIA) {
            const usuarioEmail = jugadoresEmail.get(jugador.nombre);
            const cartas = await prisma.barajaCarta.findMany({
                where: { barajaNombre: jugador.nombreMazo, barajaUsuarioEmail: usuarioEmail },
                select: { cartaNombre: true }
            });
            const nombresCartas = cartas.map(c => c.cartaNombre).sort(() => Math.random() - 0.5);
            jugadorJson.mazoRestante = nombresCartas;
        } else {
            const cartas = await prisma.barajaCarta.findMany({
                where: { barajaNombre: "Mazo IA" },
                select: { cartaNombre: true }
            });
            const nombresCartas = cartas.map(c => c.cartaNombre).sort(() => Math.random() - 0.5);
            jugadorJson.mazoRestante = nombresCartas;
        }
        if (jugadorJson.mazoRestante.length >= 4) {
            jugadorJson.mano = jugadorJson.mazoRestante.slice(0, 1);
            jugadorJson.mazoRestante = jugadorJson.mazoRestante.slice(1);
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
    let chat: ChatPartidaJSON = [{
        mandadoPor: "Sistema",
        mensaje: "Bienvenidos a S&E ReMix! La partida ha comenzado."
    }];
    const partidaCreada = await prisma.partida.create({
        data: {
            estado: Estado.EnCurso,
            snapshotJugadores: jsonJugadores,
            chat: chat,
            configuracion: {
                tablero,
                numeroJugadores: jugadores.length,
                numeroBots: lobby.numBots
            },
            snapshotTablero: jsonTablero,
            tableroInicialNombre: tablero,
            partidaJugadores: {
                connect: jugadores
                    .filter(jugador => !jugador.esIA)
                    .map(jugador => {
                        const emailJugador = jugadoresEmail.get(jugador.nombre);
                        if (!emailJugador) {
                            throw new Error(`No se pudo resolver el email del jugador ${jugador.nombre}`);
                        }
                        return { email: emailJugador };
                    })
            },
            barajas: {
                create: jugadores
                    .filter(jugador => !jugador.esIA)
                    .map(jugador => {
                        const emailJugador = jugadoresEmail.get(jugador.nombre);
                        if (!emailJugador) {
                            throw new Error(`No se pudo resolver el email del jugador ${jugador.nombre}`);
                        }
                        return {
                            barajaNombre: jugador.nombreMazo!,
                            barajaUsuarioEmail: emailJugador
                        };
                    })
            }
        },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    lobby.idPartida = partidaCreada.ID;
    if (jsonJugadores.jugadores[0].esIA) {
        queueBotTurn(partidaCreada.ID);
    }
    setTimeout(() => {
        try {
            lobbyManager.deleteLobby(lobbyId);
        } catch (err) {
        }
    }, 10000);
    return partidaCreada
}

export async function sendMessage(partidaId: string, player: string, mensaje: string): Promise<ChatReturnType> {

    const chatUpdated = await prisma.$transaction(async (tx) => {
        const partida = await tx.partida.findUnique({
            where: { ID: partidaId },
            include: {
                partidaJugadores: {
                    select: { nombre: true }
                }
            }
        });
        if (!partida) {
            throw new Error("Partida no encontrada");
        }
        if (!isPlayerInMatch(partida, player)) {
            throw new Error("El jugador no pertenece a esta partida");
        }
        let chat = partida.chat as ChatPartidaJSON;
        chat.push({
            mandadoPor: player,
            mensaje: mensaje
        });
        return await tx.partida.update({
            where: { ID: partidaId },
            data: { chat: chat },
            select: {
                chat: true,
            }
        });
    });
    return chatUpdated;
}

export async function getChat(partidaId: string, player: string): Promise<ChatReturnType> {
    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!isPlayerInMatch(partida, player)) {
        throw new Error("El jugador no pertenece a esta partida");
    }
    return {
        chat: partida.chat as ChatPartidaJSON
    };
}

export async function getMatchState(partidaId: string, player: string): Promise<PartidaReturnType> {
    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!isPlayerInMatch(partida, player)) {
        throw new Error("El jugador no pertenece a esta partida");
    }
    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    estadoJugadores.jugadores = estadoJugadores.jugadores.map(jugador => {
        if (jugador.username !== player) {
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
                some: { nombre: player }
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

function aplicarEfectoMasCuatro(
    tablero: SnapshotTableroJSON,
    jugadorActual: SnapshotJugadoresJSON["jugadores"][number],
    posicionInicial: number,
    estadoJugadores: SnapshotJugadoresJSON
): number {
    let posicionFinal = posicionInicial;
    let pasos = 4;
    let haciaAtras = false;
    while (pasos > 0) {
        const casillaActual = tablero.casillas[posicionFinal];
        if (!haciaAtras) {
            if (!casillaActual || casillaActual.siguientes.length === 0) {
                break;
            }
            if (casillaActual.tipo === "Meta") {
                haciaAtras = true;
            }
            if (pasos === 1 && checkBlockInBox(estadoJugadores, casillaActual.siguientes[0])) {
                break;
            }
            posicionFinal = casillaActual.siguientes[0];
            pasos--;
        } else {
            let casillaAnterior = tablero.casillas.findIndex(casilla => casilla.siguientes.includes(posicionFinal));
            if (casillaAnterior === -1 || checkBlockInBox(estadoJugadores, casillaAnterior)) {
                break;
            }
            posicionFinal = casillaAnterior;
            pasos--;
        }
    }

    const casillaFinal = tablero.casillas[posicionFinal];
    if (casillaFinal.tipo === "Escalera") {
        return casillaFinal.saltoA ?? posicionFinal;
    }

    if (casillaFinal.tipo === "Serpiente") {
        const tieneAntidoto = jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto");
        if (tieneAntidoto) {
            jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Antidoto");
            return posicionFinal;
        }
        return casillaFinal.saltoA ?? posicionFinal;
    }
    if (casillaFinal.efecto === "+4") {
        return aplicarEfectoMasCuatro(tablero, jugadorActual, posicionFinal, estadoJugadores);
    }
    if (casillaFinal.efecto === "-4") {
        return aplicarEfectoMenosCuatro(tablero, jugadorActual, posicionFinal, estadoJugadores);
    }
    if (casillaFinal.efecto === "Agujero de serpiente") {
        return aplicarEfectoAgujeroSerpiente(tablero, jugadorActual, estadoJugadores);
    }

    return posicionFinal;
}
function aplicarEfectoMenosCuatro(
    tablero: SnapshotTableroJSON,
    jugadorActual: SnapshotJugadoresJSON["jugadores"][number],
    posicionInicial: number,
    estadoJugadores: SnapshotJugadoresJSON
): number {
    let posicionFinal = posicionInicial;
    let pasos = 4;
    while (pasos > 0) {
        const casillaActual = tablero.casillas[posicionFinal];
        let casillaAnterior = tablero.casillas.findIndex(casilla => casilla.siguientes.includes(posicionFinal));
        if (casillaAnterior === -1 || checkBlockInBox(estadoJugadores, casillaAnterior) && pasos === 1) {
            break;
        }
        posicionFinal = casillaAnterior;
        pasos--;
    }

    const casillaFinal = tablero.casillas[posicionFinal];
    if (casillaFinal.tipo === "Escalera") {
        return casillaFinal.saltoA ?? posicionFinal;
    }

    if (casillaFinal.tipo === "Serpiente") {
        const tieneAntidoto = jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto");
        if (tieneAntidoto) {
            jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Antidoto");
            return posicionFinal;
        }
        return casillaFinal.saltoA ?? posicionFinal;
    }
    if (casillaFinal.efecto === "+4") {
        return aplicarEfectoMasCuatro(tablero, jugadorActual, posicionFinal, estadoJugadores);
    }
    if (casillaFinal.efecto === "-4") {
        return aplicarEfectoMenosCuatro(tablero, jugadorActual, posicionFinal, estadoJugadores);
    }
    if (casillaFinal.efecto === "Agujero de serpiente") {
        return aplicarEfectoAgujeroSerpiente(tablero, jugadorActual, estadoJugadores);
    }

    return posicionFinal;
}
function aplicarEfectoAgujeroSerpiente(
    tablero: SnapshotTableroJSON,
    jugadorActual: SnapshotJugadoresJSON["jugadores"][number],
    estadoJugadores: SnapshotJugadoresJSON
): number {
    //tpea a una posicion aleatoria
    let posicionFinal = Math.floor(Math.random() * tablero.casillas.length);
    while (checkBlockInBox(estadoJugadores, posicionFinal) || tablero.casillas[posicionFinal].tipo === "Vacía") {
        posicionFinal = Math.floor(Math.random() * tablero.casillas.length);
    }

    const casillaFinal = tablero.casillas[posicionFinal];
    if (casillaFinal.tipo === "Escalera") {
        return casillaFinal.saltoA ?? posicionFinal;
    }
    if (casillaFinal.tipo === "Serpiente") {
        const tieneAntidoto = jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto");
        if (tieneAntidoto) {
            jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Antidoto");
            return posicionFinal;
        }
        return casillaFinal.saltoA ?? posicionFinal;
    }
    if (casillaFinal.efecto === "+4") {
        return aplicarEfectoMasCuatro(tablero, jugadorActual, posicionFinal, estadoJugadores);
    }
    if (casillaFinal.efecto === "-4") {
        return aplicarEfectoMenosCuatro(tablero, jugadorActual, posicionFinal, estadoJugadores);
    }
    if (casillaFinal.efecto === "Agujero de serpiente") {
        return aplicarEfectoAgujeroSerpiente(tablero, jugadorActual, estadoJugadores);
    }
    return posicionFinal;

}
export async function throwDice(partidaId: string, player: string): Promise<MovimientoReturnType> {

    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });


    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!isPlayerInMatch(partida, player)) {
        throw new Error("El jugador no está jugando esta partida");
    }


    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const tablero = partida.snapshotTablero as SnapshotTableroJSON;
    const jugadorActual = estadoJugadores.jugadores[estadoJugadores.turnoActual];


    if (jugadorActual.username !== player) {
        throw new Error("No es tu turno");
    }

    if (jugadorActual.fase !== "Cartas") {
        throw new Error("No puedes tirar el dado en esta fase");
    }

    if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Salto de turno")) {
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Salto de turno");
        jugadorActual.fase = "Cartas";
        jugadorActual.ultimaTirada = undefined;
        jugadorActual.movimientosPermitidos = [];
        jugadorActual.cartaJugadaEnTurno = false;

        estadoJugadores.turnoActual = (estadoJugadores.turnoActual + 1) % estadoJugadores.jugadores.length;
        let siguienteJugador = estadoJugadores.jugadores[estadoJugadores.turnoActual];
        siguienteJugador.fase = "Cartas";
        if (siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4) {
            const cartaRobada = siguienteJugador.mazoRestante.shift()!;
            if (cartaRobada) {
                siguienteJugador.mano.push(cartaRobada);
            }
        }
        if (estadoJugadores.turnoActual === 0) {
            estadoJugadores.ronda++;
        }

        const partidaUpdated = await prisma.partida.update({
            where: { ID: partidaId },
            data: { snapshotJugadores: estadoJugadores },
            include: {
                partidaJugadores: {
                    select: {
                        nombre: true,
                        iconoActualField: true,
                        fichaActualField: true,
                        serpienteActualField: true,
                        escaleraActualField: true,
                    }
                },
                ganador: {
                    select: {
                        nombre: true
                    }
                }
            }
        });
        queueBotTurn(partidaId);
        return {
            partida: partidaUpdated,
            tirada: 0,
            movimientos: [],
            tiradaExtra: 0
        };
    }


    let tirada = randomInt(1, 7);
    if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "1-3")) {
        tirada = randomInt(1, 4);
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "1-3");
    }
    if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "4-6")) {
        tirada = randomInt(4, 7);
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "4-6");
    }
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
    let tiradaExtra = 0;
    if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "+1 dado")) {
        tiradaExtra = randomInt(1, 7);
        tirada = tirada + tiradaExtra;
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "+1 dado");
    }
    if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "-3")) {
        tiradaExtra = -3;
        tirada = tirada + tiradaExtra;
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "-3");
    }
    if (tirada <= 0) {
        jugadorActual.fase = "Cartas";
        jugadorActual.ultimaTirada = tirada;
        jugadorActual.movimientosPermitidos = [];
        jugadorActual.cartaJugadaEnTurno = false;

        estadoJugadores.turnoActual = (estadoJugadores.turnoActual + 1) % estadoJugadores.jugadores.length;
        let siguienteJugador = estadoJugadores.jugadores[estadoJugadores.turnoActual];
        siguienteJugador.fase = "Cartas";
        if (siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4) {
            const cartaRobada = siguienteJugador.mazoRestante.shift()!;
            if (cartaRobada) {
                siguienteJugador.mano.push(cartaRobada);
            }
        }
        if (estadoJugadores.turnoActual === 0) {
            estadoJugadores.ronda++;
        }

        const partidaUpdated = await prisma.partida.update({
            where: { ID: partidaId },
            data: { snapshotJugadores: estadoJugadores },
            include: {
                partidaJugadores: {
                    select: {
                        nombre: true,
                        iconoActualField: true,
                        fichaActualField: true,
                        serpienteActualField: true,
                        escaleraActualField: true,
                    }
                },
                ganador: {
                    select: {
                        nombre: true
                    }
                }
            }
        });
        queueBotTurn(partidaId);
        return {
            partida: partidaUpdated,
            tirada: tirada,
            movimientos: [],
            tiradaExtra: tiradaExtra
        };
    }
    jugadorActual.ultimaTirada = tirada;
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
                    if (casillaTablero.siguientes.length > 1) {
                        esBifurcacion = true;
                        break;
                    } else if (casillaTablero.siguientes.length === 1) {
                        casillaActual = casillaTablero.siguientes[0];
                        pasos--;
                        continue;
                    } else {
                        break;
                    }
                }
                if (checkBlockInBox(estadoJugadores, casillaTablero.siguientes[0])) {
                    if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Saltar bloqueo")) {
                        pasos++;
                        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Saltar bloqueo");
                    } else {
                        break;
                    }
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
        if (esBifurcacion && pasos > 0) {
            movimiento.pasosRestantes = pasos;
        }
        movimientos.push(movimiento);
    }
    jugadorActual.movimientosPermitidos = movimientos.map(m => {
        let final = m.casillaDestino;
        let casilla = tablero.casillas[final];
        if (casilla.tipo === "Escalera") {
            return { casilla: casilla.saltoA!, casillaNoTomada: final, fichaId: m.fichaId, esBifurcacion: m.esBifurcacion, pasosRestantes: m.pasosRestantes };
        }
        if (casilla.tipo === "Serpiente") {
            if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto")) {
                return { casilla: final, fichaId: m.fichaId, esBifurcacion: m.esBifurcacion, pasosRestantes: m.pasosRestantes };
            } else {
                return { casilla: casilla.saltoA!, fichaId: m.fichaId, esBifurcacion: m.esBifurcacion, pasosRestantes: m.pasosRestantes };
            }
        }
        return { casilla: final, fichaId: m.fichaId, esBifurcacion: m.esBifurcacion, pasosRestantes: m.pasosRestantes };
    });
    const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: { snapshotJugadores: estadoJugadores },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }

    });
    return {
        partida: partidaUpdated,
        tirada: tirada,
        movimientos: movimientos,
        tiradaExtra: tiradaExtra
    };
}

export async function moveToken(partidaId: string, player: string, fichaId: number, casillaDestino: number, pasosRestantes?: number): Promise<PartidaReturnType> {

    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!isPlayerInMatch(partida, player)) {
        throw new Error("El jugador no pertenece a esta partida");
    }
    if (casillaDestino < 0 || casillaDestino > 100) {
        throw new Error("Casilla destino no válida");
    }

    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const tablero = partida.snapshotTablero as SnapshotTableroJSON;
    const jugadorActual = estadoJugadores.jugadores[estadoJugadores.turnoActual];
    if (jugadorActual.username !== player) {
        throw new Error("No es tu turno");
    }
    if (jugadorActual.fase !== "Movimiento") {
        throw new Error("No puedes mover fichas en esta fase");
    }
    let fichaAActualizar = jugadorActual.fichas.find(f => f.id === fichaId)!;
    if (!fichaAActualizar) {
        throw new Error("Ficha no encontrada");
    }
    const permitido = jugadorActual.movimientosPermitidos.some(m =>
        (m.casilla === casillaDestino || m.casillaNoTomada === casillaDestino) &&
        m.fichaId === fichaId &&
        m.esBifurcacion === (pasosRestantes !== 0 && pasosRestantes !== undefined) &&
        (m.pasosRestantes ?? 0) === (pasosRestantes ?? 0)
    );

    const tieneSaltarBloqueo = jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Saltar bloqueo");
    const estaEnBifurcacion = casillaDestino === fichaAActualizar.casilla && tablero.casillas[casillaDestino].tipo === "Bifurcacion";
    const destinoBloqueado = checkBlockInBox(estadoJugadores, casillaDestino) && fichaAActualizar.casilla !== casillaDestino;
    const bloqueoValidoParaEsteMovimiento =
        !destinoBloqueado ||
        tieneSaltarBloqueo ||
        estaEnBifurcacion;

    const movimientoDesdeBifurcacionValido =
        pasosRestantes !== undefined && bloqueoValidoParaEsteMovimiento &&
        jugadorActual.movimientosPermitidos.some(m =>
            m.fichaId === fichaId &&
            m.esBifurcacion &&
            m.pasosRestantes === pasosRestantes &&
            m.casilla === fichaAActualizar.casilla &&
            tablero.casillas[m.casilla].tipo === "Bifurcacion" &&
            tablero.casillas[m.casilla].siguientes.includes(casillaDestino)
        );

    if (!permitido && !movimientoDesdeBifurcacionValido && !(pasosRestantes === -1)) {
        throw new Error("Movimiento no permitido");
    }
    if (destinoBloqueado && !estaEnBifurcacion) {
        if (!tieneSaltarBloqueo) {
            throw new Error("Movimiento no permitido, casilla bloqueada");
        }
    }
    if (tieneSaltarBloqueo) {
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Saltar bloqueo");
    }

    let casillaAnterior;
    casillaAnterior = fichaAActualizar.casilla;
    let casillaActual = fichaAActualizar.casilla;
    fichaAActualizar.casilla = casillaDestino;
    if (tablero.casillas[casillaDestino].tipo === "Serpiente") {
        if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto")) {
            jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Antidoto");
        }
    }
    if (tablero.casillas[casillaDestino].tipo === "Meta") {
        fichaAActualizar.meta = true;
    }

    if (jugadorActual.fichas.every(f => f.meta)) {
        return await finishMatch(partidaId, jugadorActual.username);
    } else {

        if (pasosRestantes !== undefined && pasosRestantes > 0) {
            if (movimientoDesdeBifurcacionValido) {
                pasosRestantes--;
            }

            let haciaAtras = false;
            let esBifurcacion = false;
            let casillaTablero;
            casillaActual = fichaAActualizar.casilla;

            while (pasosRestantes > 0) {
                casillaTablero = tablero.casillas[casillaActual];
                if (!haciaAtras) {
                    if (casillaTablero.tipo === "Meta") {
                        haciaAtras = true;
                        continue;
                    }
                    if (casillaTablero.tipo === "Bifurcacion") {
                        if (casillaTablero.siguientes.length > 1) {
                            esBifurcacion = true;
                            break;
                        } else if (casillaTablero.siguientes.length === 1) {
                            casillaActual = casillaTablero.siguientes[0];
                            pasosRestantes--;
                            continue;
                        } else {
                            break;
                        }
                    }
                    if (checkBlockInBox(estadoJugadores, casillaTablero.siguientes[0])) {
                        if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Saltar bloqueo")) {
                            pasosRestantes++;
                            jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Saltar bloqueo");
                        } else {
                            break;
                        }
                    }
                    casillaActual = casillaTablero.siguientes[0];
                    pasosRestantes--;
                } else {
                    let casillaAnterior = tablero.casillas.findIndex(casilla => casilla.siguientes.includes(casillaActual));
                    if (casillaAnterior === -1 || checkBlockInBox(estadoJugadores, casillaAnterior)) {
                        break;
                    }
                    casillaActual = casillaAnterior;
                    pasosRestantes--;
                }
            }
            if (tablero.casillas[casillaActual].tipo === "Serpiente" && !jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto")) {
                casillaActual = tablero.casillas[casillaActual].saltoA ?? casillaActual;
            }
            if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto")) {
                jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Antidoto");
            }
            fichaAActualizar.casilla = casillaActual;
        }
        if (tablero.casillas[fichaAActualizar.casilla].tipo === "Escalera" && tablero.casillas[casillaAnterior].tipo === "Bifurcacion") { } else {
            if (tablero.casillas[casillaDestino].tipo !== "Bifurcacion" || (tablero.casillas[casillaDestino].tipo === "Bifurcacion" && (pasosRestantes === undefined || pasosRestantes === 0))) {
                const casillaConEfecto = tablero.casillas[fichaAActualizar.casilla];
                if (casillaConEfecto.efecto === "-4") {
                    const nuevaCasilla = aplicarEfectoMenosCuatro(tablero, jugadorActual, fichaAActualizar.casilla, estadoJugadores);
                    fichaAActualizar.casilla = nuevaCasilla;
                    if (tablero.casillas[nuevaCasilla].tipo === "Meta") {
                        fichaAActualizar.meta = true;
                    }
                }
                if (casillaConEfecto.efecto === "+4") {
                    const nuevaCasilla = aplicarEfectoMasCuatro(tablero, jugadorActual, fichaAActualizar.casilla, estadoJugadores);
                    fichaAActualizar.casilla = nuevaCasilla;
                    if (tablero.casillas[nuevaCasilla].tipo === "Meta") {
                        fichaAActualizar.meta = true;
                    }
                }
                if (casillaConEfecto.efecto === "Agujero de serpiente") {
                    const nuevaCasilla = aplicarEfectoAgujeroSerpiente(tablero, jugadorActual, estadoJugadores);
                    fichaAActualizar.casilla = nuevaCasilla;
                    if (tablero.casillas[nuevaCasilla].tipo === "Meta") {
                        fichaAActualizar.meta = true;
                    }
                }
                if (casillaConEfecto.efecto === "Serpiente en tu bota") {
                    jugadorActual.efectosActivos.push({ resumenEfecto: "Salto de turno" });
                    casillaConEfecto.efecto = undefined;
                }
                if (fichaAActualizar.meta) {
                    if (jugadorActual.fichas.every(f => f.meta)) {
                        return await finishMatch(partidaId, jugadorActual.username);
                    }
                }
                jugadorActual.fase = "Cartas";
                jugadorActual.ultimaTirada = undefined;
                jugadorActual.movimientosPermitidos = [];
                jugadorActual.cartaJugadaEnTurno = false;
                estadoJugadores.turnoActual = (estadoJugadores.turnoActual + 1) % estadoJugadores.jugadores.length;
                let siguienteJugador = estadoJugadores.jugadores[estadoJugadores.turnoActual];
                siguienteJugador.fase = "Cartas";
                if (siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4) {
                    const cartaRobada = siguienteJugador.mazoRestante.shift()!;
                    if (cartaRobada) {
                        siguienteJugador.mano.push(cartaRobada);
                    }

                    if (siguienteJugador.efectosActivos.some(e => e.resumenEfecto === "Coleccionista")) {
                        if (siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4) {
                            const cartaRobada2 = siguienteJugador.mazoRestante.shift()!;
                            if (cartaRobada2) {
                                siguienteJugador.mano.push(cartaRobada2);
                            }
                            siguienteJugador.efectosActivos = siguienteJugador.efectosActivos.filter(e => e.resumenEfecto !== "Coleccionista");
                        }
                    }

                } else if (siguienteJugador.cementerio.length > 0 && siguienteJugador.mano.length < 4 && siguienteJugador.mazoRestante.length === 0) {
                    siguienteJugador.mazoRestante = [...siguienteJugador.cementerio];
                    siguienteJugador.mazoRestante.sort(() => Math.random() - 0.5);
                    siguienteJugador.cementerio = [];
                    const cartaRobada = siguienteJugador.mazoRestante.shift()!;
                    if (cartaRobada) {
                        siguienteJugador.mano.push(cartaRobada);
                    }
                }
                if (estadoJugadores.turnoActual === 0) {
                    estadoJugadores.ronda++;
                }
            }
        }
    }
    const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: { snapshotJugadores: estadoJugadores },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    const nextPlayer = estadoJugadores.jugadores[estadoJugadores.turnoActual];
    if (nextPlayer) {
        queueBotTurn(partidaId);
    }
    return partidaUpdated;
}

async function finishMatch(partidaId: string, ganador: string): Promise<PartidaReturnType> {

    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    //sep a ganador 100
    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const jugadorGanador = estadoJugadores.jugadores.find(j => j.username === ganador);
    let emailGanador = "";
    for (let jugador of estadoJugadores.jugadores) {
        let jugadorJuego = await getUserByName(jugador.username) as Usuario;
        if (!jugadorJuego) {
            continue;
        }
        const esGanador = jugador.username === ganador;
        if (esGanador) {
            emailGanador = jugadorJuego.email;
        }
        await modifyUserByEmail(jugadorJuego.email, {
            SEP: jugadorJuego.SEP + (esGanador ? 100 : 30),
            victorias: jugadorJuego.victorias + (esGanador ? 1 : 0),
            partidasJugadas: jugadorJuego.partidasJugadas + 1,
            derrotas: jugadorJuego.derrotas + (esGanador ? 0 : 1),
            cartasJugadas: jugador.cartasJugadas,
        });
        checkAchievementsForCompletion(jugadorJuego.email);
    }
    if (!jugadorGanador) {
        throw new Error("El jugador ganador no pertenece a esta partida");
    }
    const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: { ganadorEmail: emailGanador, estado: Estado.Finalizada, fechaFin: new Date() },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    return partidaUpdated;
}

function validarCasillaParaSalto(tablero: SnapshotTableroJSON, casilla: number, etiqueta: string): void {
    if (!Number.isInteger(casilla)) {
        throw new Error(`${etiqueta} debe ser un numero entero`);
    }
    if (casilla < 0 || casilla >= tablero.casillas.length) {
        throw new Error(`${etiqueta} fuera de rango`);
    }
    const tipo = tablero.casillas[casilla].tipo;
    if (tipo === "Serpiente" || tipo === "Escalera") {
        throw new Error(`${etiqueta} no puede ser serpiente ni escalera`);
    }
}

export async function useCard(partidaId: string, player: string, cartaNombre: string, who?: string | number, inicio?: number, fin?: number): Promise<PartidaReturnType> {

    const partida = await prisma.partida.findUnique({
        where: { ID: partidaId },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    if (!partida) {
        throw new Error("Partida no encontrada");
    }
    if (!isPlayerInMatch(partida, player)) {
        throw new Error("El jugador no pertenece a esta partida");
    }
    const estadoJugadores = partida.snapshotJugadores as SnapshotJugadoresJSON;
    const tableroPartida = partida.snapshotTablero as SnapshotTableroJSON;
    const jugadorActual = estadoJugadores.jugadores[estadoJugadores.turnoActual];
    if (jugadorActual.username !== player) {
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
    const casillaObjetivoIndex = (inicio !== undefined && inicio !== null) ? inicio : casillaActual;
    const casillaObjetivo = tableroPartida.casillas[casillaObjetivoIndex];
    let prohibidas = false;
    if (casillaObjetivo.tipo === "Serpiente" || casillaObjetivo.tipo === "Escalera") {
        prohibidas = true;
    }
    const tieneEfecto = (casillaObjetivo.efecto !== undefined && casillaObjetivo.efecto !== null && casillaObjetivo.efecto !== "");
    const esMetaOVacia = casillaObjetivo.tipo === "Meta" || casillaObjetivo.tipo === "Vacía";
    const indiceCarta = jugadorActual.mano.indexOf(cartaNombre);
    if (indiceCarta === -1) {
        throw new Error("Carta no encontrada en la mano");
    }
    jugadorActual.mano.splice(indiceCarta, 1);
    let jugadorObjetivo = estadoJugadores.jugadores.find(j => j.username === who);
    switch (cartaNombre) {
        case "Exceso de medios"://done 🈴
            jugadorActual.efectosActivos.push({ resumenEfecto: "+1 dado" });
            break;
        case "Moises"://done 🈴
            jugadorActual.efectosActivos.push({ resumenEfecto: "Saltar bloqueo" });
            break;
        case "Wild Frank"://done 🈴
            if (inicio === undefined || fin === undefined) {
                throw new Error("Debes indicar casilla inicio y fin para Wild Frank");
            }
            validarCasillaParaSalto(tableroPartida, inicio, "Casilla inicio");
            validarCasillaParaSalto(tableroPartida, fin, "Casilla fin");
            if (fin % 10 >= inicio % 10) {
                throw new Error("La casilla fin debe ser menor que la casilla inicio");
            }
            tableroPartida.casillas[inicio].tipo = "Serpiente";
            tableroPartida.casillas[inicio].saltoA = fin;

            break;
        case "Carpintero"://done 🈴
            if (inicio === undefined || fin === undefined) {
                throw new Error("Debes indicar casilla inicio y fin para Carpintero");
            }
            validarCasillaParaSalto(tableroPartida, inicio, "Casilla inicio");
            validarCasillaParaSalto(tableroPartida, fin, "Casilla fin");
            if (fin % 10 <= inicio % 10) {
                throw new Error("La casilla fin debe ser mayor que la casilla inicio");
            }
            tableroPartida.casillas[inicio].tipo = "Escalera";
            tableroPartida.casillas[inicio].saltoA = fin;

            break;
        case "Día de la marmota"://done 🈴
        case "Dia de la marmota":
            if (prohibidas) {
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            if (tieneEfecto) {
                throw new Error("No puedes jugar esta carta en una casilla que ya tiene un efecto");
            }
            if (esMetaOVacia) {
                throw new Error("No puedes jugar esta carta en la meta o en una casilla vacía");
            }
            casillaObjetivo.efecto = "-4";
            break;
        case "Salto de longitud"://done 🈴
            if (prohibidas) {
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            if (tieneEfecto) {
                throw new Error("No puedes jugar esta carta en una casilla que ya tiene un efecto");
            }
            if (esMetaOVacia) {
                throw new Error("No puedes jugar esta carta en la meta o en una casilla vacía");
            }
            casillaObjetivo.efecto = "+4";
            break;
        case "Robo de identidad"://done 🈴
            let posFichas = []
            for (let jugador of estadoJugadores.jugadores) {
                if (jugador.username === player) {
                    continue;
                }
                for (let ficha of jugador.fichas) {
                    if (!ficha.meta) {
                        posFichas.push(ficha.casilla);
                    }
                }
                // Tiene que seleccionar una ficha el user.
            }
            //Pillar posicion random de las fichas y teletransportar una ficha del jugador actual ahí
            const posicionAleatoria = Math.floor(Math.random() * posFichas.length);
            const casillaDestinoRobo = posFichas[posicionAleatoria];
            // Lógica para teletransportar la ficha
            // Cambiar la ficha del jugador en la posicion aleatoria por una ficha del jugador actual
            if (typeof who !== "number") {
                throw new Error("Debes indicar el id de la ficha a mover para Robo de identidad");
            }
            const fichaOrigen = jugadorActual.fichas[who];
            if (!fichaOrigen || fichaOrigen.meta) {
                throw new Error("La ficha seleccionada no es válida para Robo de identidad");
            }
            const casillaOrigen = fichaOrigen.casilla;
            fichaOrigen.casilla = casillaDestinoRobo;
            let numFicha = 0;
            for (let jugador of estadoJugadores.jugadores) {
                if (jugador.username === player) {
                    continue;
                }
                for (let ficha of jugador.fichas) {
                    if (!ficha.meta && ficha.casilla === casillaDestinoRobo && numFicha === 0) {
                        ficha.casilla = casillaOrigen;
                        numFicha++;
                        break;
                    }
                }
                if (numFicha > 0) {
                    break;
                }
            }

            // Y cambia a la ficha que habia ahi por la posicion en la que estaba el jugador actual

            break;
        case "Mal de ojo"://done 🈴
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            jugadorObjetivo.efectosActivos.push({ resumenEfecto: "-3" });
            break;
        case "Antidoto"://done 🈴
            jugadorActual.efectosActivos.push({ resumenEfecto: "Antidoto" });
            break;
        case "Pickpocket"://done 🈴
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.username === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            if (jugadorObjetivo.mano.length === 0) {
                throw new Error("El jugador objetivo no tiene cartas en la mano");
            }
            const cartaRobada = jugadorObjetivo.mano.shift()!;
            jugadorActual.mano.push(cartaRobada);
            break;
        case "Dado envenenado"://done  🈴
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.username === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            jugadorObjetivo.efectosActivos.push({ resumenEfecto: "1-3" });
            break;
        case "Dado dorado"://done 🈴
            jugadorActual.efectosActivos.push({ resumenEfecto: "4-6" });
            break;
        case "Serpiente en tu bota"://done 🈴
            if (prohibidas) {
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            if (tieneEfecto) {
                throw new Error("No puedes jugar esta carta en una casilla que ya tiene un efecto");
            }
            if (esMetaOVacia) {
                throw new Error("No puedes jugar esta carta en la meta o en una casilla vacía");
            }
            casillaObjetivo.efecto = "Serpiente en tu bota";
            break;
        case "Parca"://done 🈴
            let Fichas = [];
            for (let jugador of estadoJugadores.jugadores) {
                for (let ficha of jugador.fichas) {
                    if (!ficha.meta) {
                        Fichas.push(ficha);
                    }
                }
            }
            let fichaAfectada = Math.floor(Math.random() * Fichas.length);
            Fichas[fichaAfectada].casilla = 0;
            // Coger ficha aleatoria y devolverla al inicio
            break;
        case "Cambiar de idea"://done 🈴
            const cartasAlCementerio = jugadorActual.mano
            jugadorActual.cementerio.push(...cartasAlCementerio);
            jugadorActual.mano = [];
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
        case "Agujero de serpiente"://done 🈴
            if (prohibidas) {
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            if (tieneEfecto) {
                throw new Error("No puedes jugar esta carta en una casilla que ya tiene un efecto");
            }
            if (esMetaOVacia) {
                throw new Error("No puedes jugar esta carta en la meta o en una casilla vacía");
            }
            casillaObjetivo.efecto = "Agujero de serpiente";
            // Coger posición del tablero aleatoria y teletransportar una ficha ahí
            break;
        case "Bolsillo roto"://done 🈴
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.username === who);
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
        case "Compañerismo obligado"://done 🈴
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
        case "Coleccionista"://done 🈴
            jugadorActual.efectosActivos.push({ resumenEfecto: "Coleccionista" });
            break;
        case "Noqueo"://done 🈴
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.username === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            jugadorObjetivo.efectosActivos.push({ resumenEfecto: "Salto de turno" });
            if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Salto de turno")) {
                jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Salto de turno");
                estadoJugadores.turnoActual = (estadoJugadores.turnoActual + 1) % estadoJugadores.jugadores.length;
            }
            break;
    }
    jugadorActual.cartaJugadaEnTurno = true;
    jugadorActual.cartasJugadas++;
    jugadorActual.cementerio.push(cartaNombre);
    const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: { snapshotJugadores: estadoJugadores, snapshotTablero: tableroPartida },
        include: {
            partidaJugadores: {
                select: {
                    nombre: true,
                    iconoActualField: true,
                    fichaActualField: true,
                    serpienteActualField: true,
                    escaleraActualField: true,
                }
            },
            ganador: {
                select: {
                    nombre: true
                }
            }
        }
    });
    const nextPlayer = estadoJugadores.jugadores[estadoJugadores.turnoActual];
    if (nextPlayer && nextPlayer.esIA) {
        queueBotTurn(partidaId);
    }
    return partidaUpdated;
}