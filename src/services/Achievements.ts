import { Logros, Carta, Tipo_Logro } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import { LogrosReturnType } from "./ReturnTypes.js";

export async function createAchievement(data: { nombre: string, descripcion: string, tipo: Tipo_Logro, carta?: Carta, requisito: number }): Promise<LogrosReturnType> {
    try {
        const achievement = await prisma.logros.create({
            data : {
                nombre: data.nombre,
                descripcion: data.descripcion,
                tipo: data.tipo,
                carta: data.carta ? { connect: { nombre: data.carta.nombre } } : undefined,
                requisito: data.requisito
            },
            include: {
                carta: true,
                usuarios: true
            }
        });
        return achievement;
    } catch (error) {
        console.error("Error al crear el logro:", error);
        throw new Error("Error al crear el logro");
    }
}

export async function getAchievementById(nombre: string): Promise<LogrosReturnType | null> {
    try {
        const achievement = await prisma.logros.findUnique({
            where: { nombre },
            include: {
                carta: true,
                usuarios: true
            }
        });
        return achievement;
    } catch (error) {
        console.error("Error al obtener el logro por ID:", error);
        throw new Error("Error al obtener el logro por ID");
    }
}

export async function getAllAchievements(): Promise<LogrosReturnType[]> {
    try {
        const achievements = await prisma.logros.findMany({
            include: {
                carta: true,
                usuarios: true
            }
        });
        return achievements;
    } catch (error) {
        console.error("Error al obtener todos los logros:", error);
        throw new Error("Error al obtener todos los logros");
    }
}

export async function updateAchievement(nombre: string, data: { descripcion?: string, tipo?: Tipo_Logro, carta?: Carta, requisito?: number }): Promise<LogrosReturnType> {
    try {
        const achievement = await prisma.logros.update({
            where: { nombre },
            data: {
                descripcion: data.descripcion,
                tipo: data.tipo,
                carta: data.carta ? { connect: { nombre: data.carta.nombre } } : undefined,
                requisito: data.requisito
            },
            include: {
                carta: true,
                usuarios: true
            }
        });
        return achievement;
    } catch (error) {
        console.error("Error al actualizar el logro:", error);
        throw new Error("Error al actualizar el logro");
    }
}

export async function deleteAchievement(nombre: string): Promise<{ message: string }> {
    try {
        await prisma.logros.delete({
            where: { nombre }
        });
        return { message: "Logro eliminado exitosamente" };
    } catch (error) {
        console.error("Error al eliminar el logro:", error);
        throw new Error("Error al eliminar el logro");
    }
}

export default {
    createAchievement,
    getAchievementById,
    getAllAchievements,
    updateAchievement,
    deleteAchievement
};