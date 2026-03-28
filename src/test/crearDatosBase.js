import prisma from "../prismaClient.js";

export async function cosmeticosPorDefecto() {
    const cosmeticos = [
        {
            nombre: "icono_default",
            precio: 0,
            descripcion: "Icono por defecto"
        },
        {
            nombre: "ficha_default",
            precio: 0,
            descripcion: "Ficha por defecto"
        },
        {
            nombre: "serpiente_default",
            precio: 0,
            descripcion: "Serpiente por defecto"
        },
        {
            nombre: "escalera_default",
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