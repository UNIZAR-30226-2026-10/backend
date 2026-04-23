import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { UnauthorizedSessionToken } from "./AuxFunctionsAPI.js";
import { lobbyManager } from "../../managers/lobbyManager.js";
import Boards from "../../services/Boards.js";
import User from "../../services/User.js";

export default function lobbiesRoutes(app: FastifyInstance): void {
    app.addHook("preHandler", app.verifyToken);

    app.post("/", {
        schema: {
            body: Type.Object({
                email: Type.String({ format: "email" }),
                username: Type.String(),
            }),
            response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        idJugador: Type.String(),
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
        const { email, username } = request.body as { email: string, username: string }
        let lobby
        try {
            lobby = lobbyManager.createLobby({
                idJugador: email,
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
            idCreador: lobby.idCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.get("/:lobby-id", {
        schema: {
            params: Type.Object({
                "lobby-id": Type.String()
            }),
            response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        idJugador: Type.String(),
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
        const { "lobby-id": lobbyId } = request.params as { "lobby-id": string }
        let lobby
        try {
            lobby = lobbyManager.getLobby(lobbyId)
        } catch (error) {
            return reply.status(404).send({ error: "Lobby no encontrado" })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.idCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.post("/:lobby-id/invitations", {
        schema: {
            params: Type.Object({
                "lobby-id": Type.String()
            }),
            body: Type.Object({
                inviteFrom: Type.String({ format: "email" }),
                inviteFor: Type.String({ format: "email" })
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
        const { "lobby-id": lobbyId } = request.params as { "lobby-id": string }
        const { inviteFrom, inviteFor } = request.body as { inviteFrom: string, inviteFor: string }
        let invite = {
            inviteFor: inviteFor,
            inviteFrom: inviteFrom,
            lobbyID: lobbyId
        }
        try {            
            const user = await User.getUserByEmail(inviteFrom)
            if (!user) {
                return reply.status(404).send({ error: "Usuario que intenta invitar no encontrado" })
            }
            const esAmigo = user.amigos.some(amigo => amigo.email === inviteFor)
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

    app.put("/:lobby-id/invitations", {
        schema: {
            params: Type.Object({
                "lobby-id": Type.String()
            }),
            body: Type.Object({
                inviteFor: Type.String({ format: "email" }),
                username: Type.String(),
                inviteFrom: Type.String({ format: "email" }),
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
                        idJugador: Type.String(),
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
        const { "lobby-id": lobbyId } = request.params as { "lobby-id": string }
        const { inviteFor, username, inviteFrom, accept } = request.body as { inviteFor: string, username: string, inviteFrom: string, accept: boolean }
        let lobby
        let jugadorLobby = {
            idJugador: inviteFor,
            nombre: username,
            esIA: false,
            estaListo: false
        }   
        try {
            lobby = lobbyManager.manageInvite(jugadorLobby, accept, lobbyId, inviteFrom)
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
            idCreador: lobby.idCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.post("/:lobby-id/bots", {
        schema: {
            params: Type.Object({
                "lobby-id": Type.String()
            }),
            body: Type.Object({
                requested_by: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        idJugador: Type.String(),
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
        const { "lobby-id": lobbyId } = request.params as { "lobby-id": string }
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
            idCreador: lobby.idCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.put("/:lobby-id/players/:email/deck", {
        schema: {
            params: Type.Object({
                "lobby-id": Type.String(),
                "email": Type.String({ format: "email" })
            }),
            body: Type.Object({
                deck: Type.String()
            }), response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        idJugador: Type.String(),
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
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobby-id": lobbyId, "email": email } = request.params as { "lobby-id": string, "email": string }
        const { deck } = request.body as { deck: string }
        let lobby;
        try {
            const user = await User.getUserByEmail(email)
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
            lobby = lobbyManager.selectDeck(email, lobbyId, deck)
        } catch (error) {
            if ((error as Error).message === "WRONG_LOBBY") {
                return reply.status(400).send({ error: (error as Error).message })
            }
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.idCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.put("/:lobby-id/players/:email/ready", {
        schema: {
            params: Type.Object({
                "lobby-id": Type.String(),
                "email": Type.String({ format: "email" })
            }),
            body: Type.Object({
                ready: Type.Boolean()
            }), response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        idJugador: Type.String(),
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
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { "lobby-id": lobbyId, "email": email } = request.params as { "lobby-id": string, "email": string }
        const { ready } = request.body as { ready: boolean }
        let lobby
        try {
            lobby = lobbyManager.setReady(lobbyId, email, ready)
        } catch (error) {
            if ((error as Error).message === "WRONG_LOBBY") {
                return reply.status(400).send({ error: (error as Error).message })
            }
            return reply.status(404).send({ error: (error as Error).message })
        }
        return reply.status(200).send({
            idLobby: lobby.idLobby,
            idCreador: lobby.idCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.put("/:lobby-id/board", {
        schema: {
            params: Type.Object({
                "lobby-id": Type.String()
            }),
            body: Type.Object({
                requested_by: Type.String({ format: "email" }),
                board: Type.String()
            }), response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        idJugador: Type.String(),
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
        const { "lobby-id": lobbyId } = request.params as { "lobby-id": string }
        const { board, requested_by } = request.body as { board: string, requested_by: string }
        let lobby
        try {
            lobby = lobbyManager.getLobby(lobbyId)
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
            idCreador: lobby.idCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    })

    app.delete("/:lobby-id/players/:email", {
        schema: {
            params: Type.Object({
                "lobby-id": Type.String(),
                "email": Type.String()
            }),
            body: Type.Object({
                requested_by: Type.String({ format: "email" })
            }), response: {
                200: Type.Object({
                    idLobby: Type.String(),
                    idCreador: Type.String(),
                    jugadores: Type.Array(Type.Object({
                        idJugador: Type.String(),
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
                403: Type.Object({
                    error: Type.String()
                }),
                404: Type.Object({
                    error: Type.String()
                })
            }
        }  
    }, async (request, reply) => {
        const { "lobby-id": lobbyId, "email": email } = request.params as { "lobby-id": string, "email": string }
        const { requested_by } = request.body as { requested_by: string }
        let lobby
        try {
            lobby = lobbyManager.deletePlayer(requested_by, email, lobbyId)
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
            idCreador: lobby.idCreador,
            jugadores: lobby.jugadores,
            numJugadores: lobby.numJugadores,
            numBots: lobby.numBots,
            tablero: lobby.tablero
        })
    }
    )
} 
