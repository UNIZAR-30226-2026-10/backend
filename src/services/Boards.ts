import { TableroInicial} from "../generated/prisma/client.js";
import { SnapshotTableroJSON } from "./JsonTypes.js"
import prisma from "../prismaClient.js";


export async function createBoard(snapShot: SnapshotTableroJSON, boardName: string): Promise<TableroInicial> {
    try {
        const board = await prisma.tableroInicial.create({
            data: {
                nombre: boardName,
                snapshotTableroInicial: snapShot
            }
        });
        return board;
    } catch (error) {
        console.error("Error al crear el tablero:", error);
        throw new Error("Error al crear el tablero");
    }
}

export async function updateBoard(boardName: string, snapShot: SnapshotTableroJSON): Promise<TableroInicial> {
    try {
        const tablero = await getBoardByName(boardName);
        if (!tablero) {
            throw new Error("Tablero no encontrado");
        }
        const board = await prisma.tableroInicial.update({
            where: { nombre: boardName },
            data: { snapshotTableroInicial: snapShot }
        });
        return board;
    } catch (error) {
        console.error("Error al actualizar el tablero:", error);
        throw new Error("Error al actualizar el tablero");
    }
}

export async function deleteBoard(boardName: string): Promise<{ msg: string }> {
    try {
        const tablero = await getBoardByName(boardName);
        if (!tablero) {
            throw new Error("Tablero no encontrado");
        }
        await prisma.tableroInicial.delete({
            where: { nombre: boardName }
        });
        return { msg: "Tablero eliminado correctamente" };
    } catch (error) {
        console.error("Error al eliminar el tablero:", error);
        throw new Error("Error al eliminar el tablero");
    }
}

export async function getBoardByName(boardName: string): Promise<TableroInicial> {
    try {
        const board = await prisma.tableroInicial.findUnique({
            where: { nombre: boardName }
        });
        if (!board) {
            throw new Error("Tablero no encontrado");
        }
        return board;
    } catch (error) {
        console.error("Error al obtener el tablero:", error);
        throw new Error("Error al obtener el tablero");
    }
}

export async function getAllBoards(): Promise<TableroInicial[]> {
    try {
        const boards = await prisma.tableroInicial.findMany();
        return boards;
    } catch (error) {
        console.error("Error al obtener los tableros:", error);
        throw new Error("Error al obtener los tableros");
    }
}

export default {
    createBoard,
    updateBoard,
    deleteBoard,
    getBoardByName,
    getAllBoards
};