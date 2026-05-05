import Boards from '../dist/services/Boards.ts'
import assert from 'node:assert/strict'
import test, { describe, beforeEach } from 'node:test'
import prisma from '../prismaClient.js' // Necesario para limpiar la BBDD

const board = [
    { esCurva: false, rotacion: 0, tipo: "Normal", siguientes: [] }
]

const board2 = [
    { esCurva: false, rotacion: 0, tipo: "Normal", siguientes: [1] },
    { esCurva: false, rotacion: 0, tipo: "Normal", siguientes: [] }
]

describe("Test de Boards", () => {
    beforeEach(async () => {
        await prisma.tableroInicial.deleteMany()
    })

    test("Crear un tablero", async () => {
        let tablero = await Boards.createBoard(board, "tablero1")
        assert.deepEqual(tablero.snapshotTableroInicial, board)
    })

    test("Crear un tablero con múltiples casillas", async () => {
        let tablero = await Boards.createBoard(board2, "tablero2")
        assert.deepEqual(tablero.snapshotTableroInicial, board2)
    })

    test("Actualizar un tablero", async () => {
        await Boards.createBoard(board, "tablero1")
        let tableroActualizado = await Boards.updateBoard("tablero1", board2)
        assert.deepEqual(tableroActualizado.snapshotTableroInicial, board2)
    })

    test("Borrar un tablero", async () => {
        await Boards.createBoard(board, "tablero1")
        let tableroBorrado = await Boards.deleteBoard("tablero1")
        assert.equal(tableroBorrado.msg, "Tablero eliminado correctamente")
    })

    test("Borrar un tablero inexistente", async () => {
        await assert.rejects(
            async () => { await Boards.deleteBoard("tablero1") },
            { message: "Error al eliminar el tablero" }
        )
    })

    test("Actualizar un tablero inexistente", async () => {
        await assert.rejects(
            async () => { await Boards.updateBoard("tablero_falso", board2) },
            { message: "Error al actualizar el tablero" }
        )
    })

    test("Obtener un tablero", async () => {
        await Boards.createBoard(board, "tablero1")
        let tableroObtenido = await Boards.getBoardByName("tablero1")
        assert.deepEqual(tableroObtenido.snapshotTableroInicial, board)
    })

    test("Obtener un tablero inexistente", async () => {
        await assert.rejects(
            async () => { await Boards.getBoardByName("tablero_falso") },
            { message: "Error al obtener el tablero" }
        )
    })

    test("Obtener todos los tableros", async () => {
        await Boards.createBoard(board, "tablero1")
        await Boards.createBoard(board2, "tablero2")
        let tablerosObtenidos = await Boards.getAllBoards()
        assert.equal(tablerosObtenidos.length, 2)
        assert.deepEqual(tablerosObtenidos[0].snapshotTableroInicial, board)
        assert.deepEqual(tablerosObtenidos[1].snapshotTableroInicial, board2)
    })
})