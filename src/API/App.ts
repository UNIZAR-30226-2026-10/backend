import fastify, { FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import cookies from "@fastify/cookie";
import cors from "@fastify/cors";
import registerRoutes from "./routes/Index.js";
import FastifySwagger from "@fastify/swagger";
import FastifySwaggerUi from "@fastify/swagger-ui";

export default async function createApp() : Promise<FastifyInstance> {
    const app = fastify({
        logger: true
    });

    app.register(cors, {
    origin: "http://localhost:3001", 
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

    app.register(FastifySwagger, {
        openapi: {
            info: {
                title: "S&E REMIX API",
                description: "Documentación de la API para el juego serpientes y escaleras REMIX",
                version: "1.0.0",
            },
            tags: [
                { name: "auth", description: "Endpoints relacionados con autenticación y gestión de usuarios" },
                { name: "users", description: "Endpoints relacionados con la gestión de usuarios" },
                { name: "cards", description: "Endpoints relacionados con la gestión de cartas" },
                { name: "matches", description: "Endpoints relacionados con la gestión de partidas" },
                { name: "Achievements", description: "Endpoints relacionados con la gestión de logros" },
                { name: "Cosmetics", description: "Endpoints relacionados con la gestión de cosméticos" },
                { name: "lobbies", description: "Endpoints relacionados con la gestión de lobbies" }
            ],
            components: {
                securitySchemes: {
                    CookieAuth: {
                        type: "apiKey",
                        in: "cookie",
                        name: "session",
                        description: `
                            Autenticación basada en cookies JWT. Para acceder a los endpoints protegidos la petición debe incluir una cookie llamada "session"
                            que contenga un token JWT válido emitido por nuestro servidoer.
                            **IMPORTANTE**:
                            - Si realizas una petición a un endpoint y como parámetro pasas un email, el token JWT debe contener ese mismo email en su payload o
                            de lo contrario la petición será rechazada con un error 403 Forbidden.
                            - Para obtener un token JWT válido, primero debes iniciar sesión en el endpoint  api/auth/login con un email y contraseña válidos. 
                            El servidor emitirá el token JWT necesario para las siguientes peticiones.                 
                            `
                    },
                },
            },
        },
    });

    await app.register(FastifySwaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
                // 'list' hace que cada TAG actúe como un "bloque" cerrado. 
                // El usuario solo ve los nombres de los tags y debe clicar para ver el contenido.
                docExpansion: "list", 
                
                // Activa una barra de búsqueda/filtro arriba. 
                // Si escribes "auth", solo se muestran las rutas de ese tag.
                filter: true, 
                
                // Muestra los tags en orden alfabético o según los definiste
                tagsSorter: 'alpha', 
                
                // Muestra las operaciones dentro del tag por método o por ruta
                operationsSorter: 'alpha',
            }
    });

    await registerRoutes(app);

    return app;
}