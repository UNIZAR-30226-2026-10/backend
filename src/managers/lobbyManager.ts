import nombresBots from "../data/nombresBots.json" with {type: "json"}


interface jugadorLobby {
    nombre: string,    // nombre de usuario para mostrar en pantalla
    esIA: boolean,
    estaListo: boolean,
    nombreMazo?: string
    icono?: string
}

interface Lobby {
    idLobby: string,
    usernameCreador: string,
    jugadores: jugadorLobby[],
    numJugadores: number,
    numBots: number,
    tablero: string
}

interface invitation {
    inviteFor: string,
    inviteFrom: string,
    lobbyID: string
}

export class LobbyManager {
    private numLobbies = 0
    private lobbies: Map<string, Lobby>
    private jugadoresEnCola: Map<string, string>
    private invitaciones: Map<string, invitation[]>

    constructor() {
        this.lobbies = new Map()
        this.jugadoresEnCola = new Map()
        this.invitaciones = new Map()
    }

    createLobby(jugador: jugadorLobby): Lobby {
        if (this.jugadoresEnCola.has(jugador.nombre)) throw new Error("ALREADY_IN_A_LOBBY")
        const id = 'lobby-' + this.numLobbies
        this.numLobbies++
        const nuevaLobby: Lobby = {
            idLobby: id,
            usernameCreador: jugador.nombre,
            jugadores: [jugador],
            numJugadores: 1,
            numBots: 0,
            tablero: "Tablero 1"
        }
        this.lobbies.set(id, nuevaLobby)
        this.jugadoresEnCola.set(jugador.nombre, id)
        return nuevaLobby
    }

    sendInvite(invite: invitation): string {
        const lobby = this.lobbies.get(invite.lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        const myInvites = this.invitaciones.get(invite.inviteFor) || []
        if (myInvites.some(i => i.inviteFrom === invite.inviteFrom && i.lobbyID === invite.lobbyID)) throw new Error("INVITE_ALREADY_SENT")
        myInvites.push(invite)
        this.invitaciones.set(invite.inviteFor, myInvites)
        return "INVITE_SENT"
    }

    manageInvite(jugador: jugadorLobby, accept: boolean, lobbyID: string, inviteFrom: string): Lobby | string {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")

        let invites = this.invitaciones.get(jugador.nombre)
        if (!invites || invites.length === 0) throw new Error("INVITES_NOT_FOUND")
        const invite = invites.find(i => i.inviteFrom === inviteFrom && i.lobbyID === lobbyID)
        if (!invite) throw new Error("INVITE_NOT_FOUND")
        if (accept) {
            const lobby = this.joinLobby(jugador, lobbyID)
            invites = invites.filter(i => i.lobbyID !== lobbyID && i.inviteFrom !== inviteFrom)
            this.invitaciones.set(jugador.nombre, invites)
            return lobby
        } else {
            invites = invites.filter(i => !(i.lobbyID === lobbyID && i.inviteFrom === inviteFrom))
            this.invitaciones.set(jugador.nombre, invites)
            return "INVITE_DECLINED"
        }
    }

    getInvitesOfPlayer(idJugador: string): invitation[] {
        const invites = this.invitaciones.get(idJugador)
        if (!invites) return []
        return [...invites]
    }


    joinLobby(jugador: jugadorLobby, lobbyID: string): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (lobby.numJugadores >= 4) throw new Error("LOBBY_IS_FULL")
        if (this.jugadoresEnCola.has(jugador.nombre)) throw new Error("ALREADY_IN_A_LOBBY")
        lobby.jugadores.push(jugador)
        lobby.numJugadores++
        this.jugadoresEnCola.set(jugador.nombre, lobbyID)
        return lobby
    }

    addBot(requestBy: string, lobbyID: string): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!this.jugadoresEnCola.has(requestBy)) throw new Error("NOT_IN_A_LOBBY")
        if (this.jugadoresEnCola.get(requestBy) !== lobbyID) throw new Error("WRONG_LOBBY")
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (lobby.numJugadores >= 4) throw new Error("LOBBY_IS_FULL")
        if (lobby.usernameCreador !== requestBy) throw new Error("CANT_ADD")
        const nombre = 'BOT ' + nombresBots[Math.floor(Math.random() * nombresBots.length)]
        lobby.jugadores.push({nombre: nombre, esIA: true, estaListo: true, nombreMazo: "mazoPorDefecto" })
        lobby.numBots++
        lobby.numJugadores++
        return lobby
    }

    deletePlayer(requestBy: string, idJugador: string, lobbyID: string): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (requestBy !== lobby.usernameCreador) {
            if (requestBy !== idJugador) {
                throw new Error("CANT_KICK")
            } else if (this.jugadoresEnCola.get(idJugador) === lobbyID) {
                lobby.numJugadores--
                lobby.jugadores = lobby.jugadores.filter(i => i.nombre !== idJugador)
                this.jugadoresEnCola.delete(idJugador)
                return lobby
            } else {
                throw new Error("WRONG_LOBBY")
            }
        } else {
            if (lobby.usernameCreador === idJugador) {
                lobby.jugadores.forEach(jugador => {
                    if (!jugador.esIA) {
                        this.jugadoresEnCola.delete(jugador.nombre)
                    }
                });
                this.lobbies.delete(lobbyID)
                return lobby
            } else {
                const aEliminar = lobby.jugadores.find(i => i.nombre === idJugador)
                if (!aEliminar) {
                    throw new Error("NOT_IN_LOBBY")
                } else {
                    if (aEliminar.esIA) {
                        lobby.numBots--
                    } else {
                        this.jugadoresEnCola.delete(idJugador)
                    }
                    lobby.jugadores = lobby.jugadores.filter(i => i.nombre !== idJugador)
                    lobby.numJugadores--
                    return lobby
                }
            }
        }
    }

    selectDeck(idJugador: string, lobbyID: string, mazo: string): Lobby { // El mazo esta verificado que existe para el jugador, no lo verificamos aquí
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (this.jugadoresEnCola.get(idJugador) !== lobbyID) throw new Error("WRONG_LOBBY")
        const jugador = lobby.jugadores.find(i => i.nombre === idJugador)
        if (!jugador) throw new Error("NOT_IN_LOBBY")
        jugador.nombreMazo = mazo
        return lobby
    }

    changeBoard(requestBy: string, lobbyID: string, tablero: string): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (requestBy !== lobby.usernameCreador) throw new Error("CANT_CHANGE_BOARD")
        lobby.tablero = tablero
        return lobby
    }

    getLobbyById(lobbyID: string): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        return lobby
    }
    
    getLobbyOfPlayer(idJugador: string): Lobby {
        const lobbyID = this.jugadoresEnCola.get(idJugador)
        if (!lobbyID) throw new Error("NOT_IN_A_LOBBY")
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        return lobby
    }

    deleteLobby(lobbyID: string): string {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        lobby.jugadores.forEach(jugador => {
            if (!jugador.esIA) {
                this.jugadoresEnCola.delete(jugador.nombre)
            }
        });
        this.lobbies.delete(lobbyID)
        return "LOBBY_DELETED"
    }

    setReady(lobbyID: string, idJugador: string, ready: boolean): Lobby {
        const lobby = this.lobbies.get(lobbyID)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (this.jugadoresEnCola.get(idJugador) !== lobbyID) throw new Error("WRONG_LOBBY")
        const jugador = lobby.jugadores.find(i => i.nombre === idJugador)
        if (!jugador) throw new Error("NOT_IN_LOBBY")
        jugador.estaListo = ready
        return lobby
    }
}

export const lobbyManager = new LobbyManager()