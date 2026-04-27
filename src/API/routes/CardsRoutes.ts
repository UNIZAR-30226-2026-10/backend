import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import Cards from "../../services/Cards.js";

export default function cardsRoutes(app: FastifyInstance) : void {
    app.addHook("preHandler", app.verifyToken);
    app.get("/ping", async (request, reply) => {
        return "pong Cards";
    });

    app.get("/", {
        schema: 
            { response: {
                200: {
                    cards: Type.Array(Type.Object({
                        nombre: Type.String(),
                        descripcion: Type.String(),
                        tipo: Type.String(),
                        calidad: Type.String()
                    }))},
                400: {
                    message: Type.String(),
                    description: "Error al obtener las cartas."
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
                const cards = await Cards.getAllCards();
                const value = {
                    cards: cards.map(card => ({
                        nombre: card.nombre,
                        descripcion: card.descripcion,
                        tipo: card.tipo,
                        calidad: card.calidad
                    }))
                };
                
                reply.status(200).send(value);

            } catch (error) {
                console.error("Error al obtener las cartas:", error);
                reply.status(400).send({ message: "Error al obtener las cartas" });
            }
    });
}