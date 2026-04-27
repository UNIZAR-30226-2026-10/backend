import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { UnauthorizedSessionToken, ForbiddenSessionToken } from "./AuxFunctionsAPI.js";
import { getMatchState, moveToken, startMatch, throwDice, useCard }  from "../../services/Matches.js";

export default function matchesRoutes(app: FastifyInstance) : void {
    app.addHook("preHandler", app.verifyToken);

    app.post("/", {
        schema: {
            body: Type.Object({
                lobby_id: Type.String()
            }),
            response: {
                200: Type.Any(),
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

    app.get("/:match_id/:email", {
        schema: {
            params: Type.Object({
                match_id: Type.String(),
                email: Type.String({ format: 'email' })
            }),
            response: {
                200: Type.Any(),
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
        const { match_id, email } = request.params as { match_id: string; email: string };
        try {
            const partida = await getMatchState(match_id, email);
            return reply.status(200).send(partida);
        } catch (error) {
            if ((error as Error).message === "Partida no encontrada") {
                return reply.status(404).send({ error: (error as Error).message });
            }
            return reply.status(403).send({ error: (error as Error).message });
        }
    });

    app.post("/:match_id/cards/:email", {
        schema: {
            params: Type.Object({
                match_id: Type.String(),
                email: Type.String({ format: 'email' })
            }),
            body: Type.Object({
                card_id: Type.String(),
                who: Type.Optional(Type.Union([Type.Number(), Type.String()])),
                inicio: Type.Optional(Type.Number()),
                fin: Type.Optional(Type.Number())
            }),
            response: {
                200: Type.Any(),
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
        const { match_id, email } = request.params as { match_id: string; email: string };
        const { card_id, who, inicio, fin } = request.body as { card_id: string; who?: number | string; inicio?: number; fin?: number };
        try {
            const partida = await useCard(match_id, email, card_id, who, inicio, fin);
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

    app.post("/:match_id/dice/:email", {
        schema: {
            params: Type.Object({
                match_id: Type.String(),
                email: Type.String({ format: 'email' })
            }),
            response: {
                200: Type.Any(),
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
        const { match_id, email } = request.params as { match_id: string; email: string };
        try {
            const partida = await throwDice(match_id, email);
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

    app.post("/:match_id/pawn/:email", {
        schema: {
            params: Type.Object({
                match_id: Type.String(),
                email: Type.String({ format: 'email' })
            }),
            body: Type.Object({
                pawn_id: Type.Number(),
                final_position: Type.Number(),
                steps_remaining: Type.Optional(Type.Number())
            }),
            response: {
                200: Type.Any(),
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
        const { match_id, email } = request.params as { match_id: string; email: string };
        const { pawn_id, final_position, steps_remaining } = request.body as { pawn_id: number; final_position: number; steps_remaining?: number };
        try {
            const partida = await moveToken(match_id, email, pawn_id, final_position, steps_remaining);
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
