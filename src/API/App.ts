import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export default function createApp() : FastifyInstance {
    const app = fastify({
        logger: true
    });

    app.register(cors, {
    origin: "*",
    });

    app.get("/ping", async (request, reply) => {
    return "pong";
    });

    return app;
}