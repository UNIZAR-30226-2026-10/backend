import createApp from "./App.js";
import { FastifyInstance } from "fastify";

export default async function startServer() : Promise<FastifyInstance> {
    const app = await createApp();

    try {
        await app.listen({ port: 3000 });
        console.log("Server is running on http://localhost:3000");
        return app;
    } catch (err) {
        console.error("Error starting server:", err);
        process.exit(1);
    }
}

startServer();