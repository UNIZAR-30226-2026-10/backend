import { FastifyReply, FastifyInstance, FastifyRequest } from "fastify";
import User from "../../services/User.js";
import { Type } from "@sinclair/typebox";
import fp from "fastify-plugin";

declare module "fastify" {
    interface FastifyInstance {
        verifyToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

const AuxFunctionsAPI = fp(async (app: FastifyInstance) => {
    app.decorate("verifyToken", async (request: FastifyRequest, reply: FastifyReply) => {
        const pathname = (request.raw.url ?? request.url).split("?")[0];

        if (pathname === "/ping" || pathname.endsWith("/ping")) {
            return;
        }

        const token = request.cookies.session;

        if (!token) {
            return reply.status(401).send({ error: "No token provided" });
        }

        try {
            const decoded = app.jwt.verify<{ email: string; username: string }>(token);

            if (!decoded.email) {
                return reply.status(401).send({ error: "Invalid token payload" });
            }

            if(!decoded.username) {
                return reply.status(401).send({ error: "Invalid token payload" });
            }
            
            const email_param = (request.params as { email?: string }).email;

            const username_param = (request.params as { username?: string }).username;

            if (username_param && username_param !== decoded.username) {
                return reply.status(403).send({ error: "Forbidden: Token does not match the requested resource" });
            }

            if (email_param && email_param !== decoded.email) {
                return reply.status(403).send({ error: "Forbidden: Token does not match the requested resource" });
            }

            const user = await User.getUserByEmailBasic(decoded.email);

            if(user?.borrado) {
                return reply.status(403).send({ error: "Forbidden: User account is deleted" });
            }

        } catch (error) {
            return reply.status(401).send({ error: "Invalid token" });
        }
    });
    });

export default AuxFunctionsAPI;

export const UnauthorizedSessionToken = Type.Object({
    error: Type.String()
})

export const NotFoundSessionToken = Type.Object({
    error: Type.String()
})

export const ForbiddenSessionToken = Type.Object({
    error: Type.String()
})

