import { FastifyInstance } from "fastify";

export default function achievementsRoutes(app: FastifyInstance) : void {
    app.get("/ping", async (request, reply) => {
        return "pong Achievements";
    });
}