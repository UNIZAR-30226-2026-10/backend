import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { UnauthorizedSessionToken } from "./AuxFunctionsAPI.js";
import User from "../../services/User.js";
import Cosmetics from "../../services/Cosmetics.js";
import Achievements from "../../services/Achievements.js";
import { Rareza, Tipo_Carta, Tipo_Cosmetico, Tipo_Logro } from "../../generated/prisma/enums.js";

export default function userRoutes(app: FastifyInstance) : void {
    app.addHook("preHandler", app.verifyToken);

    app.get("/:email/profile", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    iconoActual: Type.String(),
                    nombre: Type.String(),
                    email: Type.String({ format: "email" }),
                    victorias: Type.Number(),
                    derrotas: Type.Number(),
                    SEP: Type.Number(),
                    SerpienteActual: Type.String(),
                    EscaleraActual: Type.String(),
                    FichaActual: Type.String()
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const user = await User.getUserByEmail(email);

        if (!user) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }

        return reply.status(200).send({
            iconoActual: user.iconoActual,
            nombre: user.nombre,
            email: user.email,
            victorias: user.victorias,
            derrotas: user.derrotas,
            SEP: user.SEP,
            SerpienteActual: user.serpienteActual,
            EscaleraActual: user.escaleraActual,
            FichaActual: user.fichaActual
        });
    });

    app.get("/:email/icons", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    iconos: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            const icons = await Cosmetics.getCosmeticsByTypeAndUser(Tipo_Cosmetico.Icono, email);
            return reply.status(200).send({ iconos: icons.cosmeticos.map(c => c.nombre) });
        } catch (error) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }
    });

    app.put("/:email/icon", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            body: Type.Object({
                icon: Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const { icon } = request.body as { icon: string };

        try {
            await User.updateCosmeticOnUser(email, { tipo: Tipo_Cosmetico.Icono, nombre: icon });
            return reply.status(200).send({ message: "Icono actualizado correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: error instanceof Error ? error.message : "Icono no encontrado" });
        }
    });

    app.get("/:email/stairs", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    escaleras: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            const stairs = await Cosmetics.getCosmeticsByTypeAndUser(Tipo_Cosmetico.Skin_Escalera, email);
            return reply.status(200).send({ escaleras: stairs.cosmeticos.map(c => c.nombre) });
        } catch (error) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }
    });

    app.put("/:email/stair", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            body: Type.Object({
                stair: Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const { stair } = request.body as { stair: string };

        try {
            await User.updateCosmeticOnUser(email, { tipo: Tipo_Cosmetico.Skin_Escalera, nombre: stair });
            return reply.status(200).send({ message: "Escalera actualizada correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: error instanceof Error ? error.message : "Escalera no encontrada" });
        }
    });

    app.get("/:email/pawns", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    fichas: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            const pawns = await Cosmetics.getCosmeticsByTypeAndUser(Tipo_Cosmetico.Skin_Ficha, email);
            return reply.status(200).send({ fichas: pawns.cosmeticos.map(c => c.nombre) });
        } catch (error) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }

    });

    app.put("/:email/pawn", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            body: Type.Object({
                pawn: Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const { pawn } = request.body as { pawn: string };

        try {
            await User.updateCosmeticOnUser(email, { tipo: Tipo_Cosmetico.Skin_Ficha, nombre: pawn });
            return reply.status(200).send({ message: "Ficha actualizada correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: error instanceof Error ? error.message : "Ficha no encontrada" });
        }
    });

    app.get("/:email/snakes", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    serpientes: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            const snakes = await Cosmetics.getCosmeticsByTypeAndUser(Tipo_Cosmetico.Skin_Serpiente, email);
            return reply.status(200).send({ serpientes: snakes.cosmeticos.map(c => c.nombre) });
        } catch (error) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }
    });
     
     app.put("/:email/snake", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            body: Type.Object({
                snake: Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const { snake } = request.body as { snake: string };

        try {
            await User.updateCosmeticOnUser(email, { tipo: Tipo_Cosmetico.Skin_Serpiente, nombre: snake });
            return reply.status(200).send({ message: "Serpiente actualizada correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: error instanceof Error ? error.message : "Serpiente no encontrada" });
        }
    });

    app.put("/:email/username", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            body: Type.Object({
                username: Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const { username } = request.body as { username: string };

        try {
            await User.modifyUserByEmail(email, { nombre: username });
            return reply.status(200).send({ message: "Nombre de usuario actualizado correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: error instanceof Error ? error.message : "Usuario no encontrado" });
        }
    });


    app.get("/:email/stats", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    victorias: Type.Number(),
                    derrotas: Type.Number(),
                    SEP: Type.Number(),
                    CartasJugadas: Type.Number(),
                    PartidasJugadas: Type.Number(),
                    NumeroAmigos: Type.Number(),
                    CartasLegendarias: Type.Number(),
                    LogrosCompletados: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            const user = await User.getUserByEmail(email);
            if (!user) {
                return reply.status(404).send({ error: "usuario no encontrado" });
            }

            return reply.status(200).send({
                victorias: user.victorias,
                derrotas: user.derrotas,
                SEP: user.SEP,
                CartasJugadas: user.cartasJugadas,
                PartidasJugadas: user.partidasJugadas,
                NumeroAmigos: user.amigos.length,
                CartasLegendarias: user.cartas.filter(c => c.calidad === Rareza.Legendaria).length,
                LogrosCompletados: user.logros.map(l => l.nombre)
            });
        } catch (error) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }
    });

    app.post("/:email/achievements" , {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            body: Type.Object({
                achievement_id: Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                402: Type.Object({
                    error: Type.String()
                }),
                403: Type.Object({
                    error: Type.String()
                }),
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const { achievement_id } = request.body as { achievement_id: string };
        
        const logro = await Achievements.getAchievementById(achievement_id);
        if (!logro) {
            return reply.status(404).send({ error: "Logro no encontrado" });
        }

        const user = await User.getUserByEmail(email);
        if (!user) {
            return reply.status(404).send({ error: "Usuario no encontrado" });
        }

        if (user.logros.some(l => l.nombre === achievement_id)) {
            return reply.status(402).send({ error: "Logro ya completado por el usuario" });
        }

        switch (logro.tipo) {
            case Tipo_Logro.Partidas:
                if (user.victorias + user.derrotas < logro.requisito) {
                    return reply.status(403).send({ error: "Requisitos no cumplidos" });
                }
                break;
            case Tipo_Logro.Victorias:
                if (user.victorias < logro.requisito) {
                    return reply.status(403).send({ error: "Requisitos no cumplidos" });
                }
                break;
            case Tipo_Logro.CartasJugadas:
                if (user.cartasJugadas < logro.requisito) {
                    return reply.status(403).send({ error: "Requisitos no cumplidos" });
                }
                break;
            case Tipo_Logro.CartasColeccionadas:
                if (user.cartas.length < logro.requisito) {
                    return reply.status(403).send({ error: "Requisitos no cumplidos" });
                }
                break;
            case Tipo_Logro.SEP:
                if (user.SEP < logro.requisito) {
                    return reply.status(403).send({ error: "Requisitos no cumplidos" });
                }
                break;
            case Tipo_Logro.Derrotas:
                if (user.derrotas < logro.requisito) {
                    return reply.status(403).send({ error: "Requisitos no cumplidos" });
                }
                break;
        }

        try {
            await User.connectRelacion(email, achievement_id, "logros");
            return reply.status(200).send({ message: "Logro conectado al usuario correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: error instanceof Error ? error.message : "Usuario o logro no encontrado" });
        }
    });

    app.get("/:email/decks", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    decks: Type.Array(Type.Object({
                        nombre: Type.String(),
                        cartas: Type.Array(Type.Object({
                            nombre: Type.String(),
                            calidad: Type.Enum(Rareza),
                            tipo: Type.Enum(Tipo_Carta),
                            descripcion: Type.String(),
                        }))
                    }))
                }),
                401: UnauthorizedSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            const user = await User.getUserByEmail(email);
            if (!user) {
                return reply.status(404).send({ error: "usuario no encontrado" });
            }

            const decks = user.barajas.map(m => ({
                nombre: m.nombre,
                cartas: m.barajaCartas.map(bc => bc.carta)
            }));

            return reply.status(200).send({ decks });
        } catch (error) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }
    });
}