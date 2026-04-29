// @ts-nocheck
import {
    cartasPoblación,
    cosmeticosPorDefecto,
    cuentaAdminPorDefecto,
    efectosPoblacion,
    getAchievementById,
    getCardById,
    getEffectById,
    tablerosPoblacion,
    getUserByEmail,
    logrosPoblacion,
    mazosPorDefecto
} from "./poblation/CrearDatosBase.js";
import { getBoardByName } from "./services/Boards.js";
import { getCosmeticByName } from "./services/Cosmetics.js";

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
