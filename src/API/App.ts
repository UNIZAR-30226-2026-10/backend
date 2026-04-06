import fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import cookies from "@fastify/cookie";
import cors from "@fastify/cors";
import registerRoutes from "./routes/Index.js";

export default async function createApp() : Promise<FastifyInstance> {
    const app = fastify({
        logger: true
    });

    app.register(cors, {
    origin: "http://localhost:3001", // Tu puerto del Front
    credentials: true,               // Obligatorio para que funcionen las cookies/JWT
    methods: ["GET", "POST", "PUT", "DELETE"],
    });

    app.get("/ping", async (request, reply) => {
    return "pong";
    });

    app.register(jwt, {
        secret: process.env.JWT_SECRET || "your-secret-key",
        cookie: {
            cookieName: 'autologin', 
            signed: false           
        },
    });

    app.register(cookies, {
        secret: process.env.JWT_SECRET || "your-secret-key"
    });

    await registerRoutes(app);

    return app;
}