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
    tablero: string,
    idPartida?: string
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
            tablero: "Basico"
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

    manageInvite(jugador: jugadorLobby, accept: boolean, lobbyId: string, inviteFrom: string): Lobby | string {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")

        let invites = this.invitaciones.get(jugador.nombre)
        if (!invites || invites.length === 0) throw new Error("INVITES_NOT_FOUND")
        const invite = invites.find(i => i.inviteFrom === inviteFrom && i.lobbyID === lobbyId)
        if (!invite) throw new Error("INVITE_NOT_FOUND")
        if (accept) {
            if (this.jugadoresEnCola.has(jugador.nombre)) {
                if (lobbyId === this.jugadoresEnCola.get(jugador.nombre)) {
                    invites = invites.filter(i => i.lobbyID !== lobbyId || i.inviteFrom !== inviteFrom)
                    this.invitaciones.set(jugador.nombre, invites)
                    return lobby
                } else {
                this.deletePlayer(jugador.nombre, jugador.nombre, this.jugadoresEnCola.get(jugador.nombre)!)
                }
            }
            const updatedLobby = this.joinLobby(jugador, lobbyId)
            for (const [player, playerInvites] of this.invitaciones.entries()) {
                this.invitaciones.set(player, playerInvites.filter(i => i.inviteFrom !== jugador.nombre))
            }
            invites = invites.filter(i => i.lobbyID !== lobbyId || i.inviteFrom !== inviteFrom)
            this.invitaciones.set(jugador.nombre, invites)
            return updatedLobby
        } else {
            invites = invites.filter(i => !(i.lobbyID === lobbyId && i.inviteFrom === inviteFrom))
            this.invitaciones.set(jugador.nombre, invites)
            return "INVITE_DECLINED"
        }
    }

    getInvitesOfPlayer(idJugador: string): invitation[] {
        const invites = this.invitaciones.get(idJugador)
        if (!invites) return []
        return [...invites]
    }


    joinLobby(jugador: jugadorLobby, lobbyId: string): Lobby {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (lobby.numJugadores >= 4) throw new Error("LOBBY_IS_FULL")
        if (this.jugadoresEnCola.has(jugador.nombre)) throw new Error("ALREADY_IN_A_LOBBY")
        lobby.jugadores.push(jugador)
        lobby.numJugadores++
        this.jugadoresEnCola.set(jugador.nombre, lobbyId)
        return lobby
    }

    addBot(requestBy: string, lobbyId: string): Lobby {
        const lobby = this.lobbies.get(lobbyId)
        if (!this.jugadoresEnCola.has(requestBy)) throw new Error("NOT_IN_A_LOBBY")
        if (this.jugadoresEnCola.get(requestBy) !== lobbyId) throw new Error("WRONG_LOBBY")
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (lobby.numJugadores >= 4) throw new Error("LOBBY_IS_FULL")
        if (lobby.usernameCreador !== requestBy) throw new Error("CANT_ADD")
        const nombre = 'BOT ' + nombresBots[Math.floor(Math.random() * nombresBots.length)]
        lobby.jugadores.push({ nombre: nombre, esIA: true, estaListo: true, nombreMazo: "Mazo IA" })
        lobby.numBots++
        lobby.numJugadores++
        return lobby
    }

    deletePlayer(requestBy: string, idJugador: string, lobbyId: string): Lobby {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (requestBy !== lobby.usernameCreador) {
            if (requestBy !== idJugador) {
                throw new Error("CANT_KICK")
            } else if (this.jugadoresEnCola.get(idJugador) === lobbyId) {
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
                this.lobbies.delete(lobbyId)
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

    selectDeck(idJugador: string, lobbyId: string, mazo: string): Lobby { // El mazo esta verificado que existe para el jugador, no lo verificamos aquí
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (this.jugadoresEnCola.get(idJugador) !== lobbyId) throw new Error("WRONG_LOBBY")
        const jugador = lobby.jugadores.find(i => i.nombre === idJugador)
        if (!jugador) throw new Error("NOT_IN_LOBBY")
        jugador.nombreMazo = mazo
        return lobby
    }

    changeBoard(requestBy: string, lobbyId: string, tablero: string): Lobby {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (requestBy !== lobby.usernameCreador) throw new Error("CANT_CHANGE_BOARD")
        lobby.tablero = tablero
        return lobby
    }

    getLobbyById(lobbyId: string): Lobby {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        return lobby
    }

    getLobbyOfPlayer(idJugador: string): Lobby {
        const lobbyId = this.jugadoresEnCola.get(idJugador)
        if (!lobbyId) throw new Error("NOT_IN_A_LOBBY")
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        return lobby
    }

    deleteLobby(lobbyId: string): string {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        lobby.jugadores.forEach(jugador => {
            if (!jugador.esIA) {
                this.jugadoresEnCola.delete(jugador.nombre)
            }
        });
        this.lobbies.delete(lobbyId)
        return "LOBBY_DELETED"
    }

    setReady(lobbyId: string, idJugador: string, ready: boolean): Lobby {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) throw new Error("LOBBY_NOT_FOUND")
        if (this.jugadoresEnCola.get(idJugador) !== lobbyId) throw new Error("WRONG_LOBBY")
        const jugador = lobby.jugadores.find(i => i.nombre === idJugador)
        if (!jugador) throw new Error("NOT_IN_LOBBY")
        jugador.estaListo = ready
        return lobby
    }

    updateUsername(oldUsername: string, newUsername: string): void {
        const lobbyId = this.jugadoresEnCola.get(oldUsername)
        if (lobbyId) {
            const lobby = this.lobbies.get(lobbyId)
            if (!lobby) throw new Error("LOBBY_NOT_FOUND")
            const jugador = lobby.jugadores.find(i => i.nombre === oldUsername)
            if (!jugador) throw new Error("PLAYER_NOT_FOUND")
            jugador.nombre = newUsername
            this.jugadoresEnCola.delete(oldUsername)
            this.jugadoresEnCola.set(newUsername, lobbyId)
            if (lobby.usernameCreador === oldUsername) {
                lobby.usernameCreador = newUsername
            }
        }
        const invitesUpdated: [string, invitation[]][] = []
        for (const [player, invites] of this.invitaciones.entries()) {
            const updatedInvites = invites.map(invite => ({
                ...invite,
                inviteFrom: invite.inviteFrom === oldUsername ? newUsername : invite.inviteFrom,
                inviteFor:  invite.inviteFor  === oldUsername ? newUsername : invite.inviteFor,
            }))
            invitesUpdated.push([player === oldUsername ? newUsername : player, updatedInvites])
        }
        this.invitaciones = new Map(invitesUpdated)
    }

    updateIcon (username: string, icono: string): void {
        const lobbyId = this.jugadoresEnCola.get(username)
        if (lobbyId) {
            const lobby = this.lobbies.get(lobbyId)
            if (!lobby) throw new Error("LOBBY_NOT_FOUND")
            const jugador = lobby.jugadores.find(i => i.nombre === username)
            if (!jugador) throw new Error("PLAYER_NOT_FOUND")
            jugador.icono = icono
        } else {
            throw new Error("NOT_IN_A_LOBBY")
        }
    }
}

export const lobbyManager = new LobbyManager()