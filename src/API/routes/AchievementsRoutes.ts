import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import Achievements from "../../services/Achievements.js";

export default function achievementsRoutes(app: FastifyInstance) : void {
    app.addHook("preHandler", app.verifyToken);

    app.get("/", {
        schema: 
            { 
                summary: "Obtener todos los logros",
                tags: ["Achievements"],
                security: [{ CookieAuth: [] }],
                description: "Endpoint para obtener todos los logros disponibles en el juego, junto con sus detalles y las cartas de recompensa asociadas (si las hay) o el dinero de recompensa.",
                response: {
                200: {
                    logros: Type.Array(Type.Object({
                        nombre: Type.String(),
                        descripcion: Type.String(),
                        tipo: Type.String(),
                        cartaID: Type.Optional(Type.String()),
                        requisito: Type.Number(),
                        recompensaMonetaria: Type.Optional(Type.Number())
                    })),
                    cartaRecompensa: Type.Array(Type.Optional(Type.Object({
                        nombre: Type.String(),
                        descripcion: Type.String(),
                        tipo: Type.String(),
                        calidad: Type.String()
                    }))),
                    description: "Lista de logros con sus detalles y las cartas de recompensa asociadas (si las hay)."
                },
                400: {
                    message: Type.String(),
                    description: "Error al obtener los logros."
                },
                401: {
                    message: Type.String(),
                    description: "No autorizado. Se requiere autenticación."
                },
                403: {
                    message: Type.String(),
                    description: "Prohibido. El usuario no tiene permisos para acceder a esta información."
                }
            } }
        } , async (request, reply) => {
        
        try {
            const logros = await Achievements.getAllAchievements();
            const value = {
                logros : logros.map(logro => ({
                    nombre: logro.nombre,
                    descripcion: logro.descripcion,
                    tipo: logro.tipo,
                    cartaID: logro.cartaID,
                    requisito: logro.requisito,
                    recompensaMonetaria: logro.recompensaMonetaria
                })),

                cartaRecompensa: logros.map(logro => logro.carta ? {
                    nombre: logro.carta.nombre,
                    descripcion: logro.carta.descripcion,
                    tipo: logro.carta.tipo,
                    calidad: logro.carta.calidad
                } : null)

                };
            return reply.status(200).send(value);
        } catch (error) {
            console.error("Error al obtener los logros:", error);
            return reply.status(400).send({ message: "Error al obtener los logros" });
        }

    });
}