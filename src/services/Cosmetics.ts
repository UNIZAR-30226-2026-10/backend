import { Cosmeticos, Tipo_Cosmetico } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import { CosmeticosDisponiblesUsuarioReturnType, CosmeticosEquipadosReturnType } from "./ReturnTypes.js";

export async function createCosmetic(data: { nombre: string, tipo: Tipo_Cosmetico, precio: number, descripcion: string }): Promise<Cosmeticos> {
    try {
        const cosmetic = await prisma.cosmeticos.create({
            data: {
                nombre: data.nombre,
                tipo: data.tipo,
                precio: data.precio,
                descripcion: data.descripcion
            }
        });
        return cosmetic;
    } catch (error) {
        console.error("Error al crear el cosmético:", error);
        throw new Error("Error al crear el cosmético");
    }
}

export async function updateCosmetic(nombre: string, data: { tipo?: Tipo_Cosmetico, precio?: number, descripcion?: string }): Promise<Cosmeticos> {
    try {
        const cosmetic = await prisma.cosmeticos.update({
            where: { nombre },
            data: {
                tipo: data.tipo,
                precio: data.precio,
                descripcion: data.descripcion
            }
        });
        return cosmetic;
    } catch (error) {
        console.error("Error al actualizar el cosmético:", error);
        throw new Error("Error al actualizar el cosmético");
    }
}

export async function deleteCosmetic(nombre: string): Promise<{ message: string }> {
    try {
        await prisma.cosmeticos.delete({
            where: { nombre }
        });
        return { message: "Cosmético eliminado correctamente" };
    } catch (error) {
        console.error("Error al eliminar el cosmético:", error);
        throw new Error("Error al eliminar el cosmético");
    }
}

export async function getEquippedCosmetics(email: string): Promise<CosmeticosEquipadosReturnType> {
    try {
        const user = await prisma.usuario.findUnique({
            where: { email },
            select: {
                iconoActual: true,
                fichaActual: true,
                serpienteActual: true,
                escaleraActual: true
            }
        });
        if (!user) {
            throw new Error("Usuario no encontrado");
        }
        return user;
    } catch (error) {
        console.error("Error al obtener los cosméticos equipados:", error);
        throw new Error("Error al obtener los cosméticos equipados");
    }
}

export async function getCosmeticsByTypeAndUser(tipo: Tipo_Cosmetico, email: string): Promise<CosmeticosDisponiblesUsuarioReturnType> {
    try {
        const cosmetics = await prisma.usuario.findUnique({
            where: { email },
            select: {
                cosmeticos: {
                    where: { tipo },
                    select: {
                        nombre: true,
                    }
                }
            }
        });
        if (!cosmetics) {
            throw new Error("Usuario no encontrado o no tiene cosmeticos de este tipo");
        }
        return cosmetics;
    } catch (error) {
        console.error("Error al obtener los cosméticos por tipo y usuario:", error);
        throw new Error("Error al obtener los cosméticos por tipo y usuario");
    }
}

async function getCosmeticsByUser(email: string): Promise<CosmeticosDisponiblesUsuarioReturnType> {
    try {
        const cosmetics = await prisma.usuario.findUnique({
            where: { email },
            select: {
                cosmeticos: {
                    select: {
                        nombre: true,
                    }
                }
            }
        });
        if (!cosmetics) {
            throw new Error("Usuario no encontrado");
        }
        return cosmetics;
    } catch (error) {
        console.error("Error al obtener los cosméticos por usuario:", error);
        throw new Error("Error al obtener los cosméticos por usuario");
    }
}

export async function getCosmeticByName(nombre: string): Promise<Cosmeticos> {
    try {
        const cosmetic = await prisma.cosmeticos.findUnique({
            where: { nombre }
        });
        if (!cosmetic) {
            throw new Error("Cosmético no encontrado");
        }
        return cosmetic;
    } catch (error) {
        console.error("Error al obtener el cosmético por nombre:", error);
        throw new Error("Error al obtener el cosmético por nombre");
    }
}

export async function getStoreCosmetics(email: string): Promise<{ nomCosmetico: string, precio: number, desc: string, loTiene: boolean }[]> {
    try {
        const cosmetics = await prisma.cosmeticos.findMany({
            where: { precio: { gt: 0 } },
            select: {
                nombre: true,
                precio: true,
                descripcion: true
            }
        });
        const userCosmetics = await getCosmeticsByUser(email);

        const storeCosmetics = cosmetics.map(cosmetic => ({
            nomCosmetico: cosmetic.nombre,
            precio: cosmetic.precio,
            desc: cosmetic.descripcion,
            loTiene: userCosmetics.cosmeticos.some(c => c.nombre === cosmetic.nombre)
        }));
        return storeCosmetics;
    } catch (error) {
        console.error("Error al obtener los cosméticos de la tienda:", error);
        throw new Error("Error al obtener los cosméticos de la tienda");
    }
}

export async function purchaseCosmetic(email: string, nombreCosmetico: string): Promise<{ message: string }> {
    try {
        const cosmetic = await prisma.cosmeticos.findUnique({
            where: { nombre: nombreCosmetico }
        });
        if (!cosmetic) {
            throw new Error("Cosmético no encontrado");
        }
        const user = await prisma.usuario.findUnique({
            where: { email },
            include: {
                cosmeticos: {
                    where: { nombre: nombreCosmetico }
                }
            }
        });
        if (!user) {
            throw new Error("Usuario no encontrado");
        }
        if (user.cosmeticos.length > 0) {
            throw new Error("Ya tienes este cosmético");
        }
        if (user.SEP < cosmetic.precio) {
            throw new Error("No tienes suficientes SEP para comprar este cosmético");
        }
        await prisma.usuario.update({
            where: { email },
            data: { SEP: user.SEP - cosmetic.precio, cosmeticos: { connect: { nombre: nombreCosmetico } } }
        });
        return { message: "Compra realizada con éxito" };
    } catch (error) {
        console.error("Error al comprar el cosmético:", error);
        throw error;
    }
}

export default {
    createCosmetic,
    updateCosmetic,
    deleteCosmetic,
    getEquippedCosmetics,
    getCosmeticsByTypeAndUser,
    getCosmeticByName,
    getStoreCosmetics,
    purchaseCosmetic
};
