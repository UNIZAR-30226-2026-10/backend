import Cosmetics from "../services/Cosmetics.ts"
import assert from "node:assert/strict"
import test, { describe, afterEach, before } from "node:test"
import prisma from "../prismaClient.js"
import { Tipo_Cosmetico } from "../generated/prisma/client.js"
import { cosmeticosPorDefecto } from "../poblation/CrearDatosBase.js"

const runId = Date.now()
const TEST_USER_EMAIL = `user_${runId}@gmail.com`
const TEST_COSMETIC_NAME = `Ficha de dragon ${runId}`
const TEST_COSMETIC_DESC = "Es una ficha de dragon"

before(async () => {
    try {
        await cosmeticosPorDefecto()
    } catch (error) {
        console.error("Error al crear los cosméticos por defecto:", error)
    }
})

describe("Cosmetics Test", () => {
    afterEach(async () => {
        try {
            await prisma.usuario.delete({ where: { email: TEST_USER_EMAIL } })
        } catch (e) {}
        try {
            await prisma.cosmeticos.delete({ where: { nombre: TEST_COSMETIC_NAME } })
        } catch (e) {}
    })

    test("Crear cosmético", async () => {
        const cosmetic = await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })
        assert.equal(cosmetic.nombre, TEST_COSMETIC_NAME)
        assert.equal(cosmetic.tipo, Tipo_Cosmetico.Skin_Ficha)
        assert.equal(cosmetic.precio, 300)
    })

    test("Crear cosmético ya existente", async () => {
        await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })

        await assert.rejects(
            Cosmetics.createCosmetic({
                nombre: TEST_COSMETIC_NAME,
                tipo: Tipo_Cosmetico.Skin_Ficha,
                precio: 300,
                descripcion: TEST_COSMETIC_DESC
            }),
            /Error al crear el cosmético/
        )
    })

    test("Actualizar cosmético", async () => {
        await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })
        const updated = await Cosmetics.updateCosmetic(TEST_COSMETIC_NAME, { precio: 500 })
        assert.equal(updated.precio, 500)
    })

    test("Actualizar cosmético no existente", async () => {
        await assert.rejects(
            Cosmetics.updateCosmetic("No existe", { precio: 500 }),
            /Error al actualizar el cosmético/
        )
    })

    test("Eliminar cosmético", async () => {
        await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })
        const deleted = await Cosmetics.deleteCosmetic(TEST_COSMETIC_NAME)
        assert.equal(deleted.message, "Cosmético eliminado correctamente")
    })

    test("Eliminar cosmético no existente", async () => {
        await assert.rejects(
            Cosmetics.deleteCosmetic("No existe"),
            /Error al eliminar el cosmético/
        )
    })

    test("Obtener cosméticos equipados por un usuario", async () => {
        await prisma.usuario.create({
            data: { email: TEST_USER_EMAIL, nombre: "user", passwordHash: "123" }
        })
        const equipped = await Cosmetics.getEquippedCosmetics(TEST_USER_EMAIL)
        assert.deepStrictEqual(equipped, {
            iconoActual: {
                nombre: "icono_default",
                tipo: Tipo_Cosmetico.Icono,
                precio: 0,
                descripcion: "Icono por defecto"
            },
            fichaActual: {
                nombre: "ficha_default",
                tipo: Tipo_Cosmetico.Skin_Ficha,
                precio: 0,
                descripcion: "Ficha por defecto"
            },
            serpienteActual: {
                nombre: "serpiente_default",
                tipo: Tipo_Cosmetico.Skin_Serpiente,
                precio: 0,
                descripcion: "Serpiente por defecto"
            },
            escaleraActual: {
                nombre: "escalera_default",
                tipo: Tipo_Cosmetico.Skin_Escalera,
                precio: 0,
                descripcion: "Escalera por defecto"
            }
        })
    })

    test("Obtener cosméticos equipados por un usuario que no existe", async () => {
        await assert.rejects(
            Cosmetics.getEquippedCosmetics("noexiste@gmail.com"),
            /Error al obtener los cosméticos equipados/
        )
    })

    test("Obtener los cosméticos disponibles en el usuario por tipo", async () => {
        await prisma.usuario.create({
            data: { email: TEST_USER_EMAIL, nombre: "user", passwordHash: "123" }
        })
        const cosmetics = await Cosmetics.getCosmeticsByTypeAndUser(Tipo_Cosmetico.Skin_Ficha, TEST_USER_EMAIL)
        assert.deepStrictEqual(cosmetics.cosmeticos, [])
    })

    test("Obtener un cosmético mediante su nombre", async () => {
        await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })
        const cosmetic = await Cosmetics.getCosmeticByName(TEST_COSMETIC_NAME)
        assert.equal(cosmetic.nombre, TEST_COSMETIC_NAME)
    })

    test("Obtener un cosmético que no existe mediante su nombre", async () => {
        await assert.rejects(
            Cosmetics.getCosmeticByName("No existe"),
            /Error al obtener el cosmético por nombre/
        )
    })

    test("Obtener cosméticos para mostrar en la tienda", async () => {
        await prisma.usuario.create({
            data: { email: TEST_USER_EMAIL, nombre: "user", passwordHash: "123", SEP: 1000 }
        })
        await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })
        await Cosmetics.purchaseCosmetic(TEST_USER_EMAIL, TEST_COSMETIC_NAME)

        const cosmetics = await Cosmetics.getStoreCosmetics(TEST_USER_EMAIL)
        const ficha = cosmetics.find((c) => c.nomCosmetico === TEST_COSMETIC_NAME)
        assert.deepStrictEqual(ficha, {
            nomCosmetico: TEST_COSMETIC_NAME,
            precio: 300,
            desc: TEST_COSMETIC_DESC,
            loTiene: true
        })
    })

    test("Comprar cosmético", async () => {
        await prisma.usuario.create({
            data: { email: TEST_USER_EMAIL, nombre: "user", passwordHash: "123", SEP: 1000 }
        })
        await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })
        const purchase = await Cosmetics.purchaseCosmetic(TEST_USER_EMAIL, TEST_COSMETIC_NAME)
        assert.equal(purchase.message, "Compra realizada con éxito")
    })

    test("Comprar cosmético sin suficiente SEP", async () => {
        await prisma.usuario.create({
            data: { email: TEST_USER_EMAIL, nombre: "user", passwordHash: "123", SEP: 100 }
        })
        await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })
        await assert.rejects(
            Cosmetics.purchaseCosmetic(TEST_USER_EMAIL, TEST_COSMETIC_NAME),
            /No tienes suficientes SEP para comprar este cosmético/
        )
    })

    test("Comprar cosmético que no existe", async () => {
        await prisma.usuario.create({
            data: { email: TEST_USER_EMAIL, nombre: "user", passwordHash: "123", SEP: 1000 }
        })
        await assert.rejects(
            Cosmetics.purchaseCosmetic(TEST_USER_EMAIL, "No existe"),
            /Cosmético no encontrado/
        )
    })

    test("Comprar cosmético ya comprado", async () => {
        await prisma.usuario.create({
            data: { email: TEST_USER_EMAIL, nombre: "user", passwordHash: "123", SEP: 1000 }
        })
        await Cosmetics.createCosmetic({
            nombre: TEST_COSMETIC_NAME,
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: TEST_COSMETIC_DESC
        })
        await Cosmetics.purchaseCosmetic(TEST_USER_EMAIL, TEST_COSMETIC_NAME)
        await assert.rejects(
            Cosmetics.purchaseCosmetic(TEST_USER_EMAIL, TEST_COSMETIC_NAME),
            /Ya tienes este cosmético/
        )
    })
})
