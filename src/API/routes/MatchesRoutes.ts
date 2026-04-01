import { FastifyInstance } from "fastify";

export default function matchesRoutes(app: FastifyInstance) : void {
    app.get("/ping", async (request, reply) => {
        return "pong Matches";
    });
}