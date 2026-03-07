import { Usuario } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import bcrypt from "bcrypt"
import { UsuarioReturnType } from "./ReturnTypes.js";

type RelacionConfig = {
    disconnect: (prisma: any, userEmail: string, relatedId: string) => Promise<any>
    connect: (prisma: any, userEmail: string, relatedId: string) => Promise<any>
}

const Relaciones : Record<string, RelacionConfig> = {

    "barajas": {
        // Baraja es entidad débil, se ELIMINA (no se desconecta)
        // porque usuarioEmail es parte de su clave primaria y no puede ser null
        disconnect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.baraja.deleteMany({
                where: { 
                    nombre: relatedId, 
                    usuarioEmail: userEmail 
                }
            })
        },
        connect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: {
                    barajas: {
                        connect: { nombre_usuarioEmail: { 
                            nombre: relatedId, usuarioEmail: userEmail } }
                    }
                }
            })
        }
    },

    "partidasGanadas": {
        disconnect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.partida.update({
                where: { ID: relatedId },
                data: {
                    ganadorEmail: null
                }
            })
        },
        connect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.partida.update({
                where: { ID: relatedId },
                data: {
                    ganadorEmail: userEmail
                }
            })
        }
    },

    "amigos": {
        disconnect: async (prisma:any, userEmail:string, relatedEmail:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: {
                    amigos: {
                        disconnect: { email: relatedEmail }
                    }
                }
            })
        },
        connect: async (prisma:any, userEmail:string, relatedEmail:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: {
                    amigos: {
                        connect: { email: relatedEmail }
                    }
                }
            })
        }
    },

    "cartas": {
        disconnect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: { 
                    cartas: {
                        disconnect: { nombre: relatedId }
                    }
                }
            })
        },
        connect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: {
                    cartas: {
                        connect: { nombre: relatedId }
                    }
                }
            })
        }
    },

    "cosmeticos": {
        disconnect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: { 
                    cosmeticos: {
                        disconnect: { nombre: relatedId }
                    }
                }
            })
        },
        connect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: {
                    cosmeticos: {
                        connect: { nombre: relatedId }
                    }
                }
            })
        }
    },

    "logros": {
        disconnect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: { 
                    logrosConseguidos: {
                        disconnect: { nombre: relatedId }
                    }
                }
            })
        },
        connect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: {
                    logrosConseguidos: {
                        connect: { nombre: relatedId }
                    }
                }
            })
        }

    },

    "partidas": {
        disconnect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: { 
                    partidasJugadas: {
                        disconnect: { ID: relatedId }
                    }
                }
            })
        },
        connect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: {
                    partidasJugadas: {
                        connect: { ID: relatedId }
                    }
                }
            })
        }
    }

}

export async function createUser(data: { email:string, password:string, nombre:string }) : Promise<UsuarioReturnType | { error: string }> {
    data.email = data.email.toLowerCase()
    // Verificar correctitud del email
    if(!await emailHelper(data.email)) return { error: "Email no válido o ya registrado" }

    // Verificar correctitud de la contraseña
    let passwordCheck = passwordHelper(data.password)
    if(passwordCheck && "error" in passwordCheck) return{ error: passwordCheck.error }

    // Verificar longitud del nombre
    if(data.nombre.length < 3) return { error: "El nombre debe tener al menos 3 caracteres" }

    if(data.nombre.length > 50) return { error: "El nombre no puede tener más de 50 caracteres" }

    let listaNombresProhibidos = [ "extrema derecha", "extremaizquierda", "extrema izquierda", "extremaderecha", "palabra-con-n"]
    
    for(let nombreProhibido of listaNombresProhibidos) {
        if(data.nombre.toLowerCase().includes(nombreProhibido)) return { error: "El nombre contiene palabras inapropiadas" }
    }

    // Hasheamos la contraseña

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    // Creamos el usuario
    try {
        const user = await prisma.usuario.create({
            data: {
                email: data.email,
                passwordHash: passwordHash,
                nombre: data.nombre
            },
            include: {
                amigos: true,
                cartas: true,
                cosmeticos: true,
                logros: true,
                barajas: true,
                partidas: true,
                partidasGanadas: true
            }
        })
        return user
    } catch (error) {
        console.error("Error al crear el usuario:", error)
        return { error: "Error al crear el usuario" }
    }
}

export async function getUserByEmail(email:string) : Promise<UsuarioReturnType | null> {
    try {
        const user = await prisma.usuario.findUnique({
            where: { email },
            include: {
                amigos: true,
                cartas: true,
                cosmeticos: true,
                logros: true,
                barajas: true,
                partidas: true,
                partidasGanadas: true
            }
        })
        return user
    } catch (error) {
        console.error("Error al obtener el usuario:", error)
        return null
    }
}

export async function deleteUserByEmail(email:string) : Promise<{ message: string } | { error: string }> {
    try {
        await prisma.usuario.delete({
            where: { email }
        });
        return { message: "Usuario eliminado correctamente" }
    } catch (error) {
        console.error("Error al eliminar el usuario:", error)
        return { error: "Error al eliminar el usuario" }
    }
}

export async function modifyUserByEmail(email:string, data: { password?:string, SEP?:number, ELO?:number, 
    partidasJugadas?:number, victorias?:number, derrotas?:number, cartasJugadas?:number}) : Promise<UsuarioReturnType | { error: string }> {

    let updateData:any = {}

    if(data.password) {
        let passwordCheck = passwordHelper(data.password)
        if(passwordCheck && "error" in passwordCheck) return{ error: passwordCheck.error }
        const saltRounds = 10
        updateData.passwordHash = await bcrypt.hash(data.password, saltRounds)
    }

    for(let key in data) {
        if(key !== "password") {
            updateData[key] = (data as any)[key]
        }
    }

    try {
        const user = await prisma.usuario.update({
            where: { email },
            data: updateData,
            include: {
                amigos: true,
                cartas: true,
                cosmeticos: true,
                logros: true,
                barajas: true,
                partidas: true,
                partidasGanadas: true
            }
        })
        return user
    } catch (error) {
        console.error("Error al modificar el usuario:", error)
        return { error: "Error al modificar el usuario" }
    }

}

export async function getAllUsers() : Promise<UsuarioReturnType[] | { error: string }> {
    try {
        const users = await prisma.usuario.findMany({
            include: {
                amigos: true,
                cartas: true,
                cosmeticos: true,
                logros: true,
                barajas: true,
                partidas: true,
                partidasGanadas: true
            }
        }
        )
        return users
    } catch (error) {
        console.error("Error al obtener los usuarios:", error)
        return { error: "Error al obtener los usuarios" }
    }
}

export async function addAmigo(userEmail:string, amigoEmail:string) : Promise<{ message: string } | { error: string }> {
    try {
        const result = await Relaciones["amigos"].connect(prisma, userEmail, amigoEmail)
        if(result && "error" in result) return result
        const result2 = await Relaciones["amigos"].connect(prisma, amigoEmail, userEmail)
        if(result2 && "error" in result2) return result2
        return { message: "Amigo añadido correctamente" }
    } catch (error) {
        console.error("Error al añadir amigo:", error)
        return { error: "Error al añadir amigo" }
    }
}

export async function removeAmigo(userEmail:string, amigoEmail:string) : Promise<{ message: string } | { error: string }> {
    try {
        const result = await Relaciones["amigos"].disconnect(prisma, userEmail, amigoEmail)
        if(result && "error" in result) return result
        const result2 = await Relaciones["amigos"].disconnect(prisma, amigoEmail, userEmail)
        if(result2 && "error" in result2) return result2
        return { message: "Amigo eliminado correctamente" }
    } catch (error) {
        console.error("Error al eliminar amigo:", error)
        return { error: "Error al eliminar amigo" }
    }
}

export async function connectRelacion(userEmail:string, relatedId:string, relacion:string) : Promise<{ message: string } | { error: string }> {
    if(!(relacion in Relaciones)) return { error: "Relación no válida" }
    try {
        const result = await Relaciones[relacion].connect(prisma, userEmail, relatedId)
        if(result && "error" in result) return result
        return { message: "Relación conectada correctamente" }
    } catch (error) {
        console.error("Error al conectar relación:", error)
        return { error: "Error al conectar relación" }
    }
}

export async function disconnectRelacion(userEmail:string, relatedId:string, relacion:string) : Promise<{ message: string } | { error: string }> {
    if(!(relacion in Relaciones)) return { error: "Relación no válida" }
    try {
        const result = await Relaciones[relacion].disconnect(prisma, userEmail, relatedId)
        if(result && "error" in result) return result
        return { message: "Relación desconectada correctamente" }
    } catch (error) {
        console.error("Error al desconectar relación:", error)
        return { error: "Error al desconectar relación" }
    }
}

const emailHelper = async (email:string) => {
    // Sigue convenciones estandar de email, mas info en: https://stackoverflow.com/questions/2049502/what-characters-are-allowed-in-an-email-address
    email = email.toLowerCase()
    if(email.split("@")[1].split(".")[1].length > 63) return false
    if(email.length > 320) return false
    let regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
    if(!regex.test(email)) return false
    let encontrados :Usuario | null
    try {

        encontrados = await prisma.usuario.findUnique({
            where: { email }
        })

    } catch (error) {
        console.error("Error al verificar el email:", error)
        return false
    }

    if(encontrados) return false

    return true
}

const passwordHelper = (password:string) => {
    // Verificar longitud de la contraseña
    if(password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres" }

    if(password.length > 128) return { error: "La contraseña no puede tener más de 128 caracteres" }

    // Verificar complejidad de la contraseña

    let regexPasswordNums = /[0-9]/
    let regexPasswordUpper = /[A-Z]/
    let regexPasswordLower = /[a-z]/
    let regexPasswordSpecial = /[!@#$%^&*(),.?":{}|<>]/

    if(!regexPasswordNums.test(password)) return { error: "La contraseña debe contener al menos un número" }

    if(!regexPasswordUpper.test(password)) return { error: "La contraseña debe contener al menos una letra mayúscula" }

    if(!regexPasswordLower.test(password)) return { error: "La contraseña debe contener al menos una letra minúscula" }

    if(!regexPasswordSpecial.test(password)) return { error: "La contraseña debe contener al menos un carácter especial" }

}

export default {
    createUser,
    getUserByEmail,
    deleteUserByEmail,
    modifyUserByEmail,
    getAllUsers,
    addAmigo,
    removeAmigo,
    connectRelacion,
    disconnectRelacion
}