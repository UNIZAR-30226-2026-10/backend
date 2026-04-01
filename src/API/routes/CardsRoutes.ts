import { FastifyInstance } from "fastify";

export default function cardsRoutes(app: FastifyInstance) : void {
    app.get("/ping", async (request, reply) => {
        return "pong Cards";
    });
}