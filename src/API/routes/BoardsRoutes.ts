import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { UnauthorizedSessionToken } from "./AuxFunctionsAPI.js";
import Boards from "../../services/Boards.js";

export default function boardsRoutes(app: FastifyInstance) : void {
    app.addHook("preHandler", app.verifyToken);

    app.get("/", {
        schema: {
            summary: "Obtiene todos los tableros disponibles para jugar",
            tags: ["Boards"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para obtener todos los tableros que están disponibles para jugar.`,
            response: {
                200: Type.Array(
                    Type.String()
                ),
                400: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
            }
        }
    }, async (request, reply) => {
        try {
        const boards = await Boards.getAllBoards();
        return reply.status(200).send(boards);
    } catch (error) {
        return reply.status(400).send({ message: "Error al obtener los tableros" });
    }
});
}