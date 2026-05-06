import { FastifyInstance } from "fastify";
import achievementsRoutes from "./AchievementsRoutes.js";
import authRoutes from "./AuthRoutes.js";
import cardsRoutes from "./CardsRoutes.js";
import cosmeticsRoutes from "./CosmeticsRoutes.js";
import lobbiesRoutes from "./LobbiesRoutes.js";
import matchesRoutes from "./MatchesRoutes.js";
import userRoutes from "./UserRoutes.js";
import AuxFunctionsAPI from "./AuxFunctionsAPI.js";
import boardsRoutes from "./BoardsRoutes.js";

export default async function registerRoutes(app: FastifyInstance): Promise<void> {

    app.register(
        AuxFunctionsAPI
    )

    app.register(
        achievementsRoutes,
        { prefix: "api/achievements" }
    )
    app.register(
        authRoutes,
        { prefix: "api/auth" }
    )
    app.register(
        cardsRoutes,
        { prefix: "api/cards" }
    )
    app.register(
        cosmeticsRoutes,
        { prefix: "api/cosmetics" }
    )
    app.register(
        boardsRoutes,
        { prefix: "api/boards" }
    )
    app.register(
        lobbiesRoutes,
        { prefix: "api/lobbies" }
    )
    app.register(
        matchesRoutes,
        { prefix: "api/matches" }
    )
    app.register(
        userRoutes,
        { prefix: "api/users" }
    )


}