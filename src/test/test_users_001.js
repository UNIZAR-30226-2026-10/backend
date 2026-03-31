import test, { after, before, describe } from "node:test"
import assert from "node:assert/strict"
import usersBL from "../services/User.ts"
import prisma from "../prismaClient.ts"
import { cosmeticosPorDefecto } from "./crearDatosBase.js"
import { Tipo_Cosmetico } from "../generated/prisma/enums.ts"

const runId = Date.now()
const testEmail = `test_${runId}@ejemplo.com`

after(async () => {
  await prisma.usuario.deleteMany({
    where: {
      email: {
        in: [
          testEmail,
          `badname_${runId}@ejemplo.com`,
          `weakpass_${runId}@ejemplo.com`
        ]
      }
    }
  })
})

before(async () => {
  try {
    await cosmeticosPorDefecto()
  } catch (error) {
    console.error("Error al crear los cosméticos por defecto:", error)
  }
})

describe("Tests de User Service", { concurrency: false }, () => {
  test("Conexión a la DB", async () => {
    await prisma.$queryRaw`SELECT 1`
    assert.ok(true)
  })

  test("Crear un usuario", async () => {
    const user = await usersBL.createUser({
      email: testEmail,
      password: "Password123!",
      nombre: "Test User"
    })

    assert.equal(user?.email, testEmail)
  })

  test("Obtener usuario por email", async () => {
    const user = await usersBL.getUserByEmail(testEmail)
    assert.equal(user?.email, testEmail)
  })

  test("Obtener usuario por email que no existe", async () => {
    const user = await usersBL.getUserByEmail("noexisto@ejemplo.com")
    assert.equal(user, null)
  })

  test("Darle 500 SEP a un usuario", async () => {
    const user = await usersBL.modifyUserByEmail(testEmail, { SEP: 500 })
    assert.equal(user?.SEP, 500)
  })

  test("Delete usuario", async () => {
    const deletedUser = await usersBL.deleteUserByEmail(testEmail)
    assert.equal(deletedUser?.message, "Usuario eliminado correctamente")

    const user = await usersBL.getUserByEmail(testEmail)
    assert.equal(user, null)
  })

  test("Nombre de usuario ilegal", async () => {
    const result = await usersBL.createUser({
      email: `maleducado${runId}@ejemplo.com`,
      password: "Password123!",
      nombre: "usuario extrema derecha "
    })

    assert.equal(result?.error, "El nombre contiene palabras inapropiadas")
  })

  test("Contraseña insegura", async () => {
    const result = await usersBL.createUser({
      email: `EZpass${runId}@ejemplo.com`,
      password: "123",
      nombre: "Test User"
    })

    assert.match(result?.error || "", /La contraseña debe tener al menos 8 caracteres/)
  })

  test("Ñ y acentos en el email", async () => {
    const result = await usersBL.createUser({
      email: `ñandú${runId}@ejemplo.com`,
      password: "Password123!",
      nombre: "Test User"
    })

    assert.equal(result?.error, "Email no válido o ya registrado")
  })

  test("Email ya registrado", async () => {
    await usersBL.createUser({
      email: testEmail,
      password: "Password123!",
      nombre: "Test User"
    })

    const result = await usersBL.createUser({
      email: testEmail,
      password: "Password123!",
      nombre: "Test User 2"
    })

    assert.equal(result?.error, "Email no válido o ya registrado")
  })

  test("Ñ y acentos en el nombre", async () => {
    const result = await usersBL.createUser({
      email: `test2_${runId}@ejemplo.com`,
      password: "Password123!",
      nombre: "ñandú"
    })

    assert.equal(result?.nombre, "ñandú")
  })

  test("Modificar el cosmetico de un usuario", async () => {
    const user = await usersBL.createUser({
      email: `test3_${runId}@ejemplo.com`,
      password: "Password123!",
      nombre: "Test User 3"
    })

    const cosmetic = await prisma.cosmeticos.create({
      data: {
        nombre: `Ficha de dragón ${runId}`,
        tipo: "Skin_Ficha",
        precio: 300,
        descripcion: "Es una ficha de dragón"
      }
    })

    const updatedUser = await usersBL.updateCosmeticOnUser(user?.email, { nombre: `Ficha de dragón ${runId}`, tipo: Tipo_Cosmetico.Skin_Ficha })
    assert.equal(updatedUser?.fichaActualField, `Ficha de dragón ${runId}`)
  })
})