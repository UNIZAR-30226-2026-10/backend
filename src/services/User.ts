import { Tipo_Cosmetico, Usuario } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import bcrypt from "bcrypt"
import { UsuarioReturnType, AuthUserReturnType, CompleteUserReturnType } from "./ReturnTypes.js";
import Deck from "./Deck.js";
import { lobbyManager } from "../managers/lobbyManager.js";

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
                    logros: {
                        disconnect: { nombre: relatedId }
                    }
                }
            })
        },
        connect: async (prisma:any, userEmail:string, relatedId:string) => {
            await prisma.usuario.update({
                where: { email: userEmail },
                data: {
                    logros: {
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

export async function createUser(data: { email:string, password:string, nombre:string }) : Promise<UsuarioReturnType> {
    data.email = data.email.toLowerCase().trim()
    data.nombre = data.nombre.trim()
    // Verificar correctitud del email
    if(!await emailHelper(data.email)) throw new Error("Email no valido o ya registrado")

    // Verificar correctitud de la contraseña
    const passwordError = passwordHelper(data.password)
    if(passwordError) throw new Error(passwordError)

    // Verificar longitud del nombre
    if(data.nombre.length < 3) throw new Error("El nombre debe tener al menos 3 caracteres")

    if(data.nombre.length > 50) throw new Error("El nombre no puede tener mas de 50 caracteres")

    let listaNombresProhibidos = [ "extrema derecha", "extremaizquierda", "extrema izquierda", "extremaderecha", "palabra-con-n"]
    
    for(let nombreProhibido of listaNombresProhibidos) {
        if(data.nombre.toLowerCase().includes(nombreProhibido)) throw new Error("El nombre contiene palabras inapropiadas")
    }

    // Hasheamos la contraseña

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    // Creamos el usuario
    try {
        const user = await prisma.$transaction(async (tx) => {
            // 1. Crear usuario con sus cosméticos y cartas en una sola pasada usando "create"
            const newUser = await tx.usuario.create({
                data: {
                    email: data.email,
                    passwordHash: passwordHash,
                    nombre: data.nombre,
                    cosmeticos: {
                        connect: [
                            { nombre: "icono_default" },
                            { nombre: "ficha_default" },
                            { nombre: "serpiente_default" },
                            { nombre: "escalera_default" }
                        ]
                    },
                    cartas: {
                        connect: [
                            { nombre: "Exceso de medios" },
                            { nombre: "Moises" },
                            { nombre: "Dia de la marmota" },
                            { nombre: "Salto de longitud" },
                            { nombre: "Robo de identidad" },
                            { nombre: "Antidoto" },
                            { nombre: "Dado envenenado" },
                            { nombre: "Dado dorado" },
                            { nombre: "Parca" },
                            { nombre: "Cambiar de idea" },
                            { nombre: "Agujero de serpiente" },
                            { nombre: "Bolsillo roto" },
                            { nombre: "Compañerismo obligado" },
                            { nombre: "Coleccionista" },
                            { nombre: "Noqueo" }
                        ]
                    }
                },
                include: {
                    amigos: true,
                    cartas: true,
                    cosmeticos: true,
                    logros: true,
                    barajas: true,
                    partidas: true,
                    partidasGanadas: true,
                    iconoActual: true,
                    fichaActual: true,
                    serpienteActual: true,
                    escaleraActual: true
                }
            });

            // 2. Crear la baraja por defecto
            const cartasExistentes = newUser.cartas.filter(c => [
                "Exceso de medios", "Salto de longitud", "Dia de la marmota", "Antidoto",
                "Bolsillo roto", "Moises", "Robo de identidad", "Agujero de serpiente",
                "Coleccionista", "Noqueo"
            ].includes(c.nombre));

            const deck = await tx.baraja.create({
                data: {
                    nombre: "Baraja principante",
                    usuario: { connect: { email: newUser.email } },
                    barajaCartas: {
                        create: cartasExistentes.map(carta => ({
                            cartaNombre: carta.nombre
                        }))
                    }
                }
            });

            return newUser;
        });

        return user;
    } catch (error) {
        console.error("Error al crear el usuario:", error)
        throw new Error("Error al crear el usuario")
    }
}

export async function getUserByEmail(email:string) : Promise<CompleteUserReturnType | null> {
    email = email.toLowerCase().trim()
    try {
        const user = await prisma.usuario.findUnique({
            where: { email },
            include: {
                amigos: true,
                cartas: true,
                cosmeticos: true,
                logros: true,
                barajas: {
                    include: {
                        usadaEn: true,
                        barajaCartas: {
                            include: {
                                carta: true
                            }
                        }
                    }
                },
                partidas: true,
                partidasGanadas: true,
                iconoActual: true,
                fichaActual: true,
                serpienteActual: true,
                escaleraActual: true
            }
        })
        return user
    } catch (error) {
        console.error("Error al obtener el usuario:", error)
        throw new Error("Error al obtener el usuario")
    }
}

export async function getUserMatches(email:string) {
    try {
        const matches = await prisma.usuario.findUnique({
            where: { email },
            include: {
                partidas: {
                    where: {
                        ganadorEmail: null
                    },
                    select: {
                        ID: true,
                        fechaInicio: true,
                        fechaFin: true,
                        tableroInicialNombre: true,
                        partidaJugadores: {
                            select: {
                                nombre: true
                            }
                        }
                    }
                }
            }
        });
        return matches;
    } catch (error) {
        console.error("Error al obtener el usuario:", error)
        throw new Error("Error al obtener el usuario")
    }
}

export async function getUserByEmailBasic(email:string) {
    try {
        const user = await prisma.usuario.findUnique({
            where: { email }
        })
        return user
    } catch (error) {
        console.error("Error al obtener el usuario:", error)
        throw new Error("Error al obtener el usuario")
    }
}

export async function deleteUserByEmail(email:string) : Promise<{ message: string }> {
    try {
        await prisma.usuario.delete({
            where: { email }
        })
        return { message: "Usuario eliminado correctamente" }
    } catch (error) {
        console.error("Error al eliminar el usuario:", error)
        throw new Error("Error al eliminar el usuario")
    }
}

export async function deleteUserByEmailForApiUsage(email:string) : Promise<{ message: string }> {
    try {
        const partidas = await prisma.usuario.findMany({
            where: { email },
            include: {
                partidas: {
                    select: { ID: true },
                    where: { ganadorEmail: null }
                }
            }
        })

        if(partidas.length > 0) {
            throw new Error("Error al eliminar el usuario: El usuario tiene partidas activas")
        }

        await prisma.usuario.update({
            where: { email },
            data: { borrado: true }
        });
        return { message: "Usuario eliminado correctamente" }
    } catch (error) {
        console.error("Error al eliminar el usuario:", error)
        throw new Error("Error al eliminar el usuario")
    }
}

export async function modifyUserByEmail(email:string, data: { password?:string, SEP?:number, ELO?:number, 
    partidasJugadas?:number, victorias?:number, derrotas?:number, cartasJugadas?:number, nombre?:string }) : Promise<UsuarioReturnType> {

    let updateData:any = {}

    if(data.password) {
        const passwordError = passwordHelper(data.password)
        if(passwordError) throw new Error(passwordError)
        const saltRounds = 10
        updateData.passwordHash = await bcrypt.hash(data.password, saltRounds)
    }

    // Capturar el nombre anterior si va a cambiar
    let oldUsername: string | null = null
    if (data.nombre) {
        const userBefore = await getUserByEmailBasic(email)
        oldUsername = userBefore?.nombre || null
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
                partidasGanadas: true,
                iconoActual: true,
                fichaActual: true,
                serpienteActual: true,
                escaleraActual: true
            }
        })
        if (oldUsername && data.nombre && oldUsername !== data.nombre) {
            try {
                lobbyManager.updateUsername(oldUsername, data.nombre)
            } catch (error) {                
                console.error("Error al actualizar el nombre de usuario en el lobby manager:", error)
                throw new Error("Error al actualizar el nombre de usuario en el lobby manager")
            }
        }
        return user
    } catch (error) {
        console.error("Error al modificar el usuario:", error)
        throw new Error("Error al modificar el usuario")
    }

}

export async function getAllUsers() : Promise<UsuarioReturnType[]> {
    try {
        const users = await prisma.usuario.findMany({
            include: {
                amigos: true,
                cartas: true,
                cosmeticos: true,
                logros: true,
                barajas: true,
                partidas: true,
                partidasGanadas: true,
                iconoActual: true,
                fichaActual: true,
                serpienteActual: true,
                escaleraActual: true
            }
        }
        )
        return users
    } catch (error) {
        console.error("Error al obtener los usuarios:", error)
        throw new Error("Error al obtener los usuarios")
    }
}

export async function getAmigos(userEmail:string) {
    try {
        const user = await prisma.usuario.findUnique({
            where: { email: userEmail },
            include: {
                amigos: {
                    select: {
                        nombre: true,
                        iconoActual: {
                            select: {
                                nombre: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            throw new Error("Usuario no encontrado");
        }
        return user.amigos.map((amigo: any) => ({ nombre: amigo.nombre, icono: amigo.iconoActual?.nombre }));
    } catch (error) {
        console.error("Error al obtener amigos:", error);
        throw new Error("Error al obtener amigos");
    }
}

export async function addAmigo(userEmail:string, amigoUsername:string) : Promise<{ message: string }> {
    try {
        const amigo = await prisma.usuario.findUnique({
            where: { nombre: amigoUsername }
        });

        if (!amigo) {
            throw new Error("Amigo no encontrado");
        }

        const amigoEmail = amigo.email;

        await Relaciones["amigos"].connect(prisma, userEmail, amigoEmail)
        await Relaciones["amigos"].connect(prisma, amigoEmail, userEmail)
        return { message: "Amigo añadido correctamente" }
    } catch (error) {
        console.error("Error al añadir amigo:", error)
        throw new Error("Error al añadir amigo")
    }
}

export async function removeAmigo(userEmail:string, amigoUsername:string) : Promise<{ message: string }> {
    try {
        const amigo = await prisma.usuario.findUnique({
            where: { nombre: amigoUsername }
        });

        if (!amigo) {
            throw new Error("Amigo no encontrado");
        }

        const amigoEmail = amigo.email;

        await Relaciones["amigos"].disconnect(prisma, userEmail, amigoEmail)
        await Relaciones["amigos"].disconnect(prisma, amigoEmail, userEmail)
        return { message: "Amigo eliminado correctamente" }
    } catch (error) {
        console.error("Error al eliminar amigo:", error)
        throw new Error("Error al eliminar amigo")
    }
}

export async function connectRelacion(userEmail:string, relatedId:string, relacion:string) : Promise<{ message: string }> {
    if(!(relacion in Relaciones)) throw new Error("Relacion no valida")
    try {
        await Relaciones[relacion].connect(prisma, userEmail, relatedId)
        return { message: "Relación conectada correctamente" }
    } catch (error) {
        console.error("Error al conectar relación:", error)
        throw new Error("Error al conectar relacion")
    }
}

export async function disconnectRelacion(userEmail:string, relatedId:string, relacion:string) : Promise<{ message: string }> {
    if(!(relacion in Relaciones)) throw new Error("Relacion no valida")
    try {
        await Relaciones[relacion].disconnect(prisma, userEmail, relatedId)
        return { message: "Relación desconectada correctamente" }
    } catch (error) {
        console.error("Error al desconectar relación:", error)
        throw new Error("Error al desconectar relacion")
    }
}

export async function updateCosmeticOnUser(email: string, data: { tipo: Tipo_Cosmetico, nombre: string }): Promise<UsuarioReturnType> {
    try {
        let updateData:any = {}
        let updateLobbyIcon = false
        switch (data.tipo) {
            case Tipo_Cosmetico.Icono:
                updateData.iconoActual = { connect: { nombre: data.nombre } }
                updateLobbyIcon = true
                break
            case Tipo_Cosmetico.Skin_Ficha:
                updateData.fichaActual = { connect: { nombre: data.nombre } }
                break
            case Tipo_Cosmetico.Skin_Serpiente:
                updateData.serpienteActual = { connect: { nombre: data.nombre } }
                break
            case Tipo_Cosmetico.Skin_Escalera:
                updateData.escaleraActual = { connect: { nombre: data.nombre } }
                break
        }

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
                        partidasGanadas: true,
                        iconoActual: true,
                        fichaActual: true,
                        serpienteActual: true,
                        escaleraActual: true,
                    }
                })

        if (updateLobbyIcon) {
            try {
                lobbyManager.updateIcon(user.nombre, user.iconoActual?.nombre)
            } catch (error) {
                console.error("Error al actualizar el icono de usuario en el lobby manager:", error)
            }
        }

        return user
    } catch (error) {
        console.error("Error al actualizar el cosmético equipado:", error)
        throw new Error("Error al actualizar el cosmetico equipado")
    }
}

export async function authenticateUser(email:string, password:string) : Promise<AuthUserReturnType> {
    email = email.toLowerCase().trim()
    try {
        const user = await prisma.usuario.findUnique({
            where: { email },
            select: { passwordHash: true, nombre: true, email: true }
        })
        if(!user) return { email, nombre: "", authenticated: false }
        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        return { ...user, authenticated: passwordMatch }
    } catch (error) {
        console.error("Error al autenticar el usuario:", error)
        throw new Error("Error al autenticar el usuario")
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
        throw new Error("Error al verificar el email")
    }

    if(encontrados) return false

    return true
}

const passwordHelper = (password:string): string | null => {
    // Verificar longitud de la contraseña
    if(password.length < 8) return "La contraseña debe tener al menos 8 caracteres"

    if(password.length > 128) return "La contraseña no puede tener más de 128 caracteres"

    // Verificar complejidad de la contraseña

    let regexPasswordNums = /[0-9]/
    let regexPasswordUpper = /[A-Z]/
    let regexPasswordLower = /[a-z]/
    let regexPasswordSpecial = /[!@#$%^&*(),.?":{}|<>]/

    if(!regexPasswordNums.test(password)) return "La contraseña debe contener al menos un número"

    if(!regexPasswordUpper.test(password)) return "La contraseña debe contener al menos una letra mayúscula"

    if(!regexPasswordLower.test(password)) return "La contraseña debe contener al menos una letra minúscula"

    if(!regexPasswordSpecial.test(password)) return `La contraseña debe contener al menos un carácter especial de los siguientes: ! @ # $ % ^ & * ( ) , . ? \ " : { } | < > `

    return null

}

export async function getUserByName(nombre:string) : Promise<UsuarioReturnType | null> {
    try {
        const user = await prisma.usuario.findUnique({
            where: { nombre: nombre },
            include: {
                amigos: true,
                cartas: true,
                cosmeticos: true,
                logros: true,
                barajas: true,
                partidas: true,
                partidasGanadas: true,
                iconoActual: true,
                fichaActual: true,
                serpienteActual: true,
                escaleraActual: true
            }
        })
        return user
    } catch (error) {
        console.error("Error al obtener el usuario:", error)
        throw new Error("Error al obtener el usuario")
    }
}

export async function getPartidasNoTerminadas(email:string) {
    try {
        const partidas = await prisma.usuario.findUnique({
            where: { email },
            include: {
                partidas: {
                    where: {
                        ganadorEmail: null
                    },
                    select: {
                        ID: true,
                        fechaInicio: true,
                        fechaFin: true,
                        tableroInicialNombre: true,
                        partidaJugadores: {
                            select: {
                                nombre: true
                            }
                        }
                    }
                }
            }
        });
        return partidas?.partidas || [];
    } catch (error) {
        console.error("Error al obtener las partidas no terminadas:", error)
        throw new Error("Error al obtener las partidas no terminadas")
    }
}

export default {
    createUser,
    getUserByEmail,
    getUserByEmailBasic,
    getUserMatches,
    deleteUserByEmail,
    deleteUserByEmailForApiUsage,
    modifyUserByEmail,
    getAllUsers,
    getAmigos,
    addAmigo,
    removeAmigo,
    connectRelacion,
    disconnectRelacion,
    updateCosmeticOnUser,
    authenticateUser,
    getPartidasNoTerminadas,
    getUserByName
}