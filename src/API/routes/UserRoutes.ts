import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { ForbiddenSessionToken, UnauthorizedSessionToken } from "./AuxFunctionsAPI.js";
import User from "../../services/User.js";
import Cosmetics from "../../services/Cosmetics.js";
import Achievements from "../../services/Achievements.js";
import { Rareza, Tipo_Carta, Tipo_Cosmetico, Tipo_Logro } from "../../generated/prisma/enums.js";
import Deck from "../../services/Deck.js";
import { lobbyManager } from "../../managers/lobbyManager.js";

export default function userRoutes(app: FastifyInstance) : void {
    //Llamada ping pong para test
    app.get("/ping", async (request, reply) => {
        return reply.status(200).send("pong");
    });
    app.addHook("preHandler", app.verifyToken);

    app.get("/:email/profile", {
        schema: {
            summary: "Obtener el perfil de un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener la información del perfil de tu cuenta. 
            La petición debe incluir el email del usuario para el cual se quiere obtener la información del perfil.`,
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
                403: ForbiddenSessionToken,
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
            iconoActual: user.iconoActual.nombre,
            nombre: user.nombre,
            email: user.email,
            victorias: user.victorias,
            derrotas: user.derrotas,
            SEP: user.SEP,
            SerpienteActual: user.serpienteActual.nombre,
            EscaleraActual: user.escaleraActual.nombre,
            FichaActual: user.fichaActual.nombre
        });
    });

    app.get("/:email/SEP", {
        schema: {
            summary: "Obtener el SEP de un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener los SEP de tu cuenta. 
            La petición debe incluir el email del usuario para el cual se quiere obtener los SEP.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    sep: Type.Number()
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
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

        return reply.status(200).send({ sep: user.SEP });
    });

    app.get("/:email/icons", {
        schema: {
            summary: "Obtener los iconos disponibles para un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener los iconos disponibles para tu cuenta. 
            La petición debe incluir el email del usuario para el cual se quieren obtener los iconos disponibles.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    iconos: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
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
            summary: "Actualizar el icono actual de un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para actualizar el icono actual de tu cuenta. 
            La petición debe incluir el email del usuario y el nombre del nuevo icono que se desea establecer como icono actual.`,
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
                403: ForbiddenSessionToken,
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
            summary: "Obtener las escaleras disponibles para un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener las escaleras disponibles para tu cuenta. 
            La petición debe incluir el email del usuario para el cual se quieren obtener las escaleras disponibles.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    escaleras: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
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
            summary: "Actualizar la escalera actual de un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para actualizar la escalera actual de tu cuenta. 
            La petición debe incluir el email del usuario y el nombre de la nueva escalera que se desea establecer como escalera actual.`,
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
                403: ForbiddenSessionToken,
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
            summary: "Obtener las fichas disponibles para un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener las fichas disponibles para tu cuenta. 
            La petición debe incluir el email del usuario para el cual se quieren obtener las fichas disponibles.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    fichas: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
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
            summary: "Actualizar la ficha actual de un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para actualizar la ficha actual de tu cuenta. 
            La petición debe incluir el email del usuario y el nombre de la nueva ficha que se desea establecer como ficha actual.`,
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
                403: ForbiddenSessionToken,
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
            summary: "Obtener las serpientes disponibles para un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener las serpientes disponibles para tu cuenta. 
            La petición debe incluir el email del usuario para el cual se quieren obtener las serpientes disponibles.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    serpientes: Type.Array(Type.String())
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
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
            summary: "Actualizar la serpiente actual de un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para actualizar la serpiente actual de tu cuenta. 
            La petición debe incluir el email del usuario y el nombre de la nueva serpiente que se desea establecer como serpiente actual.`,
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
                403: ForbiddenSessionToken,
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
            summary: "Actualizar el nombre de usuario de un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para actualizar el nombre de usuario de tu cuenta. 
            La petición debe incluir el email del usuario y el nuevo nombre de usuario que se desea establecer.`,
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
                403: ForbiddenSessionToken,
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

            const token =  app.jwt.sign({ email: email, username: username });

            reply.setCookie("autologin", token, {
                httpOnly: true,
                sameSite: 'lax', 
                path: '/',         
                maxAge: 60 * 60 * 24 * 7 // 7 dias
            });
            reply.setCookie("session", token, {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',         
            });
            return reply.status(200).send({ message: "Nombre de usuario actualizado correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: error instanceof Error ? error.message : "Usuario no encontrado" });
        }
    });


    app.get("/:email/stats", {
        schema: {
            summary: "Obtener las estadísticas de un usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener las estadísticas de tu cuenta 
            La petición debe incluir el email del usuario para el cual se quieren obtener las estadísticas.`,
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
                403: ForbiddenSessionToken,
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
            summary: "Completar un logro y conectarlo a tu cuenta",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para conectar un logro a tu cuenta. 
            La petición debe incluir el email del usuario y el id del logro que se desea completar/conectar a la cuenta.`,
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
                403: ForbiddenSessionToken,
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
            await Achievements.giveAchievementReward(email, logro);
            return reply.status(200).send({ message: "Logro conectado al usuario correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: error instanceof Error ? error.message : "Usuario o logro no encontrado" });
        }
    });

    app.get("/:email/decks", {
        schema: {
            summary: "Obtener los mazos de tu cuenta",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener los mazos disponibles para tu cuenta con sus respectivas cartas. 
            La petición debe incluir el email del usuario.`,
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
                403: ForbiddenSessionToken,
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
            return reply.status(404).send({ error: "Error catch user decks" });
        }
    });

    app.get("/:email/decks/:deckId/cards", {
        schema: {
            summary: "Obtener las cartas de un mazo específico",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener las cartas de un mazo específico de tu cuenta. 
            La petición debe incluir el email del usuario y el id del mazo del cual se quieren obtener las cartas.`,
            params: Type.Object({
                email: Type.String({ format: "email" }),
                "deckId": Type.String()
            }),
            response: {
                200: Type.Object({
                    cards: Type.Array(Type.Object({
                        nombre: Type.String(),
                        calidad: Type.Enum(Rareza),
                        tipo: Type.Enum(Tipo_Carta),
                        descripcion: Type.String(),
                    }))
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                400: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email, "deckId": deckId } = request.params as { email: string, "deckId": string };
        let cartas_mazo;
        try {
            cartas_mazo = Deck.getAllCardsFromADeck(deckId, email);
        } catch (error) {
            return reply.status(400).send({ error: error instanceof Error ? error.message : "Error al obtener las cartas del mazo" });
        }
        return cartas_mazo;
    });

    app.post("/:email/decks", {
        schema: {
            summary: "Crear un nuevo mazo",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para crear un nuevo mazo en tu cuenta. 
            La petición debe incluir el email del usuario y la información del mazo a crear.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            body: Type.Object({
                nombre: Type.String(),
                cartas: Type.Array(Type.Object({
                    nombre: Type.String(),
                    calidad: Type.Enum(Rareza),
                    tipo: Type.Enum(Tipo_Carta),
                    descripcion: Type.String(),
                }))
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                400: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const { nombre, cartas } = request.body as {
            nombre: string;
            cartas: {
                nombre: string;
                calidad: Rareza;
                tipo: Tipo_Carta;
                descripcion: string;
            }[];
        };

        //Contamos si hay más de 2 cartas con el mismo nombre por que eso no se puede
        const cartaCount: Record<string, number> = {};
        for (const carta of cartas) {
            cartaCount[carta.nombre] = (cartaCount[carta.nombre] || 0) + 1;
            if (cartaCount[carta.nombre] > 2) {
                return reply.status(400).send({ error: `El mazo no puede contener más de 2 copias de la carta ${carta.nombre}` });
            }
        }
        
        try {
            const usuario = await User.getUserByEmail(email);
            if (!usuario) {
                return reply.status(400).send({ error: "Usuario no encontrado" });
            }
            if(usuario.barajas.length >= 8) {
                return reply.status(400).send({ error: "El usuario ya tiene el máximo de mazos permitidos (8)" });
            }
            await Deck.createDeck({ nombre, usuario, carta: cartas });
            return reply.status(200).send({ message: "Mazo creado correctamente" });
        } catch (error) {
            return reply.status(400).send({ error: error instanceof Error ? error.message : "Error al crear el mazo" });
        }
    });

    app.delete("/:email/decks/:deckId", {
        schema: {
            summary: "Eliminar un mazo",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para eliminar un mazo de tu cuenta. 
            La petición debe incluir el email del usuario y el id del mazo que se desea eliminar.`,
            params: Type.Object({
                email: Type.String({ format: "email" }),
                "deckId": Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                400: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email, "deckId": deckId } = request.params as { email: string, "deckId": string };

        try {
            const usuario = await User.getUserByEmail(email);
            if (!usuario) {
                return reply.status(400).send({ error: "Usuario no encontrado" });
            }
            await Deck.deleteDeck(deckId, email);
            return reply.status(200).send({ message: "Mazo eliminado correctamente" });
        } catch (error) {
            return reply.status(400).send({ error: error instanceof Error ? error.message : "Error al eliminar el mazo" });
        }
    });

    app.get("/:email/matches", {
        schema: {
            summary: "Obtener las partidas de tu cuenta",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener las partidas de tu cuenta. 
            La petición debe incluir el email del usuario.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    matches: Type.Array(Type.Object({
                        jugadores: Type.Array(Type.String()),
                        fecha: Type.String(),
                        mapa: Type.String(),
                        ID: Type.String()
                    }))
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            const matches = await User.getUserMatches(email);
            if (!matches) {
                return reply.status(404).send({ error: "usuario no encontrado" });
            }
            const returnData = {
                matches: matches.partidas.map(p => ({
                    jugadores: p.partidaJugadores.map(j => j.nombre),
                    fecha: p.fechaFin ? p.fechaFin.toISOString() : "Partida en curso",
                    mapa: p.tableroInicialNombre,
                    ID: p.ID
                }))
            }
            return reply.status(200).send(returnData);
        } catch (error) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }
    });

    app.get("/:email/friends", {
        schema: {
            summary: "Obtener los amigos de tu cuenta",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener los amigos de tu cuenta. 
            La petición debe incluir el email del usuario.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    friends: Type.Array(Type.Object({
                        nombre: Type.String(),
                        icono: Type.String()
                    }))
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            const friends = await User.getAmigos(email);
            return reply.status(200).send({ friends });
        } catch (error) {
            return reply.status(404).send({ error: "Usuario no encontrado" });
        }
    });

    app.get("/:username/invites", {
        schema: {
            summary: "Obtener las invitaciones de tu cuenta",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener las invitaciones de tu cuenta. 
            La petición debe incluir el nombre de usuario.`,
            params: Type.Object({
                username: Type.String()
            }),
            response: {
                200: Type.Object({
                    invites: Type.Array(Type.Object({
                        inviteFor: Type.String(),
                        inviteFrom: Type.String(),
                        lobbyID: Type.String()
                    }))
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { username } = request.params as { username: string };
        
        try {
            const invites = lobbyManager.getInvitesOfPlayer(username);
            return reply.status(200).send({ invites });
        } catch (error) {
            return reply.status(404).send({ error: "Usuario no encontrado" });
        }
    });

    app.post("/:email/:friendUsername/invites", {
        schema: {
            summary: "Agregar a un jugador como amigo",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para agregar a un jugador como amigo. 
            La petición debe incluir el email del usuario y el nombre de usuario del amigo que se desea agregar.`,
            params: Type.Object({
                email: Type.String({ format: "email" }),
                friendUsername: Type.String()
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
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
        const { email, friendUsername } = request.params as { email: string, friendUsername: string };

        const usuario = await User.getUserByEmailBasic(email);

        if(!usuario) {
            return reply.status(400).send({ error: "Usuario no encontrado" });
        }

        if(usuario.nombre === friendUsername) {
            return reply.status(400).send({ error: "No puedes agregarte a ti mismo como amigo" });
        }

        try {
            const amigos = await User.addAmigo(email, friendUsername);
            return reply.status(200).send({ message: amigos });
        } catch (error) {
            return reply.status(404).send({ error: "Usuario no encontrado" });
        }
    });

    app.delete("/:email/friends/:friendUsername", {
        schema: {
            summary: "Eliminar un amigo de tu cuenta",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para eliminar un amigo de tu cuenta. 
            La petición debe incluir el email del usuario y el nombre de usuario del amigo que se desea eliminar.`,
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email, friendUsername } = request.params as { email: string, friendUsername: string };

        try {
            const amigos = await User.removeAmigo(email, friendUsername);
            return reply.status(200).send({ message: amigos });
        } catch (error) {
            return reply.status(404).send({ error: "Usuario no encontrado" });
        }
    });

    app.delete("/:email", {
        schema: {
            summary: "Eliminar tu cuenta de usuario",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para eliminar tu cuenta de usuario. 
            La petición debe incluir el email del usuario que desea eliminar su cuenta.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };

        try {
            await User.deleteUserByEmailForApiUsage(email);
            reply.clearCookie("session", { path: '/' });
            reply.clearCookie("autologin", { path: '/' });
            return reply.status(200).send({ message: "Usuario eliminado correctamente" });
        } catch (error) {
            return reply.status(404).send({ error: "Usuario no encontrado" });
        }
    });

    app.put("/:email/decks/:deckId", {
        schema: {
            summary: "Actualizar un mazo",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para actualizar un mazo de tu cuenta. 
            La petición debe incluir el email del usuario, el id del mazo que se desea actualizar y la nueva información del mazo.`,
            params: Type.Object({
                email: Type.String({ format: "email" }),
                "deckId": Type.String()
            }),
            body: Type.Object({
                nombre: Type.String(),
                cartas: Type.Array(Type.Object({
                    nombre: Type.String(),
                    calidad: Type.Enum(Rareza),
                    tipo: Type.Enum(Tipo_Carta),
                    descripcion: Type.String(),
                }))
            }),
            response: {
                200: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                400: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email, "deckId": deckId } = request.params as { email: string, "deckId": string };
        const { nombre, cartas } = request.body as {
            nombre: string;
            cartas: {
                nombre: string;
                calidad: Rareza;
                tipo: Tipo_Carta;
                descripcion: string;
            }[];
        };

        //Contamos si hay más de 2 cartas con el mismo nombre por que eso no se puede
        const cartaCount: Record<string, number> = {};
        for (const carta of cartas) {
            cartaCount[carta.nombre] = (cartaCount[carta.nombre] || 0) + 1;
            if (cartaCount[carta.nombre] > 2) {
                return reply.status(400).send({ error: `El mazo no puede contener más de 2 copias de la carta ${carta.nombre}` });
            }
        }

        try {
            const user = await User.getUserByEmail(email);

            if (!user) {
                return reply.status(400).send({ error: "Usuario no encontrado" });
            }

            const partidas_no_terminadas = await User.getPartidasNoTerminadas(email, deckId);

            if (partidas_no_terminadas.length > 0) {
                return reply.status(400).send({ error: "No puedes modificar un mazo si tienes partidas en curso" });
            }

            Deck.deleteDeck(deckId, email);

            Deck.createDeck({ nombre, usuario: user, carta: cartas });

            return reply.status(200).send({ message: "Mazo actualizado correctamente" });

        }
        catch (error) {
            return reply.status(400).send({ error: error instanceof Error ? error.message : "Error al actualizar el mazo" });
        }
    });

    app.get("/:email/cards", {
        schema: {
            summary: "Obtener las cartas de tu colección",
            tags: ["users"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener las cartas de tu colección. 
            La petición debe incluir el email del usuario.`,
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            response: {
                200: Type.Object({
                    cards: Type.Array(Type.Object({
                        nombre: Type.String(),
                        calidad: Type.Enum(Rareza),
                        tipo: Type.Enum(Tipo_Carta),
                        descripcion: Type.String(),
                    }))
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
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
            return reply.status(200).send({ cards: user.cartas.map(c => ({
                nombre: c.nombre,
                calidad: c.calidad,
                tipo: c.tipo,
                descripcion: c.descripcion
            })) });
        } catch (error) {
            return reply.status(404).send({ error: "usuario no encontrado" });
        }
    });
}