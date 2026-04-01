import { FastifyInstance } from "fastify";

export default function userRoutes(app: FastifyInstance) : void {
    app.get("/ping", async (request, reply) => {
        return "pong Users";
    });
}