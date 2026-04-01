import { FastifyInstance } from "fastify";

export default function lobbiesRoutes(app: FastifyInstance) : void {
    app.get("/ping", async (request, reply) => {
        return "pong Lobbies";
    });
}