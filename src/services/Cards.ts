import { Carta, Tipo_Carta, Rareza, Logros, Efecto } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import { CartaReturnType } from "./ReturnTypes.js";

export async function createCard(data: { nombre: string, descripcion: string, tipo: Tipo_Carta, rareza: Rareza, logroID?: Logros, efecto: Efecto[] }): Promise<CartaReturnType | { error: string }> {
    try {
        const card = await prisma.carta.create({
            data : {
                nombre: data.nombre,
                descripcion: data.descripcion,
                tipo: data.tipo,
                calidad: data.rareza,
                logros: {
                    connect: data.logroID ? { nombre: data.logroID.nombre } : undefined
                },
                efectos: {
                    connect: data.efecto ? data.efecto.map((e) => ({ nombre: e.nombre })) : undefined
                }
            },
            include: {
                logros: true,
                efectos: true,
                barajas: true
            }
        });
        return card;
    } catch (error) {
        console.error("Error al crear la carta:", error);
        return { error: "Error al crear la carta" };
    }
}

export async function getCardById(nombre: string): Promise<CartaReturnType | null> {
    try {
        const card = await prisma.carta.findUnique({
            where: { nombre },
            include: {
                logros: true,
                efectos: true,
                barajas: true
            }
        });
        return card;
    } catch (error) {
        console.error("Error al obtener la carta por ID:", error);
        return null;
    }
}

export async function getAllCards(): Promise<CartaReturnType[]> {
    try {
        const cards = await prisma.carta.findMany({
            include: {
                logros: true,
                efectos: true,
                barajas: true
            }
        });
        return cards;
    } catch (error) {
        console.error("Error al obtener todas las cartas:", error);
        return [];
    }
}

export async function updateCard(nombre: string, data: { descripcion?: string, tipo?: Tipo_Carta, rareza?: Rareza, logroID?: Logros, efecto: Efecto[] }): Promise<CartaReturnType | { error: string }> {
    try {
        const card = await prisma.carta.update({
            where: { nombre },
            data: {
                descripcion: data.descripcion,
                tipo: data.tipo,
                calidad: data.rareza,
                logros: data.logroID ? { connect: { nombre: data.logroID.nombre } } : undefined,
                efectos: data.efecto ? { connect: data.efecto.map((e) => ({ nombre: e.nombre })) } : undefined
            },
            include: {
                logros: true,
                efectos: true,
                barajas: true
            }
        });
        return card;
    } catch (error) {
        console.error("Error al actualizar la carta:", error);
        return { error: "Error al actualizar la carta" };
    }
}

export async function deleteCard(nombre: string): Promise<{ message: string } | { error: string }> {
    try {
        await prisma.carta.delete({
            where: { nombre }
        });
        return { message: "Carta eliminada exitosamente" };
    } catch (error) {
        console.error("Error al eliminar la carta:", error);
        return { error: "Error al eliminar la carta" };
    }
}

export default {
    createCard,
    getCardById,
    getAllCards,
    updateCard,
    deleteCard
};