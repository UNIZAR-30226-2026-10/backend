import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import User from "../../services/User.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { email: string; username: string }; // Lo que guardas en el token
    user: { email: string; username: string };    // Lo que recuperas al verificar
  }
}

export default function authRoutes(app: FastifyInstance) : void {
    app.get("/ping", async (request, reply) => {
        return "pong Auth";
    });

    app.post("/new_users", {
        schema: {
            body: Type.Object({
                email: Type.String({ format: "email" }),
                username: Type.String(),
                password: Type.String()
            }),
            response: {
                200: Type.String(),
                400: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email, username, password } = request.body as { email: string, username: string, password: string };

        try {
            await User.createUser({ email: email, password: password, nombre: username });
        } catch (error) {
            reply.status(400).send({ error: (error as Error).message });
            return;
        }
        reply.status(200).send("User created successfully");
        return;

    });

    app.post("/login", {
        schema: {
            body: Type.Object({
                email: Type.String({ format: "email" }),
                password: Type.String()
            }),
            response: {
                200: Type.Object({
                    email: Type.String({ format: "email" }),
                    username: Type.String()
                }),
                401: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { email, password } = request.body as { email: string, password: string };

        try {
            const user = await User.authenticateUser(email, password);
            const token = app.jwt.sign({ email: email, username: user.nombre });
            reply.setCookie("autologin", token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax', 
                path: '/',         
                maxAge: 60 * 60 * 24 * 7 // 7 dias
            });
            reply.status(200).send({ email: user.email, username: user.nombre });
        } catch (error) {
            reply.status(401).send({ error: (error as Error).message });
        }
    });

    app.post("/cookie_login", {
        schema: {
            response: {
                200: Type.Object({
                    email: Type.String({ format: "email" }),
                    username: Type.String()
                }),
                401: Type.Object({
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const { autologin } = request.cookies as { autologin?: string };

        try {
        await request.jwtVerify(); 

        return reply.status(200).send({ 
            email: request.user.email, 
            username: request.user.username 
        });

        } catch (error) {
            reply.status(401).send({ error: "Invalid autologin token" });
        }
    }
    )
}