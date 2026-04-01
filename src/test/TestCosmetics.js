import Cosmetics from '../services/Cosmetics.js'
import assert from 'node:assert/strict'
import test, { describe, afterEach } from 'node:test'
import prisma from '../prismaClient.js'
import { Tipo_Cosmetico } from '../generated/prisma/client.js'
import { cosmeticosPorDefecto } from './CrearDatosBase.js'

try {
    cosmeticosPorDefecto()
} catch (error) {
    console.error("Error al crear los cosméticos por defecto:", error);
}

describe("Cosmetics Test", () => {
    afterEach(async () => {
        try {
            await prisma.usuario.delete({ where: { email: "user@gmail.com" } })
        } catch (e) {}
        try {
            await prisma.cosmeticos.delete({ where: { nombre: "Ficha de dragón" } })
        } catch (e) {}
    })
    test("Crear cosmético", async () => {
        const cosmetic = await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        assert.equal(cosmetic.nombre, "Ficha de dragón")
        assert.equal(cosmetic.tipo, Tipo_Cosmetico.Skin_Ficha)
        assert.equal(cosmetic.precio, 300)
    })

    test("Crear cosmético ya existente", async () => {
        await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        const result = await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        assert.equal(result.error, "Error al crear el cosmético")
    })

    test("Actualizar cosmético", async () => {
        await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        const updated = await Cosmetics.updateCosmetic("Ficha de dragón", { precio: 500 })
        assert.equal(updated.precio, 500)
    })

    test("Actualizar cosmético no existente", async () => {
        const result = await Cosmetics.updateCosmetic("No existe", { precio: 500 })
        assert.equal(result.error, "Error al actualizar el cosmético")
    })

    test("Eliminar cosmético", async () => {
        await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        const deleted = await Cosmetics.deleteCosmetic("Ficha de dragón")
        assert.equal(deleted.message, "Cosmético eliminado correctamente")
    })

    test("Eliminar cosmético no existente", async () => {
        const result = await Cosmetics.deleteCosmetic("No existe")
        assert.equal(result.error, "Error al eliminar el cosmético")
    })

    test("Obtener cosméticos equipados por un usuario", async () => {
        await prisma.usuario.create({
            data: { email: "user@gmail.com", nombre: "user", passwordHash: "123" }
        })
        const equipped = await Cosmetics.getEquippedCosmetics("user@gmail.com")
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
        const result = await Cosmetics.getEquippedCosmetics("noexiste@gmail.com")
        assert.equal(result.error, "Usuario no encontrado")
    })

    test("Obtener los cosméticos disponibles en el usuario por tipo", async () => {
        await prisma.usuario.create({
            data: { email: "user@gmail.com", nombre: "user", passwordHash: "123" }
        })
        const cosmetics = await Cosmetics.getCosmeticsByTypeAndUser(Tipo_Cosmetico.Skin_Ficha, "user@gmail.com")
        assert.deepStrictEqual(cosmetics.cosmeticos, [])
    })

    test("Obtener un cosmético mediante su nombre", async () => {
        await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        const cosmetic = await Cosmetics.getCosmeticByName("Ficha de dragón")
        assert.equal(cosmetic.nombre, "Ficha de dragón")
    })

    test("Obtener un cosmético que no existe mediante su nombre", async () => {
        const result = await Cosmetics.getCosmeticByName("No existe")
        assert.equal(result.error, "Cosmético no encontrado")
    })

    test("Obtener cosméticos para mostrar en la tienda", async () => {
        await prisma.usuario.create({
            data: { email: "user@gmail.com", nombre: "user", passwordHash: "123", SEP: 1000 }
        })
        await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        await Cosmetics.purchaseCosmetic("user@gmail.com", "Ficha de dragón")
        const cosmetics = await Cosmetics.getStoreCosmetics("user@gmail.com")
        const ficha = cosmetics.find(c => c.nomCosmetico === "Ficha de dragón");
        assert.deepStrictEqual(ficha, {
            nomCosmetico: "Ficha de dragón",
            precio: 300,
            desc: "Es una ficha de dragón",
            loTiene: true
    })
    })

    test("Comprar cosmético", async () => {
        await prisma.usuario.create({
            data: { email: "user@gmail.com", nombre: "user", passwordHash: "123", SEP: 1000 }
        })
        await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        const purchase = await Cosmetics.purchaseCosmetic("user@gmail.com", "Ficha de dragón")
        assert.equal(purchase.message, "Compra realizada con éxito")
    })

    test("Comprar cosmético sin suficiente SEP", async () => {
        await prisma.usuario.create({
            data: { email: "user@gmail.com", nombre: "user", passwordHash: "123", SEP: 100 }
        })
        await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        const result = await Cosmetics.purchaseCosmetic("user@gmail.com", "Ficha de dragón")
        assert.equal(result.error, "No tienes suficientes SEP para comprar este cosmético")
    })

    test("Comprar cosmético que no existe", async () => {
        await prisma.usuario.create({
            data: { email: "user@gmail.com", nombre: "user", passwordHash: "123", SEP: 1000 }
        })
        const result = await Cosmetics.purchaseCosmetic("user@gmail.com", "No existe") 
        assert.equal(result.error, "Cosmético no encontrado")
    })

    test("Comprar cosmético ya comprado", async () => {
        await prisma.usuario.create({
            data: { email: "user@gmail.com", nombre: "user", passwordHash: "123", SEP: 1000 }
        })
        await Cosmetics.createCosmetic({
            nombre: "Ficha de dragón",
            tipo: Tipo_Cosmetico.Skin_Ficha,
            precio: 300,
            descripcion: "Es una ficha de dragón"
        })
        await Cosmetics.purchaseCosmetic("user@gmail.com", "Ficha de dragón")
        const result = await Cosmetics.purchaseCosmetic("user@gmail.com", "Ficha de dragón")
        assert.equal(result.error, "Ya tienes este cosmético")
    })
})