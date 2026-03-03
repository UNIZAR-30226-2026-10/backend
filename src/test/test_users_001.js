import test, { after } from "node:test"
import assert from "node:assert/strict"
import usersBL from "../services/User.ts"
import prisma from "../prismaClient.ts"

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
  await prisma.$disconnect()
})

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

  assert.match(String(result), /La contraseña debe tener al menos 8 caracteres/)
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
