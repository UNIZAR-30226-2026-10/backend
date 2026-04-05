import {LobbyManager} from "../managers/lobbyManager"
import assert from 'node:assert/strict'
import test, {describe, beforeEach} from 'node:test'

describe("Lobby Manager", () => {
    let manager
    beforeEach(() => {
        manager = new LobbyManager()
    })

    test("Crear Lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        assert.equal(lobby.idCreador, "ag@gmail.com")
        assert.equal(lobby.numJugadores, 1)
        assert.equal(lobby.jugadores[0].idJugador, "ag@gmail.com")
        assert.equal(lobby.numBots, 0)
    })
    test("Crear Lobby cuando ya estás en un lobby", () => {
        manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        assert.throws(() => {
            manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        }, new Error("ALREADY_IN_A_LOBBY"))
    })
    test("Unirse a un Lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        assert.equal(lobby.numJugadores, 2)
        assert.equal(lobby.jugadores[1].idJugador, "aplayer@gmail.com")
    })
    test("Unirse a un Lobby cuando ya estás en un lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        let lobby2 = manager.createLobby({idJugador: "another@gmail.com", nombre: "another", esIA: false, estaListo: false})
        assert.throws(() => {
            manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby2.idLobby)
        }, new Error("ALREADY_IN_A_LOBBY"))
    })
    test("Unirse a un Lobby que no existe", () => {
        assert.throws(() => {
            manager.joinLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false}, "noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Añadir un bot a un lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        manager.addBot(lobby.idCreador,lobby.idLobby)
        assert.equal(lobby.numBots, 1)
    })
    test("Añadir un bot cuando no eres el líder", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        assert.throws(() => {
            manager.addBot("aplayer@gmail.com", lobby.idLobby)
        }, new Error("CANT_ADD"))
    })
    test("Unir jugador a un lobby lleno", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        lobby = manager.joinLobby({idJugador: "another@gmail.com", nombre: "another", esIA: false, estaListo: false}, lobby.idLobby)
        lobby = manager.joinLobby({idJugador: "otro@gmail.com", nombre: "otro", esIA: false, estaListo: false}, lobby.idLobby)
        assert.throws(() => {
            manager.joinLobby({idJugador: "full@gmail.com", nombre: "full", esIA: false, estaListo: false}, lobby.idLobby)
        }, new Error("LOBBY_IS_FULL"))
    })
    test ("Añadir bot a un lobby lleno", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        lobby = manager.joinLobby({idJugador: "another@gmail.com", nombre: "another", esIA: false, estaListo: false}, lobby.idLobby)
        lobby = manager.joinLobby({idJugador: "otro@gmail.com", nombre: "otro", esIA: false, estaListo: false}, lobby.idLobby)
        assert.throws(() => {
            manager.addBot("ag@gmail.com", lobby.idLobby)
        }, new Error("LOBBY_IS_FULL"))
    })
    test("Expulsar jugador de un lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        let devuelto = manager.deletePlayer("ag@gmail.com", "aplayer@gmail.com", lobby.idLobby)
        assert.equal(lobby.numJugadores, 1)
        assert.equal(devuelto, "PLAYER_KICKED")
    })
    test("Salir de un Lobby siendo el líder", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        let devuelto = manager.deletePlayer("ag@gmail.com", "ag@gmail.com", lobby.idLobby)
        assert.equal(devuelto, "LEADER_EXITED")
        assert.throws(() => {
            manager.getLobby(lobby.idLobby)
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Salir de un Lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
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
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        assert.throws(() => {
            manager.deletePlayer("aplayer@gmail.com", "ag@gmail.com", lobby.idLobby)
        }, new Error("CANT_KICK"))
    })
    test("Expulsar a un jugador que no está en el lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        assert.throws(() => {
            manager.deletePlayer("ag@gmail.com", "aplayer@gmail.com", lobby.idLobby)
        }, new Error("NOT_IN_LOBBY"))
    })
    test("Expulsar a un bot del lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.addBot(lobby.idCreador, lobby.idLobby)
        let botId = lobby.jugadores[1].idJugador
        let devuelto = manager.deletePlayer("ag@gmail.com", botId, lobby.idLobby)
        assert.equal(lobby.numBots, 0)
        assert.equal(devuelto, "PLAYER_KICKED")
    })
    test("Seleccionar mazo", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        manager.selectDeck("ag@gmail.com", lobby.idLobby, "mazo1")
        assert.equal(lobby.jugadores[0].nombreMazo, "mazo1")
    })
    test("Seleccionar mazo sin estar en el lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
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
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        let obtenida = manager.getLobby(lobby.idLobby)
        assert.deepStrictEqual(lobby, obtenida)
    })
    test("Obtener una lobby que no existe",  () => {
        assert.throws(() => {
            manager.getLobby("noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Eliminar Lobby existente", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        let eliminado = manager.deleteLobby(lobby.idLobby)
        assert.equal(eliminado, "LOBBY_DELETED")
    })
    test("Eliminar Lobby que no existe", () => {
        assert.throws(() => {
            manager.deleteLobby("noexiste")
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Poner jugador listo", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        manager.setReady(lobby.idLobby, "ag@gmail.com", true)
        assert.equal(lobby.jugadores[0].estaListo, true)   
    })
    test("Poner jugador listo sin estar en el lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        assert.throws(() => {
            manager.setReady(lobby.idLobby, "aplayer@gmail.com", true)
        }, new Error("WRONG_LOBBY"))
    })
    test("Poner jugador listo en un lobby que no existe", () => {
        assert.throws(() => {
            manager.setReady("noexiste", "ag@gmail.com", true)
        }, new Error("LOBBY_NOT_FOUND"))
    })
    test("Cambiar tablero siendo el lider del lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        manager.changeBoard("ag@gmail.com", lobby.idLobby, "tablero33")
        assert.equal(lobby.tablero, "tablero33")
    })
    test("Cambiar tablero sin ser el lider del lobby", () => {
        let lobby = manager.createLobby({idJugador: "ag@gmail.com", nombre: "ag", esIA: false, estaListo: false})
        lobby = manager.joinLobby({idJugador: "aplayer@gmail.com", nombre: "aplayer", esIA: false, estaListo: false}, lobby.idLobby)
        assert.throws(() => {
            manager.changeBoard("aplayer@gmail.com", lobby.idLobby, "tablero33")
        }, new Error("CANT_CHANGE_BOARD"))
    })
    test("Cambiar tablero en un lobby que no existe", () => {
        assert.throws(() => {
            manager.changeBoard("ag@gmail.com", "noexiste", "tablero33")
        }, new Error("LOBBY_NOT_FOUND"))
    })

})