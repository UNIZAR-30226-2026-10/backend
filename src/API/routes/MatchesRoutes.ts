import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { UnauthorizedSessionToken, ForbiddenSessionToken } from "./AuxFunctionsAPI.js";
import { getMatchState, moveToken, sendMessage, getChat, startMatch, throwDice, useCard }  from "../../services/Matches.js";
import { SnapshotJugadoresSchema, snapshotTableroSchema, chatPartidaSchema } from "../../services/JsonTypes.js";

const partidaJugadorSchema = Type.Object({
    nombre: Type.String(),
    iconoActualField: Type.String(),
    fichaActualField: Type.String(),
    serpienteActualField: Type.String(),
    escaleraActualField: Type.String(),
});

const ganadorSchema = Type.Union([
    Type.Null(),
    Type.Object({
        nombre: Type.String()
    })
]);

const partidaSchema = Type.Object({
    ID: Type.String(),
    estado: Type.Union([
        Type.Literal("EnEspera"),
        Type.Literal("EnCurso"),
        Type.Literal("Finalizada"),
    ]),
    snapshotJugadores: SnapshotJugadoresSchema,
    fechaInicio: Type.String({ format: "date-time" }),
    fechaFin: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
    configuracion: Type.Object({
        tablero: Type.String(),
        numeroJugadores: Type.Number(),
        numeroBots: Type.Number(),
    }),
    snapshotTablero: snapshotTableroSchema,
    chat: chatPartidaSchema,
    tableroInicialNombre: Type.String(),
    partidaJugadores: Type.Array(partidaJugadorSchema),
    ganador: ganadorSchema
});

const movimientoSchema = Type.Object({
    fichaId: Type.Number(),
    casillaDestino: Type.Number(),
    esBifurcacion: Type.Boolean(),
    pasosRestantes: Type.Optional(Type.Number())
});

const throwDiceResponseSchema = Type.Object({
    partida: partidaSchema,
    tirada: Type.Number(),
    movimientos: Type.Array(movimientoSchema),
    tiradaExtra: Type.Optional(Type.Number())
});

export default function matchesRoutes(app: FastifyInstance) : void {
    app.addHook("preHandler", app.verifyToken);

    app.post("/", {
        schema: {
            summary: "Iniciar una nueva partida a partir de un lobby",
            tags: ["matches"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para iniciar una nueva partida a partir de un lobby. 
            Al iniciar una partida esta utiliza la información del lobby para configurar la partida y
            se borra el lobby del que se ha partido para crearla.
            La petición debe incluir el ID del lobby a partir del cual se quiere iniciar la partida.`,
            body: Type.Object({
                lobby_id: Type.String()
            }),
            response: {
                200: partidaSchema,
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
        const { lobby_id } = request.body as { lobby_id: string };
        try {
            const partida = await startMatch(lobby_id);
            return reply.status(200).send(partida);
        } catch (error) {
            if ((error as Error).message === "Lobby no encontrado") {
                return reply.status(404).send({ error: (error as Error).message });
            } 
            return reply.status(409).send({ error: (error as Error).message });
        }
    });

    app.post("/:matchId/chat/:username", {
        schema: {
            summary: "Enviar un mensaje al chat de una partida",
            tags: ["matches"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para enviar un mensaje al chat de una partida. 
            La petición debe incluir el ID de la partida a la que se quiere enviar el mensaje, 
            el nombre de usuario del jugador que envía el mensaje y el contenido del mensaje.`,
            params: Type.Object({
                matchId: Type.String(),
                username: Type.String()
            }),
            body: Type.Object({
                message: Type.String()
            }), response: {
                200: Type.Object({
                    chat: chatPartidaSchema
                }),
                401: UnauthorizedSessionToken,
                403: Type.Union([ForbiddenSessionToken, Type.Object({
                    error: Type.String()
                })]),
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { matchId, username } = request.params as { matchId: string; username: string };
        const { message } = request.body as { message: string };
        try {
            const chat = await sendMessage(matchId, username, message);
            return reply.status(200).send(chat);
        } catch (error) {
            if ((error as Error).message === "Partida no encontrada") {
                return reply.status(404).send({ error: (error as Error).message });
            }
            return reply.status(403).send({ error: (error as Error).message });
        }
    });

    app.get("/:matchId/chat/:username", {
        schema: {
            summary: "Obtener el chat de una partida",
            tags: ["matches"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener el chat de una partida.
            La petición debe incluir el ID de la partida de la cual se quiere obtener el chat y
            el nombre de usuario del jugador que realiza la petición (para verificar que el jugador forma parte de la partida).
            Devolvemos los mensajes del chat, cada mensaje incluye el nombre del jugador que lo ha mandado y el contenido del mensaje.`,
            params: Type.Object({
                matchId: Type.String(),
                username: Type.String()
            }),
            response: {
                200: Type.Object({
                    chat: chatPartidaSchema
                }),
                401: UnauthorizedSessionToken,
                403: Type.Union([ForbiddenSessionToken, Type.Object({
                    error: Type.String()
                })]),
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { matchId, username } = request.params as { matchId: string; username: string };
        try {
            const chat = await getChat(matchId, username);
            return reply.status(200).send(chat);
        } catch (error) {
            if ((error as Error).message === "Partida no encontrada") {
                return reply.status(404).send({ error: (error as Error).message });
            }
            return reply.status(403).send({ error: (error as Error).message });
        }
    });

    app.get("/:matchId/:username", {
        schema: {
            summary: "Obtener el estado de una partida",
            tags: ["matches"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener el estado de una partida específica. 
            La petición debe incluir el ID de la partida de la cual se quiere obtener el estado y
            el nombre de usuario del jugador que realiza la petición (para verificar que el jugador forma parte de la partida).
            Devolvemos información exclusiva para ese jugador, como su mano de cartas, sus logros, etc. 
            junto con información general de la partida como el estado del tablero, el turno actual, etc.`,
            params: Type.Object({
                matchId: Type.String(),
                username: Type.String()
            }),
            response: {
                200: partidaSchema,
                401: UnauthorizedSessionToken,
                403: Type.Union([ForbiddenSessionToken, Type.Object({
                    error: Type.String()
                })]),
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { matchId, username } = request.params as { matchId: string; username: string };
        try {
            const partida = await getMatchState(matchId, username);
            return reply.status(200).send(partida);
        } catch (error) {
            if ((error as Error).message === "Partida no encontrada") {
                return reply.status(404).send({ error: (error as Error).message });
            }
            return reply.status(403).send({ error: (error as Error).message });
        }
    });

    app.post("/:matchId/cards/:username", {
        schema: {
            summary: "Jugar una carta en una partida",
            tags: ["matches"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para jugar una carta en una partida. 
            La petición debe incluir el ID de la partida en la que se quiere jugar la carta, 
            el nombre de usuario del jugador que quiere jugar la carta, 
            el ID de la carta que se quiere jugar y opcionalmente dependiendo de la carta se pueden incluir otros parámetros como a quién se le juega la carta, en qué posición del tablero, etc.`,
            params: Type.Object({
                matchId: Type.String(),
                username: Type.String()
            }),
            body: Type.Object({
                card_id: Type.String(),
                who: Type.Optional(Type.Union([Type.Number(), Type.String()])),
                inicio: Type.Optional(Type.Number()),
                fin: Type.Optional(Type.Number())
            }),
            response: {
                200: partidaSchema,
                400: Type.Object({
                    error: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: Type.Union([ForbiddenSessionToken, Type.Object({
                    error: Type.String()
                })]),
                404: Type.Object({
                    error: Type.String()
                }),
                409: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { matchId, username } = request.params as { matchId: string; username: string };
        const { card_id, who, inicio, fin } = request.body as { card_id: string; who?: number | string; inicio?: number; fin?: number };
        try {
            const partida = await useCard(matchId, username, card_id, who, inicio, fin);
            return reply.status(200).send(partida);
        } catch (error) {
            const msg = (error as Error).message;
            if (msg === "Partida no encontrada" || msg === "Carta no encontrada en la mano") {
                return reply.status(404).send({ error: msg });
            }
            if (msg.includes("Debes indicar")) {
                return reply.status(400).send({ error: msg });
            }
            if (msg === "No es tu turno" || msg.includes("fase") || msg.includes("Ya has jugado") || msg.includes("No tienes esta carta")) {
                return reply.status(409).send({ error: msg });
            }
            return reply.status(403).send({ error: msg });
        }
    });

    app.post("/:matchId/dice/:username", {
        schema: {
            summary: "Tirar el dado en una partida",
            tags: ["matches"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para tirar el dado en una partida. 
            La petición debe incluir el ID de la partida en la que se quiere tirar el dado y 
            el nombre de usuario del jugador que quiere tirar el dado.`,
            params: Type.Object({
                matchId: Type.String(),
                username: Type.String()
            }),
            response: {
                200: throwDiceResponseSchema,
                401: UnauthorizedSessionToken,
                403: Type.Union([ForbiddenSessionToken, Type.Object({
                    error: Type.String()
                })]),
                404: Type.Object({
                    error: Type.String()
                }),
                409: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { matchId, username } = request.params as { matchId: string; username: string };
        try {
            const partida = await throwDice(matchId, username);
            return reply.status(200).send(partida);
        } catch (error) {
            const msg = (error as Error).message;
            if (msg === "Partida no encontrada") {
                return reply.status(404).send({ error: msg });
            }
            if (msg === "No es tu turno" || msg.includes("fase") || msg.includes("fase")) {
                return reply.status(409).send({ error: msg });
            }
            return reply.status(403).send({ error: msg });
        }
    });

    app.post("/:matchId/pawn/:username", {
        schema: {
            summary: "Mover una ficha en una partida",
            tags: ["matches"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para mover una ficha en una partida. 
            La petición debe incluir el ID de la partida en la que se quiere mover la ficha, 
            el nombre de usuario del jugador que quiere mover la ficha, 
            el ID de la ficha que se quiere mover y las coordenadas de la posición final.`,
            params: Type.Object({
                matchId: Type.String(),
                username: Type.String()
            }),
            body: Type.Object({
                pawn_id: Type.Number(),
                final_position: Type.Number(),
                steps_remaining: Type.Optional(Type.Number())
            }),
            response: {
                200: partidaSchema,
                400: Type.Object({
                    error: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: Type.Union([ForbiddenSessionToken, Type.Object({
                    error: Type.String()
                })]),
                404: Type.Object({
                    error: Type.String()
                }),
                409: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { matchId, username } = request.params as { matchId: string; username: string };
        const { pawn_id, final_position, steps_remaining } = request.body as { pawn_id: number; final_position: number; steps_remaining?: number };
        try {
            const partida = await moveToken(matchId, username, pawn_id, final_position, steps_remaining);
            return reply.status(200).send(partida);
        } catch (error) {
            const msg = (error as Error).message;
            if (msg === "Partida no encontrada" || msg === "Ficha no encontrada" ) {
                return reply.status(404).send({ error: msg });
            }
            if (msg.includes("Destino")){
                return reply.status(400).send({ error: msg });
            }
            if (msg === "No es tu turno" || msg.includes("fase") || msg.includes("No permitido")) {
                return reply.status(409).send({ error: msg });
            }
            return reply.status(403).send({ error: msg });
        }
    });
}
