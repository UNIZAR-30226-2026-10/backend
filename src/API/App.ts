import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import registerRoutes from "./routes/Index.js";

export default async function createApp() : Promise<FastifyInstance> {
    const app = fastify({
        logger: true
    });

    app.register(cors, {
    origin: "*",
    });

    app.get("/ping", async (request, reply) => {
    return "pong";
    });

    await registerRoutes(app);

    return app;
}