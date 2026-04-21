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

function aplicarEfectoMasCuatro(
    tablero: SnapshotTableroJSON,
    jugadorActual: SnapshotJugadoresJSON["jugadores"][number],
    posicionInicial: number,
    estadoJugadores?: SnapshotJugadoresJSON
): number {
    let posicionFinal = posicionInicial;
    let pasos = 4;
    let haciaAtras = false;
    while (pasos > 0) {
        const casillaActual = tablero.casillas[posicionFinal];
        if(!haciaAtras){
            if (!casillaActual|| casillaActual.siguientes.length === 0) {
                break;
            }
            if(casillaActual.tipo === "Meta"){
                haciaAtras = true;
            }
            if(pasos===1&&checkBlockInBox(estadoJugadores, casillaActual.siguientes[0])){
                break;
            }
            posicionFinal = casillaActual.siguientes[0];
            pasos--;
        }else{
            let casillaAnterior = tablero.casillas.findIndex(casilla => casilla.siguientes.includes(casillaActual));
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
    if(casillaFinal.efecto==="+4"){
        return aplicarEfectoMasCuatro(tablero, jugadorActual, posicionFinal);
    }
    if(casillaFinal.efecto==="-4"){
        return aplicarEfectoMenosCuatro(tablero, jugadorActual, posicionFinal);
    }
    if(casillaFinal.efecto === "Agujero de Serpiente"){
        return aplicarEfectoAgujeroSerpiente(tablero, jugadorActual, estadoJugadores);
    }

    return posicionFinal;
}
function aplicarEfectoMenosCuatro(
    tablero: SnapshotTableroJSON,
    jugadorActual: SnapshotJugadoresJSON["jugadores"][number],
    posicionInicial: number,
    estadoJugadores?: SnapshotJugadoresJSON
): number {
    let posicionFinal = posicionInicial;
    let pasos = 4;
    while (pasos > 0) {
        const casillaActual = tablero.casillas[posicionFinal];
        let casillaAnterior = tablero.casillas.findIndex(casilla => casilla.siguientes.includes(casillaActual));
            if (casillaAnterior === -1 || checkBlockInBox(estadoJugadores, casillaAnterior)&&pasos===1) {
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
    if(casillaFinal.efecto==="+4"){
        return aplicarEfectoMasCuatro(tablero, jugadorActual, posicionFinal);
    }
    if(casillaFinal.efecto==="-4"){
        return aplicarEfectoMenosCuatro(tablero, jugadorActual, posicionFinal);
    }
    if(casillaFinal.efecto === "Agujero de Serpiente"){
        return aplicarEfectoAgujeroSerpiente(tablero, jugadorActual, estadoJugadores);
    }

    return posicionFinal;
}
function aplicarEfectoAgujeroSerpiente(
    tablero: SnapshotTableroJSON,
    jugadorActual: SnapshotJugadoresJSON["jugadores"][number],
    estadoJugadores?: SnapshotJugadoresJSON
): number {
    //tpea a una posicion aleatoria
        let posicionFinal = Math.floor(Math.random() * tablero.casillas.length);
        while (checkBlockInBox(estadoJugadores, posicionFinal) || tablero.casillas[posicionFinal].tipo === "Vacia") {
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
        if(casillaFinal.efecto==="+4"){
            return aplicarEfectoMasCuatro(tablero, jugadorActual, posicionFinal);
        }
        if(casillaFinal.efecto==="-4"){
            return aplicarEfectoMenosCuatro(tablero, jugadorActual, posicionFinal);
        }
        if(casillaFinal.efecto === "Agujero de Serpiente"){
            return aplicarEfectoAgujeroSerpiente(tablero, jugadorActual, estadoJugadores);
        }
        return posicionFinal;

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
    if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Salto de turno")) {
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Salto de turno");
        estadoJugadores.turnoActual = (estadoJugadores.turnoActual + 1) % estadoJugadores.jugadores.length;

    }

    if (jugadorActual.fase !== "Cartas") {
        throw new Error("No puedes tirar el dado en esta fase");
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
    if (jugadorActual.efectosActivos.some(e => e.resumenEfecto === "+1 dado")){
        tiradaExtra = randomInt(1,7);
        tirada = tirada + tiradaExtra;
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "+1 dado");
    }
    if(jugadorActual.efectosActivos.some(e=> e.resumenEfecto ==="-3")){
        tiradaExtra = -3;
        tirada = tirada + tiradaExtra;
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "-3");
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
                    esBifurcacion = true;
                    break;
                }
                if (checkBlockInBox(estadoJugadores, casillaTablero.siguientes[0])) {
                    if(jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Saltar bloqueo")){
                        pasos++;
                    }else{
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
        if(jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Saltar bloqueo")){
            jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Saltar bloqueo");
        }
        casillaTablero = tablero.casillas[casillaActual];
        let movimiento: Movimiento = {
            fichaId: ficha.id,
            casillaDestino: casillaActual,
            esBifurcacion: esBifurcacion
        };
        if (esBifurcacion&&pasos>0) {
            movimiento.pasosRestantes = pasos;
        }
        movimientos.push(movimiento);
    }
    jugadorActual.movimientosPermitidos = movimientos.map(m => {
        let final = m.casillaDestino;
        let casilla = tablero.casillas[final];
        if (casilla.tipo === "Escalera" || (casilla.tipo === "Serpiente"&&!jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto"))) {
            return casilla.saltoA!;
        }
        return final;
    });
    
    if(jugadorActual.efectosActivos.some(e => e.resumenEfecto === "Antidoto")){
        jugadorActual.efectosActivos = jugadorActual.efectosActivos.filter(e => e.resumenEfecto !== "Antidoto");
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
    let casillaActual = fichaAActualizar.casilla;
    fichaAActualizar.casilla = casillaDestino;
    if (tablero.casillas[casillaDestino].tipo === "Meta") {
        fichaAActualizar.meta = true;
    }
    
    if (jugadorActual.fichas.every(f => f.meta)) {
        // return await finishMatch(partidaId, jugadorActual.email);
    } else {        
        if(pasosRestantes!==undefined&&pasosRestantes>0){
            let haciaAtras = false;
            let esBifurcacion = false;
            let casillaTablero;
            while (pasosRestantes > 0) {
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
            fichaAActualizar.casilla = casillaActual;        
        }  

        if(tablero.casillas[casillaDestino].tipo !== "Bifurcacion"||(tablero.casillas[casillaDestino].tipo==="Bifurcacion"&&(pasosRestantes===undefined||pasosRestantes===0))){
            const casillaConEfecto = tablero.casillas[fichaAActualizar.casilla];
            if(casillaConEfecto.efecto==="-4"){
                const nuevaCasilla = aplicarEfectoMenosCuatro(tablero, jugadorActual, fichaAActualizar.casilla);
                fichaAActualizar.casilla = nuevaCasilla;
                if (tablero.casillas[nuevaCasilla].tipo === "Meta") {
                    fichaAActualizar.meta = true;
                }
            }
            if(casillaConEfecto.efecto ==="+4"){
                const nuevaCasilla = aplicarEfectoMasCuatro(tablero, jugadorActual, fichaAActualizar.casilla);
                fichaAActualizar.casilla = nuevaCasilla;
                if (tablero.casillas[nuevaCasilla].tipo === "Meta") {
                    fichaAActualizar.meta = true;
                }
            }
            if(casillaConEfecto.efecto === "Agujero de Serpiente"){
                const nuevaCasilla = aplicarEfectoAgujeroSerpiente(tablero, jugadorActual, estadoJugadores);
                fichaAActualizar.casilla = nuevaCasilla;
                if (tablero.casillas[nuevaCasilla].tipo === "Meta") {
                    fichaAActualizar.meta = true;
                }
            }
            if(fichaAActualizar.meta){
                if(jugadorActual.fichas.every(f => f.meta)){
                    //return await finishMatch(partidaId, jugadorActual.email);
                }
            }
           estadoJugadores.turnoActual = (estadoJugadores.turnoActual + 1) % estadoJugadores.jugadores.length;
            let siguienteJugador = estadoJugadores.jugadores[estadoJugadores.turnoActual];
            siguienteJugador.fase = "Cartas";
            if (siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4) {
                const cartaRobada = siguienteJugador.mazoRestante.shift()!;
                if (cartaRobada){
                   siguienteJugador.mano.push(cartaRobada);
                }
                
                if(siguienteJugador.efectosActivos.some(e => e.resumenEfecto === "Coleccionista")){
                    if(siguienteJugador.mazoRestante.length > 0 && siguienteJugador.mano.length < 4){
                        const cartaRobada2 = siguienteJugador.mazoRestante.shift()!;
                        if(cartaRobada2){
                            siguienteJugador.mano.push(cartaRobada2);
                        }

                    }
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

export async function useCard(partidaId: string, player: string, cartaNombre: string, who: string | number, inicio?: number, fin?: number): Promise<PartidaReturnType> {

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
    const tableroPartida = partida.snapshotTablero as SnapshotTableroJSON;
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
    const casillaTablero = tableroPartida.casillas[casillaActual];
    let prohibidas = false;
    if (casillaTablero.tipo === "Serpiente" || casillaTablero.tipo === "Escalera") {
        prohibidas = true;
    }
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
            if (fin%10 >= inicio%10) {
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
            if (fin%10 <= inicio%10) {
                throw new Error("La casilla fin debe ser mayor que la casilla inicio");
            }
            tableroPartida.casillas[inicio].tipo = "Escalera";
            tableroPartida.casillas[inicio].saltoA = fin;

            break;
        case "Día de la marmota"://done 🈴
            if (prohibidas) {
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            casillaTablero.efecto= "-4";
            break;
        case "Salto de longitud"://done 🈴
            if (prohibidas) {
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            casillaTablero.efecto = "+4";
            break;
        case "Robo de identidad"://done 🈴
            let posFichas = []
            for (let jugador of estadoJugadores.jugadores) {
                if (jugador.email === player) {
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
            // Lógica para teletransportar la ficha
            // Cambiar la ficha del jugador en la posicion aleatoria por una ficha del jugador actual
            jugadorActual.fichas[who].casilla = posFichas[posicionAleatoria];
            let numFicha = 0;
            for (let jugador of estadoJugadores.jugadores) {
                if (jugador.email === player) {
                    continue;
                }
                for (let ficha of jugador.fichas) {
                    if (!ficha.meta && ficha.casilla === posFichas[posicionAleatoria]&&numFicha===0) {
                        ficha.casilla = casillaActual;
                        numFicha++;
                        break;
                    }
                }
                if(numFicha>0){
                    break;
                }                
            }

            // Y cambia a la ficha que habia ahi por la posicion en la que estaba el jugador actual
            
            break;
        case "Mal de ojo"://done 🈴
            let jugadorObjetivo = estadoJugadores.jugadores.find(j => j.email === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            jugadorObjetivo.efectosActivos.push({ resumenEfecto: "-3" });
            break;
        case "Antidoto"://done 🈴
            jugadorActual.efectosActivos.push({ resumenEfecto: "Antidoto" });
            break;
        case "Pickpocket"://done 🈴
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
        case "Dado envenenado"://done  🈴
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.email === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            jugadorObjetivo.efectosActivos.push({ resumenEfecto: "1-3" });
            break;
        case "Dado dorado"://done 🈴
            jugadorActual.efectosActivos.push({ resumenEfecto: "4-6" });
            break;
        case "Serpiente en tu bota"://done 🈴
            // Pasar una ronda entera
            const jugadorAfectado = estadoJugadores.jugadores.find(j => j.email === who);
            jugadorAfectado.efectosActivos.push({ resumenEfecto: "Salto de turno" });
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
            if(prohibidas){
                throw new Error("No puedes jugar esta carta en una serpiente o escalera");
            }
            casillaTablero.efecto = "Agujero de serpiente";
            // Coger posición del tablero aleatoria y teletransportar una ficha ahí
            break;
        case "Bolsillo roto"://done 🈴
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
            jugadorObjetivo = estadoJugadores.jugadores.find(j => j.email === who);
            if (!jugadorObjetivo) {
                throw new Error("Jugador objetivo no encontrado");
            }
            jugadorObjetivo.efectosActivos.push({ resumenEfecto: "Salto de turno" });
            break;
    }
    jugadorActual.cartaJugadaEnTurno = true;
    jugadorActual.cartasJugadas++;
    jugadorActual.mano = jugadorActual.mano.filter(c => c !== cartaNombre);
    jugadorActual.cementerio.push(cartaNombre);
    const partidaUpdated = await prisma.partida.update({
        where: { ID: partidaId },
        data: { snapshotJugadores: estadoJugadores, snapshotTablero: tableroPartida },
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