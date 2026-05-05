import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { UnauthorizedSessionToken, ForbiddenSessionToken } from "./AuxFunctionsAPI.js";
import { lobbyManager } from "../../managers/lobbyManager.js";
import Boards from "../../services/Boards.js";
import User from "../../services/User.js";

export default function lobbiesRoutes(app: FastifyInstance): void {
    app.addHook("preHandler", app.verifyToken);

    app.post("/", {
        schema: {
            summary: "Crear un nuevo lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para crear un nuevo lobby. 
            La petición debe incluir el nombre de usuario del creador del lobby.
            El creador se convierte automaticamente en el líder del lobby.`,
            body: Type.Object({
                username: Type.String(),
            }),
            response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        nombre: Type.String(),
                        esIA: Type.Boolean(),
                        estaListo: Type.Boolean(),
                        nombreMazo: Type.Optional(Type.String()),
                        icono: Type.Optional(Type.String())
                    })),
                    numJugadores: Type.Number(),
                    numBots: Type.Number(),
                    tablero: Type.String()
                }),
                400: Type.Object({
                    error: Type.String()
                }),
                401: UnauthorizedSessionToken,
                409: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { username } = request.body as { username: string }
        let lobby
        try {
            lobby = lobbyManager.createLobby({
                nombre: username,
                esIA: false,
                estaListo: false
            })
            if (!lobby) {
                return reply.status(400).send({ error: "Error al crear el lobby" })
            }
        } catch (error) {
            return reply.status(409).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.get("/by-player/:username", {
        schema: {
            summary: "Obtener el lobby al que pertenece un jugador",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener el lobby al que pertenece un jugador. 
            La petición debe incluir el nombre de usuario del jugador.`,
            params: Type.Object({
                username: Type.String()
            }),
            response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        nombre: Type.String(),
                        esIA: Type.Boolean(),
                        estaListo: Type.Boolean(),
                        nombreMazo: Type.Optional(Type.String()),
                        icono: Type.Optional(Type.String())
                    })),
                    numJugadores: Type.Number(),
                    numBots: Type.Number(),
                    tablero: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { username } = request.params as { username: string }
        let lobby
        try {
            lobby = lobbyManager.getLobbyOfPlayer(username)
        } catch (error) {
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.get("/:lobbyId", {
        schema: {
            summary: "Obtener la información de un lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener la información de un lobby específico. 
            La petición debe incluir el ID del lobby del cual se quiere obtener la información.`,
            params: Type.Object({
                "lobbyId": Type.String()
            }),
            response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        nombre: Type.String(),
                        esIA: Type.Boolean(),
                        estaListo: Type.Boolean(),
                        nombreMazo: Type.Optional(Type.String()),
                        icono: Type.Optional(Type.String())
                    })),
                    numJugadores: Type.Number(),
                    numBots: Type.Number(),
                    tablero: Type.String()
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobbyId": lobbyId } = request.params as { "lobbyId": string }
        let lobby
        try {
            lobby = lobbyManager.getLobbyById(lobbyId)
        } catch (error) {
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.post("/:lobbyId/invitations", {
        schema: {
            summary: "Enviar una invitación a un amigo para unirse al lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para enviar una invitación a un amigo para unirse al lobby. 
            La petición debe incluir el ID del lobby al que se quiere invitar, el nombre de usuario de la persona que envía la invitación y el nombre de usuario de la persona a la que se quiere invitar.`,
            params: Type.Object({
                "lobbyId": Type.String()
            }),
            body: Type.Object({
                inviteFrom: Type.String(),
                inviteFor: Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: Type.Object({
                    error: Type.String()
                }),
                404: Type.Object({
                    error: Type.String()
                }),
                409: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobbyId": lobbyId } = request.params as { "lobbyId": string }
        const { inviteFrom, inviteFor } = request.body as { inviteFrom: string, inviteFor: string }
        let invite = {
            inviteFor: inviteFor,
            inviteFrom: inviteFrom,
            lobbyID: lobbyId
        }
        try {
            const user = await User.getUserByName(inviteFrom)
            if (!user) {
                return reply.status(404).send({ error: "Usuario que intenta invitar no encontrado" })
            }
            const esAmigo = user.amigos.some(amigo => amigo.nombre === inviteFor)
            if (!esAmigo) {
                return reply.status(403).send({ error: "Solo puedes invitar a tus amigos" })
            }
        } catch (error) {
            return reply.status(404).send({ error: "Usuario no encontrado" })
        }
        try {
            lobbyManager.sendInvite(invite)
        } catch (error) {
            if ((error as Error).message === "LOBBY_NOT_FOUND") {
                return reply.status(404).send({ error: "Lobby no encontrado" })
            }
            return reply.status(409).send({ error: (error as Error).message })
        }
        return reply.status(200).send({ message: "Invitación enviada con éxito" })
    })

    app.put("/:lobbyId/invitations", {
        schema: {
            summary: "Responder a una invitación para unirse al lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para responder a una invitación para unirse al lobby. 
            La petición debe incluir el ID del lobby al que se ha sido invitado, 
            el nombre de usuario de la persona que envió la invitación, 
            el nombre de usuario de la persona que responde la invitación y
            si acepta o rechaza la invitación.`,
            params: Type.Object({
                "lobbyId": Type.String()
            }),
            body: Type.Object({
                inviteFor: Type.String(),
                inviteFrom: Type.String(),
                accept: Type.Boolean()
            }),
            response: {
                200: Type.Union([
                    Type.Object({
                        message: Type.String()
                    }),
                    Type.Object({
                        idLobby: Type.String(),
                        idCreador: Type.String(),
                        jugadores: Type.Array(Type.Object({
                            nombre: Type.String(),
                            esIA: Type.Boolean(),
                            estaListo: Type.Boolean(),
                            nombreMazo: Type.Optional(Type.String()),
                            icono: Type.Optional(Type.String())
                        })),
                        numJugadores: Type.Number(),
                        numBots: Type.Number(),
                        tablero: Type.String()
                    }),
                ]),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                }),
                409: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobbyId": lobbyId } = request.params as { "lobbyId": string }
        const { inviteFor, inviteFrom, accept } = request.body as { inviteFor: string, inviteFrom: string, accept: boolean }
        let lobby
        let jugadorLobby = {
            nombre: inviteFor,
            esIA: false,
            estaListo: false
        }
        try {
            lobby = await lobbyManager.manageInvite(jugadorLobby, accept, lobbyId, inviteFrom)
        } catch (error) {
            if ((error as Error).message === "LOBBY_NOT_FOUND") {
                return reply.status(404).send({ error: (error as Error).message })
            }
            return reply.status(409).send({ error: (error as Error).message })
        }
        if (typeof lobby === "string") {
            return reply.status(200).send({ message: lobby })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.post("/:lobbyId/bots", {
        schema: {
            summary: "Agregar un bot a un lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para agregar un bot a un lobby. 
            La petición debe incluir el ID del lobby al que se quiere agregar el bot y 
            el nombre de usuario de la persona que solicita la acción.`,
            params: Type.Object({
                "lobbyId": Type.String()
            }),
            body: Type.Object({
                requested_by: Type.String()
            }),
            response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        nombre: Type.String(),
                        esIA: Type.Boolean(),
                        estaListo: Type.Boolean()
                    })),
                    numJugadores: Type.Number(),
                    numBots: Type.Number(),
                    tablero: Type.String()
                }),
                400: Type.Object({
                    error: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: Type.Object({
                    error: Type.String()
                }),
                404: Type.Object({
                    error: Type.String()
                }),
                409: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobbyId": lobbyId } = request.params as { "lobbyId": string }
        const { requested_by } = request.body as { requested_by: string }
        let lobby
        try {
            lobby = lobbyManager.addBot(requested_by, lobbyId)
        } catch (error) {
            if ((error as Error).message === "WRONG_LOBBY") {
                return reply.status(400).send({ error: (error as Error).message })
            }
            if ((error as Error).message === "LOBBY_IS_FULL") {
                return reply.status(409).send({ error: (error as Error).message })
            }
            if ((error as Error).message === "CANT_ADD") {
                return reply.status(403).send({ error: (error as Error).message })
            }
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.put("/:lobbyId/players/:username/deck", {
        schema: {
            summary: "Seleccionar el mazo con el que se jugará en el lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para seleccionar el mazo con el que se jugará en el lobby.
            La petición debe incluir el ID del lobby en el que se va a jugar, 
            el nombre de usuario de la persona que selecciona el mazo y 
            el nombre del mazo que se quiere seleccionar.`,
            params: Type.Object({
                "lobbyId": Type.String(),
                "username": Type.String()
            }),
            body: Type.Object({
                deck: Type.String()
            }), response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        nombre: Type.String(),
                        esIA: Type.Boolean(),
                        estaListo: Type.Boolean(),
                        nombreMazo: Type.Optional(Type.String()),
                        icono: Type.Optional(Type.String())
                    })),
                    numJugadores: Type.Number(),
                    numBots: Type.Number(),
                    tablero: Type.String()
                }),
                400: Type.Object({
                    error: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobbyId": lobbyId, "user": username } = request.params as { "lobbyId": string, "user": string }
        const { deck } = request.body as { deck: string }
        let lobby;
        try {
            const user = await User.getUserByName(username)
            if (!user) {
                return reply.status(404).send({ error: "Usuario no encontrado" })
            }
            const tieneMazo = user.barajas.some(m => m.nombre === deck)
            if (!tieneMazo) {
                return reply.status(404).send({ error: "El mazo seleccionado no existe" })
            }
        } catch (error) {
            return reply.status(404).send({ error: "Usuario no encontrado" })
        }
        try {
            lobby = lobbyManager.selectDeck(username, lobbyId, deck)
        } catch (error) {
            if ((error as Error).message === "WRONG_LOBBY") {
                return reply.status(400).send({ error: (error as Error).message })
            }
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.put("/:lobbyId/players/:username/ready", {
        schema: {
            summary: "Marcar a un jugador como listo para jugar en el lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para marcar a un jugador como listo para jugar en el lobby. 
            La petición debe incluir el ID del lobby en el que se va a jugar, 
            el nombre de usuario de la persona que se va a marcar como lista y 
            un booleano indicando si se marca como listo o no.`,
            params: Type.Object({
                "lobbyId": Type.String(),
                "username": Type.String()
            }),
            body: Type.Object({
                ready: Type.Boolean()
            }), response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        nombre: Type.String(),
                        esIA: Type.Boolean(),
                        estaListo: Type.Boolean(),
                        nombreMazo: Type.Optional(Type.String()),
                        icono: Type.Optional(Type.String())
                    })),
                    numJugadores: Type.Number(),
                    numBots: Type.Number(),
                    tablero: Type.String()
                }),
                400: Type.Object({
                    error: Type.String()
                }),
                403: ForbiddenSessionToken,
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobbyId": lobbyId, "username": username } = request.params as { "lobbyId": string, "username": string }
        const { ready } = request.body as { ready: boolean }
        let lobby
        try {
            lobby = lobbyManager.setReady(lobbyId, username, ready)
        } catch (error) {
            if ((error as Error).message === "WRONG_LOBBY") {
                return reply.status(400).send({ error: (error as Error).message })
            }
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.put("/:lobbyId/board", {
        schema: {
            summary: "Cambiar el tablero del lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para cambiar el tablero del lobby. 
            La petición debe incluir el ID del lobby al que se quiere cambiar el tablero, 
            el nombre de usuario de la persona que solicita la acción y 
            el nombre del nuevo tablero que se quiere establecer para el lobby.`,
            params: Type.Object({
                "lobbyId": Type.String()
            }),
            body: Type.Object({
                requested_by: Type.String(),
                board: Type.String()
            }), response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        nombre: Type.String(),
                        esIA: Type.Boolean(),
                        estaListo: Type.Boolean(),
                        nombreMazo: Type.Optional(Type.String()),
                        icono: Type.Optional(Type.String())
                    })),
                    numJugadores: Type.Number(),
                    numBots: Type.Number(),
                    tablero: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: Type.Object({
                    error: Type.String()
                }),
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobbyId": lobbyId } = request.params as { "lobbyId": string }
        const { board, requested_by } = request.body as { board: string, requested_by: string }
        let lobby
        try {
            lobby = lobbyManager.getLobbyById(lobbyId)
        } catch (error) {
            return reply.status(404).send({ error: "Lobby no encontrado" })
        }
        const tableros = await Boards.getAllBoards()
        const tableroExiste = tableros.some(t => t.nombre === board)
        if (!tableroExiste) {
            return reply.status(404).send({ error: "Tablero no encontrado" })
        }
        try {
            lobby = lobbyManager.changeBoard(requested_by, lobbyId, board)
        } catch (error) {
            if ((error as Error).message === "CANT_CHANGE_BOARD") {
                return reply.status(403).send({ error: (error as Error).message })
            }
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.delete("/:lobbyId/players/:targetUsername", {
        schema: {
            summary: "Eliminar a un jugador del lobby",
            tags: ["lobbies"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para eliminar a un jugador del lobby. 
            La petición debe incluir el ID del lobby del que se quiere eliminar al jugador, 
            el nombre de usuario del jugador que se quiere eliminar y 
            el nombre de usuario de la persona que solicita la acción.`,
            params: Type.Object({
                "lobbyId": Type.String(),
                "targetUsername": Type.String()
            }),
            body: Type.Object({
                requested_by: Type.String()
            }), response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        nombre: Type.String(),
                        esIA: Type.Boolean(),
                        estaListo: Type.Boolean(),
                        nombreMazo: Type.Optional(Type.String()),
                        icono: Type.Optional(Type.String())
                    })),
                    numJugadores: Type.Number(),
                    numBots: Type.Number(),
                    tablero: Type.String()
                }),
                400: Type.Object({
                    error: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: Type.Union([
                    ForbiddenSessionToken,
                    Type.Object({
                        error: Type.String()
                    })
                ]),
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobbyId": lobbyId, "targetUsername": targetUsername } = request.params as { "lobbyId": string, "targetUsername": string }
        const { requested_by } = request.body as { requested_by: string }
        let lobby
        try {
            lobby = lobbyManager.deletePlayer(requested_by, targetUsername, lobbyId)
        }
        catch (error) {
            if ((error as Error).message === "WRONG_LOBBY") {
                return reply.status(400).send({ error: (error as Error).message })
            }
            if ((error as Error).message === "CANT_KICK") {
                return reply.status(403).send({ error: (error as Error).message })
            }
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.usernameCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    }
    )
} 
