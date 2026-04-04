import nombresBots from "../data/nombresBots.json" with {type: "json"}


interface jugadorLobby {
    idJugador: string, // Si jugador real = email, si bot id inventado
    nombre: string,    // nombre de usuario para mostrar en pantalla
    esIA: boolean,
    estaListo: boolean,
    nombreMazo?: string
    icono?: string
}

interface Lobby {
    idLobby: string,
    idCreador: string,
    jugadores: jugadorLobby[],
    numJugadores: number,
    numBots: number ,
    tablero: string   
}

export class LobbyManager {
    private numLobbies = 0
    private lobbies: Map<string, Lobby>
    private jugadoresEnCola: Map<string, string>

    constructor() {
        this.lobbies = new Map()
        this.jugadoresEnCola = new Map()
    }

    createLobby(jugador: jugadorLobby): Lobby {
        if (this.jugadoresEnCola.has(jugador.idJugador)) throw new Error("ALREADY_IN_A_LOBBY")
        const id = 'lobby-' + this.numLobbies
        this.numLobbies++
        const nuevaLobby: Lobby = {
            idLobby: id,
            idCreador: jugador.idJugador,
            jugadores: [jugador],
            numJugadores: 1,
            numBots: 0,
            tablero: "Tablero 1"
        }
        this.lobbies.set(id, nuevaLobby)
        this.jugadoresEnCola.set(jugador.idJugador, id)
        return nuevaLobby
    }

    joinLobby(_idJugador: string, jugador: jugadorLobby, lobbyID: string): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (lobby.numJugadores >= 4) throw new Error("LOBBY_IS_FULL")
        if (this.jugadoresEnCola.has(_idJugador)) throw new Error("ALREADY_IN_A_LOBBY")
        lobby.jugadores.push(jugador)
        lobby.numJugadores++
        this.jugadoresEnCola.set(_idJugador, lobbyID)
        return lobby
    }

    addBot(requestBy: string, lobbyID: string): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!this.jugadoresEnCola.has(requestBy)) throw new Error("NOT_IN_A_LOBBY")
        if (this.jugadoresEnCola.get(requestBy) !== lobbyID) throw new Error("WRONG_LOBBY")
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (lobby.numJugadores >= 4) throw new Error("LOBBY_IS_FULL")
        if (lobby.idCreador !== requestBy) throw new Error("CANT_ADD")
        const nombre = 'BOT ' + nombresBots[Math.floor(Math.random() * nombresBots.length)]
        const idBot = `BOT-${nombre}-${crypto.randomUUID()}`
        lobby.jugadores.push({ idJugador: idBot, nombre, esIA: true, estaListo: true, nombreMazo: "mazoPorDefecto" })
        lobby.numBots++
        lobby.numJugadores++
        return lobby
    }

    deletePlayer(requestBy: string, idJugador: string, lobbyID: string) {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (requestBy !== lobby.idCreador) {
            if (requestBy !== idJugador) {
                throw new Error("CANT_KICK")
            } else if (this.jugadoresEnCola.get(idJugador) === lobbyID) {
                lobby.numJugadores--
                lobby.jugadores = lobby.jugadores.filter(i => i.idJugador !== idJugador)
                this.jugadoresEnCola.delete(idJugador)
                return "PLAYER_LEFT"
            } else {
                throw new Error("WRONG_LOBBY")
            }
        }
        if (requestBy === lobby.idCreador) {
            if (lobby.idCreador === idJugador) {
                lobby.jugadores.forEach(jugador => {
                    if (!jugador.esIA) {
                        this.jugadoresEnCola.delete(jugador.idJugador)
                    }
                });
                this.lobbies.delete(lobbyID)
                return "LEADER_EXITED"
            } else {
                const aEliminar = lobby.jugadores.find(i => i.idJugador === idJugador)
                if (!aEliminar) {
                    throw new Error("NOT_IN_LOBBY")
                } else {
                    if (aEliminar.esIA) {
                        lobby.numBots--
                    } else {
                        this.jugadoresEnCola.delete(idJugador)
                    }
                    lobby.jugadores = lobby.jugadores.filter(i => i.idJugador !== idJugador)
                    lobby.numJugadores--
                    return "PLAYER_KICKED"
                }
            }
        }
    }

    selectDeck(idJugador: string, lobbyID: string, mazo: string) { // El mazo esta verificado que existe para el jugador, no lo verificamos aquí
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (this.jugadoresEnCola.get(idJugador) !== lobbyID) throw new Error("WRONG_LOBBY")
        const jugador = lobby.jugadores.find(i => i.idJugador === idJugador)
        if (!jugador) throw new Error("NOT_IN_LOBBY")
        jugador.nombreMazo = mazo

    }

    changeBoard(requestBy: string, lobbyID: string, tablero: string) {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (requestBy !== lobby.idCreador) throw new Error("CANT_CHANGE_BOARD")
        lobby.tablero = tablero
    }

    getLobby(lobbyID: string): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        return lobby
    }

    deleteLobby(lobbyID: string) {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        lobby.jugadores.forEach(jugador => {
            if (!jugador.esIA) {
                this.jugadoresEnCola.delete(jugador.idJugador)
            }
        });
        this.lobbies.delete(lobbyID)
        return "LOBBY_DELETED"
    }

    setReady( lobbyID: string, idJugador: string, ready: boolean) {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (this.jugadoresEnCola.get(idJugador) !== lobbyID) throw new Error("WRONG_LOBBY")
        const jugador = lobby.jugadores.find(i => i.idJugador === idJugador)
        if (!jugador) throw new Error("NOT_IN_LOBBY")
        jugador.estaListo = ready
    }
}

export const lobbyManager = new LobbyManager()