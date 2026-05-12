import { Logros, Carta, Tipo_Logro } from "../generated/prisma/client.js";
import prisma from "../prismaClient.js";
import { LogrosReturnType } from "./ReturnTypes.js";

export async function createAchievement(data: { nombre: string, descripcion: string, tipo: Tipo_Logro, carta?: Carta, requisito: number, recompensaMonetaria?: number }): Promise<LogrosReturnType> {
    try {
        const achievement = await prisma.logros.create({
            data : {
                nombre: data.nombre,
                descripcion: data.descripcion,
                tipo: data.tipo,
                carta: data.carta ? { connect: { nombre: data.carta.nombre } } : undefined,
                requisito: data.requisito,
                recompensaMonetaria: data.recompensaMonetaria
            },
            include: {
                carta: true,
                usuarios: true
            }
        });
        return achievement;
    } catch (error) {
        console.error("Error al crear el logro:", error);
        throw new Error("Error al crear el logro");
    }
}

export async function getAchievementById(nombre: string): Promise<LogrosReturnType | null> {
    try {
        const achievement = await prisma.logros.findUnique({
            where: { nombre },
            include: {
                carta: true,
                usuarios: true
            }
        });
        return achievement;
    } catch (error) {
        console.error("Error al obtener el logro por ID:", error);
        throw new Error("Error al obtener el logro por ID");
    }
}

export async function getAllAchievements(): Promise<LogrosReturnType[]> {
    try {
        const achievements = await prisma.logros.findMany({
            include: {
                carta: true,
                usuarios: true
            }
        });
        return achievements;
    } catch (error) {
        console.error("Error al obtener todos los logros:", error);
        throw new Error("Error al obtener todos los logros");
    }
}

export async function updateAchievement(nombre: string, data: { descripcion?: string, tipo?: Tipo_Logro, carta?: Carta, requisito?: number, recompensaMonetaria?: number }): Promise<LogrosReturnType> {
    try {
        const achievement = await prisma.logros.update({
            where: { nombre },
            data: {
                descripcion: data.descripcion,
                tipo: data.tipo,
                carta: data.carta ? { connect: { nombre: data.carta.nombre } } : undefined,
                requisito: data.requisito,
                recompensaMonetaria: data.recompensaMonetaria
            },
            include: {
                carta: true,
                usuarios: true
            }
        });
        return achievement;
    } catch (error) {
        console.error("Error al actualizar el logro:", error);
        throw new Error("Error al actualizar el logro");
    }
}

export async function deleteAchievement(nombre: string): Promise<{ message: string }> {
    try {
        await prisma.logros.delete({
            where: { nombre }
        });
        return { message: "Logro eliminado exitosamente" };
    } catch (error) {
        console.error("Error al eliminar el logro:", error);
        throw new Error("Error al eliminar el logro");
    }
}

export async function checkAchievementsForCompletion(userEmail: string): Promise<Logros[]> {
    try {
        return await prisma.$transaction(async (tx) => {
            // Excluir logros que ya estén completados por el usuario (usuarios con ese email)
            const incompleteAchievements = await tx.logros.findMany({
                where: {
                    usuarios: {
                        none: {
                            email: userEmail
                        }
                    }
                },
                include: {
                    carta: true,
                    usuarios: true
                }
            });
            
            const statsUser = await tx.usuario.findUnique({
                where: { email: userEmail },
                select: {
                    SEP: true,
                    victorias: true,
                    partidasJugadas: true,
                    derrotas: true,
                    logros: true,
                    cartas: true,
                    cartasJugadas: true
                }
            });

            if (!statsUser) {
                throw new Error("Usuario no encontrado");
            }

            let arrCompleted : Logros[] = [];

            for (const achievement of incompleteAchievements) {
                let isCompleted = false;
                switch (achievement.tipo) {
                    case Tipo_Logro.SEP:
                        isCompleted = statsUser.SEP >= achievement.requisito;
                        break;
                    case Tipo_Logro.Victorias:
                        isCompleted = statsUser.victorias >= achievement.requisito;
                        break;
                    case Tipo_Logro.Partidas:
                        isCompleted = statsUser.partidasJugadas >= achievement.requisito;
                        break;
                    case Tipo_Logro.Derrotas:
                        isCompleted = statsUser.derrotas >= achievement.requisito;
                        break;
                    case Tipo_Logro.LogrosDesbloqueados:
                        isCompleted = statsUser.logros.length >= achievement.requisito;
                        break;
                    case Tipo_Logro.CartasColeccionadas:
                        isCompleted = statsUser.cartas.length >= achievement.requisito;
                        break;
                    case Tipo_Logro.CartasJugadas:
                        isCompleted = statsUser.cartasJugadas >= achievement.requisito;
                        break;
                }

                if (isCompleted) {
                    arrCompleted.push(achievement);
                    await tx.usuario.update({
                        where: { email: userEmail },
                        data: {
                            logros: {
                                connect: { nombre: achievement.nombre }
                            }
                        }
                    });
                    if(achievement.cartaID) {
                        await tx.usuario.update({
                            where: { email: userEmail },
                            data: {
                                cartas: {
                                    connect: { nombre: achievement.cartaID }
                                }
                            }
                        });
                    }
                    if(achievement.recompensaMonetaria) {
                        await tx.usuario.update({
                            where: { email: userEmail },
                            data: {
                                SEP: {
                                    increment: achievement.recompensaMonetaria
                                }
                            }
                        });
                    }
                }
            }

            return arrCompleted;
        });
    } catch (error) {
        console.error("Error al verificar los logros para finalización:", error);
        throw new Error("Error al verificar los logros para finalización");
    }
}

export async function giveAchievementsRewards(userEmail: string, achievements: Logros[]): Promise<void> {
    try {
        for (const achievement of achievements) {
            if (achievement.cartaID) {
                await prisma.usuario.update({
                    where: { email: userEmail },
                    data: {
                        cartas: {
                            connect: { nombre: achievement.cartaID }
                        }
                    }
                });
            }

            if (achievement.recompensaMonetaria) {
                await prisma.usuario.update({
                    where: { email: userEmail },
                    data: {
                        SEP: {
                            increment: achievement.recompensaMonetaria
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error al otorgar recompensas por logros:", error);
        throw new Error("Error al otorgar recompensas por logros");
    }
}

export async function giveAchievementReward(userEmail: string, achievement: Logros): Promise<void> {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.usuario.update({
                where: { email: userEmail },
                data: {
                    logros: {
                        connect: { nombre: achievement.nombre }
                    }
                }
            });

            if (achievement.cartaID) {
                await tx.usuario.update({
                    where: { email: userEmail },
                    data: {
                        cartas: {
                            connect: { nombre: achievement.cartaID }
                        }
                    }
                });
            }

            if (achievement.recompensaMonetaria) {
                await tx.usuario.update({
                    where: { email: userEmail },
                    data: {
                        SEP: {
                            increment: achievement.recompensaMonetaria
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error al otorgar recompensa por logro:", error);
        throw new Error("Error al otorgar recompensa por logro");
    }
}

export default {
    createAchievement,
    getAchievementById,
    getAllAchievements,
    updateAchievement,
    deleteAchievement,
    checkAchievementsForCompletion,
    giveAchievementsRewards,
    giveAchievementReward
};