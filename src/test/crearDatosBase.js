import prisma from "../prismaClient.js";
import { Tipo_Cosmetico } from "../generated/prisma/enums.js";

export async function cosmeticosPorDefecto() {
    const cosmeticos = [
        {
            nombre: "icono_default",
            tipo : Tipo_Cosmetico.Icono,
            precio: 0,
            descripcion: "Icono por defecto"
        },
        {
            nombre: "ficha_default",
            tipo : Tipo_Cosmetico.Skin_Ficha,
            precio: 0,
            descripcion: "Ficha por defecto"
        },
        {
            nombre: "serpiente_default",
            tipo : Tipo_Cosmetico.Skin_Serpiente,
            precio: 0,
            descripcion: "Serpiente por defecto"
        },
        {
            nombre: "escalera_default",
            tipo : Tipo_Cosmetico.Skin_Escalera,
            precio: 0,
            descripcion: "Escalera por defecto"
        }
    ];

    for (const cosmetico of cosmeticos) {
        await prisma.cosmeticos.upsert({
            where: { nombre: cosmetico.nombre },
            update: {},
            create: cosmetico
        });
    }
}