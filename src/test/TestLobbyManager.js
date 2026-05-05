import { LobbyManager } from "../managers/lobbyManager"
import assert from 'node:assert/strict'
import test, { describe, beforeEach } from 'node:test'

describe("Lobby Manager", () => {
    let manager
    beforeEach(() => {
        manager = new LobbyManager()
    })

    test("Crear Lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        assert.equal(lobby.usernameCreador, "ag")
        assert.equal(lobby.numJugadores, 1)
        assert.equal(lobby.jugadores[0].nombre, "ag")
        assert.equal(lobby.numBots, 0)
    })
    test("Crear Lobby cuando ya estás en un lobby", () => {
        manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        assert.throws(() => {
            manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        }, new Error("ALREADY_IN_A_LOBBY"))
    })
    test("Unirse a un Lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        assert.equal(lobby.numJugadores, 2)
        assert.equal(lobby.jugadores[1].nombre, "aplayer")
    })
    test("Unirse a un Lobby cuando ya estás en un lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        let lobby2 = manager.createLobby({ nombre: "another", esIA: false, estaListo: false })
        assert.throws(() => {
            manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby2.idLobby)
        }, new Error("ALREADY_IN_A_LOBBY"))
    })
    test("Unirse a un Lobby que no existe", () => {
        assert.throws(() => {
            manager.joinLobby({ nombre: "ag", esIA: false, estaListo: false }, "noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Añadir un bot a un lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        manager.addBot(lobby.usernameCreador, lobby.idLobby)
        assert.equal(lobby.numBots, 1)
    })
    test("Añadir un bot cuando no eres el líder", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        assert.throws(() => {
            manager.addBot("aplayer", lobby.idLobby)
        }, new Error("CANT_ADD"))
    })
    test("Unir jugador a un lobby lleno", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        lobby = manager.joinLobby({ nombre: "another", esIA: false, estaListo: false }, lobby.idLobby)
        lobby = manager.joinLobby({ nombre: "otro", esIA: false, estaListo: false }, lobby.idLobby)
        assert.throws(() => {
            manager.joinLobby({ nombre: "full", esIA: false, estaListo: false }, lobby.idLobby)
        }, new Error("LOBBY_IS_FULL"))
    })
    test("Añadir bot a un lobby lleno", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        lobby = manager.joinLobby({ nombre: "another", esIA: false, estaListo: false }, lobby.idLobby)
        lobby = manager.joinLobby({ nombre: "otro", esIA: false, estaListo: false }, lobby.idLobby)
        assert.throws(() => {
            manager.addBot(lobby.usernameCreador, lobby.idLobby)
        }, new Error("LOBBY_IS_FULL"))
    })
    test("Expulsar jugador de un lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        let devuelto = manager.deletePlayer("ag", "aplayer", lobby.idLobby)
        assert.equal(lobby.numJugadores, 1)
        assert.equal(devuelto, lobby)
    })
    test("Salir de un Lobby siendo el líder", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        let devuelto = manager.deletePlayer("ag", "ag", lobby.idLobby)
        assert.equal(devuelto, lobby)
        assert.throws(() => {
            manager.getLobby(lobby.idLobby)
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Salir de un Lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        let devuelto = manager.deletePlayer("aplayer", "aplayer", lobby.idLobby)
        assert.equal(lobby.numJugadores, 1)
        assert.equal(devuelto, lobby)
    })
    test("Expulsar a un jugador de una lobby inexistente", () => {
        assert.throws(() => {
            manager.deletePlayer("ag", "aplayer", "noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Expulsar a un jugador sin ser el líder", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        assert.throws(() => {
            manager.deletePlayer("aplayer", "ag", lobby.idLobby)
        }, new Error("CANT_KICK"))
    })
    test("Expulsar a un jugador que no está en el lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        assert.throws(() => {
            manager.deletePlayer("ag", "aplayer", lobby.idLobby)
        }, new Error("NOT_IN_LOBBY"))
    })
    test("Expulsar a un bot del lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.addBot(lobby.usernameCreador, lobby.idLobby)
        let botId = lobby.jugadores[1].nombre
        let devuelto = manager.deletePlayer("ag", botId, lobby.idLobby)
        assert.equal(lobby.numBots, 0)
        assert.equal(devuelto, lobby)
    })
    test("Seleccionar mazo", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        manager.selectDeck("ag", lobby.idLobby, "mazo1")
        assert.equal(lobby.jugadores[0].nombreMazo, "mazo1")
    })
    test("Seleccionar mazo sin estar en el lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        assert.throws(() => {
            manager.selectDeck("aplayer", lobby.idLobby, "mazo1")
        }, new Error("WRONG_LOBBY"))
    })
    test("Seleccionar mazo en un lobby que no existe", () => {
        assert.throws(() => {
            manager.selectDeck("ag", "noexiste", "mazo1")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Obtener una lobby existente", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        let obtenida = manager.getLobby(lobby.idLobby)
        assert.deepStrictEqual(lobby, obtenida)
    })
    test("Obtener una lobby que no existe", () => {
        assert.throws(() => {
            manager.getLobby("noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Eliminar Lobby existente", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        let eliminado = manager.deleteLobby(lobby.idLobby)
        assert.equal(eliminado, "LOBBY_DELETED")
    })
    test("Eliminar Lobby que no existe", () => {
        assert.throws(() => {
            manager.deleteLobby("noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Poner jugador listo", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        manager.setReady(lobby.idLobby, "ag", true)
        assert.equal(lobby.jugadores[0].estaListo, true)
    })
    test("Poner jugador listo sin estar en el lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        assert.throws(() => {
            manager.setReady(lobby.idLobby, "aplayer", true)
        }, new Error("WRONG_LOBBY"))
    })
    test("Poner jugador listo en un lobby que no existe", () => {
        assert.throws(() => {
            manager.setReady("noexiste", "ag", true)
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Cambiar tablero siendo el lider del lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        manager.changeBoard("ag", lobby.idLobby, "tablero33")
        assert.equal(lobby.tablero, "tablero33")
    })
    test("Cambiar tablero sin ser el lider del lobby", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        lobby = manager.joinLobby({ nombre: "aplayer", esIA: false, estaListo: false }, lobby.idLobby)
        assert.throws(() => {
            manager.changeBoard("aplayer", lobby.idLobby, "tablero33")
        }, new Error("CANT_CHANGE_BOARD"))
    })
    test("Cambiar tablero en un lobby que no existe", () => {
        assert.throws(() => {
            manager.changeBoard("ag", "noexiste", "tablero33")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Enviar una invitación correctamente", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        let resultado = manager.sendInvite({ inviteFrom: "ag", inviteFor: "invitado", lobbyID: lobby.idLobby })
        let invites = manager.getInvitesOfPlayer("invitado")
        assert.equal(resultado, "INVITE_SENT")
        assert.equal(invites.length, 1)
        assert.equal(invites[0].inviteFrom, "ag")
        assert.equal(invites[0].lobbyID, lobby.idLobby)
    })
    test("Enviar invitación duplicada a la misma sala", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        manager.sendInvite({ inviteFrom: "ag", inviteFor: "invitado", lobbyID: lobby.idLobby })
        assert.throws(() => {
            manager.sendInvite({ inviteFrom: "ag", inviteFor: "invitado", lobbyID: lobby.idLobby })
        }, new Error("INVITE_ALREADY_SENT"))
    })
    test("Aceptar invitación", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        manager.sendInvite({ inviteFrom: "ag", inviteFor: "invitado", lobbyID: lobby.idLobby })
        let jugadorInvitado = { nombre: "invitado", esIA: false, estaListo: false }
        let devuelto = manager.manageInvite(jugadorInvitado, true, lobby.idLobby, "ag")
        assert.equal(devuelto.idLobby, lobby.idLobby)
        assert.equal(lobby.numJugadores, 2)
        assert.equal(manager.getInvitesOfPlayer("invitado").length, 0)
    })

    test("Rechazar invitación", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        manager.sendInvite({ inviteFrom: "ag", inviteFor: "invitado", lobbyID: lobby.idLobby })
        let jugadorInvitado = { nombre: "invitado", esIA: false, estaListo: false }
        let devuelto = manager.manageInvite(jugadorInvitado, false, lobby.idLobby, "ag")
        assert.equal(devuelto, "INVITE_DECLINED")
        assert.equal(lobby.numJugadores, 1)
        assert.equal(manager.getInvitesOfPlayer("invitado").length, 0)
    })
    test("Aceptar o rechazar invitación en un lobby que no existe", () => {
        let lobby = manager.createLobby({ nombre: "ag", esIA: false, estaListo: false })
        manager.sendInvite({ inviteFrom: "ag", inviteFor: "invitado", lobbyID: lobby.idLobby })
        let jugadorInvitado = { nombre: "invitado", esIA: false, estaListo: false }
        manager.deleteLobby(lobby.idLobby)
        assert.throws(() => {
            manager.manageInvite(jugadorInvitado, true, lobby.idLobby, "ag")
        }, new Error("LOBBY_NOT_FOUND"))
    })
})