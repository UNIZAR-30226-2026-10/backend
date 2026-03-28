import {LobbyManager} from "../managers/lobbyManager"
import assert from 'node:assert/strict'
import test, {describe, beforeEach} from 'node:test'

describe("Lobby Manager", () => {
    let manager
    beforeEach(() => {
        manager = new LobbyManager()
    })

    test("Crear Lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        assert.equal(lobby.idCreador, "ag@gmail.com")
        assert.equal(lobby.numJugadores, 1)
        assert.equal(lobby.jugadores[0].idJugador, "ag@gmail.com")
        assert.equal(lobby.numBots, 0)
    })
    test("Crear Lobby cuando ya estás en un lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        assert.throws(() => {
            manager.createLobby("ag@gmail.com", "ag")
        }, new Error("ALREADY_IN_A_LOBBY"))
    })
    test("Unirse a un Lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com","aplayer", lobby.idLobby)
        assert.equal(lobby.numJugadores, 2)
        assert.equal(lobby.jugadores[1].idJugador, "aplayer@gmail.com")
    })
    test("Unirse a un Lobby cuando ya estás en un lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com", "aplayer", lobby.idLobby)
        let lobby2 = manager.createLobby("another@gmail.com", "another")
        assert.throws(() => {
            manager.joinLobby("aplayer@gmail.com", "aplayer", lobby2.idLobby)
        }, new Error("ALREADY_IN_A_LOBBY"))
    })
    test("Unirse a un Lobby que no existe", () => {
        assert.throws(() => {
            manager.joinLobby("ag@gmail.com", "ag", "noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Añadir un bot a un lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        manager.addBot(lobby.idCreador,lobby.idLobby)
        assert.equal(lobby.numBots, 1)
    })
    test("Añadir un bot cuando no eres el líder", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com", "aplayer", lobby.idLobby)
        assert.throws(() => {
            manager.addBot("aplayer@gmail.com", lobby.idLobby)
        }, new Error("CANT_ADD"))
    })
    test("Unir jugador a un lobby lleno", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com", "aplayer", lobby.idLobby)
        lobby = manager.joinLobby("another@gmail.com", "another", lobby.idLobby)
        lobby = manager.joinLobby("otro@gmail.com", "otro", lobby.idLobby)
        assert.throws(() => {
            manager.joinLobby("full@gmail.com", "full", lobby.idLobby)
        }, new Error("LOBBY_IS_FULL"))
    })
    test ("Añadir bot a un lobby lleno", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com", "aplayer", lobby.idLobby)
        lobby = manager.joinLobby("another@gmail.com", "another", lobby.idLobby)
        lobby = manager.joinLobby("otro@gmail.com", "otro", lobby.idLobby)
        assert.throws(() => {
            manager.addBot("ag@gmail.com", lobby.idLobby)
        }, new Error("LOBBY_IS_FULL"))
    })
    test("Expulsar jugador de un lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com", "aplayer", lobby.idLobby)
        let devuelto = manager.deletePlayer("ag@gmail.com", "aplayer@gmail.com", lobby.idLobby)
        assert.equal(lobby.numJugadores, 1)
        assert.equal(devuelto, "PLAYER_KICKED")
    })
    test("Salir de un Lobby siendo el líder", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        let devuelto = manager.deletePlayer("ag@gmail.com", "ag@gmail.com", lobby.idLobby)
        assert.equal(devuelto, "LEADER_EXITED")
        assert.throws(() => {
            manager.getLobby(lobby.idLobby)
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Salir de un Lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com", "aplayer", lobby.idLobby)
        let devuelto = manager.deletePlayer("aplayer@gmail.com", "aplayer@gmail.com", lobby.idLobby)
        assert.equal(lobby.numJugadores, 1)
        assert.equal(devuelto, "PLAYER_LEFT")
    })
    test("Expulsar a un jugador de una lobby inexistente", () => {
        assert.throws(() => {
            manager.deletePlayer("ag@gmail.com", "aplayer@gmail.com", "noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Expulsar a un jugador sin ser el líder", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com", "aplayer", lobby.idLobby)
        assert.throws(() => {
            manager.deletePlayer("aplayer@gmail.com", "ag@gmail.com", lobby.idLobby)
        }, new Error("CANT_KICK"))
    })
    test("Expulsar a un jugador que no está en el lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        assert.throws(() => {
            manager.deletePlayer("ag@gmail.com", "aplayer@gmail.com", lobby.idLobby)
        }, new Error("NOT_IN_LOBBY"))
    })
    test("Expulsar a un bot del lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.addBot(lobby.idCreador, lobby.idLobby)
        let botId = lobby.jugadores[1].idJugador
        let devuelto = manager.deletePlayer("ag@gmail.com", botId, lobby.idLobby)
        assert.equal(lobby.numBots, 0)
        assert.equal(devuelto, "PLAYER_KICKED")
    })
    test("Seleccionar mazo", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        lobby = manager.joinLobby("aplayer@gmail.com", "aplayer", lobby.idLobby)
        manager.selectDeck("ag@gmail.com", lobby.idLobby, "mazo1")
        assert.equal(lobby.jugadores[0].nombreMazo, "mazo1")
    })
    test("Seleccionar mazo sin estar en el lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        assert.throws(() => {
            manager.selectDeck("aplayer@gmail.com", lobby.idLobby, "mazo1")
        }, new Error("WRONG_LOBBY"))
    })
    test("Seleccionar mazo en un lobby que no existe", () => {
        assert.throws(() => {
            manager.selectDeck("ag@gmail.com", "noexiste", "mazo1")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Obtener una lobby existente",  () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        let obtenida = manager.getLobby(lobby.idLobby)
        assert.deepStrictEqual(lobby, obtenida)
    })
    test("Obtener una lobby que no existe",  () => {
        assert.throws(() => {
            manager.getLobby("noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Eliminar Lobby existente", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        let eliminado = manager.deleteLobby(lobby.idLobby)
        assert.equal(eliminado, "LOBBY_DELETED")
    })
    test("Eliminar Lobby que no existe", () => {
        assert.throws(() => {
            manager.deleteLobby("noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Poner jugador listo", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        manager.setReady(lobby.idLobby, "ag@gmail.com", true)
        assert.equal(lobby.jugadores[0].estaListo, true)   
    })
    test("Poner jugador listo sin estar en el lobby", () => {
        let lobby = manager.createLobby("ag@gmail.com", "ag")
        assert.throws(() => {
            manager.setReady(lobby.idLobby, "aplayer@gmail.com", true)
        }, new Error("WRONG_LOBBY"))
    })
    test("Poner jugador listo en un lobby que no existe", () => {
        assert.throws(() => {
            manager.setReady("noexiste", "ag@gmail.com", true)
        }, new Error("LOBBY_NOT_FOUND"))
    })
})