import { SnapshotJugadoresJSON } from "./JsonTypes.js";

const CARTAS_BOT = [
    "Exceso de medios",
    "Dado dorado",
    "Mal de ojo",
    "Dado envenenado",
    "Noqueo",
    "Bolsillo roto"
];

const CARTAS_CON_OBJETIVO = [
    "Mal de ojo",
    "Dado envenenado",
    "Noqueo",
    "Bolsillo roto"
];

export function isBotPlayer(estado: SnapshotJugadoresJSON, username: string): boolean {
    const jugador = estado.jugadores.find(j => j.username === username);
    return jugador?.esIA === true;
}

export function selectBotCard(mano: string[] | undefined): string | undefined {
    if (!mano || mano.length === 0) {
        return undefined;
    }

    return mano.find(carta => CARTAS_BOT.includes(carta));
}

export function selectBotTarget(
    estado: SnapshotJugadoresJSON,
    botUsername: string,
    carta: string
): string | undefined {
    if (!CARTAS_CON_OBJETIVO.includes(carta)) {
        return undefined;
    }

    const rivales = estado.jugadores.filter(j => j.username !== botUsername);
    if (rivales.length === 0) {
        return undefined;
    }

    const index = Math.floor(Math.random() * rivales.length);
    return rivales[index].username;
}

export function selectBotMove(
    movimientos: SnapshotJugadoresJSON["jugadores"][number]["movimientosPermitidos"] | undefined
): SnapshotJugadoresJSON["jugadores"][number]["movimientosPermitidos"][number] | undefined {
    if (!movimientos || movimientos.length === 0) {
        return undefined;
    }

    const index = Math.floor(Math.random() * movimientos.length);
    return movimientos[index];
}
