import { FastifyInstance } from "fastify";

export default function authRoutes(app: FastifyInstance) : void {
    app.get("/ping", async (request, reply) => {
        return "pong Auth";
    });
}