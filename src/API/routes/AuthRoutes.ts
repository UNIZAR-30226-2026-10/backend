import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import User from "../../services/User.js";
import { UnauthorizedSessionToken } from "./AuxFunctionsAPI.js";

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
            const user_taken = await User.getUserByName(username);
            if (user_taken) {
                throw new Error("Nombre de usuario ya en uso");
            }
        } catch (error) {
            reply.status(400).send({ error: (error as Error).message });
            return;
        }

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
            if (user.authenticated === false) {
                throw new Error("Invalid credentials");
            }
            const token = app.jwt.sign({ email: email, username: user.nombre });
            reply.setCookie("autologin", token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax', 
                path: '/',         
                maxAge: 60 * 60 * 24 * 7 // 7 dias
            });
            reply.setCookie("session", token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',         
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
        const autologin = request.cookies.autologin;
        if (!autologin) {
            return reply.status(401).send({ error: "No autologin cookie found" });
        }
        try {
        const decoded = app.jwt.verify<{ email: string; username: string }>(autologin);
        
        // Añadimos cookie de sesion como en el login normal
        reply.setCookie("session", autologin, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
        });


        return reply.status(200).send({
            email: decoded.email,
            username: decoded.username
        });
        } catch (error) {
            reply.status(401).send({ error: "Invalid autologin token" });
        }
    }
    )

    app.post("/logout", {
        preHandler: app.verifyToken,
        schema: {
            response: {
                200: Type.String(),
                400: Type.Object({
                    error: Type.String()
                }),
                401: UnauthorizedSessionToken
            }
        }
    }, async (request, reply) => {

        reply.clearCookie("session", {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
        });

        reply.clearCookie("autologin", {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
        });
        return reply.status(200).send("Logged out successfully");
    }
    );
}