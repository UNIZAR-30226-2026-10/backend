import { FastifyReply, FastifyInstance, FastifyRequest } from "fastify";
import { Type } from "@sinclair/typebox";
import fp from "fastify-plugin";

declare module "fastify" {
    interface FastifyInstance {
        verifyToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

const AuxFunctionsAPI = fp(async (app: FastifyInstance) => {
    app.decorate("verifyToken", async (request: FastifyRequest, reply: FastifyReply) => {
        const token = request.cookies.session;

        if (!token) {
            return reply.status(401).send({ error: "No token provided" });
        }

        try {
            app.jwt.verify(token);
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

