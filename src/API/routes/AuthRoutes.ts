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
        //Llamada ping pong para test
    app.get("/ping", async (request, reply) => {
        return reply.status(200).send("pong");
    });

    app.post("/new_users", {
        schema: {
            summary: "Registrar un nuevo usuario",
            tags: ["auth"],
            description: `Endpoint para registrar un nuevo usuario. 
            La petición debe incluir un email, un nombre de usuario y una contraseña.`,
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
            summary: "Iniciar sesión",
            tags: ["auth"],
            description: `Endpoint para iniciar sesión. 
            La petición debe incluir un email y una contraseña válidos. 
            Si las credenciales son correctas, se emitirá un token JWT en una cookie llamada "session" y otra cookie llamada "autologin" para el sistema de autologin.`,
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
        let { email, password } = request.body as { email: string, password: string };
        email = email.toLowerCase(); // Normalizamos el email a minúsculas

        try {
            const user = await User.authenticateUser(email, password);
            if (user.authenticated === false) {
                throw new Error("Invalid credentials");
            }
            const token = app.jwt.sign({ email: email, username: user.nombre });
            reply.setCookie("autologin", token, {
                httpOnly: true,
                sameSite: 'lax', 
                path: '/',         
                maxAge: 60 * 60 * 24 * 7 // 7 dias
            });
            reply.setCookie("session", token, {
                httpOnly: true,
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
            summary: "Iniciar sesión con cookie",
            tags: ["auth"],
            description: `Endpoint para iniciar sesión con una cookie de autologin. 
            La petición debe incluir una cookie llamada "autologin" con un token JWT válido.`,
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
        let decoded = app.jwt.verify<{ email: string; username: string }>(autologin);
        decoded.email = decoded.email.toLowerCase(); // Normalizamos el email a minúsculas
        
        const userExists = await User.getUserByEmailBasic(decoded.email);

        if(!userExists) {
            return reply.status(401).send({ error: "User not found" });
        }

        if(userExists.borrado) {
            return reply.status(401).send({ error: "User account is deleted" });
        }

        // Añadimos cookie de sesion como en el login normal
        reply.setCookie("session", autologin, {
            httpOnly: true,
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
            summary: "Cerrar sesión",
            tags: ["auth"],
            security: [{ CookieAuth: [] }],
            description: `Endpoint para cerrar sesión. 
            La petición debe incluir una cookie de sesión válida. 
            Este endpoint eliminará las cookies "session" y "autologin" para cerrar la sesión del usuario.`,
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
            sameSite: 'lax',
            path: '/',
        });

        reply.clearCookie("autologin", {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        });
        return reply.status(200).send("Logged out successfully");
    }
    );
}