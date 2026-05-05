// @ts-nocheck
import {
    cartasPoblación,
    cosmeticosPorDefecto,
    cuentaAdminPorDefecto,
    efectosPoblacion,
    //getAchievementById,
    getCardById,
    //getEffectById,
    tablerosPoblacion,
    getUserByEmail,
    logrosPoblacion,
    mazosPorDefecto
} from "./poblation/CrearDatosBase.js";
import { getBoardByName } from "./dist/services/Boards.js";
import { getCosmeticByName } from "./dist/services/Cosmetics.js";
import { getAchievementById } from "./dist/services/Achievements.js";
//import { getCardById } from "./dist/services/Cards.js";
import { getEffectById } from "./dist/services/Effects.js";
import { createBoard } from "./dist/services/Boards.js";
import { createAchievement } from "./dist/services/Achievements.js";
import { createCosmetic } from "./dist/services/Cosmetics.js";
import { createCard } from "./dist/services/Cards.js";
import { createEffect } from "./dist/services/Effects.js";
import { createUser } from "./dist/services/Users.js";

async function seedIfMissing<T>(
    label: string,
    exists: () => Promise<T | null | undefined>,
    seed: () => Promise<void>
) {
    const current = await exists();
    if (current) {
        console.log(`${label}: ya existe, se omite`);
        return;
    }

    console.log(`${label}: creando datos`);
    await seed();
}

async function main() {
    await seedIfMissing(
        "Cosméticos",
        () => getCosmeticByName("icono_default").catch(() => null),
        cosmeticosPorDefecto
    );

    await seedIfMissing(
        "Cartas",
        () => getCardById("Exceso de medios"),
        cartasPoblación
    );

    await seedIfMissing(
        "Efectos",
        () => getEffectById("Efecto 1: Tiras 2 dados"),
        efectosPoblacion
    );

    await seedIfMissing(
        "Logros",
        () => getAchievementById("Primeros pasos"),
        logrosPoblacion
    );

    await seedIfMissing(
        "Usuario admin",
        () => getUserByEmail("admin@gmail.com"),
        cuentaAdminPorDefecto
    );

    console.log("Mazo por defecto: creando o actualizando");
    await mazosPorDefecto();

    await seedIfMissing(
        "Tableros",
        () => getBoardByName("Basico").catch(() => null),
        tablerosPoblacion
    );

    console.log("Seed completado correctamente");
}

main().catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exitCode = 1;
});
