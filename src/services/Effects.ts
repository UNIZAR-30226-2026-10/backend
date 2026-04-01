import { Efecto, Tipo_Afeccion, Tipo_Efecto } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import { EfectoReturnType } from "./ReturnTypes.js";

export async function createEffect(data: { nombre: string, descripcion: string, afecta: Tipo_Afeccion, tipo: Tipo_Efecto }): Promise<EfectoReturnType> {
    try {
        const effect = await prisma.efecto.create({
            data : {
                nombre: data.nombre,
                descripcion: data.descripcion,
                afecta: data.afecta,
                tipo: data.tipo
            },
            include: {
                cartas: true
            }
        });
        return effect;
    } catch (error) {
        console.error("Error al crear el efecto:", error);
        throw new Error("Error al crear el efecto");
    }
}

export async function getEffectById(nombre: string): Promise<EfectoReturnType | null> {
    try {
        const effect = await prisma.efecto.findUnique({
            where: { nombre },
            include: {
                cartas: true
            }
        });
        return effect;
    } catch (error) {
        console.error("Error al obtener el efecto por ID:", error);
        throw new Error("Error al obtener el efecto por ID");
    }
}

export async function getAllEffects(): Promise<EfectoReturnType[]> {
    try {
        const effects = await prisma.efecto.findMany({
            include: {
                cartas: true
            }
        });
        return effects;
    } catch (error) {
        console.error("Error al obtener todos los efectos:", error);
        throw new Error("Error al obtener todos los efectos");
    }
}

export async function updateEffect(nombre: string, data: { descripcion?: string, afecta?: Tipo_Afeccion, tipo?: Tipo_Efecto }): Promise<EfectoReturnType> {
    try {
        const effect = await prisma.efecto.update({
            where: { nombre },
            data: {
                descripcion: data.descripcion,
                afecta: data.afecta,
                tipo: data.tipo
            },
            include: {
                cartas: true
            }
        });
        return effect;
    } catch (error) {
        console.error("Error al actualizar el efecto:", error);
        throw new Error("Error al actualizar el efecto");
    }
}

export async function deleteEffect(nombre: string): Promise<{ message: string }> {
    try {
        await prisma.efecto.delete({
            where: { nombre }
        });
        return { message: "Efecto eliminado correctamente" };
    } catch (error) {
        console.error("Error al eliminar el efecto:", error);
        throw new Error("Error al eliminar el efecto");
    }
}

export default {
    createEffect,
    getEffectById,
    getAllEffects,
    updateEffect,
    deleteEffect
};