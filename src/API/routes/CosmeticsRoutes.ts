import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { UnauthorizedSessionToken, ForbiddenSessionToken } from "./AuxFunctionsAPI.js";
import Cosmetics from "../../services/Cosmetics.js";

export default function cosmeticsRoutes(app: FastifyInstance) : void {
    app.addHook("preHandler", app.verifyToken);

    app.get("/store/:email", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }), response: {
                200: Type.Array(Type.Object({
                    nomCosmetico: Type.String(),
                    precio: Type.Number(),
                    desc: Type.String(),
                    loTiene: Type.Boolean()
                })),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    message: Type.String()
                }),
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        try {
            const storeCosmetics = await Cosmetics.getStoreCosmetics(email);
            if (!storeCosmetics) {
                return reply.status(404).send({ message: "No se encontraron cosméticos para el usuario" });
            }
            return reply.status(200).send(storeCosmetics);
        } catch (error) {
            return reply.status(404).send({ message: "Error al obtener los cosméticos de la tienda" });
        }
    });

    app.post("/store/:email", {
        schema: {
            params: Type.Object({
                email: Type.String({ format: "email" })
            }),
            body: Type.Object({
                cosmetic_name: Type.String()
            }), response: {
                200: Type.Object({
                    message: Type.String()
                }),
                400: Type.Object({
                    message: Type.String()
                }),
                401: UnauthorizedSessionToken,
                403: ForbiddenSessionToken,
                404: Type.Object({
                    message: Type.String()
                }),
                409: Type.Object({
                    message: Type.String()
                }),
            }
        }
    }, async (request, reply) => {
        const { email } = request.params as { email: string };
        const { cosmetic_name } = request.body as { cosmetic_name: string };
        try {
            await Cosmetics.purchaseCosmetic(email, cosmetic_name);
            return reply.status(200).send({ message: "Compra realizada con éxito" });
        } catch (error) {
            const msg = (error as Error).message;
            if (msg=== "Ya tienes este cosmético"){
                return reply.status(409).send({ message: msg });
            }
            if (msg === "No tienes suficientes SEP para comprar este cosmético") {
                return reply.status(400).send({ message: msg });
            }
            return reply.status(404).send({ message: "Error al comprar el cosmético" });
        }
    });
}